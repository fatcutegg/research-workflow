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

## 資源制約（CPU / GPU は 70% 以下）

研究マシンはユーザーが日常作業に使います。**CPU / GPU の使用率を 70% 以下に保つ**ことを全 stage の前提とします。

| 規則 | 内容 |
|:-----|:-----|
| 上限 | **CPU 使用率 ≤ 70%**・**GPU 使用率 ≤ 70%** |
| 並列数 | **2〜3 並列**（各タスク 2 スレッド） |
| スレッド | `OMP_NUM_THREADS` / `MKL_NUM_THREADS` / `OPENBLAS_NUM_THREADS` / `NUMEXPR_NUM_THREADS` / `VECLIB_MAXIMUM_THREADS` = **2** |
| 優先度 | `nice -n 10`（他の作業を妨げない） |
| GPU | **使用禁止ではない**。加速が見込めるなら使う（PyTorch MPS / MLX 等）。ただし 70% を超えない・発熱と騒音に注意 |
| 計測 | `top -l 2 -n 0 -s 1 \| grep "CPU usage"` で **idle ≥ 30%**。**load average は遅延指標なので判定に使わない** |
| 夜間 | ユーザーが休む時間帯は **1 タスク以下**。可能なら停止する |
| 中断 | **逐次書き出しを事前に要求**する（強制停止しても部分結果が残る） |

実測: 4 並列 × 2 スレッドで load average 9.85 まで飽和した。この構成を既定にしない。

委託先が別マシンの場合も、この制約を brief に書いて渡します（後述の「subagent への委託プロトコル」）。

## トリガー

以下の発言を検出したら起動します：

- 「研究を始めたい」
- 「今どこ？」「次は何をする？」
- 「\stage名\ をやりたい」（例：「論文を探したい」「実験を考えたい」）
- 「続きからやる」
- 「今の状況を確認したい」
- 「TODO を追加して」「タスクを記録して」

## 状態管理

`research/state.yaml` を常に参照・更新してください。

### 状態ファイルの構造

```yaml
last_updated: 2026-07-29
current_stage: null
agent_platform: opencode  # opencode / omp
status: idle  # idle / discussing / executing / reviewing
subagent: agy  # 全 stage で使用する subagent（論理名。実体は下の「subagent の写像」で解決）

backlog:  # 優先順の次タスク（任意・00 が更新。先頭が最優先）
  - 前処理パイプラインのレビュー
  - ベースライン手法の比較実験

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

### subagent の写像（プラットフォーム別）

`state.yaml` の `subagent` は**論理名**（`agy` / `opencode`）で保持し、実体はプラットフォームごとに写像します。

| agent_platform | `agy` の実体 | `opencode` の実体 |
|---|---|---|
| opencode | `agy -p` / agy MCP | `opencode run` |
| omp | `task({agent: "agy-agent"})` | `task({agent: "opencode-agent"})` |
| **pi** | **`agy-flash-high`（既定）/ `agy-argon-high`（深い推論）/ `agy-manager`（統括）** | `delegate`（親モデルを継承） |

> pi の旧 agent `agy` / `agy-gemini`（external-cli で `localAI/bin/agy-run` → agy CLI を叩くラッパー）は 2026-10-25 に廃止した。ACP 経由の `agy-*` に置き換わっており、旧名で派発すると「disabled / did you mean」で別 agent に流れるので注意。`agy-run` 自体は `paper-process --engine agy` が使うので残す。

### リソース番号管理

#### 番号の意味

`resource_counters` は「作成済みファイル数」ではなく**発行済み最大番号**を表します
（例: LN counter = screening.md と notes/ を含む全発行済み LN の最大値）。
番号は発行した stage がその場で更新し、欠番があっても最大値を維持します。

#### 更新ルール

各 stage で新しいリソースを作成したら `resource_counters` を更新します。

| Prefix | 種別 | 更新する stage | 確認方法 |
|:------:|:----:|:-------------|:---------|
| EXP | 実験全体 | 03 | 実験ディレクトリ作成時 |
| DC | 決定記録 | 03（合意時） | decisions/ ファイル作成時 |
| LN | 文献ノート | 01（番号発行時）/ 02（新規発行時） | screening.md・notes/ の発行済み最大番号 |
| TE | 用語 | 02（用語登録時） | terminology.md 追記時 |
| EQ | 数式 | 02（数式記録時） | LN ノート内記述時 |
| RL | 実行結果 | 04/05（実験実行後） | results/ ファイル作成時 |
| FG | 図 | 04/05（図生成時） | 画像ファイル作成時 |
| TB | 表 | 04/05（表生成時） | CSV ファイル作成時 |
| LG | ログファイル | 04（学習実行後） | logs/ ファイル作成時 |
| PS | 発表資料 | 07 | pptx ファイル作成時 |
| IM | アイデア・メモ | 00（記録時） | research/ideas/ ファイル作成時 |

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

### バックログ（次タスク）

`backlog` は優先順の次タスク一覧です（先頭が最優先）。

- **記録**: 「TODO を追加して」「タスクを記録して」→ `backlog` へ追記し `last_updated` を更新する
- **完了**: 完了したタスクは削除する（実施の記録は該当 stage の記録側に残す）
- **表示**: 状態表示では先頭数件を表示する

## 用語登録（TE）の運用

用語は `research/terminology.md`（初期化時に `templates/terminology.md` をコピー）で一元管理します。用語の揺れは stage 間の誤解の最大の原因なので、**登録を省略しません**。

### 登録規則

- 新しい用語は **`TE-{連番}`** で追記する（`resource_counters.TE` と一致させる。発行済み最大番号を維持し、欠番を再利用しない）
- **略語は必ず登録する**（OOF・yaw・HAR・IMU 等）。初出時に登録しないと、後続 stage で意味が揺れる
- 同じ概念に複数の訳語がある場合は「備考」に併記する
- 既存の用語が別の論文にも出現したら「登場論文」列に LN 番号を追記する
- 登録の主担当は 02-paper-reading（LN ノート作成時）。06（論文）・07（発表資料）で新しい略語を使う場合も、**先に登録してから使う**

### 誤解を招く定義には警告を付ける

定義が「そのまま読むと誤解される」場合は、**警告行を必ず書く**（定義の直後に「⚠ 誤用注意: …」）。実際に起きた誤解の例:

- **OOF（out-of-fold）予測を主指標にしない** — OOF は交差検証の副産物で、モデル選択に使うと楽観バイアスが入る。主指標はホールドアウト（被験者分割）で測る
- **yaw は「俯身角」ではない** — yaw は鉛直軸まわりの回転（方位）であり、体幹の前傾角（pitch）と混同しない

### 更新のタイミング

- 02 で用語を登録したら `resource_counters.TE` を更新する
- 07 の Pre-Inspect では、資料で使う略語が `terminology.md` にあるかを確認する

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
   4. templates/requirements.txt を research/requirements.txt にコピー（最小構成）
   5. research/literature/ ディレクトリを作成
   6. templates/.gitignore を research/.gitignore にコピー（Git 管理外ファイルを設定）
   7. templates/manifest.md を research/manifest.md にコピー（外部ストレージ管理台帳）
   8. templates/data/manifest-data.md を research/data/manifest-data.md にコピー（raw data 管理台帳）
   9. templates/prompts/subagent-summary-prompt.md を research/literature/prompts/ にコピー
    10. templates/state.yaml を research/state.yaml にコピー
    11. メイン agent のプラットフォームはどちらですか？（デフォルト: opencode）
    A: OpenCode
    B: OMP（Oh My Pi）

   あなた：「B」

   agent: 「承知しました。state.yaml に agent_platform: omp を設定します。

    12. サブエージェント（subagent）を指定しますか？
     現在の設定:
       - omp → task tool + agy-agent / opencode-agent（task の子 session が delegate CLI を呼ぶ）
       - opencode → agy CLI（agy -p / agy MCP）
       - pi → agy-flash-high / agy-argon-high（Antigravity ACP。外部 CLI ラッパーではない）
     デフォルト: opencode（変更する場合は agent 名を教えてください）
     そのまま進めて良いですか？」

   あなた：「はい」

   agent: 「承知しました。state.yaml に subagent: opencode を設定します。

   agent_platform に応じて subagent の発行方法が変わります：
   - omp → task({agent: "agy-agent"}) または task({agent: "opencode-agent"})
   - opencode → agy -p または opencode run
   - pi → subagent({agent: "agy-flash-high"})（深い推論は agy-argon-high）

   利用可能な MCP ツールを確認しています...
    
   メイン agent のプラットフォームに応じた MCP 設定を確認してください。
   - OpenCode: research/mcp/opencode.md
   - OMP: research/mcp/omp.md
   
   subagent（agy）:
   - paper-search MCP  ✅（~/.gemini/config/mcp_config.json）
   - notion MCP        ✅
   - github MCP        ✅

   このプロジェクトで使用する MCP を選択してください。
   デフォルト推奨: paper-search + notion + github（discord は off）
   変更しますか？（変更するものだけ教えてください）」

   あなた：「discord は不要」

   agent: 「承知しました。research/mcp/ に対応する MCP 設定を記録します。

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
| 「アイデアを記録して」「着想をメモしておいて」 | 00（`research/ideas/` へ IM 発行・討論前の駐車場） |
| 「TODO を追加して」「タスクを記録して」「バックログを確認」 | 00（`state.yaml` の `backlog` 更新・表示） |
| 「subagent を変更したい」 | subagent 設定表示＋agent_platform に応じた説明 |
| 「MCP を変更したい」「mcp-config を編集」 | research/mcp/ の該当ファイルを参照 |
| 「今どこ？」「次は？」「状況を確認したい」 | 状態表示のみ |

複数の意図が含まれる場合は、ユーザーに確認して優先順位を決めてから委譲します。

### 状態表示

ユーザーから「今どこ？」と聞かれた場合は以下の形式で返します：

```
現在の状況をお伝えします。

進行中: （なし／討論中／実行中）
プラットフォーム: opencode / omp / pi
subagent: agy / opencode（pi では agy-flash-high / agy-argon-high）
実行済み実験: EXP-001（baseline CNN）, EXP-002（attention layer）
論文の進捗: introduction（下書き完了）, related_work（アウトライン）

バックログ（優先順）:
1. 前処理パイプラインのレビュー
2. ベースライン手法の比較実験

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

## 同期 / 非同期の判断ルール（OMP）

task を発行する前に、以下の基準で `blocking` を決定する。

### 判断フローチャート

```
task の結果が「次のステップの入力」になるか？
  YES → blocking: true（同期）または 非同期発行後に完了確認を待つ
  NO  → blocking: false（非同期、バックグラウンド実行）
```

### 具体例

| task 内容 | blocking | 理由 |
|---|---|---|
| 論文 PDF の要約（後続の執筆に使う） | `true` | 要約が次 stage の入力になるため |
| 参考文献リストの整形（独立処理） | `false` | 他 task と依存しない |
| state.yaml の更新確認 | `true` | 主 agent が状態を読む前に完了必須 |
| 図の生成（後で参照） | `false` | 生成完了を待たずに他処理を進められる |
| GitHub issue の作成（並列可） | `false` | 結果は後でまとめて確認でよい |

### 非同期 task の完了確認タイミング

- 非同期で発行した task の結果が必要になる直前に完了を確認する
- 複数の非同期 task を発行した場合、全て完了してから次 stage に進む
- 確認は `task.status` を参照するか、結果ファイルの存在チェックで行う

## subagent への委託プロトコル

委託の既定は「**親の文脈を子に渡さない**」です。子は brief だけで動ける必要があります。

### fresh context を既定にする

- `defaultSubagentContext: "fresh"` を設定する（未設定だと各 agent の既定＝fork が働き、親の文脈をまるごと子へ渡す）
- fork が必要なのは、親の討論文脈を前提に助言する agent（例: oracle）だけ。その場合は `context: "fork"` を**明示**する
- 判定: 子の `session.jsonl` が**起動直後に数十 KB なら fresh**、**1 MB 超なら fork**
- 実測: fork で **1,583,002 B（1.5 MB）** の文脈を継承していた。fresh 適用後は起動直後 **61,075 B**（26 倍削減）

### brief の必須項目

| # | 項目 |
|:-:|:-----|
| 1 | 目的 |
| 2 | 成果物と配置パス |
| 3 | データの場所（リポジトリ内のファイルを**指す**。本文を貼らない） |
| 4 | **実行マシン**（書かなければ別マシンで走る） |
| 5 | 資源制限（並列数・スレッド数・`nice`・GPU 可否） |
| 6 | 報告項目 |

brief は各項目 2〜4 行に収める。長い brief は読み飛ばされ、必要な制約が伝わらない。

### 長時間タスクの timeout と再実行

| 規則 | 内容 |
|:-----|:-----|
| 30 分超 | **`timeoutMs` を明示**する |
| 逐次書き出し | 要求する（90 分で打ち切られても部分結果が残る） |
| timeout したら | **推定所要時間の 1.5 倍**を与えて再実行する |
| 推定方法 | 部分成果から実測レートを出す（例: 特徴抽出 30 名で 50 分 → 組合せ数 × fold 数から推定） |
| 分割優先 | 分割できるなら並列に分ける（並列の方が総時間は短い） |
| 再実行時 | 既存キャッシュを再利用する（特徴抽出をやり直さない） |

### 並列化と reviewer の付け方

- 独立タスクは**並列**で発行する（直列に await を重ねない）。並列数は資源制約（2〜3）に従う
- reviewer を付けるのは **①真値・数値の結論 ②引用・文献 ③設計の妥当性** の 3 条件のみ。整形・変換・再実行には付けない
- 数十秒で終わる分析（grep・集計・差分確認）は親が自分でやる
- **子に巨大な産物を読ませない**（1.4 MB の JSON を指したため reviewer の文脈が 61 KB → 1.2 MB に膨張した）。要約済みレポートを指す

### 反引号（バッククォート）の禁止

workflow スクリプト内で反引号を使うと、シェルがコマンド置換として解釈して実行が失敗する（過去に 10 回失敗した）。引用は「」を使う。

実行前に同梱のチェッカーを通す（インストール先の `00-orchestrator/scripts/` にある）:

```bash
bash ~/.pi/agent/skills/00-orchestrator/scripts/check-no-backticks.sh path/to/workflow.sh
```

プロジェクト内にコピーして使う場合は `.pi/skills/00-orchestrator/scripts/check-no-backticks.sh`（または `.agents/skills/...`）になる。検出したら**置換してから実行**し、反引号が残ったまま実行しない。

### 機密（外部 LLM に委託する場合）

- プロンプトで「読むな」と書くだけでは不十分。**隔離ディレクトリを作り、許可ファイルだけを置き、そこで実行する**
- 起動前に隔離域を `find` で走査し、`*.parquet`・`*.csv`・`raw` が **0 件**であることを確認する
- 許可ファイルに個人情報の値（年齢・性別・身長体重の**値**）が混じっていないか `grep` で確認する（「身長体重なしで遂行可」のような要件記述は誤検出）
- 外部 CLI を遠隔実行する場合、非対話 shell の PATH は最小構成なので、`export PATH=...` を前置する

## エラー報告規約

subagent からエラーが返った場合、主 agent は以下の規約に従う。

### エラー受信時の処理順序

1. **即時リトライ判断**: エラー種別を確認し、リトライ可能か判定する
   - `TIMEOUT` → 1 回リトライ（待機後）
   - `CONFIG_MISSING` → リトライ不可。設定ファイルを確認してユーザーに報告
   - `PARSE_ERROR` → raw テキストで代替処理を試みる。不可ならユーザーに報告
   - `EMPTY_OUTPUT` → 1 回リトライ。それでも空なら代替 agent を試みる
   - その他 exit code ≠ 0 → 1 回リトライ
2. **リトライ 1 回後も失敗**: ユーザーへ以下の形式で報告する

```
⚠️ subagent エラー報告
- task: <task の概要>
- agent: <agy-agent / opencode-agent>
- エラー: <エラーメッセージ>
- 後続への影響: <ブロッカー / 非ブロッカー>
- 推奨アクション: <手動実行 / スキップ / 設定確認>
```

3. **ユーザー応答待ち**: ユーザーの指示があるまで該当 stage を保留にする
4. **他 stage への影響なし**: 独立した他 task は継続して実行してよい

## HARD-GATE

- `research/state.yaml` を確認せずに stage に委譲してはならない
- 現在の discussion が未完了のまま別 stage に移行してはならない
- 状態表示なしに「次はこれ」と決めてはならない
- orchestrator 自身は具体的な作業を一切行わない（委譲のみを行う）
- 不確かな情報を「確か」と表現してはならない
- Direction Check なしに方向性を確定してはならない
- agent_platform（opencode/omp）を確認せずに subagent 発行方法を決めてはならない
- **資源制約（CPU / GPU 70% 以下・並列 2〜3・各 2 スレッド・`nice -n 10`）を超える実行を指示してはならない**
- **実行マシンを明記しない brief を発行してはならない**
- **workflow スクリプトに反引号を残したまま実行してはならない**（チェッカーを通す）
- **略語を用語庫（TE）に登録せずに後続 stage へ渡してはならない**
- 生成物を既存ファイルへ上書きさせてはならない（版を増やす。詳細は 07-presentation）
