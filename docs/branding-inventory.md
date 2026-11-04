<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Branding inventory

Everything that says "Zen" and must say the new name before ship. M0 only
inventories; no file was changed. The project name is still undecided
(`[PROJECT_NAME]`), so every item below is listed by *location*, not by its
future value.

Status: **not started by design.** A placeholder name and icon may be used
during M1 development, but shipping requires every row to be cleared.

## 1. Build identity (highest risk)

| Item | Current value | File | Effect of not changing |
| --- | --- | --- | --- |
| Product name | `Zen Browser` | `surfer.json` (`name`) | Installer, About, window titles, crash metadata |
| Vendor | `Zen OSS Team` | `surfer.json` (`vendor`) | macOS bundle vendor, Windows publisher |
| App id | `zen` | `surfer.json` (`appId`) | Profile directory, `application.ini` id, update channel identity |
| Binary name | `zen` | `surfer.json` (`binaryName`) | Executable name inside the bundle |
| App basename | `Zen` | `configs/common/mozconfig` (`--with-app-basename`, `MOZ_APP_BASENAME`) | `remoting` name, some chrome URLs |
| Distribution id | `app.zen-browser` | `configs/common/mozconfig` (`--with-distribution-id`) | Distribution hooks, partner repacks |
| Source repo | `https://github.com/zen-browser/desktop` | `configs/common/mozconfig` (`MOZ_SOURCE_REPO`) | Crash/update metadata points at upstream |
| Update host | `updates.zen-browser.app` | `surfer.json` (`updateHostname`) | Our builds would check Zen's update server |
| Release display version | `1.24b` / `1.25t` | `surfer.json` (`brands.release/twilight`) | Version shown in About and update UI |
| GitHub release repo | `zen-browser/desktop` | `surfer.json` (per brand) | Update/package scripts target upstream releases |
| Brand keys | `release`, `twilight` | `surfer.json`, `configs/branding/*` | Two full asset sets to replace |

Changing `appId` is not cosmetic: it changes the profile path and the
`application.ini` identity, so any existing profile (including ours during
development) must be migrated or discarded. Decide this before M1 builds are
handed to testers. See `docs/decisions/ADR-0005-branding.md`.

## 2. Image and installer assets

`configs/branding/{release,twilight}` contains 24 files each (48 total), all
still Zen/Firefox art:

| Asset | Used for |
| --- | --- |
| `firefox.icns` | macOS app icon |
| `firefox.ico`, `firefox64.ico`, `document.ico`, `document_pdf.ico`, `pbmode.ico` | Windows icons |
| `logo{16,22,24,32,48,64,128,256,512,1024}.png`, `logo.png`, `logo-mac.png` | In-app logos, `about:logo`, taskbar |
| `content/about-logo{,@2x}.png/svg`, `content/about-logo-private*` | About dialog |
| `content/about-wordmark.svg`, `content/firefox-wordmark.svg` | Wordmarks (filenames keep "firefox") |
| `MacOSInstaller.svg`, `VisualElements_{70,150}.png`, `PrivateBrowsing_{70,150}.png` | Windows/macOS installer art |
| `wizWatermark.bmp` | Windows installer watermark |

`surfer` regenerates `firefox.icns` from `logo-mac.png` on macOS during import
(`branding-patch.js` → `async-icns`), so replacing the PNG and keeping the
filename is enough for the icon.

Additional in-tree art:

| Asset | Location | Note |
| --- | --- | --- |
| `src/zen/images/` | 100+ SVG icons and animations | Interface icons, not the product mark; most can stay, but any that embed the Zen glyph must go |
| `src/zen/welcome/welcome-background.mp4` | 15 MB | First-run video; replace or remove, and it is a packaging-size win |
| `docs/assets/zen-*.svg`, `blacksmith-yellow.png` | `docs/` | Docs only, not shipped |
| `src/zen/@types`, `vendor/` | type defs / small vendored code | Check for marks before ship |

## 3. User-visible strings

| Area | Files | Contains |
| --- | --- | --- |
| Localisation | 16 `.ftl` files in `locales/en-US/browser/browser/` | 15 lines mention "Zen" explicitly; more imply it ("Zen Browser", "Zen Mods", "Zen's …") |
| About dialog | `src/zen/about/zen-about.inc.xhtml`, `zen-about.js` | Name, donate link, privacy link, credits redirect |
| Settings | `src/browser/components/preferences/zen*.xhtml`, `zen-settings.js` | Pane titles, marketplace section |
| Welcome | `src/zen/welcome/ZenWelcome.mjs` | First-run copy |
| Update notification | `src/zen/common/modules/ZenUpdates.mjs` | "Zen has been updated" heading + donate link |
| Menus/keysets | `src/browser/base/content/zen-*.inc.xhtml` | Menu labels |
| Uninstall survey | `src/browser/installer/windows/nsis/uninstaller-nsi.patch` | `https://links.zen-browser.app/uninstall-feedback` |
| `about:credits` | `src/docshell/base/nsAboutRedirector-cpp.patch` | Redirects to `https://zen-browser.app/about/` |

Localisation ids themselves (`zen-about-*`, `zen-welcome-*`) are internal and
may stay, but every English string must be reviewed; a global find/replace of
"Zen" would also hit "Zenith"-class false positives if we are careless, so do
it per-file with review.

## 4. Code and data namespaces

| Namespace | Scope | Rebrand needed? | Notes |
| --- | --- | --- | --- |
| `zen.*` prefs (189) | Pref surface | Open decision | Renaming breaks existing profiles and the sync pref twins; ADR-0003 |
| `chrome://browser/content/zen-components/*` | Module URLs | Cosmetic but visible in errors/devtools | 210 paths contain "zen" |
| `src/zen/**` directory | Source layout | No functional effect | Renaming creates a 15k-line diff against upstream; not worth it in M1 |
| CSS ids/classes `zen-*` | Styling | No | Only visible to theme authors |
| `zen-share-cache.json`, `zen-boosts.jsonlz4`, `zen-mods.json`, `zen-space-routing.jsonlz4` | Profile data files | Optional | Rename only with a migration, or leave |
| `services.sync.engine.spaces` | Sync engine name | No | Prefixed by Firefox convention, not Zen |
| `Zen*` class names | Code | No | Internal |
| `zen-browser.app` domains | Endpoints | Yes | See `docs/network-calls.md` |

## 5. Documentation and repository surface

| Item | Location |
| --- | --- |
| README, CONTRIBUTING, CODE_OF_CONDUCT | Repository root, still Zen-branded |
| `LICENSE` | MPL-2.0, must stay; add our copyright line without removing Mozilla's |
| `.well-known/funding-manifest-urls` | Points at `zen-browser.app/funding.json`; remove or replace |
| `docs/assets/` | Zen logos used by docs |
| `docs/contribute.md`, `docs/live-folders-specs.md` | Upstream docs that reference Zen |
| `.github/` issue templates, workflows | Upstream branding and release repo references |
| `AGENTS.md`, `CLAUDE.md` | Upstream agent instructions; review before our contributors use them |

## 6. Rebrand order (proposed)

1. Choose name, app id, binary name, vendor, domains. (Blocks everything.)
2. `surfer.json`: name, vendor, brands, update host, release repo.
3. `configs/common/mozconfig`: basename, distribution id, source repo.
4. Icon set: one `logo-mac.png` + `logo*.png` + wordmark; let surfer regenerate
   `firefox.icns` on macOS.
5. Strings: About, Welcome, Settings, Update notification, uninstall survey.
6. Network endpoints: update host, share, mods, injection list, docs links.
7. Repository surface: README, funding manifest, docs assets, workflows.
8. Pref namespace: only if ADR-0003 says yes, and only with a migration.

## 7. Acceptance checks before ship

- `grep -rI "zen-browser\|Zen Browser\|Zen OSS" --exclude-dir=engine --exclude-dir=node_modules .`
  returns only historical/licence references that we intentionally keep.
- The packaged app's `Info.plist` shows our `CFBundleIdentifier`,
  `CFBundleName`, `CFBundleExecutable`, and our icon.
- About dialog, window title, installer, uninstaller, update banner and
  first-run screen show the new name.
- No request leaves the app to a Zen-operated host (verified with a proxy, see
  `docs/qa/network.md`).
- `LICENSE` and every touched file still carry MPL-2.0 headers.
