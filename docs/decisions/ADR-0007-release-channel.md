<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# ADR-0007: Update channel, signing and distribution

- Status: accepted
- Date: 2026-11-01
- Deciders: project owner

## Decision

**None until M5. M1–M4 artifacts are unsigned dev builds with ad-hoc signing so they launch.** Document the quarantine-removal step. At **M5**: Developer ID + notarization + signed DMG, manual releases. Defer AUS/MAR until there is a release cadence. Apple Developer ID costs **$99/yr**.

## Context

`surfer.json` sets `updateHostname: localhost`, and the engine's
AUS client will happily use it. That means an installed build checks Zen's
server and, if a manifest matches, replaces itself with a Zen build. This is
the single most dangerous inherited default.

macOS also requires a Developer ID signature and notarisation for a build that
opens without Gatekeeper warnings. Neither exists yet, and M0 explicitly did
not install Xcode.

The release configuration already disables the crash reporter
(`--disable-crashreporter`) and telemetry, which simplifies the privacy story
but removes crash telemetry from our own feedback loop.

## Options

| Option | Effort | Risk |
| --- | --- | --- |
| No updater; manual downloads | none | Users must reinstall manually; acceptable pre-beta |
| Our own AUS-compatible endpoint (static manifests on a CDN) | medium | We own the signing keys and manifest correctness |
| Balrog (Mozilla's update server) self-hosted | high | Full release engineering; overkill for now |
| Keep Zen's endpoint | none | **Unacceptable**: our users would receive Zen builds |

## Recommendation details

1. M1: `updateHostname` points at an invalid/local host, `app.update.auto` off,
   `app.update.enabled` off. Builds are labelled "development, do not
   distribute".
2. Before public beta: decide the domain, generate signing keys, notarise on
   macOS, and either stand up a static manifest host or adopt a managed
   service.
3. Signing keys never live in CI secrets that fork PRs can read; use an
   environment with required reviewers.
4. Keep `--disable-crashreporter` until we have a privacy-reviewed crash
   endpoint. Without it, crashes are silent; state that in the QA docs.

## Consequences

- Manual updates slow down tester feedback but avoid an accidental Zen
  takeover.
- Notarisation requires an Apple Developer account and a macOS signing host;
  budget for both.
- Windows and Linux packaging are out of scope for M1; their installer patches
  still contain Zen URLs and must be cleaned before any non-macOS build.

## Open questions

1. Is there an Apple Developer account, or does the project need to obtain one?
2. Which domain serves updates, and who controls DNS?
3. Do we want delta updates (`.mar`) or full downloads for the first beta?
