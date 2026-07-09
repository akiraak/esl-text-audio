# workflows/outline.md — バリアント設定・アウトライン作成・承認

ESL学習用テキスト生成フローの3番目のステップ（`requiresFactCheck: true` の場合は [research.md](research.md) の後、
`false` の場合は [config.md](config.md) の直後に実行）。[personas/esl-writer.md](../personas/esl-writer.md) のペルソナで、
**バリアント（レベル×分量）ごとに**条件を確定し、**分量（tier）単位で共有する**アウトラインを作成・承認した上で、
バリアントの生成条件を `variants/{level}-{tier}/variant.json` に保存する。

参照: [docs/specs/esl-level-spec.md](../docs/specs/esl-level-spec.md)（レベル・分量・長文モードの定義）、
[personas/esl-writer.md](../personas/esl-writer.md)、
[docs/plans/topic-variants-and-length-tiers.md](../docs/plans/topic-variants-and-length-tiers.md)（トピック・バリアント設計、アウトラインのカスケード派生ルール）

## 前提

- `texts/{topic-slug}-{timestamp}/config.json` が存在すること（トピック・ジャンル・事実チェック要否が確定済み）
- `requiresFactCheck: true` の場合、`sources/` に [workflows/research.md](research.md) で取得した外部資料が保存済みであること

## 手順

### 1. ペルソナの適用

以降の作業は [personas/esl-writer.md](../personas/esl-writer.md) のペルソナで行う。

### 2. トピック・sources の確認

- `config.json` を読み、`topic` / `genre` / `requiresFactCheck` を把握する
- `requiresFactCheck: true` の場合、`sources/` のファイル一覧にも目を通し、本文で使える事実要素を把握しておく

### 3. レベルの確定（このバリアントの）

- 既に CEFR レベル（A1〜C2）が明示されていればそのまま採用する
- 明示されていない場合は、利用者にとって分かりやすいよう「初級（A1-A2）/ 中級（B1-B2）/ 上級（C1-C2）」の3段階から選んでもらう
- 3段階のいずれかが選ばれた場合、[esl-level-spec.md](../docs/specs/esl-level-spec.md) の「CEFR レベル定義」表を提示し、
  その中でどのレベルに近づけたいか（例: 中級なら B1 寄りか B2 寄りか）を確認する。利用者が「お任せ」であれば範囲の中央寄りを選ばず、
  レベル帯の低い方（初級なら A1、中級なら B1、上級なら C1）をデフォルトとする
- 確定したら CEFR の6段階表記（例: `B1`）で保持する

### 4. 分量（長さ）の確定（このバリアントの）

- 利用者に **通常 / 長い / すごく長い** の3段階（分量tier、`normal` / `long` / `very-long`）から選んでもらう。未指定時は「通常」をデフォルトとする
- [esl-level-spec.md](../docs/specs/esl-level-spec.md) の「CEFR レベル定義」表から、手順3で確定したレベルの行×選択した分量tierの列を引き、`wordCountTarget`（語数目安）を確定する
- 同表の「長文モード」節のルールに従い、`wordCountTarget` の下限が概ね600語以上なら `longForm: true`、未満なら `longForm: false` を自動的に確定する（利用者への個別確認は行わない）

### 5. レベル・ジャンルの整合確認

- [esl-level-spec.md](../docs/specs/esl-level-spec.md) の「ESL読解に適した文章形式」表を参照し、手順3で確定した `level` と `config.json` の `genre` の組み合わせが
  「適したレベル帯」に含まれるか確認する
- 含まれない場合（例: A1で意見文・エッセイ）、不整合である旨を利用者に伝えた上で、それでも続行してよいか確認する（強制的にジャンル・レベルを変更はしない）
- このトピックで既に承認済みの他バリアントがあり、そこで一度この確認を行っている場合は、同じ警告を繰り返さず先に進めてよい

### 6. 既存バリアント・既存アウトラインの確認

- `variants/{level}-{tier}/` が既に存在する場合、そのバリアントは既に生成済み。新しいバリアントを作るのではなく [workflows/brushup.md](brushup.md) による調整が適切でないか利用者に確認する
  （新バージョンとして作り直したい場合のみ、このワークフローを続行してよい）
- `outlines/{tier}/` に承認済みのアウトライン（`v{N}.md`）が既に存在するか確認する
  - **存在する場合**: そのアウトラインをこのバリアントでもそのまま利用する。手順7（アウトラインの作成）を丸ごとスキップし、手順10（承認）では
    「既存の承認済みアウトラインをこのバリアントでも使うことの確認」のみ行った上で手順11（variant.json保存）に進む
  - **存在しない場合**: 手順7に進み、このトピックの既存アウトライン（他のtier）の有無に応じて新規作成／拡張／間引きのいずれかでアウトラインを作る

### 7. アウトラインの作成（新規／拡張／間引き）

このトピックで `outlines/normal/`・`outlines/long/`・`outlines/very-long/` のうち既に承認済みアウトラインがあるtierを確認し、以下のいずれかで進める。

#### 7a. 新規作成（このトピックにまだどのtierのアウトラインも無い場合）

- ジャンルに応じた典型構成をベースに提案する
  - 物語・対話文: 導入（状況設定）→ 展開（出来事の推移）→ 結末
  - 説明文・説明的文章: 導入（トピック提示）→ 本論（複数の観点・特徴）→ 結論
  - 手順文: 導入（何を作る/どこへ行くか）→ 手順（順序立てたステップ）→ まとめ
  - 日記・手紙・メール: 書き出し（宛先・状況）→ 本文（出来事・気持ち）→ 締めくくり
  - ニュース記事風: 見出し・リード文 → 本文（詳細・背景） → まとめ/引用
  - 意見文・エッセイ: 導入（主張の提示）→ 本論（根拠・具体例、譲歩があれば含む）→ 結論
- 分量tierに応じてセクション数・詳細度の目安を変える（あくまで目安。内容に応じて調整する）
  - `normal`: 上記の型に沿った core のみ、3〜5セクション程度
  - `long`: core に加えて具体例・補足的な観点・エピソードなどを1〜数個追加、6〜9セクション程度
  - `very-long`: `long` をさらに細分化し、複数のサブトピック・視点・具体的なエピソードを厚く扱う、7〜12セクション程度
- 各セクションについて、以下を利用者と対話しながら決める
  - 役割（導入/展開/結末、または本論内の各観点など）
  - そのセクションで書く内容の要点（日本語で1〜2文のサマリでよい。英文自体はこの段階では書かない。**レベルに依存しない書き方にする**。このアウトラインは同じトピックの複数レベルのバリアントで共有されるため）
  - 本文で使う英語見出し候補（短いフレーズ。実際に使うかどうか・どの語彙レベルで表現するかは、各バリアントの `longForm` に応じて [workflows/generate.md](generate.md) 側で調整する）
- 「読んでいて楽しい」を満たすため、起伏・オチ・意外性などの要素をどのセクションに置くか明示する

#### 7b. 拡張（このトピックの既存の最長tierより、さらに長いtierを作る場合）

- 既存の最長tierの承認済みアウトラインを土台にする
- 核となる内容（導入〜結末・結論の骨格）は変更せず、以下の方向で厚みを加える
  - 具体例・補足的な観点・関連エピソードのセクションを新規追加する
  - 既存セクションをより細かい複数セクションに分割する
- `requiresFactCheck: true` の場合、新規追加するセクションが `sources/` の範囲で裏付けられるか確認する。裏付けが取れない場合、そのセクションでは断定を避けるか、
  追加の資料収集が必要な旨を利用者に伝えて [workflows/research.md](research.md) に一度戻ることを提案する
- 拡張後のアウトラインがこのトピックの新しい「現在の最長アウトライン」になる

#### 7c. 間引き（このトピックの既存アウトラインより短いtierを作る場合）

- 直近上位（1段階上）のtierの承認済みアウトラインを土台にする。中間のtierのアウトラインがまだ無い場合は、先にそのtierを7cの手順で作ってから、さらに短いtierを作る
  （例: `very-long` しか無いトピックで `normal` が欲しい場合、先に `long` を作ってから `normal` を作る。一気に間引かず1段階ずつ間引くことで不自然になりにくくする）
- 補足的な観点・具体例・エピソードなど、無くても核となる話の流れが破綻しないセクションを優先して削除・統合する
- 導入・核となる展開・結末（結論）などコアの骨格は残す。複数セクションを1つに統合することで自然な流れを保てる場合はそちらを優先する
- 間引いた結果、話が唐突に終わる・伏線が回収されないなど不自然にならないか、利用者と確認しながら調整する

### 8. セクション別ソース記録（`requiresFactCheck: true` の場合のみ）

- 事実に関わる記述を含むセクションごとに、根拠とする `sources/` のファイル名をアウトライン内に記録する
- 該当する事実の根拠が `sources/` 内に見当たらない場合、そのセクションでは言及を避けるか、断定を避けた表現にするなど扱いを弱める方向で調整する
- この記録は [workflows/generate.md](generate.md)・[workflows/factcheck.md](factcheck.md) がコンテキスト圧縮後も参照できるよう、
  必ずアウトラインファイル内に残す（deep-pulse の plan ファイルにおける「セクションごとのソース記録」ルールを踏襲）

### 9. outlines/{tier}/v{N}.md の保存

新規tierの初回は `outlines/{tier}/v1.md` として以下の形式で保存する。

```markdown
---
topic: "水の循環について"
tier: "normal"
requiresFactCheck: true
version: 1
---

# アウトライン: 水の循環について（通常）

## 全体構成

（1〜2文で全体の流れを要約する）

## セクション

### 1. 導入 — トピック提示

- 内容: ...
- 見出し候補: "What Is the Water Cycle?"
- 根拠ソース: sources/001_...md, sources/003_...md

### 2. 本論 — ...

- 内容: ...
- 見出し候補: "..."
- 根拠ソース: sources/002_...md

### 3. 結論 — ...

- 内容: ...
- 見出し候補: "..."
```

- 保存先: `texts/{topic-slug}-{timestamp}/outlines/{tier}/v{N}.md`（`tier` は `normal` / `long` / `very-long`）
- `根拠ソース` 行は `requiresFactCheck: true` の場合のみ各セクションに記載する。`false` の場合は行自体を省略する
- アウトラインにはレベル・語数・`longForm` を記載しない（これらはバリアント単位で決まるため、`variant.json` 側に記録する）

### 10. 承認

- 保存した `v{N}.md` の内容を利用者に提示し、承認を得る
- フィードバックがあれば内容を調整し、既存バージョンは直接編集せず `outlines/{tier}/v{N+1}.md` として新バージョンを保存する（[workflows/brushup.md](brushup.md) と同様の版管理ルール）。承認が得られるまで繰り返す
- 承認時点のバージョン番号を控えておく（次の手順で `variant.json` の `outlineVersion` に記録する）

### 11. variants/{level}-{tier}/variant.json の保存

```json
{
  "level": "B1",
  "tier": "normal",
  "wordCountTarget": "300〜600語",
  "longForm": false,
  "outlineTier": "normal",
  "outlineVersion": 1,
  "createdAt": "YYYY-MM-DDTHH:MM:SS"
}
```

- 保存先: `texts/{topic-slug}-{timestamp}/variants/{level}-{tier}/variant.json`
- `tier` と `outlineTier` は基本的に同じ値になる（このバリアントがどの分量tierのアウトラインを使うか）
- `outlineVersion` は手順10で承認された `outlines/{tier}/v{N}.md` の `N`

### 12. 次のワークフローへの案内

承認されたら次に [workflows/generate.md](generate.md) を実行する。
