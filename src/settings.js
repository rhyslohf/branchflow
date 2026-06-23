import { appState, saveState } from './state.js';
import { render, getEnvColor } from './canvas.js';
import { showToast } from './dialogs.js';

export function openSettings() {
  renderSettingsPanel();
  const panel = document.getElementById('settings-panel');
  if (panel) {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
  }
}

export function closeSettings() {
  const panel = document.getElementById('settings-panel');
  if (panel) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }
}

export function renderSettingsPanel() {
  // Environments
  const envList = document.getElementById('env-list');
  if (envList) {
    envList.innerHTML = '';
    appState.config.environments.forEach((env, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:center;';
      
      const inp = document.createElement('input');
      inp.className = 'form-input';
      inp.style.flex = '1';
      inp.value = env;
      inp.setAttribute('aria-label', `Environment ${i + 1} name`);
      inp.addEventListener('change', () => renameEnvironment(i, inp.value.trim()));
      
      const dot = document.createElement('span');
      dot.className = 'env-dot';
      dot.style.background = getEnvColor(env);
      dot.style.flexShrink = '0';
      
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger';
      delBtn.style.cssText = 'padding:4px 8px;font-size:11px;';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label', `Remove environment ${env}`);
      delBtn.addEventListener('click', () => removeEnvironment(i));
      
      row.appendChild(dot);
      row.appendChild(inp);
      row.appendChild(delBtn);
      envList.appendChild(row);
    });
  }

  // Color defaults
  const colorDefaults = document.getElementById('color-defaults');
  if (colorDefaults) {
    colorDefaults.innerHTML = '';
    ['main', 'feature', 'release', 'hotfix', 'custom'].forEach(type => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:10px;';
      
      const colorInp = document.createElement('input');
      colorInp.type = 'color';
      colorInp.className = 'form-color-input';
      colorInp.value = appState.config.branchColors[type] || '#7d8590';
      colorInp.addEventListener('input', function() {
        appState.config.branchColors[type] = this.value;
        label.textContent = this.value;
        saveState();
        render();
      });
      
      const label = document.createElement('span');
      label.style.cssText = 'font-size:12px;font-family:var(--font-code);color:var(--text-muted);flex:1;';
      label.textContent = appState.config.branchColors[type];
      
      const typeName = document.createElement('span');
      typeName.style.cssText = 'font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-faint);width:56px;text-align:right;';
      typeName.textContent = type;
      
      row.appendChild(colorInp);
      row.appendChild(label);
      row.appendChild(typeName);
      colorDefaults.appendChild(row);
    });
  }
}

export function addEnvironment() {
  if (appState.config.environments.length >= 5) {
    showToast('Maximum 5 environments supported.', 'error');
    return;
  }
  const newEnv = `Env${appState.config.environments.length + 1}`;
  appState.config.environments.push(newEnv);
  appState.branches.forEach(b => {
    if (!b.deployments) b.deployments = {};
    b.deployments[newEnv] = false;
  });
  saveState();
  render();
  renderSettingsPanel();
  showToast(`Environment "${newEnv}" added`, 'success');
}

export function removeEnvironment(idx) {
  if (appState.config.environments.length <= 1) {
    showToast('At least one environment is required.', 'error');
    return;
  }
  const envName = appState.config.environments[idx];
  appState.config.environments.splice(idx, 1);
  appState.branches.forEach(b => {
    if (b.deployments) delete b.deployments[envName];
  });
  saveState();
  render();
  renderSettingsPanel();
  showToast(`Environment "${envName}" removed`, 'info');
}

export function renameEnvironment(idx, newName) {
  if (!newName) return;
  const oldName = appState.config.environments[idx];
  appState.config.environments[idx] = newName;
  appState.branches.forEach(b => {
    if (b.deployments && b.deployments[oldName] !== undefined) {
      b.deployments[newName] = b.deployments[oldName];
      delete b.deployments[oldName];
    }
  });
  saveState();
  render();
  renderSettingsPanel();
  showToast(`Renamed to "${newName}"`, 'success');
}

export function initSettings() {
  const closeBtn = document.getElementById('settings-panel-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSettings);
  }

  const addEnvBtn = document.getElementById('settings-env-add');
  if (addEnvBtn) {
    addEnvBtn.addEventListener('click', addEnvironment);
  }
}
