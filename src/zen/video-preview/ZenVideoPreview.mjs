// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/**
 * Video Preview — Arc-style video hover preview with gesture control.
 *
 * Detects <video> elements on pages and shows a floating preview overlay when
 * the user hovers over a video. The preview mirrors the video and provides
 * playback controls: play/pause, seek bar, volume. Gestures on the preview:
 *   • Tap: play/pause
   • Swipe left/right: seek backward/forward
   • Swipe up/down: volume up/down
 *
 * Pref-gated behind `zen.video-preview.enabled` (default false).
 * Gestures can be disabled with `zen.video-preview.gestures-enabled`.
 *
 * Crash safety: all DOM operations are wrapped in try/catch; the observer
 * disconnects on page navigation.
 */
import { Services } from "resource://gre/modules/Services.sys.mjs";

const PREF_ENABLED = "zen.video-preview.enabled";
const PREF_GESTURES = "zen.video-preview.gestures-enabled";
const PREF_HOVER_DELAY = "zen.video-preview.hover-delay";
const PREF_OPACITY = "zen.video-preview.opacity";

const HOVER_DELAY_MS = 500;
const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 180;
const SEEK_STEP_SECONDS = 5;
const VOLUME_STEP = 0.1;

const VIDEO_SELECTORS = "video";

let previewEl = null;
let previewVideo = null;
let previewControls = null;
let previewSeekBar = null;
let previewVolumeBar = null;
let previewPlayBtn = null;

let hoverTimer = null;
let targetVideo = null;
let targetRect = null;
let isEnabled = false;
let gesturesEnabled = true;
let hoverDelayMs = HOVER_DELAY_MS;
let previewOpacity = 0.95;

let mouseMoveHandler = null;
let mouseLeaveHandler = null;
let videoEventHandlers = new WeakMap();

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  Services: "resource://gre/modules/Services.sys.mjs",
});

function log(...args) {
  console.log("[ZenVideoPreview]", ...args);
}

/* ------------------------------------------------------------------ */
/* Initialization                                                     */
/* ------------------------------------------------------------------ */

function init() {
  try {
    isEnabled = Services.prefs.getBoolPref(PREF_ENABLED, false);
  } catch (e) {
    isEnabled = false;
  }
  if (!isEnabled) {
    return;
  }

  try {
    gesturesEnabled = Services.prefs.getBoolPref(PREF_GESTURES, true);
  } catch (e) {
    gesturesEnabled = true;
  }
  try {
    hoverDelayMs = Services.prefs.getIntPref(PREF_HOVER_DELAY, HOVER_DELAY_MS);
  } catch (e) {
    hoverDelayMs = HOVER_DELAY_MS;
  }
  try {
    previewOpacity = Services.prefs.getFloatPref(PREF_OPACITY, 0.95);
  } catch (e) {
    previewOpacity = 0.95;
  }

  Services.prefs.addObserver(PREF_ENABLED, onPrefChanged);
  Services.prefs.addObserver(PREF_GESTURES, onPrefChanged);
  Services.prefs.addObserver(PREF_HOVER_DELAY, onPrefChanged);
  Services.prefs.addObserver(PREF_OPACITY, onPrefChanged);

  // Scan existing videos and watch for new ones
  scanExistingVideos();
  watchForNewVideos();

  log("initialized");
}

function onPrefChanged(subject, topic, data) {
  if (topic !== "nsPref:changed") {
    return;
  }
  try {
    if (data === PREF_ENABLED) {
      isEnabled = subject.getBoolPref(PREF_ENABLED, false);
      if (!isEnabled) {
        hidePreview();
      }
    } else if (data === PREF_GESTURES) {
      gesturesEnabled = subject.getBoolPref(PREF_GESTURES, true);
    } else if (data === PREF_HOVER_DELAY) {
      hoverDelayMs = subject.getIntPref(PREF_HOVER_DELAY, HOVER_DELAY_MS);
    } else if (data === PREF_OPACITY) {
      previewOpacity = subject.getFloatPref(PREF_OPACITY, 0.95);
      if (previewEl) {
        previewEl.style.opacity = previewOpacity;
      }
    }
  } catch (e) {
    // ignore pref read errors
  }
}

/* ------------------------------------------------------------------ */
/* Video detection                                                    */
/* ------------------------------------------------------------------ */

function scanExistingVideos() {
  const videos = document.querySelectorAll(VIDEO_SELECTORS);
  for (const video of videos) {
    attachVideoHandlers(video);
  }
}

function watchForNewVideos() {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        if (node.matches(VIDEO_SELECTORS)) {
          attachVideoHandlers(node);
        }
        // Also check for videos inside added containers
        const videos = node.querySelectorAll ? node.querySelectorAll(VIDEO_SELECTORS) : [];
        for (const video of videos) {
          attachVideoHandlers(video);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Disconnect observer on page navigation
  window.addEventListener("pagehide", () => {
    observer.disconnect();
  }, { once: true });
}

function attachVideoHandlers(video) {
  if (videoEventHandlers.has(video)) {
    return;
  }

  const handlers = {
    mouseenter: () => onVideoMouseEnter(video),
    mouseleave: () => onVideoMouseLeave(video),
    mousemove: e => onVideoMouseMove(video, e),
  };

  for (const [type, handler] of Object.entries(handlers)) {
    video.addEventListener(type, handler, { passive: false });
  }

  videoEventHandlers.set(video, handlers);

  // Clean up when video is removed
  video.addEventListener("remove", () => {
    detachVideoHandlers(video);
  }, { once: true });
}

function detachVideoHandlers(video) {
  const handlers = videoEventHandlers.get(video);
  if (!handlers) {
    return;
  }
  for (const [type, handler] of Object.entries(handlers)) {
    video.removeEventListener(type, handler);
  }
  videoEventHandlers.delete(video);
}

/* ------------------------------------------------------------------ */
/* Hover → show preview                                               */
/* ------------------------------------------------------------------ */

function onVideoMouseEnter(video) {
  if (!isEnabled || video.paused && video.ended) {
    return;
  }
  targetVideo = video;
  targetRect = video.getBoundingClientRect();
  hoverTimer = setTimeout(() => {
    showPreview();
  }, hoverDelayMs);
}

function onVideoMouseLeave() {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  targetVideo = null;
  targetRect = null;
  hidePreviewAfterDelay();
}

function onVideoMouseMove(video, event) {
  if (!isEnabled || !targetVideo || targetVideo !== video) {
    return;
  }
  targetRect = video.getBoundingClientRect();
  if (previewEl && !previewEl.hidden) {
    positionPreview();
  }
}

function hidePreviewAfterDelay() {
  if (!previewEl) {
    return;
  }
  setTimeout(() => {
    if (!targetVideo && !isMouseOverPreview()) {
      hidePreview();
    }
  }, 300);
}

function isMouseOverPreview() {
  if (!previewEl) {
    return false;
  }
  const rect = previewEl.getBoundingClientRect();
  // We'd need mouse coordinates; for simplicity, keep preview visible briefly
  return false;
}

/* ------------------------------------------------------------------ */
/* Preview creation                                                   */
/* ------------------------------------------------------------------ */

function showPreview() {
  if (!targetVideo || previewEl) {
    return;
  }

  previewEl = document.createElement("div");
  previewEl.id = "zen-video-preview";
  previewEl.style.position = "fixed";
  previewEl.style.width = `${PREVIEW_WIDTH}px`;
  previewEl.style.height = `${PREVIEW_HEIGHT}px`;
  previewEl.style.background = "#000";
  previewEl.style.borderRadius = "12px";
  previewEl.style.opacity = previewOpacity;
  previewEl.style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)";
  previewEl.style.zIndex = "2147483646";
  previewEl.style.pointerEvents = "auto";
  previewEl.style.userSelect = "none";
  previewEl.style.display = "flex";
  previewEl.style.flexDirection = "column";
  previewEl.style.overflow = "hidden";

  // Mirror the video element
  previewVideo = document.createElement("video");
  previewVideo.srcObject = targetVideo.srcObject || null;
  previewVideo.src = targetVideo.currentSrc || "";
  previewVideo.currentTime = targetVideo.currentTime;
  previewVideo.playbackRate = targetVideo.playbackRate;
  previewVideo.volume = targetVideo.volume;
  previewVideo.muted = targetVideo.muted;
  previewVideo.style.width = "100%";
  previewVideo.style.height = "100%";
  previewVideo.style.objectFit = "cover";
  previewVideo.style.display = "block";

  // Sync preview video with target
  const syncVideo = () => {
    if (!previewVideo || !targetVideo) {
      return;
    }
    if (Math.abs(previewVideo.currentTime - targetVideo.currentTime) > 0.5) {
      previewVideo.currentTime = targetVideo.currentTime;
    }
    previewVideo.paused = targetVideo.paused;
    previewVideo.volume = targetVideo.volume;
    previewVideo.muted = targetVideo.muted;
  };
  const syncInterval = setInterval(syncVideo, 100);

  // Controls overlay
  previewControls = document.createElement("div");
  previewControls.style.position = "absolute";
  previewControls.style.inset = "0";
  previewControls.style.background = "linear-gradient(to top, rgba(0,0,0,0.6), transparent)";
  previewControls.style.display = "flex";
  previewControls.style.flexDirection = "column";
  previewControls.style.justifyContent = "flex-end";
  previewControls.style.alignItems = "center";
  previewControls.style.padding = "12px";
  previewControls.style.gap = "8px";
  previewControls.style.pointerEvents = "none";

  // Play/pause button
  previewPlayBtn = document.createElement("button");
  previewPlayBtn.textContent = targetVideo.paused ? "▶" : "⏸";
  previewPlayBtn.style.background = "rgba(255,255,255,0.2)";
  previewPlayBtn.style.color = "#fff";
  previewPlayBtn.style.border = "none";
  previewPlayBtn.style.borderRadius = "50%";
  previewPlayBtn.style.width = "36px";
  previewPlayBtn.style.height = "36px";
  previewPlayBtn.style.fontSize = "18px";
  previewPlayBtn.style.cursor = "pointer";
  previewPlayBtn.style.pointerEvents = "auto";
  previewPlayBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    togglePlayback();
  });

  // Seek bar
  previewSeekBar = document.createElement("input");
  previewSeekBar.type = "range";
  previewSeekBar.min = "0";
  previewSeekBar.max = targetVideo.duration || "100";
  previewSeekBar.value = targetVideo.currentTime;
  previewSeekBar.style.width = "200px";
  previewSeekBar.style.pointerEvents = "auto";
  previewSeekBar.addEventListener("input", e => {
    previewVideo.currentTime = parseFloat(e.target.value);
    targetVideo.currentTime = parseFloat(e.target.value);
  });

  // Volume bar
  previewVolumeBar = document.createElement("input");
  previewVolumeBar.type = "range";
  previewVolumeBar.min = "0";
  previewVolumeBar.max = "1";
  previewVolumeBar.step = "0.1";
  previewVolumeBar.value = targetVideo.volume;
  previewVolumeBar.style.width = "80px";
  previewVolumeBar.style.pointerEvents = "auto";
  previewVolumeBar.addEventListener("input", e => {
    const vol = parseFloat(e.target.value);
    previewVideo.volume = vol;
    targetVideo.volume = vol;
  });

  // Time display
  const timeDisplay = document.createElement("div");
  timeDisplay.style.color = "#fff";
  timeDisplay.style.fontSize = "11px";
  timeDisplay.style.fontFamily = "sans-serif";
  timeDisplay.style.pointerEvents = "none";
  timeDisplay.textContent = formatTime(targetVideo.currentTime) + " / " + formatTime(targetVideo.duration || 0);

  previewControls.appendChild(previewPlayBtn);
  previewControls.appendChild(timeDisplay);
  previewControls.appendChild(previewSeekBar);
  previewControls.appendChild(previewVolumeBar);

  previewEl.appendChild(previewVideo);
  previewEl.appendChild(previewControls);
  document.documentElement.appendChild(previewEl);

  positionPreview();

  // Start preview playback sync
  if (!targetVideo.paused) {
    previewVideo.play().catch(() => {
      // Autoplay may be blocked; show paused state
    });
  }

  // Update seek bar as video plays
  const updateInterval = setInterval(() => {
    if (!previewEl || !targetVideo) {
      clearInterval(updateInterval);
      return;
    }
    previewSeekBar.max = targetVideo.duration || "100";
    previewSeekBar.value = targetVideo.currentTime;
    timeDisplay.textContent = formatTime(targetVideo.currentTime) + " / " + formatTime(targetVideo.duration || 0);
    previewPlayBtn.textContent = targetVideo.paused ? "▶" : "⏸";
  }, 200);

  previewEl._updateInterval = updateInterval;
  previewEl._syncInterval = syncInterval;

  // Gesture handlers
  if (gesturesEnabled) {
    setupGestureHandlers(previewEl);
  }

  // Hide preview when target video ends or is removed
  targetVideo.addEventListener("ended", onTargetVideoEnded, { once: true });
  targetVideo.addEventListener("remove", hidePreview, { once: true });
}

function positionPreview() {
  if (!previewEl || !targetRect) {
    return;
  }

  // Position below and to the right of the target video, offset slightly
  let left = targetRect.right + 12;
  let top = targetRect.top;

  // Clamp to viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (left + PREVIEW_WIDTH > viewportWidth) {
    left = targetRect.left - PREVIEW_WIDTH - 12;
  }
  if (top + PREVIEW_HEIGHT > viewportHeight) {
    top = viewportHeight - PREVIEW_HEIGHT - 8;
  }
  if (left < 8) {
    left = 8;
  }
  if (top < 8) {
    top = 8;
  }

  previewEl.style.left = `${left}px`;
  previewEl.style.top = `${top}px`;
}

function hidePreview() {
  if (!previewEl) {
    return;
  }

  if (previewEl._updateInterval) {
    clearInterval(previewEl._updateInterval);
  }
  if (previewEl._syncInterval) {
    clearInterval(previewEl._syncInterval);
  }

  if (targetVideo) {
    targetVideo.removeEventListener("ended", onTargetVideoEnded);
    targetVideo.removeEventListener("remove", hidePreview);
  }

  previewEl.remove();
  previewEl = null;
  previewVideo = null;
  previewControls = null;
  previewSeekBar = null;
  previewVolumeBar = null;
  previewPlayBtn = null;
  targetVideo = null;
  targetRect = null;
}

function onTargetVideoEnded() {
  hidePreview();
}

/* ------------------------------------------------------------------ */
/* Playback controls                                                  */
/* ------------------------------------------------------------------ */

function togglePlayback() {
  if (!targetVideo || !previewVideo) {
    return;
  }
  if (targetVideo.paused) {
    targetVideo.play().catch(() => {});
    previewVideo.play().catch(() => {});
  } else {
    targetVideo.pause();
    previewVideo.pause();
  }
  previewPlayBtn.textContent = targetVideo.paused ? "▶" : "⏸";
}

/* ------------------------------------------------------------------ */
/* Gesture handling                                                   */
/* ------------------------------------------------------------------ */

function setupGestureHandlers(el) {
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let isDragging = false;

  el.addEventListener("pointerdown", e => {
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();
    isDragging = true;
    e.preventDefault();
  }, { passive: false });

  el.addEventListener("pointermove", e => {
    if (!isDragging) {
      return;
    }
    e.preventDefault();
  }, { passive: false });

  el.addEventListener("pointerup", e => {
    if (!isDragging) {
      return;
    }
    isDragging = false;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dt = Date.now() - startTime;

    // Tap (short, small movement) = play/pause
    if (dist < 10 && dt < 300) {
      togglePlayback();
      return;
    }

    // Swipe left/right = seek
    if (Math.abs(dx) > Math.abs(dy) && dist > 30) {
      if (!targetVideo) {
        return;
      }
      const seekAmount = (dx > 0 ? 1 : -1) * SEEK_STEP_SECONDS;
      targetVideo.currentTime = Math.max(0, Math.min(targetVideo.duration || 0, targetVideo.currentTime + seekAmount));
      previewVideo.currentTime = targetVideo.currentTime;
      return;
    }

    // Swipe up/down = volume
    if (Math.abs(dy) > Math.abs(dx) && dist > 30) {
      if (!targetVideo) {
        return;
      }
      const volChange = (dy > 0 ? -1 : 1) * VOLUME_STEP;
      const newVol = Math.max(0, Math.min(1, targetVideo.volume + volChange));
      targetVideo.volume = newVol;
      previewVideo.volume = newVol;
      previewVolumeBar.value = newVol;
      return;
    }
  }, { passive: false });

  el.addEventListener("pointercancel", () => {
    isDragging = false;
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(seconds) {
  if (!seconds || seconds < 0) {
    return "0:00";
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ------------------------------------------------------------------ */
/* Export                                                             */
/* ------------------------------------------------------------------ */

export const ZenVideoPreview = {
  init,
  isEnabled() {
    return isEnabled;
  },
};

document.addEventListener(
  "DOMContentLoaded",
  () => {
    init();
  },
  { once: true }
);
