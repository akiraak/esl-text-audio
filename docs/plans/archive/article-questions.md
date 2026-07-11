# 記事の理解度確認問題（Questions）の作成

TODO「記事の問題を作成する（問題の形式を決める / 回答の表示方法を決める）」のプラン。

## 目的・背景

README が掲げる生成物は「reading texts, listening audio, and **comprehension questions**」だが、
現状の生成物は本文（articles）・音声（audio）・イラスト（images）のみで、問題が未実装。

記事を読んだ（聴いた）後に理解度を確認できる問題を付けることで、
「読んで終わり」ではなく能動的な学習（active recall）ができる教材にする。

前提となる既存構造:

- 記事はバリアント単位（`variants/{level}-{tier}/articles/v{N}.md`）でレベル×分量ごとに存在する
- 音声は記事バージョンと同番号で `audio/v{N}.mp3` + `v{N}.json` として管理されている（問題も同じ規約に揃える）
- 公開サイトは静的HTML（nginx 配信、バックエンドなし）。表示ロジックは `lib/site.js` に集約されており、
  ローカルビューア（`server.js`）と静的ビルド（`scripts/build-static-site.js`）の両方に反映される
- サイトの表示言語は英語（web-display-english 対応済み）、印刷対応あり（print-* 対応済み）

## 決定事項 1: 問題の形式

### 出題形式 — 4択の選択式（multiple choice）を基本とする

理由:

- 静的サイト・バックエンドなしで自動採点（正誤フィードバック）が完結する唯一の現実的な形式
  （自由記述は採点手段がなく、穴埋めは表記ゆれ判定が必要になる）
- 紙に印刷しても教材としてそのまま成立する
- ESL 教材（試験形式含む）で最も標準的で、学習者が形式の理解に迷わない

True/False や穴埋めは将来の拡張とし、初期実装ではスコープ外（`type` フィールドで拡張余地だけ確保する）。

### 問題数・内容の構成

| 対象 | 問題数 | 内訳の目安 |
|------|--------|-----------|
| 通常記事（`longForm: false`） | 5問 | 内容理解 3〜4問 + 文脈語彙 1〜2問 |
| 長文記事（`longForm: true`） | 8問 | 内容理解 5〜6問 + 文脈語彙 2問 + 推論（B2以上のみ） |

- **内容理解（comprehension）**: 本文に書かれている事実・出来事・因果を問う。本文を読めば必ず答えられる
- **文脈語彙（vocabulary）**: 本文中の語句の意味を文脈から問う（"In the article, the word X means..."）
- **推論（inference）**: 本文から論理的に導ける内容を問う。B2 以上のバリアントのみ
- 問題文・選択肢・解説はすべて英語で、**記事と同じ CEFR レベルの語彙・文法に収める**
  （問題文が本文より難しいと理解度確認にならないため。レベル別の判断基準は `esl-level-spec.md` に従う）
- 誤答選択肢（distractor）は「本文を読んでいないと選びそうな、もっともらしいもの」にする。明らかなダミーは作らない
- 各問題に 1〜2 文の英語の解説（explanation）を付け、正解の根拠が本文のどこにあるかを示す

### データ形式 — `variants/{level}-{tier}/questions/v{N}.json`

表示側で構造（選択肢・正解・解説）を扱うため、Markdown ではなく JSON にする。
音声と同じく**記事バージョンと同番号**で管理する（brushup で記事が v2 になったら問題も v2 を再生成する）。

```json
{
  "articleVersion": 1,
  "level": "B1",
  "generatedAt": "2026-07-11T00:00:00",
  "questions": [
    {
      "type": "comprehension",
      "question": "What happens to water when the sun warms it?",
      "choices": [
        "It changes into a gas.",
        "It becomes groundwater.",
        "It falls as rain.",
        "It turns into ice."
      ],
      "answerIndex": 0,
      "explanation": "The article says heat from the sun changes liquid water into a gas. This is called evaporation."
    }
  ]
}
```

- `answerIndex` は 0 始まり。正解位置は問題間で偏らないようにする
- `choices` は 4 件固定（初期実装）

### 生成ワークフロー — `workflows/questions.md`（新規）

生成フローの位置づけ: generate（本文）→ factcheck → **questions** → audio / illustrate と並列でも可
（本文が確定していれば作れる。音声・イラストとは独立）。

- 新ペルソナ `personas/question-writer.md` を作る（ESL 教材の設問設計者。レベル別語彙制約は esl-writer と共通の
  `esl-level-spec.md` を参照）
- 手順の骨子:
  1. `config.json` / `variant.json` / 対象バージョンの `articles/v{N}.md` を読む
  2. 上記構成（問題数・内訳・レベル制約）に沿って問題を作成する
  3. **正解が本文の記述だけで一意に決まるか**をセルフチェックする（本文にない外部知識を要求しない。
     `requiresFactCheck: true` の記事でも、問題の根拠は sources ではなく本文とする）
  4. `personas/learner-simulator.md` で該当レベルの学習者として解いてみて、語彙のつまずき・
     曖昧な選択肢がないか確認し、あれば修正する
  5. `questions/v{N}.json` に保存する

## 決定事項 2: 回答の表示方法

### タップして答える → 即時フィードバック方式（vanilla JS、依存なし）

記事ページ（`renderArticle` / `renderArticleContent`）の本文・音声ブロックの後に
「Questions」セクションを追加し、以下の挙動にする。

1. 各問題は問題文 + 選択肢ボタン（A〜D）を表示。正解・解説は初期状態では非表示
2. 選択肢をタップすると、その場で正誤を表示する
   - 正解: 選んだ選択肢を緑でハイライト + "Correct!"
   - 不正解: 選んだ選択肢を赤、正解の選択肢を緑でハイライト
   - どちらの場合も解説（explanation）を選択肢の下に表示する
3. 回答後は同じ問題の選択肢を無効化する（回答のやり直しはページ再読み込みで行う。状態保存はしない）
4. 全問回答したら末尾にスコア（"You got 4 / 5"）を表示する

採用理由と比較:

| 案 | 評価 |
|----|------|
| **選択→即時フィードバック（採用）** | 能動的に「選ぶ」行為が入り学習効果が高い。静的サイトで完結。JS は数十行の vanilla で済む |
| `<details>`/`<summary>` で解答を開閉 | JS 不要だが「答えを見るだけ」になり、選ぶ前に開けてしまう |
| ページ末尾に解答一覧 / 別ページ | スクロール・遷移で答えが目に入りやすく、静的サイトでは隠せない |

補足仕様:

- JS 無効環境では選択肢が押せないだけで問題文・選択肢自体は読める（解答は DOM 上 `data-` 属性に持たせるため
  ソースを見ない限り露出しない）。フォールバックは作り込まない
- **印刷時**（既存の print CSS に追加）: 選択肢はそのまま印刷し、フィードバック・スコア表示は印刷しない。
  紙のワークシートとしてそのまま使える状態にする（解答キーの印刷は初期実装ではスコープ外）
- OGP の description 抜粋（`excerpt`）に問題・解答が混ざらないようにする（本文 Markdown とは別ソースなので現状ロジックで影響なし、確認のみ）
- `questions/v{N}.json` が存在しない記事では Questions セクション自体を出さない＝既存記事の見た目は変化なし
  （音声の `audioBlock` と同じ存在チェック方式）
- 実装は `lib/site.js` に集約する（`server.js` と静的ビルドの両方に自動反映。個別変更不要）
- 一覧・詳細ページ（`renderTextDetail`）には問題は出さない。記事ページのみ

## 実施フェーズ

- [x] **Phase 1: 仕様の確定**
  - [x] `docs/specs/esl-level-spec.md` に問題のレベル別基準（問題数・種類・語彙制約）を追記
  - [x] `questions/v{N}.json` スキーマを本プランの形式で確定
- [x] **Phase 2: 生成ワークフロー**
  - [x] `personas/question-writer.md` を作成
  - [x] `workflows/questions.md` を作成
  - [x] 既存記事 1 本（例: water-cycle の B1-normal）で試作し、learner-simulator チェックまで通す
- [x] **Phase 3: 表示実装**
  - [x] `lib/site.js` に Questions セクションの描画 + 採点 JS + CSS（既存 Playful デザインに合わせる）を追加
  - [x] 印刷 CSS 対応（フィードバック・スコア非表示）
  - [x] ローカルビューア（`npm start`）と `npm run build` の両方で表示確認
- [x] **Phase 4: 既存記事への展開・公開**
  - [x] 既存 6 トピックの全バリアントに問題を生成
  - [x] push → esltext.chobi.me の自動反映を確認
  - [x] `TODO.md` の該当項目を完了にする

## 影響範囲

- `docs/specs/esl-level-spec.md` — 問題のレベル別基準を追記
- `personas/question-writer.md` — 新規
- `workflows/questions.md` — 新規（`workflows/generate.md` 等から次ステップとして参照リンクを追加）
- `lib/site.js` — Questions セクションの描画・JS・CSS
- `texts/**/variants/**/questions/v{N}.json` — 生成物
- `README.md` — 生成フローに questions を追記
- サーバ側（g3plus）は変更不要（push すれば cron の auto-update で反映される）
