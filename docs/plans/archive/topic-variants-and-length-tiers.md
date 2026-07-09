# 分量3段階化 と トピック単位の複数バリアント（レベル×分量）管理・選択の仕組み

[docs/plans/long-form-article-structure.md](long-form-article-structure.md) を置き換える。長文モード（見出し・リード文・目次）を含む
「分量」の扱いを整理し、さらに1トピックに対して複数のレベル・分量の文章を持たせ、読者がその中から選べるようにする。

## 目的・背景

- 分量（語数）を自由記述ではなく **通常 / 長い / すごく長い の3段階**で選べるようにしたい
- 1つのトピックに対して、レベル別・分量別の複数の文章を持たせ、読者が選択できる仕組みにしたい
  （例: 同じ「水の循環」というトピックで、A1の短い版・B1の通常版・C1の長い版、を並行して持てる）
- ユーザーヒアリングの結果、バリアント間の内容の一貫性は**「一番長い分量のアウトラインを最初に作り、そこから間引いて短い分量のアウトラインを派生させる」**方式で担保する
  （＝グレーデッドリーダーに近い体験。独立生成方式ではなく、アウトラインは分量ごとに共有・派生させる）

## 全体設計

### 概念の整理

| 概念 | 意味 | 決まる場所 |
|---|---|---|
| トピック（Topic） | 主題そのもの。ジャンル・事実チェック要否・参考資料もこの単位で共通 | `workflows/config.md` |
| 分量（Length tier） | `normal`（通常）/ `long`（長い）/ `very-long`（すごく長い）の3段階。語数のレンジを決める。**レベルとは独立** | `workflows/outline.md`（バリアント設定時） |
| レベル（Level） | CEFR A1〜C2。語彙・文法の難度を決める。**分量とは独立** | 同上 |
| アウトライン（Outline） | 分量（tier）ごとに1つ。レベルには依存しない（内容は日本語で記述するため） | `outlines/{tier}/v{N}.md` |
| バリアント（Variant） | 「レベル×分量」の組み合わせ1つ＝実際に生成される英文本文1本 | `variants/{level}-{tier}/` |

- **レベルと分量は完全に独立した2軸**。「A1の易しい語彙で長い物語」も「C1の難しい語彙で短い文章」も作れる（[esl-level-spec.md](../specs/esl-level-spec.md) 既存の補足を踏襲）
- アウトラインは **分量ごとに1つ**（レベルには依存しない）。同じ分量（tier）を使う複数のレベルのバリアントは、同じアウトラインを土台に、レベルに応じた語彙・文法で書き分けるだけ
- ジャンル・事実チェック要否・参考資料（`sources/`）はトピック単位で共通（レベル・分量が変わってもトピックの本質的な内容は変わらないため）

### アウトラインのカスケード派生ルール

ユーザー指定: 「一番長い文章のアウトラインをまず作成し、そこから不自然にならないように各分量のアウトラインを生成する」。

- **原則**: そのトピックで今までに作られた最長のアウトラインを常に正とし、それより短い分量のアウトラインは常にその最長アウトラインから段階的に間引いて作る
- 具体的な手順（トピック内で複数分量を持たせる場合）:
  1. まだどの分量のアウトラインも無いトピックで最初に作る分量が `X` の場合、`X` のアウトラインを新規作成する（内容は今までの `outline.md` と同じ手順）。これがそのトピックの「現在の最長アウトライン」になる
  2. 既存の最長アウトラインより **短い** 分量を追加するとき: 直近上位の分量のアウトラインを土台に、間引き（セクションの統合・簡略化・詳細の削除）で新しい分量のアウトラインを作る。一気に最長から最短へ飛ばさず、`very-long → long → normal` のように1段階ずつ間引く方が不自然になりにくいため、中間の分量のアウトラインが無い場合は先にそれを作ってから最短分量を作る
  3. 既存の最長アウトラインより **長い** 分量を追加するとき: 既存の最長アウトラインを土台に、エピソード・観点・詳細を加えて拡張する。拡張後のアウトラインが新しい「現在の最長アウトライン」になる
  4. 各分量のアウトラインはバージョン管理する（`outlines/{tier}/v{N}.md`）。brushup等でどれかの分量のアウトラインを構成レベルで修正した場合、他の分量のアウトラインは自動追従させない（手動で必要な分量だけ作り直す。詳細は `workflows/brushup.md` 参照）
- 1トピックで1分量しか使わない（今までどおりの単一バリアント運用）場合は、このカスケードは発生しない。今までの `outline.md` と同じ、その分量のアウトラインを直接作るだけでよい

### 分量3段階の語数テーブル

`normal` は既存の「総語数目安」をそのまま使う。`long` は概ね2倍、`very-long` は概ね4〜5倍を目安にする（丸めた数値）。

| レベル | 通常（normal） | 長い（long） | すごく長い（very-long） |
|---|---|---|---|
| A1 | 100〜150語 | 250〜350語 | 600語以上 |
| A2 | 150〜300語 | 350〜600語 | 700語以上 |
| B1 | 300〜600語 | 700〜1200語 | 1500語以上 |
| B2 | 600〜1000語 | 1300〜2000語 | 2500語以上 |
| C1 | 1000〜1500語 | 2000〜3000語 | 4000語以上 |
| C2 | 1500語以上 | 3000語以上 | 6000語以上 |

- 平均文長・語彙範囲・使ってよい文法項目は従来どおりレベル行のみで決まる（分量tierを変えても変化しない）
- **長文モード（`longForm`、見出し＋リード文＋目次の構成）の自動判定**: 上表で解決した語数レンジの下限が **600語以上ならその組み合わせは常に `longForm: true`**、未満なら `false`。ユーザーに個別に確認する設問は廃止し、レベル×分量の組み合わせから自動的に決める
  （[long-form-article-structure.md](long-form-article-structure.md) で決めた「600語以上で長文構成」というしきい値はそのまま踏襲。表の数値はこのしきい値をまたぐ場合に `true` になるよう調整済み）

### ディレクトリ構成の変更

```
texts/{topic-slug}-{timestamp}/
  config.json                  # トピック単位: topic, topicSlug, createdAt, genre, requiresFactCheck, factCheckExemptionReason
                                #（level / wordCountTarget / longForm は無くなる。variant.json に移る）
  sources/                     # トピック単位で共通（変更なし）
  outlines/
    normal/v1.md, v2.md, ...
    long/v1.md, ...
    very-long/v1.md, ...
  variants/
    {level}-{tier}/             # 例: B1-normal, C1-long, A1-very-long
      variant.json              # level, tier, wordCountTarget, longForm, outlineTier, outlineVersion, createdAt
      articles/v1.md, v2.md, ...
      images/v1.png, v1.prompt.txt, ...
```

- `variant.json` の例:
  ```json
  {
    "level": "B1",
    "tier": "normal",
    "wordCountTarget": "300〜600語",
    "longForm": false,
    "outlineTier": "normal",
    "outlineVersion": 1,
    "createdAt": "YYYY-MM-DDTHH:MM:SS"
  }
  ```
- `outlineVersion` は、このバリアントの本文がどの `outlines/{tier}/v{N}.md` を土台にしたかを記録する（アウトラインが後から新バージョンになっても、既存バリアントがどの版を参照していたか分かるようにするため）
- 既存の2サンプル（`water-cycle-*`, `lost-while-traveling-*`）は新構成に移行する（Phase Cで実施。`level`/`wordCountTarget` を `variants/{level}-normal/variant.json` に、`articles/`・`images/` を `variants/{level}-normal/` 配下に、既存の `outlines/` を `outlines/normal/` に移す。`longForm: false` を設定）

### ワークフローの役割分担の変更

| ファイル | 変更内容 |
|---|---|
| `workflows/config.md` | **トピック単位のみ**を扱う（topic・genre・事実チェック要否）。冒頭に「既存トピックに新しいバリアントを追加するか」判定を追加。level・語数目安・longForm の設問は削除（`outline.md` に移動） |
| `workflows/outline.md` | 冒頭で「レベル確定」「分量（3段階）確定」のステップを追加（config.mdから移動）。レベル×分量から `wordCountTarget`・`longForm` を上記テーブルで自動算出。レベル×ジャンルの整合チェックはここで初めて実施（今までどおり）。アウトライン作成はカスケード派生ルールに従う。保存先が `outlines/{tier}/v{N}.md` に変更。最後に `variants/{level}-{tier}/variant.json` を保存する |
| `workflows/generate.md` | `config.json` ではなく `variants/{level}-{tier}/variant.json` から level・tier・wordCountTarget・longForm を読む。参照する outline のパスが `outlines/{outlineTier}/v{outlineVersion}.md` になる。保存先が `variants/{level}-{tier}/articles/v{N}.md` に変更 |
| `workflows/factcheck.md` | 本文パスが `variants/{level}-{tier}/articles/v{N}.md` に変更。`sources/` はトピック直下のまま（変更なし） |
| `workflows/illustrate.md` | 本文パス・保存先パスが `variants/{level}-{tier}/images/` に変更。ロジックは変更なし |
| `workflows/brushup.md` | パス変更に加え、**構成レベルの変更（outline修正）が他の分量・レベルのバリアントに影響しうる**旨の注意を追記する（自動追従はしない。影響しそうな場合は利用者に他バリアントの再生成が必要か確認する） |
| `docs/specs/esl-level-spec.md` | 「総語数目安」列を3段階（通常/長い/すごく長い）のテーブルに拡張。長文モード節のトリガーを「レベル×分量の組み合わせで自動判定」に更新（B2以上・600語しきい値の記述を整理） |
| `personas/esl-writer.md` | 変更なし（Phase 1で作った longForm 出力フォーマットはそのまま使う） |

### 表示側（`lib/site.js` ほか）の変更

- **一覧ページ（`renderIndex`）**: 1トピック＝1行（今までどおり）。ただしバリアント数（例: 「3バリアント」）を表示する
- **トピック詳細ページ（`renderTextDetail` を改修）**: トピックのメタ情報（ジャンル・事実チェック要否）・参考資料一覧は今までどおり表示。加えて、存在する分量アウトライン（`outlines/normal|long|very-long` それぞれのバージョン一覧）と、**バリアント一覧**（レベル×分量のマトリクスまたはリスト。存在するものはリンク、存在しないものは「未生成」表示）を追加する
- **バリアント詳細ページ（新設）**: 今までの `renderTextDetail` の「本文バージョン一覧・本文プレビュー」に相当する内容をバリアント単位に切り出す。URL例: `/texts/:topicId/:variantId`（`variantId` = `{level}-{tier}`）
- **記事ページ（`renderArticle`）**: URLに `variantId` を追加（`/texts/:topicId/:variantId/article/:version`）。中身のロジック（marked変換・長文モードの目次自動生成など）は変更なし
- **アウトラインページ（`renderOutline`）**: URLを `/texts/:topicId/outline/:tier/:version` に変更（バリアントではなく分量tier単位）
- パス検証（`isValidId` 相当）を `topicId` / `variantId` / `tier` それぞれについて行う（ディレクトリトラバーサル対策は既存の正規表現チェック方式を踏襲）
- `server.js`・`scripts/build-static-site.js` は `lib/site.js` の関数を呼ぶだけなので、ルーティング定義の追加以外は大きな変更不要

## スコープ外（今回はやらない）

- バリアント間でイラストを共有する最適化（レベル違いでも同じ分量なら同じ場面のはずだが、今回は素直にバリアントごとに生成する。無駄なAPI呼び出しに気づいたら別タスクで検討）
- 構成変更（brushup）の他バリアントへの自動反映（手動判断に委ねる）
- 3段階以外の分量（カスタム語数指定）の復活（必要になれば別タスクで検討）

## テスト方針

### Phase A: 分量3段階の語数テーブル確定

- [ ] `docs/specs/esl-level-spec.md` の「総語数目安」を3段階テーブルに拡張
- [ ] 長文モード節を「レベル×分量の自動判定（下限600語以上で `true`）」に更新

### Phase B: ディレクトリ構造・ワークフロー再設計

- [ ] `workflows/config.md`: トピック単位のみに整理、既存トピックへのバリアント追加判定を追加
- [ ] `workflows/outline.md`: レベル・分量確定ステップの追加、カスケード派生ロジックの追加、`outlines/{tier}/v{N}.md` への保存、`variant.json` 保存
- [ ] `workflows/generate.md` / `factcheck.md` / `illustrate.md` / `brushup.md`: `variant.json` 参照・新パスへの更新
- [ ] `workflows/brushup.md`: 他バリアントへの影響についての注意書き追加

### Phase C: 表示側の対応・既存サンプルの移行

- [x] `lib/site.js` にトピック→バリアントの階層構造（一覧・詳細・記事・アウトラインページ）を実装
- [x] `server.js` のルーティングを新URL構成に更新
- [x] `scripts/build-static-site.js` を新URL構成に合わせて更新
- [x] 既存2サンプル（`water-cycle-*`, `lost-while-traveling-*`）を新ディレクトリ構成に移行
- [x] CSSでバリアント一覧・アウトライン tier一覧が既存デザインと馴染むことを確認

### Phase D: 実地検証

- [ ] 1つのトピックで `very-long` のアウトラインを先に作り、そこから `long` → `normal` を間引いて派生させ、内容の一貫性・自然さを確認
- [ ] 同じ分量（例: `normal`）で複数レベル（例: A1とC1）のバリアントを生成し、同じアウトラインから語彙・文法だけが違う本文になっていることを確認
- [ ] 低レベル×長い分量（例: A1 × very-long）の組み合わせでも生成し、長文モードの構成・自然さを確認
- [ ] ローカルサーバー（`npm start`）・静的ビルド（`npm run build`）の両方で、トピック一覧→バリアント一覧→記事の階層ナビゲーションが機能することを確認
- [ ] 既存2サンプルが移行後も正しく表示されることを確認
