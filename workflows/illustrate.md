# workflows/illustrate.md — イラスト生成

ESL学習用テキスト生成フローの6番目のステップ。本文確定後、[personas/esl-writer.md](../personas/esl-writer.md) のペルソナで
記事全体を象徴するイラストの英語プロンプトを作成し、`scripts/generate-illustration.js` を実行して
`images/v{N}.png`（トピック直下、**トピックにつき1枚を全バリアントで共有**）を生成する。テキスト生成とは異なり、この段階のみ Claude Code が直接ペルソナとして本文を書くのではなく、
実際の画像生成APIを呼び出すスクリプトを実行する。

同じトピック内の複数バリアント（レベル×分量tier）は題材・場面が共通のため、イラストはトピックで1枚のみ生成し、
全バリアントの記事ページで使い回す。すでにそのトピックのイラストが生成済みの場合は、このワークフローは実行せず
既存のイラストをそのまま使う。

参照: [personas/esl-writer.md](../personas/esl-writer.md)、[scripts/generate-illustration.js](../scripts/generate-illustration.js)

## 前提

- 本文が確定済みであること
  - `requiresFactCheck: false` の場合: [workflows/generate.md](generate.md) 手順7完了時点
  - `requiresFactCheck: true` の場合: [workflows/factcheck.md](factcheck.md) 手順7完了時点
- `OPENAI_API_KEY` が `.env` に設定済みであること（未設定の場合は利用者に `.env.example` を `.env` にコピーして
  キーを設定するよう案内し、設定されるまでこのワークフローを進めない）

## 手順

### 1. 既存イラストの確認

- `texts/{topic-slug}-{timestamp}/images/` を確認する
- 既に `v{N}.png` が1枚以上存在する場合、このトピックのイラストは生成済み。手順2以降は行わず、既存の最新版
  （最も番号の大きい `v{N}.png`）を利用者に案内してこのワークフローを終了する（新しく生成したバリアントの
  記事ページでもこの画像がそのまま使われる）
- 1枚も存在しない場合のみ、手順2に進む

### 2. ペルソナの適用

以降のプロンプト作成は [personas/esl-writer.md](../personas/esl-writer.md) のペルソナで行う（本文の主題・トーンを
把握している執筆担当としての視点を流用する）。

### 3. config・variant・確定本文の確認

- `config.json` を読み、`topic` / `genre` / `requiresFactCheck` を把握する
- `variants/{level}-{tier}/variant.json` を読み、`level` を把握する
- 確定済みの `variants/{level}-{tier}/articles/v{N}.md`（N は確定した本文のバージョン番号）を読み、記事全体を象徴する場面・雰囲気を把握する
  （どのバリアントの本文を使っても題材はトピック共通なので、このワークフローを最初に実行するきっかけとなったバリアントの本文でよい）

### 4. イラストプロンプトの作成

英語で、記事の主題・キーとなる場面が伝わる1枚のイラスト用プロンプトを作成する。以下を必ず満たす。

- 末尾に固定のベーススタイル記述を付与し、生成物間のスタイルの一貫性を保つ
  ```
  clean flat-color digital illustration, soft palette, no text or letters in the image, no watermark
  ```
- 画像内に文字・レタリングを含めないことを明記する（AI画像生成は文字が乱れやすいため）
- `requiresFactCheck: true` の記事（実在の人物・場所を扱いうるジャンル）は、実在人物の写実的な肖像や特定できる実在の場所の
  写実的描写を避け、一般化した人物・情景として表現する
- 本文が対話文・物語などフィクションの場合はキャラクターや場面を自由に描写してよい
- 特定のレベル・分量tierに依存する表現（語彙の難度など）は避け、トピック全体を象徴する場面にする

### 5. プロンプトの保存

- 保存先: `texts/{topic-slug}-{timestamp}/images/v{N}.prompt.txt`（N は手順1で確認した番号。初回は1。`images/` ディレクトリが
  無ければ作成する）
- 内容は手順4で作成したプロンプト文字列そのもの

### 6. イラスト生成の実行

以下のコマンドを実行する。

```bash
node scripts/generate-illustration.js texts/{topic-slug}-{timestamp} {N} texts/{topic-slug}-{timestamp}/images/v{N}.prompt.txt
```

- 成功すると `texts/{topic-slug}-{timestamp}/images/v{N}.png` が生成される
- `OPENAI_API_KEY` 未設定・APIエラー（コンテンツポリシー拒否、モデル名不正など）の場合はエラーメッセージがそのまま
  出力されるので、内容に応じてプロンプトを調整するか、利用者に `.env` の設定を確認するよう案内する

### 7. 生成結果の確認

- 生成された `images/v{N}.png` を利用者に提示する（ビューアサーバ起動中であれば `/texts/{topicId}` またはいずれかの
  バリアントページ `/texts/{topicId}/{variantId}` で確認できる旨を案内する。このトピックの全バリアントで同じ画像が表示される）
- 利用者がイラストの内容・雰囲気に満足しない場合、手順4に戻ってプロンプトを調整し、手順5〜6を再実行する
  （画像ファイルは同じ `v{N}.png` を上書きする。プロンプトファイルも上書きし、最終的に採用したプロンプトのみを残す）

### 8. 次のワークフローへの案内

- この時点でイラスト生成は完了。フィードバックがあれば [workflows/brushup.md](brushup.md) を実行する
- `brushup.md` で本文が新バージョンとして更新された場合のイラスト再生成は [workflows/brushup.md](brushup.md) 手順で扱う
  （本文の主題・場面・雰囲気に影響する修正があった場合のみ、このワークフローの手順2〜7に準じて新バージョンに対して再実行する。
  再生成するとこのトピックの全バリアントで表示されるイラストが変わる点に注意）
