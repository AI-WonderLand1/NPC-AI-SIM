#!/usr/bin/env bash
set -euo pipefail

MESHROOM_VERSION="2025.1.0"
MESHROOM_URL="https://zenodo.org/records/16887472/files/Meshroom-${MESHROOM_VERSION}-Linux.tar.gz"
MESHROOM_TARBALL="vendor/Meshroom-${MESHROOM_VERSION}-Linux.tar.gz"
MESHROOM_DIR="vendor/Meshroom-${MESHROOM_VERSION}-Linux"

echo "========================================="
echo " WonderPlay 3D - Meshroom Setup"
echo "========================================="
echo ""

if [ -d "$MESHROOM_DIR" ]; then
  echo "Meshroom ${MESHROOM_VERSION} already downloaded."
  echo "Remove vendor/ and re-run to re-download."
  exit 0
fi

mkdir -p vendor

echo "Downloading Meshroom ${MESHROOM_VERSION} (~14 GB)..."
echo "URL: ${MESHROOM_URL}"
echo ""

curl -fL -o "$MESHROOM_TARBALL" "$MESHROOM_URL"

echo ""
echo "Extracting..."
tar xzf "$MESHROOM_TARBALL" -C vendor/

rm -f "$MESHROOM_TARBALL"

echo ""
echo "========================================="
echo " Meshroom ${MESHROOM_VERSION} installed!"
echo "========================================="
echo ""
echo "Run 'nix develop' to enter the dev shell"
echo "Then run 'meshroom' to start Meshroom"
echo ""