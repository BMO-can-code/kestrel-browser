<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Feature matrix

M0 snapshot. "In tree" means verified in the forked tree today, not planned.
Every proposed feature must be reachable by a pref that defaults to `false`
until it passes QA; the pref column is a proposal, not an implemented key.

Legend: **N** = native Firefox, available now; **Z** = Zen custom; **N/Z** =
both exist, Zen's is active; **—** = absent.

Pref namespace is provisional (`zen.*` retained for compatibility); see
`docs/decisions/ADR-0003-pref-namespace.md`.

## A. Layout and navigation

| # | Feature | Arc behaviour | In tree | Evidence | Gap to Arc | Proposed approach | Pref (proposed) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Sidebar-first shell | Vertical sidebar is the primary chrome | **Z** | `src/zen/tabs/zen-tabs/vertical-tabs.css`, `ZenCompactMode.mjs` | None material | Keep; restyle only | `zen.view.*` (existing) |
| A2 | Collapsible sidebar | Collapse to icon rail | **Z** | `src/zen/compact-mode/sidebar.inc.css` | Verify content relayout; only transform/opacity transitions found | Keep, measure | `zen.view.compact.*` |
| A3 | Spaces | Named contexts with own tabs | **Z** | `src/zen/spaces/ZenSpaceManager.mjs` | Isolation is opt-in | Default new spaces to a container behind a pref | `zen.workspaces.force-container-workspace` |
| A4 | Space switch animation | Animated transition | **Z** | `zen.workspaces.switch-animation-duration` (250 ms) | None | Keep | existing |
| A5 | Per-space theme | Gradient/colour per space | **Z** | `src/zen/spaces/ZenGradientGenerator.mjs` | None | Keep | `zen.theme.*` |
| A6 | Space routing (Air Traffic Control) | Send domains to a space | **Z** | `src/zen/space-routing/ZenSpaceRoutingManager.sys.mjs` | Missing UI polish and export | Keep | none |
| A7 | Per-space search engine | Search uses the space's engine | **—** | No search-engine reference in `src/zen/spaces/` | Full feature | Add mapping space→engine id, apply on tab create | `zen.spaces.per-engine-search` |
| A8 | Space export/import | Move a space between devices | **—** | `src/zen/spaces/` has no JSON export | Partial: Sync exists, file export does not | JSON manifest with tabs+pins+container, no remote | `zen.spaces.export` |
| A9 | Multi-window per space | Open space in its own window | **Z** | `src/zen/sessionstore/ZenWindowSync.sys.mjs` | Unclear parity | Audit, then decide | `zen.window-sync.*` |

## B. Tabs

| # | Feature | Arc behaviour | In tree | Evidence | Gap to Arc | Proposed approach | Pref |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | Pinned tabs | Compact pinned row | **Z** | `src/zen/tabs/ZenPinnedTabManager.mjs` | None | Keep | `zen.tabs.*` |
| B2 | Essentials grid | Icon grid above tabs | **Z** | `vertical-tabs.css:1183` (CSS grid) | None | Keep | `zen.tabs.essentials.max` |
| B3 | Folders | Nested groups in sidebar | **Z** | `src/zen/folders/ZenFolders.mjs` | Native tab groups are disabled | Keep Zen folders; do not enable native groups | `zen.folders.*` |
| B4 | Hover tab previews | Hover shows page preview | **N/Z** | Engine `tab-hover-preview.mjs`; `browser.tabs.hoverPreview.enabled=false` in `prefs/firefox/browser.yaml` | Zen turned it off; sidebar needs its own trigger | Reuse engine module; add sidebar hover surface | `zen.tabs.hover-previews` |
| B5 | Split view | Two or more panes | **Z** | `src/zen/split-view/ZenViewSplitter.mjs`, `MAX_TABS = 4` | Native `addTabSplitView` also exists but is locked off | ADR-0004: keep Zen's tree model, or migrate to native | `zen.splitView.*` |
| B6 | Tab archive (manual) | Archive without closing | **—** | No archive service anywhere in tree | Full feature | Unload + hide tab, persist in sidebar store, searchable | `zen.tabs.archive` |
| B7 | Tab auto-archive | Archive after N days | **—** | None | Full feature | Timer + same store; default off | `zen.tabs.archive.auto` |
| B8 | Archive browser | Dedicated view of archived tabs | **—** | Library has no archive section (`ZenLibraryUtils.sys.mjs`) | Full feature | Add Library section | `zen.library.archive` |
| B9 | Tab renaming | Custom tab titles | **Z** | `zen.tabs.rename-tabs` | None | Keep | existing |
| B10 | Tab search | Find open tab by title | **Z** | Sidebar provider tests (`src/zen/tests/urlbar/browser_sidebar_provider.js`), `ZenUBProvider` | No global shortcut | Wire to command surface | `zen.urlbar.suggestions.quick-actions` |
| B11 | Undo close / closed history | Reopen closed tab | **N** | `SessionStore.undoCloseById` | None | Keep | engine default |

## C. Windows and previews

| # | Feature | Arc behaviour | In tree | Evidence | Gap | Approach | Pref |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | Peek / Glance | In-page preview of a link | **Z** | `src/zen/glance/ZenGlanceManager.mjs` | None | Keep | `zen.glance.*` |
| C2 | Little Arc | Small window for one external link | **—** | No SSB/browser-window helper in tree; `SiteSpecificBrowser` absent from engine | Full feature | New small window with its own toolbar; no separate engine feature | `zen.windows.little` |
| C3 | Open external links in Little Arc | Routing from other apps | **—** | Depends on C2 | Full | App-level URL handler decision | same |
| C4 | PWA / SSB app windows | Install site as app | **—** | `SiteSpecificBrowser` removed from engine | Full feature | Build on `--app`-style window + `browser.ssb`-like manifest; requires new engine surface | `zen.apps.enabled` |
| C5 | Split glance | Peek beside current tab | **Z** | `src/zen/glance/` split glance | None | Keep | `zen.glance.*` |

## D. Command surface

| # | Feature | Arc behaviour | In tree | Evidence | Gap | Approach | Pref |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | Quick actions | Type an action in the bar | **Z** | `src/zen/urlbar/ZenUBActionsProvider.sys.mjs` | Only inside urlbar | Keep provider, add overlay consumer | `zen.urlbar.suggestions.quick-actions` |
| D2 | Dedicated command bar (Cmd+K) | Floating palette over content | **—** | `src/browser/base/content/zen-keysets.inc.xhtml` has no Cmd+K binding; only `browser/zen-command-palette.ftl` strings exist | Full feature | Reuse provider + new XUL panel; no engine patch expected | `zen.commandbar.enabled` |
| D3 | Quick actions catalogue | Broad set of actions | **Z** | 30+ strings in `zen-command-palette.ftl` | Missing archive/space-export actions | Extend list as features land | same |
| D4 | Tab switcher (Ctrl+Tab) | MRU switcher | **N/Z** | `src/browser/components/tabbrowser/content/browser-ctrlTab-js.patch`, `zen.ctrlTab.*` | None | Keep | existing |

## E. Notes and capture

| # | Feature | Arc behaviour | In tree | Evidence | Gap | Approach | Pref |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E1 | Tab notes | Note attached to a page | **N** | `engine/browser/components/tabnotes/TabNotes.sys.mjs`; `browser.tabs.notes.enabled=false` | No sidebar/editor UI in Zen | Enable engine store, add sidebar editor | `zen.notes.tab` |
| E2 | Easels / canvases | Freeform board per space | **—** | Nothing in tree (`src/zen/images/note-indicator.svg` is a media animation asset) | Full feature | New document surface; largest net-new item | `zen.easels.enabled` |
| E3 | Note capture from selection | Clip text/image into notes | **—** | Depends on E1/E2 | Full | Context-menu action | `zen.notes.capture` |

## F. Personalisation and privacy

| # | Feature | Arc behaviour | In tree | Evidence | Gap | Approach | Pref |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | Boosts (site CSS) | Per-site restyle | **Z** | `src/zen/boosts/ZenBoostsManager.sys.mjs` | Sanitisation and share flow must be reviewed | Keep, audit before ship | `zen.boosts.enabled` |
| F2 | Boost sharing | Publish/import a boost | **Z** | `share.zen-browser.app` upload (`ZenShareClient.sys.mjs`) | Third-party endpoint | Replace or disable; see ADR-0006 | `zen.share.*` |
| F3 | Themes / mods | Community themes | **Z** | `src/zen/mods/ZenMods.mjs` (CDN `zen-browser.github.io`) | Remote code, Zen branding | Keep with new registry or remove | `zen.mods.*` |
| F4 | Containers | Isolate cookies per space | **N/Z** | `ContextualIdentityService`, `containerTabId` | Default off | Default on for new spaces behind pref | `zen.spaces.isolated` |
| F5 | E2E sync of spaces | Sync structure, encrypted | **Z** | `src/zen/sync/ZenSpacesSync.sys.mjs` (`CryptoWrapper`) | Backend is Mozilla's | Decide backend; see ADR-0008 | `zen.spaces-sync.*` |
| F6 | Telemetry | Product analytics | **off** | `prefs/privatefox/privacy.yaml`, no Glean calls in `src/zen` | None (we keep it off) | Keep disabled and locked | existing |

## G. Content and tools

| # | Feature | Arc behaviour | In tree | Evidence | Gap | Approach | Pref |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Media controls | Now playing pill | **Z** | `src/zen/media/` | None | Keep | `zen.mediacontrols.enabled` |
| G2 | Downloads UI | Sidebar downloads | **Z** | `src/zen/downloads/` | None | Keep | `zen.downloads.*` |
| G3 | Library | History/downloads/media | **Z** | `src/zen/library/` | No archive section | Extend | `zen.library.*` |
| G4 | Live folders (GitHub/RSS) | Fresh content in sidebar | **Z** | `src/zen/live-folders/` | Network calls to github.com / feed URLs | Keep, pref off by default | `zen.live-folders.*` |
| G5 | Reader mode | Clean article view | **N** | Engine | None | Keep | engine default |
| G6 | Screenshots | Region capture | **N** | Engine `browser/components/screenshots` | No annotation canvas | Keep; Easel is separate | engine default |

## H. Explicitly out of scope for M1

- AI chat / "browse for me" surfaces (`browser/components/aiwindow`,
  `genai`). Present in the engine; disabled by Zen.
- Arc Max-style server-side features. We will not add a server dependency.
- Mobile, Windows/Linux parity work. Build verification stays macOS arm64.

## I. Summary of genuine gaps

Ranked by effort, not by desirability:

1. **Tab archive + auto-archive + archive browser** (B6-B8) — new store, new
   views, migration and QA. No native primitive.
2. **Easels** (E2) — new document surface, storage, sharing, a11y. Largest.
3. **PWA/SSB windows** (C4) — engine-level work; `SiteSpecificBrowser` is gone
   in this tree, so this is not a small chrome patch.
4. **Little Arc** (C2/C3) — moderate; mostly window plumbing and URL routing.
5. **Command bar** (D2) — moderate; the action catalogue and urlbar provider
   already exist, the overlay does not.
6. **Per-space search engine** (A7) — small.
7. **Space export/import** (A8) — small to moderate (schema, validation).
8. **Tab notes UI** (E1) — small, since the store and hover preview exist.

Items that look like gaps but are not: hover previews (native, disabled),
split view (two implementations exist), tab groups (native, disabled), notes
store (native, disabled). See `docs/decisions/ADR-0004-native-vs-custom.md`.
