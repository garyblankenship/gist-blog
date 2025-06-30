# ⚠️ Deprecated Tools

The following tools have been **removed** in favor of the unified `gist` command:

## Legacy Tools (REMOVED)

### ❌ upload-gist.go (REMOVED)
**Replacement:** `gist add` command
```bash
# Old way (no longer available)
./upload-gist -p -d "Title #tag" file.md

# New way
gist add -p -d "Title #tag" file.md
gist push
```

### ❌ gist-manager.go (REMOVED)
**Replacement:** `gist` command with subcommands
```bash
# Old way (no longer available)
./gist-manager sync
./gist-manager list
./gist-manager add-tag abc123 featured

# New way
gist pull
gist list
gist tag abc123 featured
gist push
```

### ❌ gist-cli.go (REMOVED)
**Replacement:** `gist` command
```bash
# Old way (no longer available)
./gist-cli list
./gist-cli upload file.md

# New way
gist list
gist add file.md
gist push
```

## Migration Guide

1. **Install the new CLI:**
   ```bash
   make build
   make install-cli
   ```

2. **Initialize configuration:**
   ```bash
   gist init
   ```

3. **Import existing cache:**
   ```bash
   gist pull
   ```

## Why the Change?

The new `gist` command provides:
- 🎯 Git-style workflow (add, rm, push, pull)
- 📦 Staging area for batch operations
- 🔄 Better status tracking
- 📝 Comprehensive help system
- 🚀 Familiar commands for developers

## Getting Help

```bash
gist help           # General help
gist help <command> # Command-specific help
```

## Cleanup Complete

All legacy tools have been removed. Please use the new `gist` command for all operations.