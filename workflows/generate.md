# workflows/generate.md — 本文生成

ESL学習用テキスト生成フローの4番目のステップ。[personas/esl-writer.md](../personas/esl-writer.md) のペルソナで、
config と承認済み outline を読み本文を生成し、[personas/learner-simulator.md](../personas/learner-simulator.md) の
セルフレビューを経て `articles/v{N}.md` に保存する。

参照: [docs/specs/esl-level-spec.md](../docs/specs/esl-level-spec.md)（レベル別チェック基準）、
[personas/esl-writer.md](../personas/esl-writer.md)、[personas/learner-simulator.md](../personas/learner-simulator.md)、
[personas/final-editor.md](../personas/final-editor.md)

## 前提

- `texts/{topic-slug}-{timestamp}/outlines/v{N}.md` が [workflows/outline.md](outline.md) で承認済みであること
- `requiresFactCheck: true` の場合、`sources/` が存在し、outline の各セクションに根拠ソースが記録されていること

## 手順

### 1. ペルソナの適用（執筆）

以降の執筆作業は [personas/esl-writer.md](../personas/esl-writer.md) のペルソナで行う。

### 2. config・承認済み outline の確認

- `config.json` を読み、`level` / `genre` / `wordCountTarget` / `requiresFactCheck` を把握する
- 承認済みの `outlines/v{N}.md`（N は承認された最新バージョン番号）を読み、セクション構成・各セクションの内容の要点・
  （`requiresFactCheck: true` の場合は）根拠ソースを把握する。本文のバージョン番号もこの N に合わせる

### 3. 執筆前チェックリストの確認

[esl-level-spec.md](../docs/specs/esl-level-spec.md) の該当レベル行を判断基準に、以下をチェックリストとして持ちながら執筆する。

- 指定 CEFR レベルの語彙・文法範囲に収まっているか
- 総語数・平均文長がレベルの目安レンジに収まっているか
- ストーリーとして興味を持って読み進められるか（起伏・オチ・意外性など、outline で配置した要素を活かせているか）
- 不要に難解な慣用句・文化依存の言い回しを避けているか

### 4. 本文執筆

- outline の各セクションに沿って、日本語で記録された要点を英文に起こす
- `requiresFactCheck: true` の場合、事実に関わる記述を書く前に、そのセクションの outline に記録された根拠ソース（`sources/` のファイル）を読み、内容に沿って書く。根拠のない事実を新たに書き加えない
- セクション間のつながりを自然にし、単なる要点の羅列にならないようにする
- タイトルと本文からなる Markdown として執筆する。装飾的なメタ情報（語数カウント等）は本文に含めない（[personas/esl-writer.md](../personas/esl-writer.md) の出力形式に従う）

### 5. 執筆直後の自己チェック

- 手順3のチェックリストに沿って自己レビューする。語彙・文長・語数がレベルの目安レンジから逸脱している箇所があれば書き直す

### 6. 学習者シミュレーターによるセルフレビュー

- [personas/learner-simulator.md](../personas/learner-simulator.md) のペルソナで、指定レベルの学習者として本文を通読し、つまずき箇所を洗い出す
- つまずき箇所があれば、[personas/esl-writer.md](../personas/esl-writer.md) のペルソナに戻って該当箇所を修正する（手順4〜5を繰り返す）。
  `requiresFactCheck: true` のセクションを修正する場合、根拠ソースの範囲を超える書き換えをしない
- つまずきがなくなる（学習者シミュレーターが「つまずきなし」と判定する）まで繰り返す

### 7. 最終確定（`requiresFactCheck: false` の場合のみ）

- [personas/final-editor.md](../personas/final-editor.md) のペルソナで、学習者シミュレーターの指摘の反映内容を統合し、この段階で本文を確定する
- `requiresFactCheck: true` の場合はこのステップを行わず、最終統合は [workflows/factcheck.md](factcheck.md) 完了後に行う

### 8. articles/v{N}.md の保存

- 保存先: `texts/{topic-slug}-{timestamp}/articles/v{N}.md`（N は手順2で控えた outline のバージョン番号）
- 内容は本文そのもの（タイトル＋本文、装飾的メタ情報なし）

### 9. 次のワークフローへの案内

- `requiresFactCheck: true` の場合、次に [workflows/factcheck.md](factcheck.md) を実行する
- `requiresFactCheck: false` の場合、この時点で生成完了。フィードバックがあれば [workflows/brushup.md](brushup.md) を実行する
