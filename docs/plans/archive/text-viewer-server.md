# 生成したページを表示するWebサーバの作成

## 目的・背景

`texts/{topic-slug}-{YYYYMMDD-HHMMSS}/` 配下に生成された `config.json`・`outlines/v*.md`・`articles/v*.md`・（事実チェック対象の場合）`sources/*.md` を、
ブラウザで一覧・閲覧できるようにするローカル開発用Webサーバを作成する。TODO.md に記載済みのタスク。

現状これらの生成物は `texts/` ディレクトリ内のMarkdown/JSONファイルとしてしか存在せず、内容を確認するにはエディタでファイルを開く必要がある。
読解用テキストとして読みやすい見た目で確認できるようにし、あわせてアウトライン・ソース・configなど生成過程の情報も参照できるようにする。

音声生成・確認問題生成はまだ実装されていないため対象外（テキスト関連の表示のみ）。

## 対応方針

### 技術選定

- Node.js + Express によるシンプルなサーバ（ビルドステップなしのプレーンJS）。vibeboard も同スタックを採用しており、リポジトリの他の部分との一貫性がある
- ルートに独自の `package.json` を新規作成する（`vibeboard/` は degit vendor された別プロジェクトのため node_modules を共有しない）
- 依存パッケージ: `express`（サーバ）、`marked`（Markdown→HTML変換）、`gray-matter`（outlineファイル先頭のYAMLフロントマター解析）
- テンプレートエンジンは導入せず、テンプレートリテラルで最小限のHTMLを組み立てる

### ディレクトリ・ファイル構成

```
esl-text-audio/
├── package.json          # 新規作成
├── server.js             # サーバ本体
└── views/ 等は作らず server.js 内でHTML文字列を組み立てる（小規模なため）
```

### ルーティング設計

texts配下のディレクトリ名（`{topic-slug}-{YYYYMMDD-HHMMSS}`）をそのまま id として扱う。

- `GET /` — `texts/` 配下の生成物一覧（トピック名・レベル・ジャンル・作成日時・事実チェック要否を `config.json` から読み取り、作成日時降順で表示。各項目から詳細ページへリンク）
- `GET /texts/:id` — 詳細ページ。config情報、article/outline の存在バージョン一覧（ファイルシステムを都度読み取り、バージョン欠番があってもそのまま表示）、sources一覧（存在する場合）を表示し、最新バージョンのarticleを本文として表示する
- `GET /texts/:id/article/:version` — 指定バージョンのarticleをレンダリングして表示
- `GET /texts/:id/outline/:version` — 指定バージョンのoutlineをレンダリングして表示（フロントマターは除去して本文のみ表示）
- `GET /texts/:id/sources/:filename` — sourceファイルの内容を表示（フロントマターの url/title をヘッダー表示し、本文をそのまま表示）
- 存在しない id / version / filename は 404

### 表示方針

- ESL学習者が読むことを意識し、article本文は読みやすいフォントサイズ・行間で表示する
- 一覧・詳細ページはCLAUDE.md記載のディレクトリ構成に対応する最小限の情報のみ表示し、過度な装飾はしない
- ダークモード等は対象外（ローカル開発用の最小限のビューア）

### 起動方法

- `npm start` で起動（デフォルトポート 3020。vibeboard が 3010 を使うため重複を避ける）
- ポートは `PORT` 環境変数で変更可能にする

## 影響範囲

- 新規ファイル: `package.json`, `package-lock.json`, `server.js`
- `.gitignore` に `node_modules/` を追記（ルートに新設するため）
- `README.md` に起動方法を追記

## テスト方針

- 自動テストは作らない（小規模な表示専用サーバのため）
- 実装後、サーバを起動し `curl` で一覧ページ・詳細ページ・article/outline/sourcesの各ルート・404ケースを実地確認する
- 既存の生成物（`lost-while-traveling-...`, `water-cycle-...`）が正しく表示されることを確認する

## Phase

- [ ] Phase 1: `package.json` 作成・依存パッケージ導入（express, marked, gray-matter）、`.gitignore` 更新
- [ ] Phase 2: `server.js` 実装（一覧ページ・詳細ページ・article/outline/sourcesルーティング）
- [ ] Phase 3: 起動スクリプト整備・README追記
- [ ] Phase 4: 動作確認（既存生成物での一覧・詳細・各ルート・404ケースの実地確認）
