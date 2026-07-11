# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

英語学習者(ESL)向けに、読解用テキスト、リスニング用音声、および読解確認問題を生成するツール。

## 現在の状態

このリポジトリにはまだコードが存在しません(LICENSE と README のみ)。ビルド・Lint・テストコマンドやアーキテクチャは、実装が追加され次第このファイルに追記してください。

## ESL学習用テキスト生成の仕組み

読解用テキストの生成は、LLM API を直接呼ぶコードとしてではなく、**Claude Code 自身が `workflows/*.md` の指示に従って対話的に生成する方式**を取る
（`~/git-art` の outline → generate → brushup、`~/deep-pulse` のプラン作成 → 本文生成 → ファクトチェックという多段プロセスを踏襲）。
当初の詳細設計は [docs/plans/archive/esl-text-generation.md](docs/plans/archive/esl-text-generation.md) を参照（トピックの複数バリアント対応など、その後の変更は [docs/plans/topic-variants-and-length-tiers.md](docs/plans/topic-variants-and-length-tiers.md) を参照）。

例外として、本文に添えるイラスト生成（[workflows/illustrate.md](workflows/illustrate.md)）とリスニング用音声生成（[workflows/audio.md](workflows/audio.md)）のみ、
Claude Code がピクセルデータ・音声波形を直接生成できないため、それぞれ `scripts/generate-illustration.js` 経由で画像生成API（OpenAI GPT Image 2）、
`scripts/generate-audio.js` 経由で音声生成API（Gemini 2.5 Flash Preview TTS）を実際に呼び出す。プロンプト作成までは他ワークフローと同様
Claude Code が対話的に行う。

### ディレクトリ構成

```
esl-text-audio/
├── docs/
│   ├── specs/
│   │   └── esl-level-spec.md   # CEFRレベル別の語彙・文長・分量tier別語数、文章形式（ジャンル）・長文モード・事実チェック方針の定義
│   └── topic-ideas.md    # トピック案のストック（アイデア一覧＋採用済み一覧）。config.md から参照・更新する
├── workflows/
│   ├── config.md       # トピック・ジャンルなどトピック単位の生成条件の収集
│   ├── research.md      # 事実チェック用の外部資料収集（客観的事実の記述を予定しないトピックはスキップ可）
│   ├── outline.md       # バリアント（レベル×分量）設定・アウトライン作成・承認
│   ├── generate.md      # 本文生成
│   ├── factcheck.md     # 生成した本文と外部資料の突き合わせ・修正
│   ├── illustrate.md    # 本文に対応するAI生成イラストの作成
│   ├── audio.md         # 確定した本文のリスニング用音声（TTS）の生成
│   ├── questions.md     # 確定した本文の理解度確認問題（4択・自動採点）の作成
│   ├── brushup.md       # フィードバックに基づく調整・再生成
│   └── add-ideas.md     # トピックアイデアの追加（生成パイプラインとは独立の単体ワークフロー）
├── scripts/
│   ├── generate-illustration.js   # OpenAI Images API を呼び出しイラストを生成するスクリプト（illustrate.md から実行）
│   └── generate-audio.js          # Gemini TTS API で本文をセグメント分割生成→無音（間）注入→結合して音声化するスクリプト（audio.md から実行）
├── personas/             # 生成・チェック時に使うAIペルソナ定義（1ペルソナ1ファイル）
├── lib/
│   └── site.js           # 一覧・詳細ページのHTML組み立てロジック（server.js・静的ビルドスクリプト共通）
├── server.js              # ローカル閲覧用Webサーバ（lib/site.js を basePath なしで呼び出す）
├── scripts/
│   └── build-static-site.js   # texts/ 配下から公開用の静的HTMLを dist/ に生成
└── texts/                # 生成物。公開サイト（esltext.chobi.me）で配信するためコミット対象
    └── {topic-slug}-{YYYYMMDD-HHMMSS}/     # トピック単位
        ├── config.json    # topic / genre / requiresFactCheck など、トピック単位の条件
        ├── sources/       # 客観的事実の記述を含むトピックのみ作成（チェック用の外部資料）。バリアント間で共有
        ├── outlines/      # 分量tier単位（レベルには依存しない、複数バリアントで共有）
        │   ├── normal/v1.md, v2.md, ...
        │   ├── long/v1.md, ...
        │   └── very-long/v1.md, ...
        ├── images/        # illustrate.md 実行後のみ作成。トピックにつき1枚を全バリアントで共有
        │   └── v1.png, v1.prompt.txt, ...
        └── variants/      # レベル×分量tierの組み合わせ＝バリアント単位
            └── {level}-{tier}/            # 例: B1-normal, C1-long, A1-very-long
                ├── variant.json           # level / tier / wordCountTarget / longForm / outlineTier / outlineVersion
                ├── articles/v1.md, v2.md, ...
                ├── audio/                 # audio.md 実行後のみ作成。記事バージョンと同番号のMP3＋生成条件メタデータ
                │   └── v1.mp3, v1.json, ...
                └── questions/             # questions.md 実行後のみ作成。記事バージョンと同番号の理解度確認問題（4択）
                    └── v1.json, ...
```

- outline（分量tier単位）・article（バリアント単位）はそれぞれ独立にバージョン管理し、brushup のたびに新しいバージョンとして保存する（既存バージョンは直接編集しない）
- レベル（語彙・文法の難度）と分量tier（テキストの長さ、通常/長い/すごく長い）は独立した2軸。アウトラインは分量tierごとに1つ作り、同じtierを使う複数レベルのバリアントで共有する
  （詳細な設計は [docs/plans/topic-variants-and-length-tiers.md](docs/plans/topic-variants-and-length-tiers.md) を参照）
- レベル別の語彙・文長・分量tier別語数の目安、ESL読解に適した文章形式（ジャンル）、長文モード、事実チェック方針は [docs/specs/esl-level-spec.md](docs/specs/esl-level-spec.md) に一元化し、各 `workflows/*.md` はこのファイルを参照する
- イラストはバリアント単位ではなくトピック単位で1枚のみ生成し、全バリアントの記事ページで共有する（[docs/plans/archive/topic-level-single-illustration.md](docs/plans/archive/topic-level-single-illustration.md) を参照）

### ワークフロー一覧（実行順）

1. `workflows/config.md` — トピック・形式（ジャンル）を収集して `config.json`（トピック単位）に保存（事実チェックは常時実施のため `requiresFactCheck` は常に `true`）。
   トピック決定時は [docs/topic-ideas.md](docs/topic-ideas.md)（トピック案のストック）を参照し、採用したら「採用済み」へ移動・新しいアイデアを補充する
2. `workflows/research.md` — チェック対象となる客観的事実の記述を予定するトピックについて、外部資料を `sources/` に保存（トピック単位、バリアント間で共有）。
   客観的事実を扱わない見込みなら「収集対象なし」としてスキップできる
3. `workflows/outline.md` — バリアント（レベル×分量tier）ごとにレベル・分量を確定し、分量tier単位のアウトラインを作成・承認（`outlines/{tier}/v{N}.md`）。`variant.json` を保存
4. `workflows/generate.md` — 承認済みアウトラインとバリアントの条件から本文を生成する（`variants/{level}-{tier}/articles/v{N}.md`）
5. `workflows/factcheck.md` — 本文と `sources/` を突き合わせて事実面を修正（常に実行。ただしチェック対象は客観的事実の記述のみで、
   会話のやりとり・主観的内容・架空の設定は対象外。対象が無い本文は「対象なし」で完了）
6. `workflows/illustrate.md` — 確定した本文に対応するAI生成イラスト（GPT Image 2）を `scripts/generate-illustration.js` 経由で生成。トピックにつき1枚のみ生成し、全バリアントで共有する（既に生成済みの場合はスキップ）
7. `workflows/audio.md` — 確定した本文のリスニング用音声（Gemini 2.5 Flash Preview TTS）を `scripts/generate-audio.js` 経由で生成。バリアント単位で、記事バージョンと同番号の `audio/v{N}.mp3` を作る
8. `workflows/questions.md` — 確定した本文の理解度確認問題（4択・自動採点）を作成。バリアント単位で、記事バージョンと同番号の `questions/v{N}.json` を作る（本文確定後なら illustrate / audio と並行して実行できる）
9. `workflows/brushup.md` — フィードバックに基づき新バージョンとして調整・再生成（1バリアント単位で実行）

上記パイプラインとは独立して、いつでも実行できる単体ワークフロー:

- `workflows/add-ideas.md` — [docs/topic-ideas.md](docs/topic-ideas.md) へのトピックアイデアの追加（「アイデアを追加したい」と言われたらこれを実行する）

トピックだけが送られてきた場合は、上記フローに沿って `config.md` から開始し、`research.md`（客観的事実を扱わない場合はスキップ可）→ `outline.md`（レベル・分量の確定を含む）→ `generate.md` → `factcheck.md` → `illustrate.md` → `audio.md` → `questions.md` と進める。
同じトピックに別のレベル・分量のバリアントを追加したい場合は、`config.md` 手順1でその旨を伝えれば既存トピックを再利用し、`outline.md` から再開する。

### レベル・分量・ジャンル・事実チェック方針

CEFR レベル（A1〜C2）ごとの語彙・文長・分量tier別（通常/長い/すごく長い）の語数目安とジャンル別の適性レベル帯は [docs/specs/esl-level-spec.md](docs/specs/esl-level-spec.md) を参照。
レベルと分量は独立したパラメータであり、任意の組み合わせを選べる。
事実チェックは全ジャンルで常に実施する。ただしチェック対象は「現実世界について客観的事実として書かれている記述」のみ
（セリフの中で語られる事実も対象）で、会話のやりとりそのもの・登場人物の意見や感想など主観的な内容・架空の設定は対象外とする。
お笑い・ユーモアは教材の中核的な価値であり、事実修正の際もジョーク・オチを消さない言い換えを最優先する（詳細は esl-level-spec.md の「事実チェック方針」を参照）。

### AIペルソナ

本文生成・チェックの各段階で異なる視点を持たせるためのペルソナ定義を [personas/](personas/README.md) に用意している。各 `workflows/*.md` は該当する `personas/*.md` を参照してそのペルソナとして振る舞う。

## 生成テキストの閲覧・公開

- `server.js` — `npm start`（デフォルトポート3020）で起動するローカル閲覧用Webサーバ。`texts/` 配下を動的に読み込んで一覧・詳細を表示する
- `lib/site.js` — 上記のHTML組み立てロジック本体。`server.js` と `scripts/build-static-site.js` の両方から呼ばれる共通モジュールで、
  全てのリンク・画像srcは `basePath` 引数を受け取って組み立てる（ローカルサーバ・esltext.chobi.me とも `''`＝ルート配下）
- `scripts/build-static-site.js` — `npm run build` で `texts/` 配下から静的HTML一式を `dist/`（gitignore対象）に生成する。
  ベースパスは `PAGES_BASE_PATH`、OGP用originは `SITE_ORIGIN` 環境変数で指定する
- `texts/` は公開サイトで配信するためコミット対象（gitignore対象外）。生成したテキストは基本的にすべて公開される想定
- 公開サイトは自宅サーバ g3plus 上の https://esltext.chobi.me/（`~/g3plus-ops` 管理、[docs/plans/archive/esltext-chobi-me-deploy.md](docs/plans/archive/esltext-chobi-me-deploy.md) を参照）。
  ビルド時の環境変数は `PAGES_BASE_PATH=` 空 + `SITE_ORIGIN=https://esltext.chobi.me`。サーバ側 cron（15分おき）が main への push を検知して自動再ビルドするため、
  push するだけで反映される（以前併用していた GitHub Pages への公開は廃止済み）

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
