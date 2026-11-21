package progress_test

import (
	"context"
	"os"
	"testing"

	"github.com/maillunex-lang/3vrad/apps/server/internal/buildings"
	"github.com/maillunex-lang/3vrad/apps/server/internal/db"
	"github.com/maillunex-lang/3vrad/apps/server/internal/progress"
)

func TestGuestClearAndBuildIdempotent(t *testing.T) {
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
	dir := os.Getenv("MIGRATIONS_DIR")
	if dir == "" {
		dir = "../migrations"
		if _, err := os.Stat(dir); err != nil {
			dir = "migrations"
		}
	}
	// resolve from module root when running in package dir
	candidates := []string{dir, "../../migrations", "migrations"}
	applied := false
	for _, c := range candidates {
		if err := db.Migrate(ctx, pool, c); err == nil {
			applied = true
			break
		}
	}
	if !applied {
		t.Fatal("migrate failed")
	}

	svc := &progress.Service{Pool: pool}
	p, err := svc.CreateGuest(ctx, "Tester")
	if err != nil {
		t.Fatal(err)
	}

	r1, err := svc.ClearLevel(ctx, p.ID, 1, 50, 1, "clear-1-a")
	if err != nil {
		t.Fatal(err)
	}
	if !r1.BuildStarGained || r1.BuildStars != 1 {
		t.Fatalf("first clear: %+v", r1)
	}
	r2, err := svc.ClearLevel(ctx, p.ID, 1, 50, 1, "clear-1-b")
	if err != nil {
		t.Fatal(err)
	}
	if r2.BuildStarGained || r2.BuildStars != 1 {
		t.Fatalf("second clear must not grant star: %+v", r2)
	}
	// idempotent same key
	r3, err := svc.ClearLevel(ctx, p.ID, 1, 50, 1, "clear-1-a")
	if err != nil {
		t.Fatal(err)
	}
	if !r3.AlreadyCleared || r3.BuildStars != 1 {
		t.Fatalf("idempotent: %+v", r3)
	}

	// unlock needs level 1 for B01 stage1
	b1, err := svc.AdvanceBuilding(ctx, p.ID, "B01", "build-b01-1")
	if err != nil {
		t.Fatal(err)
	}
	if b1.Stage != 1 || b1.BuildStars != 0 {
		t.Fatalf("build1: %+v", b1)
	}
	b1b, err := svc.AdvanceBuilding(ctx, p.ID, "B01", "build-b01-1")
	if err != nil {
		t.Fatal(err)
	}
	if !b1b.Already || b1b.Stage != 1 {
		t.Fatalf("build idempotent: %+v", b1b)
	}

	if buildings.TotalMandatoryStars() != 70 {
		t.Fatal("budget")
	}
}
