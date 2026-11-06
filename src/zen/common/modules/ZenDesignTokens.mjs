// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/**
 * Zen design tokens.
 *
 * Central source of truth for the values that drive the shell's look and
 * motion. Colors, radii and spacing mirror the `--zen-*` CSS custom properties
 * so that JS and CSS stay in sync. Durations are transform/opacity-only so the
 * compositor can drive them off the main thread.
 *
 * Read values with:
 *   import { ZenDesignTokens } from "chrome://browser/content/zen-components/ZenDesignTokens.mjs";
 *   ZenDesignTokens.sidebar.collapseDurationMs
 */
export class ZenDesignTokens {
  constructor() {
    this._prefs = Services.prefs;
  }

  /* ------------------------------------------------------------------ */
  /* Color                                                              */
  /* ------------------------------------------------------------------ */

  get accentColor() {
    return this._readColor("zen.theme.accent-color", "#7C3AED");
  }

  get backgroundColor() {
    return this._readColor("zen.colors-background", "#0F0F10");
  }

  get surfaceColor() {
    return this._readColor("zen.colors-surface", "#1A1A1C");
  }

  get borderColor() {
    return this._readColor("zen.colors-border", "#2A2A2E");
  }

  get textPrimary() {
    return this._readColor("zen.colors-text-primary", "#FFFFFF");
  }

  get textSecondary() {
    return this._readColor("zen.colors-text-secondary", "#A1A1AA");
  }

  /* ------------------------------------------------------------------ */
  /* Radius                                                             */
  /* ------------------------------------------------------------------ */

  get radius() {
    return this._readPx("zen.theme.border-radius", 12);
  }

  /* ------------------------------------------------------------------ */
  /* Spacing                                                            */
  /* ------------------------------------------------------------------ */

  get spacing() {
    return {
      xs: this._readPx("zen.element-separation-xs", 4),
      sm: this._readPx("zen.element-separation-sm", 8),
      md: this._readPx("zen.element-separation", 16),
      lg: this._readPx("zen.element-separation-lg", 24),
      xl: this._readPx("zen.element-separation-xl", 32),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Motion                                                             */
  /* ------------------------------------------------------------------ */

  /** Duration (ms) for sidebar collapse/expand. Transform/opacity only. */
  get sidebarCollapseDurationMs() {
    return this._readInt("zen.view.sidebar-collapse-duration-ms", 220);
  }

  /** Easing for sidebar collapse/expand. */
  get sidebarCollapseEasing() {
    return this._readString("zen.view.sidebar-collapse-easing", "cubic-bezier(0.2, 0, 0, 1)");
  }

  /** Duration (ms) for command bar open/close. */
  get commandBarOpenDurationMs() {
    return this._readInt("zen.commandbar.open-duration-ms", 160);
  }

  /* ------------------------------------------------------------------ */
  /* Sidebar                                                            */
  /* ------------------------------------------------------------------ */

  get sidebar() {
    return {
      collapsedWidthPx: this._readInt("zen.view.sidebar-collapsed-width-px", 64),
      expandedMaxWidthPx: this._readInt("zen.view.sidebar-expanded.max-width", 500),
      essentialsEnabled: this._readBool("zen.view.sidebar-essentials.enabled", true),
      collapseAnimate: this._readBool("zen.view.sidebar-collapse-animate", true),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Command bar                                                        */
  /* ------------------------------------------------------------------ */

  get commandBar() {
    return {
      enabled: this._readBool("zen.commandbar.enabled", false),
      keybinding: this._readString("zen.commandbar.keybinding", "CmdOrCtrl+K"),
      maxWidthPx: this._readInt("zen.commandbar.max-width", 750),
      borderRadiusPx: this._readInt("zen.commandbar.border-radius", 14),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  _readColor(pref, fallback) {
    try {
      return this._prefs.getCharPref(pref);
    } catch (e) {
      return fallback;
    }
  }

  _readPx(pref, fallback) {
    try {
      return this._prefs.getIntPref(pref);
    } catch (e) {
      return fallback;
    }
  }

  _readInt(pref, fallback) {
    try {
      return this._prefs.getIntPref(pref);
    } catch (e) {
      return fallback;
    }
  }

  _readString(pref, fallback) {
    try {
      return this._prefs.getCharPref(pref);
    } catch (e) {
      return fallback;
    }
  }

  _readBool(pref, fallback) {
    try {
      return this._prefs.getBoolPref(pref);
    } catch (e) {
      return fallback;
    }
  }
}

export const ZenDesignTokensInstance = new ZenDesignTokens();
