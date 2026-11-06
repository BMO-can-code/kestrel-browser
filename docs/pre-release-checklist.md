# Pre-Release Checklist

## Rebrand (ADR-0005)

### User-visible (M1 ✅)
- [x] Product name: "Kestrel Browser" (surfer.json `name`)
- [x] Vendor: "Kestrel OSS Team" (surfer.json `vendor`)
- [x] Brand short/full names: "Kestrel" / "Kestrel Browser" (surfer.json `brands.*`)
- [x] UI strings: All Fluent, no hardcoded "Zen" (grep verified)
- [x] Icons/wordmarks: Zen branding CSS removed/replaced
- [x] About dialog: Uses Kestrel branding

### Internal identifiers (M5 — pending)
- [ ] App id (`app.zen-browser`): Stays `zen` until M5 — profile migration required
- [ ] Binary name (`zen`): Stays `zen` until M5
- [ ] Profile directory: Stays as-is until M5 with migration
- [ ] Distribution id (`app.zen-browser`): Stays until M5
- [ ] Source repo URL: `zen-browser/desktop` → `BMO-can-code/kestrel-browser` ✅
- [ ] Update host (`updates.zen-browser.app`): Blanked (no updater until M5)

### Network endpoints (ADR-0006)
- [ ] Update host: Blanked — no automatic update checks
- [ ] Share upload (`share.zen-browser.app`): User-editable pref, self-hosted possible
- [ ] Mods registry (`zen-browser.github.io`): Remote code surface — review before ship
- [ ] Site injection (`zen-browser.app`): Locked pref — review/remove before ship
- [ ] Telemetry/crash: Off and locked ✅
- [ ] Firefox Sync: Mozilla-hosted, opt-in ✅ (ADR-0008)

### Sync (ADR-0008)
- [ ] Firefox Sync (Mozilla-hosted) for spaces engine ✅ (already wired in Zen)
- [ ] Spaces engine E2E encrypted via CryptoWrapper ✅
- [ ] Sync off until user signs in ✅
- [ ] Self-hosted sync: Deferred (high effort, requires FxA)
- [ ] Privacy documentation: E2E payload, metadata visible to Mozilla ✅

## Build & CI
- [ ] S1 remote build workflow green ✅ (run #42125270234)
- [ ] Artifact downloads and launches ✅ (CI verified `--version`)
- [ ] Disk under 10 GB cap locally ✅ (33 GB free)
- [ ] No local engine build ✅ (S1 strategy)

## QA
- [ ] docs/qa/archive.md — Tab archive
- [ ] docs/qa/space-export-import.md — Space export/import
- [ ] docs/qa/command-bar-search.md — Command bar + per-space search
- [ ] docs/qa/split-view-polish.md — Split view polish
- [ ] docs/qa/little-arc.md — Little Arc
- [ ] docs/qa/glance-preview.md — Glance extensions + tab previews
- [ ] docs/qa/boosts.md — Boosts (sanitization)
- [ ] docs/qa/easels.md — Easels
- [ ] docs/qa/tab-notes.md — Tab notes
- [ ] docs/qa/site-apps.md — Site apps (feasibility)
- [ ] docs/qa/a11y.md — Accessibility
- [ ] docs/qa/performance.md — Performance

## Code quality
- [ ] All new files pass Node syntax check ✅
- [ ] All new features pref-gated, default false ✅
- [ ] All user strings in Fluent (.ftl) ✅
- [ ] MPL-2.0 headers on all new files ✅
- [ ] Engine patches commented + logged ✅ (none new in M0–M4)
- [ ] ESLint/Prettier — not run locally (requires engine build)

## Remaining work
- [ ] Local build test — blocked by 10 GB disk cap (S3 forbidden)
- [ ] ESLint/Prettier run — requires engine build (blocked by disk cap)
- [ ] appId change migration — M5, requires profile migration plan
- [ ] Self-hosted sync — deferred (ADR-0008)
- [ ] Site apps — engine-level, deferred
