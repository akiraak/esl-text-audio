const fs = require('fs');
const path = require('path');
const site = require('../lib/site');

const OUT_DIR = path.join(__dirname, '..', 'dist');

function resolveBasePath() {
  if (process.env.PAGES_BASE_PATH !== undefined) return process.env.PAGES_BASE_PATH;
  if (process.env.GITHUB_REPOSITORY) {
    const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
    return `/${repo}`;
  }
  return '';
}

function writeHtml(relPath, title, body) {
  const filePath = path.join(OUT_DIR, relPath, 'index.html');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, site.layout(title, body), 'utf-8');
}

function build() {
  const basePath = resolveBasePath();
  console.log(`Building static site with basePath="${basePath}" into ${OUT_DIR}`);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, '.nojekyll'), '');

  const index = site.renderIndex(basePath);
  writeHtml('', index.title, index.body);

  const levels = site.renderLevels(basePath);
  writeHtml('levels', levels.title, levels.body);

  const topicIdeas = site.renderTopicIdeas(basePath);
  writeHtml('topic-ideas', topicIdeas.title, topicIdeas.body);

  const notFound = site.render404(basePath);
  fs.writeFileSync(path.join(OUT_DIR, '404.html'), site.layout(notFound.title, notFound.body), 'utf-8');

  for (const { id } of site.listAllTexts()) {
    const detail = site.renderTextDetail(basePath, id);
    writeHtml(`texts/${id}`, detail.title, detail.body);

    for (const filename of site.listSources(id)) {
      const rendered = site.renderSource(basePath, id, filename);
      writeHtml(`texts/${id}/sources/${filename}`, rendered.title, rendered.body);
    }

    for (const { variantId } of site.listVariants(id)) {
      const variantDetail = site.renderVariantDetail(basePath, id, variantId);
      writeHtml(`texts/${id}/${variantId}`, variantDetail.title, variantDetail.body);

      for (const version of site.listArticleVersions(id, variantId)) {
        const rendered = site.renderArticle(basePath, id, variantId, version);
        writeHtml(`texts/${id}/${variantId}/article/${version}`, rendered.title, rendered.body);
      }
    }

    const imagesDir = path.join(site.TEXTS_DIR, id, 'images');
    if (fs.existsSync(imagesDir)) {
      const outImagesDir = path.join(OUT_DIR, 'texts', id, 'images');
      fs.mkdirSync(outImagesDir, { recursive: true });
      for (const file of fs.readdirSync(imagesDir)) {
        const match = file.match(/^v(\d+)\.png$/);
        if (!match) continue;
        fs.copyFileSync(path.join(imagesDir, file), path.join(outImagesDir, `${match[1]}.png`));
      }
    }
  }

  console.log('Static site build complete.');
}

build();
