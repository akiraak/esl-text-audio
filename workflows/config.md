# workflows/config.md — 生成条件の収集

ESL学習用テキスト生成フローの最初のステップ。トピック・英語レベル・文章形式（ジャンル）を利用者から収集し、
事実チェック要否を判定して `texts/{topic-slug}-{YYYYMMDD-HHMMSS}/config.json` に保存する。

参照: [docs/specs/esl-level-spec.md](../docs/specs/esl-level-spec.md)（CEFRレベル・ジャンル・事実チェック方針の定義）

## 手順

### 1. 入力の確認

利用者から最低限次の2つを受け取る。

- **トピック（主題）**
- **英語レベル**

この2つだけが送られてきた場合でも、このワークフローを開始してよい（残りは以下の対話で埋める）。

### 2. 英語レベルの確定

- 既に CEFR レベル（A1〜C2）が明示されていればそのまま採用する
- 明示されていない場合は、利用者にとって分かりやすいよう「初級（A1-A2）/ 中級（B1-B2）/ 上級（C1-C2）」の3段階から選んでもらう
- 3段階のいずれかが選ばれた場合、[esl-level-spec.md](../docs/specs/esl-level-spec.md) の「CEFR レベル定義」表を提示し、
  その中でどのレベルに近づけたいか（例: 中級なら B1 寄りか B2 寄りか）を確認する。利用者が「お任せ」であれば範囲の中央寄り（B1, A2寄りではなくA2など）を選ばず、
  レベル帯の低い方（初級なら A1、中級なら B1、上級なら C1）をデフォルトとする
- 確定したら CEFR の6段階表記（例: `B1`）で保持する

### 3. 文章形式（ジャンル）の確定

- [esl-level-spec.md](../docs/specs/esl-level-spec.md) の「ESL読解に適した文章形式」表から、確定したレベルに適したジャンルを絞り込んで選択肢として提示する
  （「適したレベル帯」列に確定レベルが含まれるジャンルのみ提示する）
- 利用者が指定しない場合は物語（Narrative）をデフォルトとする
- レベルとジャンルの組み合わせが表の「適したレベル帯」から外れる指定を利用者がした場合（例: A1で意見文・エッセイ）、
  不整合である旨を伝えた上で、それでも希望するか確認する。希望する場合はそのまま進める（強制的に変更はしない）

### 4. 語数目安の確認（任意）

- [esl-level-spec.md](../docs/specs/esl-level-spec.md) の確定レベル行にある「総語数目安」をデフォルトとして提示する
- 利用者が別途語数を指定した場合はそちらを優先する

### 5. 事実チェック要否の判定

- [esl-level-spec.md](../docs/specs/esl-level-spec.md) の「文章形式」表にある「事実チェック」列（ジャンル単位、「要」/「不要（フィクション）」）を基本の判定とする
- ジャンルが「要」の場合でも、利用者が「架空の人物・場所を扱うフィクションである」と明示した場合は対象外にできる
  - この場合、以下を確認した上で `requiresFactCheck: false` とし、理由を `config.json` に記録する
    - 具体的にどの点がフィクション設定か（例:「登場する町・会社は架空」）
- ジャンルが「不要（フィクション）」の場合は確認なしで `requiresFactCheck: false` とする
- 上記いずれにも該当しない場合は `requiresFactCheck: true` とする

### 6. トピックスラッグ・保存先ディレクトリの決定

- トピックから英数字・ハイフンのみの短いスラッグ（`topic-slug`）を作成する（日本語トピックの場合はローマ字化または英訳した意味の通るスラッグにする）
- 実行時刻から `YYYYMMDD-HHMMSS` 形式のタイムスタンプを作る
- 保存先: `texts/{topic-slug}-{YYYYMMDD-HHMMSS}/`

### 7. config.json の保存

`texts/{topic-slug}-{YYYYMMDD-HHMMSS}/config.json` に以下の形式で保存する。

```json
{
  "topic": "利用者が指定したトピック（原文のまま）",
  "topicSlug": "topic-slug",
  "createdAt": "YYYY-MM-DDTHH:MM:SS",
  "level": "B1",
  "genre": "説明的文章",
  "wordCountTarget": "300〜600語",
  "requiresFactCheck": true,
  "factCheckExemptionReason": null
}
```

- `factCheckExemptionReason`: ジャンルは事実チェック対象だが利用者がフィクション明示したことで対象外にした場合、その理由を文字列で記録する。それ以外は `null`
- `wordCountTarget`: 利用者が独自指定した場合はその値、なければ [esl-level-spec.md](../docs/specs/esl-level-spec.md) のレベル行の値をそのまま入れる

### 8. 次のワークフローへの案内

- `config.json` の内容を要約して利用者に提示し、確認を得る
- `requiresFactCheck: true` の場合は次に [workflows/research.md](research.md) を実行する
- `requiresFactCheck: false` の場合は [workflows/research.md](research.md) をスキップし、次に [workflows/outline.md](outline.md) を実行する
