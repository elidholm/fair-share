#!/usr/bin/env bash

set -euo pipefail

echo "Running CI checks..."

echo -e "\n****** Frontend Checks ******"
pushd frontend
npm ci

npm run lint

npm test

npm run build
popd

echo -e "\n****** YAML Linting ******"
yamllint . && echo "YAML linting passed."

echo -e "\n****** Shell Script Linting ******"
shellcheck ./**/*.sh && echo "Shell script linting passed."

echo -e "\n****** Dockerfile Linting ******"
for file in ./**/*Dockerfile*; do
  docker run --rm -i ghcr.io/hadolint/hadolint < "$file"
done && echo "Dockerfile linting passed."
