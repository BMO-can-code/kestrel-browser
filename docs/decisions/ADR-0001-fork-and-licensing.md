<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# ADR-0001: Fork strategy and licensing

- Status: accepted
- Date: 2026-10-31
- Deciders: project owner

## Decision

Fork `zen-browser/desktop` at `dev`, keep the patch-stack architecture, keep
MPL-2.0, never rewrite published history, and make all our changes as new
commits on top (patches in `src/`, front-end in `src/zen/`, docs in `docs/`).

## Context

Zen is not a theme. It is a patched Gecko plus a parallel chrome application.
Rewriting it from scratch would discard 15k lines of engine work and 547
browser tests. A soft fork that tracks upstream is the only approach that keeps
security updates and session/format compatibility reachable.

## Alternatives

1. **Hard fork, stop tracking upstream.** Full control, but Firefox security
   fixes and Gecko changes become our problem. Rejected.
2. **Extension-only product.** Cannot change the tab strip, sidebar geometry,
   window materials or session format. Rejected: the sidebar-first shell is the
   product.
3. **Fork Firefox directly, skip Zen.** Cleaner provenance, but we would rebuild
   spaces, folders, pinned tabs, split view and the sidebar first. Rejected for
   M1; may be revisited after the feature matrix is implemented if Zen's code
   proves to be more liability than asset.

## Consequences

- Every upstream sync is a merge project; see `docs/engine-patches.md`.
- We inherit Zen's licences and must keep MPL-2.0 headers intact.
- We inherit Zen's network endpoints and branding until we replace them.
- We inherit 547 tests as a regression net.
- Our public fork is `BMO-can-code/desktop`; `upstream` stays read-only for us.
- No force-push, no history rewrite, including on our own branches once they
  are public.

## Compliance notes

- `LICENSE` stays MPL-2.0. New files get the standard header.
- Upstream copyright notices are not removed.
- Zen's trademarks are not ours; the rebrand is mandatory before distribution
  (ADR-0005).
- Source for our binaries must remain available; the fork is public.
