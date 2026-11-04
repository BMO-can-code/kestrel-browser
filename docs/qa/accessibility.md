<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Accessibility

Non-negotiable for any surface we add. A sidebar-first browser with
drag-only interactions excludes users; every pointer gesture needs a keyboard
path and a menu path.

## Requirements

### Keyboard

| Surface | Requirement |
| --- | --- |
| Sidebar | Fully reachable with Tab/arrow keys; a single shortcut focuses it, Escape returns to content |
| Tab strip | Arrow keys move selection; Enter activates; Shift+F10 opens the context menu |
| Spaces | Cycle with a shortcut; switch without a pointer; current space announced |
| Split view | Create and close with the keyboard; focus moves between panes predictably |
| Command bar / quick actions | Open, filter, run, and dismiss without a pointer; focus returns to the prior element |
| Glance / peek | Opens from the keyboard, closes with Escape, focus restored |
| Notes | Editor reachable, save without a pointer, note state exposed to assistive tech |
| Split/glance drag gestures | A menu or shortcut equivalent exists; drag is never the only way |

macOS conventions: Cmd-based shortcuts, no conflict with system shortcuts,
visible in menus so they are discoverable.

### Screen readers

- Every icon-only control has an accessible name from Fluent (`.ftl`), never a
  hard-coded English string.
- Custom widgets expose role, state and value. If a XUL element is not
  natively accessible, add `role`/`aria-*` and verify with VoiceOver.
- Dynamic changes (space switched, tab archived, note saved) are announced via
  a live region or a status message, not only visually.
- Test with VoiceOver enabled, keyboard only, on a fresh profile.

### Visual

- Text contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI boundaries,
  in both themes, with and without the accent colour.
- Focus ring visible on every interactive element and never clipped by
  `overflow: hidden`.
- Do not encode state by colour alone (unread, pending, muted, archived).
- Respect `prefers-reduced-motion`: shorten or remove transitions; the
  space-switch animation must not be the only cue.
- Support 200% zoom and 1280×800 without loss of function.
- Hit targets ≥ 24×24 CSS px for pointer controls.

### Motion and sound

- No autoplaying audio. The welcome video must be muted and user-started.
- Flashing content stays under three flashes per second.

## Test procedure

1. Fresh profile, no mouse. Complete the smoke matrix section A-D using only
   the keyboard. Record every place you get stuck.
2. Enable VoiceOver (Cmd+F5). Navigate the sidebar, spaces, tab strip and the
   new surface. Record unlabelled controls and focus traps.
3. Switch to light theme, then dark, then a custom accent. Screenshot the new
   surface; check contrast with a picker.
4. Enable Reduce Motion and repeat the animated cases.
5. Zoom to 200% and repeat the layout cases.
6. Attach findings to the QA record with the build SHA.

## Known risks in this tree

- Zen's sidebar and split view are custom XUL/CSS with drag-first interaction;
  inherited accessibility is not documented upstream.
- Compact mode hides chrome on hover, which can strand keyboard users if focus
  does not reveal it.
- The tab hover preview is pointer-only by nature; the same information must be
  available from the context menu or the notes UI.
- Sidebar icons are frequently `chrome://` SVGs; ensure each has a label and is
  not read as "graphic".

## Definition of done

A feature is not done until keyboard-only and VoiceOver passes are recorded for
it, or the PR states the specific gap and files it as a follow-up with an
owner.
