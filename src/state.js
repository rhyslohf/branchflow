import { cloneDeep } from 'lodash';
import dayjs from 'dayjs';
import { showToast } from './dialogs.js';

export const DEFAULT_STATE = {
  config: {
    environments: ['Dev', 'QAS', 'Prod'],
    branchColors: {
      main:    '#00d4ff',
      feature: '#f59e0b',
      release: '#10b981',
      hotfix:  '#ef4444',
      custom:  '#a855f7'
    }
  },
  branches: [
    {
      id: 'branch-main',
      name: 'main',
      type: 'main',
      color: null,
      sourceFrom: null,
      mergesInto: [],
      deployments: { Dev: true, QAS: true, Prod: true }
    },
    {
      id: 'branch-feature-login',
      name: 'feature/user-login',
      type: 'feature',
      color: null,
      sourceFrom: 'branch-main',
      mergesInto: ['branch-main'],
      deployments: { Dev: true, QAS: false, Prod: false }
    },
    {
      id: 'branch-release-1',
      name: 'release/1.0',
      type: 'release',
      color: null,
      sourceFrom: 'branch-main',
      mergesInto: [],
      deployments: { Dev: true, QAS: true, Prod: false }
    },
    {
      id: 'branch-hotfix-1',
      name: 'hotfix/patch-auth',
      type: 'hotfix',
      color: null,
      sourceFrom: 'branch-main',
      mergesInto: ['branch-main'],
      deployments: { Dev: true, QAS: true, Prod: true }
    }
  ],
  edges: []
};

const STORAGE_KEY = 'gitflow_state';
export let appState = null;
export let selectedBranchId = null;

export function setSelectedBranchId(id) {
  selectedBranchId = id;
}

// Reassign appState (with ES live bindings, this propagates)
export function setAppState(newState) {
  appState = newState;
}

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      appState = JSON.parse(raw);
      migrateState();
      showToast('State restored from local storage', 'success');
    } else {
      appState = cloneDeep(DEFAULT_STATE);
      rebuildEdges();
    }
  } catch (e) {
    console.error('Failed to load state:', e);
    appState = cloneDeep(DEFAULT_STATE);
    rebuildEdges();
  }
}

export function migrateState() {
  const envs = appState.config.environments;
  appState.branches.forEach(b => {
    if (!b.deployments) b.deployments = {};
    envs.forEach(env => {
      if (b.deployments[env] === undefined) b.deployments[env] = false;
    });
    if (!b.color) b.color = null;
    if (!b.mergesInto) b.mergesInto = [];
  });
  rebuildEdges();
}

export function saveState() {
  try {
    rebuildEdges();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    const ts = dayjs().format('HH:mm:ss');
    const tsEl = document.getElementById('save-timestamp');
    if (tsEl) {
      tsEl.textContent = `Saved ${ts}`;
    }
  } catch (e) {
    console.error('Save failed:', e);
    showToast('Save failed — storage may be full', 'error');
  }
}

export function rebuildEdges() {
  appState.edges = [];
  appState.branches.forEach(b => {
    if (b.sourceFrom) {
      const sourceExists = appState.branches.find(x => x.id === b.sourceFrom);
      if (sourceExists) {
        appState.edges.push({ id: uuid(), from: b.sourceFrom, to: b.id, type: 'source' });
      }
    }
    (b.mergesInto || []).forEach(targetId => {
      const targetExists = appState.branches.find(x => x.id === targetId);
      if (targetExists) {
        appState.edges.push({ id: uuid(), from: b.id, to: targetId, type: 'merge' });
      }
    });
  });
}

export function manualSave() {
  saveState();
  showToast('Saved to local storage ✓', 'success');
}

/**
 * Move the branch with `fromId` to sit immediately BEFORE the branch with
 * `beforeId` in appState.branches, but only when both share the same type.
 * If `beforeId` is null the branch is moved to the end of its type group.
 * Returns true if a reorder occurred, false if it was a no-op.
 */
export function reorderBranch(fromId, beforeId) {
  if (fromId === beforeId) return false;

  const fromBranch = appState.branches.find(b => b.id === fromId);
  const beforeBranch = beforeId ? appState.branches.find(b => b.id === beforeId) : null;

  // Cross-type drops are blocked
  if (beforeBranch && beforeBranch.type !== fromBranch.type) return false;

  // Remove fromBranch from the array
  const arr = appState.branches;
  const fromIdx = arr.findIndex(b => b.id === fromId);
  arr.splice(fromIdx, 1);

  if (beforeBranch) {
    const targetIdx = arr.findIndex(b => b.id === beforeId);
    arr.splice(targetIdx, 0, fromBranch);
  } else {
    // No target — append after the last branch of the same type
    let lastIdx = -1;
    arr.forEach((b, i) => { if (b.type === fromBranch.type) lastIdx = i; });
    arr.splice(lastIdx + 1, 0, fromBranch);
  }

  return true;
}
