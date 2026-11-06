# QA: Split View Polish (M3)

## Overview
Split view polish adds keyboard-driven focus cycling, pane closing, and
layout presets per space to the existing split view infrastructure.

Prefs: `zen.splitView.cycle-focus` (default true), `zen.splitView.close-pane`
(default true), `zen.splitView.layout-presets` (default true)

## Test Cases

### TC-SPLIT-001: Cycle focus between panes
**Steps:**
1. Enable split view (Accel+Alt+G for grid)
2. Open 2+ tabs in split view
3. Press Accel+` (backtick)
**Expected:** Focus cycles to the next pane in the split view

### TC-SPLIT-002: Cycle focus wraps around
**Steps:**
1. With 3 panes in split view, press Accel+` multiple times
**Expected:** Focus cycles through all panes and wraps to the first

### TC-SPLIT-003: Close pane
**Steps:**
1. With 2+ panes in split view, press Accel+Alt+W
**Expected:** The focused pane is closed; if 2 panes remain, unsplits to single

### TC-SPLIT-004: Close pane with single pane
**Steps:**
1. With a single pane (no split view), press Accel+Alt+W
**Expected:** Nothing happens (no split view active)

### TC-SPLIT-005: Split view keyboard shortcuts
**Steps:**
1. Press Accel+Alt+G (grid), Accel+Alt+V (vertical), Accel+Alt+H (horizontal)
**Expected:** Layout changes accordingly

### TC-SPLIT-006: Drag a tab to split
**Steps:**
1. Drag a tab to the edge of the tab strip
**Expected:** Tab splits into a new pane at that edge

## Acceptance Criteria
- [ ] Cycle focus works with keyboard (Accel+`)
- [ ] Close pane works with keyboard (Accel+Alt+W)
- [ ] Layout shortcuts (G/V/H/U) work
- [ ] Drag-to-split works
- [ ] All features pref-gated and disable-able
