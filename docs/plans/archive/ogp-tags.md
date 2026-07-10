# GitHub Pages に OGP タグを設定

## 目的・背景

生成テキストのページを SNS・チャットで共有したときに、タイトル・説明文・イラストのプレビューカードが
表示されるよう、公開サイトの各ページに OGP（Open Graph Protocol）メタタグを設定する。

- 公開URL: `https://akiraak.github.io/esl-text-audio/`
- イラストは全トピックで 1536x864（16:9）のため、Twitter カードは `summary_large_image` が適する

## 対応方針

### lib/site.js

1. `layout(title, body, og)` に第3引数 `og`（省略可）を追加し、`<head>` に以下を出力する
   - `og:site_name`（固定: "ESL Generated Texts"）・`og:title`・`og:type`（デフォルト `website`）
   - `og:url`（`og.url` があれば）
   - `meta name="description"` と `og:description`（`og.description` があれば）
   - `og:image`（`og.image` があれば）と `twitter:card`（画像あり: `summary_large_image` / なし: `summary`）
2. 各 `render*` 関数の戻り値に OGP 用フィールドを追加する（すべて省略可）
   - `description`: ページの説明文
     - 一覧・レベル・トピックアイデア・ソース: 固定文またはトピック名ベースの文
     - バリアント詳細・記事ページ: 本文 Markdown 冒頭からプレーンテキスト抜粋（~160字）を生成
   - `imageParts`: OGP 画像の `href()` 用パスセグメント（トピックのイラストがある場合のみ）
   - `ogType`: 記事系ページは `article`、それ以外は省略（= `website`）
   - Markdown からの抜粋生成用ヘルパー `excerpt()` を追加する
3. og:url / og:image は**絶対URL必須**のため、絶対URLの組み立ては呼び出し側
   （build-static-site.js / server.js）が origin を知っている前提で行う

### scripts/build-static-site.js

- サイト origin の解決関数を追加: `SITE_ORIGIN` 環境変数 → `GITHUB_REPOSITORY` の owner から
  `https://{owner}.github.io` → どちらも無ければ空（og:url / og:image を省略）
- `writeHtml()` を rendered オブジェクトを受け取る形に変え、`og:url =
  {origin}{basePath}/{relPath}/`・`og:image = {origin}{href(basePath, imageParts)}` を組み立てて
  `layout()` に渡す

### server.js

- 各ルートの `res.send(site.layout(...))` を共通ヘルパー化し、リクエストの
  `{protocol}://{host}` を origin として同様に og を組み立てる（ローカル閲覧でも同じ経路を通す）

## 影響範囲

- `lib/site.js` / `scripts/build-static-site.js` / `server.js` のみ。生成物 `texts/` や
  ワークフロー md には影響しない

## テスト方針

- `npm run build`（`GITHUB_REPOSITORY=akiraak/esl-text-audio` を付与）で dist/ を生成し、
  トップ・トピック詳細・記事ページの HTML に期待どおりの OGP タグ（絶対URL）が出ることを確認
- `npm start` でローカルサーバを起動し、同ページで og タグが壊れていない（絶対URLで出る）ことを確認
