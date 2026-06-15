package storage

import (
	"os"
	"path/filepath"
)

// OSFileSystem implements the FileSystem interface using the OS filesystem
type OSFileSystem struct{}

// NewOSFileSystem creates a new OS filesystem implementation
func NewOSFileSystem() *OSFileSystem {
	return &OSFileSystem{}
}

// Exists checks if a file exists
func (fs *OSFileSystem) Exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// ReadFile reads file contents
func (fs *OSFileSystem) ReadFile(path string) ([]byte, error) {
	return os.ReadFile(path)
}

// WriteFile atomically writes content to a file at mode 0600. It writes to a
// sibling temp file then renames over the target so a crash mid-write cannot
// leave a truncated/partial file (the caller may be saving credentials).
func (fs *OSFileSystem) WriteFile(path string, content []byte) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}

	tmp, err := os.CreateTemp(dir, ".tmp-*")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	cleanup := func() { _ = os.Remove(tmpName) }

	if _, err := tmp.Write(content); err != nil {
		tmp.Close()
		cleanup()
		return err
	}
	if err := tmp.Chmod(0600); err != nil {
		tmp.Close()
		cleanup()
		return err
	}
	if err := tmp.Close(); err != nil {
		cleanup()
		return err
	}
	if err := os.Rename(tmpName, path); err != nil {
		cleanup()
		return err
	}
	return nil
}

// RemoveAll removes a directory and all contents
func (fs *OSFileSystem) RemoveAll(path string) error {
	return os.RemoveAll(path)
}
