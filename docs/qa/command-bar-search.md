# QA: Per-Space Search Engine + Command Bar (M2)

## Overview
Per-space search engine allows each space to have its own default search engine.
Command bar (Cmd/Ctrl+K) provides unified access to URL, search, tabs, spaces, and actions.

Prefs: `zen.spaces.per-engine-search` (default false), `zen.commandbar.enabled` (default false)

## Test Cases

### TC-CB-001: Enable command bar
**Steps:**
1. Set `zen.commandbar.enabled` to `true`
2. Press Cmd/Ctrl+K
**Expected:** Command bar panel opens over content

### TC-CB-002: Command bar search actions
**Steps:**
1. With command bar enabled, type "archive tab"
**Expected:** "Archive Tab" action appears in results

### TC-CB-003: Command bar escape closes
**Steps:**
1. Open command bar
2. Press Esc
**Expected:** Command bar closes

### TC-PSE-001: Set per-space search engine
**Steps:**
1. Enable `zen.spaces.per-engine-search`
2. Create a space (e.g., "Work")
3. Set search engine for the space (via command bar or settings)
**Expected:** Space has a search engine assigned

### TC-PSE-002: Search engine persists with space
**Steps:**
1. Set search engine for a space
2. Export and import the space
3. Check search engine is preserved
**Expected:** Search engine survives export/import

### TC-PSE-003: Search engine disabled by default
**Steps:**
1. Fresh profile
2. Check `zen.spaces.per-engine-search` is `false`
**Expected:** Per-space search engine not active

## Acceptance Criteria
- [ ] Command bar opens with Cmd/Ctrl+K when enabled
- [ ] Archive actions appear in command bar results
- [ ] Per-space search engine can be set and retrieved
- [ ] Search engine survives space export/import
- [ ] All features pref-gated and disable-able
