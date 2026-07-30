---
name: 02-paper-reading
description: 論文を読み、研究との関連性を分析する。Part1 で要約、Part2 で深掘りする。
mode: collaborative
language: ja
---

# 論文精読

## 実行環境

共通の実行環境設定は **00-orchestrator（共通実行環境）** を参照すること。

## 目的

01 で取得した論文を読み、研究との関連性を分析します。Part 1 では subagent でクイックサマリーを作成し、Part 2 ではあなたと議論しながら深掘りします。

## トリガー

- 「この論文を読んで」
- 「{LN番号} を精読して」
- 「論文の内容をまとめて」

## 2-Part 構成

| Part | 担当 | 出力 | 時間目安 |
|:----|:-----|:-----|:--------|
| Part 1 | subagent（要約） | 200字サマリー | 数分 |
| Part 2 | あなた + メイン agent（議論・記録） | LN ノート | 状況による |

---

## Part 1: クイックサマリー

subagent に固定プロンプトを投げて論文を要約します。まず論文をざっくり把握し、深読むかどうかを判断するためのものです。

### フロー

```
あなた：「LN-001 を読んで」

agent: 「Part 1（クイックサマリー）を開始します。
   subagent に要約を依頼します。完了したら結果を確認してください。」

メイン agent が以下の指示書を生成し、subagent に投げる：

  research/literature/summaries/subagent-instruction-LN-{番号}.md

subagent の出力:
  research/literature/summaries/LN-{番号}-summary.md
```

### 要約プロンプト（固定）

```markdown
# 論文要約依頼

## 対象
{PDF のパス}

## タスク
1. PDF を読む
2. 以下を日本語 200 字以内で要約する：
   - 研究目的
   - 手法
   - 使ったデータセット
   - 主な結果（数値含む）
   - 自分の研究（IMU + 足圧の HAR）との関係性
```

### 確認

```
agent: 「サマリーができました。
   研究目的: ...
   手法: ...
   結果: ...
   
   この論文を深読みしますか？
   A: Part 2 に進む（深掘りする）
   B: 次に進む（サマリーだけで十分）」
```

---

## Part 2: 研究関連性精読

### 3 モード

| モード | 条件 | 動作 |
|:------|:-----|:-----|
| 標準精読 | デフォルト | この SKILL.md のテンプレートで分析 |
| 外部精読 | reader-skills/SKILL.md あり | 外部 SKILL をロードして実行 |
| 手動精読 | あなたが読む | agent は翻訳支援・用語説明・議論相手 |

### 討論フロー

#### Step 1: 読む範囲の確認

```
agent: 「この論文のどの部分を深掘りしますか？
   A: 全体
   B: 特定のセクション（手法・結果など）
   C: サマリーである程度把握できたので疑問点だけ」
```

Direction Check:

- この論文は既に読んでいないか（screening.md で確認）
- 優先順位は適切か

#### Step 2: 内容の理解・議論

PDF を読みながら、以下の観点であなたと議論します。

```
あなた：「この attention の実装、私たちのモデルに使える？」

agent: 「著者らは concatenation の代わりに weighted sum を使っています。
   あなたのモデルは concatenation なので、置き換えは可能です。
   ただし計算コストが O(n) → O(n^2) になります。
   試してみますか？」
```

複雑な表現や知識は、わかりやすい日本語で説明し、議論した内容は LN ノートに記録します。

#### Step 3: LN ノート作成（テンプレート）

```markdown
# LN-{番号}: {タイトル}

## 基本情報
- 著者:
- 年:
- DB:
- DOI / URL:
- 分野タグ（DB由来）:
- 関連タグ（研究）:

## クイックサマリー（Part 1）
{research/literature/summaries/LN-{番号}-summary.md から転載}

## 研究との関連性（Part 2）

### ① 接点
{自分の研究とどう関係するか}

### ② 使えるかもしれないアイデア
{参考になる手法・分析・知見}

### ③ 競合・差別化
{自分たちの独自性・優位性}

### ④ 疑問点・議論
{批判的に見るべき点・議論した内容}

### ⑤ 次に読むべき論文
{参照文献から次の調査候補}

### ⑥ 再現可能性
{データ公開・コード公開・あなたの環境で再現可能か}

## 用語（必要な場合）
- {日本語}（{English}）: {研究固有の文脈での説明}
  - 出典: {論文内での使われ方}
  - TE-{番号}（central terminology.md に登録）

## 数式（必要な場合）
- EQ-{番号}: {LaTeX}
  - 記号の意味: {説明}
  - 出典: {論文内の式番号}
```

### Step 4: 用語の登録

新しい用語が出てきたら `research/terminology.md` に TE 番号を付けて登録します。

```
research/terminology.md

| ID | 日本語 | English | 文脈 | 登場論文 |
|:--:|:------|:--------|:-----|:---------|
| TE-001 | 特徴量融合 | Feature-level Fusion | センサ融合 | LN-001, LN-003 |
```

### Step 5: 数式の記録

論文内で重要な数式があれば、LN ノートに EQ 番号を付けて記録します。

```
## 数式

- EQ-001: $\hat{y} = f(x; \theta)$
  - $\hat{y}$: 予測ラベル, $x$: 入力特徴量, $\theta$: 学習可能パラメータ
  - 出典: LN-001 式(3)
```

### Step 6: screening.md の更新

精読完了後、管理台帳のステータスを更新します。

```
| # | ステータス | 採用 | タイトル | LN | 分野タグ（DB由来） | 関連タグ（研究） | リンク先 | 概要 |
|:-:|:---------:|:----:|---------|:--:|:------------------|:---------------|:---------|:-----|
| 1 | 精読済 | ✅ | Transformer HAR | LN-001 | HAR, IMU, Transformer | 圧力センサ, 融合 | EXP-001 | CNN+attention |
```

resource_counters の `LN`, `TE`, `EQ` を更新します。

---

## Pre-Inspect（実行前検証）

- 読む論文は screening.md に登録済みか
- PDF ファイルは存在するか（01 の完了条件）
- 既に精読済みの論文を重複して読もうとしていないか
- LN 番号は既存と重複していないか（state.yaml の LN counter を確認）
- TE / EQ counter の現在値を確認する

## Post-Inspect（実行後検証）

- LN ノートの全項目が埋まっているか
- 新しい用語は terminology.md に登録されたか（TE counter 更新確認）
- 新しい数式は LN ノートに記録されたか（EQ counter 更新確認）
- screening.md のステータス・LN 番号は正しく更新されたか
- resource_counters の実ファイル数と state.yaml の値が一致するか
- あなたがノート内容を確認したか

## 出力先

```
research/literature/
├── screening.md                     ← 状態更新
├── prompts/
│   └── subagent-instruction-LN-{番号}.md ← subagent 用指示書（Part 1）
├── summaries/
│   └── LN-{番号}-summary.md        ← Part 1 サマリー
├── notes/
│   └── LN-{番号}-title.md          ← LN ノート
├── reader-skills/                    ← 【スロット】外部精読 SKILL（任意）
│   └── SKILL.md
└── papers/
    └── LN-{番号}-title.pdf          ← 01 で取得済み
```

反映先:

```
research/terminology.md              ← 用語登録（随時追記）
research/state.yaml                  ← TE / EQ / LN counter 更新
```

## 次のステップ

次の論文を読むか、01 に戻って追加検索するか、03 に進むかを相談する。

## HARD-GATE

- PDF を読まずにノートを作成してはならない
- 不確かな内容を確かと表現してはならない（議論で確認する）
- screening.md の更新なしに次の論文に移ってはならない
- Part 1（サマリー）を飛ばして Part 2 に進む場合はあなたの了承を得ること
- 新しい用語を TE 番号なしで terminology.md に登録してはならない
- resource_counters の確認（Pre-Inspect）なしに新しい番号を発行してはならない
- resource_counters の更新（Post-Inspect）なしに stage を完了してはならない
- 外部精読 SKILL が存在する場合、標準精読を強制してはならない（選択肢を提示する）
