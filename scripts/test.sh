#!/usr/bin/env bash

set -euo pipefail

pushd web
npm test
popd

pushd api/v1
npm test
popd
