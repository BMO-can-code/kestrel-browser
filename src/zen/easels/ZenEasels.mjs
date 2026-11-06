// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/**
 * Easels — freeform canvas per space.
 *
 * Easels are scratchpad canvases that accept dragged tabs, links, text,
 * screenshots, and drawings. Each easel belongs to a space and is stored
 * locally as JSON. Exportable to Markdown.
 *
 * Pref-gated behind `zen.easels.enabled` (default false).
 *
 * Crash safety: easel data is written to disk via JSONFile on every change.
 */
import { JSONFile } from "resource://gre/modules/JSONFile.sys.mjs";
import { XPCOMUtils } from "resource://gre/modules/XPCOMUtils.sys.mjs";
import { DeferredTask } from "resource://gre/modules/DeferredTask.sys.mjs";

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  Services: "resource://gre/modules/Services.sys.mjs",
});

const EASELS_FILE = "zen-easels.json";
const ENABLED_PREF = "zen.easels.enabled";
const MAX_ITEMS_PREF = "zen.easels.max-items";

const MAX_ITEMS_DEFAULT = 100;

class nsZenEasels {
  constructor() {
    this._enabled = false;
    this._maxItems = MAX_ITEMS_DEFAULT;
    this._file = null;
    this._easels = new Map(); // spaceId -> array of easel entries
    this._saveTask = new DeferredTask(() => this.#persist());
  }

  async init() {
    try {
      this._enabled = Services.prefs.getBoolPref(ENABLED_PREF, false);
    } catch (e) {
      this._enabled = false;
    }
    if (!this._enabled) {
      return;
    }

    try {
      this._maxItems = Services.prefs.getIntPref(MAX_ITEMS_PREF, MAX_ITEMS_DEFAULT);
    } catch (e) {
      this._maxItems = MAX_ITEMS_DEFAULT;
    }

    Services.prefs.addObserver(ENABLED_PREF, this);
    Services.prefs.addObserver(MAX_ITEMS_PREF, this);

    await this.#load();

    console.log("[nsZenEasels] initialized", {
      enabled: this._enabled,
      spaces: this._easels.size,
    });
  }

  observe(subject, topic, data) {
    if (topic !== "nsPref:changed") {
      return;
    }
    if (data === ENABLED_PREF) {
      this._enabled = subject.getBoolPref(ENABLED_PREF, false);
    } else if (data === MAX_ITEMS_PREF) {
      this._maxItems = subject.getIntPref(MAX_ITEMS_PREF, MAX_ITEMS_DEFAULT);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Get all easels for a space.
   *
   * @param {string} spaceId - The space UUID
   * @returns {Array<{id, title, kind, content, createdAt, updatedAt, spaceId}>}
   */
  getEaselsForSpace(spaceId) {
    if (!this._enabled) {
      return [];
    }
    return [...(this._easels.get(spaceId) || [])];
  }

  /**
   * Create a new easel in a space.
   *
   * @param {string} spaceId - The space UUID
   * @param {object} data - { title, kind, content }
   * @returns {object|null} The created easel entry, or null
   */
  createEasel(spaceId, data = {}) {
    if (!this._enabled) {
      return null;
    }

    const now = Date.now();
    const easel = {
      id: generateUuidv4(),
      title: data.title || "New Easel",
      kind: data.kind || "canvas", // canvas, note, link-collection
      content: data.content || "",
      createdAt: now,
      updatedAt: now,
      spaceId,
    };

    const spaceEasels = this._easels.get(spaceId) || [];
    spaceEasels.unshift(easel); // newest first

    if (spaceEasels.length > this._maxItems) {
      spaceEasels.length = this._maxItems;
    }

    this._easels.set(spaceId, spaceEasels);
    this._saveTask.schedule(200);

    console.log("[nsZenEasels] created easel", { id: easel.id, spaceId, title: easel.title });
    return { ...easel };
  }

  /**
   * Update an existing easel.
   *
   * @param {string} easelId - The easel UUID
   * @param {object} updates - { title, kind, content }
   * @returns {boolean}
   */
  updateEasel(easelId, updates = {}) {
    if (!this._enabled) {
      return false;
    }

    for (const [spaceId, easels] of this._easels) {
      const index = easels.findIndex(e => e.id === easelId);
      if (index === -1) {
        continue;
      }
      easels[index] = {
        ...easels[index],
        ...updates,
        updatedAt: Date.now(),
      };
      this._saveTask.schedule(200);
      console.log("[nsZenEasels] updated easel", { id: easelId, spaceId });
      return true;
    }
    return false;
  }

  /**
   * Delete an easel.
   *
   * @param {string} easelId - The easel UUID
   * @returns {boolean}
   */
  deleteEasel(easelId) {
    if (!this._enabled) {
      return false;
    }

    for (const [spaceId, easels] of this._easels) {
      const index = easels.findIndex(e => e.id === easelId);
      if (index === -1) {
        continue;
      }
      easels.splice(index, 1);
      this._saveTask.schedule(200);
      console.log("[nsZenEasels] deleted easel", { id: easelId, spaceId });
      return true;
    }
    return false;
  }

  /**
   * Get an easel by ID.
   *
   * @param {string} easelId
   * @returns {object|null}
   */
  getEasel(easelId) {
    if (!this._enabled) {
      return null;
    }
    for (const easels of this._easels.values()) {
      const easel = easels.find(e => e.id === easelId);
      if (easel) {
        return { ...easel };
      }
    }
    return null;
  }

  /**
   * Export an easel to Markdown.
   *
   * @param {string} easelId
   * @returns {string|null} Markdown text, or null if not found
   */
  exportEaselToMarkdown(easelId) {
    const easel = this.getEasel(easelId);
    if (!easel) {
      return null;
    }

    let md = `# ${easel.title}\n\n`;
    md += `*Space:* ${easel.spaceId}\n`;
    md += `*Created:* ${new Date(easel.createdAt).toISOString()}\n`;
    md += `*Updated:* ${new Date(easel.updatedAt).toISOString()}\n\n`;
    md += `---\n\n`;
    md += easel.content || "";
    return md;
  }

  /**
   * Add a dragged tab/link/text to an easel.
   *
   * @param {string} easelId
   * @param {object} item - { type, title, url, content }
   * @returns {boolean}
   */
  addItemToEasel(easelId, item) {
    if (!this._enabled) {
      return false;
    }

    const easel = this.getEasel(easelId);
    if (!easel) {
      return false;
    }

    let content = easel.content || "";
    const timestamp = new Date().toLocaleTimeString();

    switch (item.type) {
      case "tab":
      case "link":
        content += `\n### [${item.title || item.url}](${item.url})\n`;
        content += `*Added via Little Arc / tab drag at ${timestamp}*\n\n`;
        break;
      case "text":
        content += `\n${item.content}\n\n*Added at ${timestamp}*\n\n`;
        break;
      case "screenshot":
        content += `\n![Screenshot](${item.url || ""})\n`;
        content += `*Screenshot added at ${timestamp}*\n\n`;
        break;
      default:
        content += `\n${JSON.stringify(item)}\n\n`;
    }

    return this.updateEasel(easelId, { content });
  }

  /* ------------------------------------------------------------------ */
  /* Persistence                                                        */
  /* ------------------------------------------------------------------ */

  async #load() {
    const file = Services.dirsvc.get("ProfD", Ci.nsIFile);
    file.append(EASELS_FILE);
    this._file = new JSONFile(file);

    try {
      const data = this._file.read();
      if (data && typeof data === "object") {
        for (const [spaceId, easels] of Object.entries(data)) {
          if (Array.isArray(easels)) {
            this._easels.set(spaceId, easels);
          }
        }
      }
    } catch (e) {
      console.log("[nsZenEasels] no existing easels file", e);
      this._easels = new Map();
    }
  }

  #persist() {
    if (!this._file) {
      return;
    }
    const data = {};
    for (const [spaceId, easels] of this._easels) {
      data[spaceId] = easels;
    }
    this._file.write(data);
  }
}

function generateUuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const ZenEasels = new nsZenEasels();

document.addEventListener(
  "DOMContentLoaded",
  () => {
    ZenEasels.init();
  },
  { once: true }
);
