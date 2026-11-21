package teams

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound = errors.New("not_found")
	ErrFull     = errors.New("team_full")
	ErrInTeam   = errors.New("already_in_team")
	ErrInvalid  = errors.New("invalid")
)

const MaxMembers = 30 // ONLINE-002 B

type Team struct {
	ID      string `json:"id"`
	Code    string `json:"code"`
	Name    string `json:"name"`
	OwnerID string `json:"ownerId"`
	Members int    `json:"members"`
}

type Member struct {
	PlayerID    string `json:"playerId"`
	DisplayName string `json:"displayName"`
	Role        string `json:"role"`
}

type Service struct {
	Pool *pgxpool.Pool
}

func (s *Service) Create(ctx context.Context, ownerID, name string) (Team, error) {
	name = strings.TrimSpace(name)
	if name == "" || len(name) > 40 {
		return Team{}, ErrInvalid
	}
	var existing string
	err := s.Pool.QueryRow(ctx, `SELECT team_id::text FROM team_members WHERE player_id=$1`, ownerID).Scan(&existing)
	if err == nil {
		return Team{}, ErrInTeam
	}
	if !errors.Is(err, pgx.ErrNoRows) && err != nil {
		return Team{}, err
	}

	id := uuid.New()
	code, err := randomCode(6)
	if err != nil {
		return Team{}, err
	}
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return Team{}, err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `
		INSERT INTO teams (id, code, name, owner_id) VALUES ($1,$2,$3,$4)`,
		id, code, name, ownerID); err != nil {
		return Team{}, err
	}
	if _, err = tx.Exec(ctx, `
		INSERT INTO team_members (team_id, player_id, role) VALUES ($1,$2,'owner')`,
		id, ownerID); err != nil {
		return Team{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Team{}, err
	}
	return Team{ID: id.String(), Code: code, Name: name, OwnerID: ownerID, Members: 1}, nil
}

func (s *Service) Join(ctx context.Context, playerID, code string) (Team, error) {
	code = strings.ToUpper(strings.TrimSpace(code))
	if code == "" {
		return Team{}, ErrInvalid
	}
	var existing string
	err := s.Pool.QueryRow(ctx, `SELECT team_id::text FROM team_members WHERE player_id=$1`, playerID).Scan(&existing)
	if err == nil {
		return Team{}, ErrInTeam
	}
	if !errors.Is(err, pgx.ErrNoRows) && err != nil {
		return Team{}, err
	}

	var t Team
	err = s.Pool.QueryRow(ctx, `
		SELECT id::text, code, name, owner_id::text FROM teams WHERE code=$1`, code).Scan(
		&t.ID, &t.Code, &t.Name, &t.OwnerID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Team{}, ErrNotFound
	}
	if err != nil {
		return Team{}, err
	}

	var count int
	if err := s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM team_members WHERE team_id=$1`, t.ID).Scan(&count); err != nil {
		return Team{}, err
	}
	if count >= MaxMembers {
		return Team{}, ErrFull
	}
	if _, err := s.Pool.Exec(ctx, `
		INSERT INTO team_members (team_id, player_id, role) VALUES ($1,$2,'member')`, t.ID, playerID); err != nil {
		return Team{}, err
	}
	t.Members = count + 1
	return t, nil
}

type Quest struct {
	QuestID  string `json:"questId"`
	Title    string `json:"title"`
	Progress int    `json:"progress"`
	Target   int    `json:"target"`
}

var dailyQuests = []struct {
	ID     string
	Title  string
	Target int
}{
	{ID: "daily_clears", Title: "Пройти 5 уровней командой", Target: 5},
	{ID: "daily_builds", Title: "Сделать 3 улучшения зданий", Target: 3},
}

func (s *Service) EnsureQuests(ctx context.Context, teamID string) error {
	reset := nextUTCMidnight()
	for _, q := range dailyQuests {
		if _, err := s.Pool.Exec(ctx, `
			INSERT INTO team_quests (team_id, quest_id, progress, target, reset_at)
			VALUES ($1,$2,0,$3,$4)
			ON CONFLICT (team_id, quest_id) DO NOTHING`,
			teamID, q.ID, q.Target, reset); err != nil {
			return err
		}
	}
	return nil
}

func (s *Service) ListQuests(ctx context.Context, teamID string) ([]Quest, error) {
	if err := s.EnsureQuests(ctx, teamID); err != nil {
		return nil, err
	}
	if err := s.resetExpiredQuests(ctx, teamID); err != nil {
		return nil, err
	}
	rows, err := s.Pool.Query(ctx, `
		SELECT quest_id, progress, target FROM team_quests WHERE team_id=$1 ORDER BY quest_id`, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Quest
	for rows.Next() {
		var q Quest
		if err := rows.Scan(&q.QuestID, &q.Progress, &q.Target); err != nil {
			return nil, err
		}
		for _, d := range dailyQuests {
			if d.ID == q.QuestID {
				q.Title = d.Title
				break
			}
		}
		if q.Title == "" {
			q.Title = q.QuestID
		}
		out = append(out, q)
	}
	return out, rows.Err()
}

func (s *Service) resetExpiredQuests(ctx context.Context, teamID string) error {
	reset := nextUTCMidnight()
	_, err := s.Pool.Exec(ctx, `
		UPDATE team_quests
		SET progress = 0, reset_at = $2
		WHERE team_id = $1 AND reset_at <= NOW()`, teamID, reset)
	return err
}

// IncrementQuest bumps a daily team quest for the player's team (no-op if not in a team).
// Caps at target; safe to call after clear/build.
func (s *Service) IncrementQuest(ctx context.Context, playerID, questID string, delta int) error {
	if delta <= 0 {
		return nil
	}
	var teamID string
	err := s.Pool.QueryRow(ctx, `SELECT team_id::text FROM team_members WHERE player_id=$1`, playerID).Scan(&teamID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	if err := s.EnsureQuests(ctx, teamID); err != nil {
		return err
	}
	if err := s.resetExpiredQuests(ctx, teamID); err != nil {
		return err
	}
	_, err = s.Pool.Exec(ctx, `
		UPDATE team_quests
		SET progress = LEAST(target, progress + $3)
		WHERE team_id = $1 AND quest_id = $2`, teamID, questID, delta)
	return err
}

func nextUTCMidnight() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, time.UTC)
}

func (s *Service) GetForPlayer(ctx context.Context, playerID string) (*Team, []Member, error) {
	var teamID string
	err := s.Pool.QueryRow(ctx, `SELECT team_id::text FROM team_members WHERE player_id=$1`, playerID).Scan(&teamID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, err
	}
	var t Team
	if err := s.Pool.QueryRow(ctx, `
		SELECT id::text, code, name, owner_id::text FROM teams WHERE id=$1`, teamID).Scan(
		&t.ID, &t.Code, &t.Name, &t.OwnerID); err != nil {
		return nil, nil, err
	}
	rows, err := s.Pool.Query(ctx, `
		SELECT m.player_id::text, p.display_name, m.role
		FROM team_members m JOIN players p ON p.id = m.player_id
		WHERE m.team_id=$1 ORDER BY m.joined_at`, teamID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	var members []Member
	for rows.Next() {
		var m Member
		if err := rows.Scan(&m.PlayerID, &m.DisplayName, &m.Role); err != nil {
			return nil, nil, err
		}
		members = append(members, m)
	}
	t.Members = len(members)
	return &t, members, rows.Err()
}

func randomCode(n int) (string, error) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	out := make([]byte, n)
	for i := 0; i < n; i++ {
		v, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
		if err != nil {
			return "", err
		}
		out[i] = alphabet[v.Int64()]
	}
	return string(out), nil
}

func ErrString(err error) string {
	return fmt.Sprintf("%v", err)
}
