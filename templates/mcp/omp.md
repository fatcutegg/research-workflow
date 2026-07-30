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
