#!/bin/bash
# Master Plan Validation Script
# Checks for common architecture and design violations

set -e

echo "🔍 eSports-EXE Master Plan Validator"
echo "====================================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check 1: HUB Isolation
echo "📦 Checking HUB isolation..."

# Check for cross-HUB imports
CROSS_HUB_IMPORTS=$(grep -r "from.*hub-[0-9]-" apps/web/src/hub-*/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "shared/" | wc -l)

if [ "$CROSS_HUB_IMPORTS" -gt 0 ]; then
    echo -e "${RED}❌ FAIL: Found $CROSS_HUB_IMPORTS cross-HUB imports${NC}"
    echo "   HUBs must not import from other HUBs. Use shared/ instead."
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ HUB isolation respected${NC}"
fi

# Check 2: Design Token Usage
echo ""
echo "🎨 Checking design token usage..."

# Check for hardcoded colors (common hex codes not in token list)
HARDCODED_COLORS=$(grep -r "#FF4655\|#00D4AA\|#0F1419" apps/web/src --include="*.tsx" --include="*.css" 2>/dev/null | wc -l)

if [ "$HARDCODED_COLORS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Found $HARDCODED_COLORS potential hardcoded colors${NC}"
    echo "   Use Tailwind classes or CSS variables instead."
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ No hardcoded colors found${NC}"
fi

# Check 3: TypeScript Compliance
echo ""
echo "🔷 Checking TypeScript..."

cd apps/web

if pnpm tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✓ TypeScript compiles without errors${NC}"
else
    echo -e "${RED}❌ FAIL: TypeScript errors detected${NC}"
    echo "   Run 'pnpm typecheck' to see details."
    ERRORS=$((ERRORS + 1))
fi

cd ../..

# Check 4: Documentation Presence
echo ""
echo "📚 Checking documentation..."

if [ -f "docs/master-plan/master-plan.md" ]; then
    echo -e "${GREEN}✓ Master Plan exists${NC}"
else
    echo -e "${RED}❌ FAIL: Master Plan missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "docs/adrs/README.md" ]; then
    echo -e "${GREEN}✓ ADR index exists${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: ADR index missing${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 5: Test Coverage (if tests exist)
echo ""
echo "🧪 Checking for tests..."

TEST_FILES=$(find apps/web/src -name "*.test.{ts,tsx}" -o -name "*.spec.{ts,tsx}" 2>/dev/null | wc -l)

if [ "$TEST_FILES" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: No test files found${NC}"
    echo "   Consider adding tests for critical components."
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ Found $TEST_FILES test files${NC}"
fi

# Check 6: Component Documentation
echo ""
echo "📝 Checking component documentation..."

UNDOCUMENTED_COMPONENTS=0

for file in apps/web/src/components/ui/*.tsx; do
    if [ -f "$file" ]; then
        # Check for JSDoc comment
        if ! grep -q "/\*\*" "$file"; then
            UNDOCUMENTED_COMPONENTS=$((UNDOCUMENTED_COMPONENTS + 1))
        fi
    fi
done

if [ "$UNDOCUMENTED_COMPONENTS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: $UNDOCUMENTED_COMPONENTS UI components lack JSDoc${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ UI components are documented${NC}"
fi

# Summary
echo ""
echo "====================================="
echo "📊 Validation Summary"
echo "====================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo "Project is compliant with Master Plan."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PASSED WITH WARNINGS${NC}"
    echo "Warnings: $WARNINGS"
    echo "Review warnings above."
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Fix errors before committing."
    exit 1
fi
