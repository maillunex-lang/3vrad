package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestHealthz(t *testing.T) {
	h := &Handlers{StartedAt: time.Now(), AppEnv: "test"}
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rr := httptest.NewRecorder()
	h.Healthz(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d", rr.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body["status"] != "ok" {
		t.Fatalf("unexpected body: %v", body)
	}
}

func TestVersion(t *testing.T) {
	h := &Handlers{StartedAt: time.Now().Add(-2 * time.Second), AppEnv: "test"}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/version", nil)
	rr := httptest.NewRecorder()
	h.Version(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d", rr.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body["version"] != Version {
		t.Fatalf("version = %v", body["version"])
	}
	if body["service"] != "paradise-island-api" {
		t.Fatalf("service = %v", body["service"])
	}
}

func TestReadyzNoPool(t *testing.T) {
	h := &Handlers{StartedAt: time.Now(), AppEnv: "test"}
	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rr := httptest.NewRecorder()
	h.Readyz(rr, req)
	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d", rr.Code)
	}
}
