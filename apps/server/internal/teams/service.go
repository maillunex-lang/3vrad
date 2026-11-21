package teams

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"

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
