package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/maillunex-lang/3vrad/apps/server/internal/progress"
)

const Version = "0.2.0-e04"

type Handlers struct {
	Pool      *pgxpool.Pool
	StartedAt time.Time
	AppEnv    string
	Progress  *progress.Service
}

func (h *Handlers) Healthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *Handlers) Readyz(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if h.Pool == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"status": "not_ready", "reason": "no_db"})
		return
	}
	if err := h.Pool.Ping(ctx); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"status": "not_ready", "reason": "db_ping", "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": "ready"})
}

func (h *Handlers) Version(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"service":    "paradise-island-api",
		"version":    Version,
		"env":        h.AppEnv,
		"started_at": h.StartedAt.UTC().Format(time.RFC3339),
		"uptime_sec": int(time.Since(h.StartedAt).Seconds()),
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
