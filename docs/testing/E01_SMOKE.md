# E01 — ручной smoke-test

## Предусловия
- PostgreSQL доступен (`paradise` / `paradise_dev` / DB `paradise`) или `make up`
- API: `http://127.0.0.1:8080`
- Client: `http://127.0.0.1:5173` (dev) или `:8088` (compose)

## Чек-лист

| # | Шаг | Ожидание | Результат |
|---|-----|----------|-----------|
| 1 | `GET /healthz` | `{"status":"ok"}` | |
| 2 | `GET /readyz` | `{"status":"ready"}` | |
| 3 | `GET /api/v1/version` | service/version/env | |
| 4 | Открыть PWA client | вертикальный холст 9:16, TEMP-остров | |
| 5 | Статус API на экране | версия API или «офлайн» | |
| 6 | Изменить размер окна | letterbox без растягивания | |
| 7 | (Android Chrome) Add to Home Screen | иконка TEMP, portrait | |
| 8 | Админка `/` | scaffold-страница, не студия | |
| 9 | Повторный старт API | миграции идемпотентны | |

## Автоматические проверки
- `cd apps/client && npm test && npm run typecheck && npm run build`
- `cd apps/admin && npm run typecheck && npm run build`
- `cd apps/server && go test ./... && go build ./cmd/server`
- CI workflow `.github/workflows/ci.yml`

## Замечания
- Иконки и остров помечены TEMP — не финальный арт (E03).
- Production не деплоить без разрешения владельца.
