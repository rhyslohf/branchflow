// Toast Notifications
export function showToast(msg, type = 'info', duration = 2800) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// Confirmation Dialog State
let _confirmCallback = null;

export function confirmAction(title, message, callback) {
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-message');
  const overlay = document.getElementById('confirm-overlay');
  
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  
  _confirmCallback = callback;
  
  if (overlay) {
    overlay.classList.add('open');
  }
}

export function confirmOK() {
  const overlay = document.getElementById('confirm-overlay');
  if (overlay) {
    overlay.classList.remove('open');
  }
  if (_confirmCallback) {
    _confirmCallback();
    _confirmCallback = null;
  }
}

export function confirmCancel() {
  const overlay = document.getElementById('confirm-overlay');
  if (overlay) {
    overlay.classList.remove('open');
  }
  _confirmCallback = null;
}
