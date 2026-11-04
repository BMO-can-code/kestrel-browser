<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# File map

Where things live in the fork, and which files M1 is likely to touch. Line
counts are JavaScript-family lines (`.mjs`, `.js`, `.sys.mjs`), measured at
the M0 commit.

## 1. Repository root

| Path | Purpose |
| --- | --- |
| `surfer.json` | App identity, branding, Firefox pin, update hostname, licence config |
| `package.json` | Scripts: `download`, `import`, `build`, `package`, `lint`, `test` |
| `configs/common/mozconfig` | Shared build options, release flags, telemetry off |
| `configs/macos/mozconfig` | macOS target, SDK selection, cross-compile paths |
| `configs/branding/{release,twilight}` | Icons and installer art |
| `prefs/` | Default prefs, merged into the engine at build time |
| `locales/` | Translations; `en-US` is the source of truth |
| `src/` | Everything applied on top of Gecko, including `src/zen` |
| `scripts/` | Build/test helpers; new benchmark harness in `scripts/bench` |
| `docs/` | This documentation |
| `.github/workflows/` | CI; M0 adds `m0-baseline-macos.yml` |
| `engine/` | Generated; never committed |

## 2. Zen front-end (`src/zen`)

| Directory | Files | JS LOC | What it owns | Key files |
| --- | --- | --- | --- | --- |
| `common/` | 43 | 15,915 | Base classes, UI manager, shared modules, core CSS | `modules/ZenCommonUtils.mjs`, `modules/ZenUIManager.mjs`, `modules/ZenUpdates.mjs` |
| `spaces/` | 12 | 8,207 | Spaces, themes per space, swipe, creation | `ZenSpaceManager.mjs`, `ZenSpaceCreation.mjs` |
| `library/` | 13 | 7,642 | Library window and sections | `ZenLibrary.mjs`, `sections/*` |
| `boosts/` | 23 | 6,463 | Per-site CSS, editor, sharing | `ZenBoostsManager.sys.mjs`, `ZenBoostStyles.sys.mjs` |
| `sessionstore/` | 2 | 2,864 | Sidebar state, window sync | `ZenWindowSync.sys.mjs`, `ZenSessionManager.sys.mjs` |
| `folders/` | 4 | 2,765 | Sidebar folders | `ZenFolders.mjs`, `ZenFolder.mjs` |
| `urlbar/` | 7 | 2,757 | Quick actions provider and controller | `ZenUBActionsProvider.sys.mjs`, `ZenUBGlobalActions.sys.mjs` |
| `split-view/` | 4 | 2,659 | Custom split-view tree | `ZenViewSplitter.mjs` |
| `glance/` | 6 | 2,396 | Peek/preview overlay | `ZenGlanceManager.mjs` |
| `drag-and-drop/` | 1 | 2,213 | Tab and sidebar drag logic | `ZenDragAndDrop.js` |
| `live-folders/` | 5 | 2,069 | GitHub/RSS feeds in sidebar | `ZenLiveFoldersManager.sys.mjs`, `providers/*` |
| `sync/` | 3 | 2,028 | Spaces Sync engine | `ZenSpacesSync.sys.mjs`, `ZenSpacesSyncModel.sys.mjs` |
| `tabs/` | 8 | 1,435 | Pinned tabs, essentials, tab UI | `ZenPinnedTabManager.mjs`, `zen-tabs/vertical-tabs.css` |
| `share/` | 5 | 1,213 | Upload/download of shared boosts | `ZenShareClient.sys.mjs` |
| `compact-mode/` | 6 | 1,075 | Auto-hide chrome | `ZenCompactMode.mjs` |
| `welcome/` | 2 | 1,041 | First-run screen (ships 15 MB video) | `ZenWelcome.mjs` |
| `mods/` | 3 | 997 | Remote themes | `ZenMods.mjs` |
| `migration/` | 2 | 911 | Import from other browsers | `ZenMigrationUtils.sys.mjs` |
| `space-routing/` | 2 | 885 | Domain→space rules | `ZenSpaceRoutingManager.sys.mjs` |
| `media/` | 3 | 830 | Media controls | `ZenMediaController.mjs` |
| `downloads/` | 3 | 554 | Download UI | — |
| `about/` | 3 | 428 | `about:zen` dialog | `zen-about.js`, `zen-about.inc.xhtml` |
| `kbs/` | 1 | 363 | Keyboard shortcut migration | `ZenKeyboardShortcuts.sys.mjs` |
| `window-drag/` | 2 | 343 | Drag window from content | — |
| `tests/` | 739 | 115,989 | 547 browser tests across 29 suites | `tests/*/browser.toml` |

Notes:

- `common/` is the gravitational centre. Any refactor there touches every
  feature, so M1 changes should avoid it unless the win is clear.
- `@types/` and `vendor/` are type definitions/vendored code; `images/`,
  `fonts/`, `toolkit/` are assets or empty placeholders.
- `tests/` is larger than the product code and is the best regression net we
  inherit. It runs through `npm test` → `scripts/run_tests.py` → `mach test`.

## 3. Engine patches (`src/browser`, `src/toolkit`, …)

272 patch files, 15,296 lines. Concentrations:

| Area | Patches | Why it is patched |
| --- | --- | --- |
| `src/browser/base/content` | 19 | Window XUL, keysets, commands, context menus |
| `src/widget`, `src/layout/*` | ~37 | macOS window materials, rounded corners, rendering fixes |
| `src/browser/components/sessionstore` | 7 | Sidebar data, groups, split view persistence |
| `src/browser/components/tabbrowser` | 12 | Tab strip, vertical tabs, drag/drop, pinned tabs |
| `src/browser/components/urlbar` | 12 | Quick actions, styling, behaviour |
| `src/browser/components/preferences` | 6 | Zen settings panes |
| `src/toolkit/*` | ~14 | Widgets, popups, modules |
| Everything else | ~165 | Small, scattered fixes |

Rules for new engine patches (from the project brief):

1. Front-end hook first if the API allows it.
2. Patch must be commented with why, and listed in `docs/engine-patches.md`.
3. Keep it minimal; no drive-by reformatting.
4. Record it in the milestone notes so upstream syncs can resolve it.

## 4. Prefs

| Path | Files | Prefs | Notes |
| --- | --- | --- | --- |
| `prefs/zen/` | 27 | 189 | Zen's own surface; `view`, `sync`, `workspaces` are the biggest |
| `prefs/firefox/` | 9 | 77 | Upstream overrides; several `locked: true` |
| `prefs/privatefox/` | 2 | 47 | Telemetry off, tracking protection |
| `prefs/fastfox/` | 1 | 11 | Performance tweaks |

See `docs/prefs-inventory.md`.

## 5. Localisation

`locales/en-US/browser/browser/` holds 16 `.ftl` files, one per Zen surface
(`zen-workspaces.ftl`, `zen-split-view.ftl`, `zen-command-palette.ftl`, …).
Every new user-visible string must land in an `.ftl` file, never inline in
JS/XUL.

## 6. Tests

| Suite | Tests | Coverage focus |
| --- | --- | --- |
| `mochitests` | 351 | Session store, tabs, sidebar integration |
| `spaces` | 21 | Space CRUD, restore, bookmarks |
| `boosts` | 21 | CSS sanitisation, storage |
| `performance` | 23 | Startup, tab open/close, urlbar |
| `folders` | 15 | Nested groups, drag/drop |
| `pinned` | 12 | Essential/pin lifecycle |
| `library` | 11 | Sections, routing |
| `space_routing` | 9 | Rule matching, containers |
| `glance` | 8 | Overlay behaviour |
| others | 76 | tabs, split view, sync, share, ui, media, … |

Run with `npm test` (needs a built engine). M0 used static inspection only.

## 7. M0 additions

| Path | Purpose |
| --- | --- |
| `.github/workflows/m0-baseline-macos.yml` | Baseline build on a free macOS runner |
| `docs/architecture.md` | This system overview |
| `docs/feature-matrix.md` | Arc/Zen gap analysis |
| `docs/file-map.md` | This file |
| `docs/prefs-inventory.md` | Pref surface |
| `docs/network-calls.md` | Outbound endpoints |
| `docs/branding-inventory.md` | Rebrand checklist |
| `docs/qa/` | QA process and smoke matrix |
| `docs/decisions/ADR-*.md` | Decisions and open questions |
| `docs/benchmarks/` | Methodology, baseline, raw results |
| `scripts/bench/` | External benchmark harness |
