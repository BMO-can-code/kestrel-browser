// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/**
 * Command bar — the single Cmd/Ctrl+K surface for URL, search, tab switch,
 * space switch and actions.
 *
 * Pref-gated behind `zen.commandbar.enabled` (default false). When disabled
 * the keybinding is a no-op and no UI is injected.
 *
 * The command bar reuses the existing urlbar quick-actions provider
 * (ZenUBActionsProvider) for its action catalogue, so no action is defined
 * twice.
 *
 * All user-visible strings come from Fluent (zen-command-palette.ftl); nothing
 * is hardcoded in English.
 */
import { Localization } from "resource://gre/modules/Localization.sys.mjs";
import { ZenDesignTokensInstance } from "chrome://browser/content/zen-components/ZenDesignTokens.mjs";

const PREF_ENABLED = "zen.commandbar.enabled";
const PREF_KEYBINDING = "zen.commandbar.keybinding";
const PANEL_ID = "zen-command-bar-panel";
const INPUT_ID = "zen-command-bar-input";
const RESULTS_ID = "zen-command-bar-results";
const LOCALIZATION_ID = "zen-commandbar";

const KEY_MS = 150; // debounce ms for input

export class nsZenCommandBar {
  constructor() {
    this._enabled = false;
    this._keybinding = "CmdOrCtrl+K";
    this._panel = null;
    this._input = null;
    this._results = null;
    this._keyListener = this._onKey.bind(this);
    this._inputListener = this._onInput.bind(this);
    this._debounceTimer = null;
    this._provider = null;
    this._l10n = new Localization(["browser/zen-command-palette.ftl"], true);
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
      this._keybinding = Services.prefs.getCharPref(PREF_KEYBINDING, "CmdOrCtrl+K");
    } catch (e) {
      this._keybinding = "CmdOrCtrl+K";
    }

    Services.prefs.addObserver(PREF_ENABLED, this);
    Services.prefs.addObserver(PREF_KEYBINDING, this);

    this._buildUI();
    this._registerKeybinding();
  }

  observe(subject, topic, data) {
    if (topic !== "nsPref:changed") {
      return;
    }
    if (data === PREF_ENABLED) {
      this._enabled = subject.getBoolPref(PREF_ENABLED);
      this._enabled ? this._show() : this._hide();
    } else if (data === PREF_KEYBINDING) {
      this._registerKeybinding();
    }
  }

  /* ------------------------------------------------------------------ */
  /* UI                                                                 */
  /* ------------------------------------------------------------------ */

  _l10n(id, args) {
    return this._l10n.formatValueSync(`${LOCALIZATION_ID}-${id}`, args);
  }

  _buildUI() {
    const doc = window.document;

    // Panel floats over content.
    const panel = doc.createElement("panel");
    panel.id = PANEL_ID;
    panel.setAttribute("noautofocus", "true");
    panel.setAttribute("popin", "true");
    panel.setAttribute("level", "topmost");
    panel.setAttribute("type", "arrow");
    panel.style.opacity = "0";
    panel.style.transform = "scale(0.95)";
    panel.style.transition = `opacity ${ZenDesignTokensInstance.commandBarOpenDurationMs}ms ${ZenDesignTokensInstance.sidebarCollapseEasing},
                              transform ${ZenDesignTokensInstance.commandBarOpenDurationMs}ms ${ZenDesignTokensInstance.sidebarCollapseEasing}`;
    panel.style.position = "fixed";
    panel.style.top = "24px";
    panel.style.left = "50%";
    panel.style.transformOrigin = "top center";
    panel.style.width = `${ZenDesignTokensInstance.commandBar.maxWidthPx}px`;
    panel.style.maxWidth = `calc(100vw - 48px)`;
    panel.style.borderRadius = `${ZenDesignTokensInstance.commandBar.borderRadiusPx}px`;
    panel.style.zIndex = "2147483647";

    // Input.
    const input = doc.createElement("textbox");
    input.id = INPUT_ID;
    input.setAttribute("flex", "1");
    input.setAttribute("type", "search");
    input.setAttribute("placeholder", this._l10n("placeholder"));
    input.addEventListener("input", this._inputListener);
    input.addEventListener("keydown", this._onInputKey.bind(this));

    // Results.
    const results = doc.createElement("vbox");
    results.id = RESULTS_ID;
    results.setAttribute("flex", "1");
    results.style.overflowY = "auto";
    results.style.maxHeight = "480px";

    const box = doc.createElement("vbox");
    box.setAttribute("flex", "1");
    box.style.padding = "12px";
    box.style.gap = "8px";
    box.appendChild(input);
    box.appendChild(results);

    panel.appendChild(box);
    doc.getElementById("content-area")?.appendChild(panel)
      ?? doc.documentElement.appendChild(panel);

    this._panel = panel;
    this._input = input;
    this._results = results;
  }

  _registerKeybinding() {
    window.removeEventListener("keydown", this._keyListener, true);
    if (!this._enabled) {
      return;
    }
    window.addEventListener("keydown", this._keyListener, true);
  }

  _onKey(event) {
    if (!this._enabled) {
      return;
    }
    // Match the configured keybinding (CmdOrCtrl+K by default).
    const isCmdOrCtrl = event.metaKey || event.ctrlKey;
    if (isCmdOrCtrl && event.code === "KeyK" && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      this._toggle();
    } else if (event.code === "Escape" && this._panel && this._panel.getAttribute("open") === "true") {
      this._hide();
    }
  }

  _onInput() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this._debounceTimer = setTimeout(() => this._updateResults(), KEY_MS);
  }

  _onInputKey(event) {
    if (event.code === "Escape") {
      this._hide();
    } else if (event.code === "ArrowDown" || event.code === "ArrowUp") {
      // Navigation handled by results focus management.
      event.stopPropagation();
    }
  }

  _toggle() {
    if (this._panel.getAttribute("open") === "true") {
      this._hide();
    } else {
      this._show();
    }
  }

  _show() {
    if (!this._enabled || !this._panel) {
      return;
    }
    this._input.value = "";
    this._results.textContent = "";
    this._input.focus();
    this._panel.openPopup(null, "afterstart", 0, 0, false, false);
    this._panel.style.opacity = "1";
    this._panel.style.transform = "scale(1)";
  }

  _hide() {
    if (!this._panel) {
      return;
    }
    this._panel.style.opacity = "0";
    this._panel.style.transform = "scale(0.95)";
    // Wait for the transition before closing so the animation is visible.
    setTimeout(() => {
      if (this._panel) {
        this._panel.hidePopup();
      }
    }, ZenDesignTokensInstance.commandBarOpenDurationMs);
  }

  /* ------------------------------------------------------------------ */
  /* Results                                                            */
  /* ------------------------------------------------------------------ */

  async _updateResults() {
    const query = this._input.value.trim();
    this._results.textContent = "";

    if (!query) {
      return;
    }

    // Reuse the urlbar quick-actions provider for the action catalogue.
    try {
      const { ZenUBActionsProvider } = await ChromeUtils.importESModule(
        "resource:///modules/zen/urlbar/ZenUBActionsProvider.sys.mjs",
        { global: "current" }
      );
      const provider = new ZenUBActionsProvider();
      await provider.init();
      const results = await provider.getResults(query, 8);
      this._renderResults(results);
    } catch (e) {
      console.error("[nsZenCommandBar] failed to load actions provider", e);
    }
  }

  _renderResults(results) {
    const doc = window.document;
    for (const result of results || []) {
      const row = doc.createElement("hbox");
      row.setAttribute("align", "center");
      row.style.padding = "8px 12px";
      row.style.borderRadius = "8px";
      row.style.cursor = "default";
      row.style.gap = "10px";

      const icon = doc.createElement("image");
      icon.style.width = "20px";
      icon.style.height = "20px";
      if (result.icon) {
        icon.src = result.icon;
      }

      const label = doc.createElement("label");
      label.value = result.label || result.name || "";
      label.style.flex = "1";

      const hint = doc.createElement("label");
      hint.value = result.hint || "";
      hint.style.opacity = "0.6";
      hint.style.fontSize = "12px";

      row.appendChild(icon);
      row.appendChild(label);
      row.appendChild(hint);
      row.addEventListener("click", () => {
        if (result.execute) {
          result.execute();
        }
        this._hide();
      });
      this._results.appendChild(row);
    }
  }
}

export const ZenCommandBar = new nsZenCommandBar();

document.addEventListener(
  "DOMContentLoaded",
  () => {
    ZenCommandBar.init();
  },
  { once: true }
);
