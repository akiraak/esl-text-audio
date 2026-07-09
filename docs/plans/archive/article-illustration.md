# 文章へのAI生成イラスト追加

## 目的・背景

TODO.md に記載済みのタスク。現状、生成されたESL学習用テキスト（`texts/{id}/articles/v{N}.md`）はテキストのみで、
ビューア（`server.js`）でも文字だけが表示される。読解の助けとイラスト付き教材としての魅力向上のため、
記事本文に対応するAI生成イラストを1枚追加し、ビューア上に表示できるようにする。

画像生成モデルは OpenAI の GPT Image 2 を利用する（利用者指定）。テキスト生成とは異なり、
Claude Code 自身がピクセルデータを生成することはできないため、この機能のみ実際に外部APIを呼び出す
Node スクリプトとして実装する（`workflows/*.md` に従い Claude Code が対話的に振る舞う既存方式とは異なる部分）。

## 対応方針

### スコープ

- 記事1本（`articles/v{N}.md`）につきイラスト1枚（記事全体を象徴する1枚。セクションごとの複数枚は対象外）
- パイプラインには自動的に組み込むが、実行するのは Claude Code（ワークフロー実行者）であり、画像生成API呼び出し自体は
  新設スクリプト `scripts/generate-illustration.js` が担う
- `brushup.md` での再生成時のイラスト更新は今回のスコープ外（TODO.md に将来課題として残す）

### パイプライン上の位置づけ

新規ワークフロー `workflows/illustrate.md` を追加し、本文が確定した時点（`requiresFactCheck: false` の場合は
`generate.md` 手順7完了時点、`true` の場合は `factcheck.md` 完了時点）で実行する。事実チェックより前にイラストを
生成すると、事実修正で本文の要点が変わった場合にイラストが内容と食い違う恐れがあるため、本文確定後に置く
（`brushup.md` の前提条件と同じタイミング）。

ワークフロー順序: `config.md` → (`research.md`) → `outline.md` → `generate.md` → (`factcheck.md`) →
**`illustrate.md`（新規）** → `brushup.md`

### イラストプロンプトの作成

- [personas/esl-writer.md](../../personas/esl-writer.md) のペルソナ（本文の主題・トーンを把握している）で、確定した本文から
  英語のイラストプロンプトを作成する
- スタイルを固定し一貫性を持たせるため、ベーススタイル記述（例: `clean flat-color digital illustration, soft palette,
  no text or letters in the image, no watermark`）を毎回プロンプト末尾に付与する
- 画像内に文字・レタリングを入れないよう明記する（AI画像生成は文字が乱れやすいため）
- `requiresFactCheck: true` の記事は実在人物・場所を写実的に描写せず、一般化した表現にとどめる
- 作成したプロンプトは `texts/{id}/images/v{N}.prompt.txt` に保存する（再生成・調整時の根拠として残す）

### スクリプト: `scripts/generate-illustration.js`

- 用法: `node scripts/generate-illustration.js <text-dir> <version> <prompt-file>`
  - 例: `node scripts/generate-illustration.js texts/water-cycle-20260708-101500 1 texts/water-cycle-20260708-101500/images/v1.prompt.txt`
- `.env` を [dotenv](https://www.npmjs.com/package/dotenv) で読み込み、`OPENAI_API_KEY`（必須）を使う
- モデル名・画像サイズ・画質は環境変数で上書き可能にする（`OPENAI_IMAGE_MODEL` 未指定時のデフォルト `gpt-image-2`、
  `OPENAI_IMAGE_SIZE` 未指定時のデフォルト `1024x1024`、`OPENAI_IMAGE_QUALITY` 未指定時のデフォルト `medium`）。
  指定モデル名がAPI側に存在しない場合はエラーメッセージに環境変数での変更方法を明示する
- Node 22 の組み込み `fetch` で `POST https://api.openai.com/v1/images/generations` を呼び、レスポンスの
  `data[0].b64_json`（無ければ `data[0].url` を取得してフェッチ）を `texts/{id}/images/v{N}.png` に保存する
- 保存先ディレクトリ（`images/`）が無ければ作成する
- APIエラー（認証失敗・コンテンツポリシー拒否・不正なモデル名など）はメッセージをそのまま標準エラー出力に出し、
  非ゼロ終了する

### ビューアへの表示（`server.js`)

- 新規ルート `GET /texts/:id/images/:version` — `images/v{version}.png` があればバイナリを `image/png` として返す。無ければ404
- `GET /texts/:id`（詳細ページ）: 最新バージョンの記事に対応するイラストがあれば本文プレビューの上に表示
- `GET /texts/:id/article/:version`（バージョン別ページ）: そのバージョンのイラストがあれば本文の上に表示
- イラストが存在しないバージョン（イラスト機能導入前の生成物、または生成失敗）は単に画像を表示しない（エラーにしない）
- レイアウトの `<style>` に画像用のスタイル（`max-width: 100%; border-radius`など）を追加

### 環境設定

- `package.json` に `dotenv` を依存追加
- `.env.example` を新規作成（`OPENAI_API_KEY=`, `OPENAI_IMAGE_MODEL=gpt-image-2`, `OPENAI_IMAGE_SIZE=1024x1024`）
- `.gitignore` に `.env` を追加
- 利用者は `.env.example` を `.env` にコピーし、自分の `OPENAI_API_KEY` を設定する（今回のタスクでは利用者側で実施済み・実施予定、
  実装側では手順を README に記載するのみ）

### ドキュメント更新

- `CLAUDE.md`:
  - ディレクトリ構成図に `images/`（`v1.png, v2.png, ...`、`illustrate.md` 実行後のみ作成）を追加
  - 「ワークフロー一覧（実行順）」に `illustrate.md` を追加（5番目 factcheck.md の後、旧6番目 brushup.md は7番目に繰り下げ）
  - 「トピックと英語レベルだけが送られてきた場合」の説明文にも `illustrate.md` を追加
- `README.md`: `.env` セットアップ手順（`OPENAI_API_KEY` の取得・設定）を追記

## 影響範囲

- 新規: `workflows/illustrate.md`, `scripts/generate-illustration.js`, `.env.example`
- 変更: `package.json`（`dotenv` 追加）, `package-lock.json`, `.gitignore`, `server.js`, `CLAUDE.md`, `README.md`
- 影響なし: `workflows/config.md`, `research.md`, `outline.md`, `generate.md`, `factcheck.md`, `brushup.md`（参照テキストの微修正を除き手順変更なし）
- `brushup.md` でのイラスト再生成は対象外（別タスクとして TODO.md に残す）

## テスト方針

- 自動テストは作らない（既存の `text-viewer-server.md` と同様、小規模なローカルツールのため）
- `OPENAI_API_KEY` は利用者が `.env` に設定する前提。設定後、実地で以下を確認する
  - 既存の生成物（例: `water-cycle-...`）に対しプロンプトを作成し、スクリプトを実行して `images/v{N}.png` が生成されること
  - 生成した画像がビューアの詳細ページ・記事ページに表示されること
  - イラスト未生成の既存記事でエラーにならず画像なしで表示されること
  - APIキー未設定時・不正なモデル名時にスクリプトが分かりやすいエラーを出すこと
- APIキーが用意できない場合は、スクリプトの実装・ドキュメント整備までを完了とし、実地確認は利用者がキー設定後に行う

## Phase

- [ ] Phase 1: `scripts/generate-illustration.js` 実装、`dotenv` 依存追加、`.env.example` 作成、`.gitignore` 更新
- [ ] Phase 2: `workflows/illustrate.md` 新規作成
- [ ] Phase 3: `server.js` に画像配信ルート・表示を追加
- [ ] Phase 4: `CLAUDE.md`（ディレクトリ構成・ワークフロー一覧）・`README.md` 更新
- [ ] Phase 5: 動作確認（`OPENAI_API_KEY` 設定後、既存生成物での実地確認。未設定の場合はコード整備のみで完了とし、確認手順を利用者に案内）
