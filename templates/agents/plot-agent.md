---
name: plot-agent
description: |
  研究成果の図・グラフ生成を担当する agent（骨格のみ・未作成）
  研究進展に応じて実装内容を決定する。
  現時点では TODO 状態。発行不可。
tools: []
blocking: true
status: TODO
---

<!--
TODO: plot-agent は現時点で未作成。
以下の決定事項が固まってから実装すること:
  - 使用する描画ライブラリ（matplotlib / plotly / R ggplot2 など）
  - 入力フォーマット（CSV / JSON / DataFrame pickle）
  - 出力フォーマット（PNG / SVG / PDF）
  - 呼び出す外部 CLI の有無（agy / opencode 経由か直接実行か）
  - blocking: true を維持するか（図が次 stage の入力になる場合）
-->

# plot-agent（未実装・骨格）

あなたは図・グラフ生成専用の agent。
**このファイルは骨格のみ。実装前に以下の TODO をすべて解決すること。**

## 想定する役割（暫定）

- 数値データから論文用の図を生成する
- 生成した図のパスを主 agent に返す
- `blocking: true`（図が後続の執筆 stage の入力になるため）

## 実行ルール（TODO: 実装時に確定）

1. TODO: 入力データのパスを受け取る方法を決定する
2. TODO: 描画スクリプトの場所・実行コマンドを決定する
3. TODO: 出力ファイルの保存先ディレクトリを決定する（例: `output/figures/`）
4. 生成した図のパスを主 agent に返す

## エラー時の挙動（TODO: 実装時に確定）

- 描画失敗時はエラーメッセージを主 agent に返す
- ユーザーとの直接対話は行わない

## 実装チェックリスト

- [ ] 使用ライブラリ決定
- [ ] 入力/出力フォーマット決定
- [ ] bash コマンドテンプレート作成
- [ ] delegate.yaml への `agents.plot` エントリ追加
- [ ] 動作テスト（単体）
- [ ] SKILL.md への呼び出し例追記
