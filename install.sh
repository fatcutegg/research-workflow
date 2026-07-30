#!/usr/bin/env bash
#
# research-workflow — install.sh
# Installs SKILL.md files to ~/.config/opencode/skills/
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/fatcutegg/research-workflow/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/fatcutegg/research-workflow/main/install.sh | bash -s -- --symlink
#

set -euo pipefail

REPO="https://github.com/fatcutegg/research-workflow.git"
TARGET="${HOME}/.config/opencode/skills"
USE_SYMLINK=false

for arg in "$@"; do
  case "$arg" in
    --symlink) USE_SYMLINK=true ;;
    --help|-h)
      echo "Usage: curl -fsSL https://raw.githubusercontent.com/fatcutegg/research-workflow/main/install.sh | bash"
      echo "       curl ... | bash -s -- --symlink"
      echo ""
      echo "Installs research-workflow SKILL.md files to ${TARGET}"
      exit 0 ;;
  esac
done

TMPDIR=$(mktemp -d)
trap 'rm -rf "${TMPDIR}"' EXIT

echo "==> Cloning research-workflow..."
git clone --depth 1 "${REPO}" "${TMPDIR}/research-workflow"

mkdir -p "${TARGET}"

cd "${TMPDIR}/research-workflow/skills"
count=0
for dir in 0*/; do
  name="${dir%/}"
  dest="${TARGET}/${name}"
  if [ -d "${dest}" ] && [ -f "${dest}/SKILL.md" ]; then
    echo "  skip  ${name} (already exists)"
    continue
  fi
  if [ "$USE_SYMLINK" = true ]; then
    ln -sfn "$(pwd)/${name}" "${dest}"
    echo "  link  ${name}"
  else
    cp -r "${name}" "${dest}"
    echo "  copy  ${name}"
  fi
  count=$((count + 1))
done

echo ""
echo "${count} skill(s) installed to ${TARGET}"
echo "Add the following to opencode.json if not already present:"
echo '  "skills": ["~/.config/opencode/skills"]'
