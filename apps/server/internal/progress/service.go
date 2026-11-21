package progress

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/maillunex-lang/3vrad/apps/server/internal/buildings"
)

var (
	ErrNotFound     = errors.New("not found")
	ErrInsufficient = errors.New("insufficient_stars")
	ErrLocked       = errors.New("stage_locked")
	ErrInvalid      = errors.New("invalid")
)

type Player struct {
	ID              string `json:"id"`
	GuestToken      string `json:"guestToken"`
	DisplayName     string `json:"displayName"`
	Coins           int    `json:"coins"`
	Diamonds        int    `json:"diamonds"`
	BuildStars      int    `json:"buildStars"`
	MaxLevelCleared int    `json:"maxLevelCleared"`
}

type BuildingState struct {
	BuildingID string `json:"buildingId"`
	Stage      int    `json:"stage"`
	Style      string `json:"style"`
}

type Service struct {
	Pool *pgxpool.Pool
}

func (s *Service) CreateGuest(ctx context.Context, name string) (Player, error) {
	id := uuid.New()
	token := uuid.NewString()
	if name == "" {
		name = "Гость"
	}
	_, err := s.Pool.Exec(ctx, `
		INSERT INTO players (id, guest_token, display_name, coins, diamonds)
		VALUES ($1, $2, $3, 300, 5)`, id, token, name)
	if err != nil {
		return Player{}, err
	}
	for _, b := range buildings.Catalog {
		if _, err := s.Pool.Exec(ctx, `
			INSERT INTO player_buildings (player_id, building_id, stage, style)
			VALUES ($1, $2, 0, 'tropical')
			ON CONFLICT DO NOTHING`, id, b.ID); err != nil {
			return Player{}, err
		}
	}
	return Player{ID: id.String(), GuestToken: token, DisplayName: name, Coins: 300, Diamonds: 5}, nil
}

func (s *Service) GetByToken(ctx context.Context, token string) (Player, error) {
	var p Player
	err := s.Pool.QueryRow(ctx, `
		SELECT id::text, guest_token, display_name, coins, diamonds, build_stars, max_level_cleared
		FROM players WHERE guest_token = $1`, token).Scan(
		&p.ID, &p.GuestToken, &p.DisplayName, &p.Coins, &p.Diamonds, &p.BuildStars, &p.MaxLevelCleared,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return p, ErrNotFound
	}
	return p, err
}

func (s *Service) GetByID(ctx context.Context, id string) (Player, error) {
	var p Player
	err := s.Pool.QueryRow(ctx, `
		SELECT id::text, guest_token, display_name, coins, diamonds, build_stars, max_level_cleared
		FROM players WHERE id = $1`, id).Scan(
		&p.ID, &p.GuestToken, &p.DisplayName, &p.Coins, &p.Diamonds, &p.BuildStars, &p.MaxLevelCleared,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return p, ErrNotFound
	}
	return p, err
}

func (s *Service) ListBuildings(ctx context.Context, playerID string) ([]BuildingState, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT building_id, stage, style FROM player_buildings WHERE player_id = $1 ORDER BY building_id`, playerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []BuildingState
	for rows.Next() {
		var b BuildingState
		if err := rows.Scan(&b.BuildingID, &b.Stage, &b.Style); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

type ClearLevelResult struct {
	AlreadyCleared  bool `json:"alreadyCleared"`
	BuildStarGained bool `json:"buildStarGained"`
	CoinsGained     int  `json:"coinsGained"`
	BuildStars      int  `json:"buildStars"`
	Coins           int  `json:"coins"`
	MaxLevelCleared int  `json:"maxLevelCleared"`
}

func (s *Service) ClearLevel(ctx context.Context, playerID string, levelNo int, coinsBase int, ratingStars int, idemKey string) (ClearLevelResult, error) {
	if levelNo < 1 || levelNo > 300 {
		return ClearLevelResult{}, ErrInvalid
	}
	if ratingStars < 1 || ratingStars > 3 {
		ratingStars = 1
	}
	if coinsBase < 0 {
		coinsBase = 0
	}
	if idemKey == "" {
		idemKey = fmt.Sprintf("clear:%d", levelNo)
	}

	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return ClearLevelResult{}, err
	}
	defer tx.Rollback(ctx)

	var ledgerHit bool
	if err := tx.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM economy_ledger WHERE player_id=$1 AND idempotency_key=$2)`,
		playerID, idemKey).Scan(&ledgerHit); err != nil {
		return ClearLevelResult{}, err
	}
	if ledgerHit {
		p, err := getPlayerTx(ctx, tx, playerID)
		if err != nil {
			return ClearLevelResult{}, err
		}
		return ClearLevelResult{
			AlreadyCleared:  true,
			BuildStars:      p.BuildStars,
			Coins:           p.Coins,
			MaxLevelCleared: p.MaxLevelCleared,
		}, nil
	}

	var prior bool
	if err := tx.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM level_first_clears WHERE player_id=$1 AND level_no=$2)`,
		playerID, levelNo).Scan(&prior); err != nil {
		return ClearLevelResult{}, err
	}

	buildStar := false
	coinsGain := 0
	if !prior {
		buildStar = levelNo <= 70
		coinsGain = coinsBase
		starDelta := 0
		if buildStar {
			starDelta = 1
		}
		starSQL := `
			INSERT INTO level_first_clears (player_id, level_no, stars_rated, coins_gained, build_star_gained)
			VALUES ($1,$2,$3,$4,FALSE)`
		if buildStar {
			starSQL = `
			INSERT INTO level_first_clears (player_id, level_no, stars_rated, coins_gained, build_star_gained)
			VALUES ($1,$2,$3,$4,TRUE)`
		}
		if _, err = tx.Exec(ctx, starSQL, playerID, levelNo, ratingStars, coinsGain); err != nil {
			return ClearLevelResult{}, err
		}
		if _, err = tx.Exec(ctx, `
			UPDATE players SET
				coins = coins + $2,
				build_stars = build_stars + $3,
				max_level_cleared = GREATEST(max_level_cleared, $4),
				updated_at = NOW()
			WHERE id = $1`, playerID, coinsGain, starDelta, levelNo); err != nil {
			return ClearLevelResult{}, err
		}
		if _, err = tx.Exec(ctx, `
			INSERT INTO economy_ledger (player_id, idempotency_key, kind, delta_coins, delta_stars, meta)
			VALUES ($1,$2,'level_clear',$3,$4,jsonb_build_object('level',$5::int,'rating',$6::int))`,
			playerID, idemKey, coinsGain, starDelta, levelNo, ratingStars); err != nil {
			return ClearLevelResult{}, err
		}
	} else {
		if _, err = tx.Exec(ctx, `
			INSERT INTO economy_ledger (player_id, idempotency_key, kind, meta)
			VALUES ($1,$2,'level_clear_replay',jsonb_build_object('level',$3::int))`,
			playerID, idemKey, levelNo); err != nil {
			return ClearLevelResult{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return ClearLevelResult{}, err
	}
	p, err := s.GetByID(ctx, playerID)
	if err != nil {
		return ClearLevelResult{}, err
	}
	return ClearLevelResult{
		AlreadyCleared:  prior,
		BuildStarGained: buildStar && !prior,
		CoinsGained:     coinsGain,
		BuildStars:      p.BuildStars,
		Coins:           p.Coins,
		MaxLevelCleared: p.MaxLevelCleared,
	}, nil
}

type BuildResult struct {
	BuildingID string `json:"buildingId"`
	Stage      int    `json:"stage"`
	Style      string `json:"style"`
	BuildStars int    `json:"buildStars"`
	Already    bool   `json:"alreadyApplied"`
}

func (s *Service) AdvanceBuilding(ctx context.Context, playerID, buildingID, idemKey string) (BuildResult, error) {
	def, ok := buildings.ByID(buildingID)
	if !ok {
		return BuildResult{}, ErrNotFound
	}
	if idemKey == "" {
		return BuildResult{}, ErrInvalid
	}

	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return BuildResult{}, err
	}
	defer tx.Rollback(ctx)

	var ledgerHit bool
	if err := tx.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM economy_ledger WHERE player_id=$1 AND idempotency_key=$2)`,
		playerID, idemKey).Scan(&ledgerHit); err != nil {
		return BuildResult{}, err
	}
	if ledgerHit {
		var st BuildingState
		if err := tx.QueryRow(ctx, `
			SELECT building_id, stage, style FROM player_buildings WHERE player_id=$1 AND building_id=$2`,
			playerID, buildingID).Scan(&st.BuildingID, &st.Stage, &st.Style); err != nil {
			return BuildResult{}, err
		}
		p, err := getPlayerTx(ctx, tx, playerID)
		if err != nil {
			return BuildResult{}, err
		}
		return BuildResult{BuildingID: st.BuildingID, Stage: st.Stage, Style: st.Style, BuildStars: p.BuildStars, Already: true}, nil
	}

	var stage int
	var style string
	var stars int
	var maxLevel int
	if err := tx.QueryRow(ctx, `
		SELECT b.stage, b.style, p.build_stars, p.max_level_cleared
		FROM player_buildings b JOIN players p ON p.id = b.player_id
		WHERE b.player_id=$1 AND b.building_id=$2 FOR UPDATE OF b, p`,
		playerID, buildingID).Scan(&stage, &style, &stars, &maxLevel); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return BuildResult{}, ErrNotFound
		}
		return BuildResult{}, err
	}

	next := stage + 1
	if next > len(def.Stages) {
		return BuildResult{}, ErrLocked
	}
	cost := def.Stages[next-1]
	if maxLevel < cost.UnlockLevel {
		return BuildResult{}, ErrLocked
	}
	if stars < cost.CostStars {
		return BuildResult{}, ErrInsufficient
	}

	if _, err = tx.Exec(ctx, `
		UPDATE players SET build_stars = build_stars - $2, updated_at = NOW() WHERE id = $1`,
		playerID, cost.CostStars); err != nil {
		return BuildResult{}, err
	}
	if _, err = tx.Exec(ctx, `
		UPDATE player_buildings SET stage = $3, updated_at = NOW()
		WHERE player_id=$1 AND building_id=$2`, playerID, buildingID, next); err != nil {
		return BuildResult{}, err
	}
	if _, err = tx.Exec(ctx, `
		INSERT INTO economy_ledger (player_id, idempotency_key, kind, delta_stars, meta)
		VALUES ($1,$2,'build_stage', $3, jsonb_build_object('building',$4::text,'stage',$5::int,'cost',$6::int))`,
		playerID, idemKey, -cost.CostStars, buildingID, next, cost.CostStars); err != nil {
		return BuildResult{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return BuildResult{}, err
	}
	p, err := s.GetByID(ctx, playerID)
	if err != nil {
		return BuildResult{}, err
	}
	return BuildResult{BuildingID: buildingID, Stage: next, Style: style, BuildStars: p.BuildStars}, nil
}

func (s *Service) SetStyle(ctx context.Context, playerID, buildingID, style string) (BuildingState, error) {
	if style != "tropical" && style != "luxury" && style != "fantasy" {
		return BuildingState{}, ErrInvalid
	}
	var stage int
	err := s.Pool.QueryRow(ctx, `
		SELECT stage FROM player_buildings WHERE player_id=$1 AND building_id=$2`, playerID, buildingID).Scan(&stage)
	if errors.Is(err, pgx.ErrNoRows) {
		return BuildingState{}, ErrNotFound
	}
	if err != nil {
		return BuildingState{}, err
	}
	if stage < 1 {
		return BuildingState{}, ErrLocked
	}
	// luxury/fantasy unlock soft-gated: require max_level >= 20 / 40 (reversible until story rules finalized)
	var maxLevel int
	if err := s.Pool.QueryRow(ctx, `SELECT max_level_cleared FROM players WHERE id=$1`, playerID).Scan(&maxLevel); err != nil {
		return BuildingState{}, err
	}
	if style == "luxury" && maxLevel < 20 {
		return BuildingState{}, ErrLocked
	}
	if style == "fantasy" && maxLevel < 40 {
		return BuildingState{}, ErrLocked
	}
	_, err = s.Pool.Exec(ctx, `
		UPDATE player_buildings SET style=$3, updated_at=NOW() WHERE player_id=$1 AND building_id=$2`,
		playerID, buildingID, style)
	if err != nil {
		return BuildingState{}, err
	}
	return BuildingState{BuildingID: buildingID, Stage: stage, Style: style}, nil
}

func getPlayerTx(ctx context.Context, tx pgx.Tx, id string) (Player, error) {
	var p Player
	err := tx.QueryRow(ctx, `
		SELECT id::text, guest_token, display_name, coins, diamonds, build_stars, max_level_cleared
		FROM players WHERE id = $1`, id).Scan(
		&p.ID, &p.GuestToken, &p.DisplayName, &p.Coins, &p.Diamonds, &p.BuildStars, &p.MaxLevelCleared,
	)
	return p, err
}
