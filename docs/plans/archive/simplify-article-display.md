# 記事表示を見やすくシンプルにする

## 目的・背景

TODO.md 記載のタスク。現状 `lib/site.js` の記事関連ページ（`renderVariantDetail` / `renderArticle`）は、
「トピック名 — レベル / 長さ」を1つのH1にまとめて表示しており、本文自体が持つタイトル（H1）と二重になっている。
また「戻る」リンク1本だけのナビゲーションで、階層（Home → トピック → バリアント）が分かりにくい。
作成者（生成に使ったAIモデル）や作成日といった情報も現状記録されておらず、表示できない。

利用者からの要望は以下の要素を、記事ページ上で分かりやすい順に表示すること。

1. パンくずリンク（表示方法を検討する）
2. タイトル（難易度と長さは一緒に表示しない）
3. 難易度と長さ
4. 作成者（Claude Sonnet 5 などのAIモデル）
5. 作成日
6. イラスト
7. 本文

## 対応方針

### データモデルの変更

- 記事バージョンファイル（`variants/{level}-{tier}/articles/v{N}.md`）の先頭に YAML frontmatter を追加し、
  そのバージョンを生成した `aiModel`（例: `Claude Sonnet 5`）と `createdAt`（ISO日時）を記録する
  - 既存の `sources/*.md` と同様、`gray-matter` で読み書きする（新規依存追加なし）
  - バージョンごとに記録することで、brushup で再生成した際にモデルや日時が変わっても正しく追従する
- 既存の生成済み記事（3トピック・8バージョン）に frontmatter を後付けする
  - `aiModel: Claude Sonnet 5`（このリポジトリでの生成に一貫して使われているモデル）
  - `createdAt` は対応する `variant.json` の `createdAt`（`lost-while-traveling` の v2 のみ日時不明のため v1 と同じ日付を暫定使用し、コメントなどは付けない）
- `workflows/generate.md` 手順8・`workflows/brushup.md` 手順9 に frontmatter 付与を明記する

### `lib/site.js` の表示ロジック変更

- 共通ヘルパーを追加
  - `breadcrumb(basePath, items)`: `items` は `{label, parts}` の配列（最後の要素はリンクなし・現在地表示）。全ページの `nav.back` を置き換える
    - Index: なし（トップページ扱い）
    - Levels: `Home > About CEFR Levels`
    - トピック詳細: `Home > {topic}`
    - バリアント詳細: `Home > {topic} > {level} / {tier}`
    - 記事ページ: `Home > {topic} > {level} / {tier} > v{N}`
    - ソース詳細: `Home > {topic} > {source title}`
  - `readArticleMeta(topicId, variantId, version)`: `gray-matter` で frontmatter（`aiModel`/`createdAt`）と本文を分離して返す
  - `splitTitle(content)`: 本文先頭の `# Title` 行を取り出し、`{ title, rest }` を返す（`rest` を本文としてレンダリング）
- `renderArticle`（メインの記事閲覧ページ）を新しい順序で再構成する
  - breadcrumb → 抽出したタイトル(H1) → レベル・長さバッジ（別要素、タイトルに混ぜない）→ 作成者・作成日 → イラスト → 本文（タイトル行を除いた残り）
- `renderVariantDetail` はメタ情報（レベル・長さ・目標語数・バージョン一覧へのリンク）に留め、記事本文のプレビュー埋め込みを削除する
  （本文を読む導線は `renderArticle` に一本化し、二重表示をなくす）
- `renderTextDetail` / `renderSource` / `renderLevels` / `render404` の `nav.back` も `breadcrumb` に置き換える
- `layout()` のCSSに breadcrumb・レベル/長さバッジ・作成者/作成日メタ行のスタイルを追加する

## 影響範囲

- `lib/site.js`（表示ロジック本体）
- `workflows/generate.md`, `workflows/brushup.md`（frontmatter付与の明記）
- `texts/*/variants/*/articles/v*.md`（既存8ファイルへのfrontmatter後付け）
- `server.js` / `scripts/build-static-site.js` はルート変更なし（呼び出しシグネチャは変えない）

## テスト方針

- 自動テストなし（既存方針を踏襲）
- 実装後、`npm start` でローカルサーバを起動し、`curl` で以下を確認する
  - トップページ・レベル説明ページ・トピック詳細・バリアント詳細・記事ページ・ソース詳細のそれぞれでパンくずが正しく表示される
  - 記事ページでタイトル・レベル/長さ・作成者/作成日・イラスト・本文の順で表示され、二重タイトルが解消されている
  - 既存記事8バージョン全てで frontmatter が正しく読み込め、表示が崩れない
- `npm run build` で静的ビルドが通ることを確認する

## Phase

- [ ] Phase 1: 記事frontmatter（`aiModel`/`createdAt`）の設計・既存8ファイルへの後付け、ワークフロー文書の更新
- [ ] Phase 2: `lib/site.js` に breadcrumb・タイトル分離・作成者/作成日表示を実装（CSS含む）
- [ ] Phase 3: 動作確認（`npm start` + `curl` 一式、`npm run build`）
