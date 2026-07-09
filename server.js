const fs = require('fs');
const path = require('path');
const express = require('express');
const matter = require('gray-matter');
const { marked } = require('marked');

const TEXTS_DIR = path.join(__dirname, 'texts');
const LEVEL_SPEC_PATH = path.join(__dirname, 'docs', 'specs', 'esl-level-spec.md');
const PORT = process.env.PORT || 3020;

const app = express();

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; max-width: 760px; margin: 2rem auto; padding: 0 1.5rem; color: #222; }
  a { color: #0a5cb8; }
  .meta { color: #555; font-size: 0.9rem; margin-bottom: 1rem; }
  .meta span { margin-right: 1rem; }
  ul.text-list { list-style: none; padding: 0; }
  ul.text-list li { padding: 0.75rem 0; border-bottom: 1px solid #eee; }
  ul.text-list .topic { font-size: 1.1rem; font-weight: 600; }
  .badge { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 4px; background: #eee; font-size: 0.8rem; margin-left: 0.5rem; }
  .versions { margin: 1rem 0; }
  .versions a { margin-right: 0.75rem; }
  .versions a.current { font-weight: bold; text-decoration: none; color: #222; }
  .sources-list { margin: 1rem 0; }
  article { font-size: 1.15rem; line-height: 1.9; }
  article h1 { font-size: 1.6rem; }
  nav.back { margin-bottom: 1.5rem; }
  section.block { margin: 2rem 0; padding-top: 1rem; border-top: 1px solid #eee; }
  hr { border: none; border-top: 1px solid #eee; margin: 2rem 0; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function readConfig(id) {
  const configPath = path.join(TEXTS_DIR, id, 'config.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

function listVersions(id, subdir) {
  const dir = path.join(TEXTS_DIR, id, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((f) => f.match(/^v(\d+)\.md$/))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

function listSources(id) {
  const dir = path.join(TEXTS_DIR, id, 'sources');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
}

function isValidId(id) {
  return /^[A-Za-z0-9._-]+$/.test(id) && fs.existsSync(path.join(TEXTS_DIR, id, 'config.json'));
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

app.get('/', (req, res) => {
  const texts = listAllTexts();
  const items = texts
    .map(({ id, config }) => {
      const factCheck = config.requiresFactCheck ? '事実チェック対象' : '事実チェック対象外';
      return `<li>
        <div class="topic"><a href="/texts/${encodeURIComponent(id)}">${escapeHtml(config.topic)}</a></div>
        <div class="meta">
          <span>${escapeHtml(config.level)}</span>
          <span>${escapeHtml(config.genre)}</span>
          <span>${escapeHtml(config.wordCountTarget || '')}</span>
          <span>${escapeHtml(config.createdAt)}</span>
          <span class="badge">${factCheck}</span>
        </div>
      </li>`;
    })
    .join('\n');

  const body = `
  <h1>ESL生成テキスト一覧</h1>
  <p><a href="/levels">レベル（CEFR）についての説明</a></p>
  ${texts.length === 0 ? '<p>まだ生成物がありません。</p>' : `<ul class="text-list">${items}</ul>`}
  `;
  res.send(layout('ESL生成テキスト一覧', body));
});

app.get('/levels', (req, res) => {
  const section = readLevelSpecSection();
  const body = `
  <nav class="back"><a href="/">&larr; 一覧に戻る</a></nav>
  <h1>レベル（CEFR）についての説明</h1>
  <article>${marked.parse(section)}</article>
  `;
  res.send(layout('レベル（CEFR）についての説明', body));
});

app.get('/texts/:id', (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(404).send(layout('Not Found', '<h1>404 Not Found</h1>'));

  const config = readConfig(id);
  const articleVersions = listVersions(id, 'articles');
  const outlineVersions = listVersions(id, 'outlines');
  const sources = listSources(id);
  const latestArticle = articleVersions[articleVersions.length - 1];

  const configRows = [
    ['トピック', config.topic],
    ['トピックスラッグ', config.topicSlug],
    ['作成日時', config.createdAt],
    ['レベル', config.level],
    ['ジャンル', config.genre],
    ['語数目安', config.wordCountTarget],
    ['事実チェック対象', config.requiresFactCheck ? 'はい' : 'いいえ'],
    ['事実チェック対象外理由', config.factCheckExemptionReason || '-'],
  ]
    .map(([k, v]) => `<tr><th align="left">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join('\n');

  const articleLinks = articleVersions.length
    ? articleVersions
        .map((v) => `<a href="/texts/${encodeURIComponent(id)}/article/${v}">v${v}</a>`)
        .join(' ')
    : '<em>なし</em>';

  const outlineLinks = outlineVersions.length
    ? outlineVersions
        .map((v) => `<a href="/texts/${encodeURIComponent(id)}/outline/${v}">v${v}</a>`)
        .join(' ')
    : '<em>なし</em>';

  const sourceLinks = sources.length
    ? `<ul class="sources-list">${sources
        .map(
          (f) =>
            `<li><a href="/texts/${encodeURIComponent(id)}/sources/${encodeURIComponent(f)}">${escapeHtml(f)}</a></li>`
        )
        .join('\n')}</ul>`
    : '<p><em>なし</em></p>';

  let articlePreview = '';
  if (latestArticle !== undefined) {
    const articlePath = path.join(TEXTS_DIR, id, 'articles', `v${latestArticle}.md`);
    const content = fs.readFileSync(articlePath, 'utf-8');
    articlePreview = `
    <section class="block">
      <h2>本文（最新版 v${latestArticle}）</h2>
      <article>${marked.parse(content)}</article>
    </section>`;
  }

  const body = `
  <nav class="back"><a href="/">&larr; 一覧に戻る</a></nav>
  <h1>${escapeHtml(config.topic)}</h1>
  <table>${configRows}</table>

  <h2>本文（Article）バージョン</h2>
  <div class="versions">${articleLinks}</div>

  <h2>アウトライン（Outline）バージョン</h2>
  <div class="versions">${outlineLinks}</div>

  <h2>参考資料（Sources）</h2>
  ${sourceLinks}

  ${articlePreview}
  `;
  res.send(layout(config.topic, body));
});

app.get('/texts/:id/article/:version', (req, res) => {
  const { id, version } = req.params;
  if (!isValidId(id) || !/^\d+$/.test(version)) {
    return res.status(404).send(layout('Not Found', '<h1>404 Not Found</h1>'));
  }
  const filePath = path.join(TEXTS_DIR, id, 'articles', `v${version}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).send(layout('Not Found', '<h1>404 Not Found</h1>'));

  const config = readConfig(id);
  const content = fs.readFileSync(filePath, 'utf-8');
  const versions = listVersions(id, 'articles');
  const versionLinks = versions
    .map((v) =>
      String(v) === version
        ? `<a class="current" href="/texts/${encodeURIComponent(id)}/article/${v}">v${v}</a>`
        : `<a href="/texts/${encodeURIComponent(id)}/article/${v}">v${v}</a>`
    )
    .join(' ');

  const body = `
  <nav class="back"><a href="/texts/${encodeURIComponent(id)}">&larr; ${escapeHtml(config.topic)} に戻る</a></nav>
  <div class="versions">${versionLinks}</div>
  <article>${marked.parse(content)}</article>
  `;
  res.send(layout(`${config.topic} (v${version})`, body));
});

app.get('/texts/:id/outline/:version', (req, res) => {
  const { id, version } = req.params;
  if (!isValidId(id) || !/^\d+$/.test(version)) {
    return res.status(404).send(layout('Not Found', '<h1>404 Not Found</h1>'));
  }
  const filePath = path.join(TEXTS_DIR, id, 'outlines', `v${version}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).send(layout('Not Found', '<h1>404 Not Found</h1>'));

  const config = readConfig(id);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { content } = matter(raw);
  const versions = listVersions(id, 'outlines');
  const versionLinks = versions
    .map((v) =>
      String(v) === version
        ? `<a class="current" href="/texts/${encodeURIComponent(id)}/outline/${v}">v${v}</a>`
        : `<a href="/texts/${encodeURIComponent(id)}/outline/${v}">v${v}</a>`
    )
    .join(' ');

  const body = `
  <nav class="back"><a href="/texts/${encodeURIComponent(id)}">&larr; ${escapeHtml(config.topic)} に戻る</a></nav>
  <div class="versions">${versionLinks}</div>
  <article>${marked.parse(content)}</article>
  `;
  res.send(layout(`アウトライン: ${config.topic} (v${version})`, body));
});

app.get('/texts/:id/sources/:filename', (req, res) => {
  const { id, filename } = req.params;
  if (!isValidId(id) || !listSources(id).includes(filename)) {
    return res.status(404).send(layout('Not Found', '<h1>404 Not Found</h1>'));
  }
  const filePath = path.join(TEXTS_DIR, id, 'sources', filename);

  const config = readConfig(id);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(raw);

  const meta = `
  <p class="meta">
    ${data.title ? `<strong>${escapeHtml(data.title)}</strong><br>` : ''}
    ${data.url ? `<a href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.url)}</a>` : ''}
  </p>`;

  const body = `
  <nav class="back"><a href="/texts/${encodeURIComponent(id)}">&larr; ${escapeHtml(config.topic)} に戻る</a></nav>
  <h1>${escapeHtml(filename)}</h1>
  ${meta}
  <article>${marked.parse(content)}</article>
  `;
  res.send(layout(`${filename} - ${config.topic}`, body));
});

app.use((req, res) => {
  res.status(404).send(layout('Not Found', '<h1>404 Not Found</h1><p><a href="/">&larr; 一覧に戻る</a></p>'));
});

app.listen(PORT, () => {
  console.log(`ESL text viewer server listening on http://localhost:${PORT}`);
});
