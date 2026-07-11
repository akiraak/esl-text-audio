# スマホ表示対応

## 目的・背景

公開サイト（esltext.chobi.me）をスマホで閲覧した際の読みやすさを改善する。
Playwright（390×844, iPhone相当）で全ページ種別を確認したところ、横スクロール崩れ（水平オーバーフロー）は
どのページにも無かったが、以下の改善点が見つかった。

1. **余白過多で本文列が狭い**: `body` の左右 padding 1.5rem ＋ `article` の padding 1.5rem が二重にかかり、
   390px 幅では本文の実効幅が約290pxまで狭まる
2. **一覧ページの日時折り返し**: トピック一覧の meta に `createdAt` のISOタイムスタンプ全体
   （例 `2026-07-10T23:02:50`）を表示しており、狭い画面で文字列の途中で折り返して読みにくい。
   時刻部分は訪問者に価値が無いため日付のみ表示にする
3. **見出しが大きすぎる**: h1（デフォルト2em）がモバイルでは行数を取りすぎる
4. **バリアント表が窮屈**: variant-matrix はスクロール可能だがセル padding 0.6rem が幅を圧迫する

## 対応方針

`lib/site.js` の `layout()` 内CSSに `@media (max-width: 640px)` ブロックを追加し、以下を行う
（既存の `.level-cards` 用 640px メディアクエリに統合する）。

- body の左右 padding・上下 margin を縮小（1.5rem → 1rem / 2rem → 1rem）
- article の padding を縮小（1.5rem → 1rem 1.1rem）
- h1 / article h1 のフォントサイズを縮小
- table th/td の padding を縮小
- 一覧ページの thumb をやや小さく（72px → 64px）し、gap も縮小

メディアクエリ外の変更として、`renderIndex()` の作成日時表示を `formatDate()` 経由の日付のみに変更する。

## 影響範囲

- `lib/site.js` のみ（`server.js`・`scripts/build-static-site.js` は `layout()` を共有しているため両方に反映される）

## テスト方針

- `PORT=3021 node server.js` で現行コードのサーバを起動し、Playwright（390px幅）で
  一覧・トピック詳細・記事・About CEFR Levels・Topic Ideas の各ページをスクリーンショットで確認
- 水平オーバーフローが発生していないこと（`scrollWidth - clientWidth === 0`）を全ページで確認
- デスクトップ幅（1280px）でも従来の見た目が保たれていることを確認
