#!/bin/bash
# MyShop — Push to GitHub
# Double-click this file in Finder, or run: bash push_to_github.sh

set -e

cd "$(dirname "$0")"
echo "📦 Staging all changes..."
git add -A

echo "💾 Committing..."
git commit -m "feat: dual-mode theme system with visual builder

- Dual-mode themes: Coded (.tsx registry) + Custom (DB visual builder)
- 20+ config columns: colors, typography, layout, cards, buttons, footer
- DynamicTheme.tsx: fully DB-driven storefront renderer
- Admin theme panel with 7-section visual builder + live preview
- StorefrontClient routes coded vs custom themes
- Shop page fetches and passes full theme config
- Shop owner settings load active themes from Supabase
- themes_migration.sql made idempotent" || echo "ℹ️  Nothing to commit (already committed)"

echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Done! Check: https://github.com/Ravindu-Hettiarachchi/myshop"
read -p "Press Enter to close..."
