// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/**
 * Arc Import — import Spaces, Profiles, Tabs from Arc Browser.
 *
 * Reads Arc's StorableSidebar.json from the user's Arc profile directory and
 * imports spaces, pinned tabs, folders and favorites into Zen as workspaces
 * and essentials. Each Arc profile gets its own container for cookie isolation.
 *
 * Pref-gated behind `zen.migration.arc-import.enabled` (default false).
 */
import { XPCOMUtils } from "resource://gre/modules/XPCOMUtils.sys.mjs";
import { OS } from "resource://gre/modules/osfile.sys.mjs";
import { Services } from "resource://gre/modules/Services.sys.mjs";

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  ZenMigrationUtils: "resource:///modules/zen/ZenMigrationUtils.sys.mjs",
  ArcProfileMigrator: "resource:///modules/zen/ZenProfileMigrators.sys.mjs",
  IOUtils: "resource://gre/modules/IOUtils.sys.mjs",
});

const PREF_ENABLED = "zen.migration.arc-import.enabled";
const PREF_LAST_IMPORTED = "zen.migration.arc-import.last-imported";
const SIDEBAR_FILENAME = "StorableSidebar.json";

const kArcBrandImage = "chrome://browser/content/zen-images/migration/arc.png";

export class nsZenArcImport {
  constructor() {
    this._enabled = false;
  }

  async init() {
    try {
      this._enabled = Services.prefs.getBoolPref(PREF_ENABLED, false);
    } catch (e) {
      this._enabled = false;
    }
    Services.prefs.addObserver(PREF_ENABLED, this);
  }

  observe(subject, topic, data) {
    if (topic !== "nsPref:changed" || data !== PREF_ENABLED) {
      return;
    }
    this._enabled = subject.getBoolPref(PREF_ENABLED, false);
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Import from Arc. Finds Arc's profile directory, reads StorableSidebar.json,
   * and imports spaces, pinned tabs, folders and favorites.
   *
   * @param {Window} win - The browser window to import into
   * @returns {Promise<{success: boolean, spaces: number, favorites: number, error: string|null}>}
   */
  async importFromArc(win) {
    if (!this._enabled) {
      return { success: false, spaces: 0, favorites: 0, error: "Feature disabled" };
    }

    try {
      // Find Arc's StorableSidebar.json using the ArcProfileMigrator's path logic
      const migrator = new lazy.ArcProfileMigrator();
      const sidebarPath = await migrator._getSidebarPath();

      if (!sidebarPath) {
        return { success: false, spaces: 0, favorites: 0, error: "Arc profile not found" };
      }

      if (!(await IOUtils.exists(sidebarPath))) {
        return { success: false, spaces: 0, favorites: 0, error: "Arc sidebar data not found" };
      }

      const sidebar = await IOUtils.readJSON(sidebarPath);
      const plan = lazy.ZenMigrationUtils.parseArcSidebar(sidebar);

      if (!plan.spaces.length && !plan.favorites.length) {
        return { success: false, spaces: 0, favorites: 0, error: "No Arc spaces or favorites found" };
      }

      // Import into the current window
      const count = await lazy.ZenMigrationUtils.applyArcSidebar(plan, win);

      // Record last import time
      try {
        Services.prefs.setIntPref(PREF_LAST_IMPORTED, Date.now());
      } catch (e) {
        // ignore
      }

      // Notify UI
      Services.obs.notifyObservers(null, "zen-arc-import-completed", null);

      return {
        success: true,
        spaces: count,
        favorites: plan.favorites.length,
        error: null,
      };
    } catch (e) {
      console.error("[nsZenArcImport] import failed", e);
      return { success: false, spaces: 0, favorites: 0, error: e.message };
    }
  }

  /**
   * Check if Arc is installed and has importable data.
   *
   * @returns {Promise<boolean>}
   */
  async isArcAvailable() {
    try {
      const migrator = new lazy.ArcProfileMigrator();
      const sidebarPath = await migrator._getSidebarPath();
      if (!sidebarPath) {
        return false;
      }
      return await IOUtils.exists(sidebarPath);
    } catch (e) {
      return false;
    }
  }
}

export const ZenArcImport = new nsZenArcImport();

// Initialize on DOM ready
document.addEventListener(
  "DOMContentLoaded",
  () => {
    ZenArcImport.init();
  },
  { once: true }
);
