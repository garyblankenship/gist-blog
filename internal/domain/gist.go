package domain

import (
	"os"
	"strconv"
	"time"
)

// GistID represents a unique identifier for a gist
type GistID string

// Validate ensures the gist ID is valid
func (id GistID) Valid() bool {
	return len(string(id)) > 0
}

// String returns the string representation
func (id GistID) String() string {
	return string(id)
}

// CacheConfig holds cache configuration
type CacheConfig struct {
	TTL         time.Duration
	CleanupFreq time.Duration
}

// Config holds GitHub authentication configuration
type Config struct {
	GitHubUser  string
	GitHubToken string
	Cache       CacheConfig
}

// NewConfig creates a new configuration with default values
func NewConfig(user, token string) *Config {
	ttl := 5 * time.Minute
	if envTTL := os.Getenv("GIST_CACHE_TTL"); envTTL != "" {
		if seconds, err := strconv.Atoi(envTTL); err == nil {
			ttl = time.Duration(seconds) * time.Second
		}
	}

	cleanupFreq := time.Hour
	if envFreq := os.Getenv("GIST_CACHE_CLEANUP_FREQ"); envFreq != "" {
		if seconds, err := strconv.Atoi(envFreq); err == nil {
			cleanupFreq = time.Duration(seconds) * time.Second
		}
	}

	return &Config{
		GitHubUser:  user,
		GitHubToken: token,
		Cache: CacheConfig{
			TTL:         ttl,
			CleanupFreq: cleanupFreq,
		},
	}
}

// Valid checks if configuration is complete
func (c Config) Valid() bool {
	return c.GitHubUser != "" && c.GitHubToken != ""
}

// GistFile represents a single file within a gist
type GistFile struct {
	Content  string `json:"content,omitempty"`
	Filename string `json:"filename,omitempty"`
}

// Gist represents a GitHub gist
type Gist struct {
	ID          GistID               `json:"id"`
	Description string               `json:"description"`
	Public      bool                 `json:"public"`
	Files       map[string]GistFile  `json:"files"`
	CreatedAt   time.Time            `json:"created_at"`
	UpdatedAt   time.Time            `json:"updated_at"`
	HTMLURL     string               `json:"html_url"`
}

// NewGist creates a new gist with validation
func NewGist(id string, description string, public bool) *Gist {
	return &Gist{
		ID:          GistID(id),
		Description: description,
		Public:      public,
		Files:       make(map[string]GistFile),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// AddFile adds a file to the gist
func (g *Gist) AddFile(filename, content string) {
	g.Files[filename] = GistFile{
		Content:  content,
		Filename: filename,
	}
	g.UpdatedAt = time.Now()
}

// StagedFile represents a file that has been staged for operations
type StagedFile struct {
	Path        string    `json:"path"`
	Description string    `json:"description"`
	Public      bool      `json:"public"`
	Action      string    `json:"action"` // add, update, remove
	GistID      GistID    `json:"gist_id,omitempty"`
	StagedAt    time.Time `json:"staged_at"`
}

// NewStagedFile creates a new staged file
func NewStagedFile(path, description string, public bool, action string) *StagedFile {
	return &StagedFile{
		Path:        path,
		Description: description,
		Public:      public,
		Action:      action,
		StagedAt:    time.Now(),
	}
}

// Valid checks if the staged file is valid
func (sf StagedFile) Valid() bool {
	validActions := map[string]bool{
		"add":    true,
		"update": true,
		"remove": true,
	}
	return sf.Path != "" && validActions[sf.Action]
}