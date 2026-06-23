import { appState, selectedBranchId } from './state.js';
import { computeLayout, NODE_W, NODE_H, LANE_H, H_GAP, MARGIN_X, MARGIN_Y } from './layout.js';
import { selectBranch } from './editor.js';
import { renderSidebar, updateEmptyState } from './sidebar.js';

export let transform = { x: 40, y: 20, scale: 1 };
let isPanning = false;
let panStart = { x: 0, y: 0 };

export function getBranchColor(branch) {
  if (branch.color) return branch.color;
  return appState.config.branchColors[branch.type] || '#7d8590';
}

export function getEnvColor(envName) {
  const idx = appState.config.environments.indexOf(envName);
  const palette = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ef4444'];
  return palette[idx % palette.length];
}

export function render() {
  const { positions, laneCount } = computeLayout();
  renderLanes(positions);
  renderEdges(positions);
  renderNodes(positions);
  renderSidebar();
  updateEmptyState();
}

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
    // Lane dashed line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0);
    line.setAttribute('y1', y);
    line.setAttribute('x2', canvasW);
    line.setAttribute('y2', y);
    line.setAttribute('class', 'lane-line');
    layer.appendChild(line);
    // Lane label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 12);
    text.setAttribute('y', y);
    text.setAttribute('class', 'lane-label');
    text.textContent = b.name.length > 22 ? b.name.slice(0, 22) + '…' : b.name;
    layer.appendChild(text);
  });
}

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
    if (isMerge) {
      path.setAttribute('marker-end', 'url(#arrow-end)');
    }
    layer.appendChild(path);
  });
}

function renderNodes(positions) {
  const layer = document.getElementById('nodes-layer');
  if (!layer) return;
  layer.innerHTML = '';
  appState.branches.forEach(branch => {
    const pos = positions[branch.id];
    if (!pos) return;
    const color = getBranchColor(branch);
    const isSelected = branch.id === selectedBranchId;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `branch-node${isSelected ? ' selected' : ''}`);
    g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `Branch: ${branch.name}`);
    g.setAttribute('tabindex', '0');
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => selectBranch(branch.id));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectBranch(branch.id); });

    // Node background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', NODE_W);
    rect.setAttribute('height', NODE_H);
    rect.setAttribute('rx', 8);
    rect.setAttribute('ry', 8);
    rect.setAttribute('fill', color + '22');
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', isSelected ? '2.5' : '1.5');
    rect.setAttribute('class', 'node-bg');
    g.appendChild(rect);

    // Glow effect when selected
    if (isSelected) {
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

    // Type tag
    const typeTag = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    typeTag.setAttribute('x', 10);
    typeTag.setAttribute('y', 14);
    typeTag.setAttribute('class', 'node-type-tag');
    typeTag.setAttribute('fill', color);
    typeTag.setAttribute('opacity', '0.7');
    typeTag.textContent = branch.type.toUpperCase();
    g.appendChild(typeTag);

    // Branch name label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', 10);
    label.setAttribute('y', 32);
    label.setAttribute('class', 'node-label');
    const maxLen = 22;
    label.textContent = branch.name.length > maxLen ? branch.name.slice(0, maxLen) + '…' : branch.name;
    g.appendChild(label);

    // Deployment badges
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
      circle.setAttribute('opacity', deployed ? '1' : '0.4');
      circle.setAttribute('class', 'env-badge-circle');
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${env}: ${deployed ? 'Deployed' : 'Not deployed'}`;
      circle.appendChild(title);
      g.appendChild(circle);

      // Env name below dot
      const envLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      envLabel.setAttribute('x', cx);
      envLabel.setAttribute('y', 23);
      envLabel.setAttribute('text-anchor', 'middle');
      envLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
      envLabel.setAttribute('font-size', '7');
      envLabel.setAttribute('fill', envColor);
      envLabel.setAttribute('opacity', deployed ? '0.9' : '0.3');
      envLabel.textContent = env.slice(0, 3).toUpperCase();
      g.appendChild(envLabel);
    });

    layer.appendChild(g);
  });
}

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

export function initCanvas() {
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) return;

  wrapper.addEventListener('mousedown', e => {
    if (e.target === wrapper || e.target.id === 'svg-canvas' || e.target.id === 'canvas-transform-group'
        || e.target.classList.contains('lane-line') || e.target.classList.contains('lane-label')) {
      isPanning = true;
      panStart = { x: e.clientX - transform.x, y: e.clientY - transform.y };
      wrapper.classList.add('panning');
    }
  });

  window.addEventListener('mousemove', e => {
    if (!isPanning) return;
    transform.x = e.clientX - panStart.x;
    transform.y = e.clientY - panStart.y;
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
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

  // Attach control buttons programmatically
  const zInBtn = wrapper.querySelector('.canvas-ctrl-btn[aria-label="Zoom in"]');
  const zOutBtn = wrapper.querySelector('.canvas-ctrl-btn[aria-label="Zoom out"]');
  const zResetBtn = wrapper.querySelector('.canvas-ctrl-btn[aria-label="Reset view"]');

  if (zInBtn) zInBtn.addEventListener('click', zoomIn);
  if (zOutBtn) zOutBtn.addEventListener('click', zoomOut);
  if (zResetBtn) zResetBtn.addEventListener('click', resetView);
}
