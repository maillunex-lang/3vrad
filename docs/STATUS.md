# Фактический статус разработки

**Обновлено:** 2026-11-21  
**Ветка:** `main`  
**Канон:** GDD-01–15 APPROVED; BUILDINGS-001 / ISLAND-MAP-001 / ASSETS-001 / B01-DESIGN-001 A baseline.

## Сводка

| Этап | Статус | Факт |
|------|--------|------|
| E01 Фундамент | DONE | PWA+API+CI |
| E02 Match-3 | ≈ready | engine + campaign DRAFT 100 + clear-on-win |
| E03 Визуал | IN_PROGRESS | gems/UI/B01/zones + TEMP crate/ice; B02–B20 WIP |
| E04 Остров | ≈ready | 7 зон, 20 зданий, soft-lock, сюжет 10…70 |
| E05 Экономика | IN_PROGRESS | guest + shop + inventory (no real payments) |
| E06 Команды/PvP | scaffold | team create/join + daily quests; PvP stub |
| E07 100 уровней | DRAFT | 100 playable; **authored grids 1–20** |

## API (проверено go test)
- Auth/me/clear/buildings (как раньше)
- `GET /shop/catalog`, `POST /shop/buy`, `GET /inventory`, `POST /inventory/use`
- `GET /team`, `POST /team/create`, `POST /team/join` (max 30)

## Клиент
- Вкладки: Остров / Игра (кампания) / Магазин / Команда / PvP-stub
- 36 vitest; сборка PWA зелёная локально

## Не заявлено DONE / MVP
- Premium art B02–B20, CHAR-диалоги, VFX atlases
- Утверждение LEVELS-001
- Полные команды/PvP/античит
- Реальные платежи / production deploy
- Ручной Android smoke
