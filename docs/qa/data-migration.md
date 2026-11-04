<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Data migration and recovery

The browser is a database with a UI. Losing a profile is worse than a crash, so
every change that touches persistence needs a migration plan.

## What is stored where

| Data | Mechanism | File / location |
| --- | --- | --- |
| Tabs, windows, spaces, folders, pins | Zen session store (patched `sessionstore`) | `sessionstore.jsonlz4` in the profile, plus backups |
| Space routing rules | `JSONFile` | `zen-space-routing.jsonlz4` |
| Boosts | `JSONFile` | `zen-boosts.jsonlz4` |
| Mods | JSON + remote assets | `zen-mods.json`, profile storage |
| Tab notes | SQLite | `tabnotes` table, `places.sqlite`-adjacent profile DB |
| Bookmarks, history | Places | `places.sqlite` |
| Prefs | Prefs service | `prefs.js` |
| Share cache | JSON | `zen-share-cache.json` |

Zen patches the session store, so the on-disk schema is **not** stock Firefox.
A stock Firefox build cannot read a Zen session, and vice versa. State that in
release notes.

## Rules

1. **Additive changes only** unless there is a version marker and a migration.
2. **Read old, write new.** A new field must tolerate its absence and default
   safely; never assume it exists.
3. **Never delete user data to fix a parse error.** Quarantine the file, start
   clean, and tell the user where the old file went.
4. **Back up before migrating.** Keep one previous session backup.
5. **Downgrade is a supported failure mode.** An older build opening a newer
   profile must refuse or degrade safely, never rewrite the newer format.
6. **Profile path changes require a migration.** Changing `appId`
   (ADR-0005) moves the profile directory. Offer to copy the old profile and
   say what was copied.

## Test cases

| ID | Scenario | Expected |
| --- | --- | --- |
| M-01 | Upgrade: previous build profile opened by new build | All tabs, spaces, folders, pins, notes intact |
| M-02 | New field absent in old session | Defaults applied, no exception, no data loss |
| M-03 | Truncated `sessionstore.jsonlz4` | Safe start, corrupt file quarantined, message shown |
| M-04 | Corrupt JSON store (routing/boosts/mods) | Only that store resets; tabs unaffected |
| M-05 | Corrupt notes DB | Notes unavailable, browser starts, no crash loop |
| M-06 | Downgrade to previous build | Refuses or reads read-only; newer file not overwritten |
| M-07 | Profile path change | Old profile offered for copy; nothing silently abandoned |
| M-08 | Pref rename (if ADR-0003 says yes) | Old values copied once; both names readable during transition |
| M-09 | Disk full during save | Error surfaced; previous good file preserved |
| M-10 | Crash during session write | Restore from last backup, not an empty session |

## Procedure for M-01/M-06

1. Save a copy of the profile directory before each step.
2. Record the build SHA and the profile size.
3. Open with the new build, exercise spaces/folders/pins/notes, quit cleanly.
4. Compare restored state against a screenshot taken before the upgrade.
5. Open with the old build; confirm it does not destroy the newer data.
6. Keep the profile copy until the milestone closes.

## Open items

- The Zen session schema is patched, not documented. M1 should write down the
  fields we depend on before changing them.
- `browser.sessionstore.max_windows_undo` and the Zen window-sync prefs affect
  what is restorable; they are not user-visible enough today.
- Tab notes use a separate SQLite database, so "back up the profile" must
  include it; verify the file name during M1.
