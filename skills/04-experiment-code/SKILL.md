---
name: 04-experiment-code
description: 実験計画に基づき実装・実行する。訓練型（ipynb 正本）/ 解析ツール型（.py 正本 + デモ notebook）/ 混合型。実行記録を保存する。
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
- **ipynb kernel**: 同一 conda env を指定する（訓練型・デモ notebook）
- **CLI 実行（解析ツール型）**: `conda run -n research-{プロジェクトディレクトリ名} python {ツールパス}` の単命令で再実行できること
- **requirements.txt**: 実験固有の依存は `experiments/EXP-{番号}/requirements.txt` に記述する

## 目的

03 で設計した実験計画に基づき、実装・実行します。実装方式は実験タイプにより選択します。

| タイプ | 正本 | 用途 |
|---|---|---|
| **訓練型** | `experiment.ipynb` | モデル訓練・評価（全セル実行 → スナップショット） |
| **解析ツール型** | CLI ツール（`.py`） | データ処理・校正・比較評価・統計（冪等・単命令で再実行。安定後に `experiment.ipynb` をインタラクティブデモとして作成） |
| **混合型** | `experiment.ipynb` | notebook から `research/tools/` のモジュールを呼び出す |

コードの記述と実行は subagent、または指定された実行環境（別マシン等）に委譲できます。その間あなたとメイン agent は別の討論を進めることができます。各実行後は実行記録（スナップショット）を保存します。

## トリガー

- 「実装したい」
- 「コードを書いて」
- 「実験を実行して」
- 「{EXP番号} を実装して」
- 「{EXP番号} を再実行したい」

## 討論フェーズ

### Step 0: 実装方式の選択

```
agent: 「EXP-{番号} の実装方式を確認します（03 の計画タイプに基づく推奨: {推奨}）：
   A: 訓練型（ipynb 正本）
   B: 解析ツール型（.py 正本 + 安定後に experiment.ipynb をデモとして作成）
   C: 混合型（ipynb 正本 + tools モジュール）
   どれにしますか？」
```

解析ツール型の成立条件（HARD-GATE でも再掲）:

1. **冪等** — 再実行で同じ結果を再生成できる
2. **単命令** — 例: `conda run -n research-{プロジェクトディレクトリ名} python research/tools/{名称}/run.py {引数}` で再実行できる
3. **パラメータ凍結** — パラメータは DC に記録されている（コードに直書きしない）
4. **diff 可能な出力** — CSV / JSON / 画像など

ツールの置き場所: 再利用可能な場合は `research/tools/{名称}/`、実験専用の場合は `experiments/EXP-{番号}/` 直下。

### Step 1: 実装内容の確認

```
agent: 「EXP-{番号} の実装を始めます。
   03 の計画（+ Step 0 の実装方式）通りで進めますか？
   A: 計画通り実装する
   B: 一部変更する（変更点を教えてください）
   C: 再設計が必要（03 に戻る）」
```

### Step 2: パラメータ等の最終確認

訓練型:

```
agent: 「計画で決めた値を確認します：
   - モデル: CNN + MultiheadAttention（head=8, d_model=256）
   - optimizer: Adam（lr=1e-3）
   - batch size: 32
   - epochs: 100
   - seed: 42
   変更しますか？」
```

解析ツール型:

```
agent: 「計画で決めた値を確認します（DC-{番号} の凍結値）：
   - ツール: research/tools/{名称}/
   - 入力: {データパス}
   - パラメータ: {閾値・窓幅 等}
   - 出力先: experiments/EXP-{番号}/results/{YYYY-MM-DD_HHmm}/
   変更しますか？」
```

### Step 3: 指示書の作成と実行委譲

合意後、メイン agent が **実行指示書** をファイルに書き、subagent（または実行環境）に委譲します。

訓練型の指示書:

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
```

解析ツール型の指示書:

```
指示書のパス:
  experiments/EXP-{番号}/run-instruction.md

指示書の内容:
  # 実行指示: EXP-{番号}（解析ツール型）

  ## 対象ツール
  research/tools/{名称}/（正本）

  ## タスク
  1. 実装（未実装の場合）: 成立条件（冪等・単命令・パラメータ凍結・diff 可能出力）を満たすこと
  2. 実行: conda run -n research-{...} python research/tools/{名称}/run.py {引数}
  3. 出力: experiments/EXP-{番号}/results/{YYYY-MM-DD_HHmm}/（図・メトリクス）+ logs/

  ## 補足
  - パラメータ: DC-{番号} の凍結値
  - 実行ログを保存する
```

混合型の指示書は訓練型に準じ、使用する `research/tools/` モジュールを明記する。

実行環境が別マシンの場合: 事前に **引き継ぎ書**（雛形: `templates/handover.md`）を作成してから委譲する。

実行中は、あなたと別の討論を進めることができます。

Direction Check:

- 指示書の内容は 03 の計画と一致しているか
- 実行に必要な情報は全て記載されているか
- 実行環境（GPU・データパス等）の前提は正しいか
- 解析ツール型: 単命令で再実行できるか・パラメータは DC と一致しているか

### Step 4: 実行記録（スナップショット）の管理

**訓練型** — 各実行後、subagent は以下のスナップショットを保存します：

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

**解析ツール型** — 実行のたびに **タイムスタンプ付き実行ディレクトリ** を作成し、過去の結果を上書きしません：

```
experiments/EXP-{番号}/
├── run-instruction.md
├── results/
│   └── {YYYY-MM-DD_HHmm}/        ← 実行ごとに新規作成（上書き禁止）
│       ├── RL-{番号}-metrics.csv
│       ├── FG-{番号}-{説明}.png（論文用は .pdf も可）
│       └── ...
├── logs/
│   └── LG-{番号}-{種別}-{日時}.log
└── experiment.ipynb              ← 安定後に作成するインタラクティブデモ（正本ではない）
```

- 冪等な処理データ（`research/data/processed/` 配下）は再生成可能なため上書きを許容する
- 上記以外（図・メトリクス・実行記録）は上書き禁止

**共通（図）** — 図は ipynb・スクリプトのいずれでも生成してよい。生成したら FG 番号を発行し（counter 更新）、訓練型は `results/`、解析ツール型は実行ディレクトリへ保存する。論文に使う図は PNG + PDF の両方を推奨。

## Pre-Inspect（実行前検証）

- 03 の DC および README.md と齟齬がないか
- 実行指示書に必要な情報は全て記載されているか
- 実験ディレクトリは存在するか（訓練型: ipynb / 解析ツール型: ツール実装）
- 既存の実行記録を誤って上書きしないか
- 実行環境は整っているか（subagent / 別マシン / 依存パッケージ）
- 解析ツール型: 単命令で再実行できるか・パラメータは DC と一致しているか
- RL / FG / TB / LG counter の現在値を確認する（state.yaml）

## Post-Inspect（実行後検証）

訓練型:

- 全てのセルがエラーなく実行されたか
- RL-{番号}-metrics.csv が保存されたか（カラムは討論で決めた通りか）
- RL-{番号}-history.csv が保存されたか（学習曲線データ）
- FG-{番号}-{説明}.png が保存されたか（図）
- スナップショットは正しく作成されたか
- 実験結果に不自然な値はないか（精度が極端に低い・loss が nan 等）
- subagent の実行ログに異常はないか

解析ツール型:

- 単命令の実行が完了したか（exit code 0）
- 実行ディレクトリ results/{YYYY-MM-DD_HHmm}/ に出力が保存されたか
- 図・メトリクスが入力データと整合しているか（不自然な値がないか）
- 実行ログに異常はないか

共通:

- RL / FG / TB / LG counter が実際のファイル数と一致するか確認する
- 不整合があれば実ファイル数を優先して state.yaml を修正する

## 出力先

**訓練型**:

```
experiments/EXP-{番号}/
├── experiment.ipynb          ← 正本
├── run-instruction.md        ← 実行指示書
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

**解析ツール型**:

```
research/tools/{名称}/        ← 正本（再利用可能なツール）
experiments/EXP-{番号}/
├── run-instruction.md        ← 実行指示書
├── results/
│   └── {YYYY-MM-DD_HHmm}/    ← 実行記録（上書き禁止）
│       ├── RL-{番号}-metrics.csv
│       └── FG-{番号}-{説明}.png（.pdf も可）
├── logs/
│   └── LG-{番号}-{種別}-{日時}.log
└── experiment.ipynb          ← 安定後に作成（インタラクティブデモ。正本ではない）
```

反映先:

```
research/state.yaml   ← RL / FG / TB / LG counter 更新
```

## 次のステップ

実験結果の確認後、05-results-analysis に進むかどうかを相談する。

## HARD-GATE

- 03 の計画（DC / README.md）確認なしに実装を開始してはならない
- 実行指示書なしに実行を委譲してはならない
- 実行中に同じ実験ディレクトリを操作してはならない
- Post-Inspect 完了前に結果を「確定」として扱ってはならない
- 実行記録（スナップショット・実行ディレクトリ）を上書きしてはならない
- 訓練型: `.py` を正本にしてはならない（ipynb が正本）
- 解析ツール型: 成立条件（冪等・単命令・パラメータ凍結・diff 可能出力）を満たさない実装を正本にしてはならない
