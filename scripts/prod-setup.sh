#!/usr/bin/env bash

# Production environment setup script

set -euo pipefail

DIR=$(dirname "$0")

docker compose -f "$DIR/../docker-compose.yml" down

docker compose pull

docker compose -f "$DIR/../docker-compose.yml" up --build --remove-orphans -d

# Print helpful information
echo ""
echo "Production environment is running!"
echo "- Frontend: https://fairshare.fun"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
