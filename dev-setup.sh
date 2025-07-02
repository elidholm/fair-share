#!/usr/bin/env bash

# Development environment setup script

set -euo pipefail

docker compose -f docker-compose.yml -f docker-compose-dev.yml down

docker compose -f docker-compose.yml -f docker-compose-dev.yml up --build --remove-orphans --watch
