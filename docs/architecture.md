<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Architecture

Status: M0 (audit only). No product code has been written. Everything below
describes the tree as inherited from upstream, plus the small number of
M0-only additions (`docs/`, `scripts/bench/`, one CI workflow).

## 1. What we forked

| Item | Value | Source |
| --- | --- | --- |
| Upstream | `zen-browser/desktop`, branch `dev` | `git remote -v` |
| Base commit at fork | `147e6ebb2ebf8ce59980a95636bb077fedc641fe` | `git log -1` |
| Firefox version | 159.0 | `surfer.json`, `engine/browser/config/version.txt` |
| Application id | `zen` | `surfer.json` (`appId`) |
| Binary name | `zen` | `surfer.json` (`binaryName`) |
| Licence | MPL-2.0 | `LICENSE`, `surfer.json` (`license`) |
| Build tool | `@zen-browser/surfer` | `package.json` |
| Patch count | 272 `.patch` files, 15,296 lines | `find src -name '*.patch'` |
| Zen front-end | 96 `.mjs`, 55 `.css`, 16 `.ftl` | `src/zen`, `locales/en-US` |

Zen is not a small set of themes on top of Firefox. It is a patched Gecko
(`src/browser/**/*.patch` and friends) plus a parallel chrome application in
`src/zen/`. Both layers matter for planning.

## 2. Build pipeline

The build is driven by `surfer`, which wraps Mozilla's `mach`:

```
surfer.json ──► surfer download ──► .surfer/engine/firefox-159.0.source.tar.xz
                                        │
                                        ▼
                                   engine/  (Mozilla source tree)
                                        │
             surfer import ◄────────────┤ applies src/**/*.patch onto engine/
                                        │
                                        ▼
             surfer build  ─────────────► engine/mozconfig (generated)
                                        │
                                        ▼
                                   ./mach build
                                        │
                                        ▼
                                   ./mach package
```

Key properties:

- `engine/` is **generated and untracked**. All upstream modifications live in
  `src/**/*.patch`, applied with `git apply --ignore-space-change`.
- `engine/mozconfig` is generated from `configs/common/mozconfig`,
  `configs/<platform>/mozconfig` and an optional local `mozconfig`, then
  suffixed with an internal block from
  `node_modules/@zen-browser/surfer/dist/constants/mozconfig.js`.
- `ZEN_RELEASE=1` turns on the release options in `configs/common/mozconfig`:
  `--enable-optimize`, `--enable-release`, `--disable-tests`,
  `--disable-debug-symbols`, `MOZILLA_OFFICIAL=1`, and LTO unless
  `ZEN_DISABLE_LTO` is set.
- `ZEN_GA_DISABLE_PGO=1` skips profile-guided optimisation. The generated
  profile lives outside the public tree, so a reproducible local baseline is
  non-PGO by definition.
- macOS release builds in upstream CI are **cross-compiled on Linux**
  (`.github/workflows/macos-release-build.yml`, `ZEN_CROSS_COMPILING=1`,
  `SURFER_COMPAT=<arch>`, cctools + libdmg from Mozilla toolchain artifacts).
  The native `macos-26` path exists in
  `.github/workflows/macos-universal-release-build.yml` but has never been the
  path used for shipped macOS builds.

M0 constraint: `npm run init`, `npm run build` and `npm start` were not run
locally. The only build is the CI job described in §8.

## 3. Runtime layers

```
┌──────────────────────────────────────────────────────────────┐
│ Gecko (engine/)  — patched by src/**/*.patch                 │
│   tabbrowser, sessionstore, urlbar, places, widgets, layout  │
└───────────────▲──────────────────────────────────────────────┘
                │ chrome:// / resource:// module loading
┌───────────────┴──────────────────────────────────────────────┐
│ Zen front-end (src/zen/)                                     │
│   feature modules (.mjs), XUL fragments (.inc.xhtml), CSS     │
│   loaded from browser.xhtml via zen-preloaded.inc.xhtml      │
└───────────────▲──────────────────────────────────────────────┘
                │ XUL / DOM / preferences
┌───────────────┴──────────────────────────────────────────────┐
│ Defaults (prefs/**, locales/**)                              │
└──────────────────────────────────────────────────────────────┘
```

Entry point: `src/browser/base/content/zen-preloaded.inc.xhtml` is included
very early by `browser-xhtml.patch`. It loads `zen-sets.js` and the polyfill,
then `zen-assets.inc.xhtml` loads `ZenPreloadedScripts.js`, which pulls in the
module set before the window finishes loading.

Feature modules generally extend one of two base classes:

- `nsZenDOMOperatedFeature` (`src/zen/common/modules/ZenCommonUtils.mjs`) for
  window-scoped UI features.
- `nsZenMultiWindowFeature` for features that own state across windows.

Most modules never touch Gecko internals; they use stable chrome APIs
(`gBrowser`, `CustomizableUI`, `SessionStore`, `PlacesUtils`,
`ContextualIdentityService`, `Services.prefs`). Engine patches are reserved for
things the chrome layer cannot express (tab strip geometry, urlbar internals,
session-store schema).

## 4. Feature modules (inherited)

| Area | Entry point | Notable prefs | Notes |
| --- | --- | --- | --- |
| Spaces | `src/zen/spaces/ZenSpaceManager.mjs` | `zen.workspaces.*` | Session-store backed, per-space `containerTabId`, unload/restore |
| Space routing | `src/zen/space-routing/ZenSpaceRoutingManager.sys.mjs` | none dedicated | Domain→space rules, `JSONFile` store |
| Containers | `ContextualIdentityService` (engine) | `privacy.userContext.enabled`, `zen.workspaces.force-container-workspace` | Isolation is opt-in per space |
| Split view | `src/zen/split-view/ZenViewSplitter.mjs` | `zen.splitView.*` | **Custom** implementation, `MAX_TABS = 4`, not `gBrowser.addTabSplitView` |
| Glance (peek) | `src/zen/glance/ZenGlanceManager.mjs` | `zen.glance.*` | Hover/context-menu preview, activation modifier |
| Boosts | `src/zen/boosts/ZenBoostsManager.sys.mjs` | `zen.boosts.*` | Per-domain CSS with sanitisation, share import/export |
| Folders | `src/zen/folders/ZenFolders.mjs` | `zen.folders.*` | Tab groups in the sidebar, not native tab groups |
| Pinned/Essentials | `src/zen/tabs/ZenPinnedTabManager.mjs`, `vertical-tabs.css` | `zen.tabs.essentials.max`, `zen.pinned-tab-manager.*` | Essentials is a CSS grid, pinned tabs a list |
| Compact mode | `src/zen/compact-mode/ZenCompactMode.mjs` | `zen.view.compact.*` | Sidebar/toolbar auto-hide |
| Command actions | `src/zen/urlbar/ZenUBActionsProvider.sys.mjs`, `ZenUBGlobalActions.sys.mjs` | `zen.urlbar.*` | Urlbar provider, not a dedicated palette window |
| Library | `src/zen/library/` | `zen.library.*` | History/downloads/media/space-routing views |
| Live folders | `src/zen/live-folders/` | — | GitHub and RSS providers via `fetch` |
| Sync | `src/zen/sync/ZenSpacesSync.sys.mjs` | `services.sync.engine.spaces`, `zen.spaces-sync.*` | Firefox Sync engine using `CryptoWrapper` (E2E) |
| Window sync | `src/zen/sessionstore/ZenWindowSync.sys.mjs` | `zen.window-sync.*` | Cross-window/session coordination |
| Mods | `src/zen/mods/ZenMods.mjs` | `zen.mods.*` | Remote CSS/JS themes from a CDN |
| Share | `src/zen/share/ZenShareClient.sys.mjs` | `zen.share.*` | Uploads to a Zen-hosted service |
| Welcome | `src/zen/welcome/` | `zen.welcome-screen.seen` | Ships a 15 MB `welcome-background.mp4` |
| Media controls | `src/zen/media/` | `zen.mediacontrols.enabled` | MPRIS/Now Playing |
| Compact/UI migration | `src/zen/migration/` | `zen.migration.*` | Imports from other browsers incl. Arc-like data |

## 5. Data and persistence

| Store | Mechanism | Owner |
| --- | --- | --- |
| Spaces, folders, pins | Session store sidebar data (`sessionstore` patches) | `ZenSpaceManager`, `ZenSessionManager` |
| Space routing rules | `zen-space-routing.jsonlz4` (`JSONFile`) | `ZenSpaceRoutingManager` |
| Boosts | `zen-boosts.jsonlz4` (`JSONFile`) | `ZenBoostsManager` |
| Tab notes | SQLite (`tabnotes` table) | Engine `TabNotes.sys.mjs` (pref off) |
| Mods | `zen-mods.json` + remote assets | `ZenMods` |
| Sync state | Firefox Sync `spaces` engine | `ZenSpacesSync` |

Anything we add must pick one of these mechanisms and state it in an ADR.
Adding a new database or a new remote service requires approval.

## 6. Native Firefox surfaces already present in 159

Verified against `engine/` (see `docs/feature-matrix.md` for the API-level
citations). Zen disables most of these and ships its own equivalents:

| Native feature | Pref default in engine | Pref set by Zen | Implication |
| --- | --- | --- | --- |
| Split view (`gBrowser.addTabSplitView`) | `browser.tabs.splitView.enabled=true` | `false`, locked | Two implementations exist; we must choose |
| Tab groups (`gBrowser.addTabGroup`) | `browser.tabs.groups.enabled=true` | `false` | Native groups replaced by Zen folders |
| Tab notes (`TabNotes.get/set/delete`) | `browser.tabs.notes.enabled=false` | `false` | Ready-made per-URL note store with hover-preview UI |
| Hover previews | `browser.tabs.hoverPreview.enabled=true` | `false` | Arc-style previews are mostly a pref away |
| Vertical tabs + sidebar revamp | `sidebar.revamp=true`, `sidebar.verticalTabs=false` | both `false`, locked | Zen sidebar is fully custom |
| Urlbar quick actions | `browser.urlbar.suggest.quickactions=true` | — | Complements Zen's own provider |

This is the single most important finding of M0: several "Arc features" are
already in Gecko and were switched off by Zen in favour of custom code. M1
must decide per feature whether to keep the Zen implementation, enable the
native one, or build a thin layer on the native one.

## 7. Extension points we intend to use

All verified in `engine/`:

| Need | API | Location |
| --- | --- | --- |
| Toolbar/sidebar widgets | `CustomizableUI.addWidgetToArea(id, area, pos)` | `browser/components/customizableui/CustomizableUI.sys.mjs:3429` |
| Urlbar results | `UrlbarProvider` subclass + `UrlbarProvidersManager.registerProvider` | `browser/components/urlbar/UrlbarUtils.sys.mjs`; Zen example `src/zen/urlbar/ZenUBActionsProvider.sys.mjs` |
| Split view | `gBrowser.addTabSplitView(tabs, {id, insertBefore, trigger})` | `browser/components/tabbrowser/Tabbrowser.sys.mjs:4160` |
| Tab groups | `gBrowser.addTabGroup(tabs, {id, color, label})` | `Tabbrowser.sys.mjs:4316` |
| Per-URL notes | `TabNotes.get/set/delete/has` | `browser/components/tabnotes/TabNotes.sys.mjs:204-343` |
| Containers | `ContextualIdentityService.create(name, icon, color)` | `toolkit/components/contextualidentity/ContextualIdentityService.sys.mjs` |
| Tab unload | `gBrowser.explicitUnloadTabs(tabs)` | `Tabbrowser.sys.mjs:7111` |
| Session state | `SessionStore.getTabState/setTabState/undoCloseById` | `browser/components/sessionstore/SessionStore.sys.mjs:3826/3853/5197` |
| Bookmarks | `PlacesUtils.bookmarks.insert/fetch/remove/update` | `toolkit/components/places/PlacesUtils.sys.mjs`, `Bookmarks.sys.mjs` |

APIs that do **not** exist in this tree and must not be assumed:

- Site-specific browsers / app windows (`SiteSpecificBrowser` is gone).
- A tab archive service.
- A per-space search engine selector.
- A dedicated command-palette window (only urlbar providers).

## 8. M0 build in CI

`.github/workflows/m0-baseline-macos.yml`:

- `macos-26` (arm64, 3 vCPU, 7 GB RAM, 14 GB free of a ~63 GB volume).
- Release flags, PGO off, LTO off (`disable_lto=true` default).
- Deletes duplicate Xcodes and simulator runtimes to recover disk.
- Installs GNU tar (surfer requires it on macOS).
- Uploads an unsigned `*.app` zip plus build logs.

Known risk: 14 GB of free disk is below Mozilla's recommended footprint for a
native build (roughly 20-30 GB with toolchain). The workflow frees what it can
and disables LTO to cut the object size. If the build dies on `ENOSPC`, the
fallback is the Linux cross-compile path that upstream uses for release. This
is recorded as a cost/feasibility question in
`docs/decisions/ADR-0002-ci-builder.md`.

## 9. Risks and unknowns

| Risk | Impact | Mitigation |
| --- | --- | --- |
| 272 engine patches, 15k lines | Every upstream sync is a merge project | Keep new engine diffs tiny and commented; prefer `src/zen` |
| Zen locks prefs (`sidebar.revamp`, `browser.tabs.splitView.enabled`) | Our toggles may be ignored | Audit `prefs/firefox/browser.yaml` before each change |
| Two split-view implementations | Conflicting behaviour | ADR-0004 must choose one before split work |
| Zen network endpoints | Privacy/branding liability | ADR-0006, `docs/network-calls.md` |
| 14 GB CI disk | M0 baseline may not build natively | Cross-compile fallback, see ADR-0002 |
| No PGO profile | Baseline slower than shipped Zen | Label comparisons; never compare to Zen release numbers |
| 8 GB local RAM | Cannot build locally | All builds in CI |

## 10. What M1 must not break

- Existing spaces, folders, pins, tabs and session restore.
- Firefox Sync semantics for existing users (we are not shipping yet, but the
  engine is live in the tree).
- MPL-2.0 headers on every file we touch.
- The ability to disable every new feature with a single pref set to `false`.
