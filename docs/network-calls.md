<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Network calls

Inventory of every outbound endpoint this tree can contact, as inherited from
upstream at the M0 commit. "Code path" is the file that initiates the request;
"Default" is the shipped pref value. Nothing here is a proposal; this is what
the code does today.

The one-line posture: **the browser ships with telemetry, studies, sponsored
content, crash upload and search suggestions off and locked, but it still
contacts Zen-operated endpoints for sharing, themes, updates and site
injection, and it still uses Mozilla's Sync and Google Safe Browsing unless
build keys say otherwise.** Every Zen endpoint is a decision in
`docs/decisions/ADR-0006-network-posture.md`.

## 1. Zen-operated endpoints

| Endpoint | Purpose | Code path | Pref / lock | When it fires | Contents |
| --- | --- | --- | --- | --- | --- |
| `https://updates.zen-browser.app` | Update manifest host | `surfer.json` → `updateHostname` → generated `app.update.url` | build-time | Periodic update check, and the "update available" flow | App version, build id, OS, arch, channel. Standard AUS request. |
| `https://share.zen-browser.app` | Upload/download of shared boosts and share documents | `src/zen/share/ZenShareClient.sys.mjs` | `zen.share.base-url` (editable), `zen.share.display-name`, `zen.share.secret-key`, `zen.share.dont-ask-before-sharing=false` | User explicitly shares or opens a share link | User-authored boost/CSS or page snapshot; 25 MiB cap; `credentials: "omit"`; responses validated against `resource:///modules/zen/share/share.schema.json`. Local cache `zen-share-cache.json` keeps 200 entries. |
| `https://zen-browser.github.io/theme-store/themes/<id>/theme.json` | Zen Mods registry entry and asset URLs | `src/zen/mods/ZenMods.mjs:323` | `zen.mods.auto-update` (official builds), `zen.mods.auto-update-days=20` | Install/update a mod, or automatic update check | Mod manifest and CSS/JS assets. Non-HTTPS asset URLs are rejected (`ZenMods.mjs:336`). Remote code execution surface. |
| `https://zen-browser.app/*` | Site injection target for official builds | `prefs/zen/mods.yaml` → `zen.injections.match-urls`, `locked: true` | locked on `MOZILLA_OFFICIAL` | When the user visits a matching URL | Injects chrome-privileged scripts into the Zen website. Local builds target `http://localhost/*` instead. This is the most privileged web-facing hook in the tree. |
| `https://www.zen-browser.app/donate`, `/privacy-policy/`, `/about/` | About dialog and update notification links | `src/zen/about/zen-about.inc.xhtml`, `src/zen/common/modules/ZenUpdates.mjs`, `src/docshell/base/nsAboutRedirector-cpp.patch` | none | User click | Ordinary navigation, no automatic request. |
| `https://zen-browser.app/mods/` | Marketplace link in settings | `src/browser/components/preferences/zenMarketplace.inc.xhtml` | none | User click | Ordinary navigation. |
| `https://docs.zen-browser.app/user-manual/window-sync` | Help link in migration UI | `src/zen/common/sys/ZenUIMigration.sys.mjs:186` | none | User click | Ordinary navigation. |

Notes:

- `zen.share.base-url` is user-editable, so a self-hosted share server is
  already possible without code changes. Whether we ship that is ADR-0006.
- `zen.injections.match-urls` is the clearest rebrand blocker: it hard-codes
  the Zen domain into a privileged injection list.
- `ZenUpdates.mjs` reads `app.releaseNotesURL.prompt` and opens it. That pref is
  formatted with `%VERSION%` and points at a Zen release-notes page.

## 2. Zen-initiated requests to non-Zen hosts

| Endpoint | Purpose | Code path | Pref | Notes |
| --- | --- | --- | --- | --- |
| `https://github.com/pulls`, `https://github.com/issues/assigned` | GitHub live folders | `src/zen/live-folders/providers/GithubLiveFolder.sys.mjs:16-17` | `zen.live-folders.github.skip-new-pr-ui-check=false` | Runs with the user's existing GitHub cookies (principal built from the URL and the space's container). Fetches HTML/JSON to detect auth and list items. |
| `https://github.com/login` | Auth detection for live folders | same provider, `:404` | — | Only probes whether the user is signed in. |
| User-supplied feed URLs | RSS live folders | `src/zen/live-folders/providers/RssLiveFolder.sys.mjs` | — | Arbitrary URL chosen by the user; 5 MiB cap; container-scoped principal. |
| Search engine endpoints | Default search | Engine, not Zen | `browser.search.suggest.enabled=false` (locked off) | Queries go to the selected engine on submit; suggestions are disabled. |
| `https://en.wikipedia.org`, `trello.com`, `notion.com`, `figma.com`, … | Sample content in welcome/migration/onboarding copy | `src/zen/welcome/`, `src/zen/migration/` | — | Mostly link targets and thumbnails, not silent requests. Verify per-file before ship. |

## 3. Inherited Mozilla/Google services

| Service | Endpoint (default) | State in this tree | Pref |
| --- | --- | --- | --- |
| Telemetry (Glean/legacy) | `incoming.telemetry.mozilla.org` | **Off and locked** | `toolkit.telemetry.*=false`, `toolkit.telemetry.server="data:,"`, `datareporting.*=false` |
| Normandy / Shield studies | `normandy.cdn.mozilla.net` | **Off** | `app.normandy.enabled=false`, `app.normandy.api_url=""` (locked) |
| Crash reports | `crash-stats.mozilla.org` | **Off**; crashreporter also not compiled on release (`--disable-crashreporter`) | `browser.tabs.crashReporting.sendReport=false` |
| New Tab sponsored/top sites | `sponsored-topsites…`, Contile | **Off** | `feeds.topsites=false`, `feeds.section.topstories=false`, `browser.topsites.contile.enabled=false`, `showSponsoredCheckboxes=false` |
| Search suggestions | Engine suggestion API | **Off and locked** | `browser.search.suggest.enabled=false`, `.private=false` |
| Quicksuggest / sponsored urlbar | Merino | **Off and locked** | `browser.urlbar.quicksuggest.enabled=false` + sponsored/nonsponsored locked false |
| Add-on recommendations / discovery | `addons.mozilla.org` discovery API | **Off** | `extensions.getAddons.showPane=false`, `extensions.htmlaboutaddons.recommendations.enabled=false`, `browser.discovery.enabled=false`, `extensions.getAddons.cache.enabled=false` |
| Firefox Sync | `sync.services.mozilla.com`, identity provider | **Present**, used by the `spaces` engine | `services.sync.engine.spaces`, token server from engine defaults; nothing self-hosted is configured in the tree |
| Remote Settings | `firefox.settings.services.mozilla.com` | **On** (engine core: blocklists, search config, translations) | engine defaults |
| Safe Browsing | Google Safe Browsing v4 | **On if a key is compiled in**; the key comes from `~/.zen-keys/safebrowsing.dat` at build time | compile-time only |
| Mozilla location service | `location.services.mozilla.com` | **On if a key is compiled in** (`~/.zen-keys/mozilla.dat`) | compile-time only |
| Google location service | `www.googleapis.com` | **On if a key is compiled in** (`~/.zen-keys/google_location_service.dat`) | compile-time only |
| Add-on updates | `addons.mozilla.org` / `zen-browser.github.io` for mods | On for AMO add-ons, plus the mods path above | engine defaults + `zen.mods.auto-update` |
| Widevine EME | Google license servers | On (`--enable-eme=widevine`) | engine defaults |

The build explicitly blanks data reporting:

```text
mk_add_options MOZ_DATA_REPORTING=
mk_add_options MOZ_SERVICES_HEALTHREPORT=
mk_add_options MOZ_TELEMETRY_REPORTING=
ac_add_options MOZ_DATA_REPORTING=
ac_add_options MOZ_TELEMETRY_REPORTING=
```

`configs/common/mozconfig` also hard-codes `MOZ_SOURCE_REPO` and
`with-distribution-id=app.zen-browser`, which are build-identity values, not
network calls, but they appear in crash/update metadata and must change with
the rebrand.

## 4. What a network audit must be able to answer

For every call above, a reviewer should be able to state: who receives it, what
is in it, whether it is opt-in, and how to turn it off without editing code.
Current answers that fail that test:

| Call | Fails because |
| --- | --- |
| Update host | Hard-coded at build time; no user-visible off switch beyond disabling app updates. |
| Site injection list | Locked pref pointing at a Zen domain. |
| Mods registry | Hard-coded CDN host, remote JS, auto-update on by default in official builds. |
| Share upload | Default endpoint is Zen-operated; opt-in per action, but the upload itself is a third-party service. |
| Firefox Sync | Mozilla-hosted; no self-hosted option in the UI and none configured. |

## 5. Verification method

- `grep -rn "https\?://" src/zen prefs configs surfer.json` filtered for
  comments, licences and test fixtures.
- `grep -rn "fetch(\|XMLHttpRequest\|WebSocket\|EventSource\|sendBeacon" src/zen`
  excluding `src/zen/tests`.
- `grep` of `prefs/**` for `telemetry`, `normandy`, `crash`, `datareporting`,
  `suggest`, `quicksuggest`, `topsites`, `discovery`, `update`.
- Engine defaults read from `engine/browser/app/profile/firefox.js` and
  `engine/modules/libpref/init/StaticPrefList.yaml` where a Zen pref merely
  overrides them.

Not verified in M0: the actual bytes on the wire. That requires a built app
and a proxy capture, which is M1 QA work (see `docs/qa/network.md`).
