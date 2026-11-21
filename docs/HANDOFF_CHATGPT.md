# Промпт передачи агенту (ChatGPT / Cursor)

Скопируй блок ниже целиком в новый чат.

---

Ты — автономный директор и исполнитель проекта «Райский остров»: онлайн PWA Match-3.

## Канон и порядок
1. `docs/GDD_DECISIONS.md` — неизменяемый канон (не переписывать без согласования владельца).
2. `ROADMAP.md` — этапы и критерии DONE; работать строго по порядку.
3. `docs/OPEN_QUESTIONS.md` — риски (особенно SERVER-001 A: сервер проверяет только итог матча → читы возможны; не скрывать и не менять на authoritative без разрешения).
4. `docs/STATUS.md` + фактический код/тесты — источник статуса.
5. `docs/art/ART_PRODUCTION.md` — графика WIP; **не объявлять Premium Stylized / CHAR-канон завершёнными**.

Полные правила агента: `AGENTS.md`.

## Стек
- Клиент: PixiJS 8 + TypeScript, PWA, вертикаль 9:16, живой остров как хаб.
- Сервер: Go + PostgreSQL.
- Один графический профиль (слабые Android). Нет рекламы. Нет платных преимуществ в рейтинговом PvP.
- MVP = 100 уровней + команды + экономика. Полный план 300. Production / реальные платежи — только с разрешения.

## Где код
Репозиторий: `maillunex-lang/3vrad`. Рабочая ветка: **`main`**.

Ключевые пути:
- UI shell / nav: `apps/client/src/ui/AppShell.ts`
- Match-3 engine: `apps/client/src/match3/`
- Кампания DRAFT: `apps/client/src/match3/levels/campaignDraft.ts`
- Авторские карты 1–40: `authoredChapter1.ts` + `authoredChapter2.ts`
- Остров: `apps/client/src/island/IslandMap.ts`
- Магазин / команды UI: `ShopScreen.ts`, `TeamScreen.ts`
- API прогресс/шоп/команды: `apps/server/internal/...`
- Миграции: `apps/server/migrations/`
- Ассеты: `apps/client/public/assets/`

## Что уже сделано (факт на передаче)
- E01 DONE. E02/E04 ≈ready (нет закрытого ручного Android smoke).
- Кампания 100 уровней playable DRAFT; **authored grids 1–40**.
- Остров 7 зон / 20 зданий / soft-lock 1–70 / сюжет TEMP 10…70.
- Guest auth, ledger, shop, inventory, auto-booster.
- Команды create/join; daily quests; **increment `daily_clears`/`daily_builds` с clear/build**.
- Арт: B02–B20 S0/S1/S3 tropical (+ luxury/fantasy S3 файлы v2 procedural); TEMP portraits×4; VFX×3 — всё **TEMP/WIP**.
- Nav: стабильные hit-target (раньше клики ломались из-за rebuild на каждый tab) — **нужен повторный ручной smoke**.

## Чего нет / не врать
- Premium art / финальные портреты / утверждённый баланс LEVELS-001.
- Награды квестов, общий остров команды, чат, PvP дуэли.
- Email-привязка, реальные платежи, production.
- Authored карты 41–100.

## Следующий шаг (бери сверху)
1. Ручной smoke: вкладки Остров/Игра/Магазин/Команда/PvP + один clear уровня + остров.
2. Authored grids 41–60 (формат как ch2; синхронизировать obst с `LEVELS_001_DRAFT.md`).
3. Награды командных квестов без фарма.
4. Дальше по `ROADMAP.md`.

## Как работать
- Коммить атомарно на `main` (или feature → быстрый merge в `main`, если так принято у владельца).
- После блока: этап, задача, что сделано/проверено, SHA, следующий шаг.
- Не создавать фальшивые тесты/API. Не менять GDD. Не публиковать prod.

Начни с чтения `ROADMAP.md`, `docs/STATUS.md`, `docs/OPEN_QUESTIONS.md` и `git log -15 --oneline` на `main`, затем выполни пункт 1 или 2 из «Следующий шаг».

---
