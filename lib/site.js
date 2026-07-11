const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT_DIR = path.join(__dirname, '..');
const TEXTS_DIR = path.join(ROOT_DIR, 'texts');
const LEVEL_SPEC_PATH = path.join(ROOT_DIR, 'docs', 'specs', 'esl-level-spec.md');
const TOPIC_IDEAS_PATH = path.join(ROOT_DIR, 'docs', 'topic-ideas.md');

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const TIERS = ['normal', 'long', 'very-long'];
const TIER_LABELS = { normal: 'Short', long: 'Long', 'very-long': 'Very Long' };

// docs/specs/esl-level-spec.md の「CEFR Level Definitions」表と同じ値（表示専用の複製）
const LEVEL_VOCAB_HINTS = {
  A1: '~500 words',
  A2: '~1,000 words',
  B1: '~2,000 words',
  B2: '~3,000-4,000 words',
  C1: '5,000+ words',
  C2: 'No limit',
};

const WORD_COUNT_TARGETS = {
  A1: { normal: '100-150 words', long: '250-350 words', 'very-long': '600+ words' },
  A2: { normal: '150-300 words', long: '350-600 words', 'very-long': '700+ words' },
  B1: { normal: '300-600 words', long: '700-1200 words', 'very-long': '1500+ words' },
  B2: { normal: '600-1000 words', long: '1300-2000 words', 'very-long': '2500+ words' },
  C1: { normal: '1000-1500 words', long: '2000-3000 words', 'very-long': '4000+ words' },
  C2: { normal: '1500+ words', long: '3000+ words', 'very-long': '6000+ words' },
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

// basePath + 未エンコードのパスセグメント配列からURLを組み立てる（サブパス配下で配信する場合でも使えるように）
function href(basePath, parts) {
  const encoded = parts.map((p) => encodeURIComponent(String(p)));
  return `${basePath || ''}/${encoded.join('/')}`;
}

// items: [{label, parts}]。最後の要素は現在地としてリンク化しない
function breadcrumb(basePath, items) {
  const crumbs = items.map((item, i) => {
    if (i === items.length - 1) return `<span class="crumb-current">${escapeHtml(item.label)}</span>`;
    return `<a href="${href(basePath, item.parts)}">${escapeHtml(item.label)}</a>`;
  });
  return `<nav class="breadcrumb">${crumbs.join('<span class="crumb-sep"> / </span>')}</nav>`;
}

// 本文先頭の `# Title` 行を切り出し、残りの本文と分離する
function splitTitle(content) {
  const trimmed = content.replace(/^\s+/, '');
  const match = trimmed.match(/^#\s+(.+?)\s*\n+/);
  if (!match) return { title: null, rest: content };
  return { title: match[1].trim(), rest: trimmed.slice(match[0].length) };
}

function formatDate(isoString) {
  return String(isoString).slice(0, 10);
}

const SITE_NAME = 'ESL Generated Texts';

// Markdown本文からOGPのdescription用プレーンテキスト抜粋を作る
function excerpt(markdown, maxLength = 160) {
  const text = String(markdown)
    .replace(/^#{1,6}\s+.*$/gm, ' ') // 見出し行は説明文に含めない
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  const clipped = cut.slice(0, lastSpace > maxLength / 2 ? lastSpace : maxLength);
  return /[.!?]$/.test(clipped) ? clipped : `${clipped}…`;
}

// og: { url, image, description, type } — url / image は絶対URL。
// 絶対URLの組み立ては origin を知っている呼び出し側（server.js / build-static-site.js）が行う
function ogTags(title, og = {}) {
  const tags = [
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:type" content="${escapeHtml(og.type || 'website')}">`,
  ];
  if (og.url) tags.push(`<meta property="og:url" content="${escapeHtml(og.url)}">`);
  if (og.description) {
    tags.push(`<meta name="description" content="${escapeHtml(og.description)}">`);
    tags.push(`<meta property="og:description" content="${escapeHtml(og.description)}">`);
  }
  if (og.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(og.image)}">`);
    tags.push('<meta name="twitter:card" content="summary_large_image">');
  } else {
    tags.push('<meta name="twitter:card" content="summary">');
  }
  return tags.join('\n');
}

function layout(title, body, og) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
${ogTags(title, og)}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400..800;1,400..800&display=swap">
<style>
  /* 本文は ESL 学習者向けの英文のため、紛らわしい文字（I/l/1・rn/m 等）の判別性を
     最優先して Atkinson Hyperlegible Next（Braille Institute 設計）を採用。
     オフライン・フォント取得失敗時はシステムフォントへフォールバックする。 */
  body { font-family: "Atkinson Hyperlegible Next", "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif; max-width: 1000px; margin: 2rem auto; padding: 0 1.5rem; color: #2f2a3a; background: #fffaf3; }
  a { color: #ff6b6b; }
  h1, h2 { color: #3d3560; }
  .meta { color: #7a7290; font-size: 0.9rem; margin-bottom: 1rem; }
  .meta span { margin-right: 1rem; }
  ul.text-list { list-style: none; padding: 0; }
  ul.text-list li { display: flex; align-items: center; gap: 1rem; padding: 1rem 1rem; margin-bottom: 0.75rem; border-bottom: none; background: #fef1e6; border-radius: 16px; border: 2px solid #ffe1c7; }
  ul.text-list .thumb { width: 72px; height: 72px; flex: none; border-radius: 12px; object-fit: cover; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(255,107,107,0.2); }
  ul.text-list .topic-info { flex: 1; min-width: 0; }
  ul.text-list .topic { font-size: 1.15rem; font-weight: 700; color: #3d3560; }
  .badge { display: inline-block; padding: 0.2rem 0.75rem; border-radius: 999px; background: #ffd93d; color: #5a4300; font-size: 0.8rem; margin-left: 0.5rem; font-weight: 700; }
  .versions { margin: 1rem 0; }
  .versions a { margin-right: 0.5rem; padding: 0.25rem 0.8rem; border-radius: 999px; background: #e6f4ff; display: inline-block; color: #2f78c4; }
  .versions a.current { font-weight: bold; text-decoration: none; color: #fff; background: #4ecb71; }
  .sources-list { margin: 1rem 0; }
  .article-sources { margin-top: 2rem; padding-top: 1rem; border-top: 3px dashed #ffe1c7; }
  .article-sources h2 { font-size: 1.2rem; color: #3d3560; margin-bottom: 0.5rem; }
  article { font-size: 1.18rem; line-height: 1.95; background: #fff; padding: 1.5rem; border-radius: 20px; border: 2px solid #ffe1c7; }
  article h1 { font-size: 1.6rem; color: #3d3560; }
  .illustration { max-width: 100%; border-radius: 20px; margin: 1rem 0; display: block; border: 3px solid #fff; box-shadow: 0 3px 12px rgba(255,107,107,0.25); }
  .audio-reader { color: #7a7290; font-size: 0.9rem; margin: 1rem 0 0; }
  audio.listen { display: block; width: 100%; margin: 1rem 0; }
  .audio-reader + audio.listen { margin-top: 0.35rem; }
  section.block { margin: 2rem 0; padding-top: 1rem; border-top: 3px dashed #ffe1c7; }
  hr { border: none; border-top: 3px dashed #ffe1c7; margin: 2rem 0; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; border-radius: 12px; display: block; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; }
  th, td { border: 1px solid #ffe1c7; padding: 0.6rem; text-align: left; vertical-align: top; }
  th { background: #ffe1c7; color: #5a4300; }
  table.variant-matrix th, table.variant-matrix td { text-align: center; }
  table.variant-matrix td.unavailable { color: #c9c1d6; }
  .wc-hint { font-size: 0.75rem; font-weight: 400; color: #7a7290; }
  table.variant-matrix td.unavailable .wc-hint { color: #c9c1d6; }
  .tier-block { margin-bottom: 0.75rem; }
  .tier-block .tier-label { font-weight: 700; margin-right: 0.5rem; color: #3d3560; }
  .breadcrumb { font-size: 0.85rem; color: #7a7290; margin-bottom: 1.5rem; }
  .breadcrumb a { color: #2f78c4; text-decoration: none; }
  .breadcrumb a:hover { text-decoration: underline; }
  .breadcrumb .crumb-current { color: #3d3560; font-weight: 700; }
  .breadcrumb .crumb-sep { margin: 0 0.4rem; color: #c9c1d6; }
  .article-badges { margin: 0.5rem 0 1rem; }
  .badge-level { background: #ffd93d; color: #5a4300; }
  .badge-tier { background: #d6ecff; color: #2f78c4; margin-left: 0.5rem; }
  .creator-meta { color: #7a7290; font-size: 0.9rem; margin: 0 0 1.25rem; }
  .creator-meta span { margin-right: 1.25rem; }
  .level-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin: 1.5rem 0; }
  @media (max-width: 640px) { .level-cards { grid-template-columns: 1fr; } }
  .level-card { background: #fef1e6; border: 2px solid #ffe1c7; border-radius: 16px; padding: 1rem 1.25rem; }
  .level-card h3 { margin: 0 0 0.75rem; color: #3d3560; font-size: 1.3rem; }
  .level-card dl { margin: 0; }
  .level-row { margin-bottom: 0.6rem; }
  .level-row:last-child { margin-bottom: 0; }
  .level-row dt { font-weight: 700; color: #7a7290; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 0.15rem; }
  .level-row dd { margin: 0; }
  ul.idea-tree { list-style: none; padding-left: 0; margin: 0.5rem 0; }
  ul.idea-tree ul.idea-tree { padding-left: 1.1rem; border-left: 2px solid #ffe1c7; margin: 0.4rem 0 0.9rem 0.45rem; }
  ul.idea-tree li { margin: 0.45rem 0; }
  ul.idea-tree .category-name { font-weight: 700; color: #3d3560; font-size: 1.05rem; }
  ul.idea-tree .idea-topic { font-weight: 600; }
  .badge-genre { background: #d6ecff; color: #2f78c4; }
  .badge-levels { background: #eadcff; color: #6a4fc4; }
  .idea-note { color: #7a7290; font-size: 0.85rem; margin-top: 0.1rem; }
  .print-url { display: none; }

  @media print {
    /* 印刷物からも元ページへ戻れるよう、印刷時のみ先頭にページURLを表示する */
    .print-url { display: block; color: #000; font-size: 0.8rem; margin-bottom: 1rem; word-break: break-all; }
    /* 画面用の淡いトーン(#2f2a3a/#3d3560/#7a7290等)は純黒でないため、
       プリンタ側の省インク補正やCMYK変換でさらに薄く出やすい。印刷時は文字色を純黒に固定する。 */
    body, article, table, .meta, .topic, .badge, .versions a, .tier-block .tier-label,
    .breadcrumb, .breadcrumb a, .creator-meta, .wc-hint, .level-row dt, .level-row dd,
    ul.idea-tree .category-name, ul.idea-tree .idea-topic, .idea-note,
    h1, h2, h3, article h1, th, td {
      color: #000 !important;
    }
    body { background: #fff; }
    ul.text-list li, .level-card, article, .badge, .versions a { background: #fff; box-shadow: none; }
    ul.text-list li, .level-card, th, td { border-color: #999; }
    /* 本文の枠線は印刷して手書きメモを書き込む用途があるため描画しない */
    article { border: none; padding: 0; }
    .illustration { box-shadow: none; border-color: #999; }
    audio.listen, .audio-reader { display: none; }
    a { text-decoration: underline; }
  }
</style>
</head>
<body>
<div class="print-url"></div>
<script>document.querySelector('.print-url').textContent = location.href;</script>
${body}
</body>
</html>`;
}

function readConfig(topicId) {
  const configPath = path.join(TEXTS_DIR, topicId, 'config.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

function readVariantJson(topicId, variantId) {
  const variantPath = path.join(TEXTS_DIR, topicId, 'variants', variantId, 'variant.json');
  if (!fs.existsSync(variantPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(variantPath, 'utf-8'));
  } catch {
    return null;
  }
}

function listVersions(topicId, subdir) {
  const dir = path.join(TEXTS_DIR, topicId, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((f) => f.match(/^v(\d+)\.md$/))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

function listArticleVersions(topicId, variantId) {
  return listVersions(topicId, path.join('variants', variantId, 'articles'));
}

function listSources(topicId) {
  const dir = path.join(TEXTS_DIR, topicId, 'sources');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
}

function listVariants(topicId) {
  const dir = path.join(TEXTS_DIR, topicId, 'variants');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ variantId: d.name, variant: readVariantJson(topicId, d.name) }))
    .filter((v) => v.variant)
    .sort((a, b) => (a.variant.createdAt < b.variant.createdAt ? 1 : -1));
}

function isValidId(topicId) {
  return /^[A-Za-z0-9._-]+$/.test(topicId) && fs.existsSync(path.join(TEXTS_DIR, topicId, 'config.json'));
}

function isValidVariantId(topicId, variantId) {
  if (!isValidId(topicId)) return false;
  if (!/^[A-Za-z0-9-]+$/.test(variantId)) return false;
  return fs.existsSync(path.join(TEXTS_DIR, topicId, 'variants', variantId, 'variant.json'));
}

function hasIllustration(topicId, version) {
  return fs.existsSync(path.join(TEXTS_DIR, topicId, 'images', `v${version}.png`));
}

// 音声はバリアント単位で、記事バージョンと同番号の audio/v{N}.mp3 として管理している
function hasAudio(topicId, variantId, version) {
  return fs.existsSync(path.join(TEXTS_DIR, topicId, 'variants', variantId, 'audio', `v${version}.mp3`));
}

// 読み上げキャラの表示名。manabi はキャラ「なるこ」の旧名のため表示上は Naruko とする
const AUDIO_CHARACTER_NAMES = { chobi: 'Chobi', manabi: 'Naruko' };

function audioBlock(basePath, topicId, variantId, version) {
  if (!hasAudio(topicId, variantId, version)) return '';
  let reader = '';
  const metaPath = path.join(TEXTS_DIR, topicId, 'variants', variantId, 'audio', `v${version}.json`);
  try {
    const { character } = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const name = AUDIO_CHARACTER_NAMES[character] || character;
    if (name) reader = `<p class="audio-reader">Read by ${escapeHtml(name)}</p>`;
  } catch {
    /* メタデータが無い・壊れている場合はラベル無しでプレイヤーのみ表示する */
  }
  return `${reader}<audio class="listen" controls preload="none" src="${href(basePath, ['texts', topicId, variantId, 'audio', `${version}.mp3`])}"></audio>`;
}

// トピックにつき1枚を全バリアントで共有するため、存在する最大バージョンを返す
function latestIllustrationVersion(topicId) {
  const dir = path.join(TEXTS_DIR, topicId, 'images');
  if (!fs.existsSync(dir)) return undefined;
  const versions = fs
    .readdirSync(dir)
    .map((f) => f.match(/^v(\d+)\.png$/))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  if (!versions.length) return undefined;
  return Math.max(...versions);
}

function illustrationBlock(basePath, topicId) {
  const version = latestIllustrationVersion(topicId);
  if (version === undefined) return '';
  return `<img class="illustration" src="${href(basePath, ['texts', topicId, 'images', `${version}.png`])}" alt="Illustration">`;
}

// OGP画像用に、トピックのイラストの href() パスセグメントを返す（無ければ undefined）
function illustrationImageParts(topicId) {
  const version = latestIllustrationVersion(topicId);
  if (version === undefined) return undefined;
  return ['texts', topicId, 'images', `${version}.png`];
}

function readLevelSpecSection() {
  const raw = fs.readFileSync(LEVEL_SPEC_PATH, 'utf-8');
  const match = raw.match(/## CEFR Level Definitions\n([\s\S]*?)(?=\n## |$)/);
  return match ? match[1].trim() : '';
}

function listAllTexts() {
  if (!fs.existsSync(TEXTS_DIR)) return [];
  return fs
    .readdirSync(TEXTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ id: d.name, config: readConfig(d.name) }))
    .filter((t) => t.config)
    .sort((a, b) => (a.config.createdAt < b.config.createdAt ? 1 : -1));
}

function render404(basePath) {
  return {
    title: 'Not Found',
    body: `<h1>404 Not Found</h1><p><a href="${href(basePath, [])}">&larr; Back to list</a></p>`,
  };
}

function renderIndex(basePath) {
  const texts = listAllTexts();
  const items = texts
    .map(({ id, config }) => {
      const factCheck = config.requiresFactCheck ? 'Fact-checked' : 'Not fact-checked';
      const variantCount = listVariants(id).length;
      const illustrationVersion = latestIllustrationVersion(id);
      const thumb = illustrationVersion === undefined
        ? ''
        : `<img class="thumb" src="${href(basePath, ['texts', id, 'images', `${illustrationVersion}.png`])}" alt="">`;
      return `<li>
        ${thumb}
        <div class="topic-info">
          <div class="topic"><a href="${href(basePath, ['texts', id])}">${escapeHtml(config.topic)}</a></div>
          <div class="meta">
            <span>${escapeHtml(config.genre)}</span>
            <span>${variantCount} variant${variantCount === 1 ? '' : 's'}</span>
            <span>${escapeHtml(config.createdAt)}</span>
            <span class="badge">${factCheck}</span>
          </div>
        </div>
      </li>`;
    })
    .join('\n');

  const body = `
  <h1>ESL Generated Texts</h1>
  <p><a href="${href(basePath, ['levels'])}">About CEFR Levels</a> · <a href="${href(basePath, ['topic-ideas'])}">Topic Ideas</a></p>
  ${texts.length === 0 ? '<p>No texts have been generated yet.</p>' : `<ul class="text-list">${items}</ul>`}
  `;
  return {
    title: SITE_NAME,
    body,
    description:
      'Free English reading practice for ESL learners: texts written at CEFR levels A1-C2 in multiple lengths, with illustrations and listening audio.',
  };
}

const LEVEL_ROW_LABELS = [
  'Word Count: Short',
  'Word Count: Long',
  'Word Count: Very Long',
  'Avg. Sentence Length',
  'Vocabulary Range',
  'Grammar Allowed',
  'Avoid',
];

// "| a | b | ... |" 形式のMarkdownテーブル行をセル配列に変換する（見出し行・区切り行は呼び出し側で除外する）
function parseMarkdownTableRow(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

// 開発者向けdocs/specs/esl-level-spec.mdの原文注記ではなく、サイト訪問者(学習者)向けに書いた説明
const LEVEL_NOTES_MARKDOWN = `## Notes

- **Level** is the difficulty of the vocabulary and grammar used (A1 = easiest, C2 = hardest). **Length** is just how much there is to read (Short / Long / Very Long). These two are independent, so you can pick any combination — for example an easy A1-level text that's Very Long, or a Short text written at an advanced C1 level.
- Word counts are for the whole text, not counting the title. "Long" is roughly double the length of "Short", and "Very Long" is roughly 4-5x.
- "Vocabulary Range" is an approximate sense of how many different words you'd need to know to read comfortably at that level — not an exact word list.
- Not sure which level fits you? Compare the "Grammar Allowed" and "Avoid" rows to grammar you already know: pick the level where "Grammar Allowed" feels familiar and "Avoid" still feels a bit out of reach.
`;

function renderLevels(basePath) {
  const section = readLevelSpecSection();
  const tableMatch = section.match(/(\|.*Level.*\|\n\|[-| ]+\|\n(?:\|.*\|\n?)+)/);
  const notesHtml = marked.parse(LEVEL_NOTES_MARKDOWN);

  let cardsHtml = '';
  if (tableMatch) {
    const rows = tableMatch[1].trim().split('\n').slice(2).map(parseMarkdownTableRow);
    cardsHtml = `<div class="level-cards">${rows
      .map(([level, ...cells]) => `
      <div class="level-card">
        <h3>${escapeHtml(level)}</h3>
        <dl>${cells
          .map((cell, i) => `<div class="level-row"><dt>${escapeHtml(LEVEL_ROW_LABELS[i] || '')}</dt><dd>${escapeHtml(cell)}</dd></div>`)
          .join('')}</dl>
      </div>`)
      .join('\n')}</div>`;
  }

  const crumbs = breadcrumb(basePath, [{ label: 'Home', parts: [] }, { label: 'About CEFR Levels' }]);
  const body = `
  ${crumbs}
  <h1>About CEFR Levels</h1>
  <article>
    ${cardsHtml}
    ${notesHtml}
  </article>
  `;
  return {
    title: 'About CEFR Levels',
    body,
    description:
      'What CEFR levels A1-C2 mean on this site: vocabulary range, sentence length, grammar, and word-count targets for each reading level.',
  };
}

// docs/topic-ideas.md の指定セクション（## 見出し）の中身を取り出す
function readTopicIdeasSection(heading) {
  if (!fs.existsSync(TOPIC_IDEAS_PATH)) return '';
  const raw = fs.readFileSync(TOPIC_IDEAS_PATH, 'utf-8');
  const section = raw.match(new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`));
  return section ? section[1] : '';
}

// 指定セクションにあるMarkdownテーブルを行セル配列の配列として取り出す
function readTopicIdeasTable(heading) {
  const table = readTopicIdeasSection(heading).match(/(\|.*\|\n\|[-| ]+\|\n(?:\|.*\|\n?)+)/);
  if (!table) return [];
  return table[1].trim().split('\n').slice(2).map(parseMarkdownTableRow);
}

// 「アイデア一覧」のネストした箇条書きをツリーとしてパースする。
// カテゴリは `- {カテゴリ名}`（パイプ無し）、葉は `- {トピック} | {ジャンル} | {レベル帯} | {メモ}`（インデントは2スペース単位）
function readTopicIdeasTree() {
  const root = { children: [] };
  const stack = [{ depth: -1, node: root }];
  for (const line of readTopicIdeasSection('アイデア一覧').split('\n')) {
    const m = line.match(/^( *)- (.+)$/);
    if (!m) continue;
    const depth = Math.floor(m[1].length / 2);
    const parts = m[2].split('|').map((s) => s.trim());
    const node =
      parts.length >= 2
        ? { topic: parts[0], genre: parts[1], levels: parts[2] || '', note: parts[3] || '' }
        : { category: parts[0], children: [] };
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ depth, node });
  }
  return root.children;
}

function ideaTreeHtml(nodes) {
  if (!nodes.length) return '';
  const items = nodes
    .map((n) =>
      n.category !== undefined
        ? `<li class="idea-category"><span class="category-name">${escapeHtml(n.category)}</span>${ideaTreeHtml(n.children)}</li>`
        : `<li class="idea">
          <span class="idea-topic">${escapeHtml(n.topic)}</span>
          <span class="badge badge-genre">${escapeHtml(n.genre)}</span>
          ${n.levels ? `<span class="badge badge-levels">${escapeHtml(n.levels)}</span>` : ''}
          ${n.note ? `<div class="idea-note">${escapeHtml(n.note)}</div>` : ''}
        </li>`
    )
    .join('\n');
  return `<ul class="idea-tree">${items}</ul>`;
}

function renderTopicIdeas(basePath) {
  const ideaTree = readTopicIdeasTree();
  const adoptedRows = readTopicIdeasTable('採用済み');

  const ideasHtml = ideaTree.length ? ideaTreeHtml(ideaTree) : '<p><em>No ideas in stock right now.</em></p>';

  const adoptedHtml = adoptedRows.length
    ? `<table><tr><th>Topic</th><th>Genre</th><th>Created</th></tr>${adoptedRows
        .map(([topic, genre, dirCell, date]) => {
          const idMatch = String(dirCell).match(/texts\/([A-Za-z0-9._-]+)/);
          const topicHtml =
            idMatch && isValidId(idMatch[1])
              ? `<a href="${href(basePath, ['texts', idMatch[1]])}">${escapeHtml(topic)}</a>`
              : escapeHtml(topic);
          return `<tr><td>${topicHtml}</td><td>${escapeHtml(genre)}</td><td>${escapeHtml(date || '')}</td></tr>`;
        })
        .join('\n')}</table>`
    : '<p><em>None yet.</em></p>';

  const crumbs = breadcrumb(basePath, [{ label: 'Home', parts: [] }, { label: 'Topic Ideas' }]);
  const body = `
  ${crumbs}
  <h1>Topic Ideas</h1>
  <p class="meta">Candidate topics for future texts. Topics that have already been written are listed at the bottom with links to their pages.</p>
  <article>
    <h2>Ideas</h2>
    ${ideasHtml}
    <h2>Already Written</h2>
    ${adoptedHtml}
  </article>
  `;
  return {
    title: 'Topic Ideas',
    body,
    description: 'Candidate topics for future ESL reading texts, plus a list of topics that have already been written.',
  };
}

function sourceTitle(topicId, filename) {
  const filePath = path.join(TEXTS_DIR, topicId, 'sources', filename);
  try {
    const { data } = matter(fs.readFileSync(filePath, 'utf-8'));
    return data.title || filename;
  } catch {
    return filename;
  }
}

// sources/ の一覧を <ul class="sources-list"> として組み立てる。トピック詳細ページと
// 記事ページの両方から参照する。sources が無ければ空文字を返す
function sourcesListHtml(basePath, topicId) {
  const sources = listSources(topicId);
  if (!sources.length) return '';
  return `<ul class="sources-list">${sources
    .map(
      (f) =>
        `<li><a href="${href(basePath, ['texts', topicId, 'sources', f])}">${escapeHtml(sourceTitle(topicId, f))}</a></li>`
    )
    .join('\n')}</ul>`;
}

function renderTextDetail(basePath, topicId) {
  if (!isValidId(topicId)) return null;

  const config = readConfig(topicId);
  const sources = listSources(topicId);
  const variants = listVariants(topicId);
  const variantIds = new Set(variants.map((v) => v.variantId));

  const matrixHeader = TIERS.map((tier) => `<th>${TIER_LABELS[tier]}<br><span class="wc-hint">${tier === 'normal' ? '1x' : tier === 'long' ? '~2x' : '~4-5x'}</span></th>`).join('');
  const matrixRows = LEVELS.map((level) => {
    const cells = TIERS.map((tier) => {
      const variantId = `${level}-${tier}`;
      const wordCount = WORD_COUNT_TARGETS[level][tier];
      if (variantIds.has(variantId)) {
        return `<td><a href="${href(basePath, ['texts', topicId, variantId])}">${escapeHtml(level)}</a><br><span class="wc-hint">${escapeHtml(wordCount)}</span></td>`;
      }
      return `<td class="unavailable">Not generated<br><span class="wc-hint">${escapeHtml(wordCount)}</span></td>`;
    }).join('');
    return `<tr><th>${escapeHtml(level)}<br><span class="wc-hint">${escapeHtml(LEVEL_VOCAB_HINTS[level])}</span></th>${cells}</tr>`;
  }).join('\n');

  const sourceLinks = sources.length ? sourcesListHtml(basePath, topicId) : '<p><em>None</em></p>';

  const crumbs = breadcrumb(basePath, [{ label: 'Home', parts: [] }, { label: config.topic }]);

  const body = `
  ${crumbs}
  <h1>${escapeHtml(config.topic)}</h1>

  <h2>Variants (Level × Length)</h2>
  <p class="meta">Level = vocabulary/grammar difficulty (A1 easiest → C2 hardest). Length = approx. word count for the whole text. See <a href="${href(basePath, ['levels'])}">About CEFR Levels</a> for details.</p>
  <table class="variant-matrix"><tr><th></th>${matrixHeader}</tr>${matrixRows}</table>

  <h2>Sources</h2>
  ${sourceLinks}
  `;
  return {
    title: config.topic,
    body,
    description: `English reading texts about "${config.topic}" for ESL learners, available at multiple CEFR levels and lengths, with illustrations and listening audio.`,
    imageParts: illustrationImageParts(topicId),
  };
}

// バージョン表示・イラスト・タイトル・レベル/長さバッジ・作成者/作成日・本文からなる、
// バリアント詳細ページと記事ページで共通の中身を組み立てる
function renderArticleContent(basePath, topicId, variantId, version, variant) {
  const filePath = path.join(TEXTS_DIR, topicId, 'variants', variantId, 'articles', `v${version}.md`);
  const tierLabel = TIER_LABELS[variant.tier] || variant.tier;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(raw);
  const { title, rest } = splitTitle(content);
  const versions = listArticleVersions(topicId, variantId);
  const versionLinks = versions
    .map((v) =>
      String(v) === String(version)
        ? `<a class="current" href="${href(basePath, ['texts', topicId, variantId, 'article', v])}">v${v}</a>`
        : `<a href="${href(basePath, ['texts', topicId, variantId, 'article', v])}">v${v}</a>`
    )
    .join(' ');

  const creatorMeta = (data.aiModel || data.createdAt)
    ? `<p class="creator-meta">
        ${data.aiModel ? `<span>Author: ${escapeHtml(data.aiModel)}</span>` : ''}
        ${data.createdAt ? `<span>Created ${escapeHtml(formatDate(data.createdAt))}</span>` : ''}
      </p>`
    : '';

  const sourcesList = sourcesListHtml(basePath, topicId);
  const sourcesSection = sourcesList
    ? `<section class="article-sources"><h2>Sources</h2>${sourcesList}</section>`
    : '';

  const html = `
  ${versions.length > 1 ? `<div class="versions">${versionLinks}</div>` : ''}
  ${illustrationBlock(basePath, topicId)}
  ${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
  <div class="article-badges">
    <span class="badge badge-level">${escapeHtml(variant.level)}</span>
    <span class="badge badge-tier">${escapeHtml(tierLabel)}</span>
  </div>
  ${creatorMeta}
  ${audioBlock(basePath, topicId, variantId, version)}
  <article>${marked.parse(rest)}</article>
  ${sourcesSection}
  `;
  return { title, html, description: excerpt(rest) };
}

function renderVariantDetail(basePath, topicId, variantId) {
  if (!isValidVariantId(topicId, variantId)) return null;

  const config = readConfig(topicId);
  const variant = readVariantJson(topicId, variantId);
  const articleVersions = listArticleVersions(topicId, variantId);
  const latestVersion = articleVersions[articleVersions.length - 1];
  const tierLabel = TIER_LABELS[variant.tier] || variant.tier;

  const crumbs = breadcrumb(basePath, [
    { label: 'Home', parts: [] },
    { label: config.topic, parts: ['texts', topicId] },
    { label: `${variant.level} / ${tierLabel}` },
  ]);

  const content =
    latestVersion === undefined
      ? { html: '<p><em>No article yet.</em></p>' }
      : renderArticleContent(basePath, topicId, variantId, latestVersion, variant);

  const body = `
  ${crumbs}
  ${content.html}
  `;
  return {
    title: `${config.topic} (${variant.level}/${tierLabel})`,
    body,
    description: content.description,
    imageParts: illustrationImageParts(topicId),
    ogType: 'article',
  };
}

function renderArticle(basePath, topicId, variantId, version) {
  if (!isValidVariantId(topicId, variantId) || !/^\d+$/.test(String(version))) return null;
  const filePath = path.join(TEXTS_DIR, topicId, 'variants', variantId, 'articles', `v${version}.md`);
  if (!fs.existsSync(filePath)) return null;

  const config = readConfig(topicId);
  const variant = readVariantJson(topicId, variantId);
  const tierLabel = TIER_LABELS[variant.tier] || variant.tier;

  const crumbs = breadcrumb(basePath, [
    { label: 'Home', parts: [] },
    { label: config.topic, parts: ['texts', topicId] },
    { label: `${variant.level} / ${tierLabel}`, parts: ['texts', topicId, variantId] },
    { label: `v${version}` },
  ]);

  const { html, description } = renderArticleContent(basePath, topicId, variantId, version, variant);

  const body = `
  ${crumbs}
  ${html}
  `;
  return {
    title: `${config.topic} (${variant.level}/${tierLabel}, v${version})`,
    body,
    description,
    imageParts: illustrationImageParts(topicId),
    ogType: 'article',
  };
}

function renderSource(basePath, topicId, filename) {
  if (!isValidId(topicId) || !listSources(topicId).includes(filename)) return null;
  const filePath = path.join(TEXTS_DIR, topicId, 'sources', filename);

  const config = readConfig(topicId);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(raw);
  const title = data.title || filename;

  const meta = `
  <p class="meta">
    ${data.title ? `<strong>${escapeHtml(data.title)}</strong><br>` : ''}
    ${data.url ? `<a href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.url)}</a>` : ''}
  </p>`;

  const crumbs = breadcrumb(basePath, [
    { label: 'Home', parts: [] },
    { label: config.topic, parts: ['texts', topicId] },
    { label: title },
  ]);

  const body = `
  ${crumbs}
  <h1>${escapeHtml(title)}</h1>
  ${meta}
  <article>${marked.parse(content)}</article>
  `;
  return { title: `${title} - ${config.topic}`, body, description: excerpt(content) };
}

module.exports = {
  TEXTS_DIR,
  LEVEL_SPEC_PATH,
  LEVELS,
  TIERS,
  TIER_LABELS,
  escapeHtml,
  href,
  layout,
  readConfig,
  readVariantJson,
  listVersions,
  listArticleVersions,
  listSources,
  listVariants,
  isValidId,
  isValidVariantId,
  hasIllustration,
  hasAudio,
  audioBlock,
  latestIllustrationVersion,
  illustrationBlock,
  readLevelSpecSection,
  listAllTexts,
  render404,
  renderIndex,
  renderLevels,
  renderTopicIdeas,
  renderTextDetail,
  renderVariantDetail,
  renderArticle,
  renderSource,
};
