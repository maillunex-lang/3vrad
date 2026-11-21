# Райский остров - дорожная карта

## Статус
- GDD-01–15: **DONE** (утверждено).
- BUILDINGS-001 / ISLAND-MAP-001 / ASSETS-001 / B01-DESIGN-001 A: **APPROVED baseline**.
- `LEVELS_001_DRAFT.md`: DRAFT (баланс не финальный).
- Рабочая ветка: **`main`** (весь код E01–E04 tip влит и пушится сюда).
- Код: E01 DONE · E02≈ready · E03/E04 **IN_PROGRESS**.
- Факт: [docs/STATUS.md](docs/STATUS.md) · графика: [docs/art/ART_PRODUCTION.md](docs/art/ART_PRODUCTION.md).

## Этапы

### E01 - Фундамент [DONE]
Monorepo, Pixi PWA 9:16, Go+Postgres, CI, staging Compose, smoke.

### E02 - Ядро Match-3 [IN_PROGRESS ≈ ready]
- [x] ADR-002, engine, 10 verify levels, FX queue, powerups/blockers.
- [x] Спрайты фишек/усилителей подключены (с fallback).
- [ ] Ручной Android smoke E02_MATCH3.

### E03 - Визуал и UX [IN_PROGRESS]
- [x] Палитра / UI-кнопки / nav / валютные иконки (procedural original).
- [x] Match-3 gems + powerups (generated+processed).
- [x] B01 эталон S0/S1/S3-T/L/F в игре (needs visual QA).
- [ ] Obstacle art, VFX atlases, character art.
- [ ] Замена B02–B20 procedural → финальный Premium art.
**Не объявлять Premium Stylized завершённым.**

### E04 - Остров, строительство и сюжет [IN_PROGRESS]
- [x] 7 зон, фиксированная камера, prev/next/to-task, силуэты.
- [x] 20 зданий как отдельные спрайты + карточка строительства.
- [x] Сервер: этапы, стоимость, 70★ budget, идемпотентность.
- [x] Минимальные анимации воды/пальм (ART-003 A).
- [ ] Сюжетные сцены на рубежах 10/20/…/70.
- [ ] Полный маршрут 1–70 с проверкой soft-lock (автосимуляция).
**Готово, когда:** уровень→звезда→стройка→видимое изменение; прогресс после reload; без double-spend.

### E05 - Прогресс и экономика [PARTIAL]
Гостевой токен, ledger, first-clear stars. Полные аккаунты/магазин — дальше.

### E06–E10
Без изменений приоритета (онлайн, 100 уровней, монетизация, приёмка, бета). Production только с разрешения.

## Правило обновления
Статусы + доказательства. Не менять GDD без согласования. Не выдавать WIP-арт за финал.
