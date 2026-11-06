# QA: Space Export/Import (M2)

## Overview
Spaces can be exported to JSON and imported from JSON, enabling users to move
spaces between devices or back up their space configuration.

Pref: `zen.spaces.export` (default false)

## Test Cases

### TC-SPACE-001: Export spaces
**Steps:**
1. Create several spaces with names, icons, and themes
2. Open command bar (Cmd/Ctrl+K)
3. Type "export spaces" and select "Export Spaces"
**Expected:** A JSON file downloads containing all spaces with metadata

### TC-SPACE-002: Import spaces
**Steps:**
1. Export spaces (TC-SPACE-001)
2. Open command bar (Cmd/Ctrl+K)
3. Type "import spaces" and select "Import Spaces"
4. Select the exported JSON file
**Expected:** Spaces are imported into the current profile

### TC-SPACE-003: Import validates data
**Steps:**
1. Create an invalid JSON file (missing spaces array)
2. Try to import it
**Expected:** Import reports error, no spaces are added

### TC-SPACE-004: Import skips duplicates
**Steps:**
1. Export spaces
2. Import the same file twice
**Expected:** Second import skips duplicate spaces (same UUID)

### TC-SPACE-005: Export includes search engine
**Steps:**
1. Set a search engine for a space
2. Export spaces
3. Check the JSON contains searchEngine field
**Expected:** Exported JSON includes searchEngine per space

### TC-SPACE-006: Export disabled by default
**Steps:**
1. Fresh profile
2. Check `zen.spaces.export` is `false`
**Expected:** Export/import not available until enabled

## Acceptance Criteria
- [ ] Export produces valid JSON with all space metadata
- [ ] Import restores spaces correctly
- [ ] Invalid data is rejected with errors
- [ ] Duplicate UUIDs are handled gracefully
- [ ] All features pref-gated and disable-able
