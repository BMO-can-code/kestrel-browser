// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/**
 * ZenTabNotes — wrapper around Firefox's native TabNotes store.
 *
 * Provides per-URL notes (stored in the native TabNotes SQLite table) with
 * a sidebar toggle action. Pref-gated behind `zen.notes.tab` (default false),
 * which syncs to `browser.tabs.notes.enabled`.
 */
const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  TabNotes: "moz-src:///browser/components/tabnotes/TabNotes.sys.mjs",
  TabNotesUI: "moz-src:///browser/components/tabnotes/TabNotesUI.sys.mjs",
});

export class nsZenTabNotes {
  constructor() {
    this._enabled = false;
    this._sidebarVisible = false;
  }

  init() {
    try {
      this._enabled = Services.prefs.getBoolPref("zen.notes.tab", false);
    } catch (e) {
      this._enabled = false;
    }
    Services.prefs.addObserver("zen.notes.tab", this);
  }

  observe(subject, topic, data) {
    if (topic !== "nsPref:changed" || data !== "zen.notes.tab") {
      return;
    }
    this._enabled = subject.getBoolPref("zen.notes.tab", false);
  }

  toggleSidebar() {
    if (!this._enabled) {
      return;
    }
    // Toggle the native TabNotes UI
    const tabNotesUI = lazy.TabNotesUI;
    if (tabNotesUI && tabNotesUI.toggle) {
      tabNotesUI.toggle();
    } else {
      // Fallback: open the native notes UI via command
      const command = document.getElementById("cmd_tabNotesToggle");
      if (command) {
        command.doCommand();
      }
    }
  }

  /**
   * Get the note for the current tab's URL.
   *
   * @returns {string|null} The note text, or null
   */
  async getNoteForCurrentTab() {
    if (!this._enabled) {
      return null;
    }
    const tab = gBrowser.selectedTab;
    if (!tab || !tab.linkedBrowser) {
      return null;
    }
    const url = tab.linkedBrowser.currentURI;
    try {
      return await lazy.TabNotes.get(url);
    } catch (e) {
      console.error("[nsZenTabNotes] getNoteForCurrentTab failed", e);
      return null;
    }
  }

  /**
   * Set the note for the current tab's URL.
   *
   * @param {string} text - The note text
   */
  async setNoteForCurrentTab(text) {
    if (!this._enabled) {
      return;
    }
    const tab = gBrowser.selectedTab;
    if (!tab || !tab.linkedBrowser) {
      return;
    }
    const url = tab.linkedBrowser.currentURI;
    try {
      await lazy.TabNotes.set(url, text);
    } catch (e) {
      console.error("[nsZenTabNotes] setNoteForCurrentTab failed", e);
    }
  }

  /**
   * Delete the note for the current tab's URL.
   */
  async deleteNoteForCurrentTab() {
    if (!this._enabled) {
      return;
    }
    const tab = gBrowser.selectedTab;
    if (!tab || !tab.linkedBrowser) {
      return;
    }
    const url = tab.linkedBrowser.currentURI;
    try {
      await lazy.TabNotes.delete(url);
    } catch (e) {
      console.error("[nsZenTabNotes] deleteNoteForCurrentTab failed", e);
    }
  }
}

export const ZenTabNotes = new nsZenTabNotes();
