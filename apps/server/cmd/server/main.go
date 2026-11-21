package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/maillunex-lang/3vrad/apps/server/internal/api"
	"github.com/maillunex-lang/3vrad/apps/server/internal/config"
	"github.com/maillunex-lang/3vrad/apps/server/internal/db"
	"github.com/maillunex-lang/3vrad/apps/server/internal/logging"
	"github.com/maillunex-lang/3vrad/apps/server/internal/progress"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../../.env")

	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	log := logging.New(cfg.LogLevel)
	started := time.Now()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("db_connect_failed", map[string]any{"error": err.Error()})
		os.Exit(1)
	}
	defer pool.Close()

	migrationsDir := os.Getenv("MIGRATIONS_DIR")
	if migrationsDir == "" {
		migrationsDir = findMigrationsDir()
	}
	if err := db.Migrate(ctx, pool, migrationsDir); err != nil {
		log.Error("migrate_failed", map[string]any{"error": err.Error(), "dir": migrationsDir})
		os.Exit(1)
	}
	log.Info("migrations_applied", map[string]any{"dir": migrationsDir})

	prog := &progress.Service{Pool: pool}
	h := &api.Handlers{Pool: pool, StartedAt: started, AppEnv: cfg.AppEnv, Progress: prog}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.Healthz)
	mux.HandleFunc("GET /readyz", h.Readyz)
	mux.HandleFunc("GET /api/v1/version", h.Version)
	mux.HandleFunc("POST /api/v1/auth/guest", h.CreateGuest)
	mux.HandleFunc("GET /api/v1/me", h.Me)
	mux.HandleFunc("GET /api/v1/buildings/catalog", h.BuildingsCatalog)
	mux.HandleFunc("POST /api/v1/levels/clear", h.ClearLevel)
	mux.HandleFunc("POST /api/v1/buildings/advance", h.BuildAdvance)
	mux.HandleFunc("POST /api/v1/buildings/style", h.SetBuildingStyle)

	var handler http.Handler = mux
	handler = api.CORS(cfg.CORSOrigins)(handler)
	handler = api.RequestLog(log)(handler)

	srv := &http.Server{
		Addr:              cfg.ServerAddr,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Info("server_listening", map[string]any{"addr": cfg.ServerAddr, "env": cfg.AppEnv})
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server_failed", map[string]any{"error": err.Error()})
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
	log.Info("server_stopped", nil)
}

func findMigrationsDir() string {
	candidates := []string{
		"migrations",
		filepath.Join("apps", "server", "migrations"),
		filepath.Join("..", "migrations"),
		filepath.Join("..", "..", "migrations"),
	}
	for _, c := range candidates {
		if st, err := os.Stat(c); err == nil && st.IsDir() {
			abs, _ := filepath.Abs(c)
			return abs
		}
	}
	return "migrations"
}
