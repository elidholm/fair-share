.PHONY: dev prod lint test ci clean

dev:
	@./scripts/dev-setup.sh

prod:
	@docker stack deploy -c docker-stack.yml fairshare

lint:
	@./scripts/lint.sh

test:
	@./scripts/test.sh

ci:
	@./scripts/ci.sh

clean:
	@./scripts/clean.sh
