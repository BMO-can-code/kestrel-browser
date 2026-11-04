<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Smoke matrix

Minimum L3 pass before a build is handed to anyone. IDs are stable; add cases,
do not renumber. Every case runs on a fresh profile unless stated.

Legend: **P** = pref must be on for this case; **F** = pref off (feature
disabled); **—** = not applicable.

## A. Launch and shell

| ID | Case | Pref | Steps | Pass |
| --- | --- | --- | --- | --- |
| A-01 | Cold launch | — | Launch with a fresh profile | Window appears, no modal, no console error |
| A-02 | Warm launch | — | Quit, relaunch same profile | Session restored, window geometry preserved |
| A-03 | Sidebar visible | — | Inspect default layout | Sidebar is primary chrome; no native sidebar appears |
| A-04 | Sidebar collapse/expand | `zen.view.sidebar-expanded` | Toggle | Layout reflows, content does not overlap, state persists |
| A-05 | Compact mode | `zen.view.compact.enable-at-startup` | Enable, move pointer out | Chrome hides; hover reveals; no flicker loop |
| A-06 | Single toolbar | `zen.view.use-single-toolbar` | Toggle | Urlbar and tabs share one surface without clipping |
| A-07 | Window controls left | `zen.view.experimental-force-window-controls-left` | Enable on macOS | Buttons move, no dead zone, traffic lights usable |

## B. Spaces

| ID | Case | Pref | Steps | Pass |
| --- | --- | --- | --- | --- |
| B-01 | Create space | — | New space, name it | Space appears, empty tab state, icon assigned |
| B-02 | Switch space | — | Click another space | Tabs swap, animation completes, no tab bleed |
| B-03 | Isolated space | `zen.workspaces.force-container-workspace` | Create space, log into a site in two spaces | Cookies isolated; same site can hold two accounts |
| B-04 | Space restore | — | Create tabs, quit, relaunch | Tabs return to the right space |
| B-05 | Space routing | — | Add a rule, open a matching URL | Tab lands in the target space |
| B-06 | Space delete | — | Delete a non-empty space | Confirmation shown; tabs handled as designed; no orphan data |
| B-07 | Essentials per space | `zen.workspaces.separate-essentials` | Enable, pin in two spaces | Each space shows its own essentials |
| B-08 | Swipe navigation | `zen.workspaces.swipe-actions` | Trackpad swipe | Switches space; does not fight page history |

## C. Tabs

| ID | Case | Pref | Steps | Pass |
| --- | --- | --- | --- | --- |
| C-01 | Open/close/reorder | — | Basic tab operations | Correct order, no lost tab |
| C-02 | Pinned tab | — | Pin, restart | Restores pinned, does not reload unnecessarily |
| C-03 | Essentials grid | `zen.tabs.essentials.max` | Add up to max | Grid wraps correctly; adding beyond max is refused |
| C-04 | Folder create/nest | — | Create folder, drag tabs in, nest | Nesting works; search inside folder works |
| C-05 | Tab rename | `zen.tabs.rename-tabs` | Rename, restart | Custom title persists |
| C-06 | Tab unload | — | Unload from context menu | Tab fades, memory drops, reload restores |
| C-07 | Split view | `zen.splitView.enable-tab-drop` | Drag tab onto tab | Two panes; resize works; close one leaves the other |
| C-08 | Split max | `zen.splitView.*` | Add panes to the limit | Fourth pane allowed, fifth refused with feedback |
| C-09 | Hover preview | `zen.tabs.hover-previews` | Hover a tab | Thumbnail appears; no preview when pref off |
| C-10 | Ctrl/Cmd+Tab | `zen.ctrlTab.show-pending-tabs` | Cycle | MRU order; no frozen preview |
| C-11 | Archive (if landed) | `zen.tabs.archive` | Archive a tab | Tab leaves the strip, appears in archive, restores |
| C-12 | Auto-archive (if landed) | `zen.tabs.archive.auto` | Set 1-day threshold, advance clock | Tab archived once, not repeatedly |

## D. Navigation and command surface

| ID | Case | Pref | Steps | Pass |
| --- | --- | --- | --- | --- |
| D-01 | Urlbar open | — | Cmd+L | Floating bar appears, focus correct, Escape restores |
| D-02 | Search | — | Type, press Enter | Results load; suggestions stay off when the pref is off |
| D-03 | Quick actions | `zen.urlbar.suggestions.quick-actions` | Type an action | Action rows appear and execute |
| D-04 | Command bar (if landed) | `zen.commandbar.enabled` | Cmd+K | Overlay opens over content; keyboard-only usable |
| D-05 | Glance | `zen.glance.enabled` | Modifier-click a link | In-place preview; close returns focus |
| D-06 | History/bookmarks | — | Open Library | History and bookmarks load; no archive section when off |

## E. Notes and capture (if landed)

| ID | Case | Pref | Steps | Pass |
| --- | --- | --- | --- | --- |
| E-01 | Create note | `zen.notes.tab` | Add note to a page | Note persists across restart |
| E-02 | Per-URL behaviour | `zen.notes.tab` | Note on two URLs, revisit both | Correct note per canonical URL |
| E-03 | Delete note | `zen.notes.tab` | Delete, restart | Gone, no orphan row |
| E-04 | Note in preview | `browser.tabs.notes.enabled` | Hover a tab with a note | Preview shows note text |
| E-05 | Easel (if landed) | `zen.easels.enabled` | Create board, add objects, restart | Content persists; no data loss on crash |

## F. Privacy and network

| ID | Case | Pref | Steps | Pass |
| --- | --- | --- | --- | --- |
| F-01 | Telemetry off | — | `about:telemetry` | Disabled, no upload path |
| F-02 | No Zen endpoints | — | Proxy capture, idle 10 min | Only documented hosts |
| F-03 | Share disabled | `zen.share.base-url=""` | Open share UI | Hidden or refuses, no request |
| F-04 | Mods disabled | `zen.mods.auto-update=false` | Start with mods installed | No CDN request |
| F-05 | Live folders off | — | Default profile | No GitHub/feed request until user adds one |
| F-06 | Sync off | — | Default profile | No sync traffic before sign-in |

## G. Layout extremes

| ID | Case | Pref | Steps | Pass |
| --- | --- | --- | --- | --- |
| G-01 | 1280×800 | — | Resize to minimum supported | No clipped controls; sidebar usable |
| G-02 | 3840×2160 | — | Resize large | Sidebar does not stretch absurdly; content centred |
| G-03 | 200% zoom | — | Zoom in | Chrome remains usable, no text overlap |
| G-04 | 50 tabs | — | Open 50 tabs | Scroll performance acceptable, memory within baseline +20% |
| G-05 | Reduced motion | macOS setting | Enable Reduce Motion | Animations shorten; no layout jump |
| G-06 | Dark/light/accent | — | Switch appearance | Contrast holds; no invisible text |

## H. Failure and recovery

| ID | Case | Pref | Steps | Pass |
| --- | --- | --- | --- | --- |
| H-01 | Crash | — | Kill the process | Relaunch offers restore; no corrupt session |
| H-02 | Corrupt session file | — | Truncate `sessionstore.jsonlz4` | App starts with a safe default, logs the failure |
| H-03 | Disk full | — | Fill the profile volume | Clear error, no silent data loss |
| H-04 | Downgrade | — | Run older build on newer profile | Refuses or migrates safely, never corrupts |

## Execution record

| Date | Build SHA | Artifact | macOS | Machine | Cases run | Failed |
| --- | --- | --- | --- | --- | --- | --- |
| *(none yet)* | | | | | | |
