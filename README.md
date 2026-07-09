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

## GitHub Pages への公開

`texts/` 配下の生成物は、`main` への push のたびに GitHub Actions（[.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)）が
静的HTMLをビルドして GitHub Pages に自動デプロイする。

```bash
npm run build
```

で `dist/`（gitignore対象）に静的サイトを生成できる。ローカルで動作確認する場合、GitHub Pagesはプロジェクトページ
（`https://<user>.github.io/<repo>/` のようなサブパス）として配信されるため、`PAGES_BASE_PATH` 環境変数でリンク生成時の
ベースパスを指定できる（未指定時は `GITHUB_REPOSITORY` 環境変数から自動算出、どちらも無ければ空文字＝ルート配下）。

初回のみ、GitHubリポジトリの Settings → Pages → Source で `GitHub Actions` を選択する必要がある。

## イラスト生成（GPT Image 2）のセットアップ

[workflows/illustrate.md](workflows/illustrate.md) で本文に対応するイラストを生成するには、OpenAI の API キーが必要。

```bash
cp .env.example .env
# .env を編集し OPENAI_API_KEY を設定する
```

`.env` は `OPENAI_IMAGE_MODEL`（デフォルト `gpt-image-2`）・`OPENAI_IMAGE_SIZE`（デフォルト `1536x864`、16:9）・
`OPENAI_IMAGE_QUALITY`（デフォルト `medium`。`low` / `medium` / `high` / `auto`）でも上書きできる。
`.env` はコミットしない（`.gitignore` 対象）。
