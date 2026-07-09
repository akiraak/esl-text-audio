const path = require('path');
const express = require('express');
const site = require('./lib/site');

const PORT = process.env.PORT || 3020;
const BASE_PATH = ''; // ローカル開発サーバは常にルート配下で動作させる

const app = express();

app.get('/', (req, res) => {
  const { title, body } = site.renderIndex(BASE_PATH);
  res.send(site.layout(title, body));
});

app.get('/levels', (req, res) => {
  const { title, body } = site.renderLevels(BASE_PATH);
  res.send(site.layout(title, body));
});

app.get('/texts/:id', (req, res) => {
  const rendered = site.renderTextDetail(BASE_PATH, req.params.id);
  if (!rendered) {
    const { title, body } = site.render404(BASE_PATH);
    return res.status(404).send(site.layout(title, body));
  }
  res.send(site.layout(rendered.title, rendered.body));
});

app.get('/texts/:id/article/:version', (req, res) => {
  const rendered = site.renderArticle(BASE_PATH, req.params.id, req.params.version);
  if (!rendered) {
    const { title, body } = site.render404(BASE_PATH);
    return res.status(404).send(site.layout(title, body));
  }
  res.send(site.layout(rendered.title, rendered.body));
});

app.get('/texts/:id/images/:version.png', (req, res) => {
  const { id, version } = req.params;
  if (!site.isValidId(id) || !/^\d+$/.test(version) || !site.hasIllustration(id, version)) {
    const { title, body } = site.render404(BASE_PATH);
    return res.status(404).send(site.layout(title, body));
  }
  res.type('image/png').sendFile(path.join(site.TEXTS_DIR, id, 'images', `v${version}.png`));
});

app.get('/texts/:id/outline/:version', (req, res) => {
  const rendered = site.renderOutline(BASE_PATH, req.params.id, req.params.version);
  if (!rendered) {
    const { title, body } = site.render404(BASE_PATH);
    return res.status(404).send(site.layout(title, body));
  }
  res.send(site.layout(rendered.title, rendered.body));
});

app.get('/texts/:id/sources/:filename', (req, res) => {
  const rendered = site.renderSource(BASE_PATH, req.params.id, req.params.filename);
  if (!rendered) {
    const { title, body } = site.render404(BASE_PATH);
    return res.status(404).send(site.layout(title, body));
  }
  res.send(site.layout(rendered.title, rendered.body));
});

app.use((req, res) => {
  const { title, body } = site.render404(BASE_PATH);
  res.status(404).send(site.layout(title, body));
});

app.listen(PORT, () => {
  console.log(`ESL text viewer server listening on http://localhost:${PORT}`);
});
