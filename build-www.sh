#!/usr/bin/env sh
# Assemble the self-contained web bundle in www/ for Capacitor (iOS / Android).
#
# React, ReactDOM and Babel-standalone are rewritten from the unpkg CDN to the
# vendored local copies, so the native app runs fully offline and does NOT load
# a remote URL — which keeps it clear of App Store Guideline 4.2 (a native app
# must not just be a wrapper around a website served from the internet).
#
# Run this before `npx cap sync` whenever index.html or the vendored libs change:
#   ./build-www.sh && npx cap sync
set -e
cd "$(dirname "$0")"

rm -rf www
mkdir -p www/vendor www/assets/icons

# index.html with the CDN <script src> URLs pointed at the vendored files.
sed -e 's#https://unpkg.com/react@18/umd/react.production.min.js#vendor/react.js#' \
    -e 's#https://unpkg.com/react-dom@18/umd/react-dom.production.min.js#vendor/react-dom.js#' \
    -e 's#https://unpkg.com/@babel/standalone/babel.min.js#vendor/babel.js#' \
    index.html > www/index.html

cp vendor/react.js vendor/react-dom.js vendor/babel.js www/vendor/
cp assets/icons/*.png www/assets/icons/
cp manifest.json www/

echo "Built www/ ($(du -sh www | cut -f1)) — now run: npx cap sync"
