#!/usr/bin/env bash
# Quick setup script for Operis development from source
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT_DIR="$(pwd)"

echo "=== Operis Dev Setup ==="
echo "Working directory: $ROOT_DIR"
echo ""

# Step 1: Install dependencies
echo "[1/4] Installing dependencies..."
pnpm install

# Step 2: Build
echo "[2/4] Building project..."
pnpm build

# Step 3: Build UI
echo "[3/4] Building UI..."
pnpm ui:build

# Step 4: Link globally
echo "[4/4] Linking operis globally..."
pnpm setup 2>/dev/null || true
source ~/.zshrc 2>/dev/null || source ~/.bashrc 2>/dev/null || true
pnpm link --global

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Commands available:"
echo "  operis --help              Show help"
echo "  operis onboard             First time setup"
echo "  operis gateway run         Start gateway"
echo "  operis channels status     Check connections"
echo "  operis tui                 Terminal UI"
echo ""
echo "Or via pnpm:"
echo "  pnpm operis <command>"
echo "  pnpm gateway:watch"
