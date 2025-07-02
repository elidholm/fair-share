#!/usr/bin/env bash

# Production environment setup script

set -euo pipefail

docker compose down

docker compose pull

docker compose up --build --remove-orphans -d

# Print helpful information
echo ""
echo "Production environment is running!"
echo "- Frontend: https://fairshare.fun"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
