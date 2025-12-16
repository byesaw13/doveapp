#!/bin/bash

# Monthly Cleanup Check Script
# Run this monthly to identify unused code and maintain codebase health

set -e

echo "=================================================="
echo "  DoveApp Monthly Cleanup Check"
echo "  $(date)"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check for unused code
echo "1️⃣  Checking for unused code..."
node scripts/find-unused-code.js > /tmp/unused-code-output.txt 2>&1
if [ $? -eq 0 ]; then
    print_status 0 "Unused code analysis complete"
    cat /tmp/unused-code-output.txt
else
    print_status 1 "Unused code analysis failed"
fi
echo ""

# 2. Check dependencies with depcheck
echo "2️⃣  Checking dependencies with depcheck..."
npx depcheck --json > depcheck-results.json 2>&1
if [ $? -eq 0 ]; then
    print_status 0 "Dependency check complete"
    echo "   Results saved to depcheck-results.json"
else
    print_status 1 "Dependency check failed"
fi
echo ""

# 3. Run TypeScript type check
echo "3️⃣  Running TypeScript type check..."
npm run type-check > /tmp/type-check-output.txt 2>&1
if [ $? -eq 0 ]; then
    print_status 0 "No type errors found"
else
    print_status 1 "Type errors found"
    head -20 /tmp/type-check-output.txt
fi
echo ""

# 4. Run ESLint
echo "4️⃣  Running ESLint..."
npm run lint > /tmp/lint-output.txt 2>&1
if [ $? -eq 0 ]; then
    print_status 0 "No linting errors found"
else
    print_status 1 "Linting errors found"
    head -20 /tmp/lint-output.txt
fi
echo ""

# 5. Check for large files
echo "5️⃣  Checking for large files (>500KB)..."
large_files=$(find . -type f -size +500k ! -path "./node_modules/*" ! -path "./.next/*" ! -path "./.git/*" 2>/dev/null)
if [ -z "$large_files" ]; then
    print_status 0 "No unusually large files found"
else
    print_warning "Large files found:"
    echo "$large_files" | while read file; do
        size=$(du -h "$file" | cut -f1)
        echo "   - $file ($size)"
    done
fi
echo ""

# 6. Check for TODO/FIXME comments
echo "6️⃣  Checking for TODO/FIXME comments..."
todo_count=$(grep -r "TODO\|FIXME" app/ components/ lib/ 2>/dev/null | wc -l)
echo "   Found $todo_count TODO/FIXME comments"
if [ $todo_count -gt 50 ]; then
    print_warning "High number of TODO/FIXME comments"
else
    print_status 0 "Reasonable number of TODO/FIXME comments"
fi
echo ""

# 7. Check bundle size (if built)
echo "7️⃣  Checking for .next build..."
if [ -d ".next" ]; then
    print_status 0 ".next directory exists"
    if [ -f ".next/BUILD_ID" ]; then
        build_id=$(cat .next/BUILD_ID)
        echo "   Build ID: $build_id"
        
        # Calculate rough bundle size
        if [ -d ".next/static" ]; then
            bundle_size=$(du -sh .next/static 2>/dev/null | cut -f1)
            echo "   Static bundle size: $bundle_size"
        fi
    fi
else
    print_warning "No build found - run 'npm run build' to check bundle size"
fi
echo ""

# 8. Summary
echo "=================================================="
echo "  Summary & Recommendations"
echo "=================================================="
echo ""

# Check if reports exist and parse them
if [ -f "unused-code-report.json" ]; then
    echo "📊 Reports generated:"
    echo "   - unused-code-report.json"
    echo "   - depcheck-results.json"
    echo "   - CLEANUP_RECOMMENDATIONS.md"
    echo ""
fi

echo "💡 Next Steps:"
echo "   1. Review CLEANUP_RECOMMENDATIONS.md"
echo "   2. Remove unused dependencies"
echo "   3. Fix linting and type errors"
echo "   4. Address TODO/FIXME comments"
echo "   5. Run 'npm run build' to verify everything works"
echo ""

echo "=================================================="
echo "  Cleanup check complete!"
echo "=================================================="
