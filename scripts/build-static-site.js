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

// OGPのog:url/og:imageに使う公開サイトのorigin。不明な場合は空を返し、絶対URLが必要なタグは省略する
function resolveSiteOrigin() {
  if (process.env.SITE_ORIGIN !== undefined) return process.env.SITE_ORIGIN;
  if (process.env.GITHUB_REPOSITORY) {
    const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
    return `https://${owner}.github.io`;
  }
  return '';
}

let basePath = '';
let siteOrigin = '';

function writeHtml(relPath, rendered) {
  const filePath = path.join(OUT_DIR, relPath, 'index.html');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const og = siteOrigin
    ? {
        url: `${siteOrigin}${basePath}/${relPath.split('/').filter(Boolean).map(encodeURIComponent).join('/')}${relPath ? '/' : ''}`,
        image: rendered.imageParts ? siteOrigin + site.href(basePath, rendered.imageParts) : undefined,
        description: rendered.description,
        type: rendered.ogType,
      }
    : { description: rendered.description, type: rendered.ogType };
  fs.writeFileSync(filePath, site.layout(rendered.title, rendered.body, og), 'utf-8');
}

function build() {
  basePath = resolveBasePath();
  siteOrigin = resolveSiteOrigin();
  console.log(`Building static site with basePath="${basePath}" siteOrigin="${siteOrigin}" into ${OUT_DIR}`);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, '.nojekyll'), '');

  writeHtml('', site.renderIndex(basePath));
  writeHtml('levels', site.renderLevels(basePath));
  writeHtml('topic-ideas', site.renderTopicIdeas(basePath));

  const notFound = site.render404(basePath);
  fs.writeFileSync(path.join(OUT_DIR, '404.html'), site.layout(notFound.title, notFound.body), 'utf-8');

  for (const { id } of site.listAllTexts()) {
    writeHtml(`texts/${id}`, site.renderTextDetail(basePath, id));

    for (const filename of site.listSources(id)) {
      writeHtml(`texts/${id}/sources/${filename}`, site.renderSource(basePath, id, filename));
    }

    for (const { variantId } of site.listVariants(id)) {
      writeHtml(`texts/${id}/${variantId}`, site.renderVariantDetail(basePath, id, variantId));

      for (const version of site.listArticleVersions(id, variantId)) {
        writeHtml(`texts/${id}/${variantId}/article/${version}`, site.renderArticle(basePath, id, variantId, version));
      }

      const audioDir = path.join(site.TEXTS_DIR, id, 'variants', variantId, 'audio');
      if (fs.existsSync(audioDir)) {
        const outAudioDir = path.join(OUT_DIR, 'texts', id, variantId, 'audio');
        fs.mkdirSync(outAudioDir, { recursive: true });
        for (const file of fs.readdirSync(audioDir)) {
          const match = file.match(/^v(\d+)\.mp3$/);
          if (!match) continue;
          fs.copyFileSync(path.join(audioDir, file), path.join(outAudioDir, `${match[1]}.mp3`));
        }
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
