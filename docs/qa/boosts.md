# QA: Boosts (M4)

## Overview
Boosts allow per-site CSS/JS injection with live editor and element picker.
Scoped to origin, sanitized, auto-disabled when the site changes.

Pref: `zen.boosts.enabled` (default true in Zen, keep as-is)
New: `zen.boosts.css-sanitize` (default true)

## Test Cases

### TC-BOOST-001: Create a boost
**Steps:**
1. Visit a website (e.g., example.com)
2. Open command bar, type "new boost"
3. Add CSS in the editor
4. Save
**Expected:** Boost is saved and applied to the site

### TC-BOOST-002: CSS sanitization
**Steps:**
1. Create a boost with `@import url('https://evil.com/evil.css')` in custom CSS
2. Save and check the applied stylesheet
**Expected:** `@import` is stripped from the injected CSS

### TC-BOOST-003: Boost is scoped to origin
**Steps:**
1. Create a boost for example.com
2. Visit a different domain
**Expected:** Boost is not applied to the different domain

### TC-BOOST-004: Boost disabled when site changes
**Steps:**
1. Create a boost for a specific page
2. Navigate to a significantly different page on the same domain
**Expected:** Boost may be auto-disabled (existing Zen behavior)

## Acceptance Criteria
- [ ] Boosts can be created, edited, and deleted
- [ ] CSS is sanitized before injection (@import, url() removed)
- [ ] Boosts are scoped to origin
- [ ] Boosts are pref-gated
