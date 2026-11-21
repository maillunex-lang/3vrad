# Фактический статус разработки

**Обновлено:** 2026-11-21  
**Ветка:** `cursor/e01-foundation-067d`  
**Канон:** GDD-01–13 APPROVED; `LEVELS_001_DRAFT.md` = DRAFT.

## Сводка

| Этап | Статус | Факт |
|------|--------|------|
| E01 Фундамент | **DONE** (локально проверено) | PWA Pixi 9:16, Go API+Postgres+миграции, Compose/staging, CI, smoke |
| E02 Ядро Match-3 | **IN_PROGRESS** | Pure-TS движок + Pixi UI, 10 verify-уровней, усилители/каскады/блокеры-минимум, 25 vitest |
| E03–E10 | TODO | Не начаты |

## E01 — DONE
**Проверено:** `go test ./...`, `npm test/typecheck/build` (client+admin), curl `/healthz` `/readyz` `/api/v1/version`, миграции в Postgres.  
**Остаток:** зелёный CI на GitHub после push; Docker Compose build опционален для staging-хоста.

## E02 — IN_PROGRESS
**Сделано:**
- ADR-002 правила (ракета/бомба/жемчужина/пропеллер, комбо, лимит каскада 64, множитель очков ≤8).
- `Match3Engine`: обмен, матчи, каскады, тупик→shuffle, подсказки, помощь после 3 поражений.
- Блокеры: crate/ice 1–3 слоя.
- 10 детерминированных verify-уровней; скриптовые победы v01–v07.
- Pixi `GameScreen` + `BoardView` (тапы, HUD, TEMP-фишки).

**Проверено автотестами:** все 10 verify-уровней воспроизводимо выигрываются (script/greedy).

**Не закрыто для DONE E02:**
- Более плавные анимации обмена/падения (сейчас sync + burst/select).
- Расширенные автотесты всех комбо-пар.
- Ручной smoke на Android (`docs/testing/E02_MATCH3.md`).

**Следующие задачи:** анимация ходов → закрытие E02 → E03 визуал.

## Риски
- SERVER-001 A — не полноценный античит.
- LEVELS-001 числа — черновик.
- TEMP-арт — не выдавать за финал.
