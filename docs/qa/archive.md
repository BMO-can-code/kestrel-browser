# QA: Tab Archive (M2)

## Overview
Tab Archive lets users archive tabs instead of closing them, preserving full
tab state (URL, title, back/forward stack, scroll position, zoom, container).
Archived tabs can be restored losslessly with one-key undo.

Pref: `zen.tabs.archive.enabled` (default false)
Auto-archive pref: `zen.tabs.archive.auto` (default false)
Idle window pref: `zen.tabs.archive.idle-hours` (default 12)

## Test Cases

### TC-ARCH-001: Enable archive pref
**Steps:**
1. Open Settings (or about:config)
2. Set `zen.tabs.archive.enabled` to `true`
**Expected:** Archive becomes available; "Archive Tab" action appears in command bar

### TC-ARCH-002: Archive a tab
**Steps:**
1. With archive enabled, open a tab (e.g., example.com)
2. Open command bar (Cmd/Ctrl+K)
3. Type "archive" and select "Archive Tab"
**Expected:** Tab is removed from UI; tab appears in archive store

### TC-ARCH-003: Undo archive
**Steps:**
1. Archive a tab (TC-ARCH-002)
2. Open command bar (Cmd/Ctrl+K)
3. Type "undo" and select "Undo Archive"
**Expected:** Tab is restored with same URL, title, and position

### TC-ARCH-004: Restore archived tab
**Steps:**
1. Archive a tab
2. Wait >5 minutes (undo window expires)
3. Open command bar, type the tab's title/URL
4. Select the archived tab result
**Expected:** Tab is restored with full back/forward stack and scroll position

### TC-ARCH-005: Archive preserves container
**Steps:**
1. Open a tab in a container (e.g., Personal)
2. Archive the tab
3. Restore the tab
**Expected:** Restored tab is in the same container

### TC-ARCH-006: Auto-archive (idle)
**Steps:**
1. Enable `zen.tabs.archive.auto` and `zen.tabs.archive.enabled`
2. Set `zen.tabs.archive.idle-hours` to a small value for testing
3. Open a tab and leave it idle for the configured window
**Expected:** Tab is automatically archived after idle window

### TC-ARCH-007: Archive persists across restart
**Steps:**
1. Archive a tab
2. Close and reopen the browser
3. Check that the archived tab is still in the archive store
**Expected:** Archived tab survives browser restart (crash safety)

### TC-ARCH-008: Archive disabled by default
**Steps:**
1. Fresh profile
2. Check `zen.tabs.archive.enabled` is `false`
**Expected:** No archive UI or behavior until explicitly enabled

### TC-ARCH-009: Max items limit
**Steps:**
1. Set `zen.tabs.archive.max-items` to 3
2. Archive 5 tabs
3. Check archive entries count
**Expected:** Only 3 most recent entries retained

### TC-ARCH-010: Delete archive entry
**Steps:**
1. Archive a tab
2. Delete the archive entry (via command bar or UI)
3. Try to restore the entry
**Expected:** Entry is gone; restore fails gracefully

## Acceptance Criteria
- [ ] Archive tab preserves full session state
- [ ] Undo archive works within 5-minute window
- [ ] Archive persists across browser restarts
- [ ] All features pref-gated and disable-able
- [ ] No hardcoded English strings (Fluent only)
- [ ] Crash-safe (JSONFile persistence)

## Known Gaps
- Archive browser UI (dedicated view in Library) - deferred to later milestone
- Per-space default search engine - data model implemented, application pending engine integration
