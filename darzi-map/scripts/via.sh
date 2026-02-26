#!/usr/bin/env bash
set -euxo pipefail

(bash scripts/via-init.sh)
(bash scripts/via-pub.sh)
(bash scripts/via-del.sh)
