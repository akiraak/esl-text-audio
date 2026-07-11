# GitHub Pages 公開の削除

## 目的・背景

生成テキストサイトは esltext.chobi.me（自宅サーバ g3plus、[esltext-chobi-me-deploy.md](esltext-chobi-me-deploy.md) 参照）で公開するようにしたため、
重複している GitHub Pages（https://akiraak.github.io/esl-text-audio/）への自動デプロイを廃止する。
静的ビルド（`npm run build`）自体は esltext.chobi.me のビルドで使い続けるため維持する。

## 対応方針

- `.github/workflows/deploy-pages.yml` を削除（push 時の GitHub Pages デプロイを停止）
- `scripts/build-static-site.js` から GitHub Actions 前提の `GITHUB_REPOSITORY` フォールバックと `.nojekyll` 生成を削除。
  `PAGES_BASE_PATH` / `SITE_ORIGIN` 環境変数はそのまま維持する（g3plus 側の Dockerfile が使用しているため、変数名は変えない）
- `README.md` の「GitHub Pages への公開」セクションを esltext.chobi.me での公開説明に置き換え
- `CLAUDE.md` の「生成テキストの閲覧・公開」セクション・ディレクトリ構成コメントから GitHub Pages 記述を削除
- `workflows/config.md` の公開ビューアの言及を GitHub Pages → esltext.chobi.me に変更
- `lib/site.js` の basePath コメントの GitHub Pages 言及を一般化
- `docs/plans/esltext-chobi-me-deploy.md` の「GitHub Pages はそのまま維持」の記述に廃止済みの追記
- docs/plans/archive/ 配下・DONE.md の過去記録は当時の事実なので変更しない

## 手作業（akiraak）

- GitHub リポジトリの Settings → Pages で公開を無効化（Unpublish）。
  ワークフロー削除だけでは既存デプロイ済みサイトが残り続けるため（`gh` CLI がこの環境に無く自動化できない）

## 影響範囲

- `.github/workflows/deploy-pages.yml`（削除）、`scripts/build-static-site.js`、`README.md`、`CLAUDE.md`、`workflows/config.md`、`lib/site.js`
- esltext.chobi.me のビルド（g3plus 側 Dockerfile の `PAGES_BASE_PATH= SITE_ORIGIN=... npm run build`）には影響なし

## テスト方針

- `npm run build`（環境変数なし）→ ルートパス・OGP絶対URLなしで生成されること
- `PAGES_BASE_PATH= SITE_ORIGIN=https://esltext.chobi.me npm run build` → 従来どおり生成されること（g3plus と同条件）
