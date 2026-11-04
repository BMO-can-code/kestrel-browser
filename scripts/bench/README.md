<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Benchmark harness

Scripts that produce the numbers in `docs/benchmarks/baseline.md`. They run
against a packaged `.app` (never `mach run`) on the benchmark machine.

```
scripts/bench/
  lib.sh          shared helpers (RSS tree, profile dirs, result envelope)
  window_wait.swift  waits for the first on-screen window; compiled on demand
  startup.sh      cold/warm launch series
  memory.sh       RSS at 1/20/50 tabs against a local test server
  fixture.html    deterministic page served to every test tab
```

## Usage

```sh
scripts/bench/startup.sh --app /path/to/Browser.app --runs 10
scripts/bench/memory.sh  --app /path/to/Browser.app --tabs 1,20,50
```

Results are written to `docs/benchmarks/raw/` as JSON with the machine
description, git SHA and timestamp. The consumer is a human; nothing is
uploaded.

## What is and is not measured in M0

| Metric | M0 | Why |
| --- | --- | --- |
| Cold/warm start | yes | External observation, no product changes |
| RSS at 1/20/50 tabs | yes | External observation |
| Command bar open | no | The surface does not exist yet; needs pref-gated instrumentation |
| Space switch | no | Needs pref-gated instrumentation (approval pending) |
| Split creation | no | Needs pref-gated instrumentation (approval pending) |

The three latency metrics will be added with `zen.benchmark.enabled=false`
instrumentation in the milestone that introduces or touches each surface.
Guessing them from screenshots would produce numbers nobody can reproduce, so
they are deliberately absent from the M0 baseline.

## Caveats

- `window_wait` observes the first on-screen window, not
  `sessionstore-windows-restored`. It is a consistent proxy across builds but
  it is not the same event Mozilla reports. This is stated in every result.
- macOS cannot drop the page cache without root. "Cold" here means "fresh
  profile, first launch of this binary since the last reboot"; each run records
  a `profile: fresh|reused` field so the two series are never mixed.
- The local HTTP fixture removes network variance from the memory test but also
  removes the variance of real sites. It is a floor, not a forecast.
