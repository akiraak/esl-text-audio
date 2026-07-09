# GitHub Pages でのテキスト公開

## 目的・背景

`TODO.md` の「github pages にページを表示するようにする」に対応する。

現状 `server.js` は Express で `texts/` ディレクトリ（gitignore対象・ローカル生成物のみ）を動的に読み込んで一覧・詳細ページを表示している。
GitHub Pages は静的ファイルしか配信できずNode.jsサーバは動かせないため、ビューア用のレンダリングロジックを静的HTML生成用に転用し、
GitHub Actions でビルド・デプロイする仕組みを新設する。

利用者との確認の結果、方針は以下の通り:

- 公開範囲: `texts/` 配下の生成物を全部公開する（`.gitignore` から `texts/` を外し、生成物をコミット対象にする）
- デプロイ方式: GitHub Actions で push のたびに自動ビルドし、GitHub Pages（Actionsデプロイ方式）へデプロイする

## 対応方針

### Phase 1: レンダリングロジックの共通化

- `server.js` 内のHTML組み立てロジック（`layout` / `readConfig` / `listVersions` / `listSources` / `isValidId` /
  `hasIllustration` / `resolveIllustrationVersion` / `illustrationBlock` / `readLevelSpecSection` / `listAllTexts` /
  各ページのbody組み立て）を `lib/site.js` に切り出す
- GitHub Pages はプロジェクトページ（`https://akiraak.github.io/esl-text-audio/`）としてサブパス配下に公開されるため、
  すべての内部リンク・画像src生成に `basePath` 引数を持たせる（開発サーバでは `''`、静的ビルドでは `/esl-text-audio` 等）
- `server.js` は `lib/site.js` を呼び出す薄いルーティングだけにする（`basePath = ''` 固定で従来通りlocalhost:3020で動作）

### Phase 2: 静的サイトビルドスクリプト

- `scripts/build-static-site.js` を新規作成。`lib/site.js` の関数を使い、以下を出力ディレクトリ（`dist/`、gitignore対象）に書き出す
  - `/` → `index.html`
  - `/levels` → `levels/index.html`
  - `/texts/:id` → `texts/{id}/index.html`
  - `/texts/:id/article/:version` → `texts/{id}/article/{version}/index.html`
  - `/texts/:id/outline/:version` → `texts/{id}/outline/{version}/index.html`
  - `/texts/:id/sources/:filename` → `texts/{id}/sources/{filenameから.mdを除いたもの}/index.html`
  - `/texts/:id/images/:version` → `texts/{id}/images/{version}.png`（実ファイルをコピー）
  - 404: `404.html`（GitHub Pagesが未マッチパスに自動的に使う）
- `basePath` は `PAGES_BASE_PATH` 環境変数があればそれを使い、無ければ `GITHUB_REPOSITORY`（Actions実行時に自動設定）から
  `/{repo名}` を算出、どちらも無ければ `''`（ローカルで `dist/` をルート配信してプレビューする場合向け）
- `package.json` に `"build": "node scripts/build-static-site.js"` を追加

### Phase 3: GitHub Actions ワークフロー

- `.github/workflows/deploy-pages.yml` を新規作成
  - `main` へのpushで起動（`workflow_dispatch` も許可）
  - `actions/checkout` → `npm ci` → `npm run build` → `actions/configure-pages` → `actions/upload-pages-artifact`（`dist/`）→
    `actions/deploy-pages`
  - `permissions: pages: write, id-token: write`
- リポジトリ側の Pages 設定（Settings → Pages → Source: GitHub Actions）は画面操作が必要なため、実装完了後に利用者に案内する

### Phase 4: texts/ のコミット対象化

- `.gitignore` から `texts/` の行を削除
- 既存の生成物（`lost-while-traveling-*`, `water-cycle-*`）を `git add` してコミット対象にする
- CLAUDE.md の「生成物(gitignore 対象、ローカルにのみ保存)」という記述を、公開する仕組みができたことに合わせて更新する

### Phase 5: 動作確認・ドキュメント更新

- `npm run build` をローカルで実行し、`dist/` の生成結果を確認（各ページ・画像・404）
- 生成された `dist/index.html` 等をブラウザ（file://）で開き、内部リンクが `basePath` 込みで正しく機能することを確認
  （file://プレビューでは basePath なしの方が確認しやすいため、`PAGES_BASE_PATH=` を空にしてローカル用ビルドも試す）
- README.md にビルド・GitHub Pages公開の説明を追記
- 完了後 `TODO.md` → `DONE.md` へ移動、本プランは `docs/plans/archive/` へ移動

## 影響範囲

- 新規: `lib/site.js`, `scripts/build-static-site.js`, `.github/workflows/deploy-pages.yml`
- 変更: `server.js`（薄いルーティングへ再実装）, `.gitignore`（`texts/` を除外対象から外す）, `package.json`（buildスクリプト追加）,
  `README.md`, `CLAUDE.md`（生成物の扱いの記述更新）
- 新規コミット対象: `texts/` 配下の既存生成物一式

## テスト方針

- `npm start` で従来通りローカルビューアが動作することを確認（リグレッション確認）
- `npm run build` の出力を確認し、各ページ・画像・404が正しいパスに生成されることを確認
- GitHub Actions上での実際のデプロイ結果はpush後に利用者に確認してもらう（ローカルでは再現できないため）
