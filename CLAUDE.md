# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

英語学習者(ESL)向けに、読解用テキスト、リスニング用音声、および読解確認問題を生成するツール。

## 現在の状態

このリポジトリにはまだコードが存在しません(LICENSE と README のみ)。ビルド・Lint・テストコマンドやアーキテクチャは、実装が追加され次第このファイルに追記してください。

## ESL学習用テキスト生成の仕組み

読解用テキストの生成は、LLM API を直接呼ぶコードとしてではなく、**Claude Code 自身が `workflows/*.md` の指示に従って対話的に生成する方式**を取る
（`~/git-art` の outline → generate → brushup、`~/deep-pulse` のプラン作成 → 本文生成 → ファクトチェックという多段プロセスを踏襲）。
詳細な設計は [docs/plans/esl-text-generation.md](docs/plans/esl-text-generation.md) を参照。

例外として、本文に添えるイラスト生成（[workflows/illustrate.md](workflows/illustrate.md)）のみ、Claude Code がピクセルデータを直接生成できないため
`scripts/generate-illustration.js` 経由で画像生成API（OpenAI GPT Image 2）を実際に呼び出す。プロンプト作成までは他ワークフローと同様
Claude Code が対話的に行う。

### ディレクトリ構成

```
esl-text-audio/
├── docs/
│   └── specs/
│       └── esl-level-spec.md   # CEFRレベル別の語彙・文長・語数、文章形式（ジャンル）・事実チェック方針の定義
├── workflows/
│   ├── config.md       # トピック・英語レベルなど生成条件の収集
│   ├── research.md      # 事実チェック対象ジャンルの場合の外部資料収集
│   ├── outline.md       # アウトライン（構成案）作成・承認
│   ├── generate.md      # 本文生成
│   ├── factcheck.md     # 生成した本文と外部資料の突き合わせ・修正
│   ├── illustrate.md    # 本文に対応するAI生成イラストの作成
│   └── brushup.md       # フィードバックに基づく調整・再生成
├── scripts/
│   └── generate-illustration.js   # OpenAI Images API を呼び出しイラストを生成するスクリプト（illustrate.md から実行）
├── personas/             # 生成・チェック時に使うAIペルソナ定義（1ペルソナ1ファイル）
└── texts/                # 生成物（gitignore 対象、ローカルにのみ保存）
    └── {topic-slug}-{YYYYMMDD-HHMMSS}/
        ├── config.json
        ├── sources/      # 事実チェック対象ジャンルの場合のみ作成
        ├── outlines/
        │   └── v1.md, v2.md, ...
        ├── articles/
        │   └── v1.md, v2.md, ...
        └── images/       # illustrate.md 実行後のみ作成
            └── v1.png, v1.prompt.txt, ...
```

- outline / article はバージョン管理し、brushup のたびに新しいバージョンとして保存する（既存バージョンは直接編集しない）。article のバージョン番号は生成元 outline のバージョン番号に合わせる
- レベル別の語彙・文長・語数の目安、ESL読解に適した文章形式（ジャンル）、事実チェック方針は [docs/specs/esl-level-spec.md](docs/specs/esl-level-spec.md) に一元化し、各 `workflows/*.md` はこのファイルを参照する

### ワークフロー一覧（実行順）

1. `workflows/config.md` — トピック・英語レベル・形式（ジャンル）を収集し、事実チェック要否を判定して `config.json` に保存
2. `workflows/research.md` — `requiresFactCheck: true` の場合のみ、外部資料を `sources/` に保存
3. `workflows/outline.md` — アウトラインを作成し利用者の承認を得る（`outlines/v{N}.md`）
4. `workflows/generate.md` — 承認済みアウトラインから本文を生成する（`articles/v{N}.md`）
5. `workflows/factcheck.md` — `requiresFactCheck: true` の場合のみ、本文と `sources/` を突き合わせて事実面を修正
6. `workflows/illustrate.md` — 確定した本文に対応するAI生成イラスト（GPT Image 2）を `scripts/generate-illustration.js` 経由で生成
7. `workflows/brushup.md` — フィードバックに基づき新バージョンとして調整・再生成

トピックと英語レベルだけが送られてきた場合は、上記フローに沿って `config.md` から開始し、`research.md` と `factcheck.md` は `requiresFactCheck` の値に応じてスキップしながら `outline.md` → `generate.md` → （`factcheck.md`）→ `illustrate.md` と進める。

### レベル・ジャンル・事実チェック方針

CEFR レベル（A1〜C2）ごとの語彙・文長・語数の目安とジャンル別の適性レベル帯は [docs/specs/esl-level-spec.md](docs/specs/esl-level-spec.md) を参照。
事実チェックは物語・対話文など明らかにフィクションとわかるジャンルは対象外、それ以外（説明文・手順文・説明的文章・日記/手紙/メール・ニュース記事風・意見文/エッセイ）は対象とする。
ただし、対象ジャンルでも利用者が「架空の人物・場所を扱うフィクションである」と明示した場合は対象外にできる（理由は `config.json` に記録する）。

### AIペルソナ

本文生成・チェックの各段階で異なる視点を持たせるためのペルソナ定義を [personas/](personas/README.md) に用意している。各 `workflows/*.md` は該当する `personas/*.md` を参照してそのペルソナとして振る舞う。

<!-- vibeboard:begin -->
## 開発管理画面 (vibeboard)

ローカル開発時のタスク・プラン管理は [vibeboard](https://github.com/akiraak/vibeboard) で行う。
プロジェクト直下に degit で vendor してある（`./vibeboard/`）。

```bash
# 親プロジェクト直下から
node vibeboard/dist/cli.js --root .
# もしくは
./run-vibeboard.sh
```

`http://localhost:3010` でプロジェクト直下の `docs/plans/`・`docs/specs/`・`TODO.md`・`DONE.md`・`CLAUDE.md`・`README.md` を閲覧・編集できる。

- `Root` タブで `TODO.md` / `DONE.md` / `CLAUDE.md` / `README.md` をプレビュー表示・編集できる
  - 編集は楽観ロック（mtime チェック）付き。外部で先に更新されていた場合は保存時に 409 を返し、リロード / 手元維持 / 強制上書き を選べる
  - `fs.watch` + 2 秒ポーリングで外部変更を検知し、SSE でクライアントへ即時反映する
- ローカル開発専用（本番管理画面とは独立）
- ポート変更は `--port` または `VIBEBOARD_PORT` 環境変数で指定可能

## タスク管理ルール

- タスクは `TODO.md` で管理する
- タスクが完了したら `TODO.md` から該当項目を削除し、`DONE.md` に移動する
- `DONE.md` には完了日を `YYYY-MM-DD` 形式で付けて記録する
- 新しいタスクが発生したら `TODO.md` の適切なセクションに追加する
- タスクの実施前に `TODO.md` を確認し、優先度の高いものから着手する
- コミット時に `TODO.md` を確認し、実装した機能に対応するタスクがあれば `DONE.md` に移動する

## 作業着手ルール

作業（実装・調査いずれも）を始めるときは、コードに手を入れる前に以下を行う。

1. **プランファイルを作成する**: `docs/plans/<task-name>.md` に実装プラン or 調査プランを作成する
   - 目的・背景、対応方針、影響範囲、テスト方針を最低限記載する
   - 複数 Phase / Step に分かれる場合はファイル内でも Phase / Step を明示する
2. **`TODO.md` に該当項目があるか確認する**
   - 無ければ適切なセクションに追加する
   - 既存項目があれば、その項目に作成したプランファイルへのリンクを追記する（例: `[plan](docs/plans/<task-name>.md)`）
3. **複数 Phase / Step がある場合は `TODO.md` に子タスクとして追加する**
   - 親項目の下にインデントしたチェックボックスで Phase / Step を列挙する
   - Phase / Step が完了するごとにチェックを入れ、全完了で親項目を `DONE.md` に移す
4. **作業完了時の後片付け**
   - 親タスクを `DONE.md` に移動する
   - 対応するプランファイルは `docs/plans/archive/` に移動する
<!-- vibeboard:end -->
