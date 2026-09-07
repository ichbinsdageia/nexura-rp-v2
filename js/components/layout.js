import { CONFIG, PUBLIC_NAV } from '../config.js';
import { icon } from '../lib/icons.js';
import { currentAuth } from '../lib/auth.js';
import { escapeHtml } from '../lib/utils.js';


/* =========================================================
   NAVIGATION LINK
========================================================= */

function navLink(path, label, currentPath) {
  const active =
    path === '/'
      ? currentPath === '/'
      : currentPath.startsWith(path);

  return `
    <a
      href="${path}"
      data-link
      ${active ? 'aria-current="page"' : ''}
    >
      ${label}
    </a>
  `;
}


/* =========================================================
   ÖFFENTLICHES LAYOUT
========================================================= */

export async function publicLayout(
  content,
  {
    path = location.pathname,
    hideStatus = false,
  } = {}
) {
  const auth = await currentAuth();

  const accountLabel =
    auth.profile
      ? (
          auth.profile.website_role === 'owner'
            ? 'Owner-Portal'
            : 'Mein Konto'
        )
      : 'Anmelden';

  const accountHref =
    auth.profile?.website_role === 'owner'
      ? '/portal'
      : '/konto';


  return `
    <div class="page">

      ${
        hideStatus
          ? ''
          : `
            <div class="status-strip">
              <div class="shell status-strip__inner">

                <span
                  class="status-dot"
                  id="global-status-dot"
                ></span>

                <span>
                  <strong id="global-status">
                    Serverstatus wird geladen
                  </strong>
                </span>

                <span>
                  •
                </span>

                <span>
                  <strong id="global-players">
                    – / –
                  </strong>
                  Spieler
                </span>

                <span class="status-spacer"></span>

                <span id="global-updated">
                  Noch nicht aktualisiert
                </span>

              </div>
            </div>
          `
      }


      <!-- ==================================================
           HEADER
      =================================================== -->

      <header class="site-header">

        <div class="shell nav-wrap">

          <!-- LOGO -->

          <a
            class="brand"
            href="/"
            data-link
            aria-label="Nexura RP Startseite"
          >

            <img
              src="/assets/nexura-logo.jpg"
              alt="Nexura RP Logo"
            >

            <span class="brand-copy">

              <strong>
                Nexura RP
              </strong>

              <small>
                Emergency Hamburg
              </small>

            </span>

          </a>


          <!-- MOBILE MENÜ BUTTON -->

          <button
            class="menu-toggle"
            type="button"
            aria-label="Menü öffnen"
            data-menu-toggle
          >

            <span></span>
            <span></span>

          </button>


          <!-- HAUPTNAVIGATION -->

          <nav
            class="primary-nav"
            data-primary-nav
          >

            ${PUBLIC_NAV
              .map(
                ([p, l]) =>
                  navLink(
                    p,
                    l,
                    path
                  )
              )
              .join('')}


            <!-- MOBILE LOGIN / DISCORD -->

            <div class="mobile-nav-actions">

              <a
                href="${accountHref}"
                data-link
              >

                ${icon('login')}

                ${escapeHtml(accountLabel)}

              </a>


              <a
                href="${CONFIG.discordUrl}"
                target="_blank"
                rel="noopener noreferrer"
              >

                ${icon('discord')}

                Discord

              </a>

            </div>

          </nav>


          <!-- DESKTOP AKTIONEN -->

          <div class="nav-actions">

            <a
              class="button button--secondary button--compact"
              href="${accountHref}"
              data-link
            >

              ${icon('login')}

              ${escapeHtml(accountLabel)}

            </a>


            <a
              class="button button--primary button--compact"
              href="${CONFIG.discordUrl}"
              target="_blank"
              rel="noopener noreferrer"
            >

              ${icon('discord')}

              Discord

            </a>

          </div>

        </div>

      </header>


      <!-- ==================================================
           HAUPTINHALT
      =================================================== -->

      <main>
        ${content}
      </main>


      <!-- ==================================================
           FOOTER
      =================================================== -->

      <footer class="site-footer">

        <div class="shell footer-grid">


          <!-- BRAND -->

          <div class="footer-brand">

            <a
              class="brand"
              href="/"
              data-link
            >

              <img
                src="/assets/nexura-logo.jpg"
                alt=""
              >

              <span class="brand-copy">

                <strong>
                  Nexura RP
                </strong>

                <small>
                  Roleplay
                </small>

              </span>

            </a>


            <p>
              ${escapeHtml(CONFIG.description)}
              Nexura RP ist ein unabhängiges
              Community-Projekt.
            </p>

          </div>


          <!-- COMMUNITY -->

          <div>

            <h4>
              Community
            </h4>

            <a
              href="/team"
              data-link
            >
              Team
            </a>

            <a
              href="/gangs"
              data-link
            >
              Gangs
            </a>

            <a
              href="/community"
              data-link
            >
              Community-Portal
            </a>

            <a
              href="/bewerbung"
              data-link
            >
              Bewerben
            </a>

            <a
              href="${CONFIG.discordUrl}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </a>

          </div>


          <!-- SERVICE -->

          <div>

            <h4>
              Service
            </h4>

            <a
              href="/support"
              data-link
            >
              Support
            </a>

            <a
              href="/konto"
              data-link
            >
              Mein Konto
            </a>

            <a
              href="/regelwerk"
              data-link
            >
              Regelwerk
            </a>

            <a
              href="${CONFIG.robloxUrl}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Roblox öffnen
            </a>

          </div>


          <!-- INTERN / RECHTLICH -->

          <div>

            <h4>
              Intern & Rechtliches
            </h4>

            <a
              href="/portal"
              data-link
            >
              Teamportal
            </a>

            <a
              href="/portal?view=sessions"
              data-link
            >
              Sessionplanung
            </a>

            <a
              href="/portal?view=applications"
              data-link
            >
              Bewerbungen
            </a>

            <a
              href="/impressum"
              data-link
            >
              Impressum
            </a>

            <a
              href="/datenschutz"
              data-link
            >
              Datenschutz
            </a>

          </div>

        </div>


        <!-- ==================================================
             FOOTER UNTEN
        =================================================== -->

        <div class="shell footer-bottom">

          <span>
            © ${new Date().getFullYear()} Nexura RP
          </span>


          <span>

            <a
              href="/impressum"
              data-link
              style="color:inherit"
            >
              Impressum
            </a>

            ·

            <a
              href="/datenschutz"
              data-link
              style="color:inherit"
            >
              Datenschutz
            </a>

            ·

            Nicht offiziell mit Roblox
            oder Emergency Hamburg verbunden.

          </span>

        </div>

      </footer>

    </div>
  `;
}


/* =========================================================
   ÖFFENTLICHES LAYOUT BINDEN
========================================================= */

export function bindPublicLayout() {
  const toggle =
    document.querySelector(
      '[data-menu-toggle]'
    );

  const nav =
    document.querySelector(
      '[data-primary-nav]'
    );


  toggle?.addEventListener(
    'click',
    () => {
      nav?.classList.toggle('open');
    }
  );


  nav?.addEventListener(
    'click',
    () => {
      nav.classList.remove('open');
    }
  );
}


/* =========================================================
   SEITEN-HERO
========================================================= */

export function pageHero(
  kicker,
  title,
  text
) {
  return `
    <section class="page-hero">

      <div class="shell">

        <div class="breadcrumbs">

          <a
            href="/"
            data-link
          >
            Start
          </a>

          <span>
            /
          </span>

          <span>
            ${escapeHtml(kicker)}
          </span>

        </div>


        <span
          class="kicker"
          style="margin-top:22px"
        >
          ${escapeHtml(kicker)}
        </span>


        <h1>
          ${title}
        </h1>


        <p>
          ${escapeHtml(text)}
        </p>

      </div>

    </section>
  `;
}
