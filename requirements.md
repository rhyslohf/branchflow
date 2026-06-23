# requirements.md — GitFlow Visualizer SPA

## Product Overview

A full-page single-page web application that visualizes a software team's branch structure and deployment states across three environments (Dev, QAS, Prod). The visualization is a **left-to-right dependency flow graph** — not time-based — representing branch relationships (source cuts and merges) and deployment status as nodes in a swimlane diagram.

---

## User Stories

### US-01: View Branch Flow
**As a** developer  
**I want to** see all active branches laid out in a left-to-right flow  
**So that** I can understand the dependency chain and current deployment states at a glance

**Acceptance Criteria:**
- [ ] All branches appear as labeled nodes in horizontal swim lanes
- [ ] `main` branch is always the topmost lane
- [ ] Branches flow left to right based on dependency order (source first)
- [ ] Edges connect related branches (source cut = dashed, merge = solid arrow)
- [ ] Each node displays the branch name
- [ ] Each node displays deployment badges for Dev, QAS, Prod
- [ ] Badges visually indicate deployed (filled) vs not deployed (hollow/faded)

---

### US-02: Add a New Branch
**As a** developer  
**I want to** add a new branch via a GUI form  
**So that** I don't need to manually edit JSON or code

**Acceptance Criteria:**
- [ ] "Add Branch" button opens a right-side panel/modal
- [ ] Form fields: Name (text), Type (dropdown: main / feature / release / hotfix / custom), Color (color picker), Source Branch (dropdown of existing branches or "none"), Deployment status per environment (checkboxes: Dev, QAS, Prod)
- [ ] Saving adds the branch to the canvas immediately
- [ ] Branch name must be unique and non-empty (validate before save)
- [ ] New branch appears as a new swimlane row

---

### US-03: Edit an Existing Branch
**As a** developer  
**I want to** click a branch node to open its edit form  
**So that** I can update its name, deployments, or relationships

**Acceptance Criteria:**
- [ ] Clicking a node selects it (visual highlight)
- [ ] Right panel populates with current branch data
- [ ] All fields editable: name, type, color, source, merge targets, deployments
- [ ] Saving applies changes and re-renders graph immediately
- [ ] Cancel/close discards unsaved changes

---

### US-04: Mark Branch as Merged
**As a** developer  
**I want to** indicate that a branch has been merged into another branch  
**So that** the flow shows where code went

**Acceptance Criteria:**
- [ ] Branch edit panel includes a "Merge Into" multi-select dropdown
- [ ] Selecting target branches creates merge edges (solid arrows) on the canvas
- [ ] A branch can merge into multiple targets (e.g., feature → main AND feature → release)
- [ ] Removing a merge target removes the corresponding edge
- [ ] Merged status is visually distinct from source/cut relationships

---

### US-05: Configure Environments
**As a** team lead  
**I want to** configure which environments are tracked  
**So that** the app matches our team's actual pipeline

**Acceptance Criteria:**
- [ ] Default environments: Dev, QAS, Prod
- [ ] Settings panel allows adding/removing/renaming environments
- [ ] Environment changes reflect immediately in all node deployment badges
- [ ] Environment names are stored in config (not hardcoded)
- [ ] Maximum 5 environments supported

---

### US-06: Configure Branch Colors
**As a** developer  
**I want to** define colors per branch type  
**So that** the graph is visually legible and matches our conventions

**Acceptance Criteria:**
- [ ] Default colors per type: main=cyan, feature=amber, release=green, hotfix=red, custom=purple
- [ ] Color picker in branch edit panel overrides the type default for that branch
- [ ] Type-level default colors configurable in a settings panel
- [ ] Colors are hex values stored in config

---

### US-07: Save and Restore State
**As a** developer  
**I want to** have all my branches and graph configuration automatically saved  
**So that** I don't lose my work on page refresh

**Acceptance Criteria:**
- [ ] All state auto-saves to `localStorage` key `gitflow_state` on every change
- [ ] On page load, state is restored from localStorage if present
- [ ] If no state exists, a sensible default state is loaded (main branch pre-populated)
- [ ] "Save" button in toolbar provides manual save confirmation
- [ ] Last-saved timestamp shown in toolbar

---

### US-08: Export and Import State
**As a** developer  
**I want to** export the current state as a JSON file and import it back  
**So that** I can share configurations with teammates or back up my work

**Acceptance Criteria:**
- [ ] "Export JSON" button downloads `gitflow-state.json`
- [ ] "Import JSON" button opens file picker, reads JSON, validates schema, applies state
- [ ] Import shows a confirmation dialog showing what will be replaced
- [ ] Invalid JSON shows an error message, leaves current state untouched

---

### US-09: Canvas Navigation
**As a** developer  
**I want to** pan and zoom the canvas  
**So that** I can navigate large branch graphs comfortably

**Acceptance Criteria:**
- [ ] Mouse wheel zooms in/out (range: 0.5x to 2.5x)
- [ ] Click and drag on empty canvas area pans the view
- [ ] "Reset View" button returns to default zoom and pan
- [ ] Zoom level indicator shown (e.g., "120%")

---

### US-10: Delete a Branch
**As a** developer  
**I want to** remove a branch from the graph  
**So that** stale or merged-and-closed branches don't clutter the view

**Acceptance Criteria:**
- [ ] "Delete Branch" button in edit panel, requires confirmation
- [ ] Deleting a branch removes all source and merge edges connected to it
- [ ] Other branches that referenced this branch as a source or merge target are updated
- [ ] Cannot delete the last remaining `main` branch

---

### US-11: Branch Dependency Ordering
**As a** developer  
**I want to** branches to auto-arrange left to right based on dependency  
**So that** the graph always reads in logical dependency order

**Acceptance Criteria:**
- [ ] Root branches (no source) always appear leftmost
- [ ] A branch always renders to the RIGHT of its source branch
- [ ] If branch A merges into branch B, A appears to the LEFT of the merge edge connection on B
- [ ] No manual positioning required (auto-layout)
- [ ] Agent may optionally support drag-to-reorder within a lane

---

## Non-Functional Requirements

| # | Requirement | Detail |
|---|---|---|
| NFR-01 | No build tools | The app must run by opening `index.html` in a browser with no server |
| NFR-02 | No frameworks | Vanilla JS only (no React, Vue, Angular) |
| NFR-03 | Single file | All CSS and JS embedded in `index.html` |
| NFR-04 | Responsive | Minimum viable layout at 1280px width; optimized for 1920px |
| NFR-05 | Performance | Graph renders in < 200ms for up to 50 branches |
| NFR-06 | Dark mode | Default dark theme; no light mode needed |
| NFR-07 | Fonts | JetBrains Mono (code/labels), Inter (UI chrome) via Google Fonts CDN |

---

## Default State (Initial Load)

When no `localStorage` data exists, pre-populate with:

```json
{
  "config": {
    "environments": ["Dev", "QAS", "Prod"],
    "branchColors": {
      "main": "#00d4ff",
      "feature": "#f59e0b",
      "release": "#10b981",
      "hotfix": "#ef4444",
      "custom": "#a855f7"
    }
  },
  "branches": [
    {
      "id": "branch-main",
      "name": "main",
      "type": "main",
      "color": null,
      "sourceFrom": null,
      "mergesInto": [],
      "deployments": { "Dev": true, "QAS": true, "Prod": true },
      "position": { "lane": 0, "order": 0 }
    },
    {
      "id": "branch-feature-login",
      "name": "feature/user-login",
      "type": "feature",
      "color": null,
      "sourceFrom": "branch-main",
      "mergesInto": ["branch-main"],
      "deployments": { "Dev": true, "QAS": false, "Prod": false },
      "position": { "lane": 1, "order": 1 }
    },
    {
      "id": "branch-release-1",
      "name": "release/1.0",
      "type": "release",
      "color": null,
      "sourceFrom": "branch-main",
      "mergesInto": [],
      "deployments": { "Dev": true, "QAS": true, "Prod": false },
      "position": { "lane": 2, "order": 2 }
    }
  ],
  "edges": [
    { "id": "e1", "from": "branch-main", "to": "branch-feature-login", "type": "source" },
    { "id": "e2", "from": "branch-feature-login", "to": "branch-main", "type": "merge" },
    { "id": "e3", "from": "branch-main", "to": "branch-release-1", "type": "source" }
  ]
}
```

---

## Out of Scope (v1)

- Real git integration (no GitHub/GitLab API)
- Multi-user collaboration
- Authentication
- Backend / server-side storage
- CI/CD pipeline integration
- Time-based views or commit history
- Branch diff views
