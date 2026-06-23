import { appState, selectedBranchId } from './state.js';
import { getBranchColor } from './canvas.js';
import { selectBranch } from './editor.js';

export function renderSidebar() {
  const list = document.getElementById('branch-list');
  if (!list) return;
  list.innerHTML = '';
  
  const countEl = document.getElementById('branch-count');
  if (countEl) {
    countEl.textContent = appState.branches.length;
  }

  const typeOrder = { main: 0, hotfix: 1, release: 2, feature: 3, custom: 4 };
  const sorted = [...appState.branches].sort((a, b) => (typeOrder[a.type] ?? 5) - (typeOrder[b.type] ?? 5));

  sorted.forEach(b => {
    const color = getBranchColor(b);
    const item = document.createElement('div');
    item.className = `branch-item${b.id === selectedBranchId ? ' active' : ''}`;
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `${b.name} — ${b.type}`);
    if (b.id === selectedBranchId) {
      item.style.setProperty('--item-color', color);
    }
    item.innerHTML = `
      <span class="branch-color-dot" style="background:${color};"></span>
      <span class="branch-item-name">${b.name}</span>
      <span class="branch-item-type">${b.type}</span>
    `;
    item.addEventListener('click', () => selectBranch(b.id));
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectBranch(b.id); });
    list.appendChild(item);
  });
}

export function updateEmptyState() {
  const es = document.getElementById('empty-state');
  if (es) {
    es.classList.toggle('visible', appState.branches.length === 0);
  }
}
