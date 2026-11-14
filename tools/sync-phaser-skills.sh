#!/usr/bin/env bash
# Copies the official Phaser agent skills from the installed phaser package into
# .claude/skills/phaser-<name>/ so AI coding agents load Phaser's own guidance.
# Run after upgrading Phaser:  npm install && bash tools/sync-phaser-skills.sh
set -euo pipefail
cd "$(dirname "$0")/.."
src=node_modules/phaser/skills
[ -d "$src" ] || { echo "Run npm install first: $src not found"; exit 1; }
version=$(node -p "require('./node_modules/phaser/package.json').version")
rm -rf .claude/skills/phaser-*
names=$(ls "$src")
for name in $names; do
  dest=".claude/skills/phaser-$name"
  cp -R "$src/$name" "$dest"
  # prefix the skill name, and keep links between Phaser skills working after the rename
  find "$dest" -name '*.md' -print0 | while IFS= read -r -d '' f; do
    NAME="$name" NAMES="$names" perl -0pi -e '
      s/^name: \Q$ENV{NAME}\E(\r?)$/name: phaser-$ENV{NAME}$1/m;
      for my $o (split /\s+/, $ENV{NAMES}) { s#\.\./\Q$o\E/#../phaser-$o/#g }
    ' "$f"
  done
done
echo "Copied $(echo "$names" | wc -w | tr -d ' ') Phaser $version skills into .claude/skills/"
VERSION="$version" perl -pi -e 's/^Phaser version: .*/Phaser version: $ENV{VERSION}/' .claude/skills/README.md
