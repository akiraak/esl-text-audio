# キャラ未指定時にトピック内でキャラをバランスさせる

## 目的・背景

読み上げキャラ未指定時は実行ごとの完全ランダム選択のため、同一トピックの全バリアントが
偶然同じキャラに揃うことがある（tomato-fruit-or-vegetable では3本すべて chobi になった）。
トピック内でキャラが偏らないよう、未指定時の選択ロジックを改善する。

## 対応方針

`scripts/generate-audio.js` の `randomCharacterName()`（完全ランダム）を
`pickCharacterName(variantDir, version)` に置き換える:

1. 対象バリアントの親（`variants/`）配下の全バリアントの `audio/*.json` を走査し、
   `character` の使用回数をキャラごとに集計する
2. 今回上書きされる `audio/v{N}.json` 自身は集計から除外する（再生成時に旧値が影響しないように）
3. 使用回数が最少のキャラを選ぶ。同数（初回生成を含む）の場合はその中からランダム

優先順位は従来どおり: CLI第3引数 > `GEMINI_TTS_CHARACTER` > 上記の自動選択。
既存音声の再生成は行わない。

## 影響範囲

- `scripts/generate-audio.js`（選択ロジック・usage表示・module.exports にテスト用エクスポート追加）
- ドキュメント: `workflows/audio.md`・`.env.example` の「ランダム」記述の更新

## テスト方針

- `pickCharacterName` を直接呼び、tomato トピック（既存3本すべて chobi）で manabi が
  選ばれること、除外指定（自バージョンのメタデータ）が効くことを確認する
- 音声の再生成は行わない
