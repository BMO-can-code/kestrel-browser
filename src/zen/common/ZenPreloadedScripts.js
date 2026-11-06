// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

// prettier-ignore
// eslint-disable-next-line no-lone-blocks
{
  ChromeUtils.defineESModuleGetters(this, {
    gZenSpaceRoutingManager:
      "resource:///modules/zen/spacerouting/ZenSpaceRoutingManager.sys.mjs",
  });

  Services.scriptloader.loadSubScript("chrome://browser/content/zen-components/ZenSpaceBookmarksStorage.js", this);

  let scripts = [
    "chrome://browser/content/ZenStartup.mjs",
    "resource:///modules/zen/ZenSpaceManager.mjs",
    "chrome://browser/content/zen-components/ZenCompactMode.mjs",
    "chrome://browser/content/ZenUIManager.mjs",
    "resource:///modules/zen/ZenVerticalTabsManager.mjs",
    "chrome://browser/content/zen-components/ZenMods.mjs",
    "chrome://browser/content/zen-components/ZenSessionStore.mjs",
    "chrome://browser/content/zen-components/ZenGlanceManager.mjs",
    "chrome://browser/content/zen-components/ZenPinnedTabManager.mjs",
    "resource:///modules/zen/ZenTabRenamer.mjs",
    "chrome://browser/content/zen-components/ZenViewSplitter.mjs",
    "chrome://browser/content/zen-components/ZenFolders.mjs",
    "chrome://browser/content/zen-components/ZenEmojiPicker.mjs",
    "chrome://browser/content/zen-components/ZenDownloadAnimation.mjs",
    "resource:///modules/zen/share/ZenShareManager.mjs",
    "chrome://browser/content/zen-components/ZenCommandBar.mjs",
    "chrome://browser/content/zen-components/ZenTabArchive.mjs",
    "chrome://browser/content/zen-components/ZenLittleArc.mjs",
    "chrome://browser/content/zen-components/ZenEasels.mjs",
    "chrome://browser/content/zen-components/ZenTabNotes.mjs",
    "chrome://browser/content/zen-components/ZenVideoPreview.mjs",
    "chrome://browser/content/zen-components/ZenArcImport.mjs",
  ];

  for (let script of scripts) {
    ChromeUtils.importESModule(script, { global: "current" });
  }

  // Sync native hover preview pref with Zen's pref
  const HZEN_PREFS = "zen.tabs.hover-previews";
  const HZEN_DELAY = "zen.tabs.hover-preview-delay";
  const NATIVE_PREFS = "browser.tabs.hoverPreview.enabled";
  const NATIVE_DELAY = "browser.tabs.hoverPreview.delay";
  function _syncHoverPreview() {
    try {
      const enabled = Services.prefs.getBoolPref(HZEN_PREFS, false);
      Services.prefs.setBoolPref(NATIVE_PREFS, enabled);
    } catch (e) {
      // ignore
    }
    try {
      const delay = Services.prefs.getIntPref(HZEN_DELAY, 300);
      Services.prefs.setIntPref(NATIVE_DELAY, delay);
    } catch (e) {
      // ignore
    }
  }
  _syncHoverPreview();
  Services.prefs.addObserver(HZEN_PREFS, {
    observe() { _syncHoverPreview(); }
  });
  Services.prefs.addObserver(HZEN_DELAY, {
    observe() { _syncHoverPreview(); }
  });

  // Sync native tab notes pref with Zen's pref
  const NOTES_ZEN = "zen.notes.tab";
  const NOTES_NATIVE = "browser.tabs.notes.enabled";
  function _syncTabNotes() {
    try {
      const enabled = Services.prefs.getBoolPref(NOTES_ZEN, false);
      Services.prefs.setBoolPref(NOTES_NATIVE, enabled);
    } catch (e) {
      // ignore
    }
  }
  _syncTabNotes();
  Services.prefs.addObserver(NOTES_ZEN, {
    observe() { _syncTabNotes(); }
  });

  // Sync visible-focus pref to document attribute for CSS focus indicators
  const VIS_FOCUS_ZEN = "zen.a11y.visible-focus";
  function _syncVisibleFocus() {
    try {
      const enabled = Services.prefs.getBoolPref(VIS_FOCUS_ZEN, true);
      document.documentElement.setAttribute(
        "zen-a11y-visible-focus",
        enabled ? "true" : "false"
      );
    } catch (e) {
      // ignore
    }
  }
  _syncVisibleFocus();
  Services.prefs.addObserver(VIS_FOCUS_ZEN, {
    observe() { _syncVisibleFocus(); }
  });

  let customZenElements = [
    ["zen-folder", "chrome://browser/content/zen-components/ZenFolder.mjs"],
    ["zen-workspace-creation", "resource:///modules/zen/ZenSpaceCreation.mjs"],
    ["zen-workspace", "resource:///modules/zen/ZenSpace.mjs"],
    ["zen-workspace-icons", "resource:///modules/zen/ZenSpaceIcons.mjs"],
    ["zen-zap-bar", "chrome://browser/content/zen-components/ZenZapBar.mjs"]
  ];

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      // Only sync-import widgets once the document has loaded. If a widget is
      // used before DOMContentLoaded it will be imported and upgraded when
      // registering the customElements.setElementCreationCallback().
      for (let [tag, script] of customZenElements) {
        customElements.setElementCreationCallback(
          tag,
          function customElementCreationCallback() {
            ChromeUtils.importESModule(script, { global: "current" });
          }
        );
      }
    },
    { once: true }
  );

  Services.scriptloader.loadSubScript("chrome://browser/content/zen-components/ZenDragAndDrop.js", this);
}
