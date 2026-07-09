const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT_DIR = path.join(__dirname, '..');
const TEXTS_DIR = path.join(ROOT_DIR, 'texts');
const LEVEL_SPEC_PATH = path.join(ROOT_DIR, 'docs', 'specs', 'esl-level-spec.md');

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const TIERS = ['normal', 'long', 'very-long'];
const TIER_LABELS = { normal: '通常', long: '長い', 'very-long': 'すごく長い' };

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

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: "Trebuchet MS", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 760px; margin: 2rem auto; padding: 0 1.5rem; color: #2f2a3a; background: #fffaf3; }
  a { color: #ff6b6b; }
  h1, h2 { color: #3d3560; }
  .meta { color: #7a7290; font-size: 0.9rem; margin-bottom: 1rem; }
  .meta span { margin-right: 1rem; }
  ul.text-list { list-style: none; padding: 0; }
  ul.text-list li { padding: 1rem 1rem; margin-bottom: 0.75rem; border-bottom: none; background: #fef1e6; border-radius: 16px; border: 2px solid #ffe1c7; }
  ul.text-list .topic { font-size: 1.15rem; font-weight: 700; color: #3d3560; }
  .badge { display: inline-block; padding: 0.2rem 0.75rem; border-radius: 999px; background: #ffd93d; color: #5a4300; font-size: 0.8rem; margin-left: 0.5rem; font-weight: 700; }
  .versions { margin: 1rem 0; }
  .versions a { margin-right: 0.5rem; padding: 0.25rem 0.8rem; border-radius: 999px; background: #e6f4ff; display: inline-block; color: #2f78c4; }
  .versions a.current { font-weight: bold; text-decoration: none; color: #fff; background: #4ecb71; }
  .sources-list { margin: 1rem 0; }
  article { font-size: 1.18rem; line-height: 1.95; background: #fff; padding: 1.5rem; border-radius: 20px; border: 2px solid #ffe1c7; }
  article h1 { font-size: 1.6rem; color: #3d3560; }
  .illustration { max-width: 100%; border-radius: 20px; margin: 1rem 0; display: block; border: 3px solid #fff; box-shadow: 0 3px 12px rgba(255,107,107,0.25); }
  nav.back { margin-bottom: 1.5rem; }
  section.block { margin: 2rem 0; padding-top: 1rem; border-top: 3px dashed #ffe1c7; }
  hr { border: none; border-top: 3px dashed #ffe1c7; margin: 2rem 0; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; border-radius: 12px; overflow: hidden; }
  th, td { border: 1px solid #ffe1c7; padding: 0.6rem; text-align: left; vertical-align: top; }
  th { background: #ffe1c7; color: #5a4300; }
  table.variant-matrix th, table.variant-matrix td { text-align: center; }
  table.variant-matrix td.unavailable { color: #c9c1d6; }
  .tier-block { margin-bottom: 0.75rem; }
  .tier-block .tier-label { font-weight: 700; margin-right: 0.5rem; color: #3d3560; }
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

function listOutlineVersions(topicId, tier) {
  return listVersions(topicId, path.join('outlines', tier));
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

function isValidTier(tier) {
  return TIERS.includes(tier);
}

function hasIllustration(topicId, variantId, version) {
  return fs.existsSync(path.join(TEXTS_DIR, topicId, 'variants', variantId, 'images', `v${version}.png`));
}

function resolveIllustrationVersion(topicId, variantId, version) {
  if (version === undefined) return undefined;
  for (let v = Number(version); v >= 1; v--) {
    if (hasIllustration(topicId, variantId, v)) return v;
  }
  return undefined;
}

function illustrationBlock(basePath, topicId, variantId, version) {
  const resolved = resolveIllustrationVersion(topicId, variantId, version);
  if (resolved === undefined) return '';
  return `<img class="illustration" src="${href(basePath, ['texts', topicId, variantId, 'images', `${resolved}.png`])}" alt="Illustration">`;
}

function readLevelSpecSection() {
  const raw = fs.readFileSync(LEVEL_SPEC_PATH, 'utf-8');
  const match = raw.match(/## CEFR レベル定義\n([\s\S]*?)(?=\n## |$)/);
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
    body: `<h1>404 Not Found</h1><p><a href="${href(basePath, [])}">&larr; 一覧に戻る</a></p>`,
  };
}

function renderIndex(basePath) {
  const texts = listAllTexts();
  const items = texts
    .map(({ id, config }) => {
      const factCheck = config.requiresFactCheck ? '事実チェック対象' : '事実チェック対象外';
      const variantCount = listVariants(id).length;
      return `<li>
        <div class="topic"><a href="${href(basePath, ['texts', id])}">${escapeHtml(config.topic)}</a></div>
        <div class="meta">
          <span>${escapeHtml(config.genre)}</span>
          <span>${variantCount}バリアント</span>
          <span>${escapeHtml(config.createdAt)}</span>
          <span class="badge">${factCheck}</span>
        </div>
      </li>`;
    })
    .join('\n');

  const body = `
  <h1>ESL生成テキスト一覧</h1>
  <p><a href="${href(basePath, ['levels'])}">レベル（CEFR）についての説明</a></p>
  ${texts.length === 0 ? '<p>まだ生成物がありません。</p>' : `<ul class="text-list">${items}</ul>`}
  `;
  return { title: 'ESL生成テキスト一覧', body };
}

function renderLevels(basePath) {
  const section = readLevelSpecSection();
  const body = `
  <nav class="back"><a href="${href(basePath, [])}">&larr; 一覧に戻る</a></nav>
  <h1>レベル（CEFR）についての説明</h1>
  <article>${marked.parse(section)}</article>
  `;
  return { title: 'レベル（CEFR）についての説明', body };
}

function renderTextDetail(basePath, topicId) {
  if (!isValidId(topicId)) return null;

  const config = readConfig(topicId);
  const sources = listSources(topicId);
  const variants = listVariants(topicId);
  const variantIds = new Set(variants.map((v) => v.variantId));

  const configRows = [
    ['トピック', config.topic],
    ['トピックスラッグ', config.topicSlug],
    ['作成日時', config.createdAt],
    ['ジャンル', config.genre],
    ['事実チェック対象', config.requiresFactCheck ? 'はい' : 'いいえ'],
    ['事実チェック対象外理由', config.factCheckExemptionReason || '-'],
  ]
    .map(([k, v]) => `<tr><th align="left">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join('\n');

  const outlineBlocks = TIERS.map((tier) => {
    const versions = listOutlineVersions(topicId, tier);
    if (!versions.length) return '';
    const links = versions
      .map((v) => `<a href="${href(basePath, ['texts', topicId, 'outline', tier, v])}">v${v}</a>`)
      .join(' ');
    return `<div class="tier-block"><span class="tier-label">${TIER_LABELS[tier]}</span>${links}</div>`;
  })
    .filter(Boolean)
    .join('\n');

  const matrixHeader = TIERS.map((tier) => `<th>${TIER_LABELS[tier]}</th>`).join('');
  const matrixRows = LEVELS.map((level) => {
    const cells = TIERS.map((tier) => {
      const variantId = `${level}-${tier}`;
      if (variantIds.has(variantId)) {
        return `<td><a href="${href(basePath, ['texts', topicId, variantId])}">${escapeHtml(level)}</a></td>`;
      }
      return `<td class="unavailable">未生成</td>`;
    }).join('');
    return `<tr><th>${escapeHtml(level)}</th>${cells}</tr>`;
  }).join('\n');

  const sourceLinks = sources.length
    ? `<ul class="sources-list">${sources
        .map(
          (f) =>
            `<li><a href="${href(basePath, ['texts', topicId, 'sources', f])}">${escapeHtml(f)}</a></li>`
        )
        .join('\n')}</ul>`
    : '<p><em>なし</em></p>';

  const body = `
  <nav class="back"><a href="${href(basePath, [])}">&larr; 一覧に戻る</a></nav>
  <h1>${escapeHtml(config.topic)}</h1>
  <table>${configRows}</table>

  <h2>アウトライン（分量tier別）</h2>
  ${outlineBlocks || '<p><em>なし</em></p>'}

  <h2>バリアント一覧（レベル×分量）</h2>
  <table class="variant-matrix"><tr><th></th>${matrixHeader}</tr>${matrixRows}</table>

  <h2>参考資料（Sources）</h2>
  ${sourceLinks}
  `;
  return { title: config.topic, body };
}

function renderVariantDetail(basePath, topicId, variantId) {
  if (!isValidVariantId(topicId, variantId)) return null;

  const config = readConfig(topicId);
  const variant = readVariantJson(topicId, variantId);
  const articleVersions = listArticleVersions(topicId, variantId);
  const latestArticle = articleVersions[articleVersions.length - 1];

  const variantRows = [
    ['レベル', variant.level],
    ['分量', TIER_LABELS[variant.tier] || variant.tier],
    ['語数目安', variant.wordCountTarget],
    ['長文モード', variant.longForm ? 'はい' : 'いいえ'],
    ['作成日時', variant.createdAt],
  ]
    .map(([k, v]) => `<tr><th align="left">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join('\n');

  const outlineLink = `<a href="${href(basePath, ['texts', topicId, 'outline', variant.outlineTier, variant.outlineVersion])}">${TIER_LABELS[variant.outlineTier] || variant.outlineTier} v${variant.outlineVersion}</a>`;

  const articleLinks = articleVersions.length
    ? articleVersions
        .map((v) => `<a href="${href(basePath, ['texts', topicId, variantId, 'article', v])}">v${v}</a>`)
        .join(' ')
    : '<em>なし</em>';

  let articlePreview = '';
  if (latestArticle !== undefined) {
    const articlePath = path.join(TEXTS_DIR, topicId, 'variants', variantId, 'articles', `v${latestArticle}.md`);
    const content = fs.readFileSync(articlePath, 'utf-8');
    articlePreview = `
    <section class="block">
      <h2>本文（最新版 v${latestArticle}）</h2>
      ${illustrationBlock(basePath, topicId, variantId, latestArticle)}
      <article>${marked.parse(content)}</article>
    </section>`;
  }

  const body = `
  <nav class="back"><a href="${href(basePath, ['texts', topicId])}">&larr; ${escapeHtml(config.topic)} に戻る</a></nav>
  <h1>${escapeHtml(config.topic)} — ${escapeHtml(variant.level)} / ${escapeHtml(TIER_LABELS[variant.tier] || variant.tier)}</h1>
  <table>${variantRows}</table>
  <p>元になったアウトライン: ${outlineLink}</p>

  <h2>本文（Article）バージョン</h2>
  <div class="versions">${articleLinks}</div>

  ${articlePreview}
  `;
  return { title: `${config.topic} (${variant.level}/${TIER_LABELS[variant.tier] || variant.tier})`, body };
}

function renderArticle(basePath, topicId, variantId, version) {
  if (!isValidVariantId(topicId, variantId) || !/^\d+$/.test(String(version))) return null;
  const filePath = path.join(TEXTS_DIR, topicId, 'variants', variantId, 'articles', `v${version}.md`);
  if (!fs.existsSync(filePath)) return null;

  const config = readConfig(topicId);
  const variant = readVariantJson(topicId, variantId);
  const content = fs.readFileSync(filePath, 'utf-8');
  const versions = listArticleVersions(topicId, variantId);
  const versionLinks = versions
    .map((v) =>
      String(v) === String(version)
        ? `<a class="current" href="${href(basePath, ['texts', topicId, variantId, 'article', v])}">v${v}</a>`
        : `<a href="${href(basePath, ['texts', topicId, variantId, 'article', v])}">v${v}</a>`
    )
    .join(' ');

  const body = `
  <nav class="back"><a href="${href(basePath, ['texts', topicId, variantId])}">&larr; ${escapeHtml(config.topic)} (${escapeHtml(variant.level)}/${escapeHtml(TIER_LABELS[variant.tier] || variant.tier)}) に戻る</a></nav>
  <div class="versions">${versionLinks}</div>
  ${illustrationBlock(basePath, topicId, variantId, version)}
  <article>${marked.parse(content)}</article>
  `;
  return { title: `${config.topic} (${variant.level}/${TIER_LABELS[variant.tier] || variant.tier}, v${version})`, body };
}

function renderOutline(basePath, topicId, tier, version) {
  if (!isValidId(topicId) || !isValidTier(tier) || !/^\d+$/.test(String(version))) return null;
  const filePath = path.join(TEXTS_DIR, topicId, 'outlines', tier, `v${version}.md`);
  if (!fs.existsSync(filePath)) return null;

  const config = readConfig(topicId);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { content } = matter(raw);
  const versions = listOutlineVersions(topicId, tier);
  const versionLinks = versions
    .map((v) =>
      String(v) === String(version)
        ? `<a class="current" href="${href(basePath, ['texts', topicId, 'outline', tier, v])}">v${v}</a>`
        : `<a href="${href(basePath, ['texts', topicId, 'outline', tier, v])}">v${v}</a>`
    )
    .join(' ');

  const body = `
  <nav class="back"><a href="${href(basePath, ['texts', topicId])}">&larr; ${escapeHtml(config.topic)} に戻る</a></nav>
  <div class="versions">${versionLinks}</div>
  <article>${marked.parse(content)}</article>
  `;
  return { title: `アウトライン: ${config.topic} (${TIER_LABELS[tier] || tier}, v${version})`, body };
}

function renderSource(basePath, topicId, filename) {
  if (!isValidId(topicId) || !listSources(topicId).includes(filename)) return null;
  const filePath = path.join(TEXTS_DIR, topicId, 'sources', filename);

  const config = readConfig(topicId);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(raw);

  const meta = `
  <p class="meta">
    ${data.title ? `<strong>${escapeHtml(data.title)}</strong><br>` : ''}
    ${data.url ? `<a href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.url)}</a>` : ''}
  </p>`;

  const body = `
  <nav class="back"><a href="${href(basePath, ['texts', topicId])}">&larr; ${escapeHtml(config.topic)} に戻る</a></nav>
  <h1>${escapeHtml(filename)}</h1>
  ${meta}
  <article>${marked.parse(content)}</article>
  `;
  return { title: `${filename} - ${config.topic}`, body };
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
  listOutlineVersions,
  listArticleVersions,
  listSources,
  listVariants,
  isValidId,
  isValidVariantId,
  isValidTier,
  hasIllustration,
  resolveIllustrationVersion,
  illustrationBlock,
  readLevelSpecSection,
  listAllTexts,
  render404,
  renderIndex,
  renderLevels,
  renderTextDetail,
  renderVariantDetail,
  renderArticle,
  renderOutline,
  renderSource,
};
