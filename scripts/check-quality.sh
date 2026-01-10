#!/bin/bash

# ✅ Script de vérification qualité LELE HCM Portal
# Usage: npm run check-quality

set -e  # Exit on error

echo "🔍 =================================="
echo "🔍 LELE HCM - Quality Check"
echo "🔍 =================================="
echo ""

# 1. Linter
echo "📝 [1/5] Running ESLint..."
npm run lint
echo "✅ Lint passed!"
echo ""

# 2. Tests
echo "🧪 [2/5] Running tests..."
npm test -- --run
echo "✅ Tests passed!"
echo ""

# 3. Build
echo "🏗️  [3/5] Building project..."
npm run build
echo "✅ Build successful!"
echo ""

# 4. Bundle size analysis
echo "📦 [4/5] Analyzing bundle size..."
MAIN_BUNDLE=$(ls -lh dist/assets/index-*.js | awk '{print $5, $9}')
echo "Main bundle: $MAIN_BUNDLE"

# Extract size in KB for comparison
SIZE_KB=$(ls -l dist/assets/index-*.js | awk '{print $5}')
MAX_SIZE=$((500 * 1024))  # 500KB

if [ "$SIZE_KB" -lt "$MAX_SIZE" ]; then
  echo "✅ Bundle size under 500KB!"
else
  echo "⚠️  Warning: Bundle size over 500KB"
fi
echo ""

# 5. TypeScript 'any' check
echo "🔒 [5/5] Checking for 'any' types..."
ANY_COUNT=$(grep -rn ": any" src --include="*.ts" --include="*.tsx" | grep -v "test.tsx" | wc -l | tr -d ' ')

echo "Found $ANY_COUNT 'any' types in source code"

if [ "$ANY_COUNT" -eq "0" ]; then
  echo "✅ No 'any' types found - Perfect type safety!"
elif [ "$ANY_COUNT" -lt "10" ]; then
  echo "⚠️  Warning: $ANY_COUNT 'any' types remaining"
else
  echo "❌ Too many 'any' types ($ANY_COUNT) - Target: <10"
  exit 1
fi
echo ""

# Summary
echo "========================================="
echo "🎉 Quality Check Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✅ Linting: PASSED"
echo "  ✅ Tests: PASSED"
echo "  ✅ Build: PASSED"
echo "  ✅ Bundle: $([ "$SIZE_KB" -lt "$MAX_SIZE" ] && echo "PASSED" || echo "WARNING")"
echo "  ✅ Type Safety: $([ "$ANY_COUNT" -eq "0" ] && echo "PERFECT" || echo "$ANY_COUNT any remaining")"
echo ""
echo "🚀 Ready for deployment!"
