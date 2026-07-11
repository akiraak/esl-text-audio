# esltext.chobi.me へのデプロイ

## 目的・背景

生成テキストサイト（当時は GitHub Pages: https://akiraak.github.io/esl-text-audio/ で公開）を、
自宅サーバ g3plus 上でもホストし `https://esltext.chobi.me/` で公開する。
デプロイの仕組み・運用は `~/g3plus-ops`（自宅サーバ構成管理リポジトリ）側に置き、他サービス
（photorans / esl-learning-assistant など）と同じ運用パターンに従う。

## 対応方針

### esl-text-audio 側（このリポジトリ）

- コード変更は不要。`scripts/build-static-site.js` は既に環境変数で公開先を切り替えられる:
  - `PAGES_BASE_PATH=`（空）→ ルートパス配信
  - `SITE_ORIGIN=https://esltext.chobi.me` → OGP の絶対 URL
- ローカルで上記環境変数を付けたビルドを検証済み（リンク・og:url ともルートパス / chobi.me origin になる）
- GitHub Pages のデプロイ（`.github/workflows/deploy-pages.yml`）はそのまま維持し、esltext.chobi.me は追加の公開先とする
  - ※その後 esltext.chobi.me への一本化に伴い GitHub Pages 公開は廃止した（[remove-github-pages.md](remove-github-pages.md) を参照）

### g3plus-ops 側（デプロイ設定の正本）

`g3plus-ops/esltext/` を新規作成:

- `Dockerfile` — multi-stage。`node:22-alpine` で `npm ci` → `PAGES_BASE_PATH= SITE_ORIGIN=https://esltext.chobi.me npm run build` → `nginx:alpine` に `dist/` をコピー。nginx 設定（404 ページ・charset）は Dockerfile 内 heredoc で埋め込み
- `docker-compose.yml` — build context は `/home/ubuntu/esl-text-audio`（サーバ上のアプリコード clone）、container_name `esltext`、port `3006:80`、network `n8n_default`（cloudflared から `http://esltext:80` で到達）
- `auto-update.sh` — GitHub の main に新コミットがあれば pull → イメージ再ビルド → 再起動する cron 用スクリプト（push するだけでサイトが更新される、GitHub Pages と同等の運用にする）
- `docs/workflows/esltext.md` — セットアップ・更新手順・Cloudflare Tunnel hostname 設定手順

### サーバ（g3plus）側の作業

1. `git clone https://github.com/akiraak/esl-text-audio.git /home/ubuntu/esl-text-audio`（public リポジトリ）
2. デプロイ設定を `scp` で `/home/ubuntu/g3plus-ops/esltext/` へ転送（g3plus-ops は private のためサーバでは clone しない方針に従う）
3. `docker compose up -d --build` で起動、`curl localhost:3006` で確認
4. crontab に auto-update.sh を登録（15分間隔）

### 残る手作業（akiraak、Cloudflare ダッシュボード）

- Zero Trust → Networks → Tunnels → `g3plus` → Public Hostname 追加:
  Subdomain `esltext` / Domain `chobi.me` / Service `http://esltext:80`
- 認証は不要（全ページ公開、GitHub Pages と同じ扱い）

## 影響範囲

- esl-text-audio: ドキュメントのみ（CLAUDE.md の公開セクション追記、プラン・TODO）
- g3plus-ops: `esltext/` 新規、CLAUDE.md サービス表・リポジトリ構成、`docs/workflows/esltext.md` 新規、TODO.md
- g3plus サーバ: コンテナ `esltext`（port 3006）追加、crontab 1 行追加

## テスト方針

- ローカル: `PAGES_BASE_PATH= SITE_ORIGIN=https://esltext.chobi.me npm run build` で dist/ のリンク・OGP を確認（済）
- サーバ: `curl http://localhost:3006/`（200・トップページ）、`/levels/`（200）、存在しないパス（404 + 404.html）、mp3 の Range リクエスト
- Cloudflare hostname 追加後: `https://esltext.chobi.me/` の表示確認（akiraak）
