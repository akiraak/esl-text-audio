# TODO

- [ ] esltext.chobi.me にデプロイする予定だけど何かやる事があれば [plan](docs/plans/esltext-chobi-me-deploy.md)
  - デプロイは ~/g3plus-ops に任せる
  - [x] このリポジトリ側: ルートパス + esltext.chobi.me origin でのビルド検証・ドキュメント追記
  - [x] g3plus-ops 側: `esltext/`（Dockerfile / docker-compose / auto-update.sh）と運用ドキュメント作成
  - [x] サーバ側: clone・コンテナ起動・cron 登録・動作確認
  - [ ] Cloudflare Tunnel hostname `esltext.chobi.me` の追加（akiraak 手作業、手順は g3plus-ops docs/workflows/esltext.md）