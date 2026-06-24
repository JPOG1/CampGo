.PHONY: dev build test lint typecheck clean docker-up docker-down db-push db-migrate

dev:
	cd app && npm run dev

build:
	cd app && npm run build

test:
	cd app && npm test

lint:
	cd app && npm run lint

typecheck:
	cd app && npm run typecheck

clean:
	rm -rf app/dist app/coverage

docker-up:
	docker compose up -d

docker-down:
	docker compose down

db-push:
	cd app && npx drizzle-kit push

db-migrate:
	cd app && npx drizzle-kit migrate
