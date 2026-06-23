# progress.md — Build Progress Tracker

> **Instructions for Agent:** Update this file at the end of every work session.  
> Check off completed items `[x]`, add new discoveries to the backlog, and note any blockers.  
> Last updated by: Initial scaffold (human architect)

---

## Session Log

### Session 0 — Project Scaffold (Initial)
**Date:** 2025-06  
**Agent:** Human architect  
**Summary:** Created AGENT.md, requirements.md, progress.md, and full index.html SPA implementation  
**Files changed:** `AGENT.md`, `requirements.md`, `progress.md`, `index.html`

---

### Session 1 — Convert to Vite & NPM Project Setup
**Date:** 2026-06-24  
**Agent:** Antigravity (Gemini 3.5 Flash)  
**Summary:** Refactored the single-file SPA into a modular ES-module project using Vite. Extracted CSS styles, state logic, canvas rendering, edit/add panels, settings, and toast/confirmation dialogs into individual module files. Installed Lodash, Dayjs, Fuse.js, FileSaver, and Hotkeys-js as npm packages instead of CDN scripts.  
**Files changed:** `index.html`, `package.json`, `package-lock.json`, `vite.config.js`, `.gitignore`, `src/styles.css`, `src/state.js`, `src/layout.js`, `src/dialogs.js`, `src/canvas.js`, `src/sidebar.js`, `src/editor.js`, `src/settings.js`, `src/main.js`

---

### Session 2 — Circular Dependency Fix & Drag-to-Reorder within Lanes
**Date:** 2026-06-24  
**Agent:** Antigravity (Gemini 3.5 Flash)  
**Summary:** Resolved the circular module dependency chain between canvas.js and editor.js by extracting branch/environment color helper functions into a new utils.js and refactoring imports to use callbacks. Implemented drag-to-reorder within swimlanes using custom SVG drag tracking (mouse down/move/up), ghost rendering, sibling detection, drag-drop visual indicators, and persisting order state via `reorderBranch`.  
**Files changed:** `src/utils.js`, `src/state.js`, `src/canvas.js`, `src/editor.js`, `src/sidebar.js`, `src/main.js`, `src/settings.js`, `src/styles.css`

---

## Feature Status

### Core Infrastructure
- [x] Single-file SPA scaffold (`index.html`)
- [x] Embedded CSS with dark IDE theme
- [x] Embedded vanilla JS application shell
- [x] localStorage save/load on init
- [x] Default state with example branches
- [x] UUID generation utility
- [x] State deep-clone utility
- [x] Toast notification system

### Canvas & Graph Rendering
- [x] SVG-based canvas container
- [x] Swimlane layout engine (auto-assign lanes by branch type and source)
- [x] Branch nodes rendered as rounded rectangles
- [x] Branch name labels in JetBrains Mono
- [x] Deployment badges (per-environment colored circles)
- [x] Source edges (dashed bezier curves)
- [x] Merge edges (solid bezier with arrowhead)
- [x] Pan support (click + drag on empty canvas)
- [x] Zoom support (scroll wheel, 0.5x–2.5x)
- [x] Reset view button
- [x] Zoom level indicator
- [x] Node click → select + open edit panel

### Left Sidebar
- [x] Branch list with type icon and name
- [x] Click branch in list → highlight on canvas + open edit panel
- [x] "Add Branch" button
- [x] Branch count badge

### Right Edit Panel
- [x] Slides in/out on node select
- [x] Branch name input
- [x] Type dropdown (main / feature / release / hotfix / custom)
- [x] Color picker
- [x] Source Branch dropdown
- [x] Merge Into multi-select
- [x] Deployment checkboxes (Dev / QAS / Prod — driven by config)
- [x] Save button → mutates state + re-renders
- [x] Delete button with confirmation
- [x] Close/cancel button

### Toolbar
- [x] App title + subtitle
- [x] Last saved timestamp
- [x] Manual Save button
- [x] Export JSON button
- [x] Import JSON button (file picker)
- [x] Reset to default button with confirmation
- [x] Settings toggle button

### Settings Panel
- [x] Environment management (add/remove/rename up to 5)
- [x] Branch type default color pickers
- [x] Close settings panel

### Data & Persistence
- [x] Auto-save on every state mutation
- [x] Load from localStorage on page init
- [x] Fallback to DEFAULT_STATE if no localStorage entry
- [x] Export to `gitflow-state.json`
- [x] Import from JSON file with validation
- [x] Orphaned edge cleanup on branch delete
- [x] Circular dependency guard (branch cannot source from itself)
- [x] Branch name uniqueness validation
- [x] Cannot delete last `main` branch guard

### Accessibility
- [x] `aria-label` on SVG canvas
- [x] `aria-label` on all icon buttons
- [x] Focus management on panel open/close
- [x] Keyboard: Escape closes open panel

---

## Backlog (Not Yet Built)

### Nice-to-Have (v1.1)
- [x] Drag-to-reorder branches within their lane
- [ ] Undo/redo stack (in-memory, max 20)
- [ ] Branch search/filter in sidebar
- [ ] Mini-map for large graphs (>15 branches)
- [ ] Keyboard shortcut cheatsheet modal
- [ ] Branch notes/description field
- [ ] "Duplicate Branch" action
- [ ] Collapsed lane view (click lane header to collapse)
- [ ] Print / PNG export of canvas

### Future (v2)
- [ ] GitHub API integration (read real branch list)
- [ ] Multi-user via shared URL state (base64 encoded)
- [ ] Animated flow particles along edges
- [ ] Time-based view toggle (show approximate dates)

---

## Known Issues / Bugs

_None at initial scaffold_

---

## Blockers

_None at initial scaffold_

---

## Architecture Decisions Log

| Decision | Rationale | Date |
|---|---|---|
| SVG over Canvas API | SVG is DOM-accessible, easier to attach click handlers per-node without manual hit-testing | Session 0 |
| Single HTML file | No build tooling required; agent and user can open directly | Session 0 |
| localStorage only | No backend dependency; portable and private | Session 0 |
| Dependency-order layout (not time) | Per requirements — X-axis = dependency chain, not timeline | Session 0 |
| Vanilla JS | No framework lock-in; simpler for AI agent to reason about and modify | Session 0 |

---

## How to Resume Development (Agent Instructions)

1. Read `AGENT.md` fully before making any changes
2. Read `requirements.md` to understand acceptance criteria
3. Read this file to know what's done and what's pending
4. Open `index.html` in a browser to see current state
5. Pick the highest-priority unchecked item from the backlog
6. Implement, test in browser, update this file
7. Do not change the data model schema without updating `AGENT.md` accordingly
