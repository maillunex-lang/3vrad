# Фактический статус разработки

**Обновлено:** 2026-11-21  
**Ветка:** `main` (рабочая; feature-ветки/PR #1–#2 влиты сюда)  
**HEAD:** после push — tip с island/build/art  
**Канон:** GDD-01–15 APPROVED; BUILDINGS-001 / ISLAND-MAP-001 / ASSETS-001 / B01-DESIGN-001 A утверждены как baseline.

## Сводка

| Этап | Статус | Факт |
|------|--------|------|
| E01 Фундамент | DONE | PWA+API+CI |
| E02 Match-3 ядро | IN_PROGRESS≈ready | 28 vitest, спрайты фишек подключены |
| E03 Визуал | IN_PROGRESS | Дизайн-система UI, gems, B01, зоны; B02–B20 WIP procedural |
| E04 Остров/стройка | IN_PROGRESS | 7 зон, 20 зданий, сервер звёзд/строек, карточка здания |
| E05 Прогресс | PARTIAL | Гостевой аккаунт + ledger + first-clear star |

## Графика (не завышать)
- **Интегрировано:** B01 ×5 webp (gen+process), 5 gems, 4 powerups, UI pack, 7 zone BG + silhouette, procedural B02–B20.
- **WIP / не финал:** B02–B20 procedural (заменяемые объекты); B01 требует визуальной приёмки vs design A.
- **Missing:** dedicated obstacle art, character portraits, full VFX atlases.
- Журнал: `docs/art/ART_PRODUCTION.md` · runtime catalog `assets/catalog/assets_v1.json`

## Сервер экономики (проверено curl + go test)
- `POST /auth/guest`, `GET /me`, `POST /levels/clear` (1★ first clear 1–70, idempotent)
- `POST /buildings/advance` / `style` (idempotent, no double spend)
- Бюджет каталога = **70** ★

## Не заявлено DONE
- Полный Premium art для всех 20 зданий
- Ручной Android smoke карты
- Production deploy
