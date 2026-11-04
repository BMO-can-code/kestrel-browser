<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Benchmarks

Methodology, raw data and results for the performance requirements in the
project brief. Nothing in this directory is shipped to users.

## Definitions

| Metric | Definition | Target |
| --- | --- | --- |
| Cold start | Process spawn to `sessionstore-windows-restored` with a fresh profile, after a reboot or full page-cache drop | baseline + 10% |
| Warm start | Same, second launch with the same profile, page cache warm | baseline + 5% |
| Memory, N tabs | Sum of resident set size for the browser process tree, 60 s after the Nth tab finishes loading | baseline + 5% at 50 tabs |
| Command bar open | Key event to first painted result list, p50/p95 over 200 iterations | p95 <= 50 ms |
| Space switch | Key event to first paint of the target space, p50/p95 over 100 iterations | p95 <= 100 ms |
| Split creation | Action invocation to both panes painted | p95 <= 150 ms |

## Rules

1. Every number is recorded with: commit SHA, build flavour (release/dev, PGO
   on/off), machine model, macOS version, core count, RAM, and whether the
   machine was on battery or AC.
2. Report the median and the p95, never a single run.
3. A run with a >10% deviation from the previous run on the same build is
   discarded and re-run; note the discard.
4. Startup and memory are measured on a packaged app bundle, not `mach run`.
5. Benchmarks never ship. Any instrumentation is pref-gated and defaults off.

## Directory layout

```
docs/benchmarks/
  README.md          # this file
  baseline.md        # M0 baseline numbers and raw samples
  raw/               # per-run JSON, committed only when small
scripts/bench/
  README.md
  lib.sh             # RSS tree, profile dirs, result envelope
  window_wait.swift  # first on-screen window timer, compiled on demand
  startup.sh         # cold/warm launch series
  memory.sh          # RSS sampling at 1/20/50 tabs
  fixture.html       # deterministic page for the memory test
```

The three latency metrics will need a harness that does not exist yet. It is
intentionally absent: it depends on pref-gated instrumentation
(`zen.benchmark.enabled=false`) that has not been approved.

## Known limitations

- macOS has no unprivileged page-cache drop. "Cold" means "after reboot" or
  "first launch after the app bundle was copied"; this is documented per run.
- GitHub-hosted macOS runners are 3-core VMs. They are fine for build
  verification and coarse latency, but absolute startup numbers are only
  comparable between runs on the same runner type.
- Without Zen's private PGO profile, a locally built baseline is slower than
  the shipped binary. Comparisons against shipped Zen use the public release
  build and are labelled separately.
