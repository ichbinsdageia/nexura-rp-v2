import { escapeHtml } from '../lib/utils.js';

export function badge(text, tone = '') {
  return `<span class="status-chip${tone ? ` status-chip--${tone}` : ''}">${escapeHtml(text)}</span>`;
}

export function toast(title, message = '', type = '') {
  let root = document.querySelector('#toast-root .toast-stack');
  if (!root) {
    document.querySelector('#toast-root').innerHTML = '<div class="toast-stack"></div>';
    root = document.querySelector('#toast-root .toast-stack');
  }
  const item = document.createElement('div');
  item.className = `toast${type ? ` toast--${type}` : ''}`;
  item.innerHTML = `<strong>${escapeHtml(title)}</strong>${message ? `<span>${escapeHtml(message)}</span>` : ''}`;
  root.append(item);
  setTimeout(() => item.remove(), 4300);
}

export function openModal({ title, content, size = '', onOpen }) {
  const root = document.querySelector('#modal-root');
  root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop><div class="modal ${size === 'small' ? 'modal--small' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><span class="kicker">Nexura Control</span><h2 id="modal-title">${escapeHtml(title)}</h2></div><button class="modal-close" type="button" data-modal-close aria-label="Schließen">×</button></div><div data-modal-content>${content}</div></div></div>`;
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
  const onKey = event => { if (event.key === 'Escape') close(); };
  root.querySelector('[data-modal-close]').addEventListener('click', close);
  root.querySelector('[data-modal-backdrop]').addEventListener('click', event => { if (event.target.matches('[data-modal-backdrop]')) close(); });
  document.addEventListener('keydown', onKey);
  onOpen?.(root.querySelector('[data-modal-content]'), close);
  return close;
}

export function confirmModal({ title = 'Wirklich fortfahren?', message, confirmText = 'Bestätigen', danger = false }) {
  return new Promise(resolve => {
    openModal({
      title,
      size: 'small',
      content: `<p class="muted" style="line-height:1.7">${escapeHtml(message)}</p><div class="form-actions"><button class="button button--ghost" type="button" data-cancel>Abbrechen</button><button class="button ${danger ? 'button--danger' : 'button--primary'}" type="button" data-confirm>${escapeHtml(confirmText)}</button></div>`,
      onOpen(root, close) {
        root.querySelector('[data-cancel]').addEventListener('click', () => { close(); resolve(false); });
        root.querySelector('[data-confirm]').addEventListener('click', () => { close(); resolve(true); });
      },
    });
  });
}

export function loading(label = 'Lade Inhalte …') {
  return `<div class="loading"><div><div class="spinner" style="margin:0 auto 12px"></div><div>${escapeHtml(label)}</div></div></div>`;
}

export function emptyState({ icon = '◇', title, text, action = '' }) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>${action}</div>`;
}
