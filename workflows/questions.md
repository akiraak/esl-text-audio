# workflows/questions.md — 理解度確認問題の作成

確定した本文に対する理解度確認問題（4択・自動採点）を作成し、
`variants/{level}-{tier}/questions/v{N}.json` に保存するワークフロー。
[personas/question-writer.md](../personas/question-writer.md) のペルソナで問題を作成し、
[personas/learner-simulator.md](../personas/learner-simulator.md) のセルフレビューを経て保存する。

生成フロー上の位置づけ: generate（本文）→ factcheck の後。本文が確定していれば作れるため、
illustrate / audio とは独立に、並列でも実行できる。
音声と同じく**記事バージョンと同番号**で管理する（brushup で記事が `v{N+1}.md` になったら
問題も `v{N+1}.json` を新たに作成する。記事ページは記事バージョンと同番号の問題のみ表示する）。

参照: [docs/specs/esl-level-spec.md](../docs/specs/esl-level-spec.md)（「理解度確認問題（Questions）の基準」＝
問題数・種類・レベル別語彙制約）、[docs/plans/archive/article-questions.md](../docs/plans/archive/article-questions.md)（設計の経緯）

## 前提

- 本文が確定済みであること（[workflows/factcheck.md](factcheck.md) 完了時点。事実チェックは常時実施）

## データ形式（questions/v{N}.json）

```json
{
  "articleVersion": 1,
  "level": "B1",
  "generatedAt": "2026-07-11T00:00:00",
  "questions": [
    {
      "type": "comprehension",
      "question": "What happens to water when the sun warms it?",
      "choices": [
        "It changes into a gas.",
        "It becomes groundwater.",
        "It falls as rain.",
        "It turns into ice."
      ],
      "answerIndex": 0,
      "explanation": "The article says heat from the sun changes liquid water into a gas. This is called evaporation."
    }
  ]
}
```

- `type`: `"comprehension"`（内容理解）/ `"vocabulary"`（文脈語彙）/ `"inference"`（推論、B2以上のみ）
- `choices` は4件固定、`answerIndex` は0始まり
- `generatedAt` は保存時点のISO日時

## 手順

### 1. 既存問題の確認

- `variants/{level}-{tier}/questions/` を確認する
- 対象の記事バージョン `v{N}.md` に対応する `v{N}.json` が既に存在する場合は作成済み。
  再作成の明示的な依頼が無ければ手順2以降は行わず、既存の問題を利用者に案内して終了する

### 2. 前提情報の確認

- `config.json`（`topic` / `genre`）、`variants/{level}-{tier}/variant.json`（`level` / `longForm`）を読む
- 対象バージョンの `articles/v{N}.md` を読む（問題の根拠はこの本文のみ。`sources/` は使わない）
- [esl-level-spec.md](../docs/specs/esl-level-spec.md) の「理解度確認問題（Questions）の基準」から
  問題数・種類の内訳（`longForm` と `level` で決まる）と、該当レベル行の語彙・文法制約を把握する

### 3. 問題の作成

- [personas/question-writer.md](../personas/question-writer.md) のペルソナで、基準に沿って問題を作成する

### 4. セルフチェック（設問設計者）

作成した各問題について確認し、問題があれば修正する。

- 正解が本文の記述だけで一意に決まるか（本文にない外部知識を要求していないか、
  複数の選択肢が正解になり得ないか）
- 本文を読まなくても一般常識だけで正解できてしまう問題になっていないか
- 誤答選択肢がもっともらしいか。正解の選択肢だけ長さ・詳しさが目立っていないか
- `answerIndex` の分布が偏っていないか

### 5. 学習者シミュレーターによるセルフレビュー

- [personas/learner-simulator.md](../personas/learner-simulator.md) のペルソナで、該当レベルの学習者として
  本文を読んだ直後の状態で全問を解いてみる
- 問題文・選択肢の語彙でつまずく箇所、曖昧で選べない選択肢、本文と照らしても答えが決められない問題が
  あれば、設問設計者のペルソナに戻って修正する（手順3〜4を繰り返す）
- つまずき・曖昧さがなくなるまで繰り返す

### 6. questions/v{N}.json の保存

- 保存先: `texts/{topic-slug}-{timestamp}/variants/{level}-{tier}/questions/v{N}.json`（N は対象の記事バージョンと同番号）
- 上記データ形式に従い、`articleVersion`・`level`・`generatedAt` を記録する

### 7. 表示の確認と次のワークフローへの案内

- ビューアサーバ起動中であれば、記事ページ `/texts/{topicId}/{variantId}` の本文の後に
  Questions セクションが表示されることを確認する（`questions/v{N}.json` が無い記事には表示されない）
- この時点で問題作成は完了。フィードバックがあれば [workflows/brushup.md](brushup.md) を実行する
- `brushup.md` で本文が新バージョン `v{N+1}.md` として更新された場合は、このワークフローを
  新バージョンに対して再実行し、`questions/v{N+1}.json` を作成する
