# AGENT.md — Gemini AI Development Agent Guide

> **READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE.**
> You are operating inside a git repository. Every meaningful change must be committed and pushed. Instructions in this file are your operating contract — do not deviate from them.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Project Name** | GitFlow Visualizer SPA |
| **Purpose** | A single-page web app visualizing branch structure and deployment pipeline across Dev, QAS, and Prod environments as a left-to-right dependency flow graph with a built-in GUI editor |
| **Primary file** | `index.html` — entire app in one file |
| **State storage** | `localStorage` key: `gitflow_state` |
| **Fonts** | JetBrains Mono (code), Inter (UI) via Google Fonts CDN |

---

## 2. Your Role

You are a **full-stack AI development agent**. Your responsibilities are:

1. Read `requirements.md` to understand what needs building
2. Check `progress.md` to know what is already done — **never rebuild what exists**
3. Build or fix features one at a time; verify each before moving on
4. Commit and push after every feature or meaningful milestone (see Section 5)
5. Update `progress.md` at the end of every session (see Section 6)
6. Never break existing functionality when extending the app

---

## 3. Repository & Git Setup

### This is a Git Repository

You are working inside a git repository. The following is true:
- `git` is available in the shell
- A remote named `origin` is already configured and authenticated
- The working branch is `main` (or whatever branch you were told to use)
- You have permission to commit and push directly to `origin`

### First-Time Setup Check

At the very start of a new session, run this block to confirm git is healthy:

```bash
# Confirm you're inside a repo
git status

# Check the current branch
git branch --show-current

# Check the remote is set
git remote -v

# Pull latest before doing any work (avoid conflicts)
git pull origin $(git branch --show-current) --ff-only
```

If `git status` fails (not a repo), stop and tell the user. Do not continue.
If `git pull` causes a conflict, stop, report the conflict files, and ask the user how to resolve. Do not auto-resolve conflicts.

---

## 4. Available Libraries (USE THESE — don't reinvent)

These libraries are available via CDN and are pre-approved for use in `index.html`. Import them inside `<head>` using `<script>` or `<link>` tags. Prefer these over writing equivalent logic yourself.

### Always Included (already in the app)
| Library | CDN | Purpose |
|---|---|---|
| Google Fonts: Inter + JetBrains Mono | `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap` | Typography |

### Use When Relevant
| Library | CDN URL | When to Use |
|---|---|---|
| **Lodash 4.17** | `https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js` | Deep clone (`_.cloneDeep`), debounce, unique, groupBy, sortBy — use instead of manual implementations |
| **Day.js 1.11** | `https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.10/dayjs.min.js` | Any date/time formatting (last-saved timestamps, session dates) |
| **SVG.js 3.x** | `https://cdnjs.cloudflare.com/ajax/libs/svg.js/3.2.0/svg.min.js` | Optional: if SVG rendering becomes complex, SVG.js simplifies element creation and animation |
| **Tippy.js 6.x** | `https://unpkg.com/@popperjs/core@2/dist/umd/popper.min.js` + `https://unpkg.com/tippy.js@6/dist/tippy-bundle.umd.min.js` | Tooltips on nodes (show full branch name, deployment details on hover) |
| **Tippy CSS** | `https://unpkg.com/tippy.js@6/dist/tippy.css` | Required stylesheet for Tippy |
| **nanoid (via CDN)** | `https://cdn.jsdelivr.net/npm/nanoid@5/nanoid.js` | UUID/ID generation — use instead of the manual UUID function if imported |
| **Fuse.js 7.x** | `https://cdnjs.cloudflare.com/ajax/libs/fuse.js/7.0.0/fuse.min.js` | Fuzzy search for branch filter in sidebar |
| **FileSaver.js** | `https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js` | Reliable file download for Export JSON — use instead of manual Blob/URL approach |
| **hotkeys-js** | `https://cdnjs.cloudflare.com/ajax/libs/hotkeys-js/3.13.7/hotkeys.min.js` | Keyboard shortcut registration — cleaner than manual `keydown` listeners |

### How to Add a Library

When you need a library, add it to the `<head>` of `index.html` **before** the closing `</head>` tag and **before** the main `<script>` block. Example:

```html
<!-- In <head> -->
<link rel="stylesheet" href="https://unpkg.com/tippy.js@6/dist/tippy.css" />

<!-- Just before </body> or at top of <script> imports -->
<script src="https://unpkg.com/@popperjs/core@2/dist/umd/popper.min.js"></script>
<script src="https://unpkg.com/tippy.js@6/dist/tippy-bundle.umd.min.js"></script>
```

---

## 5. Git Commit & Push Protocol

### When to Commit

Commit after **each** of the following — do not batch multiple features into one commit:

| Trigger | Example commit message |
|---|---|
| A new user-visible feature is working | `feat: add branch search filter in sidebar using Fuse.js` |
| A bug is fixed | `fix: prevent orphaned edges when deleting source branch` |
| A library is added and integrated | `chore: add Tippy.js tooltips on branch nodes` |
| `progress.md` is updated at session end | `docs: update progress.md — session 3 complete` |
| `AGENT.md` or `requirements.md` is changed | `docs: update AGENT.md with new library options` |
| A refactor that changes no behaviour | `refactor: extract layout engine into computeLayout()` |

### Commit Procedure — Run Every Time

```bash
# 1. Stage the specific files you changed (never use git add -A blindly)
git add index.html
# or for docs:
git add progress.md AGENT.md

# 2. Check what you're about to commit
git diff --cached --stat

# 3. Write a commit with a subject and body
git commit -m "feat: add Fuse.js branch search to sidebar

- Added Fuse.js 7.x via CDN for fuzzy search
- Search input appears at top of sidebar
- Filters branch list in real-time as user types
- Clears filter when input is emptied
- No state mutation — filter is view-only"

# 4. Push to origin immediately
git push origin $(git branch --show-current)

# 5. Confirm push succeeded — check the output for 'main -> main'
```

### Commit Message Rules

```
<type>: <short summary in present tense, lowercase, max 72 chars>

<blank line>
<bullet-point body — what changed and why, one bullet per logical change>
<mention any libraries added or removed>
<note any known limitations or follow-up tasks>
```

**Types:** `feat` | `fix` | `refactor` | `chore` | `docs` | `style` | `perf`

**Good examples:**
```
feat: add undo/redo stack with Ctrl+Z / Ctrl+Shift+Z

- Implemented in-memory undo stack (max 20 states)
- Hooks into all state mutations via pushUndo()
- Uses _.cloneDeep (Lodash) to snapshot state before each change
- Stack is not persisted to localStorage (intentional)
- Redo clears if a new action is taken after undo
```

```
fix: deployment badges not updating after environment rename

- renameEnvironment() was not remapping badge keys correctly
- Fixed key reassignment order (set new key before deleting old)
- Added regression test case to progress.md known issues log
```

**Bad examples (do not use):**
```
updated stuff          ← too vague
WIP                   ← never commit WIP
fixed bug             ← which bug?
feat: Added the new undo redo feature with keyboard shortcuts  ← title case, past tense
```

### Branch Strategy for This Repo

You work directly on `main`. Do not create feature branches unless the user explicitly asks. Always pull before starting work.

---

## 6. Session Protocol

### At Session START — Always Do This First

```bash
# Step 1: Pull latest
git pull origin main --ff-only

# Step 2: Confirm clean working tree
git status
# Expected: "nothing to commit, working tree clean"
# If dirty: read the diff, understand what's there before touching anything

# Step 3: Read these files in order
cat progress.md        # What's done, what's pending, what's broken
cat requirements.md    # Full feature spec
cat AGENT.md           # This file — re-read relevant sections

# Step 4: Identify your task
# Pick the FIRST unchecked item in progress.md → Backlog
# If the user gave you a specific task, do that instead
```

### At Session END — Always Do This Last

```bash
# Step 1: Update progress.md
# - Check off everything you completed
# - Add any new backlog items discovered
# - Write a new session entry in the Session Log
# - Note any blockers

# Step 2: Stage and commit progress.md
git add progress.md
git commit -m "docs: update progress.md — session N complete

- Completed: [list what you did]
- Added to backlog: [anything new you found]
- Blockers: [any or 'none']"

# Step 3: Push
git push origin main

# Step 4: Report to the user
# Tell the user:
# - What you built this session
# - What commit(s) were made and their SHAs
# - What the next task is (first unchecked backlog item)
```

---

## 7. Architecture Constraints

### Tech Stack
- **Single file SPA**: `index.html` — all HTML, CSS, and JS in one file (no bundler, no framework)
- **Rendering:** SVG for the flow graph (lanes, edges, nodes)
- **Storage:** Browser `localStorage` only — key: `gitflow_state`
- **Libraries:** Loaded via CDN `<script>` tags (see Section 4)

### File Structure
```
/
├── index.html          ← Entire SPA: HTML + CSS + JS
├── AGENT.md            ← This file
├── requirements.md     ← Feature specs with acceptance criteria
├── progress.md         ← Live build tracker (update every session)
└── .gitignore          ← Should exist; if not, create it (see below)
```

### .gitignore — Create If Missing

```bash
# Check if .gitignore exists
ls .gitignore 2>/dev/null || cat > .gitignore << 'EOF'
.DS_Store
Thumbs.db
*.log
*.tmp
node_modules/
.env
EOF
git add .gitignore
git commit -m "chore: add .gitignore"
git push origin main
```

---

## 8. Core Data Model

All application state lives in a single JSON object in `localStorage`. **Do not change this schema without updating this section and the session log in progress.md.**

```js
{
  "config": {
    "environments": ["Dev", "QAS", "Prod"],          // ordered list, max 5
    "branchColors": {
      "main":    "#00d4ff",
      "feature": "#f59e0b",
      "release": "#10b981",
      "hotfix":  "#ef4444",
      "custom":  "#a855f7"
    }
  },
  "branches": [
    {
      "id":          "uuid-string",                   // never changes after creation
      "name":        "main",                          // must be unique
      "type":        "main|feature|release|hotfix|custom",
      "color":       "#hex or null",                  // null = use type default
      "sourceFrom":  "branch-id or null",             // which branch this was cut from
      "mergesInto":  ["branch-id", ...],              // branches this has been merged into
      "deployments": {
        "Dev":  true,
        "QAS":  false,
        "Prod": false
      },
      "notes":       "optional free text"             // added in v1.1
    }
  ],
  "edges": []  // DERIVED FIELD — always rebuilt by rebuildEdges(), never hand-edit
}
```

### Data Rules
- `edges` is always rebuilt from branch `sourceFrom` and `mergesInto` — never edit it directly
- `id` is set once on creation and never changes
- `deployments` keys must always match `config.environments` exactly (run migration on load)
- `color: null` means "use the type default from config.branchColors"

---

## 9. Rendering Rules

### Graph Layout
- **X-axis (left → right):** Dependency order — source branches appear before the branches they sourced
- **Y-axis (top → bottom):** One horizontal swim lane per branch
- **Lane order (top to bottom):** `main` → `hotfix` → `release` → `feature` → `custom`
- Within the same type, preserve insertion order
- Layout is computed automatically — never hardcode pixel positions

### Node Anatomy (SVG `<g>`)
```
┌─────────────────────────────────────────────────────┐
│ FEATURE           [DEV] [QAS] [PRD]                 │  ← type tag + env badges
│ feature/user-login                                  │  ← branch name (truncated)
└─────────────────────────────────────────────────────┘
  Width: 190px  Height: 52px  rx: 8
  Fill: branchColor + "22" (hex alpha)  Stroke: branchColor
```

### Edge Types
| Type | Style | Meaning |
|---|---|---|
| `source` | Dashed bezier `stroke-dasharray: 6 4` | Branch was cut from another |
| `merge`  | Solid bezier with arrowhead | Branch was merged into another |

Edges always flow left → right. If an edge would need to go right → left, it indicates a layout ordering problem — fix the layout, not the edge direction.

### Environment Badge Colors
Assign colors from this fixed palette by position in `config.environments`:
```js
const ENV_PALETTE = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ef4444'];
// Index 0=Dev(blue), 1=QAS(amber), 2=Prod(green), 3+(purple, red)
```
Filled circle = deployed. Hollow circle with low opacity = not deployed.

---

## 10. Coding Standards

### ID Generation
```js
// Use this pattern — it's already in the app
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
// OR: if Lodash is loaded, _.uniqueId() works for non-persistent IDs
```

### State Cloning
```js
// Use Lodash if available (already loaded), otherwise:
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
// With Lodash: _.cloneDeep(appState)
```

### Save State — Always Call This After Mutations
```js
function saveState() {
  try {
    rebuildEdges();                                    // always sync edges first
    localStorage.setItem('gitflow_state', JSON.stringify(appState));
    const ts = dayjs ? dayjs().format('HH:mm:ss') : new Date().toLocaleTimeString();
    document.getElementById('save-timestamp').textContent = `Saved ${ts}`;
  } catch(e) {
    console.error('Save failed:', e);
    showToast('Save failed — storage may be full', 'error');
  }
}
```

### Debouncing
```js
// If Lodash is loaded, debounce text input handlers:
const debouncedSearch = _.debounce((term) => filterBranches(term), 200);
searchInput.addEventListener('input', e => debouncedSearch(e.target.value));
```

### No Magic Numbers — Use Constants
```js
const NODE_W  = 190;
const NODE_H  = 52;
const LANE_H  = 100;
const H_GAP   = 60;
const MARGIN_X = 80;
const MARGIN_Y = 60;
const MAX_ENVS = 5;
const MAX_UNDO = 20;
```

---

## 11. Error Handling

| Scenario | What To Do |
|---|---|
| `git pull` fails / conflict | Stop. Report files in conflict. Ask user. Do not continue. |
| `git push` fails | Report the error. Check if `origin` is set: `git remote -v`. Do not re-attempt more than once. |
| `localStorage` full | Show error toast. Keep in-memory state. Tell user to export JSON. |
| Circular dependency (branch sources itself) | Block save. Show inline validation error near the Source field. |
| Import of invalid JSON | Show error toast. Leave current state completely untouched. |
| Branch name collision | Block save. Highlight the Name field with an error message. |
| Library CDN fails to load | Detect with `typeof libraryName === 'undefined'` check, fall back to vanilla implementation, log a console warning. |
| Orphaned edge after branch delete | `rebuildEdges()` handles this automatically — edges are always derived, never orphaned. |

### CDN Fallback Pattern
```js
// Example: graceful fallback if Lodash fails to load
const deepClone = (typeof _ !== 'undefined')
  ? (obj) => _.cloneDeep(obj)
  : (obj) => JSON.parse(JSON.stringify(obj));
```

---

## 12. Feature Implementation Playbook

When implementing a new feature, follow this exact order:

```
1. READ the acceptance criteria in requirements.md for that feature
2. PLAN in comments at the top of the code block what you'll add/change
3. IMPLEMENT the feature in index.html
4. VERIFY by mentally tracing the code path end-to-end
5. CHECK for regressions — did you change anything that affects existing features?
6. COMMIT with a descriptive message (Section 5)
7. PUSH to origin
8. UPDATE progress.md — check off the item, add session log entry
9. COMMIT progress.md separately
10. PUSH again
```

### Tooltip Integration (Tippy.js)
When adding tooltips to SVG nodes, Tippy requires DOM elements. Attach to invisible `<div>` overlays positioned over each node, or use foreignObject. Example:

```js
// After rendering nodes, attach tooltips
if (typeof tippy !== 'undefined') {
  document.querySelectorAll('[data-tippy-content]').forEach(el => {
    tippy(el, { theme: 'dark', placement: 'top', arrow: true });
  });
}
```

### Fuse.js Search Integration
```js
let fuseInstance = null;

function initSearch() {
  if (typeof Fuse === 'undefined') return;
  fuseInstance = new Fuse(appState.branches, {
    keys: ['name', 'type'],
    threshold: 0.35,
    includeScore: true
  });
}

function filterBranches(term) {
  if (!term || !fuseInstance) return appState.branches;
  return fuseInstance.search(term).map(r => r.item);
}

// Re-initialise after any state change that modifies branches
function saveState() {
  // ... existing save logic ...
  initSearch(); // keep Fuse index in sync
}
```

### Hotkeys.js Integration
```js
// Register after DOM ready
if (typeof hotkeys !== 'undefined') {
  hotkeys('ctrl+s, cmd+s', (e) => { e.preventDefault(); manualSave(); });
  hotkeys('ctrl+n, cmd+n', (e) => { e.preventDefault(); openAddPanel(); });
  hotkeys('ctrl+z, cmd+z', (e) => { e.preventDefault(); undo(); });
  hotkeys('ctrl+shift+z, cmd+shift+z', (e) => { e.preventDefault(); redo(); });
  hotkeys('escape', () => closeAllPanels());
}
```

---

## 13. Accessibility Requirements

- All interactive elements must have `aria-label` or visible text labels
- SVG canvas: `role="img"` with `aria-label="Git flow visualization canvas"`
- Color is never the only signal — pair with icons or text
- Focus returns to the triggering element when a panel closes
- All panels must set `aria-hidden="true"` when closed, `"false"` when open
- Modal dialogs must trap focus while open

---

## 14. What To Do If You're Unsure

If you encounter any of the following, **stop and ask the user**:

- The requirements are ambiguous or contradictory
- A git push fails and you don't know why
- You'd need to change the data model schema in a breaking way
- You're about to delete or significantly restructure more than 30 lines of existing code
- A library you want to use isn't in Section 4's approved list

Do not guess. Do not silently skip. Ask.

---

## 15. Quick Reference — Key Functions in index.html

| Function | What It Does | When to Call |
|---|---|---|
| `loadState()` | Reads localStorage, falls back to DEFAULT_STATE | Once on page load |
| `saveState()` | Rebuilds edges, writes to localStorage, updates timestamp | After every state mutation |
| `migrateState()` | Syncs branch deployments to current environments | After loadState() and after importJSON() |
| `rebuildEdges()` | Derives all edges from branch sourceFrom + mergesInto | Called inside saveState() — don't call separately |
| `render()` | Full re-render: lanes + edges + nodes + sidebar | After any state change |
| `computeLayout()` | Returns {positions, laneCount} — pixel positions for each branch | Called by render() |
| `getBranchColor(branch)` | Returns hex color (own color || type default) | During node render |
| `getEnvColor(envName)` | Returns hex from ENV_PALETTE by environment index | During badge render |
| `selectBranch(id)` | Highlights node, opens edit panel, sets selectedBranchId | On node click |
| `openAddPanel()` | Opens edit panel in "add" mode with blank form | On "Add Branch" click |
| `closePanel()` | Closes edit panel, clears selection, re-renders | On close/Escape |
| `savePanel()` | Validates form, mutates state, calls saveState() + render() | On "Save Changes" click |
| `deleteBranch()` | Removes branch + updates all referencing branches | On "Delete Branch" click |
| `confirmAction(title, msg, cb)` | Shows confirm dialog, calls cb() on OK | Before destructive actions |
| `showToast(msg, type, ms)` | Shows auto-dismissing toast (info/success/error) | For user feedback |
| `exportJSON()` | Downloads state as .json via FileSaver.js or fallback | On "Export" click |
| `importJSON(event)` | Reads file, validates, confirms, applies state | On file input change |
| `manualSave()` | Calls saveState() + shows success toast | On Save button click |
| `confirmReset()` | Confirms then restores DEFAULT_STATE | On Reset button click |
| `zoomIn/Out/resetView()` | Adjusts SVG transform | Canvas control buttons |
| `openSettings/closeSettings()` | Toggles settings panel | Settings button |
| `renderSettingsPanel()` | Populates settings panel with current config | When opening settings |
| `addEnvironment()` | Adds new env to config + all branch deployments | In settings panel |
| `removeEnvironment(idx)` | Removes env from config + all branch deployments | In settings panel |
| `renameEnvironment(idx, name)` | Renames env key everywhere | In settings panel |
