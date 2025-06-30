package storage

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

// LoadEnvFile loads environment variables from a .env file
func LoadEnvFile() error {
	// Try current directory first
	envPath := ".env"
	if _, err := os.Stat(envPath); os.IsNotExist(err) {
		// Try home directory
		home, _ := os.UserHomeDir()
		envPath = filepath.Join(home, ".env")
		if _, err := os.Stat(envPath); os.IsNotExist(err) {
			// No .env file found, that's ok
			return nil
		}
	}

	file, err := os.Open(envPath)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		
		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Parse KEY=VALUE
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		// Remove quotes if present
		if len(value) >= 2 && value[0] == '"' && value[len(value)-1] == '"' {
			value = value[1 : len(value)-1]
		}

		// Set environment variable if not already set
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}

	return scanner.Err()
}