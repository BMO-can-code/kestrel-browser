<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# ADR-0008: Sync backend

- Status: proposed
- Date: 2026-10-31
- Deciders: project owner

## Decision

Needs a choice. Recommendation: **keep Firefox Sync, Mozilla-hosted, for M1**,
with the existing `spaces` engine unchanged, and make the dependency explicit
in user-facing docs. Do not build a new sync service.

## Context

Zen adds a Firefox Sync engine for spaces:

- Engine name: `services.sync.engine.spaces` (`prefs/zen/sync.yaml`).
- Implementation: `src/zen/sync/ZenSpacesSync.sys.mjs`,
  `ZenSpacesSyncModel.sys.mjs`, using the engine's `CryptoWrapper` for the
  record payload.
- Several user prefs are synced through the standard
  `services.sync.prefs.sync.*` mechanism.

Firefox Sync is end-to-end encrypted for record payloads, but the service still
sees account metadata, device counts, timestamps and record sizes. That is a
material difference from "nothing leaves the device", and our documentation
must say so.

## Options

| Option | Data location | Effort | Notes |
| --- | --- | --- | --- |
| Mozilla-hosted Sync (default) | Mozilla | none | Free, maintained, already wired. Metadata visible to Mozilla. |
| Self-hosted Sync Storage + Tokenserver | our infra | high | `syncstorage-rs` plus a token server; authentication still needs Firefox Accounts, which is another service to run or depend on. |
| Self-hosted Sync + self-hosted FxA | our infra | very high | Full identity stack, email delivery, key management. |
| Local-only, no sync | device | low | Remove or hide the feature; conflicts with the spaces product story. |
| Third-party sync (our own API) | our infra | high | New protocol, new crypto, new clients. Contradicts the no-new-service rule. |

## Why Mozilla-hosted for M1

- Zero new infrastructure and zero new code paths.
- The engine, crypto wrapper and pref-sync plumbing are already tested
  upstream; replacing them is a project, not a milestone task.
- Our threat model for M1 is "private by default, no telemetry"; Firefox Sync
  is opt-in per account and already accepted by the users who enable it.

## Requirements

1. Sync stays **off until the user signs in**; no background account creation.
2. The privacy documentation states plainly: payloads are E2E encrypted,
   metadata is visible to Mozilla, and spaces participate in sync.
3. No new sync engine for our features without an ADR amendment.
4. If we later self-host, the client change is a pref/token-server URL, but the
   FxA dependency must be solved at the same time; do not promise self-hosting
   without it.
5. `services.sync.prefs.sync.*` twins must be updated whenever a synced pref is
   renamed (ADR-0003).

## Consequences

- We depend on Mozilla's service availability and account system.
- "Private" means no telemetry and local-first data, not "no server exists".
- Spaces sync remains compatible with Zen's format, which helps migration in
  both directions and keeps upstream syncs cheap.
- If the product later needs multi-device spaces without Mozilla, that is a
  new ADR with a real backend design, not a pref change.
