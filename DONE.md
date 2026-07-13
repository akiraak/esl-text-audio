# DONE

## 2026-07-12

- [x] 印刷時のページ番号表示（[archived plan](docs/plans/archive/print-page-numbers.md)）
  - ブラウザの「ヘッダーとフッター」設定だと日付・タイトル・URLも出てしまうため、
    CSS `@page` マージンボックスで「現在ページ / 総ページ数」だけを下部中央に表示（Chrome 131+）

- [x] 印刷時のデザイン修正（[archived plan](docs/plans/archive/print-design-fixes.md)）
  - 音声プレーヤー（シークバー）を印刷時も表示するようにした（"Read by ..." 行は純黒化）。
    ネイティブコントロールはバーが印刷されないため、枠線だけで描いた印刷専用ブロック（再生時間付き）に差し替える方式
  - レベル・分量tierなどのバッジに印刷時のふち枠線（#999）を追加した

## 2026-07-11

- [x] 記事の理解度確認問題（Questions）を作成する（[archived plan](docs/plans/archive/article-questions.md)）
  - 問題の形式: 4択選択式（内容理解/文脈語彙/推論）。`questions/v{N}.json` を音声と同じく記事バージョンと同番号で管理
  - 回答の表示: タップで即時フィードバック方式（vanilla JS・依存なし）。全問回答でスコア表示、印刷時は紙のワークシートになる
  - `docs/specs/esl-level-spec.md` に「理解度確認問題（Questions）の基準」を追記、`personas/question-writer.md`・`workflows/questions.md` を新規作成
  - `lib/site.js` に Questions セクション（描画・採点JS・CSS・印刷対応）を実装。問題が無い記事の見た目は変化なし
  - 既存6トピック全13バリアントの最新記事バージョンに問題を生成（各問題は learner-simulator チェック済み、answerIndex 分布の偏りなし）

- [x] スマホの表示に対応（[archived plan](docs/plans/archive/mobile-responsive.md)）
  - 640px以下で body/article の余白・見出しサイズ・表セルpadding・一覧サムネイルを縮小するメディアクエリを追加
  - 一覧ページの作成日時を日付のみ表示に変更し、meta項目が文字列途中で折り返さないよう修正
  - Playwright（390px/1280px）で全ページ種別のスクリーンショット・水平オーバーフロー無しを確認

- [x] GitHub Pages への公開を削除する（esltext.chobi.me に一本化）（[archived plan](docs/plans/archive/remove-github-pages.md)）
  - deploy-pages.yml 削除・ビルドスクリプトの GitHub 前提フォールバック削除
  - README / CLAUDE.md / workflows/config.md / lib/site.js のドキュメント更新
  - GitHub リポジトリ Settings → Pages で Unpublish（akiraak 手作業）

- [x] esltext.chobi.me へのデプロイ（[archived plan](docs/plans/archive/esltext-chobi-me-deploy.md)）
  - このリポジトリ側: ルートパス + esltext.chobi.me origin でのビルド検証・ドキュメント追記
  - g3plus-ops 側: `esltext/`（Dockerfile / docker-compose / auto-update.sh）と運用ドキュメント作成
  - サーバ側: clone・コンテナ起動・cron 登録・動作確認
  - Cloudflare Tunnel hostname `esltext.chobi.me` の追加（akiraak 手作業）
  - Web表示のモバイル対応

## 2026-07-10

- [x] 事実チェックを常時実施に変更（対象は客観的事実の記述のみ・ユーモア保全）（[archived plan](docs/plans/archive/factcheck-always-with-content-scope.md)）
  - ジャンル単位の除外（物語・対話文＝フィクションで対象外）を廃止し、全ジャンル常時実施＋内容単位のスコープ判定に変更。チェック対象は客観的事実の記述のみ（セリフ内の事実も対象）、会話のやりとり・主観・架空設定・明らかなジョークは対象外。お笑い・ユーモアを消さない修正を最優先するルールを明文化
  - 更新: `esl-level-spec.md`（ジャンル表・事実チェック方針）、`CLAUDE.md`、`workflows/config.md・research.md・outline.md・generate.md・factcheck.md`、`personas/skeptical-fact-checker.md・simplification-safety-checker.md・final-editor.md・esl-writer.md`、`docs/topic-ideas.md`
  - トマト会話3トピックに遡及適用（`requiresFactCheck: true`・sources コピー・outline v2 に根拠ソース記録・factcheck 実行）。Trial 版の根拠不明表現「by ship」1件を修正し音声を再生成。旧ルールの既存4トピック（Lost While Traveling 等）は遡及変更しない

- [x] 記事ページに読み上げキャラ名を表示する（Chobi / Naruko）（[archived plan](docs/plans/archive/audio-reader-name.md)）
  - `lib/site.js` の `audioBlock()` が `audio/v{N}.json` の `character` を読み、プレイヤー直前に「Read by Chobi / Naruko」ラベルを表示（manabi は表示名 Naruko）。メタデータ欠損時はラベル無し、印刷時はプレイヤーと共に非表示

- [x] 読み上げキャラ未指定時はトピック内で使用回数が偏らないよう選ぶ（[archived plan](docs/plans/archive/tts-character-balance.md)）
  - `generate-audio.js` の完全ランダム選択を、同トピックの既存音声（`variants/*/audio/*.json`）の `character` を集計して最少使用のキャラを選ぶ方式に変更（同数はランダム、上書き対象の自メタデータは集計から除外）。`workflows/audio.md`・`.env.example` の記述も更新

- [x] 記事ページのレイアウト順変更（パンくず→イラスト→タイトル→メタ→本文）（[archived plan](docs/plans/archive/article-page-layout-order.md)）
  - `lib/site.js` の `renderArticleContent()` でイラストをタイトルの前に移動。バージョンリンクはパンくず直後、音声プレイヤーはメタ情報後・本文前に配置

- [x] github pages に OGPタグを設定（[archived plan](docs/plans/archive/ogp-tags.md)）
  - `lib/site.js` の `layout()` に og:site_name / og:title / og:type / og:url / og:image / (og:)description / twitter:card の出力を追加し、各 `render*` が `description`・`imageParts`（トピックのイラスト）・`ogType` を返すように変更
  - 記事系ページの description は本文 Markdown 冒頭からの抜粋（~160字）、og:image はトピック共有イラスト（1536x864 のため twitter:card は summary_large_image）
  - 絶対URLの origin は静的ビルドでは `SITE_ORIGIN` 環境変数 > `GITHUB_REPOSITORY` の owner（`https://{owner}.github.io`）、ローカルサーバではリクエストの host から解決

- [x] 読み上げキャラ未指定時は chobi / manabi をランダムに使い分ける（[archived plan](docs/plans/archive/tts-random-character.md)）
  - `generate-audio.js` の既定キャラ（chobi 固定）を廃止し、CLI第3引数 > `GEMINI_TTS_CHARACTER` > ランダム選択に変更。選ばれたキャラは従来どおりログと `audio/v{N}.json` の `character` に記録
  - `workflows/audio.md` 手順2（ジャンルからの提案）を「指定なしはスクリプトのランダム選択に任せる。統一したい場合のみ既存音声の `character` に合わせて明示指定」に変更。`.env.example` の注記も更新

- [x] 音声読み上げを入れる（[archived plan](docs/plans/archive/listening-audio-tts.md)）
  - Phase 1〜4: `scripts/generate-audio.js`（Gemini 2.5 Flash Preview TTS でセグメント分割生成→無音注入→結合→MP3化）、`workflows/audio.md`、閲覧ページのプレイヤー組み込み、water-cycle B1-normal の実音声生成と聴感調整
  - 読み上げのキャラ設定（[archived plan](docs/plans/archive/tts-voice-characters.md)）: `~/claude-code-manager`（ai-monitor/voice-persona.json、元は ~/ai-twitch-cast）の2キャラの声設定を `generate-audio.js` の `CHARACTERS` として移植
    - `chobi`（先生役・デフォルト）= voice **Leda**・柔らかく楽しげなにこにこトーン / `manabi`（生徒役、claude-code-manager の「なるこ」の旧名）= voice **Aoede**・元気で明るく好奇心いっぱいのトーン
    - キャラ選択は CLI第3引数 > `GEMINI_TTS_CHARACTER` > 既定 chobi。スタイル指示はレベル別の速度指示＋キャラの声色を連結。`audio/v{N}.json` に `character` を記録
    - `GEMINI_TTS_VOICE` は「キャラの声を明示的に差し替える場合のみ」の位置づけに変更（`.env` / `.env.example` から `Kore` 既定値を撤去）
    - 公開済みの water-cycle B1-normal `audio/v1.mp3` を chobi（Leda）で再生成（3分00秒、旧 Kore 版と同等の尺）

## 2026-07-09

- [x] 印刷時に先頭にURLを表示（[archived plan](docs/plans/archive/print-page-url.md)）
  - `lib/site.js`の`layout()`で`<body>`直後に`.print-url`要素を追加し、インラインスクリプトで`location.href`を書き込む（ローカルサーバとGitHub Pagesの両方でビルド時にURLを確定できないため実行時に取得）
  - CSSで通常表示時は`display: none`、`@media print`時のみ純黒・小さめの文字で表示（長いURLの折り返し用に`word-break: break-all`）
  - `server.js`・`scripts/build-static-site.js`共通の`lib/site.js`のみの変更のため両方に反映。ローカルサーバのHTMLと`npm run build`のdist出力の両方に要素・スタイル・スクリプトが含まれることを確認

- [x] フォントが見ずらいのでちゃんと決める（[archived plan](docs/plans/archive/readable-font.md)）
  - 旧指定の `Trebuchet MS` は字形にクセがあり、Windows 以外ではフォールバックもバラつくため、Google Fonts の **Atkinson Hyperlegible Next**（Braille Institute 設計、紛らわしい文字 I/l/1・rn/m 等の判別性を最優先した書体）に変更。ESL 読解用途に適する
  - `lib/site.js` の `layout()` に Google Fonts の `<link>`（preconnect + 可変フォント 400〜800・イタリック込み）を追加し、`body` の font-family を差し替え。日本語はシステムフォント（Hiragino Sans / Yu Gothic UI / Meiryo）にフォールバック、オフライン時は Segoe UI 等へ自然にフォールバック
  - `npm run build` の出力に link と新 font-family が含まれることを確認。ローカルサーバを headless Chromium で開き、`document.fonts` でフォント読み込み・computed style での適用・スクリーンショットでの描画を確認

- [x] トピックのアイデアページを作成。新規にページを作成するときはそのページを見たり新規に追加したりする（[archived plan](docs/plans/archive/topic-ideas-page.md)）
  - `docs/topic-ideas.md` を新規作成。「アイデア一覧」（カテゴリで分類できるネストした箇条書きのツリー、全8ジャンルから15案を初期投入）と「採用済み」（既存3トピックを記録）の2部構成
  - `workflows/config.md` 手順2にアイデアページの参照（未定なら候補提示、指定ありなら採用済みとの重複チェック）を追加し、新手順7として採用の記録・アイデア2〜3件の補充を追加（旧手順7は8に繰り下げ）
  - アイデア追加だけを単体で実行できる `workflows/add-ideas.md` を新規作成（生成パイプラインとは独立、CLAUDE.md・config.md から相互参照）
  - Webビューアに `/topic-ideas` ページを追加（`lib/site.js` の `renderTopicIdeas` がツリーをパースしてネスト表示、採用済みはトピックページへリンク）。トップページからリンク

- [x] 印刷時に文字の色が薄くなる原因の調査を対応策を考える（[archived plan](docs/plans/archive/print-color-fade.md)）
  - 原因: `lib/site.js`の画面用配色（本文`#2f2a3a`、見出し`#3d3560`、メタ情報`#7a7290`等）がいずれも純黒でなく、`@media print`用の上書きも無かったため、印刷パイプラインの省インク補正・CMYK変換でさらに薄く出ていた
  - `layout()`の`<style>`に`@media print`ブロックを追加し、印刷時は本文・見出し・メタ情報・テーブル等の文字色を`#000`に強制、装飾用の背景色/box-shadowは白背景・グレー枠線に簡略化
  - 手書きメモを書き込めるよう、`article`の枠線・paddingは印刷時のみ描画しない（`border: none; padding: 0;`）よう追加対応
  - `server.js`・`scripts/build-static-site.js`共通の`lib/site.js`のみの変更のため両方に自動反映。`npm run build`で生成されたdist/index.htmlに`@media print`ブロックが正しく含まれることを確認

- [x] トップページの記事一覧にサムネを表示（[archived plan](docs/plans/archive/top-page-thumbnails.md)）
  - `lib/site.js`の`renderIndex`で、トピックごとに`latestIllustrationVersion()`でイラストの有無を確認し、あれば`<li>`内に72x72のサムネイル画像を追加
  - `<li>`をflexレイアウト化（サムネ+テキスト情報を横並び）。イラスト未生成のトピックはサムネイル枠なしでテキストのみ従来通り表示
  - `npm start`・`npm run build`双方の出力でサムネイルURL・200応答を確認

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