#!/bin/bash

# Gist Blog Installation Script

set -e

echo "🚀 Installing Gist CLI..."

# Check for Go
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.19 or later."
    echo "   Visit: https://golang.org/dl/"
    exit 1
fi

# Build the gist CLI
echo "📦 Building gist command..."
go build -o gist cmd/gist/main.go

# Get current directory for symlink
GIST_PATH="$(pwd)/gist"

# Create symlink in Go bin directory
if [ -d "$HOME/go/bin" ]; then
    echo "📥 Creating symlink in ~/go/bin..."
    ln -sf "$GIST_PATH" "$HOME/go/bin/gist"
    INSTALL_PATH="$HOME/go/bin/gist"
    echo ""
    echo "⚠️  Make sure ~/go/bin is in your PATH:"
    echo "   export PATH=\"\$HOME/go/bin:\$PATH\""
else
    # Fallback to /usr/local/bin if go/bin doesn't exist
    echo "📥 Creating symlink in /usr/local/bin..."
    if [ -w "/usr/local/bin" ]; then
        ln -sf "$GIST_PATH" /usr/local/bin/gist
    else
        echo "🔐 Administrator access required to create symlink in /usr/local/bin"
        sudo ln -sf "$GIST_PATH" /usr/local/bin/gist
    fi
    INSTALL_PATH="/usr/local/bin/gist"
fi

echo "✅ Installation complete!"
echo ""
echo "Run 'gist init' to set up your configuration"
echo "Run 'gist help' to see available commands"