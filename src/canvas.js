import { appState, selectedBranchId, reorderBranch, saveState } from './state.js';
import { computeLayout, NODE_W, NODE_H, LANE_H, MARGIN_X, MARGIN_Y } from './layout.js';
import { getBranchColor, getEnvColor } from './utils.js';
import { renderSidebar, updateEmptyState } from './sidebar.js';

// selectBranch is injected by main.js via initCanvas(cb) to avoid circular imports
let _selectBranch = () => {};

export let transform = { x: 40, y: 20, scale: 1 };
let isPanning = false;
let panStart = { x: 0, y: 0 };

// ─── Drag-to-reorder state ────────────────────────────────────────────────────
let isDragging = false;
let dragBranchId = null;
let dragGhostEl = null;           // SVG <g> ghost clone
let dropIndicatorEl = null;       // SVG <line> drop indicator
let dropTargetId = null;          // id of the branch we'll insert BEFORE (null = end)
let lastPositions = {};           // cached from last render() call
let dragStartY = 0;               // client Y where the drag started

// ─── Re-exported colour helpers (kept for any legacy callers) ────────────────
export { getBranchColor, getEnvColor } from './utils.js';

export function render() {
  const { positions } = computeLayout();
  lastPositions = positions;
  renderLanes(positions);
  renderEdges(positions);
  renderNodes(positions);
  renderSidebar();
  updateEmptyState();
}

// ─── Lane rendering ──────────────────────────────────────────────────────────
function renderLanes(positions) {
  const layer = document.getElementById('lanes-layer');
  if (!layer) return;
  layer.innerHTML = '';
  const canvasW = 4000;
  const branches = appState.branches;
  const typeOrder = { main: 0, hotfix: 1, release: 2, feature: 3, custom: 4 };
  const sorted = [...branches].sort((a, b) => (typeOrder[a.type] ?? 5) - (typeOrder[b.type] ?? 5));
  sorted.forEach((b, i) => {
    const y = MARGIN_Y + i * LANE_H + NODE_H / 2;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0);
    line.setAttribute('y1', y);
    line.setAttribute('x2', canvasW);
    line.setAttribute('y2', y);
    line.setAttribute('class', 'lane-line');
    layer.appendChild(line);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 12);
    text.setAttribute('y', y);
    text.setAttribute('class', 'lane-label');
    text.textContent = b.name.length > 22 ? b.name.slice(0, 22) + '…' : b.name;
    layer.appendChild(text);
  });
}

// ─── Edge rendering ──────────────────────────────────────────────────────────
function renderEdges(positions) {
  const layer = document.getElementById('edges-layer');
  if (!layer) return;
  layer.innerHTML = '';
  appState.edges.forEach(edge => {
    const from = positions[edge.from];
    const to   = positions[edge.to];
    if (!from || !to) return;
    const isMerge = edge.type === 'merge';
    const fromBranch = appState.branches.find(b => b.id === edge.from);
    const color = fromBranch ? getBranchColor(fromBranch) : '#7d8590';
    const x1 = from.x + NODE_W;
    const y1 = from.y + NODE_H / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_H / 2;
    const midX = (x1 + x2) / 2;
    const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', isMerge ? color : '#484f58');
    path.setAttribute('class', isMerge ? 'edge-merge' : 'edge-source');
    if (isMerge) path.setAttribute('marker-end', 'url(#arrow-end)');
    layer.appendChild(path);
  });
}

// ─── Node rendering ──────────────────────────────────────────────────────────
function renderNodes(positions) {
  const layer = document.getElementById('nodes-layer');
  if (!layer) return;
  layer.innerHTML = '';
  appState.branches.forEach(branch => {
    const pos = positions[branch.id];
    if (!pos) return;
    const color = getBranchColor(branch);
    const isSelected = branch.id === selectedBranchId;
    const isDragged = branch.id === dragBranchId;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `branch-node${isSelected ? ' selected' : ''}${isDragged ? ' dragging' : ''}`);
    g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `Branch: ${branch.name}`);
    g.setAttribute('tabindex', '0');
    g.dataset.branchId = branch.id;
    g.style.cursor = isDragged ? 'grabbing' : 'grab';

    // Click + keyboard (only when not dragging)
    g.addEventListener('click', () => {
      if (!isDragging) _selectBranch(branch.id);
    });
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') _selectBranch(branch.id);
    });

    // Drag handle — mousedown starts drag mode
    g.addEventListener('mousedown', e => {
      // Only primary button
      if (e.button !== 0) return;
      e.stopPropagation(); // prevent canvas pan
      startDrag(branch.id, e, pos);
    });

    // Node background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', NODE_W);
    rect.setAttribute('height', NODE_H);
    rect.setAttribute('rx', 8);
    rect.setAttribute('ry', 8);
    rect.setAttribute('fill', isDragged ? color + '44' : color + '22');
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', isSelected ? '2.5' : '1.5');
    rect.setAttribute('stroke-dasharray', isDragged ? '6 3' : 'none');
    rect.setAttribute('class', 'node-bg');
    g.appendChild(rect);

    if (isSelected && !isDragged) {
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      glow.setAttribute('width', NODE_W + 4);
      glow.setAttribute('height', NODE_H + 4);
      glow.setAttribute('rx', 10);
      glow.setAttribute('ry', 10);
      glow.setAttribute('x', -2);
      glow.setAttribute('y', -2);
      glow.setAttribute('fill', 'none');
      glow.setAttribute('stroke', color);
      glow.setAttribute('stroke-width', '1');
      glow.setAttribute('opacity', '0.3');
      g.insertBefore(glow, rect);
    }

    const typeTag = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    typeTag.setAttribute('x', 10);
    typeTag.setAttribute('y', 14);
    typeTag.setAttribute('class', 'node-type-tag');
    typeTag.setAttribute('fill', color);
    typeTag.setAttribute('opacity', isDragged ? '0.4' : '0.7');
    typeTag.textContent = branch.type.toUpperCase();
    g.appendChild(typeTag);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', 10);
    label.setAttribute('y', 32);
    label.setAttribute('class', 'node-label');
    label.setAttribute('opacity', isDragged ? '0.4' : '1');
    const maxLen = 22;
    label.textContent = branch.name.length > maxLen ? branch.name.slice(0, maxLen) + '…' : branch.name;
    g.appendChild(label);

    const envs = appState.config.environments;
    const badgeStartX = NODE_W - (envs.length * 18) - 6;
    envs.forEach((env, i) => {
      const deployed = branch.deployments && branch.deployments[env];
      const cx = badgeStartX + i * 18 + 8;
      const cy = 14;
      const envColor = getEnvColor(env);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', 5);
      circle.setAttribute('fill', deployed ? envColor : 'transparent');
      circle.setAttribute('stroke', envColor);
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('opacity', isDragged ? '0.2' : deployed ? '1' : '0.4');
      circle.setAttribute('class', 'env-badge-circle');
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${env}: ${deployed ? 'Deployed' : 'Not deployed'}`;
      circle.appendChild(title);
      g.appendChild(circle);

      const envLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      envLabel.setAttribute('x', cx);
      envLabel.setAttribute('y', 23);
      envLabel.setAttribute('text-anchor', 'middle');
      envLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
      envLabel.setAttribute('font-size', '7');
      envLabel.setAttribute('fill', envColor);
      envLabel.setAttribute('opacity', isDragged ? '0.2' : deployed ? '0.9' : '0.3');
      envLabel.textContent = env.slice(0, 3).toUpperCase();
      g.appendChild(envLabel);
    });

    layer.appendChild(g);
  });
}

// ─── Drag-to-reorder implementation ─────────────────────────────────────────

function startDrag(branchId, e, pos) {
  isDragging = true;
  dragBranchId = branchId;
  dragStartY = e.clientY;
  dropTargetId = null;

  // Build a ghost node in the drag-overlay layer
  const branch = appState.branches.find(b => b.id === branchId);
  const color = getBranchColor(branch);

  const overlayLayer = document.getElementById('drag-overlay-layer');
  if (!overlayLayer) return;

  dragGhostEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  dragGhostEl.setAttribute('class', 'drag-ghost');
  dragGhostEl.setAttribute('pointer-events', 'none');
  dragGhostEl.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);

  const ghostRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  ghostRect.setAttribute('width', NODE_W);
  ghostRect.setAttribute('height', NODE_H);
  ghostRect.setAttribute('rx', 8);
  ghostRect.setAttribute('ry', 8);
  ghostRect.setAttribute('fill', color + '33');
  ghostRect.setAttribute('stroke', color);
  ghostRect.setAttribute('stroke-width', '2');
  ghostRect.setAttribute('stroke-dasharray', '6 3');
  dragGhostEl.appendChild(ghostRect);

  const ghostLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  ghostLabel.setAttribute('x', 10);
  ghostLabel.setAttribute('y', 32);
  ghostLabel.setAttribute('class', 'node-label');
  ghostLabel.setAttribute('fill', color);
  const maxLen = 22;
  ghostLabel.textContent = branch.name.length > maxLen ? branch.name.slice(0, maxLen) + '…' : branch.name;
  dragGhostEl.appendChild(ghostLabel);

  overlayLayer.appendChild(dragGhostEl);

  // Drop indicator line
  dropIndicatorEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  dropIndicatorEl.setAttribute('class', 'drop-indicator');
  dropIndicatorEl.setAttribute('x1', MARGIN_X - 10);
  dropIndicatorEl.setAttribute('x2', MARGIN_X + NODE_W + 10);
  dropIndicatorEl.setAttribute('y1', pos.y);
  dropIndicatorEl.setAttribute('y2', pos.y);
  dropIndicatorEl.setAttribute('pointer-events', 'none');
  overlayLayer.appendChild(dropIndicatorEl);

  // Faded original node
  render();
}

function updateDrag(e) {
  if (!isDragging || !dragGhostEl) return;

  // Convert clientY → SVG coordinate taking transform into account
  const dy = (e.clientY - dragStartY) / transform.scale;
  const branch = appState.branches.find(b => b.id === dragBranchId);
  const originalPos = lastPositions[dragBranchId];
  if (!originalPos) return;

  const ghostY = originalPos.y + dy;
  dragGhostEl.setAttribute('transform', `translate(${originalPos.x}, ${ghostY})`);

  // Determine drop target: find which same-type branch the ghost Y is closest to
  const sametype = appState.branches.filter(b => b.type === branch.type && b.id !== dragBranchId);
  let closestId = null;
  let closestDist = Infinity;
  let indicatorY = ghostY;

  sametype.forEach(b => {
    const bPos = lastPositions[b.id];
    if (!bPos) return;
    const midY = bPos.y + NODE_H / 2;
    const dist = Math.abs(ghostY + NODE_H / 2 - midY);
    if (dist < closestDist) {
      closestDist = dist;
      closestId = b.id;
      // Indicator sits ABOVE the closest branch when ghost is above its mid, else BELOW
      indicatorY = ghostY + NODE_H / 2 < midY ? bPos.y - 4 : bPos.y + NODE_H + 4;
    }
  });

  dropTargetId = closestId;

  // Update indicator position
  if (dropIndicatorEl) {
    dropIndicatorEl.setAttribute('y1', indicatorY);
    dropIndicatorEl.setAttribute('y2', indicatorY);
    // Show colour of the dragged branch
    const color = getBranchColor(branch);
    dropIndicatorEl.setAttribute('stroke', color);
  }
}

function endDrag() {
  if (!isDragging) return;

  const overlayLayer = document.getElementById('drag-overlay-layer');
  if (overlayLayer) overlayLayer.innerHTML = '';
  dragGhostEl = null;
  dropIndicatorEl = null;

  if (dropTargetId) {
    // Determine if ghost is ABOVE or BELOW the target to choose insert position
    const branch = appState.branches.find(b => b.id === dragBranchId);
    const originalPos = lastPositions[dragBranchId];
    const targetPos = lastPositions[dropTargetId];
    if (originalPos && targetPos) {
      const ghostCenterY = originalPos.y + (dragStartY > 0 ? 0 : 0) + NODE_H / 2;
      const targetCenterY = targetPos.y + NODE_H / 2;
      // If ghost center is above target center → insert BEFORE target;
      // otherwise insert AFTER (use the next sibling as beforeId)
      const dragEl = document.querySelector(`[data-branch-id="${dragBranchId}"]`);
      const currentClientY = dragEl
        ? dragEl.getBoundingClientRect().top + NODE_H / 2
        : ghostCenterY;

      const reinsertBeforeId = currentClientY < targetPos.y + NODE_H / 2 * transform.scale
        ? dropTargetId
        : getNextSiblingId(dropTargetId, branch.type);

      const changed = reorderBranch(dragBranchId, reinsertBeforeId);
      if (changed) {
        saveState();
      }
    }
  }

  isDragging = false;
  dragBranchId = null;
  dropTargetId = null;
  render();
}

/** Returns the id of the next same-type branch after `afterId`, or null if last. */
function getNextSiblingId(afterId, type) {
  const sameType = appState.branches.filter(b => b.type === type);
  const idx = sameType.findIndex(b => b.id === afterId);
  return idx >= 0 && idx < sameType.length - 1 ? sameType[idx + 1].id : null;
}

// ─── Canvas transform ────────────────────────────────────────────────────────
export function applyTransform() {
  const g = document.getElementById('canvas-transform-group');
  if (g) {
    g.setAttribute('transform', `translate(${transform.x},${transform.y}) scale(${transform.scale})`);
  }
  const display = document.getElementById('zoom-display');
  if (display) {
    display.textContent = Math.round(transform.scale * 100) + '%';
  }
}

export function zoomIn() {
  transform.scale = Math.min(2.5, transform.scale + 0.15);
  applyTransform();
}

export function zoomOut() {
  transform.scale = Math.max(0.3, transform.scale - 0.15);
  applyTransform();
}

export function resetView() {
  transform = { x: 40, y: 20, scale: 1 };
  applyTransform();
}

// ─── Canvas initialisation ───────────────────────────────────────────────────
export function initCanvas(onSelectBranch) {
  if (onSelectBranch) _selectBranch = onSelectBranch;

  // Ensure the drag-overlay SVG layer exists
  const transformGroup = document.getElementById('canvas-transform-group');
  if (transformGroup && !document.getElementById('drag-overlay-layer')) {
    const overlayLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    overlayLayer.setAttribute('id', 'drag-overlay-layer');
    transformGroup.appendChild(overlayLayer);
  }

  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) return;

  // Canvas pan — only when not dragging a node
  wrapper.addEventListener('mousedown', e => {
    if (isDragging) return;
    if (e.target === wrapper || e.target.id === 'svg-canvas' || e.target.id === 'canvas-transform-group'
        || e.target.classList.contains('lane-line') || e.target.classList.contains('lane-label')) {
      isPanning = true;
      panStart = { x: e.clientX - transform.x, y: e.clientY - transform.y };
      wrapper.classList.add('panning');
    }
  });

  window.addEventListener('mousemove', e => {
    if (isDragging) {
      updateDrag(e);
    } else if (isPanning) {
      transform.x = e.clientX - panStart.x;
      transform.y = e.clientY - panStart.y;
      applyTransform();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      endDrag();
    }
    isPanning = false;
    wrapper.classList.remove('panning');
  });

  wrapper.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(2.5, Math.max(0.3, transform.scale + delta));
    const rect = wrapper.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    transform.x = mx - (mx - transform.x) * (newScale / transform.scale);
    transform.y = my - (my - transform.y) * (newScale / transform.scale);
    transform.scale = newScale;
    applyTransform();
  }, { passive: false });

  // Canvas control buttons
  const zInBtn = wrapper.querySelector('.canvas-ctrl-btn[aria-label="Zoom in"]');
  const zOutBtn = wrapper.querySelector('.canvas-ctrl-btn[aria-label="Zoom out"]');
  const zResetBtn = wrapper.querySelector('.canvas-ctrl-btn[aria-label="Reset view"]');
  if (zInBtn) zInBtn.addEventListener('click', zoomIn);
  if (zOutBtn) zOutBtn.addEventListener('click', zoomOut);
  if (zResetBtn) zResetBtn.addEventListener('click', resetView);
}
