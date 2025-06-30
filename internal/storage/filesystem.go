package storage

import (
	"os"
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

// WriteFile writes content to a file
func (fs *OSFileSystem) WriteFile(path string, content []byte) error {
	return os.WriteFile(path, content, 0644)
}

// RemoveAll removes a directory and all contents
func (fs *OSFileSystem) RemoveAll(path string) error {
	return os.RemoveAll(path)
}