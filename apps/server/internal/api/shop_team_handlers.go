package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/maillunex-lang/3vrad/apps/server/internal/progress"
	"github.com/maillunex-lang/3vrad/apps/server/internal/shop"
	"github.com/maillunex-lang/3vrad/apps/server/internal/teams"
)

func (h *Handlers) ShopCatalog(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"items":   shop.Catalog,
		"note":    "Prices provisional until E08 owner approval (OPEN_QUESTIONS #12). No real payments.",
		"ads":     false,
	})
}

func (h *Handlers) ShopBuy(w http.ResponseWriter, r *http.Request) {
	p, ok := h.playerFromAuth(w, r)
	if !ok {
		return
	}
	var body struct {
		ItemID         string `json:"itemId"`
		IdempotencyKey string `json:"idempotencyKey"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bad_json"})
		return
	}
	if key := r.Header.Get("Idempotency-Key"); key != "" {
		body.IdempotencyKey = key
	}
	res, err := h.Progress.Purchase(r.Context(), p.ID, body.ItemID, body.IdempotencyKey)
	if err != nil {
		mapProgressErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handlers) Inventory(w http.ResponseWriter, r *http.Request) {
	p, ok := h.playerFromAuth(w, r)
	if !ok {
		return
	}
	inv, err := h.Progress.ListInventory(r.Context(), p.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"inventory": inv})
}

func (h *Handlers) UseItem(w http.ResponseWriter, r *http.Request) {
	p, ok := h.playerFromAuth(w, r)
	if !ok {
		return
	}
	var body struct {
		ItemID         string `json:"itemId"`
		IdempotencyKey string `json:"idempotencyKey"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bad_json"})
		return
	}
	if key := r.Header.Get("Idempotency-Key"); key != "" {
		body.IdempotencyKey = key
	}
	res, err := h.Progress.ConsumeItem(r.Context(), p.ID, body.ItemID, body.IdempotencyKey)
	if err != nil {
		mapProgressErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handlers) TeamCreate(w http.ResponseWriter, r *http.Request) {
	p, ok := h.playerFromAuth(w, r)
	if !ok {
		return
	}
	if h.Teams == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"error": "teams_disabled"})
		return
	}
	var body struct {
		Name string `json:"name"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	t, err := h.Teams.Create(r.Context(), p.ID, body.Name)
	if err != nil {
		mapTeamErr(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

func (h *Handlers) TeamJoin(w http.ResponseWriter, r *http.Request) {
	p, ok := h.playerFromAuth(w, r)
	if !ok {
		return
	}
	if h.Teams == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"error": "teams_disabled"})
		return
	}
	var body struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bad_json"})
		return
	}
	t, err := h.Teams.Join(r.Context(), p.ID, body.Code)
	if err != nil {
		mapTeamErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (h *Handlers) TeamMe(w http.ResponseWriter, r *http.Request) {
	p, ok := h.playerFromAuth(w, r)
	if !ok {
		return
	}
	if h.Teams == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"error": "teams_disabled"})
		return
	}
	t, members, err := h.Teams.GetForPlayer(r.Context(), p.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"team": t, "members": members})
}

func mapTeamErr(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, teams.ErrNotFound):
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not_found"})
	case errors.Is(err, teams.ErrFull):
		writeJSON(w, http.StatusConflict, map[string]any{"error": "team_full"})
	case errors.Is(err, teams.ErrInTeam):
		writeJSON(w, http.StatusConflict, map[string]any{"error": "already_in_team"})
	case errors.Is(err, teams.ErrInvalid):
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid"})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
	}
}

// Ensure progress.ErrInsufficient maps for shop coin shortages too.
var _ = progress.ErrInsufficient
