# esl-text-audio
Generate ESL reading texts, listening audio, and comprehension questions for English learners.

## 生成テキストの閲覧サーバ

`texts/` 配下に生成済みのテキスト（config / outline / article / sources）を一覧・閲覧できるローカルサーバ。

```bash
npm install
npm start
# もしくは
./run-viewer.sh
```

`http://localhost:3020` で一覧を表示する（ポートは `PORT` 環境変数または `--port` で変更可能）。
`run-viewer.sh` は `node_modules` が無ければ `npm install` を実行し、同じportを握っている既存サーバがあれば停止してから起動する。

## 公開サイト（esltext.chobi.me）

`texts/` 配下の生成物は https://esltext.chobi.me/ で公開している（自宅サーバ g3plus、`~/g3plus-ops` 管理）。
サーバ側の cron（15分おき）が `main` への push を検知して静的サイトを自動再ビルドするため、push するだけで反映される。
詳細は [docs/plans/archive/esltext-chobi-me-deploy.md](docs/plans/archive/esltext-chobi-me-deploy.md) を参照。

```bash
npm run build
```

で `dist/`（gitignore対象）に静的サイトを生成できる。リンク生成時のベースパスは `PAGES_BASE_PATH` 環境変数
（未指定時は空文字＝ルート配下）、OGPタグの絶対URLに使うoriginは `SITE_ORIGIN` 環境変数（未指定時は絶対URLタグを省略）で指定できる。

## イラスト生成（GPT Image 2）のセットアップ

[workflows/illustrate.md](workflows/illustrate.md) で本文に対応するイラストを生成するには、OpenAI の API キーが必要。

```bash
cp .env.example .env
# .env を編集し OPENAI_API_KEY を設定する
```

`.env` は `OPENAI_IMAGE_MODEL`（デフォルト `gpt-image-2`）・`OPENAI_IMAGE_SIZE`（デフォルト `1536x864`、16:9）・
`OPENAI_IMAGE_QUALITY`（デフォルト `medium`。`low` / `medium` / `high` / `auto`）でも上書きできる。
`.env` はコミットしない（`.gitignore` 対象）。
