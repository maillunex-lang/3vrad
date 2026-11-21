# Фактический статус разработки

**Обновлено:** 2026-11-21  
**Ветка:** `main` (после merge `cursor/nav-tabs-and-content-067d`)  
**Канон:** GDD-01–15 APPROVED; BUILDINGS-001 / ISLAND-MAP-001 / ASSETS-001 / B01-DESIGN-001 A baseline.

## Сводка

| Этап | Статус | Факт |
|------|--------|------|
| E01 Фундамент | DONE | PWA+API+CI |
| E02 Match-3 | ≈ready | engine + campaign DRAFT 100 + clear-on-win; нужен ручной smoke |
| E03 Визуал | IN_PROGRESS | B02–B20 S0/S1/S3 T+L+F (v2, не Premium); TEMP portraits/VFX; nav stable |
| E04 Остров | ≈ready | 7 зон, 20 зданий, soft-lock, сюжет 10…70; нужен smoke карты |
| E05 Экономика | IN_PROGRESS | guest + shop + inventory (no real payments) |
| E06 Команды/PvP | scaffold | teams + quest increment clear/build; PvP stub |
| E07 100 уровней | DRAFT | 100 playable; authored grids **1–40** |

## API
- Auth/me/clear/buildings/shop/inventory/team
- clear → `daily_clears` +1; build → `daily_builds` +1 (если игрок в команде)

## UI
- Bottom nav: build once, highlight-only (fix кликов вкладок)

## Передача
- Промпт: [`docs/HANDOFF_CHATGPT.md`](HANDOFF_CHATGPT.md)

## Не заявлено DONE
- Premium B02–B20 / CHAR-канон / LEVELS-001 баланс
- Ручной Android smoke E02/E04
- Реальные платежи / production
