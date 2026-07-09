# workflows/outline.md — アウトライン作成・承認

ESL学習用テキスト生成フローの3番目のステップ（`requiresFactCheck: true` の場合は [research.md](research.md) の後、
`false` の場合は [config.md](config.md) の直後に実行）。[personas/esl-writer.md](../personas/esl-writer.md) のペルソナで、
config を読み話の流れ・段落構成を利用者と対話しながら決定し、`outlines/v{N}.md` に保存して承認を得る。

参照: [docs/specs/esl-level-spec.md](../docs/specs/esl-level-spec.md)（ジャンル別レベル帯）、
[personas/esl-writer.md](../personas/esl-writer.md)

## 前提

- `texts/{topic-slug}-{timestamp}/config.json` が存在すること
- `requiresFactCheck: true` の場合、`sources/` に [workflows/research.md](research.md) で取得した外部資料が保存済みであること

## 手順

### 1. ペルソナの適用

以降の作業は [personas/esl-writer.md](../personas/esl-writer.md) のペルソナで行う。

### 2. config・sources の確認

- `config.json` を読み、`topic` / `level` / `genre` / `wordCountTarget` / `requiresFactCheck` を把握する
- `requiresFactCheck: true` の場合、`sources/` のファイル一覧にも目を通し、本文で使える事実要素を把握しておく

### 3. レベル・ジャンルの整合再確認

- [esl-level-spec.md](../docs/specs/esl-level-spec.md) の「ESL読解に適した文章形式」表を参照し、`level` と `genre` の組み合わせが
  「適したレベル帯」に含まれるか確認する
- [workflows/config.md](config.md) の手順3で既に不整合を利用者に伝えた上で選択されている場合は、ここで同じ警告を繰り返さず先に進める
- config.md 実行時の記録がなく、ここで初めて不整合に気づいた場合のみ、利用者にその旨を伝えた上でそのまま続行してよいか確認する（強制的にジャンル・レベルを変更はしない）

### 4. 話の流れ・段落構成の決定（対話）

- ジャンルに応じた典型構成をベースに提案する
  - 物語・対話文: 導入（状況設定）→ 展開（出来事の推移）→ 結末
  - 説明文・説明的文章: 導入（トピック提示）→ 本論（複数の観点・特徴）→ 結論
  - 手順文: 導入（何を作る/どこへ行くか）→ 手順（順序立てたステップ）→ まとめ
  - 日記・手紙・メール: 書き出し（宛先・状況）→ 本文（出来事・気持ち）→ 締めくくり
  - ニュース記事風: 見出し・リード文 → 本文（詳細・背景） → まとめ/引用
  - 意見文・エッセイ: 導入（主張の提示）→ 本論（根拠・具体例、譲歩があれば含む）→ 結論
- 各セクションについて、以下を利用者と対話しながら決める
  - 役割（導入/展開/結末、または本論内の各観点など）
  - そのセクションで書く内容の要点（日本語で1〜2文のサマリでよい。英文自体はこの段階では書かない）
  - レベルに見合った語彙・文法上の狙い（該当があれば。[esl-level-spec.md](../docs/specs/esl-level-spec.md) のレベル行を参照）
- 「読んでいて楽しい」を満たすため、起伏・オチ・意外性などの要素をどのセクションに置くか明示する

### 5. セクション別ソース記録（`requiresFactCheck: true` の場合のみ）

- 事実に関わる記述を含むセクションごとに、根拠とする `sources/` のファイル名をアウトライン内に記録する
- 該当する事実の根拠が `sources/` 内に見当たらない場合、そのセクションでは言及を避けるか、断定を避けた表現にするなど扱いを弱める方向で調整する
- この記録は [workflows/generate.md](generate.md)・[workflows/factcheck.md](factcheck.md) がコンテキスト圧縮後も参照できるよう、
  必ずアウトラインファイル内に残す（deep-pulse の plan ファイルにおける「セクションごとのソース記録」ルールを踏襲）

### 6. outlines/v{N}.md の保存

初回は `outlines/v1.md` として以下の形式で保存する。

```markdown
---
topic: "水の循環について"
level: "B1"
genre: "説明的文章"
wordCountTarget: "300〜600語"
requiresFactCheck: true
version: 1
---

# アウトライン: 水の循環について

## 全体構成

（1〜2文で全体の流れを要約する）

## セクション

### 1. 導入 — トピック提示

- 内容: ...
- 根拠ソース: sources/001_...md, sources/003_...md
- レベル上の狙い: ...

### 2. 本論 — ...

- 内容: ...
- 根拠ソース: sources/002_...md
- レベル上の狙い: ...

### 3. 結論 — ...

- 内容: ...
- レベル上の狙い: ...
```

- 保存先: `texts/{topic-slug}-{timestamp}/outlines/v{N}.md`
- `根拠ソース` 行は `requiresFactCheck: true` の場合のみ各セクションに記載する。`false` の場合は行自体を省略する

### 7. 承認

- 保存した `v{N}.md` の内容を利用者に提示し、承認を得る
- フィードバックがあれば内容を調整し、既存バージョンは直接編集せず `outlines/v{N+1}.md` として新バージョンを保存する（[workflows/brushup.md](brushup.md) と同様の版管理ルール）。承認が得られるまで繰り返す
- 本文（`articles/v{N}.md`）のバージョン番号は、承認された outline のバージョン番号に合わせるため、承認時点のバージョン番号を控えておく

### 8. 次のワークフローへの案内

承認されたら次に [workflows/generate.md](generate.md) を実行する。
