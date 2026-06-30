#!/usr/bin/env bash
# Links crossub_web's api-contract into packages/ for local monorepo-style dev.
# On Render/CI without a sibling crossub_web checkout, install from GitHub Packages
# instead (set GITHUB_TOKEN with read:packages).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/../../crossub_web/packages/api-contract"
LINK="$ROOT/packages/api-contract"

if [ ! -f "$SOURCE/package.json" ]; then
  echo "→ crossub_web api-contract not found at $SOURCE (skipping local link)" >&2
  exit 0
fi

mkdir -p "$ROOT/packages"
ln -sfn "../../crossub_web/packages/api-contract" "$LINK"
echo "→ Linked $LINK → crossub_web/packages/api-contract" >&2
