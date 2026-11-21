# Райский остров — дорожная карта

## Источники истины
1. `docs/GDD_DECISIONS.md` — канон (не менять без согласования).
2. Этот файл — порядок работ и критерии готовности.
3. `docs/OPEN_QUESTIONS.md` — открытые риски.
4. `docs/STATUS.md` — фактический снимок кода.
5. `docs/art/ART_PRODUCTION.md` — журнал графики (не завышать статус).

**Рабочая ветка:** `main`  
**Tip (после merge nav/content):** см. `git rev-parse HEAD` на `main`.

## Сводка этапов

| Этап | Статус | Критерий DONE |
|------|--------|---------------|
| E01 Фундамент | **DONE** | Monorepo, PWA, Go+PG, CI, Compose |
| E02 Match-3 | ≈ready | Ручной Android smoke E02_MATCH3 |
| E03 Визуал | IN_PROGRESS | Visual QA B01 + не выдавать WIP за Premium |
| E04 Остров | ≈ready | Android smoke карты + приёмка B01 |
| E05 Экономика | IN_PROGRESS | Email-привязка / утверждённые цены — владельцем |
| E06 Команды/PvP | scaffold | Общий остров, чат, награды квестов, PvP |
| E07 100 уровней | DRAFT | Authored 41–100 + плейтест + утверждение баланса |
| E08–E10 | later | VIP/pass без реальных списаний; бета; prod только с разрешения |

---

### E01 — Фундамент [DONE]
- [x] Monorepo, PixiJS 8 PWA 9:16, Go API, PostgreSQL, CI, staging Compose, smoke.

### E02 — Ядро Match-3 [≈ready]
- [x] ADR-002, engine, verify levels, FX queue, powerups/blockers (crate/ice).
- [x] Спрайты фишек/усилителей (с fallback).
- [x] Кампания 1–100 `campaignDraft` (**DRAFT**, не финальный баланс).
- [x] Браузерный smoke основного цикла: вкладки, прохождение уровня 1, возврат на остров ([результаты](docs/testing/E02_MATCH3.md)).
- [ ] Ручной Android smoke по E02_MATCH3.

### E03 — Визуал и UX [IN_PROGRESS]
- [x] Палитра, UI, nav, валюты (original procedural).
- [x] Gems + powerups; obstacle TEMP crate/ice.
- [x] B01 эталон S0/S1/S3 T/L/F в игре (**needs visual QA**).
- [x] B02–B20: gen/procedural S0+S1+S3 tropical **и** S3 luxury/fantasy файлы (v2) — **не Premium**.
- [x] TEMP portraits ×4 + StoryOverlay; VFX clear/zone/star.
- [x] Bottom nav: стабильные hit-target (не пересобирать на каждый tab).
- [ ] Visual QA B01 vs design A; улучшение art без ложного «Premium DONE».
- [ ] Утверждённый CHAR-канон + финальные портреты.

### E04 — Остров, строительство, сюжет [≈ready]
- [x] 7 зон, 20 зданий, сервер звёзд, soft-lock 1–70.
- [x] Сюжетные биты 10…70 TEMP; победа → clear → остров.
- [x] Стили tropical / luxury@20 / fantasy@40 (soft-gate).
- [x] Браузерный smoke карты: кнопки зон, карточка задания, стройка B01, сохранение при смене вкладки и перезагрузке.
- [ ] Ручной Android smoke карты острова + визуальная приёмка.

### E05 — Прогресс и экономика [IN_PROGRESS]
- [x] Гостевой токен, ledger, first-clear ★, стартовые монеты/алмазы.
- [x] Магазин + инвентарь + авто-бустер на старт (идемпотентно; **без рекламы и реальных платежей**).
- [ ] Привязка email (OPEN_QUESTIONS #3).
- [ ] Утверждённые цены (OPEN_QUESTIONS #12 / E08).

### E06 — Онлайн / команды / PvP [scaffold]
- [x] Команды create/join/me, лимит 30, invite code.
- [x] Daily quests: `daily_clears` / `daily_builds` (+ increment с clear/build, cap, UTC reset).
- [ ] Награды квестов (без фарма).
- [ ] Общий остров команды / чат (модерация — OPEN_QUESTIONS #11).
- [ ] PvP дуэли 3 мин + мониторинг (SERVER-001 A: **риск читов**, не скрывать).

### E07 — Контент 100 уровней [DRAFT]
- [x] Playable pack из `LEVELS_001_DRAFT.md` (не утверждён).
- [x] Авторские карты клеток **1–40**.
- [ ] Авторские карты **41–100**.
- [ ] Плейтесты / баланс / утверждение владельцем.
- [ ] Админ-редактор уровней (ADMIN-001 A scope).

### E08–E10 — Монетизация, приёмка, бета
- VIP/pass **без реальных списаний** без отдельного разрешения.
- Публичная бета с постепенным добавлением островов.
- Production / платежи / удаление данных — только с разрешения владельца.

---

## Следующие задачи (приоритет)

1. **Ручной Android smoke** nav + Match-3 + остров (закрыть оставшуюся приёмку E02/E04).
2. **Authored grids 41–60** (затем 61–100).
3. **Награды командных квестов** (без эксплойта фарма).
4. Art polish (не объявлять Premium) / CHAR канон — по решению владельца.
5. PvP — только после явного приоритета; помнить SERVER-001 A.

## Правила
- Этапы строго по порядку критериев; не выдавать заглушки за готовые фичи.
- Не менять GDD без согласования; обратимые ADR — ок.
- Не коммитить секреты; staging отдельно от prod.
- Документация = факты (сборка / тест / наблюдаемый результат).
