#!/usr/bin/env sh
# Assemble the self-contained web bundle in www/ for Capacitor (iOS / Android).
#
# 1. React, ReactDOM and Babel-standalone are rewritten from the unpkg CDN to
#    the vendored local copies in /vendor.
# 2. The Google Fonts stylesheet (loaded at runtime) and its woff2 files are
#    downloaded into the bundle and the app is pointed at the local copies.
#
# The result runs fully offline and loads nothing from the internet, so the
# native app is not a wrapper around a remote website (App Store Guideline 4.2).
#
# Portable across GNU (Linux) and BSD (macOS) sed — avoids `sed -i`.
#
# Run before `npx cap sync` whenever index.html or the vendored libs change:
#   ./build-www.sh && npx cap sync
set -e
cd "$(dirname "$0")"

rm -rf www
mkdir -p www/vendor www/assets/icons www/assets/fonts

# --- 1. index.html with the CDN <script src> URLs pointed at the vendored files.
sed -e 's#https://unpkg.com/react@18/umd/react.production.min.js#vendor/react.js#' \
    -e 's#https://unpkg.com/react-dom@18/umd/react-dom.production.min.js#vendor/react-dom.js#' \
    -e 's#https://unpkg.com/@babel/standalone/babel.min.js#vendor/babel.js#' \
    index.html > www/index.html

cp vendor/react.js vendor/react-dom.js vendor/babel.js www/vendor/
cp assets/icons/*.png www/assets/icons/
cp manifest.json www/

# --- 2. Vendor the editorial fonts (needs internet at build time).
FONT_URL="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Hanken+Grotesk:wght@500;600&display=swap"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

if curl -sfA "$UA" "$FONT_URL" -o www/assets/fonts.css; then
  i=0
  for url in $(grep -oE 'https://fonts\.gstatic\.com/[^ )]+\.woff2' www/assets/fonts.css | sort -u); do
    fname="f${i}.woff2"; i=$((i + 1))
    if curl -sf "$url" -o "www/assets/fonts/$fname"; then
      esc=$(printf '%s' "$url" | sed 's/[\/&.?]/\\&/g')
      sed "s/$esc/fonts\/$fname/g" www/assets/fonts.css > www/assets/fonts.css.tmp
      mv www/assets/fonts.css.tmp www/assets/fonts.css
    fi
  done
  # point the runtime font loader at the local stylesheet
  sed 's#https://fonts.googleapis.com/css2?family=[^"]*#assets/fonts.css#' www/index.html > www/index.html.tmp
  mv www/index.html.tmp www/index.html
  echo "Fonts vendored: $i file(s)."
else
  echo "WARNING: could not fetch fonts (offline?). Bundle will use Google Fonts online / system fallback."
fi

echo "Built www/ ($(du -sh www | cut -f1)) — now run: npx cap sync"
