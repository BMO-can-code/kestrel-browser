<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# ADR-0003: Pref namespace

- Status: accepted
- Date: 2026-11-01
- Deciders: project owner

## Decision

**Keep `zen.*` for M1.** No rename now. New prefs use `kestrel.*`. One accessor (`KestrelFeatures`) is the only reader. Mechanical rename plus profile migration at **M5**. 

## Context

The tree uses `zen.` in 189 prefs, plus module paths, CSS ids, l10n ids and file names. Prefs are user data: anything a user has set, and anything synced through `services.sync.prefs.sync.*`, refers to the old names. A rename is wide and would break existing profiles and sync. 

## Implementation
- All new feature prefs go under `kestrel.*` (e.g., `kestrel.benchmark.enabled`)
- `KestrelFeatures` module in `src/zen/common/KestrelFeatures.sys.mjs` is the single accessor for all `kestrel.*` prefs
- Existing `zen.*` prefs remain unchanged for now
- Migration from `zen.*` to new namespace will happen at M5 with profile migration and sync twin updates

## Consequences
- Two namespaces exist during transition; this is acceptable
- Clear separation of new vs old code
- Migration is deferred to M5 when we have a proper migration path

## Requirements for M5 rename
- A migration that copies every old pref to the new name once, then leaves the old value in place (do not delete user data).
- Sync twin prefs updated in the same change, or sync silently stops working.
- A grep test in CI that fails on `zen.` in `prefs/**` after the rename lands.
- Pref-gated: `kestrel.migration.rename-prefs=true` until verified.
