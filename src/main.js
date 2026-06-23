import './styles.css';
import { cloneDeep } from 'lodash';
import { saveAs } from 'file-saver';
import hotkeys from 'hotkeys-js';

import {
  appState,
  setAppState,
  DEFAULT_STATE,
  loadState,
  saveState,
  rebuildEdges,
  manualSave,
  migrateState
} from './state.js';

import {
  initCanvas,
  render,
  resetView
} from './canvas.js';

import {
  initEditor,
  openAddPanel,
  closePanel,
  selectBranch
} from './editor.js';

import { initSidebar } from './sidebar.js';

import {
  initSettings,
  closeSettings,
  openSettings
} from './settings.js';

import {
  confirmAction,
  confirmOK,
  confirmCancel,
  showToast
} from './dialogs.js';

// Export / Import
function exportJSON() {
  const json = JSON.stringify(appState, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  saveAs(blob, 'gitflow-state.json');
  showToast('Exported gitflow-state.json', 'success');
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.config || !imported.branches) throw new Error('Invalid schema');
      confirmAction(
        'Import State?',
        `This will replace all current branches and settings with the imported data. Continue?`,
        () => {
          setAppState(imported);
          migrateState();
          saveState();
          render();
          showToast('State imported successfully', 'success');
        }
      );
    } catch (err) {
      showToast('Import failed: Invalid JSON or schema', 'error', 4000);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function confirmReset() {
  confirmAction(
    'Reset to Default?',
    'This will erase all branches and restore the example state. Your current work cannot be recovered.',
    () => {
      setAppState(cloneDeep(DEFAULT_STATE));
      rebuildEdges();
      saveState();
      closePanel();
      render();
      showToast('Reset to default state', 'info');
    }
  );
}

function initToolbar() {
  const addBtn = document.getElementById('toolbar-add-btn');
  if (addBtn) addBtn.addEventListener('click', openAddPanel);

  const saveBtn = document.getElementById('toolbar-save-btn');
  if (saveBtn) saveBtn.addEventListener('click', manualSave);

  const exportBtn = document.getElementById('toolbar-export-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportJSON);

  const importInput = document.getElementById('toolbar-import-input');
  if (importInput) importInput.addEventListener('change', importJSON);

  const settingsBtn = document.getElementById('toolbar-settings-btn');
  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);

  const resetBtn = document.getElementById('toolbar-reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', confirmReset);

  // Sidebar add branch button
  const sidebarAddBtn = document.getElementById('sidebar-add-btn');
  if (sidebarAddBtn) sidebarAddBtn.addEventListener('click', openAddPanel);
}

function initDialogs() {
  const okBtn = document.getElementById('confirm-ok-btn');
  if (okBtn) okBtn.addEventListener('click', confirmOK);

  const cancelBtn = document.getElementById('confirm-cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', confirmCancel);
}

function initHotkeys() {
  hotkeys('ctrl+s, cmd+s', (e) => {
    e.preventDefault();
    manualSave();
  });
  
  hotkeys('ctrl+n, cmd+n', (e) => {
    e.preventDefault();
    openAddPanel();
  });
  
  hotkeys('escape', () => {
    const settingsPanel = document.getElementById('settings-panel');
    const editPanel = document.getElementById('edit-panel');
    const confirmOverlay = document.getElementById('confirm-overlay');
    if (settingsPanel && settingsPanel.classList.contains('open')) {
      closeSettings();
    } else if (editPanel && editPanel.classList.contains('open')) {
      closePanel();
    } else if (confirmOverlay && confirmOverlay.classList.contains('open')) {
      confirmCancel();
    }
  });
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initToolbar();
  initDialogs();
  initSidebar(selectBranch);
  initCanvas(selectBranch);
  initEditor(render);
  initSettings();
  initHotkeys();
  resetView();
  render();
});
