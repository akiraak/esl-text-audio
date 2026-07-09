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
