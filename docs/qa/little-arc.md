# QA: Little Arc (M3)

## Overview
Little Arc is a chrome-less quick window opened via global hotkey
(Accel+Shift+Space by default). It provides fast navigation with actions:
open-in-space, split-with-current, archive, pin.

Pref: `zen.windows.little-arc` (default false)
Hotkey pref: `zen.windows.little-arc.hotkey` (default "Accel+Shift+Space")

## Test Cases

### TC-LITTLE-001: Enable Little Arc
**Steps:**
1. Set `zen.windows.little-arc` to `true`
2. Press Accel+Shift+Space
**Expected:** Little Arc window opens

### TC-LITTLE-002: Little Arc navigation
**Steps:**
1. Open Little Arc (TC-LITTLE-001)
2. Type a URL in the URL bar and press Enter
**Expected:** Page loads in the main browser window, Little Arc closes

### TC-LITTLE-003: Little Arc open-in-space
**Steps:**
1. Open Little Arc
2. Type a URL and press Enter
3. Click "Open in Space" button
**Expected:** Page opens in the selected space in the main window

### TC-LITTLE-004: Little Arc split-with-current
**Steps:**
1. Open Little Arc
2. Type a URL
3. Click "Split with Current" button
**Expected:** Page opens in split view with current tab in main window

### TC-LITTLE-005: Little Arc archive
**Steps:**
1. Enable `zen.tabs.archive.enabled`
2. Open Little Arc with a page loaded
3. Click "Archive Tab" button
**Expected:** Tab is archived, Little Arc closes

### TC-LITTLE-006: Little Arc pin
**Steps:**
1. Open Little Arc with a page loaded
2. Click "Pin Tab" button
**Expected:** Tab is pinned/unpinned

### TC-LITTLE-007: Little Arc disabled by default
**Steps:**
1. Fresh profile
2. Check `zen.windows.little-arc` is `false`
**Expected:** Little Arc hotkey does nothing

## Acceptance Criteria
- [ ] Little Arc opens via global hotkey when enabled
- [ ] URL navigation works and opens in main window
- [ ] All 4 actions (space, split, archive, pin) work
- [ ] Window closes after navigation/action
- [ ] All features pref-gated and disable-able
