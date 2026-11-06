// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/**
 * Little Arc — a chrome-less quick window for fast navigation.
 *
 * Opens via global hotkey (Accel+Shift+Space by default, pref-gated behind
 * `zen.windows.little-arc`, default false). Provides a minimal URL bar and
 * quick actions: open-in-space, split-with-current, archive, pin.
 *
 * Can be registered as the system URL handler for links from other apps.
 */
import { nsZenDOMOperatedFeature } from "chrome://browser/content/zen-components/ZenCommonUtils.mjs";

const PREF_ENABLED = "zen.windows.little-arc";
const PREF_HOTKEY = "zen.windows.little-arc.hotkey";
const WINDOW_URL = "chrome://browser/content/zen-components/windows/little-arc.xhtml";
const HOTKEY_KEY = "Accel+Shift+Space";

let littleArcWindow = null;
let hotkeyRegistered = false;

export class nsZenLittleArc extends nsZenDOMOperatedFeature {
  constructor() {
    super();
    this._enabled = false;
    this._hotkey = HOTKEY_KEY;
    this._keyListener = this._onKey.bind(this);
  }

  init() {
    try {
      this._enabled = Services.prefs.getBoolPref(PREF_ENABLED, false);
    } catch (e) {
      this._enabled = false;
    }
    if (!this._enabled) {
      return;
    }

    try {
      this._hotkey = Services.prefs.getCharPref(PREF_HOTKEY, HOTKEY_KEY);
    } catch (e) {
      this._hotkey = HOTKEY_KEY;
    }

    Services.prefs.addObserver(PREF_ENABLED, this);
    Services.prefs.addObserver(PREF_HOTKEY, this);

    this._registerHotkey();
  }

  observe(subject, topic, data) {
    if (topic !== "nsPref:changed") {
      return;
    }
    if (data === PREF_ENABLED) {
      this._enabled = subject.getBoolPref(PREF_ENABLED);
      this._enabled ? this._registerHotkey() : this._unregisterHotkey();
    } else if (data === PREF_HOTKEY) {
      this._hotkey = subject.getCharPref(PREF_HOTKEY, HOTKEY_KEY);
      this._registerHotkey();
    }
  }

  _registerHotkey() {
    this._unregisterHotkey();
    if (!this._enabled) {
      return;
    }
    window.addEventListener("keydown", this._keyListener, true);
    hotkeyRegistered = true;
  }

  _unregisterHotkey() {
    window.removeEventListener("keydown", this._keyListener, true);
    hotkeyRegistered = false;
  }

  _onKey(event) {
    if (!this._enabled) {
      return;
    }
    // Parse the hotkey: modifiers + key
    const parts = this._hotkey.split("+");
    const key = parts.pop().toLowerCase();
    const requiresMeta = parts.includes("Accel") || parts.includes("Cmd") || parts.includes("Meta");
    const requiresShift = parts.includes("Shift");
    const requiresCtrl = parts.includes("Ctrl");
    const requiresAlt = parts.includes("Alt");

    const isMatch =
      (requiresMeta ? event.metaKey : !event.metaKey) &&
      (requiresShift ? event.shiftKey : !event.shiftKey) &&
      (requiresCtrl ? event.ctrlKey : !event.ctrlKey) &&
      (requiresAlt ? event.altKey : !event.altKey) &&
      event.key.toLowerCase() === key;

    if (isMatch) {
      event.preventDefault();
      event.stopPropagation();
      this.open();
    }
  }

  /**
   * Open the Little Arc window. Reuses an existing window if one is open.
   */
  open() {
    if (littleArcWindow && !littleArcWindow.closed) {
      littleArcWindow.focus();
      return littleArcWindow;
    }

    const features =
      "chrome,dialog=no,alwaysontop,resizable,width=600,height=400,left=100,top=100";
    littleArcWindow = Services.ww.openWindow(
      null,
      WINDOW_URL,
      "ZenLittleArc",
      features,
      null
    );

    littleArcWindow.addEventListener(
      "unload",
      () => {
        littleArcWindow = null;
      },
      { once: true }
    );

    return littleArcWindow;
  }

  /**
   * Close the Little Arc window if open.
   */
  close() {
    if (littleArcWindow && !littleArcWindow.closed) {
      littleArcWindow.close();
    }
  }

  /**
   * Get the open Little Arc window, or null.
   */
  get window() {
    return littleArcWindow;
  }

  /**
   * Handle URL submission from the Little Arc window's URL bar.
   * @param {Window} sourceWindow - The Little Arc window
   * @param {string} url - The URL to open
   */
  async handleUrlSubmit(sourceWindow, url) {
    if (!url) {
      return;
    }

    // Normalize URL
    let uri;
    try {
      uri = Services.io.newURI(url);
    } catch (e) {
      // Try adding https:// prefix
      try {
        uri = Services.io.newURI("https://" + url);
      } catch (e2) {
        console.error("[nsZenLittleArc] invalid URL", url);
        return;
      }
    }

    const urlString = uri.spec;

    // Determine target: use the most recent browser window
    const targetWindow = Services.wm.getMostRecentWindow("navigator:browser");
    if (!targetWindow || !targetWindow.gBrowser) {
      // Fallback: open in Little Arc window itself
      sourceWindow.gBrowser.selectedTab = sourceWindow.gBrowser.addTrustedTab(urlString);
      return;
    }

    // Open in the main browser window (not the Little Arc window)
    targetWindow.focus();
    const tab = targetWindow.gBrowser.addTrustedTab(urlString);
    targetWindow.gBrowser.selectedTab = tab;

    // Optionally close Little Arc after navigation
    this.close();
  }

  /**
   * Open the current Little Arc URL in a specific space.
   * @param {Window} sourceWindow - The Little Arc window
   * @param {string} spaceId - The space UUID
   */
  async openInSpace(sourceWindow, spaceId) {
    const tab = sourceWindow.gBrowser.selectedTab;
    if (!tab || tab.hasAttribute("zen-empty-tab")) {
      return;
    }
    const url = tab.linkedBrowser.currentURI.spec;
    const targetWindow = Services.wm.getMostRecentWindow("navigator:browser");
    if (!targetWindow || !targetWindow.gZenWorkspaces) {
      return;
    }
    const workspace = targetWindow.gZenWorkspaces.getWorkspace(spaceId);
    if (!workspace) {
      return;
    }
    const newTab = targetWindow.gBrowser.addTrustedTab(url);
    newTab.setAttribute("zen-workspace-id", spaceId);
    targetWindow.gZenWorkspaces.moveTabToSpace(newTab, workspace);
    targetWindow.focus();
    this.close();
  }

  /**
   * Open the current Little Arc URL in split view with the current tab.
   * @param {Window} sourceWindow - The Little Arc window
   */
  async splitWithCurrent(sourceWindow) {
    const tab = sourceWindow.gBrowser.selectedTab;
    if (!tab || tab.hasAttribute("zen-empty-tab")) {
      return;
    }
    const url = tab.linkedBrowser.currentURI.spec;
    const targetWindow = Services.wm.getMostRecentWindow("navigator:browser");
    if (!targetWindow || !targetWindow.gBrowser || !targetWindow.gZenViewSplitter) {
      return;
    }
    const currentTab = targetWindow.gBrowser.selectedTab;
    const newTab = targetWindow.gBrowser.addTrustedTab(url);
    targetWindow.gZenViewSplitter.splitTabs([currentTab, newTab], undefined);
    targetWindow.focus();
    this.close();
  }

  /**
   * Archive the current Little Arc tab.
   * @param {Window} sourceWindow - The Little Arc window
   */
  async archiveTab(sourceWindow) {
    const { ZenTabArchive } = ChromeUtils.importESModule(
      "chrome://browser/content/zen-components/ZenTabArchive.mjs",
      { global: "current" }
    );
    const tab = sourceWindow.gBrowser.selectedTab;
    if (!tab || tab.hasAttribute("zen-empty-tab")) {
      return;
    }
    await ZenTabArchive.archiveTab(tab);
    this.close();
  }

  /**
   * Pin the current Little Arc tab.
   * @param {Window} sourceWindow - The Little Arc window
   */
  pinTab(sourceWindow) {
    const tab = sourceWindow.gBrowser.selectedTab;
    if (!tab || tab.hasAttribute("zen-empty-tab")) {
      return;
    }
    if (tab.pinned) {
      sourceWindow.gBrowser.unpinTab(tab);
    } else {
      sourceWindow.gBrowser.pinTab(tab);
    }
  }
}

export const ZenLittleArc = new nsZenLittleArc();

// Initialize on DOM ready
document.addEventListener(
  "DOMContentLoaded",
  () => {
    ZenLittleArc.init();
  },
  { once: true }
);
