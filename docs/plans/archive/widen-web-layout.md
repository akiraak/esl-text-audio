# Webの横幅を広げる

## 目的・背景

TODO.md 記載のタスク。現状 `lib/site.js` の `layout()` で `body { max-width: 760px; }` としており、
デスクトップ画面でも本文・表（variant-matrix など）が窮屈に見える。全ページ共通のレイアウトなので
この1箇所を広げれば全ページに反映される。

## 対応方針

- `lib/site.js` の `layout()` 内 `body` の `max-width` を `760px` → `1000px` に変更する
- モバイル幅では `padding: 0 1.5rem` と `width: 100%` 相当の挙動（max-widthは上限のみ）で従来通り収まるため、
  メディアクエリの追加は不要
- 他に固定幅の指定がないか確認済み（`table`は`width:100%`、`.illustration`は`max-width:100%`でどちらも追従する）

## 影響範囲

- `lib/site.js` の `layout()` のみ。動的サーバ（`server.js`）・静的ビルド（`scripts/build-static-site.js`）両方に反映される

## テスト方針

- `npm start` でローカルサーバを起動し、index / topic detail / variant detail / article / source / 404 の各ページを
  デスクトップ幅で目視確認し、余白と可読性を確認する
