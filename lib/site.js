const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT_DIR = path.join(__dirname, '..');
const TEXTS_DIR = path.join(ROOT_DIR, 'texts');
const LEVEL_SPEC_PATH = path.join(ROOT_DIR, 'docs', 'specs', 'esl-level-spec.md');

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

// basePath + 未エンコードのパスセグメント配列からURLを組み立てる（GitHub Pagesのプロジェクトページ配下でも使えるように）
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

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: "Trebuchet MS", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 1000px; margin: 2rem auto; padding: 0 1.5rem; color: #2f2a3a; background: #fffaf3; }
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
  article { font-size: 1.18rem; line-height: 1.95; background: #fff; padding: 1.5rem; border-radius: 20px; border: 2px solid #ffe1c7; }
  article h1 { font-size: 1.6rem; color: #3d3560; }
  .illustration { max-width: 100%; border-radius: 20px; margin: 1rem 0; display: block; border: 3px solid #fff; box-shadow: 0 3px 12px rgba(255,107,107,0.25); }
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
</style>
</head>
<body>
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
  <p><a href="${href(basePath, ['levels'])}">About CEFR Levels</a></p>
  ${texts.length === 0 ? '<p>No texts have been generated yet.</p>' : `<ul class="text-list">${items}</ul>`}
  `;
  return { title: 'ESL Generated Texts', body };
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
  return { title: 'About CEFR Levels', body };
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

  const sourceLinks = sources.length
    ? `<ul class="sources-list">${sources
        .map(
          (f) =>
            `<li><a href="${href(basePath, ['texts', topicId, 'sources', f])}">${escapeHtml(sourceTitle(topicId, f))}</a></li>`
        )
        .join('\n')}</ul>`
    : '<p><em>None</em></p>';

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
  return { title: config.topic, body };
}

// バージョン表示・タイトル・レベル/長さバッジ・作成者/作成日・イラスト・本文からなる、
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

  const html = `
  ${versions.length > 1 ? `<div class="versions">${versionLinks}</div>` : ''}
  ${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
  <div class="article-badges">
    <span class="badge badge-level">${escapeHtml(variant.level)}</span>
    <span class="badge badge-tier">${escapeHtml(tierLabel)}</span>
  </div>
  ${creatorMeta}
  ${illustrationBlock(basePath, topicId)}
  <article>${marked.parse(rest)}</article>
  `;
  return { title, html };
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
      ? '<p><em>No article yet.</em></p>'
      : renderArticleContent(basePath, topicId, variantId, latestVersion, variant).html;

  const body = `
  ${crumbs}
  ${content}
  `;
  return { title: `${config.topic} (${variant.level}/${tierLabel})`, body };
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

  const { html } = renderArticleContent(basePath, topicId, variantId, version, variant);

  const body = `
  ${crumbs}
  ${html}
  `;
  return { title: `${config.topic} (${variant.level}/${tierLabel}, v${version})`, body };
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
  return { title: `${title} - ${config.topic}`, body };
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
  latestIllustrationVersion,
  illustrationBlock,
  readLevelSpecSection,
  listAllTexts,
  render404,
  renderIndex,
  renderLevels,
  renderTextDetail,
  renderVariantDetail,
  renderArticle,
  renderSource,
};
