<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# ADR-0005: Product identity and rebrand

- Status: accepted
- Date: 2026-11-01
- Deciders: project owner

## Decision

**Kestrel at M1 for user-visible branding; internal identifiers stay `zen` until M5.**

| Item | Changed at | Notes |
| --- | --- | --- |
| Product name, short name (menus, window titles, About, UI strings) | M1 | Use **Kestrel**. |
| Icons/wordmarks (user-visible) | M1 | Replace with neutral/distinct marks. Must not be Zen recolours. |
| App id (`app.zen-browser`), distribution id | M5 | Stays `zen` until M5 with profile migration. Changing app id invalidates profiles and update config. |
| Binary name / executable name | M5 | Stays `zen` until M5. |
| Profile directory | M5 | Stays as-is until M5 with migration. |
| `updateHostname` | M5 | Blank/disabled until a domain is owned. No updater until M5 (ADR-0007). |
| Telemetry/update endpoints | M5 (or never) | Blank/disabled until owned; do not invent domains. |

## Context

The tree is Zen-branded at every layer. Zen's trademarks are not ours, and the project brief requires a complete rebrand before ship. The full inventory is in `docs/branding-inventory.md`.

Two items have lasting consequences beyond cosmetics:
1. **`appId`** determines the profile directory and `application.ini` identity. Changing it later orphans profiles; requires a one-time profile migration.
2. **`updateHostname`** decides who can push updates. Must be ours before any binary leaves the machine if using an updater.

We cannot invent domains. Update host and any telemetry endpoint are blank/disabled until a domain is owned. Pref names may stay `zen.*` under ADR-0003, so rebrand can proceed without a pref namespace change.

## Implementation notes

- M1: replace user-visible strings/icons/window titles/about page with Kestrel.
- Keep internal identifiers (`app.zen-browser`, binary name, profile dir, update host) as `zen` until M5.
- Profile migration will be required at M5 when changing app id/profile dir.
- Development builds must not contact Zen endpoints (ADR-0006).
- No placeholder domains invented.

## Consequences

- Split timeline reduces risk of profile breakage before we have migration/updater infrastructure.
- User-visible rebrand is complete for v1 even if internal IDs remain for now.
- About `about:support` may show internal identifiers until M5; this is acceptable for dev builds.

## Acceptance

See `docs/branding-inventory.md`. The grep check is mandatory, and packaged-app inspection of `Info.plist` and the About dialog for user-visible branding.
