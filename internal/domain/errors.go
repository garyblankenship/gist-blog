package domain

import "fmt"

// ErrFileNotFound represents a file not found error
type ErrFileNotFound struct {
	Path string
}

func (e ErrFileNotFound) Error() string {
	return fmt.Sprintf("file not found: %s", e.Path)
}

// ErrGistNotFound represents a gist not found error
type ErrGistNotFound struct {
	ID GistID
}

func (e ErrGistNotFound) Error() string {
	return fmt.Sprintf("gist not found: %s", e.ID)
}

// ErrInvalidTag represents an invalid tag error
type ErrInvalidTag struct {
	Tag    string
	Reason string
}

func (e ErrInvalidTag) Error() string {
	return fmt.Sprintf("invalid tag %s: %s", e.Tag, e.Reason)
}

// ErrConfigMissing represents missing configuration error
type ErrConfigMissing struct {
	Field string
}

func (e ErrConfigMissing) Error() string {
	return fmt.Sprintf("missing configuration: %s", e.Field)
}

// ErrAPIRequest represents a GitHub API request error
type ErrAPIRequest struct {
	StatusCode int
	Message    string
}

func (e ErrAPIRequest) Error() string {
	return fmt.Sprintf("GitHub API error %d: %s", e.StatusCode, e.Message)
}

// ErrStagingEmpty represents an empty staging area error
type ErrStagingEmpty struct{}

func (e ErrStagingEmpty) Error() string {
	return "staging area is empty"
}

// ErrInvalidGistID represents an invalid gist ID error
type ErrInvalidGistID struct {
	ID string
}

func (e ErrInvalidGistID) Error() string {
	return fmt.Sprintf("invalid gist ID: %s", e.ID)
}