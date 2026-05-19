# Open Lingo — frontend
#
# Quick targets:
#   make dev    — local dev, hits localhost:8000 (requires lingo-core running)
#   make live   — frontend-only dev, hits the live API (no local backend needed)
#   make build  — production build
#   make test   — vitest run
#
# `live` reads .env.live (override VITE_API_BASE_URL there). `dev` uses .env.

.PHONY: help dev live build test test-e2e install clean

help:
	@echo "Open Lingo frontend"
	@echo ""
	@echo "  make dev     local API (http://localhost:8000) — needs lingo-core running"
	@echo "  make live    live API (from .env.live)         — no local backend"
	@echo "  make build   production bundle to dist/"
	@echo "  make test    vitest run (CI mode)"
	@echo "  make test-e2e playwright e2e"
	@echo "  make install npm ci"
	@echo "  make clean   remove dist/ and node_modules/.vite"

dev:
	npm run dev

live:
	npm run dev:live

build:
	npm run build

test:
	npm run test:run

test-e2e:
	npm run test:e2e

install:
	npm ci

clean:
	rm -rf dist node_modules/.vite
