#!/usr/bin/env bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Measures spawn -> first on-screen window for a packaged .app.
#
# Usage:
#   startup.sh --app /path/to/Browser.app [--runs 10] [--fresh-each]
#
# The first run uses a fresh profile. Later runs reuse it unless --fresh-each
# is passed, which is reported as profile=fresh on every run.

set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

APP=""
RUNS=10
FRESH_EACH=0
while [ $# -gt 0 ]; do
  case "$1" in
    --app) APP="$2"; shift 2 ;;
    --runs) RUNS="$2"; shift 2 ;;
    --fresh-each) FRESH_EACH=1; shift ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
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
  echo "compiling window_wait.swift" >&2
  xcrun swiftc -O "${BENCH_DIR}/window_wait.swift" -o "${HELPER}"
fi

mkdir -p "${RESULTS_DIR}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${RESULTS_DIR}/startup-${STAMP}.json"
ROWS="$(mktemp)"

app_kill "${EXEC}"
app_wait_gone "${EXEC}" 20 || true

PROFILE="$(bench_profile_dir)"
for i in $(seq 1 "${RUNS}"); do
  if [ "${FRESH_EACH}" -eq 1 ] || [ "${i}" -eq 1 ]; then
    PROFILE="$(bench_profile_dir)"
    KIND="fresh"
  else
    KIND="reused"
  fi

  START_NS="$(python3 -c 'import time; print(time.monotonic_ns())')"
  "${EXEC}" -profile "${PROFILE}" -no-remote -foreground about:blank \
    >/dev/null 2>&1 &
  PID=$!

  MS="$( "${HELPER}" "${PID}" 180 )" || {
    echo "run ${i}: no window within 180s" >&2
    kill -9 "${PID}" 2>/dev/null || true
    exit 1
  }

  printf '%s\t%s\t%s\n' "${i}" "${KIND}" "${MS}" >> "${ROWS}"

  app_kill "${EXEC}"
  app_wait_gone "${EXEC}" 20 || true
  sleep 2
done

PAYLOAD="$(python3 - "${ROWS}" <<'PY'
import json, statistics, sys

rows = []
with open(sys.argv[1]) as fh:
    for line in fh:
        run, profile, ms = line.rstrip("\n").split("\t")
        rows.append({"run": int(run), "profile": profile, "ms": float(ms)})

def series(kind):
    return [r["ms"] for r in rows if r["profile"] == kind]

def summary(values):
    if not values:
        return None
    values = sorted(values)
    n = len(values)
    p95 = values[min(n - 1, int(round(0.95 * (n - 1))))]
    return {
        "n": n,
        "median_ms": round(statistics.median(values), 1),
        "p95_ms": round(p95, 1),
        "min_ms": round(values[0], 1),
        "max_ms": round(values[-1], 1),
    }

print(json.dumps({
    "metric": "spawn_to_first_window",
    "runs": rows,
    "fresh": summary(series("fresh")),
    "reused": summary(series("reused")),
}, indent=2))
PY
)"

BENCH_MACHINE="$(bench_machine_json)"
export BENCH_MACHINE

write_result "${OUT}" "startup" "${PAYLOAD}"
rm -f "${ROWS}"
echo "wrote ${OUT}"
python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(json.dumps({k:v for k,v in d["data"].items() if k in ("fresh","reused")}, indent=2))' "${OUT}"
