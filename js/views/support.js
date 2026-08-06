import { CONFIG } from '../config.js';
import { SUPPORT_CATEGORIES } from '../data/content.js';
import { pageHero } from '../components/layout.js';
import { currentAuth } from '../lib/auth.js';
import { createSubmission } from '../lib/store.js';
import { escapeHtml, formDataObject } from '../lib/utils.js';
import { toast } from '../components/ui.js';
import { uploadEvidenceImages } from '../lib/uploads.js';
import { isSupabaseConfigured } from '../lib/supabase.js';

const sensitive = new Set(['Spieler melden', 'Teammitglied melden', 'Roblox-Name oder Accountverknüpfung', 'Ban- oder Sanktionseinspruch', 'Gang-Bewerbung oder Gang-Frage', 'Team-Bewerbung', 'Team-Bewerbungs-Einspruch']);

export async function renderSupport() {
  const auth = await currentAuth();
  return `${pageHero('Support', 'Eine Anfrage. <span class="gradient-text">Klare Zuständigkeit.</span>', 'Allgemeine Hilfe, Bugs und Feedback sind ohne Login möglich. Sensible Meldungen benötigen nach Einrichtung des Systems einen Discord-Login.')}
  <section class="section section--tight"><div class="shell form-layout">
    <aside class="form-aside"><span class="kicker">Support-Center</span><h2>Website-Eingang und Discord bleiben verbunden.</h2><p>Ohne Nexura-Bot kann die Website noch keinen privaten Discord-Ticketkanal erzeugen. Sie speichert die Anfrage und kann einen Webhook-Hinweis an das Team senden. Ein normales Discord-Ticket bleibt zusätzlich möglich.</p><a class="button button--secondary" href="${CONFIG.supportTicketUrl}" target="_blank" rel="noopener">Discord-Ticket öffnen</a></aside>
    <form class="form-card" id="support-form"><div class="form-section"><h3>Anfrage</h3><div class="field-grid">
      <label class="field"><span>Kategorie *</span><select class="select" name="category" id="support-category" required><option value="">Auswählen</option>${SUPPORT_CATEGORIES.map(category => `<option>${escapeHtml(category)}</option>`).join('')}</select></label>
      <label class="field"><span>Priorität *</span><select class="select" name="priority" required><option value="normal">Normal</option><option value="high">Hoch</option><option value="urgent">Dringend</option></select></label>
      <label class="field"><span>Discord-Name</span><input class="input" name="discord_name" value="${escapeHtml(auth.profile?.discord_name || '')}"></label>
      <label class="field"><span>Roblox-Name</span><input class="input" name="roblox_name" value="${escapeHtml(auth.profile?.roblox_name || '')}"></label>
      <label class="field field--full"><span>Betreff *</span><input class="input" name="subject" required></label>
      <label class="field field--full"><span>Beschreibung *</span><textarea class="textarea" name="message" minlength="30" required></textarea></label>
      <label class="field field--full"><span>Screenshots direkt hochladen</span><input class="input" type="file" name="evidence_images" accept="image/jpeg,image/png,image/webp,image/gif" multiple><small>Bis zu 6 Bilder, jeweils maximal 10 MB. Im Produktivbetrieb ist dafür ein Login nötig.</small></label><label class="field field--full"><span>Video- und Beweislinks</span><textarea class="textarea" name="evidence_links" placeholder="YouTube, Streamable, Google Drive – ein Link pro Zeile"></textarea><small>Größere Videos werden als Link eingereicht.</small></label>
      <label class="field field--full"><span>Fall- oder Aktennummer</span><input class="input" name="case_reference" placeholder="Nur bei Einsprüchen oder bestehenden Fällen"></label>
    </div></div><div id="login-warning"></div><div class="form-actions"><button class="button button--primary" type="submit">Anfrage absenden</button></div><div id="support-result"></div></form>
  </div></section>`;
}

export function bindSupport() {
  const category = document.querySelector('#support-category');
  const warning = document.querySelector('#login-warning');
  category?.addEventListener('change', async () => {
    const auth = await currentAuth();
    if (sensitive.has(category.value) && !auth.user) warning.innerHTML = `<div class="form-result" style="border-color:rgba(255,209,102,.3);background:rgba(255,209,102,.07);color:#ffe7aa">${isSupabaseConfigured() ? 'Diese Kategorie benötigt einen Discord-Login. Bitte melde dich zuerst an.' : 'Diese Kategorie benötigt im Produktivbetrieb einen Discord-Login. Im Demo-Modus kann sie getestet werden.'}</div>`;
    else warning.innerHTML = '';
  });
  document.querySelector('#support-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = formDataObject(form);
    delete payload.evidence_images;
    const auth = await currentAuth();
    if (isSupabaseConfigured() && sensitive.has(payload.category) && !auth.user) {
      toast('Discord-Login erforderlich', 'Diese sensible Kategorie kann nur angemeldet abgesendet werden.', 'error');
      return;
    }
    try {
      payload.evidence_files = await uploadEvidenceImages(form.elements.evidence_images?.files, 'support');
      const submission = await createSubmission(['Ban- oder Sanktionseinspruch','Team-Bewerbungs-Einspruch'].includes(payload.category) ? 'appeal' : 'support', payload, { userId: auth.user?.id, name: auth.profile?.discord_name });
      form.reset();
      document.querySelector('#support-result').innerHTML = `<div class="form-result"><strong>Anfrage eingegangen · ${escapeHtml(submission.reference)}</strong><br>Bewahre die Referenznummer für Rückfragen auf.</div>`;
      fetch('/api/intake-webhook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reference: submission.reference, category: payload.category, subject: payload.subject, priority: payload.priority }) }).catch(() => {});
      toast('Anfrage eingegangen', submission.reference, 'success');
    } catch (error) { toast('Absenden fehlgeschlagen', error.message, 'error'); }
  });
}
