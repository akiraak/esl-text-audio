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
    - Why Does Bread Rise? | Expository | B1〜B2 | イーストの発酵でパンが膨らむ仕組み。料理と科学をつなぐ身近なテーマ
    - Classroom Debate: Team Fruit vs. Team Vegetable | Dialogue | A2〜B1 | トマトは果物か野菜かのミニディベート。判定役の生徒が悩むのがコメディ要素。sources は texts/tomato-fruit-or-vegetable-20260709-164126/ から再利用可（一度生成後に削除・再生成待ち）
    - The Tomato Trial: A Classroom Role-Play | Dialogue | A2〜B1 | 1893年 Nix v. Hedden 裁判を教室で再演するロールプレイ。教科書ガベルの裁判官役がオチ担当。sources は上と同じく再利用可（一度生成後に削除・再生成待ち）
  - Shopping & Dining
    - Ordering at a Restaurant | Dialogue | A1〜B1 | 注文・会計の定番表現。初級の会話練習向き
    - Bargaining at a Flea Market | Dialogue | A2〜B1 | 値段交渉の会話。数字・比較表現（too expensive / a little cheaper）の練習に向く
    - The Waiter Brought the Wrong Dish | Narrative | A2〜B1 | 注文と違う料理が来たレストランでの小さな騒動。丁寧な苦情・お願い表現の練習に向く
  - Health & Body
    - At the Doctor's Office | Dialogue | A2〜B1 | 症状を伝える・アドバイスを受ける会話。体の部位・症状の語彙と should の練習に向く
    - Why Do We Get Hiccups? | Expository | B1〜B2 | しゃっくりが起きる仕組みと止め方の言い伝え。身近な体の不思議で導入しやすい
  - Home & Neighborhood
    - The New Neighbor | Narrative | A1〜C2 | 引っ越してきた隣人との出会い。日常語彙中心でどのレベルにも展開しやすい
    - The Night the Power Went Out | Narrative | A2〜C1 | 停電の夜の家族の過ごし方。過去形の練習に向く
  - Hobbies & Gardening
    - How to Plant a Vegetable Garden | Instructional | A2〜B1 | 季節・道具の語彙が学べる
    - Growing Herbs on a Windowsill | Instructional | A2〜B1 | 部屋の中でできるハーブ栽培の手順。水やり・日当たりなど世話の語彙が学べる
- Work & School
  - A Job Interview | Dialogue | A2〜B1 | 自己紹介・経歴を話す表現の練習
  - My First Day at a Part-Time Job | Personal writing | A2〜B1 | 初日の緊張と小さな失敗談。過去形と感情表現の練習に向く
  - Should Students Wear School Uniforms? | Opinion/Essay | B2〜C2 | 賛否が分かれる定番テーマ。譲歩構文の練習に向く
- Travel & Places
  - A Morning at a Fish Market | Descriptive | A1〜B2 | 市場の音・匂い・色の描写。形容詞の練習に向く
  - Asking for Directions | Dialogue | A1〜B1 | 道を尋ねる・教える会話。場所の前置詞（next to, across from）と命令形の練習に向く
  - Diary of My First Trip Abroad | Personal writing | A2〜B2 | 一人称の感情表現・時系列の練習。架空の書き手設定なら事実チェック対象はほぼ無い（実在の地名等に言及する場合のみ対象）
- Science & Nature
  - Why Do We Sleep? | Expository | B1〜C1 | 睡眠の科学。身近なテーマで事実チェック資料も集めやすい
  - How Volcanoes Work | Expository | B1〜C1 | 地学の基礎。図解的な説明の練習に向く
  - Why Is the Sky Blue? | Expository | B1〜C1 | 光の散乱をやさしく説明する定番の科学質問。子どもの疑問から入れて導入が作りやすい
- History & Culture
  - The History of Chocolate | Expository | B1〜C1 | カカオからチョコレートへの歴史。物流・交易の語彙も扱える
  - Why Do We Shake Hands? | Expository | B1〜B2 | 握手など挨拶の習慣の由来。文化比較の語彙が学べる
  - Why Do Brides Wear White? | Expository | B1〜B2 | 白いウェディングドレスの由来（ヴィクトリア女王の結婚式が発端）。文化比較の語彙が学べる
- Society & Technology
  - Is Social Media Good for Friendship? | Opinion/Essay | B2〜C2 | 学習者自身の生活に引き付けやすい論題
  - Museum Finds Painting Was Hanging Upside Down for Decades | News-style | B1〜C1 | NYのモンドリアン作品が数十年逆さ掛けだったと判明した実話（2022年報道）。実在事件のため research 必須
  - Town Opens Its First Community Library | News-style | B1〜C1 | 見出し・リード文の構成練習。架空の町の設定なら事実チェック対象はほぼ無い
  - A Robot Waiter's First Day | Narrative | A2〜B1 | レストランのロボット店員の初出勤物語。テクノロジー語彙を物語形式でやさしく扱える
- Personal Reflections
  - A Letter to My Future Self | Personal writing | A2〜B2 | 未来表現（will / be going to）の練習に向く
  - The Best Advice I Ever Received | Personal writing | B1〜B2 | 心に残る助言のエピソード。間接話法の練習に向く

## 採用済み

| トピック | ジャンル | ディレクトリ | 採用日 |
|---|---|---|---|
| Lost While Traveling | Narrative | [texts/lost-while-traveling-20260708-222921/](../texts/lost-while-traveling-20260708-222921/) | 2026-07-08 |
| The Water Cycle | Expository | [texts/water-cycle-20260709-052935/](../texts/water-cycle-20260709-052935/) | 2026-07-09 |
| How Honey Is Made | Expository | [texts/how-honey-is-made-20260709-082323/](../texts/how-honey-is-made-20260709-082323/) | 2026-07-09 |
| Is a Tomato a Fruit or a Vegetable? | Expository | [texts/tomato-fruit-or-vegetable-20260709-164126/](../texts/tomato-fruit-or-vegetable-20260709-164126/) | 2026-07-09 |
| Classroom Talk: Is a Tomato a Fruit or a Vegetable? | Dialogue | [texts/classroom-talk-tomato-20260710-210222/](../texts/classroom-talk-tomato-20260710-210222/) | 2026-07-10 |
| The Great KitKat Heist | News-style | [texts/great-kitkat-heist-20260710-230250/](../texts/great-kitkat-heist-20260710-230250/) | 2026-07-10 |
