# Webデザイン候補の作成・選定

## 目的・背景

現状 `lib/site.js` の `layout()` は単一の簡素なCSS（罫線・最低限の配色のみ）しか持たず、見た目の検討がまだ行われていない。
TODO.md 記載の「Webのデザインを入れる」「デザイン候補をいくつも生成いてそこから決める」に対応し、
複数のデザイン案をローカルサーバ (`server.js`) 上で実データ（`texts/` 配下の既存生成物）を使って見比べ、
利用者が1つを選べる状態を作る。

このタスクの範囲は「デザイン候補を作り、選べるようにする」ところまで。選定後にそのデザインを正式なデフォルトとして
GitHub Pages 静的ビルド（`scripts/build-static-site.js`）にも適用する作業は別タスクとする。

## 対応方針

### 技術選定

- 既存構成（テンプレートエンジンなし・テンプレートリテラルでHTML組み立て）を踏襲する
- HTML構造（クラス名）は変更せず、CSSのみをテーマ単位で切り替えられるようにする
  - `lib/site.js` の `renderXxx()` 系関数はテーマに依存しない body HTML を返す方針のまま維持し、`layout()` 側でCSSを差し替える
- テーマ定義は新規ファイル `lib/design-themes.js` に集約する（`{ id, name, description, css }` の配列）

### テーマ候補（5種類）

ESL学習者が読解用テキストを読むページであることを踏まえ、読みやすさを軸にしつつ方向性の異なる案を用意する。

1. `minimal` — 現行踏襲・微調整（白背景、青リンク、罫線ベース）
2. `editorial` — 雑誌/書籍的、セリフ体、生成り色の背景、読解に集中できる配色
3. `card` — カード型モダンUI、影・角丸、アクセントカラー、一覧をカードで見せる
4. `dark` — ダークモード、夜間読書向け高コントラスト
5. `playful` — ESL学習者向けに親しみやすい配色・丸みのあるバッジ（CEFRレベルを色分け）

### 切り替え方法

- `server.js` の各ルートで `?design=<id>` クエリパラメータを受け取り、`site.layout(title, body, { theme, basePath, currentPath })` に渡す
- `layout()` はテーマ未指定時 `minimal` をデフォルトとする（`scripts/build-static-site.js` は `design` を渡さないため現状の見た目を維持）
- ページ上部に小さなテーマ切り替えバー（現在のパスを保ったまま `?design=` だけ変えるリンク集）を表示し、実データのページを見ながらテーマを切り替えられるようにする
  - 切り替えバー自体はどのテーマでも視認できるよう独立したインラインスタイルにする
- `GET /designs` に一覧ページを追加し、各テーマの説明と「一覧ページで見る」「サンプル記事で見る」リンクを表示する

## 影響範囲

- 新規: `lib/design-themes.js`
- 変更: `lib/site.js`（`layout()` のシグネチャ拡張、`renderDesignGallery()` 追加）
- 変更: `server.js`（`design` クエリの受け渡し、`/designs` ルート追加）
- `scripts/build-static-site.js` は変更なし（`design` を渡さず現状の見た目のまま）

## テスト方針

- 自動テストは作らない（表示専用・小規模なため）
- 実装後、`npm start` でサーバを起動し、`/designs` および `/?design=<各id>`、既存生成物の詳細/記事ページで各テーマが崩れず表示されることを目視確認する
- 既存ルート（`design` クエリなし）が従来通り `minimal` テーマで表示されることを確認する

## Phase

- [x] Phase 1: `lib/design-themes.js` 作成（5テーマ分のCSS定義）
- [x] Phase 2: `lib/site.js` の `layout()` 拡張・`renderDesignGallery()` 追加
- [x] Phase 3: `server.js` にテーマ切り替え・`/designs` ルートを追加
- [x] Phase 4: 実地確認（各テーマ・一覧/詳細/記事ページ・切り替えバー・`/designs`）

## 選定結果・後片付け（2026-07-09）

利用者が5候補のうち **Playful** を選定。選定後、比較用の仕組み（`lib/design-themes.js` の複数テーマ定義、
`layout()` のテーマ切り替え・スイッチャーバー、`server.js` の `design` クエリ処理、`/designs` ルート）は役目を終えたため撤去し、
Playful のCSSを `lib/site.js` の `layout()` に直接ベタ書きして唯一のデザインとして確定した。
`scripts/build-static-site.js` は変更不要のままPlayfulデザインの静的サイトを出力するようになった。
