import { pageHero } from '../components/layout.js?v=20260907-legal';

const CONTACT_EMAIL = 'kontakt@nexura-rp.de';

function legalSection(id, title, content) {
  return `
    <section class="rule-section" id="${id}">
      <h2>${title}</h2>
      ${content}
    </section>
  `;
}

function legalLayout(hero, navItems, sections) {
  return `
    ${hero}

    <section class="section section--tight">
      <div class="shell rules-layout">

        <aside class="rules-nav" aria-label="Seitennavigation">
          ${navItems
            .map(
              ([id, label]) => `
                <a href="#${id}">
                  ${label}
                </a>
              `
            )
            .join('')}
        </aside>

        <div class="rules-content">
          ${sections.join('')}
        </div>

      </div>
    </section>
  `;
}

/* =========================================================
   IMPRESSUM
========================================================= */

export function renderImpressum() {
  const nav = [
    ['anbieter', 'Anbieter'],
    ['kontakt', 'Kontakt'],
    ['redaktion', 'Inhaltlich verantwortlich'],
    ['projekt', 'Projektstatus'],
    ['plattformen', 'Roblox & Plattformen'],
    ['social', 'Social Media'],
    ['links', 'Externe Links'],
  ];

  const sections = [
    legalSection(
      'anbieter',
      'Angaben zum Anbieter',
      `
        <p>
          Angaben gemäß § 18 Medienstaatsvertrag (MStV) sowie,
          soweit anwendbar, § 5 Digitale-Dienste-Gesetz (DDG).
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Nexura RP</strong>

            <p>
              Privat betriebenes Community- und Roleplay-Projekt
            </p>
          </div>

          <div class="rule">
            <strong>Verantwortlicher Betreiber</strong>

            <p>
              Jonas Götzner<br>
              Wilhelm-Dieß-Straße 28<br>
              84359 Simbach am Inn<br>
              Deutschland
            </p>
          </div>

        </div>
      `
    ),

    legalSection(
      'kontakt',
      'Kontakt',
      `
        <div class="rule-list">

          <div class="rule">
            <strong>E-Mail</strong>

            <p>
              <a
                href="mailto:${CONTACT_EMAIL}"
                style="color:inherit;text-decoration:underline"
              >
                ${CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <div class="rule">
            <strong>Weitere Kontaktmöglichkeit</strong>

            <p>
              Für Support- und Communityanliegen steht zusätzlich
              der Supportbereich der Website zur Verfügung.
            </p>
          </div>

        </div>
      `
    ),

    legalSection(
      'redaktion',
      'Verantwortlich für journalistisch-redaktionelle Inhalte',
      `
        <p>
          Soweit auf dieser Website journalistisch-redaktionell
          gestaltete Inhalte im Sinne von § 18 Abs. 2 MStV
          angeboten werden, ist verantwortlich:
        </p>

        <div class="rule">
          <strong>Jonas Götzner</strong>

          <p>
            Wilhelm-Dieß-Straße 28<br>
            84359 Simbach am Inn<br>
            Deutschland
          </p>
        </div>
      `
    ),

    legalSection(
      'projekt',
      'Projektstatus',
      `
        <p>
          Nexura RP wird derzeit von Jonas Götzner als Privatperson
          betrieben.
        </p>

        <p>
          Nach aktuellem Stand bestehen kein Unternehmen und kein
          Gewerbebetrieb für Nexura RP.
        </p>

        <p>
          Derzeit werden mit Nexura RP keine Einnahmen erzielt.
          Das Projekt verursacht nach Angaben des Betreibers
          ausschließlich Ausgaben.
        </p>

        <p>
          Ändert sich die rechtliche oder wirtschaftliche
          Ausgestaltung des Projekts, werden die Anbieterangaben
          entsprechend angepasst.
        </p>
      `
    ),

    legalSection(
      'plattformen',
      'Hinweis zu Roblox und Emergency Hamburg',
      `
        <p>
          Nexura RP ist ein unabhängiges Community-Projekt und steht
          in keiner offiziellen Verbindung zu Roblox Corporation
          oder den Betreibern beziehungsweise Rechteinhabern von
          Emergency Hamburg.
        </p>

        <p>
          „Roblox“, „Emergency Hamburg“ sowie sonstige Namen,
          Marken, Logos und Inhalte Dritter gehören den jeweiligen
          Rechteinhabern.
        </p>

        <p>
          Die Nennung dient ausschließlich der Beschreibung des
          Community- und Roleplay-Projekts.
        </p>
      `
    ),

    legalSection(
      'social',
      'Social Media',
      `
        <div class="rule-list">

          <div class="rule">
            <strong>TikTok</strong>

            <p>
              @nexura.rp
            </p>
          </div>

          <div class="rule">
            <strong>YouTube</strong>

            <p>
              NexuraRP
            </p>
          </div>

        </div>

        <p>
          Für die Inhalte und Datenverarbeitung auf den jeweiligen
          Plattformen gelten zusätzlich die Bedingungen und
          Datenschutzhinweise der jeweiligen Anbieter.
        </p>
      `
    ),

    legalSection(
      'links',
      'Externe Links',
      `
        <p>
          Die Website kann Verknüpfungen zu externen Angeboten
          enthalten.
        </p>

        <p>
          Auf fremde Inhalte hat Nexura RP keinen fortlaufenden
          Einfluss.
        </p>

        <p>
          Für die Inhalte externer Seiten sind grundsätzlich deren
          jeweilige Anbieter verantwortlich.
        </p>

        <p>
          Werden konkrete Rechtsverletzungen auf einer verlinkten
          Seite bekannt, wird der betreffende Link nach Prüfung
          entfernt, soweit dies erforderlich ist.
        </p>
      `
    ),
  ];

  return legalLayout(
    pageHero(
      'Impressum',
      'Impressum & <span class="gradient-text">Anbieterkennzeichnung.</span>',
      'Kontakt- und Verantwortlichkeitsangaben für Nexura RP.'
    ),
    nav,
    sections
  );
}

/* =========================================================
   DATENSCHUTZERKLÄRUNG
========================================================= */

export function renderDatenschutz() {
  const nav = [
    ['verantwortlicher', 'Verantwortlicher'],
    ['grundlagen', 'Grundlagen'],
    ['website', 'Website & Cloudflare'],
    ['supabase', 'Supabase'],
    ['discord-login', 'Discord-Login'],
    ['discord-bot', 'Discord & Bot'],
    ['hosting', 'Bot-Hosting'],
    ['support', 'Support'],
    ['tickets', 'Tickets & Transcripts'],
    ['uploads', 'Uploads & Beweise'],
    ['roblox', 'Roblox-Daten'],
    ['moderation', 'Moderation & Security'],
    ['community', 'Sessions & Community'],
    ['portal', 'Internes Portal'],
    ['browser', 'Browser-Speicherung'],
    ['widget', 'Discord-Widget'],
    ['empfaenger', 'Empfänger'],
    ['drittland', 'Drittland'],
    ['speicher', 'Speicherdauer'],
    ['rechte', 'Deine Rechte'],
    ['widerspruch', 'Widerspruch'],
    ['aufsicht', 'Aufsichtsbehörde'],
    ['automatisierung', 'Automatisierung'],
    ['sicherheit', 'Datensicherheit'],
    ['aenderungen', 'Änderungen'],
  ];

  const sections = [
    legalSection(
      'verantwortlicher',
      '1. Verantwortlicher',
      `
        <p>
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung
          (DSGVO) für die Datenverarbeitung durch Nexura RP ist:
        </p>

        <div class="rule">
          <strong>Jonas Götzner</strong>

          <p>
            Wilhelm-Dieß-Straße 28<br>
            84359 Simbach am Inn<br>
            Deutschland<br><br>

            E-Mail:
            <a
              href="mailto:${CONTACT_EMAIL}"
              style="color:inherit;text-decoration:underline"
            >
              ${CONTACT_EMAIL}
            </a>
          </p>
        </div>
      `
    ),

    legalSection(
      'grundlagen',
      '2. Zwecke und Rechtsgrundlagen der Verarbeitung',
      `
        <p>
          Nexura RP verarbeitet personenbezogene Daten nur,
          soweit dies für den Betrieb der Website, des Discord-Servers,
          des Supportsystems, der Community-Verwaltung,
          der Moderation oder der Systemsicherheit erforderlich ist.
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Art. 6 Abs. 1 lit. b DSGVO</strong>

            <p>
              Soweit eine Verarbeitung erforderlich ist, um eine
              vom Nutzer angeforderte Funktion bereitzustellen oder
              ein Nutzungs- beziehungsweise Supportverhältnis
              abzuwickeln.
            </p>
          </div>

          <div class="rule">
            <strong>Art. 6 Abs. 1 lit. f DSGVO</strong>

            <p>
              Für den sicheren, zuverlässigen und nachvollziehbaren
              Betrieb der Community, die Missbrauchsabwehr,
              Moderation, Dokumentation und technische Fehleranalyse.
            </p>
          </div>

          <div class="rule">
            <strong>Art. 6 Abs. 1 lit. a DSGVO</strong>

            <p>
              Soweit für eine konkrete Verarbeitung ausdrücklich
              eine Einwilligung eingeholt wird.
            </p>
          </div>

          <div class="rule">
            <strong>Art. 6 Abs. 1 lit. c DSGVO</strong>

            <p>
              Soweit eine gesetzliche Verpflichtung zur Verarbeitung
              oder Aufbewahrung besteht.
            </p>
          </div>

        </div>
      `
    ),

    legalSection(
      'website',
      '3. Aufruf der Website und Cloudflare',
      `
        <p>
          Beim Aufruf der Website werden technisch erforderliche
          Verbindungsdaten verarbeitet.
        </p>

        <p>
          Dazu können insbesondere folgende Daten gehören:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Verbindungsdaten</strong>

            <p>
              IP-Adresse, Zeitpunkt des Zugriffs,
              aufgerufene Ressource und Referrer.
            </p>
          </div>

          <div class="rule">
            <strong>Geräteinformationen</strong>

            <p>
              Browsertyp, Betriebssystem, Gerätetyp und weitere
              technisch erforderliche Informationen.
            </p>
          </div>

          <div class="rule">
            <strong>Sicherheitsdaten</strong>

            <p>
              Technische Fehler-, Netzwerk- und Sicherheitsdaten.
            </p>
          </div>

        </div>

        <p>
          Die Website wird über Dienste von Cloudflare
          bereitgestellt und abgesichert.
        </p>

        <p>
          Dabei können Verbindungs- und Sicherheitsdaten durch
          Cloudflare verarbeitet werden.
        </p>

        <div class="rule">
          <strong>Cloudflare, Inc.</strong>

          <p>
            101 Townsend St.<br>
            San Francisco, CA 94107<br>
            USA
          </p>
        </div>

        <p>
          Die Verarbeitung dient insbesondere der Auslieferung,
          Stabilität und Sicherheit der Website.
        </p>

        <p>
          Rechtsgrundlage ist insbesondere
          Art. 6 Abs. 1 lit. f DSGVO.
        </p>
      `
    ),

    legalSection(
      'supabase',
      '4. Supabase: Datenbank, Authentifizierung und Speicher',
      `
        <p>
          Nexura RP verwendet Supabase für Datenbank-,
          Authentifizierungs-, Storage- und Backendfunktionen.
        </p>

        <p>
          Je nach genutzter Funktion können dort unter anderem
          folgende Daten verarbeitet werden:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Kontodaten</strong>

            <p>
              Nutzerkennungen, E-Mail-Adresse,
              Discord-Zuordnung und Profilangaben.
            </p>
          </div>

          <div class="rule">
            <strong>Berechtigungsdaten</strong>

            <p>
              Website-Rollen, Freigaben und Zugriffsstatus.
            </p>
          </div>

          <div class="rule">
            <strong>Support- und Communitydaten</strong>

            <p>
              Supportanfragen, Tickets, Sessions,
              Bewerbungen und Communityvorgänge.
            </p>
          </div>

          <div class="rule">
            <strong>Moderations- und Verwaltungsdaten</strong>

            <p>
              Fälle, Akten, Notizen, Logs und interne
              Verwaltungsinformationen.
            </p>
          </div>

          <div class="rule">
            <strong>Dateien</strong>

            <p>
              Hochgeladene Screenshots und weitere
              im Rahmen der jeweiligen Funktion gespeicherte Dateien.
            </p>
          </div>

        </div>

        <div class="rule">
          <strong>Supabase</strong>

          <p>
            Supabase stellt unter anderem PostgreSQL-Datenbank,
            Authentifizierung und Storage für Nexura RP bereit.
          </p>
        </div>

        <p>
          Nach aktuellem Betreiber-Konfigurationsstand werden
          die primären Projektdaten an einem Standort innerhalb
          der Europäischen Union geführt.
        </p>

        <p>
          Als Projektstandort ist derzeit Rumänien hinterlegt.
        </p>

        <p>
          Einzelne Support-, Verwaltungs- oder Unterauftragnehmer-
          Prozesse des Dienstleisters können unabhängig davon
          außerhalb dieses Standorts stattfinden.
        </p>
      `
    ),

    legalSection(
      'discord-login',
      '5. Anmeldung mit Discord',
      `
        <p>
          Spieler und Teammitglieder können sich über Discord
          auf der Website anmelden.
        </p>

        <p>
          Im Rahmen des OAuth-Anmeldevorgangs können insbesondere
          folgende Informationen an Nexura RP übermittelt werden:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Discord-Nutzer-ID</strong>

            <p>
              Wird zur eindeutigen Zuordnung des Discord-Kontos
              verwendet.
            </p>
          </div>

          <div class="rule">
            <strong>Discord-Nutzername</strong>

            <p>
              Einschließlich des von Discord übermittelten
              Anzeigenamens.
            </p>
          </div>

          <div class="rule">
            <strong>Avatar</strong>

            <p>
              Soweit Discord diesen im Rahmen der Anmeldung
              bereitstellt.
            </p>
          </div>

          <div class="rule">
            <strong>E-Mail-Adresse</strong>

            <p>
              Soweit sie Bestandteil des vom Nutzer freigegebenen
              OAuth-Umfangs ist.
            </p>
          </div>

          <div class="rule">
            <strong>OAuth-Identitätsdaten</strong>

            <p>
              Technische Daten, die für die Anmeldung und
              Kontoverknüpfung erforderlich sind.
            </p>
          </div>

        </div>

        <p>
          Die Discord-Nutzer-ID wird insbesondere benötigt,
          um ein Website-Konto eindeutig mit Discord-Funktionen
          wie privaten Supporttickets zu verbinden.
        </p>

        <p>
          Rechtsgrundlage ist insbesondere Art. 6 Abs. 1 lit. b DSGVO
          für die vom Nutzer gewünschte Anmeldung und
          Art. 6 Abs. 1 lit. f DSGVO für die sichere
          Kontozuordnung.
        </p>
      `
    ),

    legalSection(
      'discord-bot',
      '6. Discord-Server und Nexura-Bot',
      `
        <p>
          Bei der Nutzung des Nexura-RP-Discord-Servers und des Bots
          können abhängig von der jeweiligen Funktion
          personenbezogene Daten verarbeitet werden.
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Discord-Daten</strong>

            <p>
              Nutzer-ID, Nutzername, Rollen,
              Server- und Kanalzugehörigkeit sowie relevante
              Mitgliedschaftsereignisse.
            </p>
          </div>

          <div class="rule">
            <strong>Bot-Nutzung</strong>

            <p>
              Verwendete Befehle, Interaktionen,
              Dienstzeiten, Session-RSVPs,
              Supportvorgänge und technische Statusdaten.
            </p>
          </div>

          <div class="rule">
            <strong>Nachrichten- und Moderationsdaten</strong>

            <p>
              Nachrichteninhalte, soweit sie für aktivierte
              Funktionen wie AutoMod, Tickets,
              Transcripts, Logs oder konkrete
              Moderationsvorgänge benötigt werden.
            </p>
          </div>

          <div class="rule">
            <strong>Voice-State-Daten</strong>

            <p>
              Beim Support-Warteraum wird verarbeitet,
              ob ein Nutzer einen bestimmten Sprachkanal
              betritt oder verlässt.
            </p>
          </div>

        </div>

        <p>
          Die eingerichtete Support-Warteraum-Funktion
          zeichnet keine Sprachinhalte auf.
        </p>

        <p>
          Rechtsgrundlage ist insbesondere
          Art. 6 Abs. 1 lit. f DSGVO.
        </p>

        <p>
          Das berechtigte Interesse liegt im sicheren und
          funktionsfähigen Betrieb der Community,
          der Supportbearbeitung und der Durchsetzung
          der Community-Regeln.
        </p>
      `
    ),

    legalSection(
      'hosting',
      '7. Hosting des Discord-Bots',
      `
        <p>
          Der Discord-Bot wird über den Hostinganbieter
          Wispbyte betrieben.
        </p>

        <p>
          Im Rahmen des technischen Hostings können Betriebs-,
          Verbindungs- und Anwendungsdaten verarbeitet werden,
          die erforderlich sind, um den Bot auszuführen
          und technische Fehler zu analysieren.
        </p>

        <p>
          Welche konkreten Infrastrukturstandorte oder
          Unterauftragnehmer im Einzelfall eingesetzt werden,
          richtet sich nach dem beim Hostinganbieter bereitgestellten
          System.
        </p>
      `
    ),

    legalSection(
      'support',
      '8. Supportanfragen über die Website',
      `
        <p>
          Über die Website können Supportanfragen an Nexura RP
          gesendet werden.
        </p>

        <p>
          Dabei können insbesondere folgende Daten verarbeitet werden:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Anfragedaten</strong>

            <p>
              Kategorie, Priorität, Betreff und Beschreibung.
            </p>
          </div>

          <div class="rule">
            <strong>Accountdaten</strong>

            <p>
              Discord-Name, Roblox-Name,
              Website-Nutzer-ID und Discord-Zuordnung.
            </p>
          </div>

          <div class="rule">
            <strong>Beweisdaten</strong>

            <p>
              Screenshots, externe Beweislinks,
              Videos und Fall- beziehungsweise Aktennummern.
            </p>
          </div>

          <div class="rule">
            <strong>Technische Referenz</strong>

            <p>
              Eine interne Vorgangsreferenz wie beispielsweise
              NXR-...
            </p>
          </div>

        </div>

        <p>
          Sensible Supportkategorien können eine Anmeldung
          voraussetzen.
        </p>

        <p>
          Die Daten werden verwendet, um die Anfrage zu bearbeiten,
          Zuständigkeiten herzustellen, Rückfragen zu ermöglichen
          und den Vorgang nachvollziehbar zu dokumentieren.
        </p>

        <p>
          Rechtsgrundlage ist je nach Vorgang
          Art. 6 Abs. 1 lit. b DSGVO und/oder
          Art. 6 Abs. 1 lit. f DSGVO.
        </p>
      `
    ),

    legalSection(
      'tickets',
      '9. Website-Tickets, Discord-Tickets, Transcripts und Bewertungen',
      `
        <p>
          Kann eine Website-Anfrage einem Discord-Konto
          zugeordnet werden, kann Nexura RP automatisch
          einen privaten Discord-Ticketkanal erstellen.
        </p>

        <p>
          Dabei können unter anderem verarbeitet werden:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Ticketdaten</strong>

            <p>
              Website-Referenz, Ticketnummer,
              Ticketart und Ticketstatus.
            </p>
          </div>

          <div class="rule">
            <strong>Nutzerdaten</strong>

            <p>
              Discord-Nutzer-ID und Discord-Name.
            </p>
          </div>

          <div class="rule">
            <strong>Supporterdaten</strong>

            <p>
              Zuständiger Supporter und Zeitpunkt
              der Übernahme.
            </p>
          </div>

          <div class="rule">
            <strong>Ticketinhalte</strong>

            <p>
              Nachrichten, Zeitpunkte,
              Links und gegebenenfalls Verweise
              auf Anhänge.
            </p>
          </div>

        </div>

        <p>
          Beim Schließen eines Tickets kann ein Transcript
          erstellt werden.
        </p>

        <p>
          Ein Transcript kann insbesondere Discord-Namen,
          Discord-IDs, Nachrichteninhalte, Zeitpunkte,
          Ticketinformationen sowie Hinweise auf Anhänge
          oder Links enthalten.
        </p>

        <p>
          Nach dem Schließen kann der Nutzer per
          Discord-Direktnachricht um eine Bewertung
          von 1 bis 5 Sternen gebeten werden.
        </p>

        <p>
          Gespeichert werden können Ticketbezug,
          Bewertung, Bewertungszeitpunkt und
          der zuständige Supporter.
        </p>

        <p>
          Zweck ist die Bearbeitung und Dokumentation
          von Supportfällen sowie die interne
          Qualitätskontrolle.
        </p>

        <p>
          Rechtsgrundlage ist insbesondere
          Art. 6 Abs. 1 lit. f DSGVO.
        </p>
      `
    ),

    legalSection(
      'uploads',
      '10. Screenshots, Dateien und Beweislinks',
      `
        <p>
          Im Support- und Verwaltungsbereich können
          Bilder sowie Links zu externen Beweisen oder
          Videos eingereicht werden.
        </p>

        <p>
          Nutzer sollen nur Inhalte übermitteln,
          die für den konkreten Vorgang erforderlich sind
          und zu deren Übermittlung sie berechtigt sind.
        </p>

        <p>
          Besonders sensible personenbezogene Daten
          sowie Daten unbeteiligter Dritter sollen nur
          übermittelt werden, wenn dies für die Bearbeitung
          zwingend erforderlich und rechtlich zulässig ist.
        </p>

        <p>
          Dazu können insbesondere Angaben über Gesundheit,
          Religion, politische Überzeugungen,
          Sexualleben oder sexuelle Orientierung gehören.
        </p>
      `
    ),

    legalSection(
      'roblox',
      '11. Roblox-Profile und freiwillige Kontodaten',
      `
        <p>
          Nutzer können freiwillig Roblox-bezogene
          Angaben hinterlegen.
        </p>

        <p>
          Dazu können gehören:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Roblox-Benutzername</strong>
          </div>

          <div class="rule">
            <strong>Roblox-User-ID</strong>
          </div>

          <div class="rule">
            <strong>Display Name</strong>
          </div>

          <div class="rule">
            <strong>Profildaten</strong>

            <p>
              Beispielsweise ein daraus erzeugter Profillink.
            </p>
          </div>

          <div class="rule">
            <strong>Nexura-interne Namenshistorie</strong>

            <p>
              Änderungen, die innerhalb des Nexura-Systems
              dokumentiert wurden.
            </p>
          </div>

        </div>

        <p>
          Diese Angaben dienen der Zuordnung von Communitykonten
          sowie der Bearbeitung von Support- und Moderationsvorgängen.
        </p>

        <p>
          Ein über Nexura gespeichertes Roblox-Profil
          ist keine offizielle Verifizierung durch
          Roblox Corporation.
        </p>
      `
    ),

    legalSection(
      'moderation',
      '12. Moderation, Nutzerakten, Logs und Security',
      `
        <p>
          Zur Durchsetzung der Community-Regeln und zur
          Systemsicherheit können insbesondere folgende
          Daten verarbeitet werden:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Moderationsfälle</strong>

            <p>
              Discord-Nutzer-ID, Fallnummer,
              Art und Grund eines Falls,
              zuständiger Moderator und Zeitpunkt.
            </p>
          </div>

          <div class="rule">
            <strong>Sanktionen</strong>

            <p>
              Warnungen, Timeouts,
              Bans, Tempbans und deren Status.
            </p>
          </div>

          <div class="rule">
            <strong>Interne Dokumentation</strong>

            <p>
              Notizen, Nutzerakten,
              Fallrevisionen und relevante Roblox-Bezüge.
            </p>
          </div>

          <div class="rule">
            <strong>Sicherheitsereignisse</strong>

            <p>
              Rollenänderungen, Kanaländerungen,
              Moderationsereignisse und andere
              sicherheitsrelevante Serveraktionen.
            </p>
          </div>

        </div>

        <p>
          AutoMod kann abhängig von der Konfiguration
          beispielsweise Discord-Einladungslinks,
          Mention-Spam, Nachrichten-Spam oder
          wiederholte identische Nachrichten erkennen
          und Nachrichten automatisiert entfernen.
        </p>

        <p>
          Das Security-/Anti-Nuke-System kann sensible
          Discord-Änderungen protokollieren und bei Erreichen
          konfigurierter Schwellenwerte innerhalb der Community
          automatisierte Schutzmaßnahmen auslösen.
        </p>

        <p>
          Dazu kann beispielsweise der Entzug von
          Discord-Rollen gehören.
        </p>

        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
        </p>

        <p>
          Das berechtigte Interesse besteht im Schutz des Servers,
          der Communitymitglieder und der Nachvollziehbarkeit
          von Moderationsentscheidungen.
        </p>
      `
    ),

    legalSection(
      'community',
      '13. Sessions, Creator-Nachweise und RP-Ränge',
      `
        <p>
          Bei der Sessionverwaltung können unter anderem
          folgende Daten verarbeitet werden:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Sessiondaten</strong>

            <p>
              Titel, Startzeit, Endzeit,
              Hinweise, Servercode und Join-Link.
            </p>
          </div>

          <div class="rule">
            <strong>Verantwortliche Personen</strong>

            <p>
              Antragsteller und freigebende Person.
            </p>
          </div>

          <div class="rule">
            <strong>Teilnahmedaten</strong>

            <p>
              RSVP-Angaben wie „Dabei“,
              „Vielleicht“ oder „Nicht dabei“.
            </p>
          </div>

          <div class="rule">
            <strong>Discord-Event-Daten</strong>

            <p>
              Verknüpfung mit einem Discord Scheduled Event.
            </p>
          </div>

        </div>

        <p>
          Bei Creator- und RP-Rang-Funktionen können
          Discord-Nutzer-ID, Nachweislinks,
          interne Notizen, Rangrollen,
          Berufsbereiche, Verantwortliche und
          Prüftermine gespeichert werden.
        </p>

        <p>
          Die Verarbeitung dient der Organisation
          und Verwaltung der Nexura-RP-Community.
        </p>
      `
    ),

    legalSection(
      'portal',
      '14. Internes Team- und Owner-Portal',
      `
        <p>
          Im internen Portal können – abhängig von
          Rolle und Berechtigung – weitere Daten
          verarbeitet werden.
        </p>

        <p>
          Dazu können insbesondere gehören:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Bewerbungen</strong>
          </div>

          <div class="rule">
            <strong>Teamrollen und Freigaben</strong>
          </div>

          <div class="rule">
            <strong>Abwesenheiten und Austritte</strong>
          </div>

          <div class="rule">
            <strong>Beförderungen</strong>
          </div>

          <div class="rule">
            <strong>Interne Bewertungen</strong>
          </div>

          <div class="rule">
            <strong>Schulungen und Abmahnungen</strong>
          </div>

          <div class="rule">
            <strong>Projekte</strong>
          </div>

          <div class="rule">
            <strong>Interne Regeln</strong>
          </div>

          <div class="rule">
            <strong>Gangverwaltung</strong>
          </div>

          <div class="rule">
            <strong>Administrative Änderungen und Audit-Einträge</strong>
          </div>

        </div>

        <p>
          Diese Bereiche sind ausschließlich für
          entsprechend berechtigte Personen vorgesehen.
        </p>

        <p>
          Zugriffe können protokolliert werden,
          soweit dies zur Sicherheit und
          Nachvollziehbarkeit erforderlich ist.
        </p>
      `
    ),

    legalSection(
      'browser',
      '15. Technisch notwendige Speicherung im Browser',
      `
        <p>
          Für Anmeldung, Sitzungsverwaltung,
          Sicherheitsfunktionen und gegebenenfalls
          lokale Test- beziehungsweise Demo-Funktionen
          können Informationen im Browser gespeichert
          oder ausgelesen werden.
        </p>

        <p>
          Dazu können beispielsweise Local Storage
          oder Session Storage verwendet werden.
        </p>

        <p>
          Soweit eine Speicherung oder ein Zugriff
          unbedingt erforderlich ist, um einen vom Nutzer
          ausdrücklich gewünschten digitalen Dienst
          bereitzustellen, erfolgt dies nach Maßgabe
          der einschlägigen gesetzlichen Vorgaben.
        </p>

        <p>
          Nach aktuellem Projektstand setzt Nexura RP
          kein eigenes Werbe- oder Marketingtracking ein.
        </p>

        <p>
          Werden später Analyse-, Werbe- oder Marketingdienste
          ergänzt, muss diese Datenschutzerklärung angepasst
          und gegebenenfalls ein Einwilligungsmechanismus
          eingerichtet werden.
        </p>
      `
    ),

    legalSection(
      'widget',
      '16. Discord-Widget',
      `
        <p>
          Auf der Website kann ein Discord-Server-Widget
          eingebunden sein.
        </p>

        <p>
          Beim Laden dieses Widgets wird eine direkte
          Verbindung zu Discord hergestellt.
        </p>

        <p>
          Dabei können insbesondere IP-Adresse,
          Browser- und Geräteinformationen sowie
          weitere technisch erforderliche Verbindungsdaten
          an Discord übermittelt werden.
        </p>

        <p>
          Für die weitere Verarbeitung innerhalb
          der Discord-Plattform gelten zusätzlich
          die Datenschutzbestimmungen von Discord.
        </p>
      `
    ),

    legalSection(
      'empfaenger',
      '17. Empfänger und Dienstleister',
      `
        <p>
          Je nach verwendeter Funktion können
          personenbezogene Daten insbesondere an folgende
          Empfänger beziehungsweise Dienstleister
          übermittelt oder von ihnen verarbeitet werden:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Cloudflare</strong>

            <p>
              Websitebereitstellung,
              Netzwerk- und Sicherheitsfunktionen.
            </p>
          </div>

          <div class="rule">
            <strong>Supabase</strong>

            <p>
              Datenbank, Authentifizierung,
              Storage und Backend.
            </p>
          </div>

          <div class="rule">
            <strong>Discord</strong>

            <p>
              OAuth-Anmeldung, Discord-Server,
              Nachrichten, Tickets,
              Rollen und Botkommunikation.
            </p>
          </div>

          <div class="rule">
            <strong>Wispbyte</strong>

            <p>
              Technischer Betrieb des Discord-Bots.
            </p>
          </div>

          <div class="rule">
            <strong>Berechtigte Nexura-Teammitglieder</strong>

            <p>
              Nur soweit der jeweilige Aufgabenbereich
              und die eingerichteten Zugriffsrechte
              dies erfordern.
            </p>
          </div>

        </div>
      `
    ),

    legalSection(
      'drittland',
      '18. Übermittlungen in Drittländer',
      `
        <p>
          Einige eingesetzte Anbieter oder deren
          Unterauftragnehmer können Daten außerhalb
          der Europäischen Union beziehungsweise
          des Europäischen Wirtschaftsraums verarbeiten.
        </p>

        <p>
          Dies kann insbesondere die USA betreffen.
        </p>

        <p>
          Soweit hierfür kein Angemessenheitsbeschluss besteht,
          kommen je nach Anbieter geeignete Garantien
          wie Standardvertragsklauseln oder andere nach der
          DSGVO zulässige Übermittlungsmechanismen in Betracht.
        </p>

        <p>
          Die jeweiligen Dienstleister informieren in ihren
          Datenschutzhinweisen über internationale
          Datenübermittlungen und die von ihnen
          eingesetzten Schutzmechanismen.
        </p>
      `
    ),

    legalSection(
      'speicher',
      '19. Speicherdauer',
      `
        <p>
          Personenbezogene Daten werden grundsätzlich nur
          so lange gespeichert, wie dies für den jeweiligen
          Zweck erforderlich ist oder gesetzliche Pflichten
          eine längere Aufbewahrung verlangen.
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Website-Konto</strong>

            <p>
              Solange das Konto für die Nutzung von
              Nexura RP benötigt wird beziehungsweise
              bis eine zulässige Löschung erfolgt.
            </p>
          </div>

          <div class="rule">
            <strong>Support und Tickets</strong>

            <p>
              Für die Dauer der Bearbeitung und anschließend,
              soweit dies für Nachvollziehbarkeit,
              Missbrauchsabwehr, Beschwerden oder
              Rechtsverteidigung erforderlich ist.
            </p>
          </div>

          <div class="rule">
            <strong>Transcripts</strong>

            <p>
              Solange eine nachvollziehbare Dokumentation
              des Supportvorgangs erforderlich ist.
            </p>
          </div>

          <div class="rule">
            <strong>Moderations- und Sicherheitsdaten</strong>

            <p>
              Solange dies für Communityregeln,
              Einsprüche, Wiederholungsfälle,
              Sicherheit oder Dokumentation erforderlich ist.
            </p>
          </div>

          <div class="rule">
            <strong>Roblox-Profile und freiwillige Angaben</strong>

            <p>
              Bis zur Änderung beziehungsweise Löschung
              oder bis die Speicherung für Nexura RP
              nicht mehr erforderlich ist.
            </p>
          </div>

        </div>

        <p>
          Derzeit besteht nicht für sämtliche
          Nexura-Datensätze eine einheitliche
          automatische Löschfrist.
        </p>

        <p>
          Wo keine feste Frist festgelegt ist,
          richtet sich die Löschung insbesondere
          nach Zweckfortfall, Erforderlichkeit
          und gegebenenfalls gesetzlichen
          Aufbewahrungspflichten.
        </p>
      `
    ),

    legalSection(
      'rechte',
      '20. Rechte betroffener Personen',
      `
        <p>
          Betroffene Personen haben nach Maßgabe
          der gesetzlichen Voraussetzungen
          insbesondere folgende Rechte:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Auskunft</strong>

            <p>
              Recht auf Auskunft über verarbeitete
              personenbezogene Daten.
            </p>
          </div>

          <div class="rule">
            <strong>Berichtigung</strong>

            <p>
              Recht auf Berichtigung unrichtiger
              oder unvollständiger Daten.
            </p>
          </div>

          <div class="rule">
            <strong>Löschung</strong>

            <p>
              Recht auf Löschung, soweit die
              gesetzlichen Voraussetzungen erfüllt sind.
            </p>
          </div>

          <div class="rule">
            <strong>Einschränkung</strong>

            <p>
              Recht auf Einschränkung der Verarbeitung.
            </p>
          </div>

          <div class="rule">
            <strong>Datenübertragbarkeit</strong>

            <p>
              Soweit die gesetzlichen Voraussetzungen
              hierfür vorliegen.
            </p>
          </div>

          <div class="rule">
            <strong>Widerruf einer Einwilligung</strong>

            <p>
              Eine erteilte Einwilligung kann
              jederzeit mit Wirkung für die Zukunft
              widerrufen werden.
            </p>
          </div>

        </div>

        <p>
          Anfragen können an
          <a
            href="mailto:${CONTACT_EMAIL}"
            style="color:inherit;text-decoration:underline"
          >
            ${CONTACT_EMAIL}
          </a>
          gerichtet werden.
        </p>

        <p>
          Ein Widerruf berührt nicht die Rechtmäßigkeit
          der Verarbeitung, die bis zum Widerruf
          auf Grundlage der Einwilligung erfolgt ist.
        </p>
      `
    ),

    legalSection(
      'widerspruch',
      '21. Widerspruch nach Art. 21 DSGVO',
      `
        <p>
          Soweit personenbezogene Daten auf Grundlage
          von Art. 6 Abs. 1 lit. f DSGVO verarbeitet werden,
          besteht unter den gesetzlichen Voraussetzungen
          das Recht, aus Gründen, die sich aus der
          besonderen Situation der betroffenen Person ergeben,
          Widerspruch gegen die Verarbeitung einzulegen.
        </p>

        <p>
          Der Widerspruch kann an
          <a
            href="mailto:${CONTACT_EMAIL}"
            style="color:inherit;text-decoration:underline"
          >
            ${CONTACT_EMAIL}
          </a>
          gerichtet werden.
        </p>
      `
    ),

    legalSection(
      'aufsicht',
      '22. Beschwerderecht bei einer Aufsichtsbehörde',
      `
        <p>
          Betroffene Personen haben das Recht,
          sich bei einer Datenschutzaufsichtsbehörde
          zu beschweren.
        </p>

        <p>
          Für einen privaten Verantwortlichen
          mit Sitz in Bayern kommt insbesondere
          folgende Behörde in Betracht:
        </p>

        <div class="rule">
          <strong>
            Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)
          </strong>

          <p>
            Promenade 18<br>
            91522 Ansbach<br>
            Deutschland
          </p>
        </div>

        <p>
          Das Recht, sich an eine andere zuständige
          Datenschutzaufsichtsbehörde zu wenden,
          bleibt unberührt.
        </p>
      `
    ),

    legalSection(
      'automatisierung',
      '23. Bereitstellung von Daten und automatisierte Community-Maßnahmen',
      `
        <p>
          Bestimmte Angaben sind notwendig,
          wenn eine konkrete Nexura-Funktion
          genutzt werden soll.
        </p>

        <p>
          Beispielsweise ist eine Discord-ID erforderlich,
          um ein Website-Konto mit einem privaten
          Discord-Ticket zu verbinden.
        </p>

        <p>
          Werden erforderliche Daten nicht bereitgestellt,
          kann die betreffende Funktion gegebenenfalls
          nicht genutzt werden.
        </p>

        <p>
          Nexura RP verwendet technische Automatisierungen
          wie AutoMod und Security-Regeln.
        </p>

        <p>
          Diese können innerhalb der Discord-Community
          praktische Auswirkungen haben,
          beispielsweise das Löschen einer Nachricht
          oder den Entzug von Rollen.
        </p>

        <p>
          Nach aktuellem System werden keine ausschließlich
          automatisierten Entscheidungen eingesetzt,
          die gegenüber betroffenen Personen rechtliche
          Wirkung im Sinne von Art. 22 DSGVO entfalten
          oder sie in ähnlich erheblicher Weise
          rechtlich betreffen.
        </p>

        <p>
          Bei Einwänden gegen Community-Maßnahmen
          kann eine menschliche Überprüfung über
          den Support oder per E-Mail verlangt werden.
        </p>
      `
    ),

    legalSection(
      'sicherheit',
      '24. Datensicherheit',
      `
        <p>
          Nexura RP setzt technische und organisatorische
          Maßnahmen ein, um personenbezogene Daten
          angemessen zu schützen.
        </p>

        <p>
          Dazu gehören je nach Bereich unter anderem:
        </p>

        <div class="rule-list">

          <div class="rule">
            <strong>Rollenbasierte Zugriffsrechte</strong>
          </div>

          <div class="rule">
            <strong>Private Discord-Ticketkanäle</strong>
          </div>

          <div class="rule">
            <strong>Interne Portalberechtigungen</strong>
          </div>

          <div class="rule">
            <strong>Authentifizierung</strong>
          </div>

          <div class="rule">
            <strong>Getrennte serverseitige Zugangsdaten</strong>
          </div>

          <div class="rule">
            <strong>Sicherheits- und Auditlogs</strong>
          </div>

          <div class="rule">
            <strong>Bot-Sicherheitsmechanismen</strong>
          </div>

        </div>

        <p>
          Kein technisches System kann absolute
          Sicherheit gewährleisten.
        </p>

        <p>
          Hinweise auf Sicherheitsprobleme können an
          <a
            href="mailto:${CONTACT_EMAIL}"
            style="color:inherit;text-decoration:underline"
          >
            ${CONTACT_EMAIL}
          </a>
          gemeldet werden.
        </p>
      `
    ),

    legalSection(
      'aenderungen',
      '25. Änderungen dieser Datenschutzerklärung',
      `
        <p>
          Diese Datenschutzerklärung wird angepasst,
          wenn sich Funktionen, eingesetzte Dienstleister,
          Verarbeitungszwecke oder rechtliche Anforderungen ändern.
        </p>

        <p>
          <strong>Stand: September 2026</strong>
        </p>

        <p>
          Die jeweils aktuelle Fassung wird
          auf dieser Website veröffentlicht.
        </p>
      `
    ),
  ];

  return legalLayout(
    pageHero(
      'Datenschutz',
      'Deine Daten. <span class="gradient-text">Transparent erklärt.</span>',
      'Informationen zur Verarbeitung personenbezogener Daten bei Nexura RP.'
    ),
    nav,
    sections
  );
}

/* =========================================================
   BINDINGS
========================================================= */

export function bindLegal() {
  if (!location.hash) {
    return;
  }

  setTimeout(() => {
    const target = document.querySelector(location.hash);

    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 0);
}
