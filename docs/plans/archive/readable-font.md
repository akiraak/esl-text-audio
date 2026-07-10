# フォントを読みやすいものにちゃんと決める

## 目的・背景

- 現状の本文フォントは `"Trebuchet MS", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Trebuchet MS は字形にクセがあり（g・数字など）、また Windows 以外の環境ではフォールバックがバラつくため、環境によって見た目が安定せず「見づらい」原因になっている
- 対象は ESL 学習者向けの英文読解テキストなので、**紛らわしい文字（I/l/1、rn/m、O/0 など）が判別しやすいこと**が最優先

## 対応方針

- Google Fonts の **Atkinson Hyperlegible Next** を採用する
  - Braille Institute が「読みやすさ（legibility）」を目的に設計したフォントで、紛らわしい文字の判別性を最重視している＝ESL 読解用途に最適
  - 正規のイタリック・複数ウェイトがあり、本文（Markdown 由来の強調・斜体）にも対応できる
  - 丸みのあるフレンドリーな字形で、既存のパステル調・角丸のデザインとも馴染む
- `lib/site.js` の `layout()` に Google Fonts の `<link>`（preconnect + stylesheet）を追加
- `body` の `font-family` を `"Atkinson Hyperlegible Next", "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif` に変更
  - 日本語（トピックアイデアの補足など）は日本語システムフォントへフォールバック
- オフライン時は `Segoe UI` 等のシステムフォントに自然にフォールバックするため、致命的な劣化はない

## 影響範囲

- `lib/site.js` のみ（`server.js` のローカル表示と `scripts/build-static-site.js` の静的ビルド両方に反映される）

## テスト方針

- `npm run build` が正常終了すること
- 生成された `dist/index.html` に Google Fonts の link と新しい font-family が入っていること
- ローカルサーバ（または dist）をブラウザ相当で確認し、フォントが適用されて表示されること
