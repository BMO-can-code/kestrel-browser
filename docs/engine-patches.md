<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Engine patches

The fork is a Firefox source tree plus 272 patch files under `src/`. This
document is the register: what exists, where it concentrates, and the rules a
new patch must follow. M0 added **no** patches; the log at the end is empty and
must stay accurate as M1 starts adding them.

## 1. Mechanism

```
src/<path>/<file>.patch   →   git apply --ignore-space-change   →   engine/<path>/<file>
```

- `surfer import` collects `src/**/*.patch`, ordered by path, and applies each
  with `git apply`. A failure aborts the whole import.
- `surfer export` reverses the direction: it diffs `engine/` against the
  vendored Firefox tag and writes updated patches.
- `surfer build` refuses to run if the patch set is not applied
  (`patchCheck`), unless `--skip-patch-check` is passed.
- `engine/` is untracked and disposable. Re-running `download` + `import`
  reproduces it from `src/`.

Verified at the M0 commit: **272/272 patches apply cleanly** on Firefox 159.0
(macOS arm64 host, Node 26, with the branding step skipped — see §6).

## 2. Distribution

272 patches, 15,296 lines. By top-level area:

| Area | Patches | What it changes |
| --- | --- | --- |
| `browser/` | 121 | Window XUL, tab strip, urlbar, session store, preferences, installer, themes |
| `toolkit/` | 40 | Widgets, popups, add-on manager, updater, profile service |
| `layout/` | 32 | SVG, painting, generic layout fixes for the Zen shell |
| `widget/` | 15 | macOS vibrancy/materials, scrollbars, swipe tracker, theme |
| `dom/` | 14 | Base, media controls, WebRTC/EME actors |
| `external-patches/` | 8 | Third-party source fixes (Firefox upstream cherry-picks) |
| `tools/`, `testing/`, `servo/`, `gfx/`, `build/` | 21 | Build, lint, test and graphics adjustments |
| `modules/`, `docshell/`, `devtools/`, `accessible/`, others | 17 | Small targeted fixes |
| Root-level lint configs | 4 | `.prettierignore`, `.stylelintrc.js`, eslint globs |

Concentrations worth knowing:

| Directory | Patches | Why it matters to M1 |
| --- | --- | --- |
| `browser/base/content` | 19 | Window XUL, keysets, commands, context menus — where new UI hooks land |
| `layout/style` | 9 | CSS engine changes; risky, keep untouched |
| `widget` + `widget/cocoa` | 14 | macOS window materials and gestures — the "native feel" layer |
| `browser/components/sessionstore` | 7 | Sidebar state, folders, split view persistence — any new persisted state touches this |
| `browser/components/tabbrowser` (+ `/content`) | 10 | Tab strip, vertical tabs, drag/drop, pinned tabs, `zen*` helpers |
| `browser/components/urlbar` (+ `/content`) | 12 | Quick actions, styling, behaviour |
| `browser/components/preferences` | 6 | Zen settings panes |
| `toolkit/content/widgets`, `toolkit/modules` | 14 | Shared widgets and modules |
| `browser/installer/windows/nsis` | 4 | Uninstaller survey URL, file handlers |

## 3. Rules for new patches

1. **Front-end first.** If `src/zen/` can do it with `gBrowser`,
   `CustomizableUI`, `SessionStore`, `PlacesUtils`, `ContextualIdentityService`
   or a urlbar provider, do not patch the engine.
2. **Small and commented.** A patch should be reviewable on its own. Every hunk
   gets a comment that says why it exists and which Zen pref gates it.
3. **Pref-gated.** Engine changes must be inert when the owning pref is
   `false`. No unconditional behaviour changes.
4. **Registered.** Add a row to §5 in the same commit. A patch that is not in
   the register is a defect.
5. **No drive-by formatting.** Reformatting makes upstream syncs unresolvable.
6. **Licence headers.** Never remove or alter an MPL-2.0 header. New files get
   the standard header.
7. **Test.** If the change is observable from chrome, add or extend a test in
   `src/zen/tests/` where possible; if it must be engine-level, note the
   upstream test suite that covers it.

## 4. Areas to avoid

| Area | Reason |
| --- | --- |
| `layout/**` | Deep rendering changes with no test coverage in this repo; high upstream-conflict cost |
| `js/src/**` | None of our features need it |
| `netwerk/**` | Network stack; rebranding and features do not require it |
| `toolkit/components/telemetry/**` | We keep telemetry off via prefs; patching it increases merge cost for no gain |
| `browser/components/sessionstore/**` | Already heavily patched; add fields via existing Zen session modules instead of new hunks where possible |

## 5. Patch register

M0 additions: none.

Template for the first M1 entries:

| Patch | Purpose | Pref gate | Upstream risk | Test |
| --- | --- | --- | --- | --- |
| *(none yet)* | | | | |

## 6. Reproducing the import

```sh
npm run download                     # fetch + extract Firefox 159.0
PATH="$HOME/.cargo/bin:$PATH" npm run ffprefs   # generate pref includes
npm run import:dumps                 # update search/service dumps
SURFER_NO_BRANDING_PATCH=true npm run import    # apply src/**/*.patch
```

Why the branding skip: `surfer`'s branding step calls `async-icns@1.0.2`,
which uses `fs.rmdir(path, { recursive: true })`. Node 22 (the version pinned
by `.nvmrc`, and what CI uses) still accepts it; Node 26 throws:

```text
TypeError [ERR_INVALID_ARG_VALUE]: The property 'options.recursive' is no longer supported. Received true
    at Object.convert (.../node_modules/async-icns/icns.js:108:9)
```

This is a local toolchain mismatch, not a tree defect. M0 did not patch
`node_modules` or change the build system. M1 options: use Node 22 locally, or
fix the dependency under a separate, approved change.

Also note `cargo`: `/usr/local/bin/cargo` on the M0 machine was an i386 binary
and shadowed the arm64 rustup shim, which made `npm run ffprefs` fail with
`sh: /usr/local/bin/cargo: Bad CPU type in executable`. Prepending
`$HOME/.cargo/bin` fixes it. This is environmental, not a repository issue.

## 7. Sync strategy

- Track upstream `dev`; never rewrite published history.
- Sync in small batches; run `surfer import` and the 547 browser tests after
  each batch.
- When an upstream change touches a patched hunk, resolve in `src/`, then
  re-export the patch rather than editing `engine/`.
- Record every conflict resolution in the milestone notes, not in this file.
