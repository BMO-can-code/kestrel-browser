// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/**
 * ZenEasel — individual easel canvas element.
 *
 * A freeform canvas that accepts dragged tabs, links, text, and screenshots.
 * Renders content as Markdown with a drawing surface overlay.
 *
 * Used as a custom element: <zen-easel easel-id="..." space-id="..."></zen-easel>
 */
import { nsZenDOMOperatedFeature } from "chrome://browser/content/zen-components/ZenCommonUtils.mjs";

export class nsZenEasel extends nsZenDOMOperatedFeature {
  constructor() {
    super();
    this._easelId = null;
    this._spaceId = null;
    this._content = "";
    this._title = "";
  }

  get easelId() {
    return this._easelId;
  }

  set easelId(value) {
    this._easelId = value;
    this._loadEasel();
  }

  get spaceId() {
    return this._spaceId;
  }

  set spaceId(value) {
    this._spaceId = value;
  }

  init() {
    this._easelId = this.getAttribute("easel-id");
    this._spaceId = this.getAttribute("space-id");
    this._setupDragAndDrop();
    this._render();
  }

  _setupDragAndDrop() {
    this.addEventListener("dragover", event => {
      event.preventDefault();
      this.classList.add("zen-easel-drag-over");
    });

    this.addEventListener("dragleave", () => {
      this.classList.remove("zen-easel-drag-over");
    });

    this.addEventListener("drop", async event => {
      event.preventDefault();
      this.classList.remove("zen-easel-drag-over");

      const dt = event.dataTransfer;
      const item = { type: "text", content: "", title: "", url: "" };

      // Try to get a URL from the drag
      if (dt.types.includes("text/uri-list")) {
        const urls = dt.getData("text/uri-list").split("\n").filter(Boolean);
        if (urls[0]) {
          item.type = "link";
          item.url = urls[0];
          item.title = urls[0];
        }
      }

      // Try to get dragged tab
      if (dt.types.includes("application/x-moz-row")) {
        // Tab drag - we'd need to resolve the tab from the drag data
        // This is handled at a higher level in Zen's drag-and-drop system
        item.type = "tab";
        item.title = "Dragged tab";
      }

      // Plain text
      if (dt.types.includes("text/plain")) {
        const text = dt.getData("text/plain");
        if (text && !item.url) {
          item.type = "text";
          item.content = text;
          item.title = text.substring(0, 50);
        }
      }

      if (item.url || item.content || item.title) {
        const { ZenEasels } = ChromeUtils.importESModule(
          "chrome://browser/content/zen-components/ZenEasels.mjs",
          { global: "current" }
        );
        ZenEasels.addItemToEasel(this._easelId, item);
        this._render();
      }
    });
  }

  async _loadEasel() {
    if (!this._easelId) {
      return;
    }
    const { ZenEasels } = ChromeUtils.importESModule(
      "chrome://browser/content/zen-components/ZenEasels.mjs",
      { global: "current" }
    );
    const easel = ZenEasels.getEasel(this._easelId);
    if (easel) {
      this._content = easel.content || "";
      this._title = easel.title || "Untitled Easel";
      this._render();
    }
  }

  _render() {
    const renderer = this._renderMarkdown(this._content);
    this.innerHTML = `
      <div class="zen-easel-header">
        <h3 class="zen-easel-title" contenteditable="true">${this._escapeHtml(this._title)}</h3>
        <button class="zen-easel-export" data-l10n-id="easel-export">Export Markdown</button>
      </div>
      <div class="zen-easel-canvas" contenteditable="true">${renderer}</div>
    `;
    this._attachEditListeners();
  }

  _attachEditListeners() {
    const titleEl = this.querySelector(".zen-easel-title");
    const canvasEl = this.querySelector(".zen-easel-canvas");
    const exportBtn = this.querySelector(".zen-easel-export");

    if (titleEl) {
      titleEl.addEventListener("input", () => {
        this._title = titleEl.textContent;
        this._save();
      });
    }

    if (canvasEl) {
      canvasEl.addEventListener("input", () => {
        // Convert contenteditable back to markdown-ish text
        this._content = canvasEl.textContent || "";
        this._save();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const { ZenEasels } = ChromeUtils.importESModule(
          "chrome://browser/content/zen-components/ZenEasels.mjs",
          { global: "current" }
        );
        const md = ZenEasels.exportEaselToMarkdown(this._easelId);
        if (md) {
          const blob = new Blob([md], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const a = document.createElementNS(
            "http://www.w3.org/1999/xhtml",
            "a"
          );
          a.href = url;
          a.download = `${this._title.replace(/\s+/g, "_")}.md`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }
  }

  async _save() {
    if (!this._easelId) {
      return;
    }
    const { ZenEasels } = ChromeUtils.importESModule(
      "chrome://browser/content/zen-components/ZenEasels.mjs",
      { global: "current" }
    );
    ZenEasels.updateEasel(this._easelId, {
      title: this._title,
      content: this._content,
    });
  }

  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  _renderMarkdown(text) {
    // Simple markdown rendering for preview
    if (!text) {
      return "<p><em>Drop tabs, links, or text here to start.</em></p>";
    }
    let html = text
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%"/>')
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");
    return `<p>${html}</p>`;
  }
}

customElements.define("zen-easel", nsZenEasel);
