import { appState } from './state.js';

// ─── Branch & Environment colour helpers ────────────────────────────────────
// Kept in a dedicated module so canvas.js, editor.js, and sidebar.js can all
// import from here without creating circular import chains.

export function getBranchColor(branch) {
  if (branch.color) return branch.color;
  return appState.config.branchColors[branch.type] || '#7d8590';
}

export const ENV_PALETTE = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ef4444'];

export function getEnvColor(envName) {
  const idx = appState.config.environments.indexOf(envName);
  return ENV_PALETTE[idx % ENV_PALETTE.length];
}
