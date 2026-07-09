# workflows/brushup.md — フィードバック反映・再生成

ESL学習用テキスト生成フローの6番目（最後）のステップ。[workflows/generate.md](generate.md)（`requiresFactCheck: false` の場合）
または [workflows/factcheck.md](factcheck.md)（`requiresFactCheck: true` の場合）で確定した本文に対する利用者のフィードバックを受け、
[personas/esl-writer.md](../personas/esl-writer.md) のペルソナで調整・再生成し、[personas/final-editor.md](../personas/final-editor.md) の
ペルソナで最終確認する。

参照: [docs/specs/esl-level-spec.md](../docs/specs/esl-level-spec.md)、[personas/esl-writer.md](../personas/esl-writer.md)、
[personas/learner-simulator.md](../personas/learner-simulator.md)、[personas/final-editor.md](../personas/final-editor.md)

## 前提

- `texts/{topic-slug}-{timestamp}/articles/v{N}.md` が確定済みであること（`requiresFactCheck: false` の場合は
  [workflows/generate.md](generate.md) 手順7、`true` の場合は [workflows/factcheck.md](factcheck.md) 手順4〜7完了時点）
- 対応する `outlines/v{N}.md` が存在すること
- 利用者からのフィードバック（自由記述）があること

## 手順

### 1. フィードバックの受け取り

- 利用者からフィードバックを受け取る。曖昧な場合は具体的な箇所・修正方向を確認する

### 2. 調整範囲の判断（対話）

フィードバックが以下のどちらに該当するかを利用者と対話しながら判断する。

- **構成レベルの変更が必要**: 話の流れ・段落構成・エピソードの追加/削除/入れ替え・展開順序など、outline に記録した内容そのものを変える必要がある
- **本文レベルの調整で足りる**: 語彙・文体・表現・言い回し・簡略化の度合いなど、outline の構成は変えずに文章の書き方を直せば対応できる

判断に迷う場合は、まず本文レベルの調整で対応できないか検討し、対応しきれない場合のみ構成レベルの変更に進む。

### 3a. 構成レベルの変更が必要な場合

- [personas/esl-writer.md](../personas/esl-writer.md) のペルソナで、[workflows/outline.md](outline.md) 手順4〜7に準じて outline を更新する
- 更新した outline は `outlines/v{N+1}.md` として保存する（既存の `outlines/v{N}.md` は直接編集しない）
- `requiresFactCheck: true` の場合、変更・追加したセクションの根拠ソースを見直す。既存の `sources/` で根拠が確保できない新規要素は
  追加しない。追加の資料収集が必要な場合は、その旨を利用者に伝え [workflows/research.md](research.md) に一度戻ることを提案する
- 更新した outline を利用者に提示し承認を得る（[workflows/outline.md](outline.md) 手順7と同様、フィードバックがあれば繰り返す）
- 承認された `outlines/v{N+1}.md` から、[workflows/generate.md](generate.md) 手順3〜6に準じて本文を再生成し、
  `articles/v{N+1}.md` として保存する（article のバージョン番号を、生成元とした outline のバージョン番号に合わせる）

### 3b. 本文レベルの調整で足りる場合

- [personas/esl-writer.md](../personas/esl-writer.md) のペルソナで、フィードバックに沿って該当箇所を修正する
- `requiresFactCheck: true` の場合、修正が事実に関わる記述に影響しないか確認する。影響する場合は `sources/` の根拠範囲内で修正し、
  新たな事実を書き加えない
- outline 側は変更しないため `outlines/v{N}.md` のバージョンは据え置き、修正後の本文のみ `articles/v{N+1}.md` として新バージョンを保存する
  （この場合、article のバージョン番号が対応する outline のバージョン番号より先行することを許容する。既存バージョンは直接編集しない）

### 4. 学習者シミュレーターによるセルフレビュー

- [workflows/generate.md](generate.md) 手順6と同様、[personas/learner-simulator.md](../personas/learner-simulator.md) のペルソナで
  修正後の本文を通読し、つまずき箇所を洗い出す
- つまずき箇所があれば手順3a/3bに戻って修正し、つまずきがなくなるまで繰り返す

### 5. 最終エディターによる最終確認

- [personas/final-editor.md](../personas/final-editor.md) のペルソナで、反映した指摘・反映しなかった指摘とその理由を整理し、
  最終版の本文として確定する

### 6. 事実確認の再実行判定

- `requiresFactCheck: true` かつ、手順3a/3bでの修正が事実に関わる記述に影響する場合、[workflows/factcheck.md](factcheck.md) を
  同じ `articles/v{N+1}.md` に対して再実行する
- 上記に該当しない場合（`requiresFactCheck: false`、または修正が事実に関わらない場合）は、この時点で本文は確定

### 7. 保存・報告

- 保存先: `texts/{topic-slug}-{timestamp}/articles/v{N+1}.md`（構成変更を伴った場合は対応する `outlines/v{N+1}.md` も）
- 利用者に保存したバージョンと変更内容を報告する
- 追加のフィードバックがあれば、この [workflows/brushup.md](brushup.md) を再度実行する
