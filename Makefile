.PHONY: help deps client-dev server-dev admin-dev test typecheck build migrate up down smoke

help:
	@echo "Paradise Island targets:"
	@echo "  make deps        - install client/admin npm + go mods"
	@echo "  make server-dev  - run Go API (needs Postgres)"
	@echo "  make client-dev  - Vite PWA client"
	@echo "  make admin-dev   - Vite admin scaffold"
	@echo "  make test        - unit tests"
	@echo "  make build       - production builds"
	@echo "  make up          - docker compose stack"
	@echo "  make down        - stop compose stack"
	@echo "  make smoke       - local API smoke curl"

deps:
	cd apps/client && npm install
	cd apps/admin && npm install
	cd apps/server && go mod tidy

client-dev:
	cd apps/client && npm run dev

admin-dev:
	cd apps/admin && npm run dev

server-dev:
	cd apps/server && go run ./cmd/server

test:
	cd apps/client && npm test
	cd apps/server && go test ./...

typecheck:
	cd apps/client && npm run typecheck
	cd apps/admin && npm run typecheck

build:
	cd apps/client && npm run build
	cd apps/admin && npm run build
	cd apps/server && go build -o bin/server ./cmd/server

up:
	docker compose -f deploy/docker-compose.yml up --build -d

down:
	docker compose -f deploy/docker-compose.yml down

smoke:
	curl -sf http://127.0.0.1:8080/healthz && echo
	curl -sf http://127.0.0.1:8080/readyz && echo
	curl -sf http://127.0.0.1:8080/api/v1/version && echo
