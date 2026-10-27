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
- **資源制約** — CPU / GPU 使用率 ≤ 70%・並列 2〜3・各タスク 2 スレッド・`nice -n 10`・夜間は 1 タスク以下（00-orchestrator）
- **subagent 委託** — fresh context を既定・brief に実行マシンを明記・30 分超は timeout と逐次書き出し（00-orchestrator）
- **用語** — `research/terminology.md` に TE-ID で登録。略語は必須、誤解を招く定義には警告（00 / 02）
- **版管理** — 発表資料は上書きせず `-v{n}` で増やす（07-presentation）

## v0.5.1 の変更点（2026-10）

ドキュメントのみの修正です（スキルの手順そのものは変わりません）。

- **`subagent` の論理名と実体の写像を明記** — `state.yaml` の `subagent: agy` は**論理名**とし、`skills/00-orchestrator/SKILL.md` に「subagent の写像（プラットフォーム別）」表を追加。`opencode` → `agy -p` / `omp` → `task({agent:"agy-agent"})` / **`pi` → `agy-flash-high`（既定）・`agy-argon-high`（深い推論）・`agy-manager`（統括）**
- **`agent_platform` に `pi` を追加** — 初期化の質疑と状態報判に `pi` を追加（従来は `opencode` / `omp` の 2 択だった）
- **廃止 agent の注意書き** — pi 側の旧 `agy` / `agy-gemini`（external-cli で `localAI/bin/agy-run` → agy CLI を叩くラッパー）は 2026-10-25 に廃止。ACP 経由の `agy-*` に置き換わっている。旧名で派発すると「disabled / did you mean」で別 agent に流れ、**表示モデルは既定値（deepseek）のまま実体は Gemini** という紛らわしい状態になる
- `templates/state.yaml` の `subagent` に「論理名である」旨のコメントを追加

## v0.5.0 の変更点（2026-10）

**破壊的変更**: 07-presentation の生成ツールを「Anthropic PPTX skill」から **`power-pptx`** に変更しました（Anthropic PPTX skill は現存せず、指定自体が誤りでした）。

### 07-presentation

- **生成ツール** — `power-pptx`（`pip install power-pptx`・**import 名は `power_pptx`**）に変更。表・図・日本語フォント・`space-aware authoring` に対応
- **フォールバック** — 導入できない環境では標準ライブラリ（`zipfile` + 手書き OOXML）で直接生成する手順を明記
- **他ツールの評価を併記** — Pandoc（数式のバグ #9465 / #11483 / #6301）・Touying（`typ2pptx` は条件付き、`touying-exporter` は PNG 画像化）・Marp / reveal.js / Slidev（pptx は画像化）
- **Post-Inspect の具体化** — 豆腐（`.notdef` との描画比較）・はみ出し（実グリフ幅で折り返し行数を推定し枠高と比較）・ブロック重なり・タイトル／出典の有無・枚数・zip 整合（XML parse / rels 解決）の 6 項目
- **progress-long モード** — 30 分組会向け（15-25 枚）を追加
- **express モード** — 討論前の草稿生成を許可（**草稿は最終版とみなさない**）。HARD-GATE に例外を明記
- **バッチ討論** — 逐頁ではなく **3〜5 枚を 1 バッチ**で確認
- **デフォルトテーマ** — テンプレート未選択時は 16:9・游ゴシック／ヒラギノ・タイトル 32pt・本文 18-20pt・アクセント 1 色・出典フッター
- **版管理（上書き禁止）** — `{mode}-{date}-{desc}-v{n}.pptx`。既存ファイルを上書きせず、生成スクリプトも版ごとに残す。最新版は版台帳（`research/presentations/README.md` または `manifest.md`）に明示
- **Pre-Inspect にツール検査** — `python -c "import power_pptx"` を通す

### 00-orchestrator

- **資源制約** — CPU / GPU 使用率 ≤ 70%・並列 2〜3・各タスク 2 スレッド・`nice -n 10`・夜間は 1 タスク以下
- **subagent への委託プロトコル** — fresh context を既定（fork は明示時のみ）・brief の必須項目（**実行マシン**を含む）・30 分超は timeout と逐次書き出し・timeout 時は推定所要時間の 1.5 倍で再実行・反引号禁止
- **用語登録（TE）の運用** — `research/terminology.md` に TE-ID 連番。略語は必ず登録。誤解を招く定義には警告（例: OOF を主指標にしない・yaw は俯身角ではない）
- **同梱チェッカー** — `skills/00-orchestrator/scripts/check-no-backticks.sh`（workflow スクリプトの反引号を検出）

## 移行方法（v0.4.2 → v0.5.0）

### 1. スキルの更新

npx で入れた場合（npx キャッシュは更新で消えるため `--force` を付ける）:

```bash
npx research-workflow@0.5.0 init --pi --global --force --symlink
```

clone で入れた場合（以後の編集を即反映させるため、**リンク先を clone へ向け直す**）:

```bash
cd ~/Projects/research-workflow
git pull

# 既存リンクの記録（バックアップ代わり）
ls -la ~/.pi/agent/skills/

# 8 本すべてを clone 先へ張り直す
for d in ~/Projects/research-workflow/skills/*/; do
  ln -sfn "${d%/}" "$HOME/.pi/agent/skills/$(basename "$d")"
done
ls -la ~/.pi/agent/skills/
```

### 2. 生成ツールの導入（07-presentation）

```bash
conda run -n research-{プロジェクト名} pip install power-pptx
python -c "import power_pptx; print(power_pptx.__version__)"
```

**import 名は `power_pptx`**（`pptx` ではない）。導入できない場合は 07-presentation のフォールバック（標準ライブラリで OOXML 直接生成）を使う。

### 3. 既存プロジェクトの追従

- `research/requirements.txt` に `power-pptx` を追加する
- 発表資料は**上書きせず版番号で増やす**運用に切り替える（`-v1`, `-v2` …）。最新版は `research/presentations/README.md` に記録する
- `research/terminology.md` に略語（OOF・yaw 等）を登録し、誤用注意を書く
- subagent を使う場合、`defaultSubagentContext: "fresh"` を設定する
- 旧 07 が指定していた Anthropic PPTX skill への依存は削除する（参照しても生成できない）

## 前提環境

- Python（conda 環境管理）
- AI coding agent: OpenCode / OMP（Oh My Pi）/ Pi（badlogic/pi）/ Claude Code 等
- Pi は `--pi`（`.pi/skills/`・`~/.pi/agent/skills/`）で対応
- subagent: agy（マルチモーダル） / opencode（コード生成） / 両方 — 実体はプラットフォーム別に写像（opencode: `agy -p` / omp: `agy-agent` / **pi: `agy-flash-high`・`agy-argon-high`**、詳細は `skills/00-orchestrator/SKILL.md`「subagent の写像」）

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

# Pi 用（.pi/skills/）
npx research-workflow init --pi

# Claude Code 用（.claude/skills/）
npx research-workflow init --claude

# グローバル（OpenCode / OMP / Pi / Claude Code）
npx research-workflow init --global
npx research-workflow init --omp --global
npx research-workflow init --pi --global
npx research-workflow init --claude --global

# シンボリックリンク
npx research-workflow init --omp --symlink
```

インストール先の一覧:

| フラグ | プロジェクト | グローバル |
|:-------|:-------------|:-----------|
| （なし）OpenCode | `.opencode/skills/` | `~/.config/opencode/skills/` |
| `--pi` Pi | `.pi/skills/` | `~/.pi/agent/skills/` |
| `--omp` OMP | `.agents/skills/` + `.omp/agents/` | `~/.agents/skills/` |
| `--claude` Claude Code | `.claude/skills/` | `~/.claude/skills/` |

> `.agents/skills/` は Agent Skills 標準の互換位置で、OpenCode・Pi・OMP など複数ツールから共通に読まれます。Pi はネイティブ位置（`.pi/skills/`・`~/.pi/agent/skills/`）も探索します。

### 再リンク / アップグレード（`--force`）

既にインストール済みの場合は **`--force`** を付けると、既存リンクを削除してから再作成します。
（`--force` なしでは既存リンクは skip され、旧バージョンのまま残ります）

```bash
# プロジェクト（OpenCode）
npx research-workflow@latest init --force --symlink

# プロジェクト（Pi / OMP）
npx research-workflow@latest init --pi --force --symlink
npx research-workflow@latest init --omp --force --symlink

# グローバル（OpenCode / Pi / OMP / Claude Code）
npx research-workflow@latest init --global --force --symlink
npx research-workflow@latest init --pi --global --force --symlink
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
│   └── 00-orchestrator/scripts/
│       └── check-no-backticks.sh  — workflow スクリプトの反引号チェッカー
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
