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

	dir := os.Getenv("MIGRATIONS_DIR")
	candidates := []string{dir, "../../migrations", "migrations", "../migrations"}
	applied := false
	var lastErr error
	for _, c := range candidates {
		if c == "" {
			continue
		}
		if err := db.Migrate(ctx, pool, c); err == nil {
			applied = true
			break
		} else {
			lastErr = err
		}
	}
	if !applied {
		t.Fatalf("migrate failed: %v", lastErr)
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

	if err := svc.IncrementQuest(ctx, a.ID, "daily_clears", 2); err != nil {
		t.Fatal(err)
	}
	if err := svc.IncrementQuest(ctx, b.ID, "daily_builds", 1); err != nil {
		t.Fatal(err)
	}
	quests, err := svc.ListQuests(ctx, team.ID)
	if err != nil {
		t.Fatal(err)
	}
	byID := map[string]teams.Quest{}
	for _, q := range quests {
		byID[q.QuestID] = q
	}
	if byID["daily_clears"].Progress != 2 {
		t.Fatalf("clears progress %d", byID["daily_clears"].Progress)
	}
	if byID["daily_builds"].Progress != 1 {
		t.Fatalf("builds progress %d", byID["daily_builds"].Progress)
	}
	// Cap at target
	if err := svc.IncrementQuest(ctx, a.ID, "daily_clears", 99); err != nil {
		t.Fatal(err)
	}
	quests, err = svc.ListQuests(ctx, team.ID)
	if err != nil {
		t.Fatal(err)
	}
	for _, q := range quests {
		if q.QuestID == "daily_clears" && q.Progress != q.Target {
			t.Fatalf("expected cap at %d got %d", q.Target, q.Progress)
		}
	}
}
