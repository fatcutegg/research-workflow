# 研究プロダクト管理台帳

Git で管理しないファイル（PDF・実験結果・ログ・PPTX）は外部ストレージに保存する。

## 外部ストレージ

- **ルート**: `/{プロジェクト名}/`
  - 例: `/HAR/`

## 管理対象

| 種別 | ローカルパス | 外部ストレージパス | 備考 |
|:-----|:-----------|:-----------------|:-----|
| 論文 PDF | literature/papers/LN-{番号}-{著者}.pdf | /{プロジェクト名}/literature/papers/ | 01 で取得 |
| 実験結果 | experiments/EXP-{番号}/results/ | /{プロジェクト名}/experiments/EXP-{番号}/results/ | metrics + figures |
| 学習ログ | experiments/EXP-{番号}/logs/ | /{プロジェクト名}/experiments/EXP-{番号}/logs/ | train log |
| スナップショット | experiments/EXP-{番号}/snapshots/ | /{プロジェクト名}/experiments/EXP-{番号}/snapshots/ | 実行履歴 |
| 公開データセット | data/raw/{データ名}/ | /{プロジェクト名}/data/raw/ | 公開データのみ（自己収集データは非保存） |
| 前処理済みデータ | data/processed/EXP-{番号}/ | /{プロジェクト名}/data/processed/EXP-{番号}/ | 匿名化済み |
| PPTX | presentations/{mode}-{日付}.pptx | /{プロジェクト名}/presentations/ | 発表資料 |

## ルール

- Git 管理外ファイルは `.gitignore` に記載する
- 各 stage 完了時（Post-Inspect 後）に該当ファイルを外部ストレージにアップロードする
- アップロードしたら manifest.md の該当行にアップロード日を追記する
- プライバシーに関わるデータ（被験者情報等）は外部ストレージにも保存せず、ローカルのみで管理する
