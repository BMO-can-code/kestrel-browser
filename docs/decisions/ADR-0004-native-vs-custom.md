<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# ADR-0004: Native Firefox surface vs Zen implementation

- Status: proposed
- Date: 2026-10-31
- Deciders: project owner

## Decision

Needs a choice per surface. Recommendation: **keep Zen's shell (sidebar, spaces,
folders, split view) and adopt native primitives where they are stores or
platform integration rather than interaction design** (tab notes, containers,
session state, hover previews). Do not run two implementations of the same
surface at once.

## Context

Firefox 159 already contains several features Arc is known for. Zen switched
most of them off and shipped its own version. Both facts are verified in
`engine/`:

| Surface | Native in 159 | Zen today | Both active? |
| --- | --- | --- | --- |
| Split view | `gBrowser.addTabSplitView(tabs, {id, insertBefore, trigger})`, `Tabbrowser.sys.mjs:4160`; pref `browser.tabs.splitView.enabled=true` | `ZenViewSplitter.mjs`, `MAX_TABS = 4` | No: Zen sets the native pref `false` and **locks** it |
| Tab groups | `gBrowser.addTabGroup(tabs, {id, color, label})`, `Tabbrowser.sys.mjs:4316`; pref `browser.tabs.groups.enabled=true` | `ZenFolders.mjs` | No: native pref `false` |
| Tab notes | `TabNotes.get/set/delete/has`, `TabNotes.sys.mjs:204-343`; SQLite by canonical URL | none | No: native pref `false` |
| Hover previews | `tab-hover-preview.mjs`; `browser.tabs.hoverPreview.enabled=true` | none (Glance is a content peek, not a tab preview) | No: pref `false` |
| Vertical tabs / sidebar | `sidebar.revamp=true`, `sidebar.verticalTabs=false`, `SidebarManager.sys.mjs` | full custom sidebar (`vertical-tabs.css`, `ZenCompactMode.mjs`) | No: both native prefs `false` and **locked** |
| Quick actions | urlbar quick actions, provider API | `ZenUBActionsProvider.sys.mjs` + 30+ actions | Complementary, both use the urlbar |
| Containers | `ContextualIdentityService.create/getUserContextIdFromUserContextId` | spaces optionally map to `containerTabId` | Yes, intentionally |
| Session state | `SessionStore.getTabState/setTabState/undoCloseById` | Zen extends session store via patches | Yes, intentionally |

The locks matter: flipping `sidebar.revamp` or `browser.tabs.splitView.enabled`
without removing the lock does nothing. Any adoption is a coordinated change.

## Per-surface recommendation

### Split view — keep Zen for M1, re-evaluate after

Zen's implementation is the product's interaction model: drag a tab onto
another, click-to-split, up to 4 panes, gesture-driven resize, persisted in the
Zen session format. Native split view is newer, integrated with native tab
groups, and has upstream tests, but adopting it means migrating persisted
sessions and re-teaching the gestures.

- Keep `ZenViewSplitter.mjs` and the lock for M1.
- Add no second split model.
- Re-evaluate when: native split view supports Zen's pane count and drag
  gestures, or when native groups and Zen folders must interoperate.
- Do not remove Zen's implementation in the same milestone that adds another
  feature.

### Tab groups — keep Zen folders, keep native off

Native groups are a tab-strip concept; Zen folders are sidebar-first and
nestable. Running both produces two competing "group" affordances. Keep Zen
folders. Revisit only if we adopt the native sidebar.

### Tab notes — adopt the native store, build our UI

This is the clearest win. The engine already has a per-URL SQLite store, a
canonical-URL resolver, hover-preview integration and tests. Building a second
store would duplicate all of it.

- Turn on `browser.tabs.notes.enabled` behind our own pref
  (`zen.notes.tab`, default off until QA).
- Add a sidebar/editor surface in `src/zen/`.
- Do not write a new database.

### Hover previews — adopt native, style it

`browser.tabs.hoverPreview.enabled` is `true` upstream and `false` in
`prefs/firefox/browser.yaml`. The module already renders previews for the tab
strip and understands notes. Enable it behind `zen.tabs.hover-previews` and
restyle for the sidebar. Keep Glance: it previews *content in place*, which is
a different affordance from a tab thumbnail.

### Sidebar / vertical tabs — keep Zen

The native revamp is a general-purpose sidebar; Zen's is the product. Migrating
would discard spaces, folders, essentials, compact mode and their tests. Keep
both native prefs `false` and locked until a deliberate sidebar rewrite, which
is out of scope for M1.

### Containers — native, already

Use `ContextualIdentityService`; do not implement isolation ourselves. The open
question is product policy (should every space be isolated by default?), not
implementation. That is a separate ADR if we change the default.

## Consequences

- We keep a large custom interaction layer, and therefore its maintenance cost.
- We avoid two sources of truth for notes, containers and session state.
- The locks in `prefs/firefox/browser.yaml` stay meaningful; each removal needs
  a test proving the native surface is actually visible.
- Any future adoption of native split view/groups is a migration project, not a
  pref flip; estimate it before promising it.

## Verification

All APIs above were checked against the extracted Firefox 159 tree in
`engine/` at the M0 commit; file and line references are in
`docs/architecture.md` §6-7 and `docs/feature-matrix.md`.

## Open questions

1. Is Zen's 4-pane split limit acceptable for v1, or is it a headline gap?
2. Should native tab groups be exposed at all, given folders exist?
3. Does enabling native hover previews interact badly with Zen's compact mode?
