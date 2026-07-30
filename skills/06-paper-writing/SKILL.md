---
name: 06-paper-writing
description: 論文の構成を討論し、各セクションをインクリメンタルに執筆する。引用準備も行う。
mode: collaborative
language: ja
---

# 論文執筆

## 実行環境

共通の実行環境設定は **00-orchestrator（共通実行環境）** を参照すること。

## 目的

実験の進行と並行して論文をインクリメンタルに執筆します。Markdown で大枠を書き、LaTeX で清書します。発表時は学会のテンプレートに沿って整形します。

## トリガー

- 「論文を書きたい」
- 「セクションを追加」
- 「{PR番号} を書いて」
- 「文章を直して」
- 「引用を追加したい」
- 「論文の構成を考えたい」

## 論文ディレクトリ構造

```
research/paper/
├── main.tex                     ← 本体（\include{} で各セクション読込）
├── sections/
│   ├── PR-01-introduction.tex
│   ├── PR-02-related-work.tex
│   ├── PR-03-method.tex
│   ├── PR-04-experiments.tex
│   └── PR-05-discussion.tex
├── figures/                     ← experiments の FG を引用用に整理
├── references.bib               ← LN から生成した引用データベース
└── template/                    ← 学会テンプレート（後で配置）
```

## 状態管理

`research/state.yaml` の `paper_status` を更新します：

```yaml
paper_status:
  PR-01-introduction: draft     # not_started / outline / draft / revised / complete
  PR-02-related-work: outline
  PR-03-method: not_started
  PR-04-experiments: not_started
  PR-05-discussion: not_started
```

## 討論フェーズ

### Step 1: 論文構成の確認

```
agent: 「現在の論文進捗です：
   PR-01: はじめに（draft）
   PR-02: 関連研究（outline）
   PR-03~05: 未着手

   今回どのセクションを書きますか？
   A: PR-01 を推敲する
   B: PR-02 を詳細化する
   C: PR-03 を書き始める
   D: 全体構成を見直す」

あなた：「C。実験がひと段落したので method を書きたい」
```

Direction Check:

- 執筆するセクションに必要な実験結果は揃っているか
- 引用が必要な LN は screening.md で「引用」タグが付いているか
- 図表として参照する FG / TB は利用可能か

### Step 2: 引用の準備

該当セクションに必要な引用を LN ノートから準備します。

```
agent: 「PR-03（提案手法）に必要な引用を確認します：
   - LN-001: Transformer HAR（ベースライン手法）
   - LN-002: Foot pressure fusion（関連手法）
   
   これらの .bib エントリを生成しますか？」
```

Direction Check:

- 引用漏れはないか（screening.md の「引用」タグ一覧と照合）
- 引用の形式は学会テンプレートと合っているか

### Step 3: 執筆

```
日本語（Markdown）で大枠を書き、LaTeX に変換します。

Markdown:
  ## 提案手法
  - CNN の後に attention 層を挿入
  - foot pressure は特徴量レベルで融合

LaTeX:
  \section{提案手法}
  CNN の後に attention 層\cite{attention2024}を挿入し、...
```

書く順序：

1. 各セクションの **Markdown 大枠**をあなたと討論
2. あなたが確認後、**LaTeX に変換**
3. 実験結果の FG / TB を `\includegraphics{}` で埋め込む
4. 引用を `\cite{}` で挿入

文中で引用する LN を指定するだけで、agent が `\cite{著者年}` の形式に整形します。

### Step 4: 進捗更新

各セクションの完了後、state.yaml の `paper_status` を更新します：

```yaml
# 例
paper_status:
  PR-01-introduction: revised
  PR-02-related-work: outline
  PR-03-method: draft
  PR-04-experiments: not_started
  PR-05-discussion: not_started
```

## Pre-Inspect（実行前検証）

- 執筆するセクションに必要な実験結果は揃っているか
- 引用する LN は screening.md で管理されているか
- 参照する FG / TB は research/analysis/ または experiments/ に存在するか
- state.yaml の paper_status は最新か

## Post-Inspect（実行後検証）

- 変換後の LaTeX にエラーはないか（コンパイル確認）
- 引用の DOI や bib キーは正しいか
- 図のパスは正しく参照されているか
- state.yaml の paper_status は更新されたか
- あなたが内容を確認したか

## 出力先

```
research/paper/
├── main.tex
├── sections/
│   ├── PR-01-introduction.tex
│   ├── PR-02-related-work.tex
│   ├── PR-03-method.tex
│   ├── PR-04-experiments.tex
│   └── PR-05-discussion.tex
├── figures/              ← FG をコピー（論文用に整理）
│   ├── FG-03-comparison.png
│   └── FG-04-ablation.png
├── references.bib        ← LN から生成
└── template/             ← 学会テンプレート（後で）
```

## 次のステップ

論文の状態を確認し、必要に応じて他のセクションの執筆、または 07-presentation（発表資料作成）に進む。

## HARD-GATE

- LN ノートの内容を確認せずに引用を生成してはならない
- 実験結果の確認なしに実験セクション（PR-04）を書いてはならない
- 議論なしに論文の主張を確定してはならない
- 学会テンプレート未設定の状態で最終フォーマットを適用してはならない
- false な引用（存在しない論文を引用）を生成してはならない
