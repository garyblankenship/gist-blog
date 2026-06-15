package storage

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestOSFileSystem_WriteFile_AtMode0600(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "secret")
	fs := NewOSFileSystem()

	if err := fs.WriteFile(path, []byte("hello")); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}
	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("Stat: %v", err)
	}
	if got := info.Mode().Perm(); got != 0600 {
		t.Errorf("expected 0600 perms, got %#o", got)
	}
}

func TestOSFileSystem_WriteFile_NoTempLeftover(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "data")
	fs := NewOSFileSystem()

	if err := fs.WriteFile(path, []byte("first")); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}
	if err := fs.WriteFile(path, []byte("second")); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatalf("ReadDir: %v", err)
	}
	var names []string
	for _, e := range entries {
		names = append(names, e.Name())
	}
	for _, n := range names {
		if strings.HasPrefix(n, ".tmp-") {
			t.Errorf("leftover temp file present: %s (entries: %v)", n, names)
		}
	}
	if len(names) != 1 || names[0] != "data" {
		t.Errorf("expected only the target file, got %v", names)
	}
}

func TestOSFileSystem_WriteFile_Overwrites(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "f")
	fs := NewOSFileSystem()

	_ = fs.WriteFile(path, []byte("aaa"))
	if err := fs.WriteFile(path, []byte("bb")); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}
	got, err := fs.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	if string(got) != "bb" {
		t.Errorf("expected 'bb', got %q", got)
	}
}

func TestOSFileSystem_WriteFile_CreatesParentDir(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "nested", "inner", "file")
	fs := NewOSFileSystem()

	if err := fs.WriteFile(path, []byte("x")); err != nil {
		t.Fatalf("WriteFile into nested dir: %v", err)
	}
	if !fs.Exists(path) {
		t.Error("expected nested file to exist")
	}
}

func TestOSFileSystem_Size(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "f")
	fs := NewOSFileSystem()
	content := []byte("hello world")
	if err := fs.WriteFile(path, content); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}
	got, err := fs.Size(path)
	if err != nil {
		t.Fatalf("Size: %v", err)
	}
	if got != int64(len(content)) {
		t.Errorf("expected %d, got %d", len(content), got)
	}
}

func TestOSFileSystem_Exists_RemoveAll(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "f")
	fs := NewOSFileSystem()

	if fs.Exists(path) {
		t.Error("should not exist yet")
	}
	_ = fs.WriteFile(path, []byte("x"))
	if !fs.Exists(path) {
		t.Error("should exist after write")
	}
	if err := fs.RemoveAll(path); err != nil {
		t.Fatalf("RemoveAll: %v", err)
	}
	if fs.Exists(path) {
		t.Error("should be removed")
	}
}
