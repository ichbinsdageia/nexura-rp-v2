export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: options.withTime === false ? undefined : 'short', timeZone: 'Europe/Berlin' }).format(date);
}

export function formatRelative(value) {
  if (!value) return '—';
  const delta = new Date(value).getTime() - Date.now();
  const abs = Math.abs(delta);
  const formatter = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
  if (abs < 60_000) return formatter.format(Math.round(delta / 1000), 'second');
  if (abs < 3_600_000) return formatter.format(Math.round(delta / 60_000), 'minute');
  if (abs < 86_400_000) return formatter.format(Math.round(delta / 3_600_000), 'hour');
  return formatter.format(Math.round(delta / 86_400_000), 'day');
}

export function slugify(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function reference(prefix = 'NXR') {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll('-', '');
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

export function formDataObject(form) {
  const data = new FormData(form);
  const result = {};
  for (const [key, value] of data.entries()) {
    if (key in result) result[key] = Array.isArray(result[key]) ? [...result[key], value] : [result[key], value];
    else result[key] = value;
  }
  return result;
}

export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

export function statusLabel(status) {
  return ({ new: 'Neu', in_review: 'In Prüfung', question: 'Rückfrage', interview: 'Vorstellungsgespräch', accepted: 'Angenommen', rejected: 'Abgelehnt', open: 'Offen', closed: 'Geschlossen', approved: 'Freigegeben', live: 'Live', planned: 'Geplant', preparation: 'Vorbereitung', pause: 'Pause', maintenance: 'Wartung', done: 'Erledigt' })[status] || status || 'Unbekannt';
}

export function statusTone(status) {
  if (['accepted', 'approved', 'done', 'live', 'active'].includes(status)) return 'done';
  if (['rejected', 'closed', 'maintenance', 'banned'].includes(status)) return 'rejected';
  if (['in_review', 'planned', 'question', 'interview', 'pause'].includes(status)) return 'open';
  return 'new';
}
