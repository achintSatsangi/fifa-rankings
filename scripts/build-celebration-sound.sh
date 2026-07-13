#!/usr/bin/env bash
# Rebuild public/sounds/celebration.mp3 from three Mixkit source clips.
# Sources are downloaded to /tmp on each run so we don't ship raw MP3s
# alongside the mixed output. Requires ffmpeg on PATH.
#
# Mixkit Sound Effects Free License — commercial + non-commercial use,
# no attribution required.
#
# Layers (all start at t=0):
#   whistle       (Mixkit #606, ~3.4 s) — sharp pea whistle, volume 0.85
#   brass-fanfare (Mixkit #2992, ~2 s) — triumphant trumpets, volume 1.0
#   crowd-cheer   (Mixkit #460, trimmed) — background chatter at 50 %,
#                                          faded out 2.9-3.4 s
#
# Output: 2.2 s stereo MP3 at 128 kbps.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${REPO_ROOT}/public/sounds/celebration.mp3"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fetch() {
  local id="$1" name="$2"
  curl -sSL "https://assets.mixkit.co/active_storage/sfx/${id}/${id}-preview.mp3" -o "${TMP}/${name}"
}

fetch 606  whistle.mp3
fetch 2992 brass.mp3
fetch 460  crowd.mp3

ffmpeg -y \
  -i "${TMP}/whistle.mp3" \
  -i "${TMP}/brass.mp3" \
  -i "${TMP}/crowd.mp3" \
  -filter_complex "\
    [0:a]volume=0.85,atrim=0:2.2,afade=t=out:st=1.9:d=0.3[a1];\
    [1:a]volume=1.0,atrim=0:2.2,afade=t=out:st=1.9:d=0.3[a2];\
    [2:a]volume=0.5,atrim=0:2.2,afade=t=out:st=1.7:d=0.5[a3];\
    [a1][a2][a3]amix=inputs=3:duration=longest:normalize=0[out]" \
  -map "[out]" -ac 2 -b:a 128k -t 2.2 \
  "${OUT}"

echo "Wrote ${OUT}"
