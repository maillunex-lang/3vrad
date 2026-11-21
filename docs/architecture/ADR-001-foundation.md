# ADR-001: Foundation architecture (E01)

**Status:** Accepted  
**Date:** 2026-11-21  
**Context:** E01 requires a real PWA client, Go API, PostgreSQL, and staging-ready Docker/CI without changing GDD canon.

## Decision

### Monorepo layout
- `apps/client` — PixiJS 8 + TypeScript PWA (main game)
- `apps/server` — Go HTTP/WebSocket API + migrations
- `apps/admin` — React + TypeScript admin (players + level editor); scaffold only in E01
- `deploy/` — Docker Compose for local and staging
- `docs/architecture/` — ADRs
- `docs/testing/` — manual acceptance checklists
- `.github/workflows/` — CI

### Client
- Vite + TypeScript + PixiJS 8
- Vertical 9:16 adaptive canvas letterboxed on wider screens
- PWA via `vite-plugin-pwa` (service worker, web manifest)
- One graphics profile (PERF-001 A); no quality toggle
- TEMP procedural placeholder art until E03 art pipeline

### Server
- Go 1.22+ module `github.com/maillunex-lang/3vrad/apps/server`
- PostgreSQL 16
- SQL migrations in `apps/server/migrations/` applied at startup (or via `migrate` CLI)
- Endpoints in E01: `GET /healthz`, `GET /readyz`, `GET /api/v1/version`
- Structured JSON logs; config via env (12-factor)
- No production secrets in repo; `.env.example` only

### Staging vs production
- Staging Compose stack: `deploy/staging/docker-compose.yml`
- Production deploy requires explicit owner approval (DEPLOY-001 B)

### Risk notes carried forward
- SERVER-001 A (result-only validation) remains a cheat risk; documented in OPEN_QUESTIONS, not mitigated in E01.

## Consequences
- Local `make up` / Compose brings API + DB + static client.
- CI builds client, admin, server and runs server unit/smoke tests + migration check.
