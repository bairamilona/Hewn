#!/usr/bin/env sh
# Wrapper around the Node build. Precompiles the JSX to plain JS and assembles
# the self-contained www/ bundle (no runtime Babel), then vendors the fonts.
# Run before `npx cap sync`:  ./build-www.sh && npx cap sync
set -e
cd "$(dirname "$0")"
node build-www.mjs "$@"
