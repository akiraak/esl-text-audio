# リスニング音声の読み上げキャラ設定（chobi / manabi）

## 目的・背景

TODO「読み上げのキャラ設定を行う ~/claude-code-manager のchobiとmanabiの声設定を使う」への対応。

現状の `scripts/generate-audio.js` は単一のデフォルト声（`GEMINI_TTS_VOICE`、既定 Kore）で読み上げており、
声のキャラクター性（トーン・話し方）の設定が無い。`~/claude-code-manager`（`ai-monitor/voice-persona.json`、
実装元は `~/ai-twitch-cast` の `src/character_manager.py`）で使っている2キャラの声設定を持ち込む。

- **chobi（ちょビ・先生役）**: Gemini TTS voice `Leda`。柔らかく楽しげな、にこにこしたトーン
  （英語版スタイル: "Read in a warm, cheerful, always-smiling tone"）
- **manabi（生徒役）**: Gemini TTS voice `Aoede`。元気で明るく好奇心いっぱいのトーン
  （英語版スタイル: "Read in a bright, energetic voice full of curiosity"）。
  ※ manabi は claude-code-manager / ai-twitch-cast の生徒キャラ「なるこ」の旧名
  （ai-twitch-cast に `test_migrates_manabi_to_naruko` あり）。本プロジェクトでは TODO の表記に合わせ
  キャラ名 `manabi` を採用する

## 対応方針

1. **`scripts/generate-audio.js` にキャラ定義を追加**
   - `CHARACTERS = { chobi: {voice: 'Leda', tone: ...}, manabi: {voice: 'Aoede', tone: ...} }` を定義
   - トーンは英語テキスト読み上げ用に英語の1文で持ち、既存のレベル別スタイル
     （`STYLE_BY_LEVEL`、読み上げ速度・明瞭さ）の後ろに連結してスタイル指示にする
     （速度=レベル依存、声色=キャラ依存、の2軸を合成）
   - キャラ選択: CLI第3引数 `[character]` > 環境変数 `GEMINI_TTS_CHARACTER` > 既定 `chobi`
   - `GEMINI_TTS_VOICE` は「キャラの声を明示的に差し替える上級者向けオーバーライド」に位置づけを変更
     （空なら キャラの声を使う）。`.env` / `.env.example` の `GEMINI_TTS_VOICE=Kore` は削除し、
     `GEMINI_TTS_CHARACTER=` を追記
   - `audio/v{N}.json` メタデータに `character` を記録
2. **`workflows/audio.md` を更新**
   - キャラ（chobi / manabi）の説明と選び方を追記。既定は chobi（先生役・落ち着いたナレーション向き）。
     明るく元気な読み味にしたい場合（日記・物語で若い語り手など）は manabi を指定
3. **既存音声の再生成**
   - 公開済みの実音声 water-cycle B1-normal `audio/v1.mp3`（旧設定 Kore）を chobi（Leda）で再生成して上書き

将来スコープ（今回はやらない）: 対話文（Dialogue）ジャンルでの2キャラ掛け合い
（Gemini TTS の multi-speaker 生成で chobi × manabi を割り当てる）。対話ジャンルのテキストを
初めて作るときに検討する。

## 影響範囲

- `scripts/generate-audio.js`（キャラ定義・選択・スタイル合成・メタデータ）
- `.env.example` / `.env`（`GEMINI_TTS_VOICE=Kore` の撤去、`GEMINI_TTS_CHARACTER` 追加）
- `workflows/audio.md`（手順記述）
- `texts/water-cycle-20260709-052935/variants/B1-normal/audio/v1.{mp3,json}`（再生成）

## テスト方針

- `GEMINI_TTS_FAKE=1` でオフライン実行し、キャラ選択（既定 / CLI / env）と
  メタデータ `character` / `voice` / `style` の合成結果を確認する
- 実APIで water-cycle B1-normal を再生成し、再生時間が旧版と同程度であること・聴感を確認する
