.PHONY: dev deploy build upload clean install

# Development
dev:
	wrangler dev

# Deploy to production
deploy:
	wrangler deploy

# Build Go tools
build:
	go build -o gist cmd/gist/main.go
	@echo "✓ Built gist CLI"
	@echo "Run './install.sh' to create symlink in ~/go/bin"

# Install gist CLI
install-cli:
	./install.sh

# Install dependencies
install:
	npm install

# DEPRECATED: Use 'gist add' instead
upload:
	@echo "This command is deprecated. Use the new git-style commands:"
	@echo "  gist add -p -d \"Title #tag\" file.md"
	@echo "  gist push"

# Clean build artifacts
clean:
	rm -f gist upload-gist gist-cli gist-manager
	rm -rf node_modules .wrangler
	rm -f *.log

# View logs
tail:
	wrangler tail

# Pull latest gists from GitHub
pull:
	gist pull

# Show gist status
status:
	gist status

# List all gists
list:
	gist list

# Search gists
search:
	@if [ -z "$(Q)" ]; then \
		echo "Error: Q is required. Usage: make search Q=\"docker\""; \
		exit 1; \
	fi
	@gist search "$(Q)"

# Help
help:
	@echo "Available commands:"
	@echo "  make dev          - Run local development server"
	@echo "  make deploy       - Deploy to Cloudflare Workers"
	@echo "  make build        - Build Go tools"
	@echo "  make build        - Build gist CLI"
	@echo "  make install-cli  - Install gist command"
	@echo "  make pull         - Pull gists from GitHub"
	@echo "  make status       - Show staged changes"
	@echo "  make list         - List all gists"
	@echo "  make search Q=... - Search gists"
	@echo "  make tail         - View worker logs"
	@echo "  make clean        - Clean build artifacts"