# ESL学習用テキスト生成の仕組み作り

## 目的・背景

esl-text-audio は ESL学習者向けに読解用テキスト・リスニング音声・読解確認問題を生成するツール。
本タスクはそのうち「読解用テキストの生成」部分の仕組みを作る。

現状このリポジトリにはコードが存在しない。本文生成自体を LLM API を直接呼ぶコードとして実装するのではなく、
`~/git-art` や `~/deep-pulse` と同様に **Claude Code 自身が `workflows/*.md` の指示に従って対話的に生成する方式**を踏襲する
（TODO.md に記載済みの方針）。理由:
- 生成物の質はワークフロー内での対話・確認（利用者によるアウトライン承認、フィードバックに基づく調整）に依存する部分が大きく、
  API 経由のワンショット生成より Claude Code 上での対話生成の方が相性が良い
- 参考にした2プロジェクトとも同じ方式を採用し、実運用されている

音声生成・確認問題生成は別タスクのため対象外。今回はテキスト生成のワークフローとディレクトリ構成の土台を作る。

## 対応方針

### ディレクトリ構成

```
esl-text-audio/
├── CLAUDE.md
├── docs/
│   └── specs/
│       └── esl-level-spec.md   # CEFRレベル別の語彙・文長・語数、文章形式（ジャンル）・事実チェック方針の定義
├── workflows/
│   ├── config.md       # トピック・英語レベルなど生成条件の収集
│   ├── research.md      # 事実チェック対象ジャンルの場合の外部資料収集
│   ├── outline.md       # アウトライン（構成案）作成・承認
│   ├── generate.md      # 本文生成
│   ├── factcheck.md     # 生成した本文と外部資料の突き合わせ・修正
│   └── brushup.md       # フィードバックに基づく調整・再生成
├── personas/             # 生成・チェック時に使うAIペルソナ定義（1ペルソナ1ファイル、作成済み）
│   ├── README.md            # ペルソナ一覧・使用ワークフロー・運用ルール
│   ├── esl-writer.md         # ESL教材ライター（outline/generate）
│   ├── learner-simulator.md  # 学習者シミュレーター（generate）
│   ├── skeptical-fact-checker.md        # 懐疑的ファクトチェッカー（factcheck）
│   ├── simplification-safety-checker.md # 簡略化セーフティチェッカー（factcheck）
│   └── final-editor.md       # 最終エディター（generate最終/brushup）
├── texts/                # 生成物（gitignore 対象）
│   └── {topic-slug}-{YYYYMMDD-HHMMSS}/
│       ├── config.json     # トピック・英語レベル・語数目安・事実チェック要否など
│       ├── sources/        # 事実チェック対象ジャンルの場合のみ作成。外部資料をMarkdownで保存
│       │   ├── 001_ドメイン名_ページ概要.md
│       │   └── 002_ドメイン名_ページ概要.md
│       ├── outlines/
│       │   ├── v1.md
│       │   └── v2.md
│       └── articles/
│           ├── v1.md
│           └── v2.md
```

- `texts/` は git-art の `projects/` に相当。gitignore 対象とし、生成物はローカルにのみ保存する
- outline / article ともにバージョン管理し、brushup のたびに新しいバージョンとして保存する（既存バージョンを直接編集しない）
- article のバージョン番号は生成元 outline のバージョン番号に合わせる（git-art のルールを踏襲）
- レベル別の語彙・文長・語数の目安、ESL読解に適した文章形式（ジャンル）、事実チェック方針は `docs/specs/esl-level-spec.md`（作成済み）に一元化する。
  `workflows/config.md`（レベル・形式の選択肢提示、事実チェック要否判定）、`workflows/outline.md`（形式とレベルの整合確認）、
  `workflows/generate.md`（執筆・レビュー時の判断基準）の各ワークフローはこのファイルを参照する形にし、
  レベル定義・事実チェック方針を複数箇所に重複して書かない
- `sources/` は deep-pulse の `sources/` に相当。取得した外部資料は要約せず、事実確認に必要な文章をそのまま Markdown で保存し、
  先頭に `url` / `title` の YAML フロントマターを付与する（deep-pulse のソース保存ルールを踏襲。ただし deep-pulse の
  `scripts/fetch_source.py` のような専用スクリプトは作らず、WebSearch / WebFetch で直接取得する）
- `personas/` は本文生成・事実チェックの各段階で異なる視点を持たせるためのペルソナ定義集（作成済み）。
  1ペルソナ1ファイルとし、直下の `README.md` に一覧・使用ワークフロー・運用ルールをまとめる。
  各 `workflows/*.md` は該当する `personas/*.md` を参照してそのペルソナとして振る舞う

### 生成フロー（6ワークフロー）

1. **`workflows/config.md`（条件収集）**
   - 入力: トピック（主題）、英語レベル、（任意）語数目安・ジャンル（物語/説明文/対話文など）
   - 英語レベル・ジャンルの選択肢は `docs/specs/esl-level-spec.md` の表に基づいて提示する（初級/中級/上級の3段階から選んでもらい、必要なら詳細レベルを確認する運用も可）
   - `docs/specs/esl-level-spec.md`「事実チェック方針」に基づき、選択したジャンルが事実チェック対象かどうかを判定する。
     ジャンルが対象でも「架空の人物・場所を扱うフィクションである」と利用者が明示した場合は対象外にできる（この場合も config.json に理由を記録する）
   - 収集した内容（`requiresFactCheck: true/false` を含む）を `texts/{topic-slug}-{timestamp}/config.json` に保存する

2. **`workflows/research.md`（外部資料収集、`requiresFactCheck: true` の場合のみ実行）**
   - トピックに関連する信頼できる情報源を WebSearch で探し、WebFetch で取得する
   - 取得内容は要約せず、事実確認に必要な範囲でそのまま `sources/{連番}_ドメイン名_ページ概要.md` として保存する
   - 各ファイル先頭に `url` / `title` の YAML フロントマターを付与する（deep-pulse のソース保存ルールを踏襲）
   - `requiresFactCheck: false` の場合はこのワークフローをスキップする

3. **`workflows/outline.md`（アウトライン作成）**
   - [personas/esl-writer.md](../../personas/esl-writer.md) のペルソナで、config を読み話の流れ・段落構成（導入/展開/結末など）を利用者と対話しながら決定
   - `docs/specs/esl-level-spec.md` のジャンル別レベル帯を参照し、指定レベルと選択形式の組み合わせが極端に不整合でないか確認する（例: A1で意見文・エッセイは避ける）
   - `requiresFactCheck: true` の場合、各セクションでどの事実（`sources/` 内のどのファイル）を根拠にするかをアウトライン内に記録する（deep-pulse の plan ファイルの「セクションごとのソース記録」ルールを踏襲。コンテキスト圧縮で失われないようにするため）
   - `outlines/v1.md` に保存し、利用者の承認を得る
   - フィードバックがあれば `outlines/v{N+1}.md` として更新（brushup と同様の版管理）

4. **`workflows/generate.md`（本文生成）**
   - [personas/esl-writer.md](../../personas/esl-writer.md) のペルソナで、config と承認済み outline を読み本文を生成して `articles/v{N}.md` に保存する（N は元にした outline のバージョン番号）
   - `requiresFactCheck: true` の場合、事実に関わる記述を書く前に対応する `sources/` のファイルを読み、内容を確認しながら執筆する
   - 生成時に重視する観点（TODO.md 記載の「ESL学習に適した内容」「読んでいて楽しいこと」）を満たすため、`docs/specs/esl-level-spec.md` の該当レベル行（総語数・平均文長・語彙範囲・使ってよい文法項目・避けるもの）を判断基準として以下をチェックリスト化する:
     - 指定 CEFR レベルの語彙・文法範囲に収まっているか
     - 総語数・平均文長がレベルの目安レンジに収まっているか
     - ストーリーとして興味を持って読み進められるか（起伏・オチ・意外性など）
     - 不要に難解な慣用句・文化依存の言い回しを避けているか
   - 執筆後、[personas/learner-simulator.md](../../personas/learner-simulator.md) のペルソナでセルフレビューし、つまずき箇所があれば執筆に戻って修正する
   - `requiresFactCheck: false` の場合は、[personas/final-editor.md](../../personas/final-editor.md) のペルソナで学習者シミュレーターの指摘を統合し、このステップで `articles/v{N}.md` を確定する（`requiresFactCheck: true` の場合の最終統合は factcheck 後に行う）

5. **`workflows/factcheck.md`（事実確認、`requiresFactCheck: true` の場合のみ実行）**
   - [personas/skeptical-fact-checker.md](../../personas/skeptical-fact-checker.md) のペルソナで、生成した本文中の事実に関わる記述（地名・人物・歴史的事実・数値・科学的事実など）を洗い出し、`sources/` 内の該当ファイルと突き合わせる
   - [personas/simplification-safety-checker.md](../../personas/simplification-safety-checker.md) のペルソナで、ESLレベル向けの簡略化によって事実の意味が歪んでいないか（誇張・条件の省略・ニュアンスの変化・数値の誤解を招く丸めなど）を確認する
   - 両ペルソナの指摘を [personas/final-editor.md](../../personas/final-editor.md) のペルソナで統合し、事実の正確性を最優先に反映方針を決める
   - 食い違い・歪みが見つかった場合は本文を修正し、両ペルソナの指摘がなくなるまでこのステップを繰り返す（deep-pulse のファクトチェックルールを踏襲）
   - 修正後の本文は同じ `articles/v{N}.md` に対する事実修正として扱い、内容が大きく変わる場合は新バージョンとして保存する
   - `requiresFactCheck: false` の場合はこのワークフローをスキップする

6. **`workflows/brushup.md`（調整・再生成）**
   - 利用者のフィードバックを受け、outline 側を更新すべきか本文のみ調整すべきかを判断
   - 新しいバージョンとして `articles/v{N+1}.md`（または outline 更新後に再生成）を保存する
   - 既存バージョンのファイルを直接上書きしない
   - [personas/final-editor.md](../../personas/final-editor.md) のペルソナで最終確認し、`requiresFactCheck: true` かつフィードバックが事実に関わる記述に影響する場合は、再生成後に `workflows/factcheck.md` を再実行する

### CLAUDE.md への追記内容（案）

- 上記ディレクトリ構成・ワークフロー一覧
- 「トピックと英語レベルだけが送られてきた場合は config → (research) → outline → generate → (factcheck) を開始する」のような入り口の定義
- 英語レベル（CEFR）ごとの目安表（語彙・文長・文法項目）は `docs/specs/esl-level-spec.md` 参照
- 事実チェックの対象判定（ジャンルベース、フィクション明示時は対象外）の概要
- `texts/` を `.gitignore` に追加

## 影響範囲

- 新規ファイルのみ（既存コードなし、破壊的変更なし）
  - `CLAUDE.md`（追記）
  - `docs/specs/esl-level-spec.md`（新規・作成済み、事実チェック方針を含む）
  - `personas/README.md`, `personas/esl-writer.md`, `personas/learner-simulator.md`, `personas/skeptical-fact-checker.md`,
    `personas/simplification-safety-checker.md`, `personas/final-editor.md`（新規・作成済み）
  - `workflows/config.md`, `workflows/research.md`, `workflows/outline.md`, `workflows/generate.md`, `workflows/factcheck.md`, `workflows/brushup.md`（新規）
  - `.gitignore`（`texts/` を追加）
- 音声生成・確認問題生成のワークフローは対象外（将来的に `workflows/audio.md` や `workflows/quiz.md` として追加予定だが本タスクには含めない）
- 外部資料の取得は WebSearch / WebFetch を用いる。deep-pulse のような専用フェッチスクリプト（`scripts/fetch_source.py` 相当）は本タスクでは作らない

## テスト方針

コードを伴わない（Markdown ワークフロー定義のみの）タスクのため、以下の方法で動作確認する。

1. 事実チェック対象外のサンプルトピック（例: "旅行中に道に迷った話", 物語, レベル A2）で
   config → outline → generate → brushup 一往復を実行し、`texts/` 配下に想定通りのファイル・バージョンが作られ、
   `sources/` が作られない（`requiresFactCheck: false`）ことを確認する
2. 事実チェック対象のサンプルトピック（例: "水の循環について", 説明的文章, レベル B1）で
   config → research → outline → generate → factcheck 一通りを実行し、
   - `sources/` に取得した資料が保存されること
   - outline に各セクションの根拠ソースが記録されること
   - factcheck で意図的に事実誤りを含む下書きを与えた場合に、[personas/skeptical-fact-checker.md](../../personas/skeptical-fact-checker.md) が検出・修正できること
   - 意図的に「易化しすぎて事実が歪んだ」下書きを与えた場合に、[personas/simplification-safety-checker.md](../../personas/simplification-safety-checker.md) が検出できること
   を確認する
3. 生成された本文が指定した CEFR レベルの語彙・文長に収まっているか目視レビューする。あわせて
   [personas/learner-simulator.md](../../personas/learner-simulator.md) のセルフレビューが実際に機能しているか（意図的にレベル外の単語を混ぜた下書きで検出できるか）を確認する
4. brushup 実行後、旧バージョンのファイルが変更されず新バージョンが追加されていることを確認する

## Phase / Step

- [x] Phase 1: `docs/specs/esl-level-spec.md` 作成（CEFRレベル別の語彙・文長・語数、文章形式・事実チェック方針の定義）
- [x] Phase 2: `personas/` 作成（README.md + ESL教材ライター・学習者シミュレーター・懐疑的ファクトチェッカー・簡略化セーフティチェッカー・最終エディターの5ペルソナ）
- [x] Phase 3: ディレクトリ構成・CLAUDE.md 追記（全体設計を反映する土台作り、`.gitignore` に `texts/` 追加）
- [x] Phase 4: `workflows/config.md` 作成（トピック・英語レベル・形式収集、事実チェック要否判定、esl-level-spec.md を参照）
- [x] Phase 5: `workflows/research.md` 作成（事実チェック対象時の外部資料収集・`sources/` 保存）
- [x] Phase 6: `workflows/outline.md` 作成（アウトライン作成・承認・バージョン管理、レベルと形式の整合確認、セクション別ソース記録、esl-writerペルソナ適用）
- [ ] Phase 7: `workflows/generate.md` 作成（本文生成・esl-level-spec.md に基づく適性チェックリスト反映、ソース参照執筆、esl-writer/learner-simulator/final-editorペルソナ適用）
- [ ] Phase 8: `workflows/factcheck.md` 作成（生成本文と `sources/` の突き合わせ・修正の反復、skeptical-fact-checker/simplification-safety-checker/final-editorペルソナ適用）
- [ ] Phase 9: `workflows/brushup.md` 作成（フィードバック反映・再生成、事実に関わる修正時は factcheck 再実行、final-editorペルソナ適用）
- [ ] Phase 10: サンプルトピックでの通し動作確認（テスト方針の実施、事実チェック対象・対象外の両パターン、各ペルソナの動作確認）
