---
name: 04-experiment-code
description: 実験コードを ipynb に記述し、subagentで実行する。スナップショットを保存する。
mode: collaborative
language: ja
license: MIT
metadata:
  version: "v0.0.1"
---

# 実験コーディング

## 実行環境

- **共通設定**: 00-orchestrator（共通実行環境）を参照すること
- **conda env**: `research-{プロジェクトディレクトリ名}` を使用する
- **ipynb kernel**: 同一 conda env を指定する
- **requirements.txt**: 実験固有の依存は `experiments/EXP-{番号}/requirements.txt` に記述する

## 目的

03 で設計した実験計画に基づき、ipynb にコードを記述し実行します。コードの記述と実行は subagentに委譲し、その間あなたとメイン agent は別の討論を進めることができます。各実行後は完全なスナップショットを保存します。

## トリガー

- 「実装したい」
- 「コードを書いて」
- 「実験を実行して」
- 「{EXP番号} を実装して」
- 「{EXP番号} を再実行したい」

## 討論フェーズ

### Step 1: 実装内容の確認

```
agent: 「EXP-{番号} の実装を始めます。
   03 の計画通りで進めますか？
   A: 計画通り実装する
   B: 一部変更する（変更点を教えてください）
   C: 再設計が必要（03 に戻る）」
```

### Step 2: ハイパーパラメータ等の最終確認

```
agent: 「計画で決めた値を確認します：
   - モデル: CNN + MultiheadAttention（head=8, d_model=256）
   - optimizer: Adam（lr=1e-3）
   - batch size: 32
   - epochs: 100
   - seed: 42
   変更しますか？」
```

### Step 3: 指示書の作成と subagent 実行

合意後、メイン agent が **実行指示書** をファイルに書き、subagent に委譲します。

```
指示書のパス:
  experiments/EXP-{番号}/run-instruction.md

指示書の内容:
  # 実行指示: EXP-{番号}

  ## 対象ファイル
  experiments/EXP-{番号}/experiment.ipynb

  ## タスク
  1. NB-01 〜 NB-07 に従いコードを記述する
  2. 全てのセルを実行する
  3. 結果を保存する（図・ログ・メトリクス）

  ## 補足
  - seed 固定:
  - 実行完了後、実行結果を保持したまま notebook を保存する
  - 補助スクリプト（.py）は必要な場合のみ作成する

subagent 実行中は、あなたと別の討論を進めることができます。
```

Direction Check:

- 指示書の内容は 03 の計画と一致しているか
- subagent に必要な情報は全て記載されているか
- 実行環境（GPU・データパス等）の前提は正しいか

### Step 4: スナップショットの管理

各実行後、subagent は以下のスナップショットを保存します：

```
experiments/EXP-{番号}/
├── experiment.ipynb              ← 最新（実行結果含む）
├── snapshots/
│   └── {YYYY-MM-DD_HHmm}/
│       ├── experiment.ipynb      ← この時点の完全コピー
│       ├── logs/                 ← 学習ログ
│       └── results/              ← 図・メトリクス
├── logs/
│   └── LG-{番号}-train-{日時}.log
└── results/
    ├── RL-{番号}-metrics.csv
    └── FG-{番号}-{説明}.png
```

再実行時は `experiment.ipynb` をクリアして実行し、新しいスナップショットが追加されます。過去のスナップショットは上書きされません。

## Pre-Inspect（実行前検証）

- 03 の DC および README.md と齟齬がないか
- 実行指示書に必要な情報が全て記載されているか
- 実験ディレクトリと ipynb は存在するか
- 既存の実験結果を誤って上書きしないか
- subagent の実行環境は整っているか
- RL / FG / TB / LG counter の現在値を確認する（state.yaml）

## Post-Inspect（実行後検証）

- 全てのセルがエラーなく実行されたか
- RL-{番号}-metrics.csv が保存されたか（カラムは討論で決めた通りか）
- RL-{番号}-history.csv が保存されたか（学習曲線データ）
- FG-{番号}-{説明}.png が保存されたか（図）
- スナップショットは正しく作成されたか
- 実験結果に不自然な値はないか（精度が極端に低い・loss が nan 等）
- subagent の実行ログに異常はないか
- RL / FG / TB / LG counter が実際のファイル数と一致するか確認する
- 不整合があれば実ファイル数を優先して state.yaml を修正する

## 出力先

```
experiments/EXP-{番号}/
├── experiment.ipynb          ← 正本
├── run-instruction.md        ← subagent 実行指示書
├── snapshots/                ← 実行履歴
├── logs/
│   └── LG-{番号}-train-{日時}.log
├── results/
│   ├── RL-{番号}-metrics.csv ← 実験結果（カラムは討論で決定）
│   ├── RL-{番号}-history.csv ← 学習曲線（epoch ごとの全指標）
│   ├── FG-{番号}-{説明}.png  ← 図（論文引用用）
│   └── RL-{番号}-log.txt     ← 生ログ
└── {補助}.py                 ← 必要な場合のみ
```

反映先:

```
research/state.yaml   ← RL / FG / TB / LG counter 更新
```

## 次のステップ

実験結果の確認後、05-results-analysis に進むかどうかを相談する。

## HARD-GATE

- 03 の計画（DC / README.md）確認なしに実装を開始してはならない
- 実行指示書なしに subagent に実行を委譲してはならない
- subagent 実行中に同じ実験ディレクトリを操作してはならない
- Post-Inspect 完了前に結果を「確定」として扱ってはならない
- スナップショットを上書きしてはならない（常に新しいスナップショットを作成する）
- .py を正本にしてはならない（ipynb が正本）
