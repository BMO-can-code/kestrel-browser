# QA: Glance Extensions + Tab Previews (M3)

## Overview
Glance extensions add Enter/Shift+Enter/Esc keyboard handling to the existing
Glance preview system. Tab previews enable native hover previews behind a pref.

Prefs: `zen.glance.enter-opens-in-place` (default true),
`zen.glance.shift-enter-opens-in-split` (default true),
`zen.tabs.hover-previews` (default false)

## Test Cases

### TC-GLANCE-001: Enter opens glance in place
**Steps:**
1. Enable Glance
2. Hover over a link to trigger glance preview
3. Press Enter
**Expected:** Glance opens as a full tab at the glance position

### TC-GLANCE-002: Shift+Enter opens glance in split
**Steps:**
1. Enable Glance
2. Hover over a link to trigger glance preview
3. Press Shift+Enter
**Expected:** Glance opens in split view next to current tab

### TC-GLANCE-003: Esc restores focus exactly
**Steps:**
1. Focus an element on the page
2. Trigger glance preview
3. Press Esc
**Expected:** Glance closes, focus returns to the original element

### TC-GLANCE-004: Hover preview activation
**Steps:**
1. Set `zen.glance.activation-method` to a modifier key
2. Hold the modifier and hover over a link
**Expected:** Glance preview appears

### TC-PREVIEW-001: Enable hover previews
**Steps:**
1. Set `zen.tabs.hover-previews` to `true`
2. Hover over a tab
**Expected:** Tab preview thumbnail appears after delay

### TC-PREVIEW-002: Hover preview disabled by default
**Steps:**
1. Fresh profile
2. Check `zen.tabs.hover-previews` is `false`
**Expected:** No hover preview thumbnails appear

## Acceptance Criteria
- [ ] Enter opens glance in place
- [ ] Shift+Enter opens glance in split view
- [ ] Esc closes glance and restores focus
- [ ] Hover previews work when enabled
- [ ] All features pref-gated and disable-able
