# DONE

## 2026-07-09

- [x] About CEFR Levels のページの文字が画面からはみ出しているので修正
  - 原因は8列の巨大な表（`docs/specs/esl-level-spec.md`の「CEFR Level Definitions」）が画面幅に収まらないこと
  - `lib/site.js`の`renderLevels()`で表をパースし、レベル1件=1カードの縦積み表示（2列グリッド、640px未満は1列）に変更。値は引き続きspecファイルから読み取るため二重管理にならない
  - Notesは開発ワークフロー向けの原文（`config.md`等への言及）ではなく、サイト訪問者（学習者）向けの説明文に書き換え
  - 汎用の`table`CSSにも横スクロールのフォールバックを追加（将来幅広の表が増えた場合の保険）

- [x] webの横幅をもっと広くする（[archived plan](docs/plans/archive/widen-web-layout.md)）
  - `lib/site.js`の`layout()`内`body`の`max-width`を`760px`→`1000px`に変更（全ページ共通のレイアウトなので1箇所の変更で反映）
  - `npm start`・`npm run build`双方の出力で`max-width: 1000px`が反映されていることを確認

- [x] 記事に表示される内容を見やすくシンプルにする（[archived plan](docs/plans/archive/simplify-article-display.md)）
  - 記事バージョンファイル（`variants/{level}-{tier}/articles/v{N}.md`）にYAML frontmatterで`aiModel`（生成に使ったAIモデル）・`createdAt`を記録する方式を追加し、既存8バージョンに後付け。`workflows/generate.md`・`workflows/brushup.md`を更新し今後の生成でも記録するよう明記
  - `lib/site.js`に`breadcrumb()`ヘルパーを追加し、全ページの「戻る」リンク1本だけのナビを`Home > トピック > バリアント`形式のパンくずに統一
  - `splitTitle()`で本文先頭の`# タイトル`を分離し、記事ページの表示順を「パンくず→タイトル→レベル/長さバッジ（別要素化）→作成者/作成日→イラスト→本文」に再構成（トピック名とレベル/長さを結合した二重タイトルを解消）
  - `renderVariantDetail`から埋め込みの本文プレビューを削除し、本文を読む導線を`renderArticle`に一本化
  - `npm start`でのローカル表示（index/levels/topic detail/variant detail/article/source/404の全ページ）と`npm run build`の静的ビルド出力を実地確認

- [x] Webの表示は全て英語にする（[archived plan](docs/plans/archive/web-display-english.md)）
  - `lib/site.js`のUI文言（見出し・ナビ・ラベル・分量tierラベル等）を全て英語化、`layout()`の`lang`属性も`en`に変更
  - source一覧のリンク文字列を生ファイル名からfrontmatterの`title`（既に英語）に変更
  - outlineページ（企画メモ、内容が丸ごと日本語）を公開サイトから除去（`renderOutline`・`listOutlineVersions`削除、`server.js`のルート・`scripts/build-static-site.js`のビルドループを削除）。ファイル自体は`texts/`配下に残しワークフローも変更なし
  - `docs/specs/esl-level-spec.md`の「CEFR レベル定義」セクションのみ英語化（`/levels`ページがそのまま表示するため）。他セクションはワークフロー専用の内部参照として日本語のまま維持
  - 既存3トピック（how-honey-is-made、lost-while-traveling、water-cycle）の`config.json`（`topic`/`genre`）・`variant.json`（`wordCountTarget`）を英語に移行
  - `workflows/config.md`・`workflows/outline.md`を更新し、今後生成する`topic`/`genre`/`wordCountTarget`は常に英語で保存するよう明記
  - `npm start`でのローカル表示・`npm run build`の静的ビルド出力（`dist/`配下の全HTML）に日本語文字が残っていないことを実地確認

- [x] 画像はトピックで１枚のみ生成し全バリアントで共有（[archived plan](docs/plans/archive/topic-level-single-illustration.md)）
  - `workflows/illustrate.md`にトピックの`images/`に既存イラストがあれば生成をスキップするロジックを追加し、保存先をバリアント配下からトピック直下`images/`に変更
  - `workflows/brushup.md`のイラスト再生成ステップを、再生成が全バリアントに影響する共有イラストである旨を明記する内容に更新
  - `lib/site.js`のイラスト関連関数（`hasIllustration`/`illustrationBlock`）から`variantId`引数を除去し、常にトピックの最新バージョンを表示する`latestIllustrationVersion`に簡略化
  - `server.js`の画像配信ルートを`/texts/:topicId/:variantId/images/:version.png`から`/texts/:topicId/images/:version.png`に変更、`scripts/build-static-site.js`の画像コピー処理をバリアントループの外に移動
  - 既存3トピック（how-honey-is-made、lost-while-traveling、water-cycle）を新構成に移行し、バリアント配下の重複画像を削除
  - `npm start`・`npm run build`双方で、同一トピックの複数バリアントページに同じ共有イラストが表示されることを実地確認

- [x] 分量3段階化（通常/長い/すごく長い）＋トピック単位の複数バリアント（レベル×分量）管理・選択の仕組み（[archived plan](docs/plans/archive/topic-variants-and-length-tiers.md)）
  - Phase A: 分量3段階の語数テーブル確定（`docs/specs/esl-level-spec.md` を3段階テーブルに拡張、長文モードのしきい値を600語以上に統一）
  - Phase B: ディレクトリ構造・ワークフロー再設計（`config.md`をトピック単位のみに整理、`outline.md`にレベル・分量確定とカスケード派生ロジックを追加、`generate.md`/`factcheck.md`/`illustrate.md`/`brushup.md`を新パス（`outlines/{tier}/`・`variants/{level}-{tier}/`）に対応）
  - Phase C: 表示側の対応・既存サンプルの移行（`lib/site.js`にトピック→バリアントの階層構造を実装、`server.js`/`scripts/build-static-site.js`を新URL構成に更新、既存2サンプル（water-cycle→B1-normal、lost-while-traveling→A2-normal）を新ディレクトリ構成に移行）
  - Phase D: 実地検証（新規トピック「ハチミツができるまで」で以下を確認、全項目PASS）
    - `very-long`（C1、4000語弱）のアウトラインを先に作成し、`long`（2000語程度）→`normal`（1000語程度）と1段階ずつ間引いてカスケード派生させ、内容の一貫性を確認
    - 同じ`normal`アウトラインからA1（109語）とC1（1010語）の2レベルを生成し、同じ構成のまま語彙・文法だけが書き分けられることを確認
    - 低レベル×長い分量（A1×very-long、634語）を生成し、A1の限られた語彙でも単純な繰り返しにならない構成にできることを確認
    - ローカルサーバー・静的ビルド両方でトピック一覧→バリアント一覧（レベル×分量マトリクス）→記事の階層ナビゲーションが機能することを確認
    - 既存2サンプルが移行後も正しく表示されることを再確認
  - 各バリアントの本文生成後、`factcheck.md`により事実確認を実施（懐疑的ファクトチェッカー・簡略化セーフティチェッカーの観点で、統計値の因果関係の混同や未検証の行動記述など数件の指摘を検出・修正）
  - 全5バリアントでイラスト生成（`illustrate.md`）まで実施し、レベル・分量に応じて描き分けられることを確認

## 2026-07-09

- [x] Webのデザインを入れる（[archived plan](docs/plans/archive/web-design-candidates.md)）
  - Phase 1〜4: `lib/design-themes.js` に5デザイン案（Minimal / Editorial / Card / Dark / Playful）を実装し、
    `server.js` に `?design=` クエリでの切り替えと `/designs` 比較ページを追加。実データ（water-cycle等）を使って
    ローカルサーバ上で見比べられるようにした上で利用者が Playful を選定
  - 選定後、比較用の仕組み（テーマ切り替えバー・`/designs`・`lib/design-themes.js` の複数テーマ定義）は撤去し、
    Playful のCSSを `lib/site.js` の `layout()` に直接組み込んで唯一のデザインとして確定
    （静的ビルド `scripts/build-static-site.js` も変更なしでそのまま反映される）

- [x] GitHub Pages にテキストを公開する仕組みを作る（[archived plan](docs/plans/archive/github-pages-static-site.md)）
  - Phase 1: `server.js` のHTML組み立てロジックを `lib/site.js` に切り出し、全リンク・画像srcを `basePath` 引数付きの
    `href()` ヘルパー経由で生成するように変更（GitHub Pagesのプロジェクトページはサブパス配下で配信されるため）。
    `server.js` は `basePath=''` 固定で `lib/site.js` を呼ぶ薄いルーティングに書き換え
  - Phase 2: `scripts/build-static-site.js` を作成。`texts/` 配下から `dist/`（gitignore対象）へ静的HTML一式・イラスト画像・
    404ページを出力する。basePathは `PAGES_BASE_PATH` 環境変数、無ければ `GITHUB_REPOSITORY` から自動算出
  - Phase 3: `.github/workflows/deploy-pages.yml` を作成。`main` へのpushで `npm run build` を実行し
    `actions/upload-pages-artifact` + `actions/deploy-pages` でGitHub Pagesへデプロイ
  - Phase 4: `.gitignore` から `texts/` を除外し、既存生成物（water-cycle, lost-while-traveling）をコミット対象化。
    CLAUDE.mdの「生成物はローカルのみ保存」という記述を「公開対象」に更新
  - Phase 5: `npm run build` の出力をローカルサーバ・静的ファイルサーバの両方で動作確認（日本語ファイル名のsourcesページ、
    イラスト画像、404ページ含む）。README.mdに公開手順を追記
  - 公開範囲: `texts/` 配下の生成物は基本的にすべて公開する方針（利用者確認済み）
  - リポジトリ設定（Settings → Pages → Source: GitHub Actions）の有効化は利用者側の作業として案内

- [x] `brushup.md` 実行時のイラスト再生成に対応する（[archived plan](docs/plans/archive/brushup-illustration-regeneration.md)）
  - Phase 1: `workflows/brushup.md` に手順7「イラスト再生成の判断」を追加（旧手順7は手順8に繰り下げ）。本文修正が場面・雰囲気に
    影響する場合のみ `illustrate.md` 手順2〜6を新バージョンに対して再実行する方針を明記。`workflows/illustrate.md` 手順7の
    「自動化されていない」旨の記述をこの手順への参照に更新
  - Phase 2: `server.js` に `resolveIllustrationVersion` を追加。イラストを再生成しなかった本文バージョンでは、直近の
    旧バージョンの画像にフォールバック表示する（一覧・詳細・バージョン別ページで確認、画像が一つも無い場合は非表示のまま）

## 2026-07-08

- [x] レベルについての説明ページを作る（[archived plan](docs/plans/archive/level-explanation-page.md)）
  - Phase 1: `server.js` に `GET /levels` ルート追加。`docs/specs/esl-level-spec.md` の「CEFR レベル定義」セクションを抽出し `marked` でレンダリング、一覧ページにリンク追加
  - Phase 2: `/levels` の表示・一覧ページからのリンク遷移・404ケースを実地確認、全項目PASS
  - レベル定義の二重管理を避けるため、スペックファイルを都度読み込んで表示する方式（表の内容はサーバ側に複製しない）

- [x] 生成したページを表示するWebサーバを作成（[archived plan](docs/plans/archive/text-viewer-server.md)）
  - Phase 1: `package.json` 作成・依存パッケージ導入（express, marked, gray-matter）、`.gitignore` に `node_modules/` 追加
  - Phase 2: `server.js` 実装（一覧ページ、詳細ページ、article/outline/sourcesの各バージョン表示ルーティング、404処理）
  - Phase 3: `npm start` 起動スクリプト整備・README追記（デフォルトポート3020、`PORT`環境変数で変更可）
  - Phase 4: 既存生成物（water-cycle, lost-while-traveling）での一覧・詳細・各ルート・404ケースを実地確認、全項目PASS
  - `texts/{topic-slug}-{timestamp}/` 配下の config.json・outlines/・articles/・sources/ をブラウザで閲覧できるローカル開発用ビューア
  - id はディレクトリ名をそのまま使用し、バージョンやsourceファイル名はファイルシステムを都度読み取って動的に一覧表示する方式（欠番があっても対応）

## 2026-07-09

- [x] ESL学習用テキストを生成する仕組みを作る（[archived plan](docs/plans/archive/esl-text-generation.md)）
  - Phase 1: `docs/specs/esl-level-spec.md` 作成（CEFRレベル別の語彙・文長・語数、文章形式・事実チェック方針の定義）
  - Phase 2: `personas/` 作成（README.md + 5ペルソナ: ESL教材ライター・学習者シミュレーター・懐疑的ファクトチェッカー・簡略化セーフティチェッカー・最終エディター）
  - Phase 3: ディレクトリ構成・CLAUDE.md 追記（`.gitignore` に `texts/` 追加）
  - Phase 4: `workflows/config.md` 作成（トピック・英語レベル・形式収集、事実チェック要否判定、esl-level-spec.md を参照）
  - Phase 5: `workflows/research.md` 作成（事実チェック対象時の外部資料収集・`sources/` 保存）
  - Phase 6: `workflows/outline.md` 作成（アウトライン作成・承認・バージョン管理、レベルと形式の整合確認、セクション別ソース記録、esl-writerペルソナ適用）
  - Phase 7: `workflows/generate.md` 作成（本文生成・esl-level-spec.md に基づく適性チェックリスト反映、ソース参照執筆、esl-writer/learner-simulator/final-editorペルソナ適用）
  - Phase 8: `workflows/factcheck.md` 作成（生成本文と `sources/` の突き合わせ・修正の反復、skeptical-fact-checker/simplification-safety-checker/final-editorペルソナ適用）
  - Phase 9: `workflows/brushup.md` 作成（フィードバック反映・再生成、事実に関わる修正時は factcheck 再実行、final-editorペルソナ適用）
  - Phase 10: サンプルトピックでの通し動作確認（物語/A2・説明的文章/B1の両パターンで実地検証、全項目PASS。検証中に見つかった軽微な改善点を `workflows/research.md` に反映）
  - 入力: 主題（トピック）+ 英語レベル
  - 生成フロー: config → (research) → outline → generate → (factcheck) → brushup を Claude Code 自身が `workflows/*.md` の指示に従って対話的に実行する方式（`~/git-art`・`~/deep-pulse` の多段プロセスを踏襲）
  - 重視すること: ESLの学習に適した内容であること、読んでいて楽しいこと
  - 事実チェック: 物語・対話文など明らかにフィクションのジャンルは対象外、それ以外（説明文・手順文・説明的文章・
    日記/手紙/メール・ニュース記事風・意見文/エッセイ）は外部資料と突き合わせて事実面を確認する
    （詳細は [esl-level-spec.md](docs/specs/esl-level-spec.md) の「事実チェック方針」参照）
  - AIペルソナ: 生成・チェックの各段階で視点を変えるため [personas/](personas/README.md) に5ペルソナを定義

## 2026-07-08

- [x] 文章にAI生成のイラストを入れる。生成モデルは GPT Image 2（[archived plan](docs/plans/archive/article-illustration.md)）
  - Phase 1: `scripts/generate-illustration.js` 実装（OpenAI Images API 呼び出し）、`dotenv` 依存追加、`.env.example` 作成、`.gitignore` に `.env` 追加
  - Phase 2: `workflows/illustrate.md` 新規作成（本文確定後に実行する6番目のステップとして追加、`generate.md`/`factcheck.md`/`brushup.md` の案内も更新）
  - Phase 3: `server.js` に画像配信ルート（`GET /texts/:id/images/:version`）・詳細ページ/記事ページへのイラスト表示を追加
  - Phase 4: `CLAUDE.md`（ディレクトリ構成・ワークフロー一覧）・`README.md`（`.env` セットアップ手順）更新
  - Phase 5: `.env` 設定後、`water-cycle`・`lost-while-traveling` の2記事で実際にイラスト生成・ビューア表示を実地確認、全項目PASS
  - 記事1本につきイラスト1枚（記事全体を象徴する1枚）、モデル・サイズ・画質（デフォルト `medium`）は環境変数で上書き可能
  - Claude Code がピクセルデータを直接生成できないため、この機能のみ `workflows/*.md` の対話的生成方式の例外として実際のAPI呼び出しスクリプトを使用
  - `brushup.md` 実行時のイラスト再生成は今回のスコープ外とし、TODO.md に将来課題として残した