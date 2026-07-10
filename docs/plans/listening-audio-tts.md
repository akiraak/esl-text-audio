# リスニング用音声（TTS読み上げ）の導入

## 目的・背景

プロジェクトの当初目的（読解テキスト＋**リスニング用音声**＋確認問題）のうち、音声がまだ無い。
記事本文を Gemini 2.5 Flash Preview TTS で音声化し、記事ページで再生できるようにする。

長い記事を1回のAPI呼び出しで音声化すると、入力上限・生成の不安定さ・段落間の間（ま）の制御不能という問題があるため、
**セグメント分割生成 → 無音（ポーズ）注入 → 結合** の方式を取る。

## 対応方針

### 音声生成スクリプト `scripts/generate-audio.js`

イラスト生成（`scripts/generate-illustration.js`）と同様、Claude Code のワークフローから呼び出す実行スクリプトとして実装する。

```
node scripts/generate-audio.js <variant-dir> <version>
# 例: node scripts/generate-audio.js texts/water-cycle-.../variants/B1-normal 1
```

1. **分割（セグメント化）**: `articles/v{N}.md` の frontmatter を除いた本文を、
   タイトル（`# `）・見出し（`## `以降）・段落（空行区切り）単位のセグメントに分解する。
   インライン Markdown（強調・リンク等)は読み上げ用にプレーンテキスト化する。リスト項目は1項目=1セグメント。
   1セグメントが長すぎる場合（約4,000文字超）のみ文境界でさらに分割する
2. **分割生成**: セグメントごとに Gemini TTS API（`gemini-2.5-flash-preview-tts`、
   `responseModalities: ["AUDIO"]`）を順次呼び出し、PCM（s16le / 24kHz / mono）を得る。
   レベル（variant.json の `level`）に応じて読み上げスタイル指示を変える（A1-A2: ゆっくり明瞭、B1-B2: やや遅め、C1-C2: 自然な速さ）。
   429 / 5xx は指数バックオフでリトライ
3. **間（ポーズ）の注入と結合**: セグメント間に無音 PCM を挿入して連結する。
   - タイトルの後: 1.2秒
   - セクション見出しの前: 1.6秒 / 後: 1.0秒
   - 段落間: 0.9秒
   - リスト項目間: 0.6秒
4. **エンコード**: 連結した PCM を ffmpeg（インストール済み）で MP3 化し、
   `variants/{level}-{tier}/audio/v{N}.mp3` に保存する（N は記事バージョンと対応）。
   併せて `v{N}.json` に model / voice / セグメント数 / 生成日時を記録する

- API キーは `.env` の `GEMINI_API_KEY`（`.env.example` に追記）。voice は `GEMINI_TTS_VOICE`（デフォルト Kore）
- 音声はレベルごとに本文が異なるため**バリアント単位**（イラストのトピック単位とは異なる）

### ワークフロー `workflows/audio.md`

illustrate.md の後・brushup.md の前のステップとして追加。確定した記事バージョンに対しスクリプトを実行し、結果を確認する。
brushup で記事の新バージョンを作ったら音声も再生成する。CLAUDE.md のディレクトリ構成・ワークフロー一覧も更新する。

### 閲覧ページへの組み込み

- `lib/site.js`: 記事ページ（`renderArticleContent`）に、該当バージョンの `audio/v{N}.mp3` が存在すれば `<audio controls>` プレイヤーを表示
- `server.js`: `/texts/:topicId/:variantId/audio/:version.mp3` 配信ルートを追加
- `scripts/build-static-site.js`: `audio/v{N}.mp3` を `dist/texts/{id}/{variantId}/audio/{N}.mp3` にコピー

## 影響範囲

- 新規: `scripts/generate-audio.js`, `workflows/audio.md`, `texts/**/variants/**/audio/`
- 変更: `lib/site.js`, `server.js`, `scripts/build-static-site.js`, `.env.example`, `CLAUDE.md`

## テスト方針

- セグメント分割・無音注入・ffmpeg エンコードは、APIを呼ばないフェイクPCM（`GEMINI_TTS_FAKE=1`）で動作確認する
- `GEMINI_API_KEY` 設定後に既存記事1本で実生成し、間の長さ・読み上げ速度を耳で確認して調整する
- 記事ページ（ローカルサーバ・静的ビルド両方）でプレイヤー表示と再生を確認する

## Phase / Step

- Phase 1: 音声生成スクリプト（分割生成・ポーズ注入・結合・MP3化）
- Phase 2: ワークフロー `workflows/audio.md` と CLAUDE.md 更新
- Phase 3: 閲覧ページ（server.js / lib/site.js / build-static-site.js）への組み込み
- Phase 4: 実音声の生成（GEMINI_API_KEY 設定後）と聴感調整
