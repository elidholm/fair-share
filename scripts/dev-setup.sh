#!/usr/bin/env bash

# Development environment setup script

set -euo pipefail

DIR=$(dirname "$0")

docker compose -f "$DIR/../docker-compose-dev.yml" down

docker compose -f "$DIR/../docker-compose-dev.yml" up --build --remove-orphans --watch
