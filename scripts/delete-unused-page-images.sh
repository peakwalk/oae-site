#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
manifest_path="${1:-$script_dir/unused-page-images.txt}"

if [[ "$manifest_path" != /* ]]; then
  manifest_path="$repo_root/$manifest_path"
fi

if [[ ! -f "$manifest_path" ]]; then
  printf 'Manifest not found: %s\n' "$manifest_path" >&2
  exit 1
fi

cd "$repo_root"

filtered_manifest="$(mktemp)"
trap 'rm -f "$filtered_manifest"' EXIT

grep -Ev '^[[:space:]]*(#|$)' "$manifest_path" > "$filtered_manifest" || true

if [[ ! -s "$filtered_manifest" ]]; then
  printf 'Manifest is empty: %s\n' "$manifest_path"
  exit 0
fi

git rm -f --ignore-unmatch --pathspec-from-file="$filtered_manifest"

printf 'Removed tracked files listed in %s\n' "$manifest_path"
