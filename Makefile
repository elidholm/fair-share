.PHONY: dev prod lint test ci clean

dev:
	@./scripts/dev-setup.sh

prod:
	@./scripts/prod-setup.sh

lint:
	@./scripts/lint.sh

test:
	@./scripts/test.sh

ci:
	@./scripts/ci.sh

clean:
	@./scripts/clean.sh
