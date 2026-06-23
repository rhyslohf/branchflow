import { appState, selectedBranchId, setSelectedBranchId, saveState, uuid } from './state.js';
import { confirmAction, showToast } from './dialogs.js';
import { render, getBranchColor, getEnvColor } from './canvas.js';

export let editMode = 'edit'; // 'edit' | 'add'

export function selectBranch(id) {
  setSelectedBranchId(id);
  editMode = 'edit';
  const branch = appState.branches.find(b => b.id === id);
  if (!branch) return;
  populatePanel(branch);
  openPanel();
  render();
}

export function openAddPanel() {
  setSelectedBranchId(null);
  editMode = 'add';
  populatePanel(null);
  openPanel();
  render();
}

export function populatePanel(branch) {
  const isNew = !branch;
  const titleEl = document.getElementById('panel-title');
  const deleteBtn = document.getElementById('btn-delete-panel');
  const branchIdInput = document.getElementById('edit-branch-id');
  const nameInput = document.getElementById('edit-name');
  const typeSelect = document.getElementById('edit-type');
  const colorInput = document.getElementById('edit-color');
  const colorDisplay = document.getElementById('edit-color-display');

  if (titleEl) titleEl.textContent = isNew ? 'Add Branch' : 'Edit Branch';
  if (deleteBtn) deleteBtn.style.display = isNew ? 'none' : '';
  if (branchIdInput) branchIdInput.value = branch ? branch.id : '';
  if (nameInput) nameInput.value = branch ? branch.name : '';
  if (typeSelect) typeSelect.value = branch ? branch.type : 'feature';
  
  const color = branch ? (branch.color || appState.config.branchColors[branch.type] || '#00d4ff') : '#f59e0b';
  if (colorInput) colorInput.value = color;
  if (colorDisplay) colorDisplay.textContent = color;

  // Hide errors
  document.querySelectorAll('.form-error').forEach(e => {
    e.textContent = '';
    e.classList.remove('visible');
  });

  // Source dropdown
  const sourceEl = document.getElementById('edit-source');
  if (sourceEl) {
    sourceEl.innerHTML = '<option value="">(none — root branch)</option>';
    appState.branches.forEach(b => {
      if (branch && b.id === branch.id) return;
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      if (branch && branch.sourceFrom === b.id) opt.selected = true;
      sourceEl.appendChild(opt);
    });
  }

  // Merges-into multi-select
  const mergesEl = document.getElementById('edit-merges-into');
  if (mergesEl) {
    mergesEl.innerHTML = '';
    appState.branches.forEach(b => {
      if (branch && b.id === branch.id) return;
      const id = `merge-check-${b.id}`;
      const item = document.createElement('div');
      item.className = 'multi-select-item';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.id = id;
      chk.value = b.id;
      chk.checked = branch && branch.mergesInto && branch.mergesInto.includes(b.id);
      const lbl = document.createElement('label');
      lbl.htmlFor = id;
      const dot = document.createElement('span');
      dot.className = 'branch-color-dot';
      dot.style.background = getBranchColor(b);
      lbl.appendChild(dot);
      lbl.appendChild(document.createTextNode(' ' + b.name));
      item.appendChild(chk);
      item.appendChild(lbl);
      mergesEl.appendChild(item);
    });
  }

  // Deployments
  const deplEl = document.getElementById('edit-deployments');
  if (deplEl) {
    deplEl.innerHTML = '';
    appState.config.environments.forEach(env => {
      const id = `depl-${env}`;
      const item = document.createElement('div');
      item.className = 'checkbox-item';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.id = id;
      chk.checked = branch && branch.deployments && branch.deployments[env];
      const lbl = document.createElement('label');
      lbl.htmlFor = id;
      const dot = document.createElement('span');
      dot.className = 'env-dot';
      dot.style.background = getEnvColor(env);
      lbl.appendChild(dot);
      lbl.appendChild(document.createTextNode(' ' + env));
      item.appendChild(chk);
      item.appendChild(lbl);
      deplEl.appendChild(item);
    });
  }
}

export function openPanel() {
  const panel = document.getElementById('edit-panel');
  if (panel) {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
  }
  const nameInput = document.getElementById('edit-name');
  if (nameInput) {
    setTimeout(() => nameInput.focus(), 50);
  }
}

export function closePanel() {
  const panel = document.getElementById('edit-panel');
  if (panel) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }
  setSelectedBranchId(null);
  render();
}

function onTypeChange() {
  const typeSelect = document.getElementById('edit-type');
  const colorInput = document.getElementById('edit-color');
  const colorDisplay = document.getElementById('edit-color-display');
  if (!typeSelect || !colorInput || !colorDisplay) return;

  const type = typeSelect.value;
  const defaultColor = appState.config.branchColors[type] || '#7d8590';
  colorInput.value = defaultColor;
  colorDisplay.textContent = defaultColor;
}

function clearColorOverride() {
  const typeSelect = document.getElementById('edit-type');
  const colorInput = document.getElementById('edit-color');
  const colorDisplay = document.getElementById('edit-color-display');
  if (!typeSelect || !colorInput || !colorDisplay) return;

  const type = typeSelect.value;
  const defaultColor = appState.config.branchColors[type] || '#7d8590';
  colorInput.value = defaultColor;
  colorDisplay.textContent = defaultColor;
  showToast('Using type default color', 'info', 1500);
}

export function savePanel() {
  const idInput = document.getElementById('edit-branch-id');
  const nameInput = document.getElementById('edit-name');
  const typeSelect = document.getElementById('edit-type');
  const colorInput = document.getElementById('edit-color');
  const sourceSelect = document.getElementById('edit-source');

  if (!idInput || !nameInput || !typeSelect || !colorInput || !sourceSelect) return;

  const id = idInput.value;
  const name = nameInput.value.trim();
  const type = typeSelect.value;
  const color = colorInput.value;
  const sourceFrom = sourceSelect.value || null;

  // Validation
  let valid = true;
  const setErr = (elId, msg) => {
    const el = document.getElementById(elId);
    if (el) {
      el.textContent = msg;
      el.classList.toggle('visible', !!msg);
    }
    if (msg) valid = false;
  };

  setErr('err-name', '');
  setErr('err-source', '');

  if (!name) {
    setErr('err-name', 'Branch name is required.');
  }
  const nameConflict = appState.branches.find(b => b.name === name && b.id !== id);
  if (nameConflict) {
    setErr('err-name', 'A branch with this name already exists.');
  }
  if (sourceFrom === id) {
    setErr('err-source', 'A branch cannot source from itself.');
  }
  if (!valid) return;

  // Gather merge targets
  const mergeChecks = document.querySelectorAll('#edit-merges-into input[type="checkbox"]:checked');
  const mergesInto = Array.from(mergeChecks).map(c => c.value);

  // Gather deployments
  const deployments = {};
  appState.config.environments.forEach(env => {
    const chk = document.getElementById(`depl-${env}`);
    deployments[env] = chk ? chk.checked : false;
  });

  // Determine if color is different from type default
  const typeDefault = appState.config.branchColors[type] || '#7d8590';
  const colorOverride = color !== typeDefault ? color : null;

  if (editMode === 'add') {
    const newBranch = {
      id: uuid(),
      name,
      type,
      color: colorOverride,
      sourceFrom,
      mergesInto,
      deployments
    };
    appState.branches.push(newBranch);
    setSelectedBranchId(newBranch.id);
    showToast(`Branch "${name}" added`, 'success');
  } else {
    const branch = appState.branches.find(b => b.id === id);
    if (!branch) return;
    branch.name = name;
    branch.type = type;
    branch.color = colorOverride;
    branch.sourceFrom = sourceFrom;
    branch.mergesInto = mergesInto;
    branch.deployments = deployments;
    showToast(`Branch "${name}" updated`, 'success');
  }

  saveState();
  render();

  // If we just added, switch to edit mode for the new branch
  if (editMode === 'add') {
    editMode = 'edit';
    idInput.value = selectedBranchId;
    const deleteBtn = document.getElementById('btn-delete-panel');
    if (deleteBtn) deleteBtn.style.display = '';
    const titleEl = document.getElementById('panel-title');
    if (titleEl) titleEl.textContent = 'Edit Branch';
    
    const branch = appState.branches.find(b => b.id === selectedBranchId);
    if (branch) populatePanel(branch);
  }
}

export function deleteBranch() {
  const idInput = document.getElementById('edit-branch-id');
  if (!idInput) return;
  const id = idInput.value;
  const branch = appState.branches.find(b => b.id === id);
  if (!branch) return;

  // Guard: cannot delete last main branch
  if (branch.type === 'main' && appState.branches.filter(b => b.type === 'main').length <= 1) {
    showToast('Cannot delete the last main branch.', 'error');
    return;
  }

  confirmAction(
    `Delete "${branch.name}"?`,
    `This will remove the branch and all of its connections. This cannot be undone.`,
    () => {
      // Remove from other branches' mergesInto
      appState.branches.forEach(b => {
        b.mergesInto = (b.mergesInto || []).filter(mid => mid !== id);
        if (b.sourceFrom === id) b.sourceFrom = null;
      });
      appState.branches = appState.branches.filter(b => b.id !== id);
      saveState();
      closePanel();
      showToast(`Branch deleted`, 'info');
      render();
    }
  );
}

export function initEditor() {
  const colorInput = document.getElementById('edit-color');
  if (colorInput) {
    colorInput.addEventListener('input', function() {
      const display = document.getElementById('edit-color-display');
      if (display) display.textContent = this.value;
    });
  }

  const typeSelect = document.getElementById('edit-type');
  if (typeSelect) {
    typeSelect.addEventListener('change', onTypeChange);
  }

  const useDefaultBtn = document.getElementById('edit-color-clear');
  if (useDefaultBtn) {
    useDefaultBtn.addEventListener('click', clearColorOverride);
  }

  const closeBtn = document.getElementById('edit-panel-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closePanel);
  }

  const saveBtn = document.getElementById('btn-save-panel');
  if (saveBtn) {
    saveBtn.addEventListener('click', savePanel);
  }

  const deleteBtn = document.getElementById('btn-delete-panel');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteBranch);
  }
}
