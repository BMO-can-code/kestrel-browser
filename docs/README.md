<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Project documentation

M0 output: an audit of the fork, a gap analysis against Arc, a build/baseline
path, and the decisions that must be made before M1 writes product code.

## Read in this order

| # | Document | What it answers |
| --- | --- | --- |
| 1 | [architecture.md](architecture.md) | What the fork is made of, how it builds, what APIs exist |
| 2 | [feature-matrix.md](feature-matrix.md) | Which Arc features exist, which are missing, what each gap costs |
| 3 | [file-map.md](file-map.md) | Where the code is, and where M1 will touch it |
| 4 | [prefs-inventory.md](prefs-inventory.md) | The 324 default prefs, which are locked, and why |
| 5 | [engine-patches.md](engine-patches.md) | The 272 patches, the rules for adding more, and the register |
| 6 | [network-calls.md](network-calls.md) | Every outbound endpoint and its current default |
| 7 | [branding-inventory.md](branding-inventory.md) | Everything that must be renamed before ship |
| 8 | [decisions/](decisions/README.md) | The eight open decisions with options and costs |
| 9 | [qa/](qa/README.md) | How a build is proven good: smoke, prefs, network, a11y, data |
| 10 | [benchmarks/](benchmarks/README.md) | Measurement method and the M0 baseline |

## Status legend

- **Verified** means checked against the extracted Firefox 159 tree in
  `engine/` or against the fork at the M0 commit. File and line references are
  given where possible.
- **Proposed** means a recommendation in an ADR; the user has not approved it.
- **Pending** means the work is blocked on a build, a download, or a decision.

## M0 deliverables

| Deliverable | Location | Status |
| --- | --- | --- |
| Architecture overview | `architecture.md` | done |
| Feature matrix | `feature-matrix.md` | done |
| File map | `file-map.md` | done |
| Pref inventory | `prefs-inventory.md` | done |
| Engine patch register | `engine-patches.md` | done |
| Network call inventory | `network-calls.md` | done |
| Branding inventory | `branding-inventory.md` | done |
| ADRs | `decisions/ADR-0001..0008` | done (accepted per decisions) |
| QA process and matrix | `qa/` | done |
| Benchmark harness | `scripts/bench/` | done |
| Baseline numbers | `benchmarks/baseline.md` | pending CI artifact (Twilight v0 partial) |
| CI build | `.github/workflows/m0-baseline-macos.yml` | workflow fixed; Actions disabled for repo (org policy) |
| Removed-hostname grep gate | `scripts/check-removed-hostnames.sh` | passing |

## What M0 deliberately did not do

- No product code, no pref changes, no engine patches.
- No `npm run init`, `npm run build`, `npm start`.
- No dependency or build-system changes.
- No Xcode install.
- No rebrand: the tree is still Zen-branded, and no build is distributed.

## Conventions

- One ADR per decision, numbered, never deleted.
- Every new feature has a pref that defaults to `false`; see
  `qa/pref-gating.md`.
- Every new endpoint updates `network-calls.md` and, if material, ADR-0006.
- Every new engine patch updates the register in `engine-patches.md`.
- Every user-visible string goes in an `.ftl` file.
- MPL-2.0 headers stay on every file, including new ones.
