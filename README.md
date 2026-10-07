# Research Workflow

協調型 AI エージェントで進める研究ワークフロー。
IMU・足圧センサを用いた HAR 研究を想定して設計されていますが、汎用的に適用可能です。

## 特徴

- **8 stage** — 文献検索（01）から発表資料作成（07）までをカバー
- **Collaborative** — エージェントと対話しながら研究を進める
- **Spiral** — 螺旋状に実験サイクルを回し、段階的に改善する
- **Reproducible** — notebook／CLI ツールのマスターファイル・実行記録・conda 環境
- **Traceable** — 全リソースに一意識別子（16 Prefix）
- **Portable** — OpenCode / OMP / Pi / Claude Code 等の AI coding agent で動作

## 8 Stage

| # | スキル | 役割 |
|:-:|:-------|:-----|
| 00 | orchestrator | 状態管理・ルーティング・初期化 |
| 01 | literature-search | 論文検索・スクリーニング・PDF 取得 |
| 02 | paper-reading | subagent 要約 + 研究関連性精読 |
| 03 | experiment-design | 実験計画・討論・合意記録 |
| 04 | experiment-code | 実装（ipynb／CLI ツール）・実行委譲・実行記録 |
| 05 | results-analysis | 比較・可視化・分析サマリー |
| 06 | paper-writing | インクリメンタル LaTeX 執筆 |
| 07 | presentation | 進捗発表 / 学会発表 資料作成 |

## 実装方式（実験タイプ別）

04-experiment-code は実験タイプに応じて実装方式を選択します：

| タイプ | 正本 | 用途 |
|:-------|:-----|:-----|
| 訓練型 | ipynb | モデル訓練・評価（全セル実行 → スナップショット） |
| 解析ツール型 | CLI ツール（`.py`） | データ処理・校正・比較評価・統計（冪等・単命令で再実行。安定後に `experiment.ipynb` をインタラクティブデモとして作成） |
| 混合型 | ipynb + `tools/` | notebook から再利用モジュールを呼び出す |

## その他の規約

- **バックログ** — `research/state.yaml` の `backlog` に優先順の次タスクを記録（00-orchestrator が更新）
- **マルチマシン引き継ぎ** — 実行を別マシンに委譲する場合、`templates/handover.md` を雛形に引き継ぎ書を作成する
- **注釈（アノテーション）** — 人手で確定した注釈は Git 管理とし、来歴（裁定者・日付・手順版）を記録する（`templates/data/manifest-data.md`）
- **共有データセット** — 複数実験で共用する前処理データは `data/processed/{データセット名}/`（`templates/manifest.md`）
- **図** — ipynb・スクリプトのいずれでも生成可。FG 番号を発行し、論文用は PNG + PDF を推奨

## 前提環境

- Python（conda 環境管理）
- AI coding agent: OpenCode / OMP（Oh My Pi）/ Pi（badlogic/pi）/ Claude Code 等
- Pi は `--pi`（`--omp` と同じ `.agents/skills/` にインストール）で対応
- subagent: agy（マルチモーダル） / opencode（コード生成） / 両方

### OMP の非同期サブエージェント（推奨設定）

OMP で `task` tool を使う場合、subagent は**バックグラウンド実行**され、会話を妨げません。

- **設定**: `async.enabled: true`（OMP 公式設定。`omp config get async.enabled` で確認）
- **同期が必要なタスク**: 結果が次のステップの入力になる場合のみ `blocking: true` の agent を使う
- **詳細**: プロジェクト初期化後の `research/mcp/omp.md` を参照

## インストール

### 方法 1: npx（推奨）

```bash
# OpenCode 用（.opencode/skills/）
npx research-workflow init

# OMP 用（.agents/skills/ + .omp/agents/）
npx research-workflow init --omp

# グローバル
npx research-workflow init --global
npx research-workflow init --omp --global

# シンボリックリンク
npx research-workflow init --omp --symlink
```

### 再リンク / アップグレード（`--force`）

既にインストール済みの場合は **`--force`** を付けると、既存リンクを削除してから再作成します。
（`--force` なしでは既存リンクは skip され、旧バージョンのまま残ります）

```bash
# プロジェクト（OpenCode）
npx research-workflow@latest init --force --symlink

# プロジェクト（OMP / Pi）
npx research-workflow@latest init --omp --force --symlink

# グローバル（OpenCode / OMP・Pi / Claude Code）
npx research-workflow@latest init --global --force --symlink
npx research-workflow@latest init --omp --global --force --symlink
npx research-workflow@latest init --claude --global --force --symlink
```

- npx キャッシュが evict されてリンクが壊れた場合も `--force` で再作成できます
- バージョンアップは `@latest`（または `@x.y.z`）を付けて再実行するだけです

### 方法 2: install.sh

```bash
# OpenCode 用
curl -fsSL https://raw.githubusercontent.com/fatcutegg/research-workflow/main/install.sh | bash

# OMP 用
curl -fsSL https://raw.githubusercontent.com/fatcutegg/research-workflow/main/install.sh | bash -s -- --omp

# シンボリックリンク版
curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash -s -- --omp --symlink
```

### 方法 3: git clone + 手動設定

```bash
git clone https://github.com/fatcutegg/research-workflow.git ~/Projects/research-workflow
mkdir -p ~/.agents/skills
ln -s ~/Projects/research-workflow/skills/0* ~/.agents/skills/
```

## 初期化

AI coding agent を起動し、`「新しい研究を始めたい」` と話しかけてください。
00-orchestrator が対話形式で以下の初期化を行います：

- `research/` ディレクトリ作成
- `templates/` から各種設定ファイルをコピー
- conda env の作成
- subagent・MCP・外部ストレージの設定
- raw data の分析と記録

## プロジェクト構成

```
research-workflow/
├── skills/          8 SKILL.md（00-orchestrator 〜 07-presentation）
├── templates/       プロジェクト初期化用雛形
│   ├── .gitignore
│   ├── state.yaml
│   ├── delegate.yaml
│   ├── manifest.md
│   ├── handover.md             — マルチマシン引き継ぎ書の雛形
│   ├── mcp/
│   │   ├── opencode.md          — OpenCode 用 MCP 設定
│   │   └── omp.md               — OMP 用 MCP 設定
│   ├── agents/
│   │   ├── agy-agent.md         — agy CLI ラッパー agent（非同期・主 agent 専用返却）
│   │   ├── opencode-agent.md    — opencode CLI ラッパー agent（非同期・主 agent 専用返却）
│   │   └── plot-agent.md        — 図生成 agent（保留用骨格・未作成）
│   ├── data/
│   ├── prompts/
│   └── ...
├── docs/            設計文書
│   ├── notion-db-design.md         — Notion 3-DB 設計（研究管理・決定記録・実験記録）
│   └── resources-prefix-table.md   — 全リソース番号体系（16 Prefix、命名ルール）
└── LICENSE
```

## ライセンス

MIT
