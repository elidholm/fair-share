#!/usr/bin/env bash

set -euo pipefail

echo "Cleaning up files..."
docker compose -f docker-compose-dev.yml down --volumes --remove-orphans
sudo rm -rf local_db

rm -rf web/dist
rm -rf web/coverage
rm -rf web/.cache

rm -rf api/v1/dist
rm -rf api/v1/coverage
rm -rf api/v1/.cache
echo "Cleanup complete"
