# QA: Site Apps (M4) — Feasibility Investigation

## Overview
Installable site apps allow installing a site as an app window bound to a
space, with its own icon and shortcuts.

**Status: Investigation required.** Firefox 159 has `SiteSpecificBrowser`
removed from the engine. This is engine-level work that cannot be done
purely in front-end chrome.

Pref: `zen.site-apps.enabled` (default false — feature not implemented)

## Test Cases

### TC-SITEAPPS-001: Feasibility check
**Steps:**
1. Confirm `SiteSpecificBrowser` is absent from `engine/`
2. Check if any native app-window API exists in Firefox 159
**Expected:** Document findings; determine if front-end-only approach is possible

### TC-SITEAPPS-002: Pref exists but feature not implemented
**Steps:**
1. Set `zen.site-apps.enabled` to `true`
2. Try to install a site as an app
**Expected:** No-op (feature not yet implemented)

## Acceptance Criteria
- [ ] Feasibility documented in ADR
- [ ] Pref exists and is disable-able
- [ ] No false claims of functionality

## Known Gaps
- `SiteSpecificBrowser` removed from Firefox 159 engine
- Site apps require engine-level changes (new window type, app manifest)
- Deferred to post-M4 or requires engine patch approval
