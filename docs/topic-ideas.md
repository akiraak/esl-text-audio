# トピックのアイデア

新規トピックのテキストを作るときに参照する、トピック案のストック。
[workflows/config.md](../workflows/config.md) の手順から次のように使う。

- **参照**: 利用者がトピックを決めていない・提案を求めている場合、「アイデア一覧」ツリーから候補を提示する（カテゴリを聞いて絞り込んでもよい）。トピック指定がある場合も「採用済み」と照合して重複作成を防ぐ
- **採用**: トピックを採用して `config.json` を保存したら、該当の葉をツリーから削除し「採用済み」に追記する（ツリーに無いトピックを採用した場合は「採用済み」への追記のみ行う）。葉が無くなったカテゴリは残してよい
- **補充**: 新規トピックを作成するたびに、新しいアイデアを2〜3件ツリーの適切なカテゴリに追加し、在庫を切らさない。合うカテゴリが無ければ新設してよい（ネストの深さは自由）

トピック作成とは関係なくアイデアだけを追加したいときは、単体ワークフロー [workflows/add-ideas.md](../workflows/add-ideas.md) を使う。

ジャンル名・適したレベル帯は [docs/specs/esl-level-spec.md](specs/esl-level-spec.md) の「ESL読解に適した文章形式」表に従う。

このページは閲覧サイト（Webビューア）の `/topic-ideas` にも表示される。`lib/site.js` の `renderTopicIdeas()` が
見出し名と以下の書式に依存してパースしているため、構造を変えるときはそちらも確認すること。

- 「アイデア一覧」: ネストした箇条書きのツリー
  - カテゴリ: `- {カテゴリ名（英語）}`（パイプ `|` を含めない。インデントは2スペース単位）
  - トピック案（葉）: `- {トピック（英語）} | {ジャンル} | {適したレベル帯} | {メモ}`
- 「採用済み」: トピック・ジャンル・ディレクトリ・採用日の4列のMarkdownテーブル

## アイデア一覧

- Everyday Life
  - Food & Cooking
    - How to Make Onigiri | Instructional | A2〜B1 | 手順接続語（first, then, finally）の練習。日本文化の紹介にもなる
  - Shopping & Dining
    - Ordering at a Restaurant | Dialogue | A1〜B1 | 注文・会計の定番表現。初級の会話練習向き
  - Home & Neighborhood
    - The New Neighbor | Narrative | A1〜C2 | 引っ越してきた隣人との出会い。日常語彙中心でどのレベルにも展開しやすい
    - The Night the Power Went Out | Narrative | A2〜C1 | 停電の夜の家族の過ごし方。過去形の練習に向く
  - Hobbies & Gardening
    - How to Plant a Vegetable Garden | Instructional | A2〜B1 | 季節・道具の語彙が学べる
- Work & School
  - A Job Interview | Dialogue | A2〜B1 | 自己紹介・経歴を話す表現の練習
  - Should Students Wear School Uniforms? | Opinion/Essay | B2〜C2 | 賛否が分かれる定番テーマ。譲歩構文の練習に向く
- Travel & Places
  - A Morning at a Fish Market | Descriptive | A1〜B2 | 市場の音・匂い・色の描写。形容詞の練習に向く
  - Diary of My First Trip Abroad | Personal writing | A2〜B2 | 一人称の感情表現・時系列の練習。架空の書き手ならフィクション扱いにできる
- Science & Nature
  - Is a Tomato a Fruit or a Vegetable? | Expository | B1〜B2 | 植物学的定義（花が咲いて実がなる＝fruit）と料理上の分類（vegetable）の違いを、トマト・カボチャ・唐辛子を例に説明。定義・分類の語彙と対比表現（while, on the other hand）の練習に向く
  - Why Do We Sleep? | Expository | B1〜C1 | 睡眠の科学。身近なテーマで事実チェック資料も集めやすい
  - How Volcanoes Work | Expository | B1〜C1 | 地学の基礎。図解的な説明の練習に向く
- History & Culture
  - The History of Chocolate | Expository | B1〜C1 | カカオからチョコレートへの歴史。物流・交易の語彙も扱える
- Society & Technology
  - Is Social Media Good for Friendship? | Opinion/Essay | B2〜C2 | 学習者自身の生活に引き付けやすい論題
  - Town Opens Its First Community Library | News-style | B1〜C1 | 見出し・リード文の構成練習。架空の町の設定ならフィクション扱いにできる
- Personal Reflections
  - A Letter to My Future Self | Personal writing | A2〜B2 | 未来表現（will / be going to）の練習に向く

## 採用済み

| トピック | ジャンル | ディレクトリ | 採用日 |
|---|---|---|---|
| Lost While Traveling | Narrative | [texts/lost-while-traveling-20260708-222921/](../texts/lost-while-traveling-20260708-222921/) | 2026-07-08 |
| The Water Cycle | Expository | [texts/water-cycle-20260709-052935/](../texts/water-cycle-20260709-052935/) | 2026-07-09 |
| How Honey Is Made | Expository | [texts/how-honey-is-made-20260709-082323/](../texts/how-honey-is-made-20260709-082323/) | 2026-07-09 |
