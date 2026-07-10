# 印刷時に先頭にページURLを表示

## 目的・背景

生成テキストを印刷して学習に使う際、紙面からは元のページ（バリアント・バージョン）が分からなくなる。
印刷物の先頭にそのページのURLを表示し、あとから同じページに戻れる・出典が分かるようにする。

## 対応方針

- `lib/site.js` の `layout()` に、`<body>` 直後の先頭要素として `.print-url` 要素を追加する
- URLはローカルサーバ（ポート可変）と GitHub Pages（プロジェクトページ配下）でビルド時に確定できないため、
  インラインの1行スクリプトで `location.href` を書き込む（外部依存なし・全ページ共通）
- CSSで通常表示時は `display: none`、`@media print` 時のみ表示する（純黒・小さめ・`word-break: break-all`）

## 影響範囲

- `lib/site.js` の `layout()` のみ。`server.js` と `scripts/build-static-site.js` は同関数を共有しているため両方に効く

## テスト方針

- `node server.js` を起動し、記事ページのHTMLに `.print-url` 要素とスクリプトが含まれることを確認
- ブラウザ相当の確認として、印刷CSSで表示されるスタイル定義（`@media print` 内）を目視確認
- `npm run build` が成功し、`dist/` の生成HTMLにも同要素が含まれることを確認
