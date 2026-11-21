package buildings_test

import (
	"testing"

	"github.com/maillunex-lang/3vrad/apps/server/internal/buildings"
)

func TestSimulateIslandRouteNoSoftLock(t *testing.T) {
	if buildings.TotalMandatoryStars() != 70 {
		t.Fatalf("budget %d", buildings.TotalMandatoryStars())
	}
	r := buildings.SimulateIslandRoute()
	if !r.OK {
		t.Fatalf("soft-lock failures: %v (stars=%d stages=%v)", r.Failures, r.FinalStars, r.FinalStages)
	}
	if r.FinalStars != 0 {
		t.Fatalf("expected 0 stars, got %d", r.FinalStars)
	}
	for _, b := range buildings.Catalog {
		if r.FinalStages[b.ID] != len(b.Stages) {
			t.Fatalf("%s stage %d/%d", b.ID, r.FinalStages[b.ID], len(b.Stages))
		}
	}
}
