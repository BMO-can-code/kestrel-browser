# QA: Tab Notes (M4)

## Overview
Tab notes are per-URL notes stored in the native Firefox TabNotes SQLite
store. Enabled behind `zen.notes.tab` (default false), which syncs to
`browser.tabs.notes.enabled`.

## Test Cases

### TC-NOTES-001: Enable tab notes
**Steps:**
1. Set `zen.notes.tab` to `true`
2. Check `browser.tabs.notes.enabled` is also `true`
**Expected:** Both prefs are true; tab notes feature is available

### TC-NOTES-002: Add note to a tab
**Steps:**
1. Visit a page (e.g., example.com)
2. Open command bar, type "tab notes"
3. Add a note
**Expected:** Note is saved for the page's URL

### TC-NOTES-002b: Note persists on reload
**Steps:**
1. Add a note to a page
2. Reload the page
3. Open tab notes again
**Expected:** Note is still present

### TC-NOTES-003: Note is per-URL
**Steps:**
1. Add a note to example.com
2. Visit a different URL
**Expected:** Different URL has no note (or its own note)

### TC-NOTES-004: Delete note
**Steps:**
1. Add a note to a page
2. Delete the note
3. Reopen tab notes for that page
**Expected:** Note is gone

## Acceptance Criteria
- [ ] Tab notes can be added, viewed, and deleted per URL
- [ ] Notes persist across page reloads
- [ ] Notes are scoped to URL (not shared across pages)
- [ ] Pref-gated and disable-able
