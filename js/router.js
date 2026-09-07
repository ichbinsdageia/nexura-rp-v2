import {
  publicLayout,
  bindPublicLayout,
} from './components/layout.js?v=20260907-legal';

import { toast } from './components/ui.js';
import { copyText } from './lib/utils.js';
import {
  loadServerStatus,
  statusPresentation,
} from './lib/status.js';

import {
  renderHome,
  bindHome,
} from './views/home.js';

import {
  renderTeam,
  bindTeam,
} from './views/team.js';

import {
  renderRules,
  bindRules,
} from './views/rules.js';

import {
  renderApplications,
  bindApplications,
} from './views/applications.js';

import {
  renderGangs,
  bindGangs,
} from './views/gangs.js';

import {
  renderSupport,
  bindSupport,
} from './views/support.js';

import {
  renderCommunity,
  bindCommunity,
} from './views/community.js';

import {
  renderAccount,
  bindAccount,
} from './views/account.js';

import {
  renderPortal,
  bindPortal,
} from './views/portal.js';

import {
  renderImpressum,
  renderDatenschutz,
  bindLegal,
} from './views/legal.js?v=20260907-legal';


/* =========================================================
   ROUTES
========================================================= */

const routes = {
  '/': {
    title: 'Nexura RP',
    render: renderHome,
    bind: bindHome,
  },

  '/team': {
    title: 'Team',
    render: renderTeam,
    bind: bindTeam,
  },

  '/regelwerk': {
    title: 'Regelwerk',
    render: renderRules,
    bind: bindRules,
  },

  '/bewerbung': {
    title: 'Team-Bewerbung',
    render: renderApplications,
    bind: bindApplications,
  },

  '/gangs': {
    title: 'Gangs',
    render: renderGangs,
    bind: bindGangs,
  },

  '/support': {
    title: 'Support',
    render: renderSupport,
    bind: bindSupport,
  },

  '/community': {
    title: 'Community-Portal',
    render: renderCommunity,
    bind: bindCommunity,
  },

  '/konto': {
    title: 'Mein Konto',
    render: renderAccount,
    bind: bindAccount,
  },

  '/impressum': {
    title: 'Impressum',
    render: renderImpressum,
    bind: bindLegal,
  },

  '/datenschutz': {
    title: 'Datenschutz',
    render: renderDatenschutz,
    bind: bindLegal,
  },

  '/portal': {
    title: 'Nexura Control',
    render: renderPortal,
    bind: bindPortal,
    standalone: true,
  },
};


/* =========================================================
   PATH NORMALISIEREN
========================================================= */

function cleanPath(pathname) {
  const value = pathname.replace(/\/+$/, '') || '/';

  if (!value.endsWith('.html')) {
    return value;
  }

  const htmlRoutes = {
    '/team.html': '/team',
    '/regelwerk.html': '/regelwerk',
    '/bewerbung.html': '/bewerbung',
    '/gangs.html': '/gangs',
    '/support.html': '/support',
    '/konto.html': '/konto',
    '/impressum.html': '/impressum',
    '/datenschutz.html': '/datenschutz',
    '/portal.html': '/portal',
    '/index.html': '/',
  };

  return htmlRoutes[value] || value;
}


/* =========================================================
   SERVERSTATUS
========================================================= */

async function updateStatusStrip() {
  const label = document.querySelector('#global-status');

  if (!label) {
    return;
  }

  try {
    const status = await loadServerStatus();
    const present = statusPresentation(status);

    label.textContent = present.label;

    const players = document.querySelector('#global-players');

    if (players) {
      players.textContent = `${status.players} / ${status.maxPlayers}`;
    }

    const updated = document.querySelector('#global-updated');

    if (updated) {
      updated.textContent = present.updated;
    }

    const dot = document.querySelector('#global-status-dot');

    if (dot) {
      dot.className = `status-dot ${present.dotClass}`.trim();
    }
  } catch (error) {
    console.error(
      '[Nexura] Serverstatus konnte nicht geladen werden:',
      error
    );

    label.textContent = 'Status nicht verfügbar';

    const players = document.querySelector('#global-players');

    if (players) {
      players.textContent = '– / –';
    }

    const updated = document.querySelector('#global-updated');

    if (updated) {
      updated.textContent = 'Keine aktuellen Daten';
    }
  }
}


/* =========================================================
   GLOBALE AKTIONEN
========================================================= */

function bindGlobalActions() {
  bindPublicLayout();

  document
    .querySelectorAll('[data-copy-server-code]')
    .forEach((button) => {
      button.addEventListener('click', async () => {
        const code =
          button.dataset.copyServerCode ||
          'NEXURA';

        try {
          await copyText(code);

          toast(
            'Servercode kopiert',
            code,
            'success'
          );
        } catch {
          toast(
            'Kopieren nicht möglich',
            'Markiere den Servercode bitte manuell.',
            'error'
          );
        }
      });
    });
}


/* =========================================================
   404
========================================================= */

function notFound() {
  return `
    <section class="auth-shell">
      <div class="auth-card">

        <img
          class="auth-card__logo"
          src="/assets/nexura-logo.jpg"
          alt=""
        >

        <span class="kicker">
          404
        </span>

        <h1>
          Seite nicht gefunden
        </h1>

        <p>
          Diese Nexura-Seite existiert nicht
          oder wurde verschoben.
        </p>

        <a
          class="button button--primary button--wide"
          href="/"
          data-link
        >
          Zur Startseite
        </a>

      </div>
    </section>
  `;
}


/* =========================================================
   ROUTE RENDERN
========================================================= */

export async function renderRoute() {
  const path = cleanPath(location.pathname);
  const route = routes[path];
  const app = document.querySelector('#app');

  if (!app) {
    return;
  }

  app.innerHTML = `
    <div class="loading">
      <div>
        <div class="spinner"></div>
        <div>
          Seite wird geladen …
        </div>
      </div>
    </div>
  `;

  try {
    const content = route
      ? await route.render()
      : notFound();

    /*
      Das Team-/Owner-Portal besitzt seinen
      eigenen vollständigen Aufbau.

      Alle öffentlichen Seiten bekommen
      Header, Navigation und Footer.
    */
    app.innerHTML = route?.standalone
      ? content
      : await publicLayout(
          content,
          {
            path,
          }
        );

    document.title =
      `${route?.title || 'Seite nicht gefunden'} – Nexura RP`;

    /*
      Globale Navigation,
      Mobile-Menü,
      Copy-Buttons usw.
    */
    bindGlobalActions();

    /*
      Seitenspezifische Funktionen.
    */
    route?.bind?.();

    /*
      Öffentliche Seiten bekommen
      den Serverstatus.
    */
    if (!route?.standalone) {
      updateStatusStrip();
    }

    /*
      Nach Navigation immer nach oben.
    */
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    /*
      Fokus für Tastatur-/Screenreader-Navigation.
    */
    app.focus({
      preventScroll: true,
    });
  } catch (error) {
    console.error(
      '[Nexura] Fehler beim Rendern der Route:',
      error
    );

    const errorContent = `
      <section class="auth-shell">

        <div class="auth-card">

          <span class="kicker">
            Fehler
          </span>

          <h1>
            Seite konnte nicht geladen werden
          </h1>

          <p>
            ${
              String(
                error?.message ||
                'Unbekannter Fehler'
              )
            }
          </p>

          <a
            class="button button--primary button--wide"
            href="/"
            data-link
          >
            Zur Startseite
          </a>

        </div>

      </section>
    `;

    app.innerHTML = route?.standalone
      ? errorContent
      : await publicLayout(
          errorContent,
          {
            path,
          }
        );

    bindGlobalActions();
  }
}


/* =========================================================
   INTERNE NAVIGATION
========================================================= */

export function navigate(url) {
  const target = new URL(
    url,
    location.origin
  );

  /*
    Externe Links verlassen normal die Website.
  */
  if (target.origin !== location.origin) {
    location.href = target.href;
    return;
  }

  history.pushState(
    {},
    '',
    `${target.pathname}${target.search}${target.hash}`
  );

  renderRoute();
}


/* =========================================================
   ROUTER BINDEN
========================================================= */

export function bindRouter() {
  document.addEventListener(
    'click',
    (event) => {
      const link =
        event.target.closest('a[data-link]');

      /*
        Keine normale Linknavigation abfangen,
        wenn beispielsweise STRG + Klick
        oder mittlere Maustaste verwendet wird.
      */
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = new URL(
        link.href,
        location.origin
      );

      /*
        Externe Links nicht durch den
        SPA-Router verarbeiten.
      */
      if (target.origin !== location.origin) {
        return;
      }

      event.preventDefault();

      navigate(target.href);
    }
  );

  /*
    Browser Vor/Zurück.
  */
  window.addEventListener(
    'popstate',
    renderRoute
  );
}
