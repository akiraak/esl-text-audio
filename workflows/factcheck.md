# workflows/factcheck.md — 事実確認

ESL学習用テキスト生成フローの5番目のステップ（**常に実行する**）。
[personas/skeptical-fact-checker.md](../personas/skeptical-fact-checker.md) と
[personas/simplification-safety-checker.md](../personas/simplification-safety-checker.md) のペルソナで
[workflows/generate.md](generate.md) が生成した本文と `sources/` を突き合わせ、
[personas/final-editor.md](../personas/final-editor.md) のペルソナで指摘を統合して事実面を確定する。

参照: [docs/specs/esl-level-spec.md](../docs/specs/esl-level-spec.md)（事実チェック方針）、
[personas/skeptical-fact-checker.md](../personas/skeptical-fact-checker.md)、
[personas/simplification-safety-checker.md](../personas/simplification-safety-checker.md)、
[personas/final-editor.md](../personas/final-editor.md)

## チェック対象のスコープ

チェック対象は本文全体ではなく、**現実世界について客観的事実として書かれている記述のみ**
（定義の一元管理は [esl-level-spec.md](../docs/specs/esl-level-spec.md) の「事実チェック方針」）。

- **対象**: 実在の地名・人物・歴史的事実・日付・数値・科学的事実など。**登場人物のセリフの中で語られる現実世界の事実も対象**
  （例: 会話文中で先生が説明する科学・歴史）
- **対象外**: 会話のやりとりそのもの（相づち・リアクション・冗談・言い回し）、登場人物の意見・感想など主観的な内容、
  架空の設定（架空の人物・場所・出来事とその設定内での描写）
- **ユーモアの扱い**: 明らかにジョークとして書かれた誇張・演出（例: 劇中のセリフ回し・オチ）は事実の主張として扱わない。
  お笑いは教材の中核的な価値であり、事実修正でもジョーク・オチを消さない言い換えを最優先で探す

## 実行条件

- 常に実行する（2026-07-10 のルール変更以前は `requiresFactCheck: false` のトピックはスキップしていた。既存の `false` トピックは旧ルールのまま）
- `sources/` が存在しないトピック（research.md を「収集対象なし」でスキップした場合）は、本文にチェック対象となる
  客観的事実の記述が本当に無いことを確認する。無ければ「対象なし」として利用者に報告し、このワークフローを完了とする。
  もし記述が見つかった場合は [workflows/research.md](research.md) に戻って資料を収集してから再開する

## 前提

- `texts/{topic-slug}-{timestamp}/variants/{level}-{tier}/articles/v{N}.md` に [workflows/generate.md](generate.md) の本文（学習者シミュレーターのセルフレビュー済み・最終エディターによる統合前）が存在すること
- `texts/{topic-slug}-{timestamp}/variants/{level}-{tier}/variant.json` の `outlineTier` / `outlineVersion` から対応する `outlines/{outlineTier}/v{outlineVersion}.md` が特定できること
- 客観的事実の記述を含むトピックの場合、`sources/`（トピック直下、バリアント間で共通）に [workflows/research.md](research.md) で取得した外部資料が保存済みであり、
  `outlines/{outlineTier}/v{outlineVersion}.md` の該当セクションに根拠ソースが記録されていること

## 手順

### 1. 本文・outline・sources の確認

- `articles/v{N}.md` を読み、事実確認の対象とする本文全体を把握する
- `variant.json` を読み、対応する `outlines/{outlineTier}/v{outlineVersion}.md` を特定する。そのセクション別ソース記録を読み、各セクションがどの `sources/` ファイルを根拠にしているか把握する
- `sources/` のファイル一覧に目を通し、参照可能な原資料の範囲を把握する

### 2. 懐疑的ファクトチェッカーによる事実確認

- [personas/skeptical-fact-checker.md](../personas/skeptical-fact-checker.md) のペルソナで、本文中のチェック対象記述
  （上記スコープ: 客観的事実の記述のみ。セリフ内の事実を含み、会話のやりとり・主観・架空設定・明らかなジョークは除く）を洗い出し、
  該当する `sources/` のファイルと突き合わせる
- 出力形式はペルソナ定義に従い、主張ごとに「判定（OK / 要修正 / 根拠不明）・根拠ファイル・理由」のリストとする

### 3. 簡略化セーフティチェッカーによる歪み確認

- [personas/simplification-safety-checker.md](../personas/simplification-safety-checker.md) のペルソナで、ESLレベル向けの簡略化によって
  事実の意味が歪んでいないか（誇張・条件の省略・ニュアンスの変化・数値の誤解を招く丸めなど）を確認する
- 出力形式はペルソナ定義に従い、歪みが疑われる箇所ごとに「現在の記述・元の事実・問題点・修正提案」のリストとする。問題が無ければ「歪みなし」と出力する

### 4. 最終エディターによる統合・反映方針の決定

- [personas/final-editor.md](../personas/final-editor.md) のペルソナで、手順2・3で出た指摘を受け取り、事実の正確性を最優先に反映方針を決める
- 両ペルソナの指摘が矛盾する場合（例: 簡略化セーフティチェッカーの修正提案が懐疑的ファクトチェッカーの指摘する食い違いを解消しきれない場合）も、
  final-editor のペルソナ定義に従い事実の正確性を優先した判断を行う

### 5. 本文の修正

- 手順4で反映すると決めた指摘に沿って、[personas/esl-writer.md](../personas/esl-writer.md) のペルソナに戻って本文を修正する
- 修正は根拠ソースの範囲内で行い、`sources/` にない事実を新たに書き加えない
- 修正の際、ジョーク・オチ・会話の楽しさを消さない言い換えを最優先で探す。どうしても正確性と両立しない場合のみ正確性を優先し、
  その場合も別の形でユーモアを補えないか検討する（お笑いは文章にとってとても大切）
- ESLレベル制約（語彙・文長）による簡略化・言い換えは事実チェックの対象外のため、修正時もレベル目安から逸脱させない
  （[esl-level-spec.md](../docs/specs/esl-level-spec.md) の該当レベル行を参照）

### 6. 繰り返し

- 手順2〜5を、懐疑的ファクトチェッカーの指摘（要修正・根拠不明）と簡略化セーフティチェッカーの指摘（歪みあり）が
  両方とも無くなるまで繰り返す（deep-pulse のファクトチェックルールを踏襲）

### 7. articles/v{N}.md への保存

- 食い違い・歪みが解消された本文は、同じ `variants/{level}-{tier}/articles/v{N}.md` に対する事実修正として上書き保存する
- 修正によって内容（構成・エピソード・主張の骨子など）が大きく変わった場合は、新バージョンとして `variants/{level}-{tier}/articles/v{N+1}.md` に保存する
  （既存バージョンは直接編集しないという基本ルールを優先する）

### 8. 次のワークフローへの案内

- この時点で本文は事実面も含めて確定。次に [workflows/illustrate.md](illustrate.md) を実行する
- 理解度確認問題（[workflows/questions.md](questions.md)）もこの時点から作成できる（illustrate / audio とは独立のため、並行して進めてよい）
