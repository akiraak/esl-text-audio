const path = require('path');
const express = require('express');
const site = require('./lib/site');

const PORT = process.env.PORT || 3020;
const BASE_PATH = ''; // ローカル開発サーバは常にルート配下で動作させる

const app = express();

// rendered の OGP 用フィールド（description / imageParts / ogType）から og を組み立てて返す。
// og:url / og:image は絶対URL必須のため、リクエストの origin を使う
function sendPage(req, res, rendered, status = 200) {
  const origin = `${req.protocol}://${req.get('host')}`;
  const og = {
    url: origin + req.originalUrl,
    image: rendered.imageParts ? origin + site.href(BASE_PATH, rendered.imageParts) : undefined,
    description: rendered.description,
    type: rendered.ogType,
  };
  res.status(status).send(site.layout(rendered.title, rendered.body, og));
}

function send404(req, res) {
  sendPage(req, res, site.render404(BASE_PATH), 404);
}

app.get('/', (req, res) => {
  sendPage(req, res, site.renderIndex(BASE_PATH));
});

app.get('/levels', (req, res) => {
  sendPage(req, res, site.renderLevels(BASE_PATH));
});

app.get('/topic-ideas', (req, res) => {
  sendPage(req, res, site.renderTopicIdeas(BASE_PATH));
});

app.get('/texts/:topicId', (req, res) => {
  const rendered = site.renderTextDetail(BASE_PATH, req.params.topicId);
  if (!rendered) return send404(req, res);
  sendPage(req, res, rendered);
});

app.get('/texts/:topicId/sources/:filename', (req, res) => {
  const rendered = site.renderSource(BASE_PATH, req.params.topicId, req.params.filename);
  if (!rendered) return send404(req, res);
  sendPage(req, res, rendered);
});

app.get('/texts/:topicId/:variantId', (req, res) => {
  const rendered = site.renderVariantDetail(BASE_PATH, req.params.topicId, req.params.variantId);
  if (!rendered) return send404(req, res);
  sendPage(req, res, rendered);
});

app.get('/texts/:topicId/:variantId/article/:version', (req, res) => {
  const rendered = site.renderArticle(BASE_PATH, req.params.topicId, req.params.variantId, req.params.version);
  if (!rendered) return send404(req, res);
  sendPage(req, res, rendered);
});

app.get('/texts/:topicId/:variantId/audio/:version.mp3', (req, res) => {
  const { topicId, variantId, version } = req.params;
  if (
    !site.isValidVariantId(topicId, variantId) ||
    !/^\d+$/.test(version) ||
    !site.hasAudio(topicId, variantId, version)
  ) {
    return send404(req, res);
  }
  res
    .type('audio/mpeg')
    .sendFile(path.join(site.TEXTS_DIR, topicId, 'variants', variantId, 'audio', `v${version}.mp3`));
});

app.get('/texts/:topicId/images/:version.png', (req, res) => {
  const { topicId, version } = req.params;
  if (
    !site.isValidId(topicId) ||
    !/^\d+$/.test(version) ||
    !site.hasIllustration(topicId, version)
  ) {
    return send404(req, res);
  }
  res.type('image/png').sendFile(path.join(site.TEXTS_DIR, topicId, 'images', `v${version}.png`));
});

app.use((req, res) => {
  send404(req, res);
});

app.listen(PORT, () => {
  console.log(`ESL text viewer server listening on http://localhost:${PORT}`);
});
