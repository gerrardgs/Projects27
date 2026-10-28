#!/usr/bin/env bash
# Installs the Projects 27 agent rules and skills into a project without overwriting existing files.
#
# Usage (download, read, then run; pin <commit> to a full commit SHA, which cannot be changed later):
#   curl -fsSLo install.sh https://raw.githubusercontent.com/gerrardgs/Projects27/<commit>/scripts/install.sh
#   bash install.sh --ref <commit> [options] [target-dir]
#
# Options:
#   --ref <ref>       commit SHA (recommended: immutable), tag or branch to install (default: main)
#   --source <dir>    install from a local checkout instead of downloading
#   --force           overwrite files that already exist and differ
#   --dry-run         show what would happen without writing anything
#   -h, --help        show this help
#
# Installed: AGENTS.md, CLAUDE.md, GEMINI.md, .aider.conf.yml, .gemini/settings.json,
#            .github/copilot-instructions.md, .agents/ (rules and skills), scripts/agents-sync.mjs,
#            .claude/settings.json and scripts/hooks/guard-deletions.mjs (deletion guard for Claude Code),
#            scripts/check-authorship.mjs (fails when a commit credits an AI agent),
#            scripts/tech-lookup.mjs (registry and end-of-life lookups),
#            scripts/run-quiet.mjs (runs commands and prints only a summary, to save agent tokens),
#            docs/spec/DESIGN-REFERENCES.md, TOOLKIT.md, PROMPT-LIBRARY.md, ENGINEERING-CONCEPTS.md (linked from AGENTS.md).
# Never installed: README, LICENSE, CHANGELOG, .gitignore, other docs or workflows. Those belong to your project.

set -euo pipefail

REPOSITORY="gerrardgs/Projects27"
REF="${UCNA_REF:-main}"
SOURCE_DIR="${UCNA_SOURCE_DIR:-}"
TARGET_DIR="."
FORCE=0
DRY_RUN=0

SPEC_FILES=(
  "AGENTS.md"
  "CLAUDE.md"
  "GEMINI.md"
  ".aider.conf.yml"
  ".gemini/settings.json"
  ".github/copilot-instructions.md"
  "scripts/agents-sync.mjs"
  ".claude/settings.json"
  "scripts/hooks/guard-deletions.mjs"
  "scripts/check-authorship.mjs"
  "scripts/tech-lookup.mjs"
  "scripts/run-quiet.mjs"
  "docs/spec/DESIGN-REFERENCES.md"
  "docs/spec/TOOLKIT.md"
  "docs/spec/PROMPT-LIBRARY.md"
  "docs/spec/ENGINEERING-CONCEPTS.md"
)
SPEC_DIRECTORIES=(".agents")

usage() {
  sed -n '2,21p' "$0" 2>/dev/null | sed 's/^# \{0,1\}//' || true
}

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --ref)
      [ "$#" -ge 2 ] || die "--ref needs a value"
      REF="$2"
      shift 2
      ;;
    --source)
      [ "$#" -ge 2 ] || die "--source needs a directory"
      SOURCE_DIR="$2"
      shift 2
      ;;
    --force) FORCE=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h | --help) usage; exit 0 ;;
    -*) die "unknown option: $1 (use --help)" ;;
    *) TARGET_DIR="$1"; shift ;;
  esac
done

[ -d "$TARGET_DIR" ] || die "target directory does not exist: $TARGET_DIR"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

if [ -n "$SOURCE_DIR" ]; then
  [ -f "$SOURCE_DIR/AGENTS.md" ] || die "--source does not look like a Projects 27 spec checkout: $SOURCE_DIR"
  SOURCE_DIR="$(cd "$SOURCE_DIR" && pwd)"
  printf 'Installing Projects 27 spec from %s\n' "$SOURCE_DIR"
else
  command -v curl >/dev/null 2>&1 || die "curl is required"
  command -v tar >/dev/null 2>&1 || die "tar is required"
  ARCHIVE_URL="https://github.com/${REPOSITORY}/archive/${REF}.tar.gz"
  printf 'Downloading Projects 27 spec (%s) from %s\n' "$REF" "$ARCHIVE_URL"
  curl -fsSL "$ARCHIVE_URL" -o "$WORK_DIR/spec.tar.gz" || die "download failed; check the --ref value and your network"
  mkdir "$WORK_DIR/extract"
  tar -xzf "$WORK_DIR/spec.tar.gz" -C "$WORK_DIR/extract"
  SOURCE_DIR="$(find "$WORK_DIR/extract" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
  [ -f "$SOURCE_DIR/AGENTS.md" ] || die "downloaded archive does not contain AGENTS.md"
fi
printf 'Target: %s\n\n' "$TARGET_DIR"

list_files() {
  local relative_path
  for relative_path in "${SPEC_FILES[@]}"; do
    [ -f "$SOURCE_DIR/$relative_path" ] && printf '%s\n' "$relative_path"
  done
  for relative_path in "${SPEC_DIRECTORIES[@]}"; do
    [ -d "$SOURCE_DIR/$relative_path" ] || continue
    (cd "$SOURCE_DIR" && find "$relative_path" -type f \
      ! -path '*/node_modules/*' ! -path '*/__pycache__/*' ! -path '*/.venv/*' \
      ! -path '*/.mypy_cache/*' ! -path '*/.ruff_cache/*' ! -name '.DS_Store' | LC_ALL=C sort)
  done
}

installed=0
unchanged=0
skipped=0
skipped_list=""

while IFS= read -r relative_path; do
  source_file="$SOURCE_DIR/$relative_path"
  target_file="$TARGET_DIR/$relative_path"
  if [ -e "$target_file" ]; then
    if cmp -s "$source_file" "$target_file"; then
      unchanged=$((unchanged + 1))
      continue
    fi
    if [ "$FORCE" -ne 1 ]; then
      skipped=$((skipped + 1))
      skipped_list="${skipped_list}  ${relative_path}"$'\n'
      continue
    fi
  fi
  installed=$((installed + 1))
  if [ "$DRY_RUN" -eq 1 ]; then
    printf '  would write %s\n' "$relative_path"
  else
    mkdir -p "$(dirname "$target_file")"
    cp "$source_file" "$target_file"
    printf '  wrote %s\n' "$relative_path"
  fi
done < <(list_files)

printf '\n%d written, %d already up to date, %d kept because they differ\n' "$installed" "$unchanged" "$skipped"
if [ "$skipped" -gt 0 ]; then
  printf '\nThese existing files were NOT changed:\n%s' "$skipped_list"
  printf 'Merge them by hand, or re-run with --force to overwrite them.\n'
fi

if [ -f "$TARGET_DIR/CLAUDE.md" ] && ! grep -qx '@AGENTS.md' "$TARGET_DIR/CLAUDE.md"; then
  printf '\nNote: your CLAUDE.md does not import AGENTS.md. Add a line "@AGENTS.md" so Claude Code loads the rules.\n'
fi

if [ "$DRY_RUN" -eq 1 ]; then
  printf '\nDry run: nothing was written.\n'
  exit 0
fi

if command -v node >/dev/null 2>&1 && [ -f "$TARGET_DIR/scripts/agents-sync.mjs" ]; then
  printf '\nGenerating .claude/skills and validating (node scripts/agents-sync.mjs):\n'
  (cd "$TARGET_DIR" && node scripts/agents-sync.mjs) || printf 'Validation reported problems; see the messages above.\n'
else
  printf '\nNode.js was not found. Install Node.js 22 or later, then run: node scripts/agents-sync.mjs\n'
fi

printf '\nNext: fill in section 8 ("Project profile") of AGENTS.md with your real commands, then commit the files.\n'
