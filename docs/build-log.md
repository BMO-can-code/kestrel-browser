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

## Per-build entries (CI)

| Build | Strategy | Repo | engine | ~/.mozbuild | objdir | Free after | Artifact kept | Status |
|---|---|---|---|---|---|---|---|---|
| #41757583035 | S1 macOS arm64 | — | — | — | — | — | — | FAILED: configs/common/mozconfig ENOENT |
| #42001053660 | S1 macOS arm64 | — | — | — | — | — | — | FAILED: --disable-debuginfo invalid option |
| #42004309810 | S1 macOS arm64 | — | — | — | — | — | — | FAILED: --disable-elf-tidy invalid option |
| #42007407523 | S1 macOS arm64 | — | — | — | — | — | — | FAILED: DMG detached before ditto copy |
| #42055942774 | S1 macOS arm64 | — | — | — | — | — | — | FAILED: sccache 504 + sharp install timeout |
| #42056980166 | S1 macOS arm64 | — | — | — | — | — | — | FAILED: sharp native build timeout |
| #42057952917 | S1 macOS arm64 | — | — | — | — | — | — | FAILED: import patches (sharp missing) |
| #42062037848 | S1 macOS arm64 | — | — | — | — | — | — | CANCELLED (stuck in Build) |
| #42077709377 | S1 macOS arm64 | — | — | — | — | — | — | FAILED: DMG detached before ditto copy |
| #42125270234 | S1 macOS arm64 | — | — | — | — | — | zen-stock-dev-arm64 (131 MB) | **SUCCESS** |

CI fix summary:
1. Created `configs/common/mozconfig` + `configs/macos/mozconfig` (were absent, caused ENOENT)
2. Fixed `.gitignore`: bare `mozconfig` → `/mozconfig` + `!configs/**/mozconfig` negation
3. Removed invalid `--disable-debuginfo` and `--disable-elf-tidy` from mozconfig
4. Changed `MOZ_OBJDIR` from `$topsrcdir/engine/objdir` to `$topsrcdir/obj-kestrel` (matches CI `find obj-*/dist`)
5. Made sccache setup `continue-on-error: true` (transient 504)
6. Restored npm install scripts (surfer `import` needs sharp native binding)
7. Rewrote Package app bundle step: mount DMG → extract .app → verify → zip → detach DMG *after* copy

Artifact: `zen-stock-dev-arm64` (131 MB zip) from run #42125270234.
Download URL: https://api.github.com/repos/BMO-can-code/kestrel-browser/actions/artifacts/13467629867/zip
Local download blocked by slow network; CI verified app launches via `--version` check.

## M1 local measurements (no build)

| Step | Repo (`.`) | `engine/` | `~/.mozbuild` | `objdir/` | node_modules | Free disk | Source |
|---|---|---|---|---|---|---|---|
| After M1 file additions | ~0.3 MB | absent | absent | — | 92 MB | 31 GB | measured |

Notes:
- No local build performed under S1; all changes are UI/pref/CSS only.
- `engine/`, `~/.mozbuild`, objdir remain absent.
- Disk headroom ample (31 GB free vs 10 GB cap).

Rules applied:
- `SCCACHE_CACHE_SIZE=1G`, `SCCACHE_DIR=$PWD/.sccache` (deleted before packaging / when low on space).
- One objdir only: `MOZ_OBJDIR=$PWD/objdir`; `./mach clobber` before config changes.
- Build flags: `ZEN_RELEASE=1 ZEN_DISABLE_LTO=1 --disable-debug --disable-debug-symbols --disable-tests --disable-crashreporter --enable-optimize --enable-strip`.
- `npm cache clean --force` after `npm i`; `node_modules` never committed.
- Intermediates (`*.tar.*`, `*.mar`, `.dmg`, `.zip` over 100 MB) deleted after each build; only the final artifact kept.
