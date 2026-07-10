# 読み上げキャラ未指定時のランダム選択

## 目的・背景

[tts-voice-characters](archive/tts-voice-characters.md) でキャラ未指定時のデフォルトを `chobi` 固定にしたが、
利用者の要望により「指定しない場合は chobi / manabi の2キャラをランダムに使い分ける」動作に変更する。

## 対応方針

- `scripts/generate-audio.js`: `DEFAULT_CHARACTER`（chobi 固定）を廃止し、
  CLI第3引数 > `GEMINI_TTS_CHARACTER` > **ランダム選択** の順にする。
  選ばれたキャラは従来どおり実行ログと `audio/v{N}.json` の `character` に記録される
- `workflows/audio.md` 手順2: ジャンルからの提案・chobi デフォルトの記述を「指定が無ければスクリプトがランダムに選ぶ。
  トピック内で声を統一したい場合は既存音声の `character` に合わせて明示指定する」に変更
- `.env.example`: 「未設定は chobi」→「未設定はランダム」

## 影響範囲

`scripts/generate-audio.js` / `workflows/audio.md` / `.env.example`。既存の生成済み音声には影響しない。

## テスト方針

`GEMINI_TTS_FAKE=1` でキャラ未指定の実行を複数回行い、chobi / manabi の両方が選ばれること、
明示指定（CLI / env）が引き続き優先されることを確認する。
