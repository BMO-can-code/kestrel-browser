<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Preferences inventory

M0 snapshot of the default pref surface. Prefs are declared as YAML in
`prefs/**` and merged into the engine's default prefs at build time. A
`condition:` field means the pref is only emitted for matching builds
(`MOZILLA_OFFICIAL`, platform, etc.).

## Totals

| Group | Files | Prefs |
| --- | --- | --- |
| `prefs/zen` | 27 | 189 |
| `prefs/firefox` | 9 | 77 |
| `prefs/privatefox` | 2 | 47 |
| `prefs/fastfox` | 1 | 11 |
| **Total** | **39** | **324** |

`prefs/zen` is the surface we own. The other three are overrides of upstream
behaviour; changing them can affect Firefox features unrelated to us.

## Largest Zen pref files

| File | Prefs | Area |
| --- | --- | --- |
| `view.yaml` | 22 | Chrome layout, compact mode, window materials |
| `sync.yaml` | 21 | Firefox Sync engine registration and synced pref list |
| `workspaces.yaml` | 19 | Spaces |
| `zen.yaml` | 17 | App-level, experimental, startup |
| `zen-urlbar.yaml` | 15 | Urlbar and quick actions |
| `theme.yaml` | 14 | Colours, acrylic, radii |
| `compact-mode.yaml` | 13 | Auto-hide timings |
| `split-view.yaml` | 7 | Split view gestures |
| `library.yaml`, `glance.yaml` | 6 each | Library, peek |

## Prefs that are deliberately locked

`locked: true` means the UI cannot change them and user prefs are ignored.
Found in `prefs/zen/mods.yaml` and `prefs/firefox/*.yaml`:

- `sidebar.revamp=false`, `sidebar.verticalTabs=false` — Zen replaces the
  native sidebar, so the native one must stay off.
- `browser.tabs.splitView.enabled=false` — Zen ships its own split view.
- `browser.tabs.hoverPreview.enabled=false` (not locked, but default off).
- `browser.tabs.groups.enabled=false`, `browser.tabs.groups.hoverPreview.enabled=false` (second is locked).
- `browser.tabs.dragDrop.multiselectStacking=false`, `dragToPin.enabled=false`.
- `browser.referrals.enabled=false`, `browser.nova.enabled=false`,
  `pdfjs.enableNova=false`.
- `browser.urlbar.scotchBonnet.enableOverride=false`.
- `zen.injections.match-urls` (official builds only) — site injection target.

**Implication:** a new feature that wants a locked native surface cannot
simply flip the pref; the lock and the Zen replacement must both be dealt with
in the same change.

## Defaults relevant to M1

| Pref | Default | Why it matters |
| --- | --- | --- |
| `zen.workspaces.force-container-workspace` | `false` | Space isolation is opt-in; Arc-like isolation needs `true` or a per-space container |
| `zen.workspaces.continue-where-left-off` | `false` | Restore behaviour after restart |
| `zen.tabs.essentials.max` | see file | Caps the essentials grid |
| `zen.splitView.enable-tab-drop` / `enable-tab-click-split` | `true` | Split creation paths |
| `zen.glance.enabled` | `true` | Peek on by default |
| `zen.library.enabled` | `true` | Library surface |
| `zen.boosts.enabled` | `true` | Per-site CSS |
| `zen.mods.auto-update` | official builds only | Remote code updates |
| `zen.share.base-url` | `https://share.zen-browser.app` | Zen-hosted upload endpoint |
| `zen.window-sync.enabled` | see file | Cross-window state |
| `zen.updates.show-update-notification` | `true` | In-product update banner |
| `zen.mediacontrols.enabled` | `true` | Now-playing integration |
| `zen.urlbar.suggestions.quick-actions` | `true` | Quick actions in urlbar |

## Conventions observed in the tree

- One file per surface, prefixed by the surface (`zen.splitView.*`).
- Boolean feature switches end in `.enabled`; timings carry a unit suffix
  (`-duration`, `-delay`, `-threshold`).
- Debug prefs are conditional on non-official builds (`zen.workspaces.debug`,
  `zen.window-sync.log`).
- Sync registration is explicit: each synced pref has a
  `services.sync.prefs.sync.<pref>` twin.

## Naming decision (open)

The tree uses `zen.*` everywhere: prefs, CSS ids, module paths, l10n ids,
remote endpoints. Renaming the namespace is a mechanical but wide change and
would break every user profile that already has `zen.*` prefs set.

Options are in `docs/decisions/ADR-0003-pref-namespace.md`. Until that ADR is
accepted, new prefs stay under `zen.` so the tree remains internally
consistent.

## Appendix: all 189 Zen pref names

```text
browser.migrate.content-modal.import-all.enabled
browser.migrate.dia.enabled
browser.sessionstore.max_windows_undo
browser.urlbar.shortcuts.workspaces
media.eme.enabled
services.sync.engine.spaces
services.sync.prefs.sync.browser.urlbar.shortcuts.workspaces
services.sync.prefs.sync.zen.ctrlTab.show-pending-tabs
services.sync.prefs.sync.zen.glance.enable-contextmenu-search
services.sync.prefs.sync.zen.glance.open-essential-external-links
services.sync.prefs.sync.zen.share.display-name
services.sync.prefs.sync.zen.spaces-sync.normal-tabs
services.sync.prefs.sync.zen.tabs.close-on-back-with-no-history
services.sync.prefs.sync.zen.tabs.ctrl-tab.ignore-essential-tabs
services.sync.prefs.sync.zen.tabs.ctrl-tab.ignore-pending-tabs
services.sync.prefs.sync.zen.tabs.show-newtab-vertical
services.sync.prefs.sync.zen.urlbar.behavior
services.sync.prefs.sync.zen.urlbar.suggestions.quick-actions
services.sync.prefs.sync.zen.view.drag-window-from-content
services.sync.prefs.sync.zen.view.enable-loading-indicator
services.sync.prefs.sync.zen.view.show-clear-tabs-button
services.sync.prefs.sync.zen.view.show-newtab-button-top
services.sync.prefs.sync.zen.view.show-scroll-to-selected-tab
services.sync.prefs.sync.zen.workspaces.separate-essentials
services.sync.prefs.sync.zen.workspaces.wrap-around-navigation
widget.gtk.rounded-bottom-corners.enabled
widget.macos.native-popovers
widget.windows.mica
widget.windows.mica.toplevel-backdrop
zen.boosts.custom-fonts
zen.boosts.disable-on-anonymous-content
zen.boosts.dissolve-on-zap
zen.boosts.enabled
zen.boosts.invert-channel-floor
zen.containers.create-default-identities
zen.ctrlTab.show-pending-tabs
zen.downloads.download-animation
zen.downloads.download-animation-duration
zen.downloads.icon-popup-position
zen.folders.max-subfolders
zen.folders.owned-tabs-in-folder
zen.folders.search.enabled
zen.folders.search.hover-delay
zen.glance.activation-method
zen.glance.animation-duration
zen.glance.deactivate-docshell-during-animation
zen.glance.enable-contextmenu-search
zen.glance.enabled
zen.glance.open-essential-external-links
zen.haptic-feedback.enabled
zen.injections.match-urls
zen.library.enabled
zen.library.hidden-tabs
zen.library.history.closed-tabs
zen.library.last-tab
zen.library.media.enabled
zen.library.media.folders
zen.live-folders.github.skip-new-pr-ui-check
zen.mediacontrols.enabled
zen.migration.bookmarks-as-pinned-folders
zen.migration.bookmarks-as-pinned-folders.max-tabs
zen.mods.auto-update
zen.mods.auto-update-days
zen.mods.updated-value-observer
zen.pinned-tab-manager.close-shortcut-behavior
zen.pinned-tab-manager.debug
zen.pinned-tab-manager.restore-pinned-tabs-to-pinned-url
zen.pinned-tab-manager.wheel-close-if-pending
zen.session-store.backup-file
zen.session-store.log
zen.session-store.restore-unsynced-windows
zen.share.base-url
zen.share.display-name
zen.share.dont-ask-before-sharing
zen.share.secret-key
zen.spaces-sync.debug
zen.spaces-sync.normal-tabs
zen.splitView.drag-over-split-delayMC
zen.splitView.drag-over-split-threshold
zen.splitView.enable-drag-over-split
zen.splitView.enable-tab-click-split
zen.splitView.enable-tab-drop
zen.splitView.min-resize-width
zen.splitView.rearrange-hover-size
zen.startup.smooth-scroll-in-tabs
zen.tabs.close-on-back-with-no-history
zen.tabs.close-window-with-empty
zen.tabs.ctrl-tab.ignore-essential-tabs
zen.tabs.ctrl-tab.ignore-pending-tabs
zen.tabs.dnd-switch-space-delay
zen.tabs.essentials.max
zen.tabs.folder-dragover-threshold-percent
zen.tabs.open-pinned-in-new-tab
zen.tabs.rename-tabs
zen.tabs.select-recently-used-on-close
zen.tabs.show-newtab-vertical
zen.tabs.vertical
zen.tabs.vertical.right-side
zen.theme.accent-color
zen.theme.acrylic-sidebar
zen.theme.acrylic-urlbar
zen.theme.border-radius
zen.theme.content-element-separation
zen.theme.dark-mode-bias
zen.theme.disable-lightweight
zen.theme.essentials-favicon-bg
zen.theme.gradient.show-custom-colors
zen.theme.hide-tab-throbber
zen.theme.hide-unified-extensions-button
zen.theme.styled-status-panel
zen.theme.use-system-colors
zen.updates.show-update-notification
zen.urlbar.behavior
zen.urlbar.enable-overrides
zen.urlbar.hide-one-offs
zen.urlbar.open-on-startup
zen.urlbar.replace-newtab
zen.urlbar.show-contextual-id
zen.urlbar.show-domain-only-in-sidebar
zen.urlbar.show-pinned
zen.urlbar.show-pip-button
zen.urlbar.show-protections-icon
zen.urlbar.show-sponsored
zen.urlbar.single-toolbar-show-copy-url
zen.urlbar.suggestions.quick-actions
zen.urlbar.wait-to-clear
zen.view.borderless-fullscreen
zen.view.compact.animate-sidebar
zen.view.compact.debug
zen.view.compact.enable-at-startup
zen.view.compact.hide-tabbar
zen.view.compact.hide-toolbar
zen.view.compact.outside-window-edge-offset.horizontal
zen.view.compact.outside-window-edge-offset.vertical
zen.view.compact.show-background-tab-toast
zen.view.compact.show-sidebar-and-toolbar-on-hover
zen.view.compact.sidebar-keep-hover.duration
zen.view.compact.toolbar-flash-popup
zen.view.compact.toolbar-flash-popup.duration
zen.view.compact.toolbar-hide-after-hover.duration
zen.view.context-menu.refresh
zen.view.drag-window-from-content
zen.view.drag-window-from-content.height-percentage
zen.view.draggable-sidebar
zen.view.enable-loading-indicator
zen.view.experimental-force-window-controls-left
zen.view.experimental-no-window-controls
zen.view.grey-out-inactive-windows
zen.view.hide-window-controls
zen.view.mac.show-three-dot-menu
zen.view.overflow-webext-toolbar
zen.view.overflow-webext-toolbar-threshold
zen.view.shift-down-site-on-hover
zen.view.show-clear-tabs-button
zen.view.show-newtab-button-top
zen.view.show-scroll-to-selected-tab
zen.view.sidebar-expanded
zen.view.sidebar-expanded.max-width
zen.view.use-single-toolbar
zen.view.window.scheme
zen.watermark.enabled
zen.welcome-screen.seen
zen.widget.linux.transparency
zen.widget.mac.mono-window-controls
zen.widget.macos.override-system-swipe-gestures
zen.widget.macos.window-material
zen.widget.macos.window-vibrancy
zen.window-sync.enabled
zen.window-sync.log
zen.window-sync.open-link-in-new-unsynced-window
zen.window-sync.prefer-unsynced-windows
zen.window-sync.sync-only-pinned-tabs
zen.workspaces.continue-where-left-off
zen.workspaces.debug
zen.workspaces.dnd-switch-padding
zen.workspaces.force-container-workspace
zen.workspaces.hide-default-container-indicator
zen.workspaces.natural-scroll
zen.workspaces.open-new-tab-if-last-unpinned-tab-is-closed
zen.workspaces.scroll-modifier-key
zen.workspaces.separate-essentials
zen.workspaces.swipe-actions
zen.workspaces.swipe-actions.delta-multiplier
zen.workspaces.swipe-actions.edge-actions
zen.workspaces.switch-animation-duration
zen.workspaces.wrap-around-navigation
```
