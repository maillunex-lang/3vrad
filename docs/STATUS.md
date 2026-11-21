# Фактический статус разработки

**Обновлено:** 2026-11-21  
**Ветка:** `main`  
**Канон:** GDD-01–15 APPROVED; BUILDINGS-001 / ISLAND-MAP-001 / ASSETS-001 / B01-DESIGN-001 A baseline.

## Сводка

| Этап | Статус | Факт |
|------|--------|------|
| E01 Фундамент | DONE | PWA+API+CI |
| E02 Match-3 | ≈ready | engine + campaign DRAFT 100 + clear-on-win |
| E03 Визуал | IN_PROGRESS | art pass: B02–B20 v2, 4 TEMP portraits, 3 VFX; not Premium |
| E04 Остров | ≈ready | 7 зон, 20 зданий, soft-lock, сюжет 10…70 |
| E05 Экономика | IN_PROGRESS | guest + shop + inventory (no real payments) |
| E06 Команды/PvP | scaffold | team create/join + daily quests; PvP stub |
| E07 100 уровней | DRAFT | 100 playable; authored grids 1–20 |

## Графика (не завышать)
- B01 gen эталон; B02–B20 **gen S3 tropical** (все); S0/S1/lux/fantasy ещё v2 procedural
- TEMP portraits: Клеш / Майя(робот) / Кеф / Исследователь
- VFX: clear_burst, zone_reveal, star_shimmer (+ code sparkles)
- Журнал: `docs/art/ART_PRODUCTION.md`

## API
- Auth/me/clear/buildings/shop/inventory/team (+ quests list)

## Не заявлено DONE
- Полный Premium B02–B20 все стили/этапы
- Утверждённый CHAR-канон
- LEVELS-001 баланс
- Реальные платежи / production
