#!/usr/bin/env bash
set -euxo pipefail

rm -rf dist
(bash scripts/parcel-build.sh)
mv dist/* ../darzi-pages
cd ../darzi-pages
git add .
git commit -m 'Updated pages.'
git push via pages
