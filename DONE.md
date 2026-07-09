# DONE

## 2026-07-08

- [x] 生成したページを表示するWebサーバを作成（[archived plan](docs/plans/archive/text-viewer-server.md)）
  - Phase 1: `package.json` 作成・依存パッケージ導入（express, marked, gray-matter）、`.gitignore` に `node_modules/` 追加
  - Phase 2: `server.js` 実装（一覧ページ、詳細ページ、article/outline/sourcesの各バージョン表示ルーティング、404処理）
  - Phase 3: `npm start` 起動スクリプト整備・README追記（デフォルトポート3020、`PORT`環境変数で変更可）
  - Phase 4: 既存生成物（water-cycle, lost-while-traveling）での一覧・詳細・各ルート・404ケースを実地確認、全項目PASS
  - `texts/{topic-slug}-{timestamp}/` 配下の config.json・outlines/・articles/・sources/ をブラウザで閲覧できるローカル開発用ビューア
  - id はディレクトリ名をそのまま使用し、バージョンやsourceファイル名はファイルシステムを都度読み取って動的に一覧表示する方式（欠番があっても対応）

## 2026-07-09

- [x] ESL学習用テキストを生成する仕組みを作る（[archived plan](docs/plans/archive/esl-text-generation.md)）
  - Phase 1: `docs/specs/esl-level-spec.md` 作成（CEFRレベル別の語彙・文長・語数、文章形式・事実チェック方針の定義）
  - Phase 2: `personas/` 作成（README.md + 5ペルソナ: ESL教材ライター・学習者シミュレーター・懐疑的ファクトチェッカー・簡略化セーフティチェッカー・最終エディター）
  - Phase 3: ディレクトリ構成・CLAUDE.md 追記（`.gitignore` に `texts/` 追加）
  - Phase 4: `workflows/config.md` 作成（トピック・英語レベル・形式収集、事実チェック要否判定、esl-level-spec.md を参照）
  - Phase 5: `workflows/research.md` 作成（事実チェック対象時の外部資料収集・`sources/` 保存）
  - Phase 6: `workflows/outline.md` 作成（アウトライン作成・承認・バージョン管理、レベルと形式の整合確認、セクション別ソース記録、esl-writerペルソナ適用）
  - Phase 7: `workflows/generate.md` 作成（本文生成・esl-level-spec.md に基づく適性チェックリスト反映、ソース参照執筆、esl-writer/learner-simulator/final-editorペルソナ適用）
  - Phase 8: `workflows/factcheck.md` 作成（生成本文と `sources/` の突き合わせ・修正の反復、skeptical-fact-checker/simplification-safety-checker/final-editorペルソナ適用）
  - Phase 9: `workflows/brushup.md` 作成（フィードバック反映・再生成、事実に関わる修正時は factcheck 再実行、final-editorペルソナ適用）
  - Phase 10: サンプルトピックでの通し動作確認（物語/A2・説明的文章/B1の両パターンで実地検証、全項目PASS。検証中に見つかった軽微な改善点を `workflows/research.md` に反映）
  - 入力: 主題（トピック）+ 英語レベル
  - 生成フロー: config → (research) → outline → generate → (factcheck) → brushup を Claude Code 自身が `workflows/*.md` の指示に従って対話的に実行する方式（`~/git-art`・`~/deep-pulse` の多段プロセスを踏襲）
  - 重視すること: ESLの学習に適した内容であること、読んでいて楽しいこと
  - 事実チェック: 物語・対話文など明らかにフィクションのジャンルは対象外、それ以外（説明文・手順文・説明的文章・
    日記/手紙/メール・ニュース記事風・意見文/エッセイ）は外部資料と突き合わせて事実面を確認する
    （詳細は [esl-level-spec.md](docs/specs/esl-level-spec.md) の「事実チェック方針」参照）
  - AIペルソナ: 生成・チェックの各段階で視点を変えるため [personas/](personas/README.md) に5ペルソナを定義