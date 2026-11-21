# ADR-003: Island progress & build stars

**Status:** Accepted  
**Date:** 2026-11-21  
**Canon:** GDD-13/14/15, BUILDINGS-001.

## Decision
- Guest accounts via `guest_token` (E05 full auth later).
- First clear of levels 1–70 grants exactly one build star; replays grant none.
- Building advances require unlock level + stars; costs from BUILDINGS-001.
- All mutations go through `economy_ledger` with client `idempotency_key`.
- Total mandatory stage costs = 70 (enforced by unit test).
- Luxury/fantasy styles: temporary unlock at cleared levels 20/40 until story gates approved.
- Map: fixed camera, 7 button zones, separate building sprites (not baked mega-BG).

## Consequences
- Soft-lock avoided if players spend stars only on unlocked stages as stars arrive.
- Art for B02–B20 can be swapped file-by-file without schema changes.
