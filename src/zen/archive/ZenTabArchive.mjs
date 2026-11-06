// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/**
 * Tab Archive — auto-archive tabs instead of closing them.
 *
 * Archiving captures the full tab state (URL, title, back/forward stack,
 * scroll position, zoom, user context / container) via SessionStore, removes
 * the tab from the UI, and persists it to disk for crash safety. Archived
 * tabs can be restored losslessly, with a one-key undo for the most recent
 * archive.
 *
 * Pref-gated behind `zen.tabs.archive.enabled` (default false). Auto-archive
 * is a separate opt-in (`zen.tabs.archive.auto`, default false) with a
 * configurable idle window (`zen.tabs.archive.idle-hours`, default 12).
 *
 * Crash safety: archive state is written to disk on every change via
 * `JSONFile`. On startup, the archive is restored from disk.
 */
import { JSONFile } from "resource://gre/modules/JSONFile.sys.mjs";
import { XPCOMUtils } from "resource://gre/modules/XPCOMUtils.sys.mjs";
import { DeferredTask } from "resource://gre/modules/DeferredTask.sys.mjs";

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  SessionStore:
    "moz-src:///browser/components/sessionstore/SessionStore.sys.mjs",
});

const ARCHIVE_FILE = "zen-tab-archive.json";
const MAX_ITEMS_PREF = "zen.tabs.archive.max-items";
const ENABLED_PREF = "zen.tabs.archive.enabled";
const AUTO_PREF = "zen.tabs.archive.auto";
const IDLE_HOURS_PREF = "zen.tabs.archive.idle-hours";

const IDLE_CHECK_MS = 60 * 1000;
const UNDO_WINDOW_MS = 5 * 60 * 1000;

function generateUuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class nsZenTabArchive {
  #enabled = false;
  #autoEnabled = false;
  #idleHours = 12;
  #maxItems = 500;
  #file = null;
  #items = [];
  #undoStack = [];
  #idleTimer = null;
  #saveTask = new DeferredTask(() => this.#persist());
  #idleStart = null;
  #tabCloseListener = null;
  #windowFocusListener = null;
  #windowBlurListener = null;
  #window = null;

  constructor() {
    this.#tabCloseListener = this._onTabClose.bind(this);
    this.#windowFocusListener = this.#onWindowFocus.bind(this);
    this.#windowBlurListener = this.#onWindowBlur.bind(this);
  }

  async init() {
    try {
      this.#enabled = Services.prefs.getBoolPref(ENABLED_PREF, false);
    } catch (e) {
      this.#enabled = false;
    }
    if (!this.#enabled) {
      return;
    }

    try {
      this.#autoEnabled = Services.prefs.getBoolPref(AUTO_PREF, false);
    } catch (e) {
      this.#autoEnabled = false;
    }
    try {
      this.#idleHours = Services.prefs.getIntPref(IDLE_HOURS_PREF, 12);
    } catch (e) {
      this.#idleHours = 12;
    }
    try {
      this.#maxItems = Services.prefs.getIntPref(MAX_ITEMS_PREF, 500);
    } catch (e) {
      this.#maxItems = 500;
    }

    Services.prefs.addObserver(ENABLED_PREF, this);
    Services.prefs.addObserver(AUTO_PREF, this);
    Services.prefs.addObserver(IDLE_HOURS_PREF, this);
    Services.prefs.addObserver(MAX_ITEMS_PREF, this);

    this.#window = Services.wm.getMostRecentWindow("navigator:browser");
    if (this.#window) {
      this.#window.addEventListener("TabClose", this.#tabCloseListener);
    }

    window.addEventListener("focus", this.#windowFocusListener);
    window.addEventListener("blur", this.#windowBlurListener);

    await this.#load();

    if (this.#autoEnabled) {
      this.#startIdleTracking();
    }

    console.log("[nsZenTabArchive] initialized", {
      enabled: this.#enabled,
      auto: this.#autoEnabled,
      idleHours: this.#idleHours,
      items: this.#items.length,
    });
  }

  observe(subject, topic, data) {
    if (topic !== "nsPref:changed") {
      return;
    }
    if (data === ENABLED_PREF) {
      this.#enabled = subject.getBoolPref(ENABLED_PREF);
    } else if (data === AUTO_PREF) {
      this.#autoEnabled = subject.getBoolPref(AUTO_PREF);
      if (this.#autoEnabled) {
        this.#startIdleTracking();
      } else {
        this.#stopIdleTracking();
      }
    } else if (data === IDLE_HOURS_PREF) {
      this.#idleHours = subject.getIntPref(IDLE_HOURS_PREF, 12);
    } else if (data === MAX_ITEMS_PREF) {
      this.#maxItems = subject.getIntPref(MAX_ITEMS_PREF, 500);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                         */
  /* ------------------------------------------------------------------ */

  async archiveTab(tab) {
    if (!this.#enabled || !tab || tab.hasAttribute("zen-empty-tab")) {
      return null;
    }

    const win = tab.ownerDocument.defaultView;
    if (!win || !win.gBrowser) {
      return null;
    }

    try {
      const tabState = lazy.SessionStore.getTabState(tab);
      if (!tabState) {
        console.error("[nsZenTabArchive] failed to capture tab state");
        return null;
      }

      const entry = {
        id: generateUuidv4(),
        timestamp: Date.now(),
        windowId: win.id,
        tabState,
        title: tabState.title || tabState.url || "",
        url: tabState.url || "",
        favicon: tabState.image || "",
        userContextId: tab.userContextId || 0,
        spaceId: tab.getAttribute("zen-workspace-id") || null,
        isPinned: tab.pinned === true,
      };

      win.gBrowser.removeTab(tab);

      this.#items.unshift(entry);
      if (this.#items.length > this.#maxItems) {
        this.#items.length = this.#maxItems;
      }

      this.#undoStack.push({
        entryId: entry.id,
        archivedAt: entry.timestamp,
        expireAt: entry.timestamp + UNDO_WINDOW_MS,
      });
      this.#pruneUndoStack();

      await this.#persist();

      Services.obs.notifyObservers(null, "zen-tab-archive-changed", null);

      console.log("[nsZenTabArchive] archived tab", {
        id: entry.id,
        url: entry.url,
      });
      return entry;
    } catch (e) {
      console.error("[nsZenTabArchive] archiveTab failed", e);
      return null;
    }
  }

  async restoreTab(entryId, options = {}) {
    if (!this.#enabled) {
      return null;
    }

    const index = this.#items.findIndex(item => item.id === entryId);
    if (index === -1) {
      console.error("[nsZenTabArchive] entry not found", entryId);
      return null;
    }

    const entry = this.#items[index];
    const win =
      options.window ||
      Services.wm.getMostRecentWindow("navigator:browser");
    if (!win || !win.gBrowser) {
      return null;
    }

    try {
      const tabState = structuredClone(entry.tabState);
      const tab = lazy.SessionStore.restoreTab(tabState, {
        window: win,
        insertBefore: options.insertBefore,
        pinned: options.pinned ?? entry.isPinned,
        userContextId: entry.userContextId,
        triggerToOpener: "triggerTab",
      });

      if (entry.spaceId && win.gZenWorkspaces) {
        const workspace = win.gZenWorkspaces.getWorkspace(entry.spaceId);
        if (workspace) {
          tab.setAttribute("zen-workspace-id", entry.spaceId);
          win.gZenWorkspaces.moveTabToSpace(tab, workspace);
        }
      }

      this.#items.splice(index, 1);
      this.#removeFromUndoStack(entryId);
      await this.#persist();

      Services.obs.notifyObservers(null, "zen-tab-archive-changed", null);

      console.log("[nsZenTabArchive] restored tab", { id: entryId, url: entry.url });
      return tab;
    } catch (e) {
      console.error("[nsZenTabArchive] restoreTab failed", e);
      return null;
    }
  }

  async undoLastArchive() {
    if (!this.#enabled || this.#undoStack.length === 0) {
      return null;
    }

    this.#pruneUndoStack();
    if (this.#undoStack.length === 0) {
      return null;
    }

    const undoEntry = this.#undoStack.pop();
    return this.restoreTab(undoEntry.entryId);
  }

  getEntries() {
    return this.#items.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      favicon: item.favicon,
      timestamp: item.timestamp,
      userContextId: item.userContextId,
      spaceId: item.spaceId,
      isPinned: item.isPinned,
    }));
  }

  getEntry(entryId) {
    return this.#items.find(item => item.id === entryId) ?? null;
  }

  deleteEntry(entryId) {
    const index = this.#items.findIndex(item => item.id === entryId);
    if (index === -1) {
      return false;
    }
    this.#items.splice(index, 1);
    this.#removeFromUndoStack(entryId);
    this.#saveTask.schedule(200);
    Services.obs.notifyObservers(null, "zen-tab-archive-changed", null);
    return true;
  }

  clear() {
    this.#items = [];
    this.#undoStack = [];
    this.#saveTask.schedule(200);
    Services.obs.notifyObservers(null, "zen-tab-archive-changed", null);
  }

  shouldAutoArchive(tab) {
    if (!this.#autoEnabled || !this.#enabled) {
      return false;
    }
    if (!this.#idleStart) {
      return false;
    }
    const idleMs = Date.now() - this.#idleStart;
    const idleHours = idleMs / (1000 * 60 * 60);
    return idleHours >= this.#idleHours;
  }

  /* ------------------------------------------------------------------ */
  /* Event handlers                                                     */
  /* ------------------------------------------------------------------ */

  _onTabClose(event) {
    const tab = event.target;
    if (!tab || tab.hasAttribute("zen-empty-tab")) {
      return;
    }
    if (this.#autoEnabled) {
      this.#idleStart = null;
    }
  }

  #onWindowFocus() {
    if (this.#autoEnabled) {
      this.#idleStart = null;
    }
  }

  #onWindowBlur() {
    if (this.#autoEnabled && !this.#idleStart) {
      this.#idleStart = Date.now();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Idle tracking (auto-archive)                                       */
  /* ------------------------------------------------------------------ */

  #startIdleTracking() {
    this.#stopIdleTracking();
    this.#idleStart = Date.now();
    this.#idleTimer = setInterval(() => this.#checkIdle(), IDLE_CHECK_MS);
  }

  #stopIdleTracking() {
    if (this.#idleTimer) {
      clearInterval(this.#idleTimer);
      this.#idleTimer = null;
    }
    this.#idleStart = null;
  }

  #checkIdle() {
    if (!this.#autoEnabled || !this.#enabled || !this.#idleStart) {
      return;
    }
    const idleMs = Date.now() - this.#idleStart;
    const idleHours = idleMs / (1000 * 60 * 60);
    if (idleHours >= this.#idleHours) {
      this.#autoArchiveIdleTabs();
    }
  }

  async #autoArchiveIdleTabs() {
    const win = Services.wm.getMostRecentWindow("navigator:browser");
    if (!win || !win.gBrowser) {
      return;
    }

    const tabs = Array.from(win.gBrowser.tabs).filter(
      tab => !tab.hasAttribute("zen-empty-tab") && !tab.pinned
    );

    tabs.sort((a, b) => {
      const aTime = a._lastAccessed || 0;
      const bTime = b._lastAccessed || 0;
      return aTime - bTime;
    });

    for (const tab of tabs) {
      if (!this.shouldAutoArchive(tab)) {
        break;
      }
      await this.archiveTab(tab);
      this.#idleStart = Date.now();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Persistence                                                        */
  /* ------------------------------------------------------------------ */

  async #load() {
    const file = Services.dirsvc.get("ProfD", Ci.nsIFile);
    file.append(ARCHIVE_FILE);
    this.#file = new JSONFile(file);

    try {
      const data = this.#file.read();
      if (data && Array.isArray(data.items)) {
        this.#items = data.items;
        const now = Date.now();
        this.#undoStack = this.#items
          .slice(0, 10)
          .filter(item => now - item.timestamp < UNDO_WINDOW_MS)
          .map(item => ({
            entryId: item.id,
            archivedAt: item.timestamp,
            expireAt: item.timestamp + UNDO_WINDOW_MS,
          }));
      }
    } catch (e) {
      console.log("[nsZenTabArchive] no existing archive file", e);
      this.#items = [];
    }
  }

  #persist() {
    if (!this.#file) {
      return;
    }
    this.#file.write({ items: this.#items });
  }

  #pruneUndoStack() {
    const now = Date.now();
    this.#undoStack = this.#undoStack.filter(
      u => now < u.expireAt && this.#items.some(i => i.id === u.entryId)
    );
  }

  #removeFromUndoStack(entryId) {
    this.#undoStack = this.#undoStack.filter(u => u.entryId !== entryId);
  }
}

export const ZenTabArchive = new nsZenTabArchive();

document.addEventListener(
  "DOMContentLoaded",
  () => {
    ZenTabArchive.init();
  },
  { once: true }
);
