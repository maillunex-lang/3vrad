package progress_test

import (
	"context"
	"os"
	"testing"

	"github.com/maillunex-lang/3vrad/apps/server/internal/db"
	"github.com/maillunex-lang/3vrad/apps/server/internal/progress"
)

func TestShopPurchaseIdempotent(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://paradise:paradise_dev@localhost:5432/paradise_test?sslmode=disable"
	}
	ctx := context.Background()
	pool, err := db.Connect(ctx, dsn)
	if err != nil {
		t.Skip("no postgres:", err)
	}
	defer pool.Close()
	applied := false
	var lastErr error
	for _, dir := range []string{os.Getenv("MIGRATIONS_DIR"), "../../migrations", "migrations"} {
		if dir == "" {
			continue
		}
		if err := db.Migrate(ctx, pool, dir); err == nil {
			applied = true
			break
		} else {
			lastErr = err
		}
	}
	if !applied {
		t.Fatalf("migrate failed: %v", lastErr)
	}
	svc := &progress.Service{Pool: pool}
	p, err := svc.CreateGuest(ctx, "Shopper")
	if err != nil {
		t.Fatal(err)
	}
	if p.Coins < 80 {
		t.Fatalf("starter coins %d", p.Coins)
	}
	r1, err := svc.Purchase(ctx, p.ID, "booster_rocket", "buy-rocket-1")
	if err != nil {
		t.Fatal(err)
	}
	if r1.Coins != p.Coins-80 {
		t.Fatalf("coins after buy: %d", r1.Coins)
	}
	found := false
	for _, it := range r1.Inventory {
		if it.ItemID == "booster_rocket" && it.Qty >= 1 {
			found = true
		}
	}
	if !found {
		t.Fatalf("inventory %+v", r1.Inventory)
	}
	r2, err := svc.Purchase(ctx, p.ID, "booster_rocket", "buy-rocket-1")
	if err != nil {
		t.Fatal(err)
	}
	if !r2.Already || r2.Coins != r1.Coins {
		t.Fatalf("idempotent: %+v", r2)
	}
}
