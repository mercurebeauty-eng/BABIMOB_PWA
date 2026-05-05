#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
#  Prépare les fichiers d'entrée pour OTP :
#    1) Extract OSM de la Côte d'Ivoire (Geofabrik)
#    2) Re-zip du GTFS depuis les CSV
#  À lancer AVANT de builder l'image Docker.
# ════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${SCRIPT_DIR}/graphs/abidjan"
GTFS_SRC="${GTFS_SRC:-/c/Users/USER/Documents/BABIMOB/abidjan_paratransit_gtfs_20230726}"

mkdir -p "${DEST}"

# ─── 1) OSM extract Côte d'Ivoire ───────────────────────────────────────
OSM_FILE="${DEST}/cote-d-ivoire-latest.osm.pbf"
if [ -f "${OSM_FILE}" ]; then
  echo "✓ OSM déjà présent : ${OSM_FILE}"
else
  echo "⬇  Téléchargement OSM Côte d'Ivoire (Geofabrik, ~45 MB)…"
  curl -L -o "${OSM_FILE}" \
    "https://download.geofabrik.de/africa/cote-d-ivoire-latest.osm.pbf"
  echo "✓ OSM téléchargé"
fi

# ─── 2) Zip du GTFS depuis les CSV ──────────────────────────────────────
GTFS_ZIP="${DEST}/abidjan-gtfs.zip"
if [ -f "${GTFS_ZIP}" ]; then
  echo "✓ GTFS zip déjà présent : ${GTFS_ZIP}"
else
  if [ ! -d "${GTFS_SRC}" ]; then
    echo "✗ GTFS_SRC introuvable : ${GTFS_SRC}"
    echo "  Définis GTFS_SRC ou édite ce script."
    exit 1
  fi
  echo "📦 Création du zip GTFS depuis ${GTFS_SRC}…"
  (cd "${GTFS_SRC}" && zip -r "${GTFS_ZIP}" \
    agency.txt calendar.txt feed_info.txt frequencies.txt routes.txt \
    shapes.txt stop_times.txt stops.txt trips.txt)
  echo "✓ GTFS zippé"
fi

# ─── 3) Copier les configs ──────────────────────────────────────────────
cp "${SCRIPT_DIR}/build-config.json"  "${DEST}/"
cp "${SCRIPT_DIR}/router-config.json" "${DEST}/"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " ✓ Données prêtes dans : ${DEST}"
echo "   Étape suivante : docker build -t babimob-otp ."
echo "═══════════════════════════════════════════════════════════"
