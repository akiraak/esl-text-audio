# Web表示を全て英語にする

## 目的・背景

TODO.md 記載のタスク。ビューア（`server.js` / `scripts/build-static-site.js` → GitHub Pages）はESL学習者向けの公開サイトだが、
現状は `lib/site.js` のUI文言に加え、生成済みトピックのメタデータ（`config.json` の `topic`/`genre`、`variant.json` の `wordCountTarget`）が
日本語のまま公開ページに表示されている。またoutlineページ（`/texts/:topicId/outline/:tier/:version`）は記事執筆用の内部企画メモを
そのまま公開しており、中身が丸ごと日本語。

利用者との確認の結果、方針は以下:
- `config.topic` は既存3トピック分を英訳し、今後は `workflows/config.md` で常に英語で保存する
- `config.genre` も既存分・今後分とも `docs/specs/esl-level-spec.md` のジャンル英名（Narrative / Dialogue / Descriptive / Instructional /
  Expository / Personal writing / News-style / Opinion/Essay）に統一する
- outlineページは非公開化する（`texts/` 配下のファイル自体は日本語のまま残し、ワークフローも変更しない。公開サイトからのルート・リンクのみ削除）

## 対応方針

### Phase 1: `lib/site.js` のUI文言・表示ロジックを英語化

- `layout()` の `lang="ja"` → `lang="en"`
- 見出し・ナビ・ラベル・バッジなど全てのハードコードされた日本語文字列を英語化
  - `TIER_LABELS`: `normal`→"Normal", `long`→"Long", `very-long`→"Very Long"
  - `renderIndex`/`renderTextDetail`/`renderVariantDetail`/`renderArticle`/`renderSource`/`render404`/`renderLevels` 内の文言一式
  - `事実チェック対象` / `はい`・`いいえ` → `Fact-checked` / `Yes`・`No` 等
- `renderTextDetail` のsources一覧: リンク文字列を生ファイル名ではなく、各ソースファイルのfrontmatter `title`（既に英語）を使うように変更
- outline関連の削除
  - `renderOutline` 関数、`renderTextDetail` 内のoutlineセクション表示、`renderVariantDetail` 内の「元になったアウトライン」リンクを削除
  - `listOutlineVersions` はoutline表示専用なら合わせて削除（`module.exports` からも外す）
- `/levels` ページが参照する `docs/specs/esl-level-spec.md` の「## CEFR レベル定義」セクションをPhase 3で英語化するため、
  `readLevelSpecSection` 自体はそのまま（正規表現の見出し文字列だけ英語版に追随させる）

### Phase 2: 公開ルート側からoutlineを除去

- `server.js`: `/texts/:topicId/outline/:tier/:version` ルートを削除
- `scripts/build-static-site.js`: outlineビルドループ（`TIERS`×`listOutlineVersions`）を削除

### Phase 3: `docs/specs/esl-level-spec.md` の「CEFRレベル定義」セクションを英語化

- `/levels` ページはこのセクションをそのまま `marked` でレンダリングして表示するため、該当セクションのみ英語に翻訳する
  （single source of truthの方針は維持。ジャンル表・長文モード・事実チェック方針など他セクションはワークフロー専用の内部参照なので日本語のまま残す）

### Phase 4: 既存生成済みデータ（3トピック）の移行

- `texts/how-honey-is-made-20260709-082323/config.json`: `topic` → "How Honey Is Made", `genre` → "Expository"
- `texts/lost-while-traveling-20260708-222921/config.json`: `topic` → "Lost While Traveling", `genre` → "Narrative"
- `texts/water-cycle-20260709-052935/config.json`: `topic` → "The Water Cycle", `genre` → "Expository"
- 上記3トピック配下の全 `variant.json` の `wordCountTarget` を英語表記に変換（例: "300〜600語"→"300-600 words", "4000語以上"→"4000+ words"）

### Phase 5: 今後の生成に向けたワークフロー更新

- `workflows/config.md` 手順6: `config.json` の `topic` は英語で保存するよう明記（利用者が日本語でトピックを伝えた場合はClaude Codeが英訳して保存する）。
  `genre` もジャンル表の英名で保存するよう明記
- `workflows/outline.md` 手順11: `variant.json` の `wordCountTarget` は英語表記（例: "300-600 words"）で保存するよう明記

### Phase 6: 動作確認

- `npm start` でローカルサーバを起動し、`curl` で `/`・`/levels`・トピック詳細・バリアント詳細・記事・source詳細ページを確認（日本語文言・outlineリンクが残っていないこと）
- `npm run build` で静的ビルドが通ることを確認し、`dist/` にoutlineディレクトリが生成されないことを確認

## 影響範囲

- `lib/site.js`, `server.js`, `scripts/build-static-site.js`
- `docs/specs/esl-level-spec.md`（CEFRレベル定義セクションのみ）
- `workflows/config.md`, `workflows/outline.md`
- `texts/*/config.json`, `texts/*/variants/*/variant.json`（既存3トピック分）

## テスト方針

- 自動テストなし（既存方針を踏襲）。Phase 6の実地確認をもって完了とする
