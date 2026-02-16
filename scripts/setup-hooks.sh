#!/bin/bash
# Setup git hooks for the project

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
HOOKS_DIR="$ROOT_DIR/.git/hooks"

echo "Setting up git hooks..."

# Create pre-commit hook
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/sh
# Pre-commit hook: Run preflight checks before allowing commit

echo "Running preflight checks..."
npm run preflight

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Pre-commit hook failed: preflight checks did not pass"
  echo "Fix the errors above before committing."
  exit 1
fi

echo ""
echo "✅ Pre-commit checks passed - proceeding with commit"
exit 0
EOF

chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Git hooks installed successfully!"
echo ""
echo "The pre-commit hook will now run 'npm run preflight' before each commit."
echo "To bypass the hook (not recommended), use: git commit --no-verify"
