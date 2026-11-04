<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# QA

How this project decides that a build is good. M0 defines the process and the
matrix; nothing below has been executed against a finished build yet, because
M0 produced no product change.

## Levels

| Level | What it proves | Where | Cost |
| --- | --- | --- | --- |
| L0 static | The tree is consistent: prefs parse, patches apply, licences intact | CI, no build | seconds |
| L1 import | 272 patches apply on the pinned Firefox | CI and local | minutes |
| L2 build | The app compiles and packages | CI | ~1 hour |
| L3 smoke | The app launches and core surfaces work | A Mac, manual | ~30 min |
| L4 regression | Inherited browser tests still pass | CI with a built engine | hours |
| L5 network | Only documented endpoints are contacted | A Mac, proxy | ~30 min |
| L6 performance | Numbers match or beat the baseline | A Mac, harness | ~30 min |

## What runs when

| Trigger | L0 | L1 | L2 | L3 | L4 | L5 | L6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pull request | yes | yes | no | no | no | no | no |
| Merge to `main` | yes | yes | yes | no | yes | no | no |
| Release candidate | yes | yes | yes | yes | yes | yes | yes |
| Any change to `prefs/`, `src/**/*.patch`, `configs/` | yes | yes | yes | yes | yes | no | no |
| Any change to a network call or endpoint | yes | yes | yes | yes | no | yes | no |

M0 ran L1 (local, branding skipped) and L2 (CI). L0 was implicit in the docs
review.

## Exit criteria for M1

A feature is done when all of the following are true:

1. It is gated by a pref that defaults to `false`, and `false` means the old
   behaviour, byte-for-byte.
2. Turning it on does not require editing code or restarting more than once.
3. The smoke cases in `smoke-matrix.md` pass.
4. No new endpoint exists unless `network-calls.md` and ADR-0006 were amended.
5. Keyboard-only and VoiceOver passes for the new surface.
6. A test in `src/zen/tests/` covers the core behaviour, or the PR explains why
   it cannot.
7. The pref is listed in `docs/prefs-inventory.md` if it is user-visible.

## Manual test environment

- A packaged `.app` from CI (`zen-stock-dev-arm64` artifact), never
  `mach run`, unless the case explicitly tests developer mode.
- A fresh profile per suite, with prefs injected through `user.js` (see
  `pref-gating.md`).
- The local fixture server in `scripts/bench/fixture.html` for deterministic
  pages.
- Screen recording for any animation claim; a screenshot cannot show a
  transition.

## Reporting

Every manual run records: build SHA, artifact name, macOS version, machine
model, profile (fresh/reused), pref set used, and pass/fail per case. Failures
include the verbatim console error. No "works for me".

## Files

| File | Covers |
| --- | --- |
| `smoke-matrix.md` | L3 cases per surface |
| `pref-gating.md` | How to prove the off switch works |
| `network.md` | L5 proxy capture procedure |
| `accessibility.md` | Keyboard, VoiceOver, contrast, reduced motion |
| `data-migration.md` | Upgrade/restore/downgrade safety |
