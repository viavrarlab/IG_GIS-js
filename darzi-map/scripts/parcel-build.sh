#!/usr/bin/env bash
set -euxo pipefail

cross-env NODE_ENV=production parcel build index.html --public-url .
