# workflows/audio.md — リスニング用音声の生成

ESL学習用テキスト生成フローの7番目のステップ。本文・イラスト確定後、確定した記事バージョンを
`scripts/generate-audio.js` で音声化し、`variants/{level}-{tier}/audio/v{N}.mp3` を生成する。
イラスト（トピック単位で1枚共有）と異なり、**音声はレベルごとに本文が異なるためバリアント単位**で、
記事バージョン `articles/v{N}.md` と同じ番号 `v{N}.mp3` として生成する。

イラスト生成と同様、この段階は Claude Code がペルソナとして本文を書くのではなく、
実際の音声生成API（Gemini 2.5 Flash Preview TTS）を呼び出すスクリプトを実行する。

スクリプトは本文をタイトル・見出し・段落単位のセグメントに**分割して個別に音声生成**し、
セグメント間に種別に応じた**無音（間）を注入して結合**、MP3にエンコードする
（タイトル後 1.2秒 / 見出し前 1.6秒・後 1.0秒 / 段落間 0.9秒 / リスト項目間 0.6秒。
読み上げ速度はバリアントのレベルに応じて自動で変わる: A1-A2 はとてもゆっくり、C1-C2 は自然な速さ）。

参照: [scripts/generate-audio.js](../scripts/generate-audio.js)、[docs/plans/listening-audio-tts.md](../docs/plans/listening-audio-tts.md)

## 前提

- 本文が確定済みであること
  - `requiresFactCheck: false` の場合: [workflows/generate.md](generate.md) 完了時点
  - `requiresFactCheck: true` の場合: [workflows/factcheck.md](factcheck.md) 完了時点
- `GEMINI_API_KEY` が `.env` に設定済みであること（未設定の場合は利用者に `.env.example` を `.env` にコピーして
  キーを設定するよう案内し、設定されるまでこのワークフローを進めない）
- `ffmpeg` がインストールされていること（MP3エンコードに使用）

## 手順

### 1. 既存音声の確認

- `variants/{level}-{tier}/audio/` を確認する
- 対象の記事バージョン `v{N}.md` に対応する `v{N}.mp3` が既に存在する場合は生成済み。
  再生成の明示的な依頼が無ければ手順2以降は行わず、既存音声を利用者に案内して終了する
- 存在しない場合のみ手順2に進む

### 2. 音声生成の実行

対象バリアントと確定済み記事バージョン N を指定して実行する。

```bash
node scripts/generate-audio.js texts/{topic-slug}-{timestamp}/variants/{level}-{tier} {N}
```

- セグメントごとに進捗が表示され、成功すると `audio/v{N}.mp3` と生成条件を記録した `audio/v{N}.json` が保存される
- セグメント数が多い長文（very-long など）は API を順次呼び出すため数分かかることがある。
  429（レート制限）は自動リトライされるので、エラー終了しない限り待つ
- `GEMINI_API_KEY` 未設定・APIエラーの場合はエラーメッセージが出力されるので、内容に応じて
  利用者に `.env` の設定やレート制限の解消を案内する
- 音声（voice）を変えたい場合は `.env` の `GEMINI_TTS_VOICE` で指定する（デフォルト: Kore）

### 3. 生成結果の確認

- 出力ログの再生時間（`Saved audio to ... (XmXXs)`）が本文の分量に対して妥当か確認する
  （目安: 分量tier normal で1〜3分程度。数秒しかない場合は生成失敗の可能性が高い）
- 利用者に試聴を案内する（ビューアサーバ起動中であれば記事ページ
  `/texts/{topicId}/{variantId}` にプレイヤーが表示される）
- 速度・間・声質に不満がある場合は、`.env` の `GEMINI_TTS_VOICE` の変更や
  `scripts/generate-audio.js` の `PAUSES` / `STYLE_BY_LEVEL` の調整を検討し、再実行して上書きする

### 4. 次のワークフローへの案内

- この時点で音声生成は完了。フィードバックがあれば [workflows/brushup.md](brushup.md) を実行する
- `brushup.md` で本文が新バージョン `v{N+1}.md` として更新された場合は、このワークフローを
  新バージョンに対して再実行し、`audio/v{N+1}.mp3` を生成する（記事ページは記事バージョンと
  同じ番号の音声のみ表示するため、再生成しないと新バージョンのページには音声が出ない）
