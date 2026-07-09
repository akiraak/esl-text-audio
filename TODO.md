# TODO

- [ ] ESL学習用テキストを生成する仕組みを作る [plan](docs/plans/esl-text-generation.md)
  - [x] Phase 1: `docs/specs/esl-level-spec.md` 作成（CEFRレベル別の語彙・文長・語数、文章形式・事実チェック方針の定義）
  - [x] Phase 2: `personas/` 作成（README.md + 5ペルソナ: ESL教材ライター・学習者シミュレーター・懐疑的ファクトチェッカー・簡略化セーフティチェッカー・最終エディター）
  - [x] Phase 3: ディレクトリ構成・CLAUDE.md 追記（`.gitignore` に `texts/` 追加）
  - [x] Phase 4: `workflows/config.md` 作成（トピック・英語レベル・形式収集、事実チェック要否判定、esl-level-spec.md を参照）
  - [x] Phase 5: `workflows/research.md` 作成（事実チェック対象時の外部資料収集・`sources/` 保存）
  - [ ] Phase 6: `workflows/outline.md` 作成（アウトライン作成・承認・バージョン管理、レベルと形式の整合確認、セクション別ソース記録、esl-writerペルソナ適用）
  - [ ] Phase 7: `workflows/generate.md` 作成（本文生成・esl-level-spec.md に基づく適性チェックリスト反映、ソース参照執筆、esl-writer/learner-simulator/final-editorペルソナ適用）
  - [ ] Phase 8: `workflows/factcheck.md` 作成（生成本文と `sources/` の突き合わせ・修正の反復、skeptical-fact-checker/simplification-safety-checker/final-editorペルソナ適用）
  - [ ] Phase 9: `workflows/brushup.md` 作成（フィードバック反映・再生成、事実に関わる修正時は factcheck 再実行、final-editorペルソナ適用）
  - [ ] Phase 10: サンプルトピックでの通し動作確認（事実チェック対象・対象外の両パターン、各ペルソナの動作確認）
  - 入力: 主題（トピック）+ 英語レベル
  - 生成フロー: まず全体のプロット/アウトラインを作成 → それを調整 → 清書して最終テキストを生成
  - 重視すること: ESLの学習に適した内容であること、読んでいて楽しいこと
  - 事実チェック: 物語・対話文など明らかにフィクションのジャンルは対象外、それ以外（説明文・手順文・説明的文章・
    日記/手紙/メール・ニュース記事風・意見文/エッセイ）は外部資料と突き合わせて事実面を確認する
    （詳細は [esl-level-spec.md](docs/specs/esl-level-spec.md) の「事実チェック方針」参照）
  - AIペルソナ: 生成・チェックの各段階で視点を変えるため [personas/](personas/README.md) に5ペルソナを定義済み
  - 参考: `~/git-art` の outline → generate → brushup ワークフロー
    （`outlines/v{N}.md` でアウトラインを作成・バージョン管理し承認を得てから、
    `articles/v{N}.md` として本文を生成。フィードバックがあればアウトラインを
    更新して再生成する brushup ステップを持つ）
  - 参考: `~/deep-pulse` の CLAUDE.md 記事生成ルール
    （`_plan.md` で構成案を作り承認を得てから本文をセクションごとに生成し、
    ソースとの突き合わせでファクトチェックする多段プロセス）
  - 両プロジェクトとも本文生成自体はLLM APIを直接呼ぶコードではなく、
    Claude Code自身が `CLAUDE.md` / `workflows/*.md` の指示に従って対話的に
    生成する方式（このプロジェクトでも同様の方式を踏襲するか要検討）
