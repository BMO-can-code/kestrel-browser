<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0.
   -->

# ADR-0010: Ship readiness (M5)

- Status: proposed
- Date: 2026-11-06
- Deciders: project owner

## Decision

Ship readiness is gated on: CI green, artifact launches, rebrand complete
(user-visible), all features pref-gated, accessibility pass, performance
baselines documented, and pre-release checklist cleared. Internal identifiers
(`appId`, binary name, profile dir) stay `zen` until M5 with profile migration.

## Context

M0–M4 delivered the core product: spaces, sidebar, command bar, tab archive,
split view, Little Arc, Glance, boosts, easels, tab notes. M5 adds the
ship-readiness layer: accessibility (ARIA + visible focus), performance
baselines, sync documentation, and the pre-release checklist.

## Sync (ADR-0008 reaffirmed)

Firefox Sync (Mozilla-hosted) remains the sync backend for spaces. The spaces
engine (`services.sync.engine.spaces`) is already wired in Zen and uses
`CryptoWrapper` for E2E-encrypted record payloads. Sync is off until the user
signs in. Self-hosted sync is deferred (high effort, requires Firefox Accounts
which is another service to run).

Threat model: payloads are E2E encrypted, but Mozilla sees account metadata,
device counts, timestamps, and record sizes. This is documented in
`docs/network-calls.md` and the pre-release checklist.

## Rebrand (ADR-0005)

User-visible branding changed to Kestrel at M1. Internal identifiers
(`appId=zen`, `binaryName=zen`, profile dir) remain `zen` until M5. Changing
`appId` requires profile migration and must be coordinated with update config
(`updateHostname` is blanked until a domain is owned).

## Accessibility

All custom elements (command bar, easel) have ARIA roles and labels.
Visible focus indicators are pref-gated (`zen.a11y.visible-focus`, default
true) and synced to a document attribute (`zen-a11y-visible-focus`) for CSS
targeting. Reduced motion is respected.

## Performance

Performance targets are documented as prefs (`zen.performance.*`) and QA
criteria (`docs/qa/performance.md`). Actual benchmark numbers require a local
build, which is blocked by the 10 GB disk cap (S3 forbidden). Benchmarks must
be run against the CI artifact.

## Network posture (ADR-0006)

All outbound endpoints are documented in `docs/network-calls.md`. Telemetry,
crash, and studies are off and locked. Update host is blanked. Firefox Sync is
Mozilla-hosted and opt-in. Zen-operated endpoints (share, mods, updates) are
either user-editable or blanked.

## Consequences

- M5 does not add new engine patches (front-end only).
- M5 does not add new runtime dependencies.
- M5 does not change the build system.
- appId/profile migration is deferred to a post-M5 release.
