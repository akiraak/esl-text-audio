# workflows/config.md — トピック条件の収集

ESL学習用テキスト生成フローの最初のステップ。**トピック単位**の生成条件（トピック・文章形式・事実チェック要否）を収集し、
`texts/{topic-slug}-{YYYYMMDD-HHMMSS}/config.json` に保存する。レベル・分量（長さ）は**バリアント単位**の条件のため
このワークフローでは扱わず、[workflows/outline.md](outline.md) で確定する。

参照: [docs/specs/esl-level-spec.md](../docs/specs/esl-level-spec.md)（ジャンル・事実チェック方針の定義）、
[docs/plans/topic-variants-and-length-tiers.md](../docs/plans/topic-variants-and-length-tiers.md)（トピック・バリアントの設計）、
[docs/topic-ideas.md](../docs/topic-ideas.md)（トピック案のストック。手順2で参照し、手順7で更新する）

## 手順

### 1. 新規トピックか、既存トピックへのバリアント追加かの判定

- 利用者の依頼が「既存のトピックに新しいレベル・分量のバリアントを追加したい」という趣旨か確認する
  （例:「さっき作った水の循環のトピックにC1版も追加して」「一覧のXにA2の長いバージョンを足して」など）
- 既存トピックを指していそうな場合、`texts/` 配下の各ディレクトリの `config.json` の `topic` / `topicSlug` から一致するトピックを探す
  - 一致するトピックが見つかった場合: 以降の手順2〜6（トピックの新規作成）をスキップし、そのトピックのディレクトリ（`texts/{topic-slug}-{timestamp}/`）を使って
    直接 [workflows/outline.md](outline.md)（バリアント設定・アウトライン作成）に進む
  - 一致するトピックが見つからない場合、または利用者が新規トピックとして進めることを希望する場合は、通常どおり手順2以降を行う
- 既存トピックへの追加か新規トピックかが曖昧な場合は利用者に確認する

### 2. トピック（主題）の確認

利用者からトピック（主題）を受け取る。トピックだけが送られてきた場合でも、このワークフローを開始してよい（残りは以下の対話で埋める）。

このステップでは必ず [docs/topic-ideas.md](../docs/topic-ideas.md)（トピック案のストック）を開いて次を行う。

- 利用者がトピックを決めていない、または「何かおすすめは？」のように提案を求めている場合: 「アイデア一覧」のツリーから候補をいくつか提示し、選んでもらう
  （候補が多い場合はまずカテゴリを聞いて絞り込んでもよい）
- 利用者がトピックを指定している場合: 「採用済み」表と照合し、同じ・非常に近いトピックが既にあれば利用者に知らせる
  （既存トピックへのバリアント追加（手順1）に切り替えるか、別トピックとして進めるかを確認する）

### 3. 文章形式（ジャンル）の確定

- [esl-level-spec.md](../docs/specs/esl-level-spec.md) の「ESL読解に適した文章形式」表を提示する
  - この時点ではレベルが未確定（レベルはバリアントごとに [workflows/outline.md](outline.md) で決める）のため、レベルによる絞り込みは行わず、
    「適したレベル帯」列を参考情報として付けたまま全ジャンルを選択肢として提示する
- 利用者が指定しない場合は物語（Narrative）をデフォルトとする
- 選んだジャンルと、後で確定する各バリアントのレベルとの相性は、そのバリアントのレベルを確定するタイミング（[workflows/outline.md](outline.md) 手順5）で
  改めて確認する（この段階では確認しない）

### 4. 事実チェック要否の判定

- [esl-level-spec.md](../docs/specs/esl-level-spec.md) の「文章形式」表にある「事実チェック」列（ジャンル単位、「要」/「不要（フィクション）」）を基本の判定とする
- ジャンルが「要」の場合でも、利用者が「架空の人物・場所を扱うフィクションである」と明示した場合は対象外にできる
  - この場合、以下を確認した上で `requiresFactCheck: false` とし、理由を `config.json` に記録する
    - 具体的にどの点がフィクション設定か（例:「登場する町・会社は架空」）
- ジャンルが「不要（フィクション）」の場合は確認なしで `requiresFactCheck: false` とする
- 上記いずれにも該当しない場合は `requiresFactCheck: true` とする

### 5. トピックスラッグ・保存先ディレクトリの決定

- トピックから英数字・ハイフンのみの短いスラッグ（`topic-slug`）を作成する（日本語トピックの場合はローマ字化または英訳した意味の通るスラッグにする）
- 実行時刻から `YYYYMMDD-HHMMSS` 形式のタイムスタンプを作る
- 保存先: `texts/{topic-slug}-{YYYYMMDD-HHMMSS}/`

### 6. config.json の保存

`texts/{topic-slug}-{YYYYMMDD-HHMMSS}/config.json` に以下の形式で保存する。

```json
{
  "topic": "How Honey Is Made",
  "topicSlug": "topic-slug",
  "createdAt": "YYYY-MM-DDTHH:MM:SS",
  "genre": "Expository",
  "requiresFactCheck": true,
  "factCheckExemptionReason": null
}
```

- `topic` は公開ビューア（GitHub Pages）にそのまま表示されるため**必ず英語で保存する**。利用者が日本語でトピックを伝えた場合も、Claude Codeが英訳して保存する（利用者との対話自体は日本語のままでよい）
- `genre` も公開ビューアに表示されるため、[esl-level-spec.md](../docs/specs/esl-level-spec.md) の「ESL読解に適した文章形式」表にある英名
  （`Narrative` / `Dialogue` / `Descriptive` / `Instructional` / `Expository` / `Personal writing` / `News-style` / `Opinion/Essay`）で保存する
- `factCheckExemptionReason`: ジャンルは事実チェック対象だが利用者がフィクション明示したことで対象外にした場合、その理由を文字列で記録する。それ以外は `null`
- レベル・分量（長さ）・語数目安・長文モードの可否は、この `config.json` ではなくバリアント単位の `variant.json`（[workflows/outline.md](outline.md) で作成）に記録する

### 7. トピックのアイデアページの更新

`config.json` の保存後、[docs/topic-ideas.md](../docs/topic-ideas.md) を更新する。

- **採用の記録**: 採用したトピックが「アイデア一覧」のツリーにあればその葉を削除し、「採用済み」表に トピック・ジャンル・ディレクトリ・採用日 を追記する
  （ツリーに無いトピックを採用した場合も「採用済み」への追記は必ず行う。葉が無くなったカテゴリは残してよい）
- **アイデアの補充**: 新しいトピック案を2〜3件考えて「アイデア一覧」ツリーの適切なカテゴリに追加する（合うカテゴリが無ければ新設してよい）。
  ジャンルやカテゴリの偏りが出ないよう、在庫が少ないところを優先する。記法は [docs/topic-ideas.md](../docs/topic-ideas.md) 冒頭の書式説明に従う
  （トピック作成とは関係なくアイデアだけを追加したい場合は、単体ワークフロー [workflows/add-ideas.md](add-ideas.md) を使う）

### 8. 次のワークフローへの案内

- `config.json` の内容を要約して利用者に提示し、確認を得る
- `requiresFactCheck: true` の場合は次に [workflows/research.md](research.md) を実行する
- `requiresFactCheck: false` の場合は [workflows/research.md](research.md) をスキップし、次に [workflows/outline.md](outline.md) を実行する
  （最初のバリアントのレベル・分量の確定、アウトライン作成をそこで行う）
