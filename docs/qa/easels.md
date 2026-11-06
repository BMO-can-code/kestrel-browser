# QA: Easels (M4)

## Overview
Easels are freeform canvases per space that accept dragged tabs, links,
text, and screenshots. Stored locally, exportable to Markdown.

Pref: `zen.easels.enabled` (default false)

## Test Cases

### TC-EASEL-001: Enable easels
**Steps:**
1. Set `zen.easels.enabled` to `true`
2. Open command bar, type "new easel"
**Expected:** New easel is created in the current space

### TC-EASEL-002: Create easel
**Steps:**
1. With easels enabled, create a new easel
2. Give it a title
**Expected:** Easel appears in the space's easel list

### TC-EASEL-003: Drag tab to easel
**Steps:**
1. Open an easel
2. Drag a tab from the tab strip onto the easel canvas
**Expected:** Tab URL/title is added to the easel as a link

### TC-EASEL-004: Drag text to easel
**Steps:**
1. Select text on a page
2. Drag it onto an easel canvas
**Expected:** Text is added to the easel

### TC-EASEL-005: Export to Markdown
**Steps:**
1. Create an easel with content
2. Click "Export Markdown"
**Expected:** A .md file downloads with the easel content

### TC-EASEL-006: Easel persists across restart
**Steps:**
1. Create an easel with content
2. Close and reopen the browser
**Expected:** Easel is still present

## Acceptance Criteria
- [ ] Easels can be created per space
- [ ] Dragged tabs/links/text appear on the canvas
- [ ] Export to Markdown works
- [ ] Easels persist across browser restarts
- [ ] Pref-gated and disable-able
