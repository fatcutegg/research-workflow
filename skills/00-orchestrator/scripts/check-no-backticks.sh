#!/usr/bin/env bash
#
# check-no-backticks.sh — workflow スクリプト／brief の反引号を検出する
#
# workflow スクリプト内で反引号（バッククォート）を使うと、シェルがコマンド置換として
# 解釈して実行が失敗する。過去に 10 回失敗したため、実行前のチェックを必須にしている。
#
# 使い方:
#   check-no-backticks.sh FILE...
#
# 終了コード:
#   0  反引号なし（または該当ファイルなし）
#   1  反引号を検出
#   2  引数なし
#
set -u

usage() {
  printf 'usage: %s FILE...\n' "$(basename "$0")"
  printf 'workflow スクリプト／brief に含まれる反引号を検出する。引用は「」を使う。\n'
}

if [ "$#" -eq 0 ]; then
  usage
  exit 2
fi

BACKTICK=$(printf '\140')   # 文字列リテラルで反引号を書かないための回避

status=0
for f in "$@"; do
  if [ ! -f "$f" ]; then
    printf 'skip: %s（ファイルが無い）\n' "$f"
    continue
  fi
  hits=$(grep -n -F "$BACKTICK" "$f")
  if [ -n "$hits" ]; then
    printf 'NG: %s\n' "$f"
    printf '%s\n' "$hits" | sed 's/^/  /'
    status=1
  else
    printf 'OK: %s\n' "$f"
  fi
done

if [ "$status" -eq 1 ]; then
  printf '\n反引号を「」に置き換えるか削除してから再実行すること。\n'
fi

exit "$status"
