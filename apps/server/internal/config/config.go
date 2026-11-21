package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	AppEnv      string
	LogLevel    string
	ServerAddr  string
	DatabaseURL string
	CORSOrigins []string
}

func Load() (Config, error) {
	cfg := Config{
		AppEnv:      getenv("APP_ENV", "development"),
		LogLevel:    getenv("LOG_LEVEL", "info"),
		ServerAddr:  getenv("SERVER_ADDR", ":8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}

	if cfg.DatabaseURL == "" {
		host := getenv("POSTGRES_HOST", "localhost")
		port := getenv("POSTGRES_PORT", "5432")
		user := getenv("POSTGRES_USER", "paradise")
		pass := getenv("POSTGRES_PASSWORD", "paradise_dev")
		db := getenv("POSTGRES_DB", "paradise")
		cfg.DatabaseURL = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=disable",
			user, pass, host, port, db,
		)
	}

	origins := getenv("CORS_ORIGINS", "http://localhost:5173")
	for _, o := range strings.Split(origins, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			cfg.CORSOrigins = append(cfg.CORSOrigins, o)
		}
	}

	if cfg.ServerAddr == "" {
		return cfg, fmt.Errorf("SERVER_ADDR is empty")
	}
	return cfg, nil
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getenvInt(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return n
}
