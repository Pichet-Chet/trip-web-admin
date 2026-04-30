#!/bin/bash
# Phase X: design-token guardrails. Greps for hardcoded tailwind colors that
# should be CSS-var tokens instead, and inline modal patterns that bypass the
# shared <Modal> primitive. Run in CI before merge.
#
# Usage:
#   bash scripts/check-design-tokens.sh
#
# Exit 0 = clean, exit 1 = violations found.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src/app/dashboard"

# Files that intentionally use raw colors:
#   - components/shared/banner.tsx   (defines the variants — uses tailwind directly)
#   - decorative gradients in /dashboard/page.tsx (brand hero)
#   - VISA card-brand badge in /dashboard/upgrade
#   - terms.tsx + privacy.tsx (legal static content)
EXCLUDE_PATHS=(
  "src/components/shared/"
  "src/app/dashboard/terms/"
  "src/app/dashboard/privacy/"
  "src/app/dashboard/refund-policy/"   # static content allowed slate-* etc.
)

errors=0

# 1. Hardcoded blue tokens (should be (--primary))
echo "🔍 Checking for hardcoded blue-* tokens (should be CSS vars)..."
blue_hits=$(grep -rEn '(bg|text|border|ring|shadow|hover:bg|hover:text|hover:border|focus:ring|focus:border|group-hover:text)-blue-(50|100|200|300|400|500|600|700|800|900)' "$SRC" 2>/dev/null \
  | grep -v "from-blue\|via-blue\|to-blue" \
  | grep -vE "$(IFS='|'; echo "${EXCLUDE_PATHS[*]}")" \
  | grep -vE "blur-3xl|blur-2xl" \
  || true)

if [ -n "$blue_hits" ]; then
  # Allowlist VISA badge in upgrade page (semantic card brand color)
  blue_hits=$(echo "$blue_hits" | grep -v 'VISA' || true)
  if [ -n "$blue_hits" ]; then
    echo ""
    echo "❌ Found hardcoded blue-* classes — use bg-(--primary) / text-(--primary) etc:"
    echo "$blue_hits"
    errors=$((errors + 1))
  fi
fi

# 2. Inline modal pattern (should use <Modal>)
echo "🔍 Checking for inline modal overlays (should use shared <Modal>)..."
modal_hits=$(grep -rEn 'fixed inset-0.*bg-(black|slate-900)' "$SRC" 2>/dev/null \
  | grep -vE "$(IFS='|'; echo "${EXCLUDE_PATHS[*]}")" \
  | grep -v "Lightbox" \
  | grep -v "bg-black/90" \
  || true)

if [ -n "$modal_hits" ]; then
  echo ""
  echo "❌ Found inline modal overlays — use <Modal> from @/components/shared:"
  echo "$modal_hits"
  errors=$((errors + 1))
fi

# 3. window.confirm / window.alert / window.prompt (caught by ESLint too,
#    but grep here for fast pre-commit feedback)
echo "🔍 Checking for native browser dialogs..."
dialog_hits=$(grep -rEn '\b(window\.)?(confirm|alert|prompt)\s*\(' "$SRC" 2>/dev/null \
  | grep -vE "useConfirm|setConfirm|confirmText|confirmRef|confirmation|confirmed|alertCount|alertMessage|confirmTimer|confirmOpen|confirmReason|onConfirm|handleConfirm|confirmDialogRef|confirm:|confirmAction|confirmStatus|confirmDelete|confirmLoading|await confirm\(|=\s*confirm\(" \
  || true)

if [ -n "$dialog_hits" ]; then
  echo ""
  echo "❌ Found native browser dialogs — use useConfirm() / useToast() / <Modal> instead:"
  echo "$dialog_hits"
  errors=$((errors + 1))
fi

echo ""
if [ $errors -eq 0 ]; then
  echo "✅ Design-token check passed."
  exit 0
else
  echo "❌ Design-token check failed with $errors violation group(s)."
  echo ""
  echo "See docs/DESIGN-SYSTEM.md for the rules."
  exit 1
fi
