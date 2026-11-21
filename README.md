# Райский остров

Вертикальная (9:16) онлайн PWA-игра жанра Match-3 с восстановлением тропического архипелага, юмористическим сюжетом, PvP и командами.

## Статус
- GDD-01–15 утверждены; BUILDINGS/ISLAND-MAP/ASSETS/B01 baseline approved.
- Код: E01 DONE · Match-3 играбелен · карта острова + стройка на сервере в работе.
- Канон: [docs/GDD_DECISIONS.md](docs/GDD_DECISIONS.md) + GDD_11…15.
- План: [ROADMAP.md](ROADMAP.md) · факт: [docs/STATUS.md](docs/STATUS.md) · графика: [docs/art/ART_PRODUCTION.md](docs/art/ART_PRODUCTION.md).
- Cursor: [AGENTS.md](AGENTS.md) · риски: [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md).

## Технологии
PixiJS 8 + TypeScript PWA · Go + PostgreSQL · React-админка (игроки/уровни) · Docker Compose · CI. Без APK/Capacitor/рекламы/жизней.

## Быстрый старт (dev)
```bash
cp .env.example .env
# PostgreSQL с пользователем/БД paradise (см. .env.example)
make deps
make server-dev   # :8080
make client-dev   # :5173
# опционально: make admin-dev  # :5174
make smoke        # healthz/readyz/version
```

Compose: `make up` → API `:8080`, клиент `:8088`, админка `:8089`.

Staging: `deploy/staging/` + `.env` из `.env.example`. **Production не публиковать без разрешения владельца.**

## Структура
- `apps/client` — PWA игра
- `apps/server` — Go API
- `apps/admin` — scaffold админки
- `deploy/` — Compose local/staging
- `docs/testing/` — ручные чек-листы

Не путать планируемое с реализованным. Проверяйте `docs/STATUS.md`.
