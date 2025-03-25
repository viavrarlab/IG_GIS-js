#!/usr/bin/env bash
set -euxo pipefail

cross-env NODE_ENV=development parcel index.html --host 127.0.0.1 --no-hmr --open
