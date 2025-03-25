#!/usr/bin/env bash
set -euxo pipefail

git push origin master
mkdir ../darzi-temp
cp -r ../.git ../darzi-temp/.git
cd ../darzi-temp
git checkout pages
git pull origin pages
mkdir ../darzi-pages
cp -r .git ../darzi-pages/.git
cd ../darzi-pages
rm -rf ../darzi-temp
