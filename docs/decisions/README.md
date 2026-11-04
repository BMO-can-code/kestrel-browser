<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Decisions

Architecture decision records. One file per decision, numbered, never deleted.
A superseded ADR keeps its file and gains a `Superseded by` line.

Status values: **proposed** (needs a decision), **accepted**, **rejected**,
**superseded**.

| ADR | Title | Status | Blocks |
| --- | --- | --- | --- |
| [0001](ADR-0001-fork-and-licensing.md) | Fork strategy and licensing | accepted | — |
| [0002](ADR-0002-ci-builder.md) | CI builder for baseline and M1 | proposed | M1 builds |
| [0003](ADR-0003-pref-namespace.md) | Pref namespace | proposed | New prefs |
| [0004](ADR-0004-native-vs-custom.md) | Native Firefox surface vs Zen implementation | proposed | Split view, groups, notes, hover previews, sidebar |
| [0005](ADR-0005-branding.md) | Product identity and rebrand | proposed | Ship, packaging, profile path |
| [0006](ADR-0006-network-posture.md) | Network posture and third-party services | proposed | Share, mods, live folders, updates |
| [0007](ADR-0007-release-channel.md) | Update channel, signing and distribution | proposed | Any build handed to testers |
| [0008](ADR-0008-sync-backend.md) | Sync backend | proposed | Spaces sync |

## Writing a new ADR

1. Copy the structure of an existing file.
2. State the decision in one sentence at the top.
3. List the real alternatives, including "do nothing".
4. Record consequences, including the cost of reversing it.
5. Link the code and prefs it affects.
6. Set status honestly; do not mark something accepted that the user has not
   approved.
