package shop_test

import (
	"testing"

	"github.com/maillunex-lang/3vrad/apps/server/internal/shop"
)

func TestCatalogPricesPositive(t *testing.T) {
	if len(shop.Catalog) < 4 {
		t.Fatal("expected boosters")
	}
	for _, it := range shop.Catalog {
		if it.Price < 1 {
			t.Fatalf("%s price", it.ID)
		}
		if it.Currency != "coins" && it.Currency != "diamonds" {
			t.Fatalf("%s currency", it.ID)
		}
	}
	pack := shop.PackContents("pack_small")
	if pack["booster_rocket"] != 2 || pack["booster_bomb"] != 1 {
		t.Fatalf("pack: %+v", pack)
	}
}
