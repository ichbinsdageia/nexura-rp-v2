import { publicLayout, bindPublicLayout } from './components/layout.js';
import { toast } from './components/ui.js';
import { copyText } from './lib/utils.js';
import { loadServerStatus, statusPresentation } from './lib/status.js';
import { renderHome, bindHome } from './views/home.js';
import { renderTeam, bindTeam } from './views/team.js';
import { renderRules, bindRules } from './views/rules.js';
import { renderApplications, bindApplications } from './views/applications.js';
import { renderGangs, bindGangs } from './views/gangs.js';
import { renderSupport, bindSupport } from './views/support.js';
import { renderCommunity, bindCommunity } from './views/community.js';
import { renderAccount, bindAccount } from './views/account.js';
import { renderPortal, bindPortal } from './views/portal.js';

const routes = {
  '/': { title: 'Nexura RP', render: renderHome, bind: bindHome },
  '/team': { title: 'Team', render: renderTeam, bind: bindTeam },
  '/regelwerk': { title: 'Regelwerk', render: renderRules, bind: bindRules },
  '/bewerbung': { title: 'Team-Bewerbung', render: renderApplications, bind: bindApplications },
  '/gangs': { title: 'Gangs', render: renderGangs, bind: bindGangs },
  '/support': { title: 'Support', render: renderSupport, bind: bindSupport },
  '/community': { title: 'Community-Portal', render: renderCommunity, bind: bindCommunity },
  '/konto': { title: 'Mein Konto', render: renderAccount, bind: bindAccount },
  '/portal': { title: 'Nexura Control', render: renderPortal, bind: bindPortal, standalone: true },
};

function cleanPath(pathname) {
  const value = pathname.replace(/\/+$/, '') || '/';
  return value.endsWith('.html') ? ({
    '/team.html': '/team', '/regelwerk.html': '/regelwerk', '/bewerbung.html': '/bewerbung', '/gangs.html': '/gangs', '/support.html': '/support', '/konto.html': '/konto', '/portal.html': '/portal', '/index.html': '/',
  }[value] || value) : value;
}

async function updateStatusStrip() {
  const label = document.querySelector('#global-status');
  if (!label) return;
  try {
    const status = await loadServerStatus();
    const present = statusPresentation(status);
    label.textContent = present.label;
    document.querySelector('#global-players').textContent = `${status.players} / ${status.maxPlayers}`;
    document.querySelector('#global-updated').textContent = present.updated;
    const dot = document.querySelector('#global-status-dot');
    dot.className = `status-dot ${present.dotClass}`.trim();
  } catch {
    label.textContent = 'Status nicht verfügbar';
  }
}

function bindGlobalActions() {
  bindPublicLayout();
  document.querySelectorAll('[data-copy-server-code]').forEach(button => button.addEventListener('click', async () => {
    try { await copyText(button.dataset.copyServerCode || 'NEXURA'); toast('Servercode kopiert', button.dataset.copyServerCode || 'NEXURA', 'success'); }
    catch { toast('Kopieren nicht möglich', 'Markiere den Servercode bitte manuell.', 'error'); }
  }));
}

function notFound() {
  return `<section class="auth-shell"><div class="auth-card"><img class="auth-card__logo" src="/assets/nexura-logo.jpg" alt=""><span class="kicker">404</span><h1>Seite nicht gefunden</h1><p>Diese Nexura-Seite existiert nicht oder wurde verschoben.</p><a class="button button--primary button--wide" href="/" data-link>Zur Startseite</a></div></section>`;
}

export async function renderRoute() {
  const path = cleanPath(location.pathname);
  const route = routes[path];
  const app = document.querySelector('#app');
  if (!app) return;
  app.innerHTML = '<div class="loading"><div><div class="spinner"></div><div>Seite wird geladen …</div></div></div>';
  try {
    const content = route ? await route.render() : notFound();
    app.innerHTML = route?.standalone ? content : await publicLayout(content, { path });
    document.title = `${route?.title || 'Seite nicht gefunden'} – Nexura RP`;
    bindGlobalActions();
    route?.bind?.();
    if (!route?.standalone) updateStatusStrip();
    window.scrollTo({ top: 0, behavior: 'instant' });
    app.focus({ preventScroll: true });
  } catch (error) {
    app.innerHTML = await publicLayout(`<section class="auth-shell"><div class="auth-card"><h1>Seite konnte nicht geladen werden</h1><p>${String(error?.message || error)}</p><a class="button button--primary button--wide" href="/" data-link>Zur Startseite</a></div></section>`, { path });
    bindGlobalActions();
  }
}

export function navigate(url) {
  const target = new URL(url, location.origin);
  if (target.origin !== location.origin) { location.href = target.href; return; }
  history.pushState({}, '', `${target.pathname}${target.search}${target.hash}`);
  renderRoute();
}

export function bindRouter() {
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-link]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = new URL(link.href, location.origin);
    if (target.origin !== location.origin) return;
    event.preventDefault();
    navigate(target.href);
  });
  window.addEventListener('popstate', renderRoute);
}
