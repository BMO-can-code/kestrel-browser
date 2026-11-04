<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Pref gating

Every feature we add must be provably off. This is how to prove it.

## The rule

- One pref per feature, boolean, suffix `.enabled`, default `false`.
- `false` must produce the exact behaviour of the previous build: same DOM,
  same module loading, same network calls, same prefs written.
- Turning it on must not require a restart unless the feature registers at
  startup; if it does, the pref must say so in its comment.
- Locked prefs (`locked: true`) cannot be toggled. Do not gate a new feature on
  a locked pref, and do not unlock an inherited lock without an ADR.

## Injecting prefs into a test profile

Firefox reads `user.js` at startup and copies it into `prefs.js`. Use a
throwaway profile per run:

```sh
PROFILE="$(mktemp -d "${TMPDIR:-/tmp}/qa-profile.XXXXXX")"
cat > "${PROFILE}/user.js" <<'EOF'
user_pref("zen.commandbar.enabled", false);
user_pref("zen.notes.tab", false);
user_pref("browser.tabs.notes.enabled", false);
user_pref("app.update.enabled", false);
EOF
"/path/to/Browser.app/Contents/MacOS/zen" -profile "${PROFILE}" -no-remote about:blank
```

To test the on-path, set the same pref to `true` in a second profile. Never
edit `prefs.js` while the app is running.

## What "off" must prove

| Check | Method | Fail looks like |
| --- | --- | --- |
| No UI | Inspect DOM / screenshot | A hidden button still occupies space or is reachable by keyboard |
| No module work | Console + `about:memory` / startup profile | Timers, observers or fetches run anyway |
| No network | `docs/qa/network.md` capture | A request fires on launch or on idle |
| No storage writes | Compare profile file mtimes/hashes | New JSON/SQLite files appear |
| No prefs written | Diff `prefs.js` after a session | The feature records state even when off |
| No engine behaviour change | Run the inherited test suite | Tests change results with the pref off |
| No visual delta | Pixel-compare window screenshots | Spacing or colour shifts |

## Locked prefs inherited from Zen

These are locked today and are relevant to M1. Flipping the value does nothing
until the lock is removed:

| Pref | Value | Why locked |
| --- | --- | --- |
| `sidebar.revamp` | `false` | Zen replaces the native sidebar |
| `sidebar.verticalTabs` | `false` | Same |
| `browser.tabs.splitView.enabled` | `false` | Zen ships its own split view |
| `browser.tabs.groups.hoverPreview.enabled` | `false` | Native groups are off |
| `browser.tabs.dragDrop.multiselectStacking` | `false` | Zen drag model |
| `browser.tabs.dragToPin.enabled` | `false` | Essentials replace it |
| `zen.injections.match-urls` | Zen domain | Privileged injection |

Related but not locked: `browser.tabs.hoverPreview.enabled`,
`browser.tabs.groups.enabled`, `browser.tabs.notes.enabled` (all `false`).

## Review checklist for a gated PR

- [ ] Pref name and default are in `prefs/<area>/<file>.yaml`.
- [ ] Pref appears in `docs/prefs-inventory.md`.
- [ ] Off-path is tested first, on a fresh profile.
- [ ] On-path is tested on a fresh profile, and after a restart.
- [ ] No network call exists on the off-path (capture attached).
- [ ] Test in `src/zen/tests/` covers both paths, or the PR says why not.
- [ ] Turning the pref off after use leaves no broken state (e.g. hidden tabs
      still reachable, orphan notes, stuck split view).
