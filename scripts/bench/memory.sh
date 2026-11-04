#!/usr/bin/env bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Launches a packaged .app with N tabs against a local static server and
# records the summed RSS of the browser process tree after a settle period.
#
# Usage:
#   memory.sh --app /path/to/Browser.app [--tabs 1,20,50] [--settle 60]

set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

APP=""
TABS="1,20,50"
SETTLE=60
while [ $# -gt 0 ]; do
  case "$1" in
    --app) APP="$2"; shift 2 ;;
    --tabs) TABS="$2"; shift 2 ;;
    --settle) SETTLE="$2"; shift 2 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ -z "${APP}" ] || [ ! -d "${APP}" ]; then
  echo "--app must point at an existing .app bundle" >&2
  exit 2
fi

EXEC="$(app_executable "${APP}")"
HELPER="${BENCH_DIR}/window_wait"
if [ ! -x "${HELPER}" ]; then
  xcrun swiftc -O "${BENCH_DIR}/window_wait.swift" -o "${HELPER}"
fi

FIXTURE_DIR="${BENCH_DIR}"
PORT="$(python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
)"
python3 -m http.server "${PORT}" --bind 127.0.0.1 --directory "${FIXTURE_DIR}" \
  >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill ${SERVER_PID} 2>/dev/null || true' EXIT
sleep 1

mkdir -p "${RESULTS_DIR}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${RESULTS_DIR}/memory-${STAMP}.json"
ROWS="$(mktemp)"

IFS=',' read -r -a COUNTS <<< "${TABS}"
for COUNT in "${COUNTS[@]}"; do
  PROFILE="$(bench_profile_dir)"
  URLS=()
  for i in $(seq 1 "${COUNT}"); do
    URLS+=("http://127.0.0.1:${PORT}/fixture.html?tab=${i}")
  done

  app_kill "${EXEC}"
  app_wait_gone "${EXEC}" 20 || true
  sleep 2

  # Keep one blank tab, then load the fixture in COUNT tabs.
  "${EXEC}" -profile "${PROFILE}" -no-remote -foreground "${URLS[@]}" \
    >/dev/null 2>&1 &
  PID=$!
  "${HELPER}" "${PID}" 180 >/dev/null || {
    echo "tabs=${COUNT}: no window within 180s" >&2
    kill -9 "${PID}" 2>/dev/null || true
    exit 1
  }

  echo "tabs=${COUNT}: settled ${SETTLE}s" >&2
  sleep "${SETTLE}"
  RSS_KIB="$(tree_rss_kib "${PID}")"
  printf '%s\t%s\t%s\n' "${COUNT}" "${RSS_KIB}" "${PROFILE}" >> "${ROWS}"

  app_kill "${EXEC}"
  app_wait_gone "${EXEC}" 20 || true
done

PAYLOAD="$(python3 - "${ROWS}" <<'PY'
import json, sys

rows = []
with open(sys.argv[1]) as fh:
    for line in fh:
        tabs, rss_kib, profile = line.rstrip("\n").split("\t")
        rows.append({
            "tabs": int(tabs),
            "rss_kib": int(rss_kib),
            "rss_mib": round(int(rss_kib) / 1024, 1),
        })

print(json.dumps({"metric": "rss_after_settle", "rows": rows}, indent=2))
PY
)"

BENCH_MACHINE="$(bench_machine_json)"
export BENCH_MACHINE

write_result "${OUT}" "memory" "${PAYLOAD}"
rm -f "${ROWS}"
echo "wrote ${OUT}"
python3 -c 'import json,sys; print(json.dumps(json.load(open(sys.argv[1]))["data"], indent=2))' "${OUT}"
