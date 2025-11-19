#!/bin/bash
# A script to create the DeepSession v3 directory structure safely.
# Run from your project's root directory.

set -euo pipefail

echo "🔧 Building v3 architecture in ./app ..."

# Helper: create directory if not exists
create_dir() {
  local dir="$1"
  if [ -d "$dir" ]; then
    echo "📂 Directory already exists: $dir"
  else
    mkdir -p "$dir" && echo "✅ Created directory: $dir"
  fi
}

# Helper: create file if not exists
create_file() {
  local file="$1"
  if [ -e "$file" ]; then
    echo "📄 File already exists: $file"
  else
    touch "$file" && echo "✅ Created file: $file"
  fi
}

# 1. Directories
dirs=(
  "app/(auth)/login"
  "app/(auth)/signup"
  "app/(authed)/dashboard"
  "app/(authed)/sessions"
  "app/(authed)/goals"
  "app/(authed)/analytics"
  "app/(authed)/export"
)

for d in "${dirs[@]}"; do
  create_dir "$d"
done

# 2. Files
files=(
  "app/(auth)/login/page.tsx"
  "app/(auth)/signup/page.tsx"
  "app/(authed)/layout.tsx"
  "app/(authed)/dashboard/page.tsx"
  "app/(authed)/sessions/page.tsx"
  "app/(authed)/goals/page.tsx"
  "app/(authed)/analytics/page.tsx"
  "app/(authed)/export/page.tsx"
  "app/layout.tsx"
  "app/page.tsx"
)

for f in "${files[@]}"; do
  create_file "$f"
done

echo "🎉 DeepSession v3 structure setup complete."
