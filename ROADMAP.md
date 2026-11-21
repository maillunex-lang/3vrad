# Райский остров - дорожная карта

## Статус
- GDD-01–15: **DONE** (утверждено).
- BUILDINGS-001 / ISLAND-MAP-001 / ASSETS-001 / B01-DESIGN-001 A: **APPROVED baseline**.
- `LEVELS_001_DRAFT.md`: DRAFT (баланс не финальный).
- Рабочая ветка: **`main`** (весь код E01–E04 tip влит и пушится сюда).
- Код: E01 DONE · E02≈ready · E03/E04≈ready · E05/E06 **IN_PROGRESS** (магазин+команды scaffold) · кампания 100 DRAFT.
- Факт: [docs/STATUS.md](docs/STATUS.md) · графика: [docs/art/ART_PRODUCTION.md](docs/art/ART_PRODUCTION.md).

## Этапы

### E01 - Фундамент [DONE]
Monorepo, Pixi PWA 9:16, Go+Postgres, CI, staging Compose, smoke.

### E02 - Ядро Match-3 [IN_PROGRESS ≈ ready]
- [x] ADR-002, engine, 10 verify levels, FX queue, powerups/blockers.
- [x] Спрайты фишек/усилителей подключены (с fallback).
- [x] Кампания 1–100 как `campaignDraft` (DRAFT, не финальный баланс).
- [ ] Ручной Android smoke E02_MATCH3.

### E03 - Визуал и UX [IN_PROGRESS]
- [x] Палитра / UI-кнопки / nav / валютные иконки (procedural original).
- [x] Match-3 gems + powerups (generated+processed).
- [x] B01 эталон S0/S1/S3-T/L/F в игре (needs visual QA).
- [x] Obstacle art TEMP: crate/ice webp на поле.
- [x] TEMP portraits ×4 + StoryOverlay; VFX clear/zone/star webp.
- [x] B02–B20 v2 silhouettes; gen S3 tropical для B03/B05/B10/B20.
- [ ] Полный Premium pass всех состояний/стилей B02–B20.
- [ ] Утверждённый CHAR-канон + финальные портреты.
**Не объявлять Premium Stylized завершённым.**

### E04 - Остров, строительство и сюжет [IN_PROGRESS ≈ ready]
- [x] 7 зон, 20 зданий, сервер звёзд, soft-lock 1–70, сюжет 10…70 TEMP.
- [x] Победа → clear → остров; стили 20/40.
**Осталось для DONE:** ручной Android smoke карты + визуальная приёмка B01.

### E05 - Прогресс и экономика [IN_PROGRESS]
- [x] Гостевой токен, ledger, first-clear stars, стартовые 🪙/💎.
- [x] Магазин усилителей/наборов за монеты/алмазы (идемпотентно, без рекламы, без реальных платежей).
- [x] Инвентарь + авто-расход бустера на старт уровня.
- [ ] Привязка аккаунта email (OPEN_QUESTIONS #3).
- [ ] Утверждённые цены (OPEN_QUESTIONS #12 / E08).

### E06 - Онлайн / команды / PvP [IN_PROGRESS scaffold]
- [x] Команды: create/join/me, лимит 30, код приглашения.
- [x] Ежедневные командные квесты (progress scaffold, без наградного фарма).
- [ ] Общий остров / чат / инкремент квестов с clear/build.
- [ ] PvP дуэли 3 мин + античит-мониторинг (SERVER-001 A риск).

### E07 - Контент 100 уровней [IN_PROGRESS DRAFT]
- [x] Playable DRAFT pack из LEVELS_001 (не утверждён как баланс).
- [x] Авторские карты клеток уровней 1–20.
- [ ] Карты 21–100 / плейтесты / утверждение владельцем.

### E08–E10
Монетизация VIP/pass (без реальных списаний без разрешения), приёмка, публичная бета. Production только с разрешения.

## Правило обновления
Статусы + доказательства. Не менять GDD без согласования. Не выдавать WIP-арт за финал.
