#!/usr/bin/env bash
#
# research-workflow — install.sh
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/fatcutegg/research-workflow/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash -s -- --omp
#

set -euo pipefail

REPO="https://github.com/fatcutegg/research-workflow.git"
USE_SYMLINK=false
IS_OMP=false

for arg in "$@"; do
  case "$arg" in
    --symlink) USE_SYMLINK=true ;;
    --omp) IS_OMP=true ;;
    --help|-h)
      echo "Usage: curl ... | bash"
      echo "       curl ... | bash -s -- --omp"
      echo "       curl ... | bash -s -- --symlink"
      echo ""
      echo "Installs research-workflow SKILL.md files"
      exit 0 ;;
  esac
done

if [ "$IS_OMP" = true ]; then
  TARGET="${HOME}/.agents/skills"
else
  TARGET="${HOME}/.config/opencode/skills"
fi

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

# OMP: install agent definitions
if [ "$IS_OMP" = true ]; then
  OMP_AGENTS="${HOME}/.omp/agents"
  mkdir -p "${OMP_AGENTS}"
  cd "${TMPDIR}/research-workflow/templates/agents"
  for f in *.md; do
    [ -f "$f" ] || continue
    dest="${OMP_AGENTS}/${f}"
    if [ -f "$dest" ]; then
      echo "  skip  agents/${f} (already exists)"
      continue
    fi
    if [ "$USE_SYMLINK" = true ]; then
      ln -sfn "$(pwd)/${f}" "${dest}"
    else
      cp "$f" "${dest}"
    fi
    echo "  copy  agents/${f}"
  done
  echo ""
  echo "Agent definitions installed to ${OMP_AGENTS}"
fi

echo ""
if [ "$IS_OMP" = true ]; then
  echo "OMP users: enable agents project skills in your config."
else
  echo "Add the following to opencode.json if not already present:"
  echo '  "skills": ["~/.config/opencode/skills"]'
fi
