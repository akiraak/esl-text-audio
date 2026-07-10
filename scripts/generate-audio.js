require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const matter = require('gray-matter');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash-preview-tts';

// 読み上げキャラ。~/claude-code-manager（ai-monitor/voice-persona.json）の2キャラの声設定を踏襲。
// manabi は同プロジェクトの生徒キャラ「なるこ」の旧名（本プロジェクトでは TODO の表記に合わせ manabi とする）。
// tone はレベル別スタイル（速度・明瞭さ）の後ろに連結する声色の指示
const CHARACTERS = {
  chobi: { voice: 'Leda', tone: 'Speak in a warm, cheerful, always-smiling tone.' },
  manabi: { voice: 'Aoede', tone: 'Speak in a bright, energetic voice full of curiosity.' },
};

// キャラ未指定時は2キャラをランダムに使い分ける
function randomCharacterName() {
  const names = Object.keys(CHARACTERS);
  return names[Math.floor(Math.random() * names.length)];
}
const FALLBACK_SAMPLE_RATE = 24000; // Gemini TTS は s16le/mono/24kHz を返す。実際のレートは応答の mimeType から取る
const MAX_SEGMENT_CHARS = 4000; // これを超える段落のみ文境界でさらに分割する
const MAX_RETRIES = 5;

// セグメント結合時に注入する間（無音）の長さ（秒）。ESLリスニング向けにやや長めに取る
const PAUSES = {
  afterTitle: 1.2, // タイトル → 本文
  beforeHeading: 1.6, // セクションの切れ目（見出しの前）
  afterHeading: 1.0, // 見出し → セクション本文
  betweenParagraphs: 0.9,
  betweenListItems: 0.6,
  continuation: 0.5, // 長すぎて分割した段落の続き（文間相当の短い間）
};

// レベル（CEFR）に応じた読み上げスタイル指示（速度・明瞭さ）。キャラの声色（tone）と連結してテキスト冒頭に付与する
const STYLE_BY_LEVEL = {
  A1: 'Read aloud very slowly, clearly, and gently, like a narrator for absolute beginner English learners. Pause briefly between sentences.',
  A2: 'Read aloud very slowly and clearly, like a narrator for beginner English learners. Pause briefly between sentences.',
  B1: 'Read aloud slowly and clearly, like a narrator for intermediate English learners.',
  B2: 'Read aloud at a calm, slightly slow pace, clearly, like a narrator for upper-intermediate English learners.',
  C1: 'Read aloud at a natural, calm pace with clear articulation, like an audiobook narrator.',
  C2: 'Read aloud at a natural pace with clear articulation, like an audiobook narrator.',
};
const DEFAULT_STYLE = STYLE_BY_LEVEL.B1;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 読み上げ用にインラインMarkdown記法をプレーンテキスト化する
function stripInlineMarkdown(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // 画像 → altテキスト
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // リンク → ラベル
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/(^|\s)_([^_]+)_(?=\s|$|[.,!?])/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

// frontmatter除去済みの本文Markdownを、読み上げ・間の注入の単位となるセグメント列に分解する。
// type: 'title'（先頭の # 見出し）| 'heading'（## 以降）| 'paragraph' | 'list-item'
function segmentArticle(markdown) {
  const segments = [];
  let seenTitle = false;
  for (const block of markdown.split(/\n\s*\n/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) continue; // 水平線は間としてのみ機能させる（段落間ポーズで表現）

    const heading = trimmed.match(/^(#{1,6})\s+([\s\S]*)$/);
    if (heading) {
      const text = stripInlineMarkdown(heading[2]);
      if (!text) continue;
      const isTitle = heading[1].length === 1 && !seenTitle;
      if (isTitle) seenTitle = true;
      segments.push({ type: isTitle ? 'title' : 'heading', text });
      continue;
    }

    const lines = trimmed.split('\n');
    if (/^\s*([-*+]|\d+[.)])\s+/.test(lines[0])) {
      // リストブロック: 1項目=1セグメント（継続行は直前の項目に連結）
      const items = [];
      for (const line of lines) {
        const m = line.match(/^\s*([-*+]|\d+[.)])\s+(.*)$/);
        if (m) items.push(m[2]);
        else if (items.length) items[items.length - 1] += ` ${line.trim()}`;
      }
      for (const item of items) {
        const text = stripInlineMarkdown(item);
        if (text) segments.push({ type: 'list-item', text });
      }
      continue;
    }

    const text = stripInlineMarkdown(trimmed.replace(/^>\s?/gm, ''));
    if (text) segments.push({ type: 'paragraph', text });
  }
  return segments;
}

// TTSの入力上限対策: 長すぎるセグメントのみ文境界で分割する。分割された後続には continued を立て、
// 結合時に段落間ではなく文間相当の短い間を使う
function splitLongSegments(segments) {
  const result = [];
  for (const seg of segments) {
    if (seg.text.length <= MAX_SEGMENT_CHARS) {
      result.push(seg);
      continue;
    }
    const sentences = seg.text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [seg.text];
    let current = '';
    const parts = [];
    for (const sentence of sentences) {
      if (current && current.length + sentence.length > MAX_SEGMENT_CHARS) {
        parts.push(current.trim());
        current = '';
      }
      current += sentence;
    }
    if (current.trim()) parts.push(current.trim());
    parts.forEach((text, i) => result.push({ ...seg, text, continued: i > 0 }));
  }
  return result;
}

// 直前・直後のセグメント種別から、注入する間の長さを決める
function pauseSecondsBetween(prev, next) {
  if (next.continued) return PAUSES.continuation;
  if (next.type === 'heading') return PAUSES.beforeHeading;
  if (prev.type === 'title') return PAUSES.afterTitle;
  if (prev.type === 'heading') return PAUSES.afterHeading;
  if (prev.type === 'list-item' && next.type === 'list-item') return PAUSES.betweenListItems;
  return PAUSES.betweenParagraphs;
}

// オフライン動作確認用（GEMINI_TTS_FAKE=1）: テキスト長に比例した長さのトーンPCMを返す
function fakePcm(text) {
  const seconds = Math.min(3, 0.3 + text.length * 0.01);
  const samples = Math.round(seconds * FALLBACK_SAMPLE_RATE);
  const pcm = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    pcm.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 220 * i) / FALLBACK_SAMPLE_RATE) * 8000), i * 2);
  }
  return { pcm, sampleRate: FALLBACK_SAMPLE_RATE };
}

async function ttsSegment(text, { apiKey, model, voice, style }) {
  if (process.env.GEMINI_TTS_FAKE === '1') return fakePcm(text);

  const body = {
    contents: [{ parts: [{ text: `${style}\n\n${text}` }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  };

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      const part =
        json.candidates &&
        json.candidates[0] &&
        json.candidates[0].content &&
        json.candidates[0].content.parts &&
        json.candidates[0].content.parts.find((p) => p.inlineData && p.inlineData.data);
      if (!part) {
        throw new Error(`API response contained no audio data: ${JSON.stringify(json).slice(0, 500)}`);
      }
      const rateMatch = String(part.inlineData.mimeType || '').match(/rate=(\d+)/);
      const pcm = Buffer.from(part.inlineData.data, 'base64');
      return {
        pcm: pcm.length % 2 === 0 ? pcm : pcm.subarray(0, pcm.length - 1),
        sampleRate: rateMatch ? Number(rateMatch[1]) : FALLBACK_SAMPLE_RATE,
      };
    }

    const bodyText = await res.text();
    const retriable = res.status === 429 || res.status >= 500;
    if (!retriable || attempt >= MAX_RETRIES) {
      throw new Error(`Gemini API request failed (${res.status}): ${bodyText.slice(0, 1000)}`);
    }
    const waitSeconds = Math.min(60, 5 * 2 ** attempt);
    console.log(`  Got ${res.status}, retrying in ${waitSeconds}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
    await sleep(waitSeconds * 1000);
  }
}

function silencePcm(seconds, sampleRate) {
  return Buffer.alloc(Math.round(seconds * sampleRate) * 2);
}

// セグメントごとのPCMの間に無音を注入して1本のPCMに結合する
function assemblePcm(chunks, sampleRate) {
  const buffers = [];
  chunks.forEach(({ segment, pcm }, i) => {
    if (i > 0) buffers.push(silencePcm(pauseSecondsBetween(chunks[i - 1].segment, segment), sampleRate));
    buffers.push(pcm);
  });
  return Buffer.concat(buffers);
}

function encodeMp3(pcmBuffer, sampleRate, outPath) {
  return new Promise((resolve, reject) => {
    const ff = spawn(
      'ffmpeg',
      ['-y', '-f', 's16le', '-ar', String(sampleRate), '-ac', '1', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-q:a', '4', outPath],
      { stdio: ['pipe', 'ignore', 'pipe'] }
    );
    let stderr = '';
    ff.stderr.on('data', (d) => (stderr += d));
    ff.on('error', reject);
    ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-2000)}`))));
    ff.stdin.on('error', () => {}); // ffmpeg 側が先に落ちた場合の EPIPE は close ハンドラで報告する
    ff.stdin.end(pcmBuffer);
  });
}

async function main() {
  const [, , variantDir, version, characterArg] = process.argv;
  if (!variantDir || !version) {
    console.error('Usage: node scripts/generate-audio.js <variant-dir> <article-version> [character]');
    console.error('  e.g. node scripts/generate-audio.js texts/water-cycle-20260709-052935/variants/B1-normal 1 chobi');
    console.error(`  character: ${Object.keys(CHARACTERS).join(' | ')} (default: random)`);
    process.exit(1);
  }
  if (!/^\d+$/.test(version)) {
    console.error(`Invalid version: ${version} (must be a positive integer)`);
    process.exit(1);
  }

  const characterName = characterArg || process.env.GEMINI_TTS_CHARACTER || randomCharacterName();
  const character = CHARACTERS[characterName];
  if (!character) {
    console.error(`Unknown character: ${characterName} (available: ${Object.keys(CHARACTERS).join(', ')})`);
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && process.env.GEMINI_TTS_FAKE !== '1') {
    console.error('GEMINI_API_KEY is not set. Copy .env.example to .env and set your key.');
    process.exit(1);
  }
  const model = process.env.GEMINI_TTS_MODEL || DEFAULT_MODEL;
  // GEMINI_TTS_VOICE はキャラの声を明示的に差し替えたいときだけ設定する（通常は空のままキャラの声を使う）
  const voice = process.env.GEMINI_TTS_VOICE || character.voice;

  const articlePath = path.join(variantDir, 'articles', `v${version}.md`);
  if (!fs.existsSync(articlePath)) {
    console.error(`Article not found: ${articlePath}`);
    process.exit(1);
  }

  let level = null;
  const variantJsonPath = path.join(variantDir, 'variant.json');
  if (fs.existsSync(variantJsonPath)) {
    try {
      level = JSON.parse(fs.readFileSync(variantJsonPath, 'utf-8')).level || null;
    } catch {
      /* level不明でもデフォルトスタイルで続行する */
    }
  }
  const style = `${STYLE_BY_LEVEL[level] || DEFAULT_STYLE} ${character.tone}`;

  const { content } = matter(fs.readFileSync(articlePath, 'utf-8'));
  const segments = splitLongSegments(segmentArticle(content));
  if (!segments.length) {
    console.error(`Article has no readable text: ${articlePath}`);
    process.exit(1);
  }

  console.log(`Generating audio with model "${model}" (character ${characterName}, voice ${voice}, level ${level || 'unknown'})`);
  console.log(`${segments.length} segments to synthesize...`);

  const chunks = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const preview = segment.text.length > 60 ? `${segment.text.slice(0, 60)}...` : segment.text;
    console.log(`[${i + 1}/${segments.length}] (${segment.type}) ${preview}`);
    const { pcm, sampleRate } = await ttsSegment(segment.text, { apiKey, model, voice, style });
    chunks.push({ segment, pcm, sampleRate });
  }

  const sampleRate = chunks[0].sampleRate;
  const mismatch = chunks.find((c) => c.sampleRate !== sampleRate);
  if (mismatch) {
    console.error(`Sample rate mismatch across segments (${sampleRate} vs ${mismatch.sampleRate}); cannot concatenate.`);
    process.exit(1);
  }

  const pcm = assemblePcm(chunks, sampleRate);
  const durationSeconds = pcm.length / 2 / sampleRate;

  const outDir = path.join(variantDir, 'audio');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `v${version}.mp3`);
  await encodeMp3(pcm, sampleRate, outPath);

  const metaPath = path.join(outDir, `v${version}.json`);
  fs.writeFileSync(
    metaPath,
    `${JSON.stringify(
      {
        model,
        character: characterName,
        voice,
        level,
        style,
        articleVersion: Number(version),
        segmentCount: segments.length,
        sampleRate,
        durationSeconds: Math.round(durationSeconds * 10) / 10,
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`
  );

  console.log(`Saved audio to ${outPath} (${Math.floor(durationSeconds / 60)}m${String(Math.round(durationSeconds % 60)).padStart(2, '0')}s, metadata: ${metaPath})`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { segmentArticle, splitLongSegments, pauseSecondsBetween, assemblePcm, PAUSES, CHARACTERS };
