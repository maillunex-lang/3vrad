package buildings

import "testing"

func TestTotalMandatoryStarsIs70(t *testing.T) {
	if got := TotalMandatoryStars(); got != 70 {
		t.Fatalf("star budget = %d, want 70", got)
	}
}

func TestCatalogHas20(t *testing.T) {
	if len(Catalog) != 20 {
		t.Fatalf("len=%d", len(Catalog))
	}
	for _, b := range Catalog {
		if len(b.Stages) < 2 || len(b.Stages) > 3 {
			t.Fatalf("%s stages=%d", b.ID, len(b.Stages))
		}
		sum := 0
		for _, s := range b.Stages {
			sum += s.CostStars
			if s.UnlockLevel < 1 || s.CostStars < 1 {
				t.Fatalf("%s bad stage %#v", b.ID, s)
			}
		}
		if len(b.Stages) == 2 && sum != 3 {
			t.Fatalf("%s two-stage sum=%d want 3", b.ID, sum)
		}
		if len(b.Stages) == 3 && sum != 4 {
			t.Fatalf("%s three-stage sum=%d want 4", b.ID, sum)
		}
	}
}
