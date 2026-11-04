<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0.
   -->

# Build log — disk measurements

All sizes are `du -sh` unless noted; free space is `df -h .` on
`/System/Volumes/data`. Machine cap: 10 GB total for source, tools, build
output, and artifacts. Abort threshold: stop immediately if free space drops
below 1.5 GB.

Strategy: S1 (remote build in CI; no local `npm run init` / `npm run build`).
Local work is UI-only against an installed official Zen build.

## Baseline — before any build step

| Step | Repo (`.`) | `engine/` | `~/.mozbuild` | `objdir/` | node_modules | Free disk | Source |
|---|---|---|---|---|---|---|---|
| After `git clone --depth 1` | 77 MB | — | — | — | — | 8.0 GB | `git clone` |
| After `npm i` + `npm cache clean --force` | 193 MB | absent | absent | — | 116 MB | 7.5 GB | measured |

Notes:
- `engine/` is generated and untracked; absent until `npm run init` (not run locally under S1).
- `~/.mozbuild` absent; not created under S1.
- No objdir exists locally under S1.
- Repo total (clone + node_modules): ~193 MB.

## Per-build entries (to be filled by CI / authorized local builds)

| Build | Strategy | Repo | engine | ~/.mozbuild | objdir | Free after | Artifact kept | Status |
|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | pending first CI run |

Rules applied:
- `SCCACHE_CACHE_SIZE=1G`, `SCCACHE_DIR=$PWD/.sccache` (deleted before packaging / when low on space).
- One objdir only: `MOZ_OBJDIR=$PWD/objdir`; `./mach clobber` before config changes.
- Build flags: `ZEN_RELEASE=1 ZEN_DISABLE_LTO=1 --disable-debug --disable-debug-symbols --disable-tests --disable-crashreporter --enable-optimize --enable-strip`.
- `npm cache clean --force` after `npm i`; `node_modules` never committed.
- Intermediates (`*.tar.*`, `*.mar`, `.dmg`, `.zip` over 100 MB) deleted after each build; only the final artifact kept.
