---
name: 07-presentation
description: 発表資料を作成する。Anthropic PPTX skill を使用し、テンプレート管理と逐頁討論を行う。
mode: collaborative
language: ja
---

# 発表資料作成

## 実行環境

- **共通設定**: 00-orchestrator（共通実行環境）を参照すること
- **conda env**: `research-{プロジェクトディレクトリ名}` を使用する
- **Python 依存**: `research/requirements.txt` で管理
- **生成ツール**: Anthropic PPTX skill（`anthropics/skills/skills/pptx/`）

## 目的

組会用進捗発表（progress）または学会発表（final）のスライドを作成します。Anthropic PPTX skill を使用して生成し、テンプレート管理と逐頁討論を行います。

## トリガー

- 「発表資料を作って」
- 「スライドを生成して」
- 「組会用の進捗をまとめて」
- 「学会発表の準備をしたい」

## モード

| mode | 用途 | 枚数 | 言語 |
|:----|:-----|:----:|:----:|
| progress | 定例組会進捗発表 | 5-10枚 | 日本語 |
| final | 学会発表・最終発表 | 15-30枚 | 日本語／英語 |

## テンプレート管理

スライド生成時にテンプレートの有無を確認します。

```
あなた：「発表資料を作って」

agent: 「テンプレートを使用しますか？
   A: 既存のテンプレートを使う
   B: 新しいテンプレートを作る
   C: テンプレートなし（毎回 1 から決める）」

  A の場合:
    「research/presentations/templates/ にあるテンプレートを確認します」
    
  B の場合:
    「新しいテンプレートの構成を決めましょう」
```

テンプレートは `research/presentations/templates/` に保存します。

### progress mode 標準構成（例）

```
1. タイトル（研究タイトル・氏名）
2. 研究背景と目的
3. 前回までの進捗
4. 今回の実験（手法）
5. 実験結果（図・表）
6. 考察
7. 今後の予定
```

### final mode 標準構成（例）

```
1. タイトル
2. 背景と目的
3. 関連研究
4. 提案手法
5. 実験設定
6. 実験結果
7. 考察
8. まとめと今後の課題
```

## 討論フェーズ

### Step 1: モードと構成の確認

```
agent: 「今回は progress mode で進めます。
   標準構成で良いですか？
   A: 標準構成（7枚）
   B: カスタマイズ（追加・削除・順序変更）」
```

### Step 2: 逐頁討論

各スライドの内容を 1 枚ずつ確認します。

```
agent: 「1 枚目：タイトルスライド
   タイトル: 「IMU と足圧センサを用いた日常動作推定の精度向上」
   氏名: {あなたの氏名}
   研究室: {研究室名}
   これで良いですか？」

あなた：「タイトルを少し短くして」
```

Direction Check:

- 各スライドの情報量は適切か（1 枚に詰め込みすぎていないか）
- 図は適切に配置されているか
- 強調すべき結果は明確か
- progress mode の場合、前回からの差分が伝わるか

### Step 3: 生成

全てのスライドの内容が確定したら、Anthropic PPTX skill を使用して pptx ファイルを生成します。

```
生成パス: research/presentations/{mode}-{日付}-{説明}.pptx
```

## Pre-Inspect（実行前検証）

- モード（progress / final）は明確か
- 各スライドの内容は確定しているか
- 参照する FG / TB は存在するか
- テンプレートが選択されているか（または新規作成）
- PS counter の現在値を確認する（state.yaml）

## Post-Inspect（実行後検証）

- pptx ファイルは正しく生成されたか
- 図は適切に埋め込まれているか
- 文字化け・レイアウト崩れはないか
- あなたが内容を確認したか
- 生成ファイルは research/presentations/ に保存されたか
- PS counter を更新し、実際のファイル数と一致するか確認する
- 不整合があれば実ファイル数を優先して修正する

## 出力先

```
research/presentations/
├── templates/                     ← テンプレート（再利用可能）
│   ├── progress-template.pptx
│   └── final-template.pptx
├── progress-{日付}-{説明}.pptx    ← 生成物
└── final-{日付}-{説明}.pptx
```

反映先:

```
research/state.yaml   ← PS counter 更新
```

## 次のステップ

発表後、Review に戻るか、研究サイクルを継続する。

## HARD-GATE

- 各スライドの内容確認なしに pptx を生成してはならない
- テンプレートが未選択の状態で生成を開始してはならない
- 参照する図のパスが存在するか確認せずに埋め込んではならない
- 生成後、あなたの確認なしに最終版とみなしてはならない
- progress mode と final mode を混同してはならない
