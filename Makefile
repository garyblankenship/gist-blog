.PHONY: dev deploy build build-cli install install-cli check verify doctor smoke clean pull sync list help setup

GO := go
NPM := npm
NPX := npx
CLI_BINARY := gist

# Install JS deps and Go module dependencies
setup:
	$(NPM) install
	$(GO) mod download
	@echo "✓ Setup complete"

# Backwards compatible alias for install
install:
	@$(MAKE) setup

# Development
dev:
	$(NPX) wrangler dev

# Deploy to production
deploy:
	$(NPX) wrangler deploy

# Build Go CLI
build:
	$(GO) build -o $(CLI_BINARY) cmd/gist/main.go
	@echo "✓ Built gist CLI"
	@echo "Run './install.sh' to create symlink in ~/go/bin"

# Backwards compatible build alias
build-cli: build

# Install gist CLI
install-cli:
	./install.sh

# DEPRECATED: Use 'gist publish' instead
upload:
	@echo "This command is deprecated. Use:"
	@echo "  gist publish -p -d \"Title #tag\" file.md"

# Validate CLI compilation surface
check:
	$(GO) test ./...

# Validate local toolchain and required commands
doctor:
	@command -v $(GO) >/dev/null || { echo "missing: go"; exit 1; }
	@command -v node >/dev/null || { echo "missing: node"; exit 1; }
	@command -v $(NPM) >/dev/null || { echo "missing: npm"; exit 1; }
	@$(NPX) wrangler --version >/dev/null || { echo "missing: wrangler; run 'make setup'"; exit 1; }
	@$(GO) version
	@node --version
	@$(NPM) --version
	@$(NPX) wrangler --version
	@if command -v gist >/dev/null; then \
		echo "gist on PATH: $$(command -v gist)"; \
	else \
		echo "gist is not on PATH; run 'make install-cli'"; \
	fi
	@echo "✓ Doctor checks passed"

# Full local verification before handoff
verify: check
	$(GO) vet ./...
	$(GO) build -o $(CLI_BINARY) cmd/gist/main.go
	./$(CLI_BINARY) --help >/dev/null
	./$(CLI_BINARY) --version >/dev/null
	@echo "✓ Verification passed"

# Quick local smoke checks
smoke: setup check build
	$(GO) run ./cmd/gist --help >/dev/null
	$(GO) run ./cmd/gist --version >/dev/null
	./$(CLI_BINARY) --help >/dev/null
	@echo "✓ Smoke checks passed"

# Clean build artifacts
clean:
	rm -f $(CLI_BINARY) upload-gist gist-cli gist-manager
	rm -rf node_modules .wrangler
	rm -f *.log

# View logs
tail:
	$(NPX) wrangler tail

# Sync latest gists from GitHub
sync:
	gist sync

# Backwards compatible sync alias
pull: sync

# List all gists
list:
	gist list

# Help
help:
	@echo "Available commands:"
	@echo "  make setup        - Install JS dependencies and sync Go modules"
	@echo "  make doctor       - Check required local tools"
	@echo "  make dev          - Run local development server"
	@echo "  make deploy       - Deploy to Cloudflare Workers"
	@echo "  make build-cli    - Build gist CLI"
	@echo "  make build        - Alias for build-cli"
	@echo "  make install-cli  - Install gist command"
	@echo "  make check        - Run go test ./..."
	@echo "  make verify       - Run tests, vet, build, and CLI smoke checks"
	@echo "  make smoke        - Run quick CLI smoke checks"
	@echo "  make sync         - Sync gists from GitHub"
	@echo "  make list         - List all gists"
	@echo "  make tail         - View worker logs"
	@echo "  make clean        - Clean build artifacts"
