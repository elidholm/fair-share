#!/usr/bin/env bash

set -euo pipefail

pushd frontend
npm test
popd
