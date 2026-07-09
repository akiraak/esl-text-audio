require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.openai.com/v1/images/generations';
const DEFAULT_MODEL = 'gpt-image-2';
const DEFAULT_SIZE = '1536x864'; // 16:9
const DEFAULT_QUALITY = 'medium';

async function main() {
  const [, , textDir, version, promptFile] = process.argv;
  if (!textDir || !version || !promptFile) {
    console.error('Usage: node scripts/generate-illustration.js <text-dir> <version> <prompt-file>');
    process.exit(1);
  }
  if (!/^\d+$/.test(version)) {
    console.error(`Invalid version: ${version} (must be a positive integer)`);
    process.exit(1);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set. Copy .env.example to .env and set your key.');
    process.exit(1);
  }
  const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL;
  const size = process.env.OPENAI_IMAGE_SIZE || DEFAULT_SIZE;
  const quality = process.env.OPENAI_IMAGE_QUALITY || DEFAULT_QUALITY;

  const prompt = fs.readFileSync(promptFile, 'utf-8').trim();
  if (!prompt) {
    console.error(`Prompt file is empty: ${promptFile}`);
    process.exit(1);
  }

  const outDir = path.join(textDir, 'images');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `v${version}.png`);

  console.log(`Generating illustration with model "${model}" (size ${size}, quality ${quality})...`);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`OpenAI API request failed (${res.status}): ${body}`);
    if (res.status === 404 || /model/i.test(body)) {
      console.error(`Hint: check that OPENAI_IMAGE_MODEL ("${model}") is a valid image model for your account.`);
    }
    process.exit(1);
  }

  const json = await res.json();
  const item = json.data && json.data[0];
  if (!item) {
    console.error(`Unexpected API response: ${JSON.stringify(json)}`);
    process.exit(1);
  }

  let buffer;
  if (item.b64_json) {
    buffer = Buffer.from(item.b64_json, 'base64');
  } else if (item.url) {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) {
      console.error(`Failed to download generated image from ${item.url} (${imgRes.status})`);
      process.exit(1);
    }
    buffer = Buffer.from(await imgRes.arrayBuffer());
  } else {
    console.error(`Response contained neither b64_json nor url: ${JSON.stringify(item)}`);
    process.exit(1);
  }

  fs.writeFileSync(outPath, buffer);
  console.log(`Saved illustration to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
