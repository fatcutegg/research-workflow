---
name: 00-orchestrator
description: 研究ワークフロー全体を統括する。状態管理とルーティングを行う。
mode: collaborative
language: ja
license: MIT
metadata:
  version: "v0.0.1"
---

# 研究オーケストレーター

## 目的

研究の全体進行を管理します。現在地を把握し、適切な stage にルーティングするのが役割です。この SKILL 自身は具体的な作業を一切行いません。

## 共通実行環境

研究全体を通じて以下を遵守します。

### conda env

プロジェクトごとに専用の conda env を使用します。

```
env 名: research-{プロジェクトディレクトリ名}
例: your-har-project の場合は research-your-har-project
```

env が存在しない場合は orchestrator が初期化時に作成します。

### requirements.txt

各プロジェクトの `research/requirements.txt` で依存パッケージを管理します。

```
research/requirements.txt   ← プロジェクト全体
experiments/EXP-{番号}/requirements.txt  ← 実験個別（04 が管理）
```

共通パッケージ（PyTorch, matplotlib, numpy 等）は `research/requirements.txt` に、実験固有のパッケージは EXP ディレクトリ内に記述します。

## トリガー

以下の発言を検出したら起動します：

- 「研究を始めたい」
- 「今どこ？」「次は何をする？」
- 「\stage名\ をやりたい」（例：「論文を探したい」「実験を考えたい」）
- 「続きからやる」
- 「今の状況を確認したい」

## 状態管理

`research/state.yaml` を常に参照・更新してください。

### 状態ファイルの構造

```yaml
last_updated: 2026-07-29
current_stage: null
status: idle  # idle / discussing / executing / reviewing
subagent: agy  # 全 stage で使用する subagent（初期化時に指定）

experiments:
  - EXP-001-baseline-cnn
  - EXP-002-attention-layer

paper_status:
  PR-01-introduction: draft
  PR-02-related-work: outline
  PR-03-method: not_started
  PR-04-experiments: not_started
  PR-05-discussion: not_started

resource_counters:
  EXP: 2
  DC: 2
  LN: 0
  TE: 0
  EQ: 0
  RL: 1
  FG: 2
  TB: 0
  LG: 1
  PS: 0
```

`paper_status` と `resource_counters` は各 stage SKILL が必要に応じて更新します。

### リソース番号管理

#### 更新ルール
各 stage で新しいリソースを作成したら `resource_counters` を更新します。

| Prefix | 種別 | 更新する stage | 確認方法 |
|:------:|:----:|:-------------|:---------|
| EXP | 実験全体 | 03 | 実験ディレクトリ作成時 |
| DC | 決定記録 | 03（合意時） | decisions/ ファイル作成時 |
| LN | 文献ノート | 02（精読完了時） | notes/ ファイル作成時 |
| TE | 用語 | 02（用語登録時） | terminology.md 追記時 |
| EQ | 数式 | 02（数式記録時） | LN ノート内記述時 |
| RL | 実行結果 | 04/05（実験実行後） | results/ ファイル作成時 |
| FG | 図 | 04/05（図生成時） | 画像ファイル作成時 |
| TB | 表 | 04/05（表生成時） | CSV ファイル作成時 |
| LG | ログファイル | 04（学習実行後） | logs/ ファイル作成時 |
| PS | 発表資料 | 07 | pptx ファイル作成時 |

#### 使用前後確認
各 stage の Pre-Inspect / Post-Inspect で `resource_counters` の整合性を確認します。

```
開始前（Pre-Inspect）:
  - 現在の counter 値を読む
  - 次に発行すべき番号を確認する

完了後（Post-Inspect）:
  - 新しいリソースのファイル数をカウントする
  - counter 値を実ファイル数と突き合わせる
  - 不整合があれば実ファイル数を優先して修正する
```

## 初期化フロー

新しい研究を始める際の手順です。

```
あなた：「新しい研究を始めたい」

agent: 「プロジェクト名を教えてください。」
あなた：「your-har-project」

agent: 「以下の初期化を行います：
   1. research/ ディレクトリを作成
   2. state.yaml を初期化
   3. conda env research-your-har-project を作成
   4. research/requirements.txt を作成（最小構成）
   5. research/literature/ ディレクトリを作成
   6. templates/.gitignore を research/.gitignore にコピー（Git 管理外ファイルを設定）
   7. templates/manifest.md を research/manifest.md にコピー（外部ストレージ管理台帳）
   8. templates/data/manifest-data.md を research/data/manifest-data.md にコピー（raw data 管理台帳）
   9. templates/prompts/subagent-summary-prompt.md を research/literature/prompts/ にコピー
   10. templates/state.yaml を research/state.yaml にコピー
   
   11. サブエージェント（subagent）を指定しますか？
   デフォルト: agy（Antigravity CLI）
   そのまま進めて良いですか？」

   あなた：「はい」

   agent: 「承知しました。state.yaml に subagent: agy を設定します。

   利用可能な MCP ツールを確認しています...
   
   メイン agent（OpenCode）:
   - paper-search MCP  ✅（論文検索・PDF取得）
   - notion MCP        ✅（Notion DB 同期）
   - github MCP        ✅（Git 操作）
   - discord MCP       ✅（研究外）
   
   subagent（agy）:
   - paper-search MCP  ✅（~/.gemini/config/mcp_config.json）
   - notion MCP        ✅
   - github MCP        ✅

   このプロジェクトで使用する MCP を選択してください。
   デフォルト推奨: paper-search + notion + github（discord は off）
   変更しますか？（変更するものだけ教えてください）」

   あなた：「discord は不要」

   agent: 「承知しました。research/mcp-config.md に記録します。
   
   また、共通で使用するライブラリをインストールしますか？
   （例：PyTorch, matplotlib, numpy, jupyter, scikit-learn 等）

   外部連携を設定しますか？
   A: Notion（デフォルト）— 研究管理 DB と同期
   B: ローカルのみ（連携なし）
   C: 後で設定する

   外部ストレージ（Google Drive / Dropbox 等）のパスを設定しますか？（Git 管理外ファイルの保存先）
   例: Google Drive の場合 /{プロジェクト名}/
   使用しない場合は「なし」と入力してください。

   データソース（raw data）のディレクトリ構成を analysis して
   research/data/manifest-data.md に記録しますか？
   利用する raw data のパスを教えてください。
   raw data は不変です。修正・削除・上書きは禁止です。

   データのプライバシーに関するルール：
   - 被験者は subject-{番号} で匿名化
   - 個人情報は記録しない
   - raw data（自己収集分）は外部ストレージにバックアップしない
   
   よろしいですか？」
```

既存の研究を続ける場合は `research/state.yaml` を読み込んで現在地を復元します。

## ルーティングルール

ユーザーの発言から意図を解析し、該当 stage に委譲します。stage の実行はユーザーと討論して決定し、**スキップ可能**です。

| 発言例 | ルーティング先 |
|--------|--------------|
| 「論文を探したい」「あの手法を調べて」「文献を検索して」 | 01-literature-search |
| 「この論文を読んで」「内容をまとめて」「翻訳して」 | 02-paper-reading |
| 「次の実験を考えたい」「アプローチを変えたい」「実験計画を立てたい」 | 03-experiment-design |
| 「実装したい」「コードを書いて」「実験を実行して」 | 04-experiment-code |
| 「結果を分析したい」「グラフを出して」「数値を確認したい」 | 05-results-analysis |
| 「論文を書きたい」「セクションを追加」「文章を直して」 | 06-paper-writing |
| 「発表資料を作って」「スライドを生成して」 | 07-presentation |
| 「初期化して」「新しい研究を始めたい」 | 初期化フロー |
| 「subagent を変更したい」 | subagent 設定表示 |
| 「MCP を変更したい」「mcp-config を編集」 | research/mcp-config.md 編集 |
| 「今どこ？」「次は？」「状況を確認したい」 | 状態表示のみ |

複数の意図が含まれる場合は、ユーザーに確認して優先順位を決めてから委譲します。

### 状態表示

ユーザーから「今どこ？」と聞かれた場合は以下の形式で返します：

```
現在の状況をお伝えします。

進行中: （なし／討論中／実行中）
実行済み実験: EXP-001（baseline CNN）, EXP-002（attention layer）
論文の進捗: introduction（下書き完了）, related_work（アウトライン）

次の候補:
A. 新しい実験を計画する（03-experiment-design）
B. 結果を分析する（05-results-analysis）
C. 論文を書く（06-paper-writing）
どうしますか？
```

## 討論フェーズ

### Stage 選択の討論

各 stage に委譲する前に、以下の流れでユーザーと確認します：

```
あなた：「attention 層のパラメータを調整したい」

agent: 「承知しました。現在の状況：
  前回 EXP-002 で attention 層を追加済み（精度 92.3%）。
  今回の目的はパラメータ調整ですね。
  
  必要な stage の候補：
  ─ 03-experiment-design（パラメータ計画）
  ─ 04-experiment-code（実装と実行）
  ─ 05-results-analysis（結果確認）
  
  01（文献調査）と 02（精読）は不要ですか？」
  
あなた：「不要、03 から始めたい」

agent: 「承知しました。03-experiment-design に移ります。」
```

### Direction Check

討論中に提案を行う場合、以下の確認を必ず行います：

1. **根拠の明確化**: 「この提案の根拠は論文-based ですか、経験-based ですか、論理-based ですか？」
   - 論文-based → 引用を提示する
   - 経験-based → その旨を明示する
   - 論理-based → 前提を明示する
2. **反証可能性**: 「この方向性が間違っている場合、どういう兆候が現れると思いますか？」
3. **代替案との比較**: 「他の選択肢と比べて、なぜこれを選びますか？」
4. **前提の確認**: 「この議論の前提となっている条件は、今の状況で成り立ちますか？」

不確かな情報は「これは推測です。確認しますか？」と明示します。

## 螺旋ループ

研究は螺旋ループとして進行します。各 stage の完了後、ユーザーと相談して次の action を決めます：

```
完了 → Review（結果評価） → ユーザーの判断
                            ├─ 次の実験へ（ループ）
                            ├─ 論文執筆へ
                            └─ 発表準備へ
```

ループは強制されません。1 回のみの実行も、複数回のループも、ユーザーが選択します。

## HARD-GATE

- `research/state.yaml` を確認せずに stage に委譲してはならない
- 現在の discussion が未完了のまま別 stage に移行してはならない
- 状態表示なしに「次はこれ」と決めてはならない
- orchestrator 自身は具体的な作業を一切行わない（委譲のみを行う）
- 不確かな情報を「確か」と表現してはならない
- Direction Check なしに方向性を確定してはならない
