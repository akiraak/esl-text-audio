# TODO

- [ ] GitHub Pages への公開を削除する（esltext.chobi.me に一本化） [plan](docs/plans/remove-github-pages.md)
  - [x] deploy-pages.yml 削除・ビルドスクリプトの GitHub 前提フォールバック削除
  - [x] README / CLAUDE.md / workflows/config.md / lib/site.js のドキュメント更新
  - [ ] GitHub リポジトリ Settings → Pages で Unpublish（akiraak 手作業）
- [ ] esltext.chobi.me にデプロイする予定だけど何かやる事があれば [plan](docs/plans/esltext-chobi-me-deploy.md)
  - デプロイは ~/g3plus-ops に任せる
  - [x] このリポジトリ側: ルートパス + esltext.chobi.me origin でのビルド検証・ドキュメント追記
  - [x] g3plus-ops 側: `esltext/`（Dockerfile / docker-compose / auto-update.sh）と運用ドキュメント作成
  - [x] サーバ側: clone・コンテナ起動・cron 登録・動作確認
  - [ ] Cloudflare Tunnel hostname `esltext.chobi.me` の追加（akiraak 手作業、手順は g3plus-ops docs/workflows/esltext.md）
  - [ ] Web表示のモバイル対応