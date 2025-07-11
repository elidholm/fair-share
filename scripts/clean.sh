#!/usr/bin/env bash

set -euo pipefail

echo "Cleaning up files..."
sudo rm -rf local_db

rm -rf frontend/dist
rm -rf frontend/coverage
rm -rf frontend/.cache

rm -rf backend/dist
rm -rf backend/coverage
rm -rf backend/.cache
echo "Cleanup complete"
