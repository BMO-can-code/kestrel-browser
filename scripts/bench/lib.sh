#!/usr/bin/env bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Shared helpers for the benchmark scripts. Sourced, not executed.

set -euo pipefail

BENCH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${BENCH_DIR}/../.." && pwd)"
RESULTS_DIR="${RESULTS_DIR:-${REPO_DIR}/docs/benchmarks/raw}"

# Resolve the CFBundleExecutable of an .app bundle.
app_executable() {
  local app="$1"
  local name
  name="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "${app}/Contents/Info.plist")"
  printf '%s\n' "${app}/Contents/MacOS/${name}"
}

# Resolve the CFBundleIdentifier of an .app bundle.
app_bundle_id() {
  /usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$1/Contents/Info.plist"
}

# Kill every process whose command line matches the pattern (the .app
# executable path is the reliable match; the bundle id is not in argv).
app_kill() {
  local pattern="$1"
  local pids
  pids="$(pgrep -f -- "${pattern}" || true)"
  if [ -n "${pids}" ]; then
    # shellcheck disable=SC2086
    kill ${pids} 2>/dev/null || true
    sleep 1
    pids="$(pgrep -f -- "${pattern}" || true)"
    if [ -n "${pids}" ]; then
      # shellcheck disable=SC2086
      kill -9 ${pids} 2>/dev/null || true
    fi
  fi
}

# Wait until no process matches the pattern, up to N seconds.
app_wait_gone() {
  local pattern="$1" limit="${2:-15}" i=0
  while pgrep -f -- "${pattern}" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "${i}" -ge "${limit}" ]; then
      return 1
    fi
    sleep 1
  done
}

# Sum the resident set size (KiB) of a process and all of its descendants.
tree_rss_kib() {
  local root="$1"
  python3 - "$root" <<'PY'
import os, subprocess, sys

root = int(sys.argv[1])
out = subprocess.run(["ps", "-axo", "pid=,ppid=,rss="], capture_output=True, text=True).stdout
children = {}
rss = {}
for line in out.splitlines():
    parts = line.split()
    if len(parts) != 3:
        continue
    pid, ppid, mem = (int(p) for p in parts)
    children.setdefault(ppid, []).append(pid)
    rss[pid] = mem

total = 0
stack = [root]
seen = set()
while stack:
    pid = stack.pop()
    if pid in seen:
        continue
    seen.add(pid)
    total += rss.get(pid, 0)
    stack.extend(children.get(pid, []))
print(total)
PY
}

# Random profile directory under the benchmark scratch root.
bench_profile_dir() {
  local root="${BENCH_SCRATCH:-${TMPDIR:-/tmp}/m0-bench}"
  mkdir -p "${root}"
  mktemp -d "${root}/profile.XXXXXX"
}

# macOS build metadata for the results header.
bench_machine_json() {
  python3 - <<'PY'
import json, platform, subprocess

def sysctl(name):
    try:
        return subprocess.run(["sysctl", "-n", name], capture_output=True, text=True).stdout.strip()
    except Exception:
        return ""

print(json.dumps({
    "model": sysctl("hw.model"),
    "cpu": sysctl("machdep.cpu.brand_string"),
    "cores": int(sysctl("hw.ncpu") or 0),
    "memory_bytes": int(sysctl("hw.memsize") or 0),
    "os": platform.mac_ver()[0],
    "arch": platform.machine(),
}))
PY
}

# Emit a JSON result file with a fixed envelope.
write_result() {
  local out="$1" kind="$2" payload="$3"
  mkdir -p "$(dirname "${out}")"
  BENCH_GIT_SHA="${BENCH_GIT_SHA:-$(git -C "${REPO_DIR}" rev-parse HEAD 2>/dev/null || echo unknown)}" \
  python3 - "$out" "$kind" "$payload" <<'PY'
import json, os, sys, time

out, kind, payload = sys.argv[1], sys.argv[2], sys.argv[3]
doc = {
    "kind": kind,
    "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "git_sha": os.environ.get("BENCH_GIT_SHA"),
    "machine": json.loads(os.environ["BENCH_MACHINE"]),
    "data": json.loads(payload),
}
with open(out, "w") as fh:
    json.dump(doc, fh, indent=2)
    fh.write("\n")
PY
}
