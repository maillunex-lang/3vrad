package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/maillunex-lang/3vrad/apps/server/internal/buildings"
	"github.com/maillunex-lang/3vrad/apps/server/internal/progress"
)

func (h *Handlers) CreateGuest(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name string `json:"name"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	p, err := h.Progress.CreateGuest(r.Context(), body.Name)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (h *Handlers) Me(w http.ResponseWriter, r *http.Request) {
	p, ok := h.playerFromAuth(w, r)
	if !ok {
		return
	}
	b, err := h.Progress.ListBuildings(r.Context(), p.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"player":    p,
		"buildings": b,
		"catalog":   buildings.Catalog,
		"starBudget": buildings.TotalMandatoryStars(),
	})
}

func (h *Handlers) ClearLevel(w http.ResponseWriter, r *http.Request) {
	p, ok := h.playerFromAuth(w, r)
	if !ok {
		return
	}
	var body struct {
		LevelNo        int    `json:"levelNo"`
		CoinsBase      int    `json:"coinsBase"`
		RatingStars    int    `json:"ratingStars"`
		IdempotencyKey string `json:"idempotencyKey"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bad_json"})
		return
	}
	if key := r.Header.Get("Idempotency-Key"); key != "" {
		body.IdempotencyKey = key
	}
	res, err := h.Progress.ClearLevel(r.Context(), p.ID, body.LevelNo, body.CoinsBase, body.RatingStars, body.IdempotencyKey)
	if err != nil {
		mapProgressErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handlers) BuildAdvance(w http.ResponseWriter, r *http.Request) {
	p, ok := h.playerFromAuth(w, r)
	if !ok {
		return
	}
	var body struct {
		BuildingID     string `json:"buildingId"`
		IdempotencyKey string `json:"idempotencyKey"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bad_json"})
		return
	}
	if key := r.Header.Get("Idempotency-Key"); key != "" {
		body.IdempotencyKey = key
	}
	res, err := h.Progress.AdvanceBuilding(r.Context(), p.ID, body.BuildingID, body.IdempotencyKey)
	if err != nil {
		mapProgressErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handlers) SetBuildingStyle(w http.ResponseWriter, r *http.Request) {
	p, ok := h.playerFromAuth(w, r)
	if !ok {
		return
	}
	var body struct {
		BuildingID string `json:"buildingId"`
		Style      string `json:"style"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bad_json"})
		return
	}
	res, err := h.Progress.SetStyle(r.Context(), p.ID, body.BuildingID, body.Style)
	if err != nil {
		mapProgressErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handlers) BuildingsCatalog(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"buildings":  buildings.Catalog,
		"starBudget": buildings.TotalMandatoryStars(),
	})
}

func (h *Handlers) playerFromAuth(w http.ResponseWriter, r *http.Request) (progress.Player, bool) {
	token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	token = strings.TrimSpace(token)
	if token == "" {
		token = r.Header.Get("X-Guest-Token")
	}
	if token == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "missing_token"})
		return progress.Player{}, false
	}
	p, err := h.Progress.GetByToken(r.Context(), token)
	if errors.Is(err, progress.ErrNotFound) {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unknown_token"})
		return progress.Player{}, false
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return progress.Player{}, false
	}
	return p, true
}

func mapProgressErr(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, progress.ErrNotFound):
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not_found"})
	case errors.Is(err, progress.ErrInsufficient):
		writeJSON(w, http.StatusConflict, map[string]any{"error": "insufficient_stars"})
	case errors.Is(err, progress.ErrLocked):
		writeJSON(w, http.StatusConflict, map[string]any{"error": "stage_locked"})
	case errors.Is(err, progress.ErrInvalid):
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid"})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
	}
}
