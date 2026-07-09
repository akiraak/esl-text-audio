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

## イラスト生成（GPT Image 2）のセットアップ

[workflows/illustrate.md](workflows/illustrate.md) で本文に対応するイラストを生成するには、OpenAI の API キーが必要。

```bash
cp .env.example .env
# .env を編集し OPENAI_API_KEY を設定する
```

`.env` は `OPENAI_IMAGE_MODEL`（デフォルト `gpt-image-2`）・`OPENAI_IMAGE_SIZE`（デフォルト `1536x864`、16:9）・
`OPENAI_IMAGE_QUALITY`（デフォルト `medium`。`low` / `medium` / `high` / `auto`）でも上書きできる。
`.env` はコミットしない（`.gitignore` 対象）。
