---
name: 05-results-analysis
description: 実験結果を比較・分析・可視化する。04 のデータを読み込み、新たな図や表を生成する。
mode: collaborative
language: ja
---

# 結果分析・可視化

## 実行環境

共通の実行環境設定は **00-orchestrator（共通実行環境）** を参照すること。

## 目的

04 が保存した実験結果を読み込み、比較・分析・可視化を行います。複数実験を横断して比較する図や表を新規生成します。この stage は「事実の可視化と解釈」までを行い、次の action の判断は Review フェーズに委ねます。

## トリガー

- 「結果を分析したい」
- 「グラフを出して」
- 「数値を確認したい」
- 「{EXP番号} と {EXP番号} を比較して」
- 「前回の結果と比べて」

## 入力（04 からのデータ）

04 が保存したデータを読み込みます。FG（図）は参照のみで、コピーしません。

| データ | パス | 用途 |
|:------|:-----|:-----|
| RL-{番号}-metrics.csv | experiments/EXP-{番号}/results/ | 読み込んで比較・集計 |
| RL-{番号}-history.csv | experiments/EXP-{番号}/results/ | 読み込んで学習曲線を再描画 |
| FG-{番号}-*.png | experiments/EXP-{番号}/results/ | 参照のみ（コピーしない） |

## 出力

05 が新規生成したデータは `research/analysis/` に保存します。

```
research/analysis/
├── FG-{番号}-{説明}.png      ← 新規生成した図
├── FG-{番号}-{説明}.pdf      ← 論文用（高解像度）
├── TB-{番号}-{説明}.csv      ← 比較表
└── RL-{番号}-analysis.md     ← 分析サマリー
```

反映先:

```
research/state.yaml   ← FG / TB / RL counter 更新
```

## 討論フェーズ

### Step 1: 分析対象の確認

```
agent: 「どの実験を比較しますか？
   現在実行済み:
   - EXP-001: baseline CNN（acc: 0.923）
   - EXP-002: attention 追加（acc: 0.938）
   - EXP-003: foot pressure 融合（acc: 0.915）
   
   A: EXP-001 と EXP-002 の比較（attention の効果）
   B: EXP-001 と EXP-003 の比較（foot pressure の効果）
   C: 3 つ全ての比較
   D: 特定の指標だけ見たい」
```

### Step 2: 可視化の選択

```
agent: 「どの可視化を行いますか？
   A: 精度比較 bar chart
   B: クラス別精度比較
   C: 学習曲線（loss / accuracy）の比較
   D: 混合行列
   E: ablation 表
   F: 統計検定」
```

Direction Check:

- 可視化の種類は分析目的に合っているか
- 比較に使う指標は適切か
- サンプル数が少なすぎて統計的に意味がない可能性はないか

### Step 3: 分析サマリーの記述

結果の解釈をあなたと討論し、分析サマリーとして記録します。

```markdown
# RL-{番号}: 分析サマリー

## 使用データ
- EXP-001: RL-01（metrics.csv）, RL-02（history.csv）
- EXP-002: RL-03（metrics.csv）

## 新規生成
- FG-03-comparison-acc.png
- FG-04-class-wise-accuracy.png
- TB-01-comparison.csv

## 考察
{あなたと討論した解釈}
```

## Pre-Inspect（実行前検証）

- 比較対象の全実験の metrics.csv が存在するか
- 比較対象の全実験の history.csv が存在するか
- 比較する指標の単位・範囲が揃っているか
- 既に 05 で同じ分析を行っていないか（重複防止）
- RL / FG / TB counter の現在値を確認する（state.yaml）

## Post-Inspect（実行後検証）

- 生成した図は適切に表示されるか（軸ラベル・凡例・タイトル）
- 分析サマリーは記録されたか
- 04 の FG を誤ってコピー・上書きしていないか
- あなたが分析結果を確認したか
- FG / TB / RL counter が実際のファイル数と一致するか確認する
- 不整合があれば実ファイル数を優先して state.yaml を修正する

## 次のステップ

分析結果を基に、Review（次サイクル or 論文）に進むかを相談する。

## HARD-GATE

- 比較対象の metrics.csv を確認せずに分析を開始してはならない
- 04 が生成した FG を experiments/ 以外にコピーしてはならない（参照のみ）
- 「次に何をするか」の判断を 05 内で確定してはならない（Review に委ねる）
- 不確かな解釈を確かと表現してはならない
- 統計的に意味のない差を「有意な改善」と表現してはならない
