---
name: 01-literature-search
description: HAR・IMU・足底圧力センサ関連の論文を検索・スクリーニング・管理する。
mode: collaborative
language: ja
---

# 文献検索

## 実行環境

共通の実行環境設定は **00-orchestrator（共通実行環境）** を参照すること。

## 目的

研究に関連する論文を検索し、スクリーニングし、PDF をローカルに取得して管理台帳に記録します。01 の出口は「PDF がローカルに存在し、screening.md に登録済み」の状態です。

## トリガー

- 「論文を探したい」
- 「あの手法を調べて」
- 「文献を検索して」
- 「{キーワード} に関する論文を調べて」

## 検索戦略

### 使用ツール

| ツール | 用途 |
|:------|:------|
| `search_arxiv` (MCP) | arXiv 検索（関連度順） |
| `search_semantic` (MCP) | Semantic Scholar 検索（補助） |
| `search_crossref` (MCP) | DOI 解決・引用情報 |
| `search_openalex` (MCP) | 学術作品検索（補助） |
| `download_arxiv` (MCP) | arXiv の PDF 取得 |
| `download_semantic` (MCP) | Semantic Scholar の PDF 取得 |

### データベース

| DB | 用途 | 優先度 |
|:---|:-----|:------:|
| **arXiv** | 主要。関連度順で検索 | 最優先 |
| Semantic Scholar | 補助。被引用数・関連論文の探索 | 高 |
| Google Scholar | 補助。広く浅く検索 | 中 |
| CiNii | 日本語論文の検索 | 中 |
| PubMed | 医療・バイオメカニクス関連 | 低（必要時のみ） |

### 検索クエリ

あなたと討論して決定します。

- **日本語 + 英語**の両方で作成する
- **中国語**も必要に応じて使用する
- 研究の進行に応じてキーワードを追加・変更する

典型的なキーワード例（研究内容に応じて調整）：

```
英語: HAR, human activity recognition, IMU, inertial sensor, foot pressure,
      insole sensor, deep learning, transformer, attention, sensor fusion,
      daily activity recognition

日本語: 行動認識, IMU, 慣性センサ, 足圧, 深層学習, センサ融合, 日常動作推定
```

### アクセス制限

- 論文が有料の場合は、**ダウンロード前にあなたに確認する**
- 「有料」と明示して、了承を得てから取得する
- screening.md の status を「有料」に設定する

## 討論フェーズ

### Step 1: 検索目的の確認

```
agent: 「今回の検索目的は何ですか？
   A: 新しいアプローチを探す（広く検索）
   B: 特定の手法について調べる（絞って検索）
   C: 先行研究のベースラインを確認する」
```

### Step 2: 検索クエリの決定

```
agent: 「以下のクエリ候補があります。追加・修正はありますか？
   英語: "HAR IMU transformer attention"
   日本語: "行動認識 IMU 深層学習 トランスフォーマー"
   中国語（必要なら）」
```

Direction Check:

- クエリに関連しそうな別のキーワードはあるか
- 除外すべきキーワードはあるか
- 既に持っている論文と重複しない範囲か

### Step 3: 結果の確認

検索結果を一覧表示し、あなたが選択します：

```
agent: 「arXiv の検索結果（関連度順）：
   1. Smith et al. 2025 - Transformer-based HAR with IMU（関連度: 高）
   2. Tanaka et al. 2024 - 足圧センサを用いた動作推定（関連度: 高）
   3. Wang et al. 2025 - Sensor fusion for activity recognition（関連度: 中）
   どの論文を取得しますか？」
```

### Step 4: 補助 DB の確認

```
agent: 「主要な論文は取得しました。補助 DB も検索しますか？
   A: Semantic Scholar で関連論文を探索
   B: CiNii で日本語論文を検索
   C: 今回不要」
```

### Step 5: PDF ダウンロードと完了確認

選択した論文の PDF をローカルにダウンロードします。これをもって 01 の「完了」とします。

```
agent: 「以下の論文をダウンロードします：
   1. LN-001: Smith et al. 2025 - arXiv → download_arxiv
   2. LN-002: Tanaka et al. 2024 - CiNii → 直接ダウンロード不可
   
   LN-002 は自動ダウンロードできませんでした。
   以下の情報を記録します：
     - 論文: Tanaka et al. 2024（足圧センサを用いた動作推定）
     - URL: https://cir.nii.ac.jp/...
     - 理由: CiNii は直接 PDF 提供なし
   
   PDF を入手できたら research/literature/papers/ に配置し、
   「PDF を追加した」と教えてください。」
```

ダウンロード不可の場合は、その理由を screening.md に記録し、あなたに手動確認を依頼します。あなたが PDF を追加したら、agent が screening.md のステータスを「未読」に更新します。

## 論文管理台帳（screening.md）

### ステータス定義

| ステータス | 意味 |
|:----------|:------|
| 未読 | 検索で見つけた、まだ読んでいない |
| 精読中 | 現在読んでいる |
| 精読済 | 読み終えた、LN 作成済み |
| 重要 | 自分の研究に直接関連する重要な論文 |
| 不採用 | 内容が研究と関係ないと判断 |
| 有料 | アクセスに費用がかかる（あなたの判断待ち） |

### 採用理由タグ

| タグ | 説明 |
|:----|:-----|
| ベースライン手法 | 比較対象として採用 |
| 手法の参考 | モデル構造・前処理等が参考になる |
| 理論的根拠 | 実験設計の理論的裏付け |
| 引用（Related Work） | 論文で引用予定 |
| 引用（Method） | 論文の手法説明で引用 |
| 引用（Discussion） | 考察での比較対象 |
| データセット | 使用データセットの提供元 |
| 評価指標 | 評価方法の参考 |
| 実装参考 | コード実装の参考 |
| 却下（関連性低） | 研究と関係なし |
| 却下（有料） | アクセス不可 |

### 台帳の記録形式

```markdown
| # | ステータス | 採用 | タイトル | 著者 | 年 | LN | DB | 検索クエリ | 採用タグ | リンク先 | メモ |
|:-:|:---------:|:----:|---------|:----:|:--:|:--:|:--:|:----------|:--------|:---------|:-----|
| 1 | 精読済 | ✅ | Transformer HAR | Smith | 2025 | LN-001 | arXiv | HAR attention | ベースライン手法 | EXP-001 | 最初のベースライン |
| 2 | 精読済 | ✅ | Foot pressure fusion | Tanaka | 2024 | LN-002 | CiNii | 足圧 動作推定 | 手法の参考 | EXP-003 | 融合方法が参考になる |
| 3 | 精読済 | ⏳ | Attention survey | Wang | 2025 | LN-003 | arXiv | attention survey | 引用（Related Work） | PR-02 | 論文で引用予定 |
```

## Pre-Inspect（実行前検証）

- 検索クエリに誤字・抜けはないか
- 除外すべきキーワードはあるか
- DB の選定は目的に適っているか
- 既に持っている論文と重複しないか（state.yaml の experiments と照合）

## Post-Inspect（実行後検証）

- 取得した PDF は開けるか
- メタデータ（著者・年・DOI）は正確か
- 重要そうな論文を見落としていないか（あなたが確認）
- screening.md の記録に漏れはないか
- 重複して同じ論文を登録していないか

## 出力先

```
research/literature/
├── screening.md         ← 論文管理台帳（全論文の状態・リンクを管理）
└── papers/
    ├── LN-001-author2025-title.pdf    ← ローカルに存在すること
    └── LN-002-author2025-title.pdf    ← （これが 01 の完了条件）
```

## 次のステップ

screening.md に記録 + PDF がローカルに存在することを確認後、02-paper-reading に進むかどうかをあなたと相談する。

## HARD-GATE

- 検索クエリの確認なしに検索を実行してはならない
- あなたの選択なしに PDF をダウンロードしてはならない（有料/無料問わず）
- PDF のダウンロード確認なしに screening.md のステータスを「未読」に設定してはならない
- ダウンロード不可の論文を、理由の記録なしに「不採用」として扱ってはならない
- ダウンロード不可の場合、あなたの手動確認なしに次のステップに進んではならない
- screening.md の記録なしに次のステップに進んではならない
- 不採用の理由を記録せずに論文を破棄してはならない
