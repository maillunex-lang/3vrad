package teams_test

import (
	"context"
	"os"
	"testing"

	"github.com/maillunex-lang/3vrad/apps/server/internal/db"
	"github.com/maillunex-lang/3vrad/apps/server/internal/progress"
	"github.com/maillunex-lang/3vrad/apps/server/internal/teams"
)

func TestCreateJoinTeam(t *testing.T) {
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
	for _, dir := range []string{"../../migrations", "migrations", "../migrations"} {
		if err := db.Migrate(ctx, pool, dir); err == nil {
			break
		}
	}

	prog := &progress.Service{Pool: pool}
	a, err := prog.CreateGuest(ctx, "A")
	if err != nil {
		t.Fatal(err)
	}
	b, err := prog.CreateGuest(ctx, "B")
	if err != nil {
		t.Fatal(err)
	}
	svc := &teams.Service{Pool: pool}
	team, err := svc.Create(ctx, a.ID, "Райские Крабы")
	if err != nil {
		t.Fatal(err)
	}
	if len(team.Code) != 6 {
		t.Fatalf("code %s", team.Code)
	}
	joined, err := svc.Join(ctx, b.ID, team.Code)
	if err != nil {
		t.Fatal(err)
	}
	if joined.Members != 2 {
		t.Fatalf("members %d", joined.Members)
	}
	got, members, err := svc.GetForPlayer(ctx, a.ID)
	if err != nil || got == nil || len(members) != 2 {
		t.Fatalf("get: %v %v %v", got, members, err)
	}
}
