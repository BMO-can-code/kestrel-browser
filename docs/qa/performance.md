# QA: Performance (M5)

## Overview
Performance pass validates startup time, memory usage, command bar
responsiveness, and space switch speed against established baselines.

Prefs: `zen.performance.command-bar-p95-target` (default 50ms),
`zen.performance.space-switch-target` (default 100ms),
`zen.performance.split-create-target` (default 150ms)

## Test Cases

### TC-PERF-001: Command bar open time
**Steps:**
1. Enable command bar (`zen.commandbar.enabled`)
2. Measure time from Cmd/Ctrl+K to panel visible
3. Repeat 50 times, calculate p95
**Expected:** p95 ≤ 50ms

### TC-PERF-002: Space switch time
**Steps:**
1. Switch between spaces using Cmd/Ctrl+1..9
2. Measure time from keypress to UI update
**Expected:** ≤ 100ms

### TC-PERF-003: Split view creation
**Steps:**
1. Create split view (drag tab or keyboard shortcut)
2. Measure time from action to panes visible
**Expected:** ≤ 150ms

### TC-PERF-004: Cold start
**Steps:**
1. Launch browser from cold state
2. Measure time to first paint
**Expected:** ≤ Zen baseline + 10%

### TC-PERF-005: Warm start
**Steps:**
1. Launch browser after recent use
2. Measure time to first paint
**Expected:** ≤ Zen baseline + 5%

### TC-PERF-006: 50-tab memory
**Steps:**
1. Open 50 tabs
2. Measure memory usage
**Expected:** ≤ Zen baseline + 5%

## Acceptance Criteria
- [ ] Command bar p95 ≤ 50ms
- [ ] Space switch ≤ 100ms
- [ ] Split create ≤ 150ms
- [ ] Cold start ≤ Zen baseline + 10%
- [ ] Warm start ≤ Zen baseline + 5%
- [ ] 50-tab memory ≤ Zen baseline + 5%
- [ ] Background tabs unload correctly

## Known Gaps
- No local build available to measure actual numbers (S1 strategy)
- Benchmarks must be run against CI artifact
