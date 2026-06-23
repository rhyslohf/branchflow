import { appState } from './state.js';

export const NODE_W = 190;
export const NODE_H = 52;
export const LANE_H = 100;
export const H_GAP = 60;
export const MARGIN_X = 80;
export const MARGIN_Y = 60;

export function computeLayout() {
  const branches = appState.branches;
  if (!branches.length) return { positions: {}, laneCount: 0 };

  // Assign lanes: main=0, hotfix first above, then features, then release below
  const typeOrder = { main: 0, hotfix: 1, release: 2, feature: 3, custom: 4 };
  const sorted = [...branches].sort((a, b) => (typeOrder[a.type] ?? 5) - (typeOrder[b.type] ?? 5));

  const laneMap = {}; // branchId -> laneIndex
  sorted.forEach((b, i) => {
    laneMap[b.id] = i;
  });

  // Topological sort by source dependency for X ordering
  const idxMap = {};
  branches.forEach(b => {
    idxMap[b.id] = b;
  });

  // BFS/DFS from roots to calculate depth (dependency distance)
  const depths = {};
  const getDepth = (b, visited = new Set()) => {
    if (depths[b.id] !== undefined) return depths[b.id];
    if (visited.has(b.id)) return 0;
    visited.add(b.id);
    if (!b.sourceFrom || !idxMap[b.sourceFrom]) {
      depths[b.id] = 0;
    } else {
      depths[b.id] = getDepth(idxMap[b.sourceFrom], visited) + 1;
    }
    return depths[b.id];
  };
  branches.forEach(b => getDepth(b));

  // Build positions
  const positions = {};
  branches.forEach(b => {
    const lane = laneMap[b.id];
    const depth = depths[b.id] || 0;
    positions[b.id] = {
      x: MARGIN_X + depth * (NODE_W + H_GAP),
      y: MARGIN_Y + lane * LANE_H
    };
  });

  const laneCount = branches.length;
  return { positions, laneCount };
}
