#!/usr/bin/env bash

set -euo pipefail

pushd frontend
npm ci

npm run lint

npm test
popd
