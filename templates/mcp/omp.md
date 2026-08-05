# MCP 設定（プロジェクト固定 — OMP）

プロジェクト初期化時に選択した MCP ツール一覧。

更新日: —

## main agent（OMP）

| MCP | 状態 | 使用 stage |
|:----|:----|:----------|
| paper-search | ✅ 使用 | 01, 02 |
| notion | ✅ 使用 | 00（同期時） |
| github | ✅ 使用 | 全般 |

## subagent（agy / opencode）

MCP は各 agent CLI の設定ファイルで管理：
- agy: `~/.gemini/config/mcp_config.json`
- opencode: `~/.config/opencode/opencode.json`

## 非同期サブエージェント

主 agent が `task` tool で subagent を呼ぶと、**デフォルトでバックグラウンド実行**されます。
会話を妨げず、完了時に結果が主 agent に自動配信されます。

- **設定**: `async.enabled: true`（OMP 公式設定・確認済み。`async.maxJobs: 100`）
- **同期が必要な場合**: agent 定義の `blocking: true` のみ同期実行（主 agent は結果を待つ）
- **結果の受け取り**: subagent の `yield` で自動配信。`hub jobs` / `hub wait` でも確認可能

### job 数運用ガイドライン

同時実行 job 数の目安（ホストの CPU/メモリに合わせて調整）:

- **通常運用**: 並列 job は最大 3 つまで
- **論文検索 stage（01〜02）**: paper-search MCP の rate limit を考慮し最大 2 並列
- **コード生成・分析 stage**: opencode-agent は重いため 1 並列推奨
- **超過時**: 新規 task 発行前に既存 job の完了を確認してから発行する

## subagent 失敗時のフォールバック規約

1. **リトライ 1 回**: 同一 task を同じ agent に再発行する（待機 5 秒推奨）
2. **リトライ失敗**: 主 agent は以下の内容をユーザーに明示報告する
   - 失敗した task の概要
   - エラーメッセージ（stderr / exit code）
   - 後続 stage への影響（ブロッカーか否か）
   - ユーザーへの推奨アクション（手動実行 or スキップ）
3. **代替 agent 切替**: agy-agent 失敗 → opencode-agent への切替を検討してよい（逆も可）
