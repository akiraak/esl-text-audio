# 事実チェックを常時実施に変更（対象は客観的事実の記述のみ）

## 目的・背景

これまで事実チェックは**ジャンル単位**で要否を判定し、物語（Narrative）・対話文（Dialogue）は
「明らかにフィクション」として一律対象外だった。しかし「教室での会話」のように、
フィクションの器（架空の教室・登場人物）に実在の事実（科学・歴史）を載せるテキストが実際に生まれ、
それらが "Not fact-checked" と表示されるのは実態に合わないことが分かった
（例: トマト会話3部作は 1893年の Nix v. Hedden 判決や植物学的定義を扱う）。

利用者の指示により、基本ルールを次のように変更する。

- **事実チェックは常に実施する**（ジャンルによる一律除外を廃止。`requiresFactCheck` は新規トピックでは常に `true`）
- ただしチェック**対象**は「現実世界について客観的事実として書かれている記述」のみとする
  - **対象**: 実在の地名・人物・歴史的事実・日付・数値・科学的事実など。**セリフの中で語られるものも含む**（例: 会話文中で先生が説明する科学・歴史）
  - **対象外**: 会話のやりとりそのもの（相づち・リアクション・冗談）、登場人物の意見・感想など主観的な内容、架空の設定（架空の人物・場所・出来事）
- **お笑いは文章にとってとても大切**。事実修正の際もジョーク・オチを消さない言い換えを最優先で探し、
  どうしても両立しない場合のみ正確性を優先する（その場合も別の形でユーモアを補えないか検討する）

## 対応方針

### Phase 1: ルール定義の変更

- `docs/specs/esl-level-spec.md`
  - 「ESL読解に適した文章形式」表の「事実チェック」列を全ジャンル「要」に変更（フィクション系の除外・利用者申告による除外を廃止）
  - 「事実チェック方針」節を新ルール（常時実施＋内容スコープ＋ユーモア保全）で書き換え。変更理由をコメントとして残す
- `CLAUDE.md` の関連記述（ディレクトリ構成の `sources/` コメント、ワークフロー一覧の research/factcheck のスキップ条件、
  「レベル・分量・ジャンル・事実チェック方針」段落）を更新

### Phase 2: ワークフロー・ペルソナの更新

- `workflows/config.md` 手順4: 要否判定を廃止し常に `requiresFactCheck: true`。`factCheckExemptionReason` は廃止（新規は記載しない）
- `workflows/research.md`: 常時実行に変更。ただしアウトライン予定内容に客観的事実の記述が無い見込みなら「収集対象なし」として `sources/` 無しで先へ進める
- `workflows/outline.md` 手順8: 根拠ソース記録を「客観的事実の記述を含むセクションのみ」に変更
- `workflows/generate.md`: 手順7（final-editor 統合）の分岐と手順9の分岐を「常に factcheck.md へ」に変更
- `workflows/factcheck.md`: 常時実行に変更。チェック対象スコープ（会話・主観・架空設定の除外、セリフ内の事実は対象）と
  ユーモア保全ルールを明記。客観的事実の記述が無い本文は「対象なし」として完了
- `personas/skeptical-fact-checker.md`: スコープ定義を追加（冗談・誇張演出を事実主張として扱わない）
- `personas/simplification-safety-checker.md`: 実行条件の記述更新
- `personas/final-editor.md`: ユーモア保全の優先度を明記
- `personas/esl-writer.md`: 「事実チェック対象ジャンルの場合」→「客観的事実の記述を書く場合」に変更
- `docs/topic-ideas.md`: 「フィクション扱いにできる」系のメモを新ルールに合わせて修正

### Phase 3: 既存トマト会話3トピックへの適用

- 3トピックの `config.json` を `requiresFactCheck: true` に変更
- `texts/tomato-fruit-or-vegetable-20260709-164126/sources/` の3ファイルを各トピックの `sources/` にコピー
- アウトラインを v2 として保存し（既存 v1 は残す）、事実を含むセクションに根拠ソースを記録。`variant.json` の `outlineVersion` を 2 に更新
- `factcheck.md` を3記事に実行（懐疑的ファクトチェッカー＋簡略化セーフティチェッカー→final-editor→修正）
- 修正が入った記事は音声を再生成（記事バージョンと同番号で上書き）
- `npm run build` でバッジが "Fact-checked" になることを確認

## 影響範囲

- ルール文書: `docs/specs/esl-level-spec.md`, `CLAUDE.md`, `docs/topic-ideas.md`
- ワークフロー: `config.md`, `research.md`, `outline.md`, `generate.md`, `factcheck.md`
- ペルソナ: `skeptical-fact-checker.md`, `simplification-safety-checker.md`, `final-editor.md`, `esl-writer.md`
- 生成物: トマト会話3トピック（config / sources / outlines / variant.json / articles / audio）
- コード変更は無し（`lib/site.js` のバッジは `requiresFactCheck` を表示するだけなのでそのまま）
- 過去のトピック（Lost While Traveling など `requiresFactCheck: false` の既存4トピック）は遡って変更しない（依頼があれば別途）

## テスト方針

- `npm run build` がエラーなく完了し、3トピックのバッジが "Fact-checked" になること
- factcheck 実行で全主張が sources と一致（要修正・根拠不明ゼロ）になるまで反復すること
- 記事を修正した場合、該当バリアントの音声を再生成すること
