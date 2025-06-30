#!/bin/bash

# Gist Blog Setup Script
# One-command setup for the entire blog system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo -e "${BLUE}🚀 Gist Blog Setup${NC}"
echo "==================="
echo

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi
print_status "Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi
print_status "npm $(npm --version)"

# Check Go
if ! command -v go &> /dev/null; then
    print_error "Go is not installed. Please install Go 1.19+ first."
    echo "   Visit: https://golang.org/dl/"
    exit 1
fi
print_status "Go $(go version | awk '{print $3}')"

echo

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install
print_status "Dependencies installed"

echo

# Install Wrangler if not present
if ! command -v wrangler &> /dev/null; then
    echo "Installing Wrangler CLI..."
    npm install -g wrangler
    print_status "Wrangler installed"
else
    print_status "Wrangler $(wrangler --version | head -1)"
fi

echo

# Build and install gist CLI
echo "Building gist CLI..."
go build -o gist gist.go
print_status "Built gist CLI"

# Install to /usr/local/bin
echo "Installing gist command..."
if [ -w "/usr/local/bin" ]; then
    cp gist /usr/local/bin/
else
    print_info "Administrator access required to install to /usr/local/bin"
    sudo cp gist /usr/local/bin/
fi
chmod +x /usr/local/bin/gist
rm -f gist
print_status "Installed gist command to /usr/local/bin"

echo

# Initialize gist configuration
if [ ! -f "$HOME/.gistconfig" ]; then
    echo "Setting up GitHub credentials..."
    gist init
else
    print_status "GitHub credentials already configured"
fi

echo

# Setup Cloudflare
echo "Setting up Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    print_info "Please log in to Cloudflare"
    wrangler login
else
    print_status "Already logged in to Cloudflare"
fi

echo

# Create KV namespace if needed
echo "Checking KV namespace..."
if grep -q "your-kv-namespace-id" wrangler.toml; then
    print_info "Creating KV namespace for caching..."
    
    # Create production namespace
    OUTPUT=$(wrangler kv namespace create "GIST_CACHE" 2>&1)
    KV_ID=$(echo "$OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    
    # Create preview namespace
    OUTPUT_PREVIEW=$(wrangler kv namespace create "GIST_CACHE" --preview 2>&1)
    KV_PREVIEW_ID=$(echo "$OUTPUT_PREVIEW" | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)
    
    # Update wrangler.toml
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/id = \"your-kv-namespace-id\"/id = \"$KV_ID\"/" wrangler.toml
        sed -i '' "s/preview_id = \"your-kv-namespace-preview-id\"/preview_id = \"$KV_PREVIEW_ID\"/" wrangler.toml
    else
        # Linux
        sed -i "s/id = \"your-kv-namespace-id\"/id = \"$KV_ID\"/" wrangler.toml
        sed -i "s/preview_id = \"your-kv-namespace-preview-id\"/preview_id = \"$KV_PREVIEW_ID\"/" wrangler.toml
    fi
    
    print_status "Created KV namespace"
else
    print_status "KV namespace already configured"
fi

echo

# Build enhanced worker
echo "Building enhanced worker..."
node build-enhanced.js
print_status "Worker built with enhanced features"

echo

# Deploy to Cloudflare
echo "Deploying to Cloudflare Workers..."
if wrangler deploy; then
    print_status "Deployed successfully!"
    
    # Get worker URL
    WORKER_URL=$(wrangler deployments list | grep -o 'https://[^ ]*' | head -1)
    
    echo
    echo -e "${GREEN}🎉 Setup Complete!${NC}"
    echo "=================="
    echo
    echo "Your blog is live at: $WORKER_URL"
    echo
    echo "Next steps:"
    echo "1. Create your first post:"
    echo "   echo '# Hello World' > hello.md"
    echo "   gist add -p -d \"My First Post #welcome\" hello.md"
    echo "   gist push"
    echo
    echo "2. View your blog:"
    echo "   open $WORKER_URL"
    echo
    echo "3. Check out the RSS feed:"
    echo "   open $WORKER_URL/rss.xml"
    echo
    echo "Run 'gist help' for more commands"
else
    print_error "Deployment failed. Please check your configuration."
    echo
    echo "Common issues:"
    echo "- Make sure GITHUB_USER is set in wrangler.toml"
    echo "- Check that your domain is configured correctly"
    echo "- Ensure you're logged in: wrangler login"
fi

# Offer to upload example post
echo
read -p "Would you like to upload the example post? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "example-post.md" ]; then
        print_info "Uploading example post..."
        gist add -p -d "Welcome to Gist Blog #introduction #tutorial #markdown" example-post.md
        gist push
        print_status "Example post uploaded!"
    else
        print_warning "example-post.md not found"
    fi
fi

echo
print_status "Setup script completed!"