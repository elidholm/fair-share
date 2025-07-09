#!/usr/bin/env bash

set -euo pipefail

echo "Linting files..."

echo -e "\n****** YAML Linting ******"
yamllint . && echo "YAML linting passed."

echo -e "\n****** Shell Script Linting ******"
pushd scripts
shellcheck ./*.sh && echo "Shell script linting passed."
popd

echo -e "\n****** Frontend Linting ******"
pushd frontend
npm run lint
popd

echo -e "\n****** Dockerfile Linting ******"
for file in ./**/*Dockerfile*; do
  docker run --rm -i ghcr.io/hadolint/hadolint < "$file"
done && echo "Dockerfile linting passed."

