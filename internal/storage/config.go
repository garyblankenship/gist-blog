package storage

import (
	"encoding/json"
	"os"
	"path/filepath"

	"gist/internal/domain"
	"gist/internal/service"
)

// ConfigFile implements the ConfigRepository interface using a JSON file
type ConfigFile struct {
	fs       service.FileSystem
	configPath string
}

// NewConfigFile creates a new file-based configuration repository
func NewConfigFile(fs service.FileSystem) *ConfigFile {
	home, _ := os.UserHomeDir()
	return &ConfigFile{
		fs:         fs,
		configPath: filepath.Join(home, ".gistconfig"),
	}
}

// Load retrieves configuration from file
func (c *ConfigFile) Load() (*domain.Config, error) {
	if !c.fs.Exists(c.configPath) {
		return nil, os.ErrNotExist
	}

	data, err := c.fs.ReadFile(c.configPath)
	if err != nil {
		return nil, err
	}

	var configMap map[string]string
	if err := json.Unmarshal(data, &configMap); err != nil {
		return nil, err
	}

	config := &domain.Config{
		GitHubUser:  configMap["github_user"],
		GitHubToken: configMap["github_token"],
	}

	return config, nil
}

// Save persists configuration to file
func (c *ConfigFile) Save(config *domain.Config) error {
	configMap := map[string]string{
		"github_user":  config.GitHubUser,
		"github_token": config.GitHubToken,
	}

	data, err := json.MarshalIndent(configMap, "", "  ")
	if err != nil {
		return err
	}

	return c.fs.WriteFile(c.configPath, data)
}

// GetFromEnv loads config from environment variables
func (c *ConfigFile) GetFromEnv() (*domain.Config, error) {
	// Try different token names
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		token = os.Getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
	}
	
	config := &domain.Config{
		GitHubUser:  os.Getenv("GITHUB_USER"),
		GitHubToken: token,
	}

	if !config.Valid() {
		return nil, domain.ErrConfigMissing{Field: "GITHUB_USER or GITHUB_TOKEN"}
	}

	return config, nil
}

// LoadConfig attempts to load configuration from multiple sources
func LoadConfig(fs service.FileSystem) (*domain.Config, error) {
	configRepo := NewConfigFile(fs)

	// Try environment variables first
	if config, err := configRepo.GetFromEnv(); err == nil {
		return config, nil
	}

	// Try config file
	if config, err := configRepo.Load(); err == nil && config.Valid() {
		return config, nil
	}

	return nil, domain.ErrConfigMissing{Field: "github credentials"}
}