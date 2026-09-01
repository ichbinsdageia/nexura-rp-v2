import { CONFIG } from '../config.js';
import { SUPPORT_CATEGORIES } from '../data/content.js';
import { pageHero } from '../components/layout.js';
import { currentAuth } from '../lib/auth.js';
import { createSubmission } from '../lib/store.js';
import {
  escapeHtml,
  formDataObject
} from '../lib/utils.js';
import { toast } from '../components/ui.js';
import { uploadEvidenceImages } from '../lib/uploads.js';
import { isSupabaseConfigured } from '../lib/supabase.js';

const sensitive = new Set([
  'Spieler melden',
  'Teammitglied melden',
  'Roblox-Name oder Accountverknüpfung',
  'Ban- oder Sanktionseinspruch',
  'Gang-Bewerbung oder Gang-Frage',
  'Team-Bewerbung',
  'Team-Bewerbungs-Einspruch'
]);

export async function renderSupport() {
  const auth =
    await currentAuth();

  return `
    ${pageHero(
      'Support',
      'Eine Anfrage. <span class="gradient-text">Klare Zuständigkeit.</span>',
      'Allgemeine Hilfe, Bugs und Feedback sind ohne Login möglich. Sensible Meldungen benötigen einen Discord-Login.'
    )}

    <section class="section section--tight">
      <div class="shell form-layout">

        <aside class="form-aside">
          <span class="kicker">
            Support-Center
          </span>

          <h2>
            Website und Discord arbeiten zusammen.
          </h2>

          <p>
            Deine Anfrage wird im Nexura-System gespeichert
            und automatisch an die zuständige Discord-Abteilung
            weitergeleitet.
            ${
              auth.user
                ? 'Wenn dein Discord-Konto verknüpft ist, kann der Nexura-Bot automatisch einen privaten Ticketkanal für dich erstellen.'
                : 'Als Gast wird deine Anfrage trotzdem an das zuständige Team weitergeleitet. Für sensible Anliegen ist ein Discord-Login erforderlich.'
            }
          </p>

          <a
            class="button button--secondary"
            href="${CONFIG.supportTicketUrl}"
            target="_blank"
            rel="noopener"
          >
            Discord-Ticket öffnen
          </a>
        </aside>

        <form
          class="form-card"
          id="support-form"
        >
          <div class="form-section">
            <h3>Anfrage</h3>

            <div class="field-grid">

              <label class="field">
                <span>Kategorie *</span>

                <select
                  class="select"
                  name="category"
                  id="support-category"
                  required
                >
                  <option value="">
                    Auswählen
                  </option>

                  ${SUPPORT_CATEGORIES
                    .map(
                      category =>
                        `<option>${escapeHtml(category)}</option>`
                    )
                    .join('')}
                </select>
              </label>

              <label class="field">
                <span>Priorität *</span>

                <select
                  class="select"
                  name="priority"
                  required
                >
                  <option value="normal">
                    Normal
                  </option>

                  <option value="high">
                    Hoch
                  </option>

                  <option value="urgent">
                    Dringend
                  </option>
                </select>
              </label>

              <label class="field">
                <span>Discord-Name</span>

                <input
                  class="input"
                  name="discord_name"
                  value="${escapeHtml(
                    auth.profile?.discord_name ||
                      ''
                  )}"
                >
              </label>

              <label class="field">
                <span>Roblox-Name</span>

                <input
                  class="input"
                  name="roblox_name"
                  value="${escapeHtml(
                    auth.profile?.roblox_name ||
                      ''
                  )}"
                >
              </label>

              <label class="field field--full">
                <span>Betreff *</span>

                <input
                  class="input"
                  name="subject"
                  required
                >
              </label>

              <label class="field field--full">
                <span>Beschreibung *</span>

                <textarea
                  class="textarea"
                  name="message"
                  minlength="30"
                  required
                ></textarea>
              </label>

              <label class="field field--full">
                <span>
                  Screenshots direkt hochladen
                </span>

                <input
                  class="input"
                  type="file"
                  name="evidence_images"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                >

                <small>
                  Bis zu 6 Bilder, jeweils maximal 10 MB.
                  Für geschützte Uploads kann ein Login erforderlich sein.
                </small>
              </label>

              <label class="field field--full">
                <span>
                  Video- und Beweislinks
                </span>

                <textarea
                  class="textarea"
                  name="evidence_links"
                  placeholder="YouTube, Streamable, Google Drive – ein Link pro Zeile"
                ></textarea>

                <small>
                  Größere Videos werden als Link eingereicht.
                </small>
              </label>

              <label class="field field--full">
                <span>
                  Fall- oder Aktennummer
                </span>

                <input
                  class="input"
                  name="case_reference"
                  placeholder="Nur bei Einsprüchen oder bestehenden Fällen"
                >
              </label>

            </div>
          </div>

          <div id="login-warning"></div>

          <div class="form-actions">
            <button
              class="button button--primary"
              type="submit"
            >
              Anfrage absenden
            </button>
          </div>

          <div id="support-result"></div>
        </form>

      </div>
    </section>
  `;
}

export function bindSupport() {
  const category =
    document.querySelector(
      '#support-category'
    );

  const warning =
    document.querySelector(
      '#login-warning'
    );

  category?.addEventListener(
    'change',
    async () => {
      const auth =
        await currentAuth();

      if (
        sensitive.has(
          category.value
        ) &&
        !auth.user
      ) {
        warning.innerHTML = `
          <div
            class="form-result"
            style="
              border-color:rgba(255,209,102,.3);
              background:rgba(255,209,102,.07);
              color:#ffe7aa
            "
          >
            ${
              isSupabaseConfigured()
                ? 'Diese Kategorie benötigt einen Discord-Login. Bitte melde dich zuerst an.'
                : 'Diese Kategorie benötigt im Produktivbetrieb einen Discord-Login. Im Demo-Modus kann sie getestet werden.'
            }
          </div>
        `;
      } else {
        warning.innerHTML =
          '';
      }
    }
  );

  document
    .querySelector(
      '#support-form'
    )
    ?.addEventListener(
      'submit',
      async event => {
        event.preventDefault();

        const form =
          event.currentTarget;

        const button =
          form.querySelector(
            'button[type="submit"]'
          );

        const payload =
          formDataObject(
            form
          );

        /*
         * FileList niemals direkt
         * in das Submission-Payload übernehmen.
         */
        delete payload.evidence_images;

        const auth =
          await currentAuth();

        if (
          isSupabaseConfigured() &&
          sensitive.has(
            payload.category
          ) &&
          !auth.user
        ) {
          toast(
            'Discord-Login erforderlich',
            'Diese sensible Kategorie kann nur angemeldet abgesendet werden.',
            'error'
          );

          return;
        }

        if (button) {
          button.disabled =
            true;

          button.textContent =
            'Wird gesendet...';
        }

        try {
          /*
           * Beweisbilder zuerst hochladen.
           */
          payload.evidence_files =
            await uploadEvidenceImages(
              form.elements
                .evidence_images
                ?.files,

              'support'
            );

          const submissionType =
            [
              'Ban- oder Sanktionseinspruch',
              'Team-Bewerbungs-Einspruch'
            ].includes(
              payload.category
            )
              ? 'appeal'
              : 'support';

          /*
           * Hauptdatensatz in Supabase.
           */
          const submission =
            await createSubmission(
              submissionType,

              payload,

              {
                userId:
                  auth.user?.id,

                name:
                  auth.profile
                    ?.discord_name
              }
            );

          if (
            !submission?.id
          ) {
            throw new Error(
              'Die Anfrage wurde gespeichert, aber es wurde keine Submission-ID zurückgegeben.'
            );
          }

          /*
           * Bot-Brücke anstoßen.
           *
           * Wichtig:
           * Die vollständigen Inhalte werden NICHT
           * aus dem Browser an Discord geschickt.
           *
           * Der Bot bekommt nur die Submission-ID
           * und lädt die Daten selbst aus Supabase.
           */
          let botQueued =
            false;

          try {
            const response =
              await fetch(
                '/api/intake-webhook',
                {
                  method:
                    'POST',

                  headers: {
                    'content-type':
                      'application/json'
                  },

                  body:
                    JSON.stringify({
                      submission_id:
                        submission.id,

                      reference:
                        submission.reference,

                      category:
                        payload.category,

                      subject:
                        payload.subject,

                      priority:
                        payload.priority
                    })
                }
              );

            const result =
              await response
                .json()
                .catch(
                  () => ({})
                );

            if (
              response.ok &&
              (
                result.queued ===
                  true ||
                result.fallback ===
                  true
              )
            ) {
              botQueued =
                true;
            } else {
              console.warn(
                'Nexura Bot bridge failed:',
                response.status,
                result
              );
            }

          } catch (error) {
            /*
             * Die eigentliche Supportanfrage
             * ist bereits gespeichert.
             *
             * Deshalb darf ein temporärer
             * Discord-/Bot-Fehler dem Nutzer
             * nicht vortäuschen, seine Anfrage
             * sei verloren gegangen.
             */
            console.warn(
              'Nexura Bot bridge unavailable:',
              error
            );
          }

          form.reset();

          /*
           * Nach Reset eventuell vorausgefüllte
           * Profildaten wieder einsetzen.
           */
          if (
            form.elements
              .discord_name &&
            auth.profile
              ?.discord_name
          ) {
            form.elements
              .discord_name
              .value =
              auth.profile
                .discord_name;
          }

          if (
            form.elements
              .roblox_name &&
            auth.profile
              ?.roblox_name
          ) {
            form.elements
              .roblox_name
              .value =
              auth.profile
                .roblox_name;
          }

          const resultBox =
            document.querySelector(
              '#support-result'
            );

          if (resultBox) {
            resultBox.innerHTML = `
              <div class="form-result">
                <strong>
                  Anfrage eingegangen ·
                  ${escapeHtml(
                    submission.reference
                  )}
                </strong>

                <br>

                Bewahre die Referenznummer
                für Rückfragen auf.

                ${
                  botQueued
                    ? '<br><small>Die Anfrage wurde an das Nexura-Supportsystem weitergeleitet.</small>'
                    : '<br><small>Die Anfrage ist gespeichert. Die Discord-Weiterleitung wird gegebenenfalls intern nachbearbeitet.</small>'
                }
              </div>
            `;
          }

          toast(
            'Anfrage eingegangen',
            submission.reference,
            'success'
          );

        } catch (error) {
          console.error(
            'Support submit failed:',
            error
          );

          toast(
            'Absenden fehlgeschlagen',
            error?.message ||
              'Die Anfrage konnte nicht gespeichert werden.',
            'error'
          );

        } finally {
          if (button) {
            button.disabled =
              false;

            button.textContent =
              'Anfrage absenden';
          }
        }
      }
    );
}
