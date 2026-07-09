# ESLテキスト レベル・形式定義

`workflows/config.md`・`workflows/outline.md`・`workflows/generate.md` から共通で参照する仕様。
CEFR レベルごとの語彙・文長・語数の目安と、ESL読解に適した文章形式を定義する。

このファイルの値は生成物をレビューする際の判断基準（目安）であり、外部ツールでの厳密な語彙チェックを要求するものではない。
Claude Code が本文執筆・レビュー時にこの表を参照し、レベルに見合っているか判断する。

## CEFR Level Definitions

| Level | Target Word Count: Normal | Target Word Count: Long | Target Word Count: Very Long | Avg. Sentence Length (words/sentence) | Vocabulary Range | Grammar Allowed | Avoid |
|---|---|---|---|---|---|---|---|
| A1 | 100-150 words | 250-350 words | 600+ words | 5-8 words | ~500 most frequent words (Oxford 3000 A1 band: be-verbs, basic pronouns, numbers/colors/family/daily-action vocabulary) | Present tense (be-verbs, simple verbs), basic prepositions, simple coordinating conjunctions (and/but/so) | Subordinate clauses, passive voice, mixed tenses, phrasal verbs, idioms |
| A2 | 150-300 words | 350-600 words | 700+ words | 8-10 words | ~1000 most frequent words (Oxford 3000 A1-A2 band) | Past tense, future expressions (will / be going to), modal verbs (can/must/should), frequency adverbs | Present perfect, conditionals, relative clauses, complex phrasal verbs |
| B1 | 300-600 words | 700-1200 words | 1500+ words | 10-14 words | ~2000 words (full Oxford 3000) | Present perfect, basic passive voice, first conditional (if + present tense), comparatives/superlatives, basic relative pronouns (who/which/that) | 2nd/3rd conditionals, subjunctive mood, complex inversion, specialized academic vocabulary |
| B2 | 600-1000 words | 1300-2000 words | 2500+ words | 14-18 words | ~3000-4000 words (Oxford 5000 band, including common phrasal verbs/idioms) | 2nd/3rd conditionals, relative clauses (including reduced forms), causative verbs (have/get + O + done), basic participial phrases | Field-specific terminology, highly literary/poetic figurative language |
| C1 | 1000-1500 words | 2000-3000 words | 4000+ words | 18-22 words | 5000+ words, including academic/abstract vocabulary | Multiple layers of complex subordinate clauses, subjunctive mood, inversion, advanced discourse markers (nevertheless, whereby, etc.) | None in particular (native-level advanced vocabulary/structures allowed) |
| C2 | 1500+ words | 3000+ words | 6000+ words | No limit | No limit (native level) | No limit | None in particular |

Notes:
- "Target word count" is the approximate word-count range for the entire text (body only, excluding the title). Choose one of **three length tiers: Normal / Long / Very Long**.
  The free-form word-count override that existed in `long-form-article-structure.md` has been removed in favor of this fixed 3-tier system
  (see [topic-variants-and-length-tiers.md](../plans/topic-variants-and-length-tiers.md) for details).
- "Long" is roughly 2x "Normal", and "Very Long" is roughly 4-5x "Normal" (rounded figures, adjustable based on real usage).
- Oxford 3000 / Oxford 5000 are cited as reference names for the vocabulary range, but no actual list matching is performed; treat them as an intuitive sense of "words at that difficulty band."
- There are 6 levels, but for the user's convenience `config.md` may first offer a simpler 3-way choice — "Beginner (A1-A2) / Intermediate (B1-B2) / Advanced (C1-C2)" — and confirm the specific level afterward if needed.
- **Level (vocabulary/grammar difficulty) and length (text length) are independent parameters.** The length tier (Normal/Long/Very Long) can be freely chosen regardless of level
  (e.g., a long "Very Long" story using only easy A1 vocabulary, or a short "Normal" text using difficult C1 vocabulary, are both valid).
  However, "average sentence length," "vocabulary range," and "grammar allowed" are defined by the level itself and do not change with length.
  - For a low level combined with a long length, the text must reach the target length within a limited vocabulary/grammar range, so outlines should stack up events and descriptions rather than relying on simple repetition (adjust this during outline creation)

## ESL読解に適した文章形式（ジャンル）

読解練習として成立しやすい形式と、それぞれが適するレベル帯の目安。

| 形式 | 説明 | 適したレベル帯 | 事実チェック | 備考 |
|---|---|---|---|---|
| 物語（Narrative） | 起承転結のある短い物語。登場人物・出来事の推移がある | A1〜C2（全レベル可） | 不要（フィクション） | 「読んでいて楽しい」を満たす主力形式。レベルが上がるほど心理描写・伏線・視点切り替えなどを加える |
| 対話文（Dialogue） | 2〜3人の会話形式。日常シーン（買い物・旅行・自己紹介など） | A1〜B1 | 不要（フィクション） | 短い発話の積み重ねで文長を自然に短く保てるため初級向き |
| 説明文（Descriptive） | 人・場所・物の様子を説明する | A1〜B2 | 要 | 形容詞・比較表現の練習に向く。架空の人物・場所を明示的に扱う場合は config.md で「フィクション扱い」を選び対象外にできる |
| 手順文（Instructional） | 料理のレシピ、道案内、使い方など手順を説明する | A2〜B1 | 要 | 命令形・順序を表す接続語（first, then, finally）の練習に向く |
| 説明的文章（Expository） | ある事実・トピックについて客観的に説明する | B1〜C1 | 要 | 事実ベースのため語彙が専門寄りになりやすく、レベルに応じた語彙制御が特に重要 |
| 日記・手紙・メール（Personal writing） | 一人称視点の私的な文章 | A2〜B2 | 要 | 口語的表現・感情表現の練習に向く。架空の人物の日記など明示的にフィクションと設定する場合は対象外にできる |
| ニュース記事風（News-style） | ニュース記事を模した客観的な報道文 | B1〜C1 | 要 | 見出し・リード文・本文の構成練習になるが、時事語彙が難化要因になりやすい |
| 意見文・エッセイ（Opinion/Essay） | あるテーマについて主張と根拠を述べる | B2〜C2 | 要 | 論理接続語・譲歩構文の練習に向くが初級には不向き |

補足:
- 1回の生成で扱う形式は `workflows/config.md` で利用者に選んでもらう（未指定時は物語をデフォルトとする）
- 同じトピックでも形式によって適したレベル帯が変わるため、outline作成時にレベルと形式の組み合わせが極端に不整合でないか確認する
  （例: A1レベルで意見文・エッセイは基本的に不向き）

## 長文モード（見出し・サマリー・目次構成）

語数（テキストの分量）が大きい場合、単一ブロックの文章のままだと長くなるほど読みにくい。これは**レベル（語彙・文法の難度）とは独立**に、
確定した「レベル × 分量（通常/長い/すごく長い）」の組み合わせから上表で解決される語数レンジだけで自動判定する。
たとえば A1 で「すごく長い」（600語以上）を選んだ場合も対象になり得る。

- **対象条件**: 上表で解決した語数レンジの下限が概ね600語以上の組み合わせは自動的に `longForm: true` とする（利用者への個別の確認は行わない）
  - 600語未満の組み合わせ（例: A1〜B1の「通常」「長い」）は常に `longForm: false` とし、単一ブロックの短い文章のままとする
- **構成**: `H1タイトル → リード文（1段落、記事全体の要約） → H2セクション見出し＋本文` の繰り返し
- リード文・各セクションの語彙・文長は、通常の本文と同じくレベル行（語彙範囲・使ってよい文法項目・避けるもの）の目安を守る
  （長文モードだからといって語彙・文法の難度は上がらない。難度はあくまでレベルが決める）
- 目次はサイト表示側（`lib/site.js`）がH2見出しから自動生成するため、**本文には目次やアンカーリンクを手書きしない**
- 管理はバリアントごとの `variant.json` の `longForm: true/false` で行う（詳細は [topic-variants-and-length-tiers.md](../plans/topic-variants-and-length-tiers.md) を参照）
- 出力フォーマットの詳細は [personas/esl-writer.md](../../personas/esl-writer.md) を参照

## 事実チェック方針

物語・対話文など明らかにフィクションとわかるジャンルは対象外とし、それ以外（説明文・手順文・説明的文章・日記/手紙/メール・ニュース記事風・意見文/エッセイ）は
生成した本文の事実面（地名・人物・歴史的事実・数値・科学的事実など）が実在の情報と食い違っていないかを外部資料で確認する。

- 対象判定は上表の「事実チェック」列（ジャンル単位）を基本とする。ただし `workflows/config.md` で「この文章は架空の人物・場所を扱うフィクションである」と
  明示された場合は、ジャンルが「要」でも対象外にできる
- チェック方法の詳細（情報収集・突き合わせ・修正のワークフロー）は `workflows/research.md`・`workflows/factcheck.md` を参照
- ESLレベル制約（語彙・文長）による簡略化・言い換えは事実チェックの対象外。「事実として書かれている内容そのもの」が正しいかどうかのみを見る

## ルールの更新

このファイルの値・分類は初期案であり、実際に生成・レビューを重ねる中で調整が必要になった場合はここを直接更新する。
既存ルールと矛盾する場合は新しい判断を優先し、変更理由が分かるよう簡潔にコメントを残す。
