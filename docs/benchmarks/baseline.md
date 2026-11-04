<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# M0 baseline

Status: **build in progress**. This file is the method and the record; numbers
are added when the CI artifact is downloaded and measured on the benchmark
machine. Placeholders are explicit, not estimated.

## 1. What is being measured

| Metric | Method | Harness |
| --- | --- | --- |
| Cold start | spawn → first on-screen window, fresh profile | `scripts/bench/startup.sh` |
| Warm start | same, reused profile | `scripts/bench/startup.sh` |
| Memory at 1/20/50 tabs | summed RSS of the process tree after 60 s settle | `scripts/bench/memory.sh` |
| Command bar open | not measured in M0 | needs pref-gated instrumentation |
| Space switch | not measured in M0 | needs pref-gated instrumentation |
| Split creation | not measured in M0 | needs pref-gated instrumentation |

The three latency metrics are excluded on purpose. The command bar does not
exist yet, and measuring space switch or split creation from screenshots would
produce unreproducible numbers. They will be added with
`zen.benchmark.enabled=false` instrumentation in the milestones that build
those surfaces.

## 2. Build under test

| Property | Value |
| --- | --- |
| Source | `BMO-can-code/desktop`, branch `m0/baseline` |
| Commit | filled from the CI run |
| Base | upstream `dev` @ `147e6ebb2ebf8ce59980a95636bb077fedc641fe` |
| Firefox | 159.0 |
| Workflow | `.github/workflows/m0-baseline-macos.yml` |
| Runner | GitHub `macos-26`, arm64, 3 vCPU, 7 GB RAM, 14 GB SSD |
| Flags | release mode, PGO off, LTO off, `--disable-tests`, `--disable-debug-symbols` |
| Artifact | `zen-stock-dev-arm64` (unsigned `.app` zip) |

PGO off and LTO off mean these numbers are **not** comparable to shipped Zen
release builds. They are a baseline for our own future comparisons.

## 3. Validation results (independent of speed)

| Check | Result |
| --- | --- |
| Extracted Firefox 159 source tree | pass |
| All 272 patches apply (`surfer import`) | pass, 272/272 |
| Pref generation (`npm run ffprefs`) | pass |
| Service dumps update | pass |
| CI import step | pass |
| CI build | pending |
| CI packaging | pending |
| Artifact upload | pending |

Local import note: the branding step was skipped with
`SURFER_NO_BRANDING_PATCH=true` because the local Node is 26 and
`async-icns@1.0.2` calls `fs.rmdir({recursive:true})`, removed after Node 22.
CI uses Node 22 (`.nvmrc`) and applied branding normally. Details in
`docs/engine-patches.md` §6.

## 4. Machine

Fill from `scripts/bench/lib.sh` (`bench_machine_json`):

| Property | Value |
| --- | --- |
| Model | pending |
| CPU | pending |
| Cores | 8 (known) |
| RAM | 8 GB (known) |
| macOS | 27.2 (known) |
| Power | pending (must be AC for a valid series) |

## 5. Results

### 5.1 Startup (spawn → first window)

| Series | n | Median | p95 | Min | Max |
| --- | --- | --- | --- | --- | --- |
| Cold (fresh profile) | pending | pending | pending | pending | pending |
| Warm (reused profile) | pending | pending | pending | pending | pending |

### 5.2 Memory (summed RSS after 60 s)

| Tabs | RSS | Per-tab marginal |
| --- | --- | --- |
| 1 | pending | — |
| 20 | pending | pending |
| 50 | pending | pending |

## 6. Raw data

`scripts/bench/*.sh` write JSON to `docs/benchmarks/raw/`:

```
raw/startup-YYYYMMDDTHHMMSSZ.json
raw/memory-YYYYMMDDTHHMMSSZ.json
```

Each file carries the machine description, git SHA, timestamp and the full run
series. Commit the files for the record; do not hand-edit them.

## 7. Interpretation rules

- Compare medians, and always show p95 alongside.
- Do not compare PGO-off numbers to Zen release numbers; label such a
  comparison as "different build profile" if it must be shown.
- A >10% deviation on the same build and machine invalidates the run; rerun and
  note the discard.
- First launch after copying the `.app` includes Gatekeeper/AMFI overhead; do
  one throwaway launch before the measured series.
- Report battery state. A laptop on battery throttles and ruins a series.

## 8. What the baseline is for

The project brief sets targets relative to this baseline: startup within +10%
cold / +5% warm, memory within +5% at 50 tabs, and absolute p95 targets for the
three latency metrics. Those targets are only meaningful once the first three
numbers exist, which is why M0 stops here.
