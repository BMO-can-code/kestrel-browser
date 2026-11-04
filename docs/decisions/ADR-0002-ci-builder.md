<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# ADR-0002: CI builder for baseline and M1

- Status: proposed
- Date: 2026-10-31
- Deciders: project owner

## Decision

Needs a choice. Recommendation: **use the Linux cross-compile path used by
upstream for release builds** as the primary builder, and keep a macOS-native
job only when we need to run or debug a local `.app`. If a macOS build host is
required, use **Blacksmith M4** rather than GitHub's standard macOS runner.

## Context

A native Firefox build needs roughly 20-30 GB of disk. Every GitHub-hosted
macOS runner, standard or larger, exposes only **14 GB** of SSD space. The M0
workflow frees Xcode duplicates and simulator runtimes and disables LTO, but
that buys a few GB, not the 20-30 needed. CPU and RAM are secondary; disk is
the binding constraint.

Upstream does not native-build macOS in CI for releases. Its
`macos-release-build.yml` runs on `blacksmith-8vcpu-ubuntu-2404` with
`ZEN_CROSS_COMPILING=1`, `SURFER_COMPAT=<arch>`, cctools, `libdmg` and
`hfsplus` from Mozilla's toolchain artifacts. That is the proven path.

Very large native macOS builds can work on a self-hosted Mac, but that is a
machine to buy/operate, not a CI configuration.

## Options

Costs are USD per minute, checked 2026-10-31. Verify before committing budget;
vendors change pricing.

| Builder | Hardware | Disk | Price | Notes |
| --- | --- | --- | --- | --- |
| GitHub standard macOS (`macos-26`) | 3 vCPU (M1), 7 GB | 14 GB | $0.062/min; **free on public repos** | M0 used this. Disk is the blocker. |
| GitHub large macOS (12-core Intel) | 12 vCPU | 14 GB | $0.077/min | More CPU, same disk. No help. |
| GitHub large macOS (5-core M2 Pro) | 5 vCPU | 14 GB | $0.102/min | Same disk. No help. |
| Blacksmith M4 | 8 vCPU class | 100+ GB | ~$0.08/min, 3,000 free min/month | Native arm64, enough disk, ~1 h build fits in free tier. |
| Namespace / Depot / WarpBuild | varies | 100+ GB | ~$0.06-$0.16/min | Cache-focused; evaluate only after Blacksmith. |
| Linux cross-compile (GitHub `ubuntu-latest`) | 4 vCPU, 16 GB | 14 GB usable, clean up first | **free on public repos** | What upstream ships. No native run without a Mac. |
| Self-hosted Mac | our hardware | — | capex + power; GitHub self-hosted platform fee $0.002/min from 2026-03-01 | Best for iteration, worst for setup cost. |

Cirrus was excluded: it discontinues service on 2026-06-01.

## Cost sketch

Assuming one full release build per merge to `main`, plus 2 PR builds per week:

- GitHub cross-compile: $0 on a public repository.
- Blacksmith M4: 3 builds/week × ~60 min ≈ 180 min/month, inside the 3,000
  free minutes. Over the free tier, ~$14/month.
- GitHub standard macOS: $0 public, but the build is expected to fail on disk,
  so the effective cost is time, not money.

## Consequences

- Cross-compiling means we cannot smoke-test the produced `.app` in CI. The M0
  benchmark harness runs on a Mac against the downloaded artifact, which is
  the same model M1 would use.
- PGO stays off unless we generate and cache a profile; this makes our numbers
  slower than shipped Zen and must be stated in every comparison.
- Native macOS jobs remain useful for packaging (`.dmg`, signing, notarisation)
  even when the compile happens on Linux.
- Whichever path is chosen, the workflow must be reproducible from a clean
  checkout with no secrets, except signing keys.

## Open questions

1. Is a paid runner acceptable, or must CI stay at $0 on public repos?
2. Do we need a native `.app` on every PR, or only on release tags?
3. Who owns signing and notarisation (ADR-0007)?
