#!/usr/bin/env bash

set -euo pipefail

echo "Cleaning up files..."
sudo rm -rf local_db

rm -rf frontend/node_modules
rm -rf frontend/dist
rm -rf frontend/.cache

rm -rf backend/node_modules
rm -rf backend/dist
rm -rf backend/.cache
echo "Cleanup complete"
