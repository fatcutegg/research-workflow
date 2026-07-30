# Research Workflow

協調型 AI エージェントで進める研究ワークフロー。
IMU・足圧センサを用いた HAR 研究を想定して設計されていますが、汎用的に適用可能です。

## 特徴

- **8 stage** — 文献検索（01）から発表資料作成（07）までをカバー
- **Collaborative** — エージェントと対話しながら研究を進める
- **Spiral** — 螺旋状に実験サイクルを回し、段階的に改善する
- **Reproducible** — Jupyter Notebook マスターファイル・スナップショット・conda 環境
- **Traceable** — 全リソースに一意識別子（14 Prefix）
- **Portable** — OpenCode / Claude Code 等の AI coding agent で動作

## 8 Stage

| # | スキル | 役割 |
|:-:|:-------|:-----|
| 00 | orchestrator | 状態管理・ルーティング・初期化 |
| 01 | literature-search | 論文検索・スクリーニング・PDF 取得 |
| 02 | paper-reading | subagent 要約 + 研究関連性精読 |
| 03 | experiment-design | 実験計画・討論・合意記録 |
| 04 | experiment-code | ipynb 実装・subagent 実行・スナップショット |
| 05 | results-analysis | 比較・可視化・分析サマリー |
| 06 | paper-writing | インクリメンタル LaTeX 執筆 |
| 07 | presentation | 進捗発表 / 学会発表 資料作成 |

## 前提環境

- Python（conda 環境管理）
- AI coding agent: OpenCode / Claude Code / 等（`~/.agents/skills/` をサポートするもの）
- subagent（agy 推奨）

## インストール

### 方法 1: npx（推奨）

```bash
# プロジェクトローカル（.opencode/skills/）
npx research-workflow init

# グローバル（~/.config/opencode/skills/）
npx research-workflow init --global

# シンボリックリンクでインストール（更新を自動反映）
npx research-workflow init --global --symlink
```

### 方法 2: install.sh

```bash
curl -fsSL https://raw.githubusercontent.com/fatcutegg/research-workflow/main/install.sh | bash

# シンボリックリンク版
curl -fsSL https://raw.githubusercontent.com/fatcutegg/research-workflow/main/install.sh | bash -s -- --symlink
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
│   ├── manifest.md
│   ├── mcp-config.md
│   └── ...
├── docs/            設計文書
│   ├── notion-db-design.md         — Notion 3-DB 設計（研究管理・決定記録・実験記録）
│   └── resources-prefix-table.md   — 全リソース番号体系（14 Prefix、命名ルール）
└── LICENSE
```

## ライセンス

MIT
