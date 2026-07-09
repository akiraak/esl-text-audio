# workflows/brushup.md — フィードバック反映・再生成

ESL学習用テキスト生成フローの7番目（最後）のステップ。[workflows/generate.md](generate.md)（`requiresFactCheck: false` の場合）
または [workflows/factcheck.md](factcheck.md)（`requiresFactCheck: true` の場合）で確定した本文、および
[workflows/illustrate.md](illustrate.md) で生成したイラストに対する利用者のフィードバックを受け、
[personas/esl-writer.md](../personas/esl-writer.md) のペルソナで調整・再生成し、[personas/final-editor.md](../personas/final-editor.md) の
ペルソナで最終確認する。**このワークフローは特定の1バリアント（`variants/{level}-{tier}/`）に対して実行する。**

参照: [docs/specs/esl-level-spec.md](../docs/specs/esl-level-spec.md)、[personas/esl-writer.md](../personas/esl-writer.md)、
[personas/learner-simulator.md](../personas/learner-simulator.md)、[personas/final-editor.md](../personas/final-editor.md)、
[docs/plans/topic-variants-and-length-tiers.md](../docs/plans/topic-variants-and-length-tiers.md)（トピック・バリアント設計）

## 前提

- `texts/{topic-slug}-{timestamp}/variants/{level}-{tier}/articles/v{N}.md` が確定済みであること（`requiresFactCheck: false` の場合は
  [workflows/generate.md](generate.md) 手順7、`true` の場合は [workflows/factcheck.md](factcheck.md) 手順7完了時点）
- [workflows/illustrate.md](illustrate.md) の実行が完了していること
- 対応する `outlines/{outlineTier}/v{outlineVersion}.md`（`variant.json` の値）が存在すること
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

- [personas/esl-writer.md](../personas/esl-writer.md) のペルソナで、[workflows/outline.md](outline.md) 手順7〜10に準じて、対応する `outlines/{outlineTier}/v{outlineVersion}.md` を更新する
- 更新した outline は `outlines/{outlineTier}/v{outlineVersion+1}.md` として保存する（既存の `outlines/{outlineTier}/v{outlineVersion}.md` は直接編集しない）
- `requiresFactCheck: true` の場合、変更・追加したセクションの根拠ソースを見直す。既存の `sources/` で根拠が確保できない新規要素は
  追加しない。追加の資料収集が必要な場合は、その旨を利用者に伝え [workflows/research.md](research.md) に一度戻ることを提案する
- 更新した outline を利用者に提示し承認を得る（[workflows/outline.md](outline.md) 手順10と同様、フィードバックがあれば繰り返す）
- 承認された `outlines/{outlineTier}/v{N+1}.md` から、[workflows/generate.md](generate.md) 手順3〜6に準じて本文を再生成し、
  [workflows/generate.md](generate.md) 手順8と同様に `aiModel`/`createdAt` の frontmatter を付けたうえで
  `variants/{level}-{tier}/articles/v{M+1}.md` として保存する（M はこのバリアントの直前の本文バージョン。outline のバージョン番号とは独立に採番する）
- このバリアントの `variant.json` の `outlineVersion` を更新後のバージョン番号に更新する

### 3b. 本文レベルの調整で足りる場合

- [personas/esl-writer.md](../personas/esl-writer.md) のペルソナで、フィードバックに沿って該当箇所を修正する
- `requiresFactCheck: true` の場合、修正が事実に関わる記述に影響しないか確認する。影響する場合は `sources/` の根拠範囲内で修正し、
  新たな事実を書き加えない
- outline 側は変更しないため `outlines/{outlineTier}/v{outlineVersion}.md` のバージョンは据え置き、修正後の本文のみ、
  [workflows/generate.md](generate.md) 手順8と同様に `aiModel`/`createdAt` の frontmatter を付けたうえで
  `variants/{level}-{tier}/articles/v{N+1}.md` として新バージョンを保存する（既存バージョンは直接編集しない）

### 4. 他バリアント・他tierへの影響確認（手順3aで構成変更した場合のみ）

アウトラインは分量tier単位でトピック内の複数レベルのバリアントに共有されている。手順3aで `outlines/{outlineTier}/v{N+1}.md` を作った場合、以下を確認する。

- **同じtierを使う他レベルのバリアント**（例: `outlines/normal/` を使う `B1-normal` と `C1-normal`）: 古い `outlineVersion` を参照したまま自動的には追従しない。
  他のバリアントにもこの構成変更を反映したいか利用者に確認し、希望する場合はそのバリアントに対しても [workflows/generate.md](generate.md) 手順3〜6を
  新しい outline バージョンに対して実行し、`variant.json` の `outlineVersion` を更新する
- **このトピックの他tier**（[workflows/outline.md](outline.md) のカスケード派生ルールで拡張／間引きの関係にある tier）: 変更が核となる話の流れ（導入・展開・結末の骨格）に
  影響する場合、他tierのアウトラインも作り直す必要がないか利用者に確認する（自動では反映しない。必要な場合のみ [workflows/outline.md](outline.md) 手順7b/7cに準じて作り直す）
- どちらも「今回のバリアントだけ直せばよい」という判断であれば、何もせず次の手順に進んでよい

### 5. 学習者シミュレーターによるセルフレビュー

- [workflows/generate.md](generate.md) 手順6と同様、[personas/learner-simulator.md](../personas/learner-simulator.md) のペルソナで
  修正後の本文を通読し、つまずき箇所を洗い出す
- つまずき箇所があれば手順3a/3bに戻って修正し、つまずきがなくなるまで繰り返す

### 6. 最終エディターによる最終確認

- [personas/final-editor.md](../personas/final-editor.md) のペルソナで、反映した指摘・反映しなかった指摘とその理由を整理し、
  最終版の本文として確定する

### 7. 事実確認の再実行判定

- `requiresFactCheck: true` かつ、手順3a/3bでの修正が事実に関わる記述に影響する場合、[workflows/factcheck.md](factcheck.md) を
  同じ `variants/{level}-{tier}/articles/v{N+1}.md` に対して再実行する
- 上記に該当しない場合（`requiresFactCheck: false`、または修正が事実に関わらない場合）は、この時点で本文は確定

### 8. イラスト再生成の判断

- イラストはバリアントごとではなく**トピックで1枚を全バリアントが共有**している（[workflows/illustrate.md](illustrate.md) 参照）。
  ここで再生成すると、このトピックの**他のバリアントで表示されるイラストも変わる**ことを利用者に伝えたうえで判断する
- 手順3a/3bでの修正が記事の主題・キーとなる場面・雰囲気に影響するか判断する
  - 影響する場合: イラストの再生成を利用者に提案し、他バリアントにも影響する旨を伝えたうえで意向を確認する
  - 語彙・言い回しレベルの軽微な修正のみで場面・トーンに変化がない場合: 再生成不要と判断してよい（迷う場合は利用者に確認する）
- 利用者が再生成を希望する場合、`texts/{topic-slug}-{timestamp}/images/` の既存バージョンを確認し、次の番号 M
  （既存の最大バージョン+1）を決めたうえで、[personas/esl-writer.md](../personas/esl-writer.md) のペルソナのまま
  [workflows/illustrate.md](illustrate.md) 手順3〜7に準じて、確定した新しい本文バージョン `variants/{level}-{tier}/articles/v{N+1}.md` を題材に実行する
  - プロンプト保存先: `texts/{topic-slug}-{timestamp}/images/v{M}.prompt.txt`
  - 生成コマンド: `node scripts/generate-illustration.js texts/{topic-slug}-{timestamp} {M} texts/{topic-slug}-{timestamp}/images/v{M}.prompt.txt`
- 再生成しない場合は何もしない。`images/v{M}.*` は作成せず、既存の最新バージョンのイラストをそのまま全バリアントで使い続ける

### 9. 保存・報告

- 保存先: `variants/{level}-{tier}/articles/v{N+1}.md`（構成変更を伴った場合は対応する `outlines/{outlineTier}/v{outlineVersion+1}.md` も、
  イラストを再生成した場合はトピック直下の `images/v{M}.png` と `images/v{M}.prompt.txt` も）
- 利用者に保存したバージョンと変更内容を報告する。手順4で他バリアント・他tierへの反映を行った場合、イラストを再生成した場合は
  他バリアントの表示にも影響する旨を併せて報告する
- 追加のフィードバックがあれば、この [workflows/brushup.md](brushup.md) を再度実行する
