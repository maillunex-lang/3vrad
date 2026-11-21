package progress

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/maillunex-lang/3vrad/apps/server/internal/shop"
)

type InventoryItem struct {
	ItemID string `json:"itemId"`
	Qty    int    `json:"qty"`
}

type PurchaseResult struct {
	ItemID    string          `json:"itemId"`
	Granted   map[string]int  `json:"granted"`
	Coins     int             `json:"coins"`
	Diamonds  int             `json:"diamonds"`
	Inventory []InventoryItem `json:"inventory"`
	Already   bool            `json:"alreadyApplied"`
}

func (s *Service) ListInventory(ctx context.Context, playerID string) ([]InventoryItem, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT item_id, qty FROM player_inventory WHERE player_id=$1 AND qty > 0 ORDER BY item_id`, playerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []InventoryItem{}
	for rows.Next() {
		var it InventoryItem
		if err := rows.Scan(&it.ItemID, &it.Qty); err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}

func listInventoryTx(ctx context.Context, tx pgx.Tx, playerID string) ([]InventoryItem, error) {
	rows, err := tx.Query(ctx, `
		SELECT item_id, qty FROM player_inventory WHERE player_id=$1 AND qty > 0 ORDER BY item_id`, playerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []InventoryItem{}
	for rows.Next() {
		var it InventoryItem
		if err := rows.Scan(&it.ItemID, &it.Qty); err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}

func (s *Service) Purchase(ctx context.Context, playerID, itemID, idemKey string) (PurchaseResult, error) {
	item, ok := shop.ByID(itemID)
	if !ok {
		return PurchaseResult{}, ErrInvalid
	}
	if idemKey == "" {
		idemKey = fmt.Sprintf("buy:%s", itemID)
	}

	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return PurchaseResult{}, err
	}
	defer tx.Rollback(ctx)

	var hit bool
	if err := tx.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM economy_ledger WHERE player_id=$1 AND idempotency_key=$2)`,
		playerID, idemKey).Scan(&hit); err != nil {
		return PurchaseResult{}, err
	}
	if hit {
		p, err := getPlayerTx(ctx, tx, playerID)
		if err != nil {
			return PurchaseResult{}, err
		}
		inv, err := listInventoryTx(ctx, tx, playerID)
		if err != nil {
			return PurchaseResult{}, err
		}
		return PurchaseResult{
			ItemID: itemID, Coins: p.Coins, Diamonds: p.Diamonds, Inventory: inv, Already: true,
			Granted: shop.PackContents(itemID),
		}, nil
	}

	p, err := getPlayerTx(ctx, tx, playerID)
	if err != nil {
		return PurchaseResult{}, err
	}
	deltaCoins, deltaDiamonds := 0, 0
	if item.Currency == "coins" {
		if p.Coins < item.Price {
			return PurchaseResult{}, ErrInsufficient
		}
		deltaCoins = -item.Price
	} else {
		if p.Diamonds < item.Price {
			return PurchaseResult{}, ErrInsufficient
		}
		deltaDiamonds = -item.Price
	}

	if _, err = tx.Exec(ctx, `
		UPDATE players SET coins = coins + $2, diamonds = diamonds + $3, updated_at = NOW()
		WHERE id = $1`, playerID, deltaCoins, deltaDiamonds); err != nil {
		return PurchaseResult{}, err
	}

	granted := shop.PackContents(itemID)
	for id, qty := range granted {
		if _, err = tx.Exec(ctx, `
			INSERT INTO player_inventory (player_id, item_id, qty)
			VALUES ($1,$2,$3)
			ON CONFLICT (player_id, item_id) DO UPDATE SET qty = player_inventory.qty + EXCLUDED.qty, updated_at = NOW()`,
			playerID, id, qty); err != nil {
			return PurchaseResult{}, err
		}
	}

	if _, err = tx.Exec(ctx, `
		INSERT INTO economy_ledger (player_id, idempotency_key, kind, delta_coins, delta_diamonds, meta)
		VALUES ($1,$2,'shop_purchase',$3,$4,jsonb_build_object('item',$5::text,'price',$6::int))`,
		playerID, idemKey, deltaCoins, deltaDiamonds, itemID, item.Price); err != nil {
		return PurchaseResult{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PurchaseResult{}, err
	}
	p2, err := s.GetByID(ctx, playerID)
	if err != nil {
		return PurchaseResult{}, err
	}
	inv, err := s.ListInventory(ctx, playerID)
	if err != nil {
		return PurchaseResult{}, err
	}
	return PurchaseResult{
		ItemID: itemID, Granted: granted, Coins: p2.Coins, Diamonds: p2.Diamonds, Inventory: inv,
	}, nil
}

func (s *Service) ConsumeItem(ctx context.Context, playerID, itemID, idemKey string) (PurchaseResult, error) {
	if idemKey == "" {
		idemKey = fmt.Sprintf("use:%s", itemID)
	}
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return PurchaseResult{}, err
	}
	defer tx.Rollback(ctx)

	var hit bool
	if err := tx.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM economy_ledger WHERE player_id=$1 AND idempotency_key=$2)`,
		playerID, idemKey).Scan(&hit); err != nil {
		return PurchaseResult{}, err
	}
	if hit {
		p, err := getPlayerTx(ctx, tx, playerID)
		if err != nil {
			return PurchaseResult{}, err
		}
		inv, err := listInventoryTx(ctx, tx, playerID)
		if err != nil {
			return PurchaseResult{}, err
		}
		return PurchaseResult{ItemID: itemID, Coins: p.Coins, Diamonds: p.Diamonds, Inventory: inv, Already: true}, nil
	}

	tag, err := tx.Exec(ctx, `
		UPDATE player_inventory SET qty = qty - 1, updated_at = NOW()
		WHERE player_id=$1 AND item_id=$2 AND qty > 0`, playerID, itemID)
	if err != nil {
		return PurchaseResult{}, err
	}
	if tag.RowsAffected() == 0 {
		return PurchaseResult{}, ErrInsufficient
	}
	if _, err = tx.Exec(ctx, `
		INSERT INTO economy_ledger (player_id, idempotency_key, kind, meta)
		VALUES ($1,$2,'item_consume',jsonb_build_object('item',$3::text))`,
		playerID, idemKey, itemID); err != nil {
		return PurchaseResult{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return PurchaseResult{}, err
	}
	p, err := s.GetByID(ctx, playerID)
	if err != nil {
		return PurchaseResult{}, err
	}
	inv, err := s.ListInventory(ctx, playerID)
	if err != nil {
		return PurchaseResult{}, err
	}
	return PurchaseResult{
		ItemID: itemID, Granted: map[string]int{itemID: -1}, Coins: p.Coins, Diamonds: p.Diamonds, Inventory: inv,
	}, nil
}
