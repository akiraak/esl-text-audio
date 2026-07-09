# イラストをトピック単位で1枚のみ生成する

## 目的・背景

TODO.md に記載済みのタスク（「画像はトピックで１枚のみ」）。[docs/plans/archive/topic-variants-and-length-tiers.md](archive/topic-variants-and-length-tiers.md)
でレベル×分量tierのバリアント制を導入した際、イラストも `variants/{level}-{tier}/images/` に置く形にしたが、
同トピック内のバリアントはレベル・分量が違うだけで題材・場面は同じであり、バリアントごとに画像生成APIを呼ぶのは無駄
（同計画書内に「バリアント間でイラストを共有する最適化…無駄なAPI呼び出しに気づいたら別タスクで検討」と明記されていた）。

今回、イラストの単位をバリアントからトピックに戻し、1トピックにつき1枚（版違いは残す）だけ生成・共有する構成に変更する。

## 対応方針

### 保存場所の変更

- `texts/{topic-slug}-{timestamp}/variants/{level}-{tier}/images/` → `texts/{topic-slug}-{timestamp}/images/`（トピック直下、`sources/` や `outlines/` と同列）
- ファイル名は `v{N}.png` / `v{N}.prompt.txt` のまま。ただし N はもう「その画像に対応する本文バージョン番号」ではなく、
  トピック単位でイラストを再生成するたびに増える独立した通し番号（1始まり）
- `scripts/generate-illustration.js` は `<text-dir>/images/` に保存する既存仕様のまま変更不要。呼び出し時の `text-dir` 引数を
  `variants/{level}-{tier}` ではなくトピックのルートディレクトリに変える

### `workflows/illustrate.md` の変更

- 実行主体は変わらず「本文確定後」だが、判断を追加する: そのトピックに既に `images/v{N}.png` が1枚以上存在する場合、
  新しいバリアントの本文確定時にはイラストを**再生成しない**（既存の最新版をそのまま使う）。イラストが1枚もない場合のみ
  新規生成する
- 手順2「config・variant・確定本文の確認」はそのまま（プロンプト作成にはそのバリアントの本文を使ってよい。どのバリアントで
  生成しても題材は共通なので、最初に illustrate.md を実行したバリアントの本文が使われる）
- 手順4の保存先を `texts/{topic-slug}-{timestamp}/images/v{N}.prompt.txt`（トピック直下）に変更
- 手順5の実行コマンドを `node scripts/generate-illustration.js texts/{topic-slug}-{timestamp} {N} texts/{topic-slug}-{timestamp}/images/v{N}.prompt.txt` に変更
- 手順6「生成結果の確認」: 利用者への提示・案内文言をトピック単位に更新
- 冒頭の説明文・手順1の前提に「同トピックの他バリアントで既にイラストが生成済みの場合はこのワークフローをスキップし、
  既存のイラストを使う」旨を明記

### `workflows/brushup.md` の変更

- 手順8「イラスト再生成の判断」: 再生成するとそのトピックの**全バリアントに影響する共有イラストが変わる**ことを明記し、
  利用者に確認する文言を追加
- 保存先・生成コマンドをトピック直下の `images/` に変更（`variants/{level}-{tier}/images/` ではない）
- バージョン番号 N は「このバリアントの本文バージョン+1」ではなく、トピックの `images/` に存在する最新バージョンの次番号
  （`images/` を確認して決める）

### `workflows/generate.md` / `workflows/factcheck.md`

- `illustrate.md` への案内文言はそのまま（変更不要）。実際にスキップするかどうかの判断は `illustrate.md` 側に委ねる

### ビューア表示側 (`lib/site.js`, `server.js`, `scripts/build-static-site.js`)

- `hasIllustration(topicId, version)` / `resolveIllustrationVersion(topicId, version)` / `illustrationBlock(basePath, topicId, version)`
  から `variantId` 引数を除去し、`texts/{topicId}/images/` を見るように変更
- バリアント・記事ページ (`renderVariantDetail`, `renderArticle`) は自身の `variantId` ではなく、共通の topicId 経由でイラストブロックを取得する
  （引数から `variantId` を渡さなくなる）
- 表示バージョンの決定: 各バリアントの記事バージョンとイラストバージョンはもはや対応しないため、常にトピックの
  `images/` にある最新バージョンを表示する（`resolveIllustrationVersion` は「指定バージョン以下の最新」ロジックが
  不要になるので「存在する最大バージョンを返す」だけの単純な関数に簡略化する）
- サーバの画像配信ルートを `GET /texts/:topicId/:variantId/images/:version.png` → `GET /texts/:topicId/images/:version.png` に変更
  （`variantId` セグメントを除去）
- `scripts/build-static-site.js`: 画像コピー処理をバリアントループの外、トピック単位のループ内に移動し、
  コピー元 `texts/{id}/images/`・コピー先 `dist/texts/{id}/images/` に変更

### 既存生成物の移行（`texts/` 配下）

現在3トピックがバリアントごとに画像を持っている（`how-honey-is-made-*` は5バリアント分、他2トピックは1バリアントのみ）。
新構成に合わせて以下の移行を行う。

- 各トピックについて、最も早く生成された（`variant.json` の `createdAt` が最も古い）バリアントの `images/v1.*` を
  トピック直下の `images/v1.*` にコピーする
- 各バリアントの `variants/{level}-{tier}/images/` ディレクトリは削除する

### `CLAUDE.md` の更新

- ディレクトリ構成図から `variants/{level}-{tier}/images/` を削除し、トピック直下に `images/` を追加
- ワークフロー一覧・トピック複数バリアント対応の説明文中、イラストがバリアント単位である旨の記述があれば
  トピック単位に修正

## 影響範囲

- 変更: `workflows/illustrate.md`, `workflows/brushup.md`, `lib/site.js`, `server.js`, `scripts/build-static-site.js`, `CLAUDE.md`
- データ移行: `texts/how-honey-is-made-20260709-082323/`, `texts/lost-while-traveling-20260708-222921/`, `texts/water-cycle-20260709-052935/`
- 変更なし: `scripts/generate-illustration.js`（引数はそのまま、呼び出し元のパスのみ変わる）, `workflows/config.md`, `research.md`, `outline.md`, `generate.md`, `factcheck.md`（`illustrate.md` への案内文言は変更不要）

## テスト方針

- 自動テストは作らない（既存方針を踏襲、`server.js`・`lib/site.js` は小規模なローカルツール）
- 実地確認:
  - `npm start` でビューアを起動し、移行後の3トピックそれぞれで、トピック詳細ページ・各バリアントの記事ページに
    トピック共通のイラストが表示されること
  - `npm run build` で `dist/` を生成し、`dist/texts/{id}/images/v1.png` が正しくコピーされ、生成されたHTML内の
    画像パスが到達可能なことを確認する
  - 画像が存在しないトピック（もしあれば）でエラーにならず画像なしで表示されることを確認する

## Phase

- [ ] Phase 1: `workflows/illustrate.md`・`workflows/brushup.md` の記述をトピック単位のイラスト生成・共有ロジックに更新する
- [ ] Phase 2: `lib/site.js`・`server.js`・`scripts/build-static-site.js` をトピック単位の画像パスに更新する
- [ ] Phase 3: 既存3トピックの生成物をトピック直下の `images/` に移行し、バリアント配下の `images/` を削除する
- [ ] Phase 4: `CLAUDE.md` のディレクトリ構成図・説明文を更新する
- [ ] Phase 5: `npm start` / `npm run build` で実地確認する
