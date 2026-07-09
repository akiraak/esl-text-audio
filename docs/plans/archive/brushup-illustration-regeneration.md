# brushup.md 実行時のイラスト再生成対応

## 目的・背景

TODO.md に残っていた将来課題（[archived plan: 文章へのAI生成イラスト追加](archive/article-illustration.md) で
明示的にスコープ外とされていた項目）。現状 `workflows/brushup.md` はフィードバックに基づく本文（および必要なら
outline）の調整・再生成のみを扱い、`workflows/illustrate.md` で生成したイラストは本文が新バージョンになっても
更新されない。本文の主題・場面が変わるような修正が入った場合、イラストと本文の内容が食い違ったままになる。

## 対応方針

### 1. `workflows/brushup.md` にイラスト再生成ステップを追加

- 「事実確認の再実行判定」（現行手順6）と「保存・報告」（現行手順7）の間に新しい手順「イラスト再生成の判断」を挿入し、
  既存の手順7は手順8に繰り下げる
- 判断基準: 手順3a/3bでの修正が記事の主題・キーとなる場面・雰囲気に影響するか
  - 影響する場合はイラスト再生成を提案し、利用者の意向を確認する
  - 語彙・言い回しレベルの軽微な修正のみで場面・トーンに変化がない場合は再生成不要と判断できる（最終判断は利用者に委ねる）
- 再生成する場合、[workflows/illustrate.md](../../workflows/illustrate.md) 手順2〜6を、更新後の本文バージョン
  `articles/v{N+1}.md` に対して実行する（プロンプトは `images/v{N+1}.prompt.txt`、画像は `images/v{N+1}.png`）
- 再生成しない場合は何もしない（新バージョンに対応する `images/v{N+1}.*` は作成しない）。この場合に備えて対応方針2で
  ビューア側にフォールバック表示を実装する

### 2. `server.js` にイラストのバージョンフォールバック表示を追加

- 現状 `hasIllustration(id, version)` は該当バージョンの画像が存在するかの厳密一致のみを見ており、`illustrationBlock` も
  一致しなければ何も表示しない。brushup でイラストを再生成しなかった場合、新しい本文バージョンのページで
  イラストが消えてしまう
- `resolveIllustrationVersion(id, version)` を追加し、指定バージョン以下で直近に存在する画像バージョンを探して返す
  （画像は世代を追って追加されるのみで削除されない前提のため、指定バージョンから 1 ずつ遡って最初に見つかったものを使う）
- `illustrationBlock` はこの解決済みバージョンを使って `<img>` の `src` を組み立てる。既存の `/texts/:id/images/:version`
  エンドポイント自体は変更不要（解決済みの実在バージョン番号を渡すだけなので厳密一致のままでよい）

### 3. `workflows/illustrate.md` の記述更新

- 手順7の「`brushup.md` で本文が新バージョンとして更新された場合のイラスト再生成は現時点では自動化されていない」という
  記述を、`brushup.md` 側に手順が追加された旨に更新する

## 影響範囲

- 変更: `workflows/brushup.md`, `workflows/illustrate.md`, `server.js`
- 影響なし: `scripts/generate-illustration.js`（既存の引数仕様のまま再利用）, `workflows/config.md`/`research.md`/
  `outline.md`/`generate.md`/`factcheck.md`, 既存の生成物（`texts/` 配下、後方互換）

## テスト方針

- 自動テストは作らない（既存方針を踏襲、`server.js` は小規模なローカルツール）
- 実地確認:
  - `server.js` 起動後、既存生成物（画像が一部バージョンにしか無いもの）で新旧バージョンのページを開き、
    フォールバックで直近の画像が表示されること、画像が一つも無いバージョンでは何も表示されずエラーにもならないことを確認する
  - `workflows/brushup.md` の新手順の記述が [workflows/illustrate.md](../../workflows/illustrate.md) の手順2〜6と
    矛盾なく参照できることをレビューする

## Phase

- [ ] Phase 1: `workflows/brushup.md` にイラスト再生成ステップを追加し、`workflows/illustrate.md` の記述を更新する
- [ ] Phase 2: `server.js` にイラストのバージョンフォールバック表示を実装し、実地確認する
