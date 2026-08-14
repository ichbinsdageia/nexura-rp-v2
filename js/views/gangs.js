import { pageHero } from '../components/layout.js';
import { createSubmission, listRows } from '../lib/store.js';
import { escapeHtml, formDataObject } from '../lib/utils.js';
import { toast } from '../components/ui.js';
import { currentAuth } from '../lib/auth.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { uploadEvidenceImages } from '../lib/uploads.js';

export async function renderGangs() {
  const gangs = await listRows('gangs').catch(() => []);
  const published = gangs.filter(gang => gang.status === 'approved' || gang.published);
  return `${pageHero('Gangs', 'Von der Bewerbung zur <span class="gradient-text">offiziellen Gang.</span>', 'Bestätigte Gangs erhalten eine öffentliche Karte mit Name, Logo, Beschreibung, Farben, Motto und Kontakt.')}
  <section class="section section--tight"><div class="shell">
    ${published.length ? `<div class="card-grid">${published.map(gang => `<article class="card"><span class="tag">Bestätigt</span>${gang.logo_url ? `<img src="${escapeHtml(gang.logo_url)}" alt="Logo von ${escapeHtml(gang.name)}" style="width:80px;height:80px;object-fit:cover;border-radius:20px;margin-top:18px">` : '<div class="owner-avatar" style="margin-top:18px">G</div>'}<h3>${escapeHtml(gang.name)}</h3><p>${escapeHtml(gang.description || '')}</p><div class="card-badge">${escapeHtml(gang.motto || 'Nexura Gang')}</div></article>`).join('')}</div>` : `<div class="empty-state"><div class="empty-icon">♠</div><h2>Noch keine bestätigten Gangs</h2><p>Aktuell ist noch keine Gruppe öffentlich freigeschaltet. Die erste bestätigte Bewerbung erscheint automatisch in diesem Bereich.</p></div>`}
  </div></section>
  <section class="section section--surface"><div class="shell form-layout">
    <aside class="form-aside"><span class="kicker">Gang-Bewerbung</span><h2>Vollständig einreichen, sauber prüfen lassen.</h2><p>Die Bewerbung landet im Teamportal. Nach Prüfung kann sie angenommen, abgelehnt oder mit einer Rückfrage versehen werden.</p><div class="step-list"><div class="step"><i>1</i>Alle Angaben einreichen</div><div class="step"><i>2</i>Team prüft Namen und Konzept</div><div class="step"><i>3</i>Rückfrage oder Entscheidung</div><div class="step"><i>4</i>Freischaltung auf der Website</div></div></aside>
    <form class="form-card" id="gang-application-form"><div class="form-section"><h3>Grunddaten</h3><div class="field-grid">
      <label class="field"><span>Gangname *</span><input class="input" name="gang_name" required></label>
      <label class="field"><span>Gründer *</span><input class="input" name="founder" required></label>
      <label class="field"><span>Mitgliederzahl *</span><input class="input" name="member_count" type="number" min="2" max="100" required></label>
      <label class="field"><span>Discord-Kontakt *</span><input class="input" name="discord_contact" required></label>
      <label class="field"><span>Gangfarben *</span><input class="input" name="colors" placeholder="z. B. Schwarz / Magenta" required></label>
      <label class="field"><span>Motto *</span><input class="input" name="motto" required></label>
      <label class="field"><span>Logo-Link</span><input class="input" name="logo_url" type="url" placeholder="https://..."></label><label class="field"><span>Oder Logo hochladen</span><input class="input" name="logo_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><small>Im Produktivbetrieb ist dafür ein Discord-Login nötig.</small></label>
      <label class="field field--full"><span>Kurzbeschreibung *</span><textarea class="textarea" name="description" minlength="80" required></textarea></label>
      <label class="field field--full"><span>Roblox-Namen aller Mitglieder *</span><textarea class="textarea" name="member_roblox_names" placeholder="Ein Name pro Zeile" required></textarea></label>
    </div></div><div class="form-section"><label class="checkbox"><input type="checkbox" required name="rules_accepted"><span>Wir akzeptieren das Regelwerk und verwenden keine Namen oder Symbole realer extremistischer beziehungsweise terroristischer Organisationen. *</span></label></div><div class="form-actions"><button class="button button--primary" type="submit">Gang einreichen</button></div><div id="gang-result"></div></form>
  </div></section>`;
}

export function bindGangs() {
  document.querySelector('#gang-application-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = formDataObject(form);
    delete payload.logo_file;
    try {
      const auth = await currentAuth();
      if (isSupabaseConfigured() && !auth.user) throw new Error('Bitte zuerst mit Discord anmelden, damit die Gang-Bewerbung eindeutig zugeordnet werden kann.');
      const uploads = await uploadEvidenceImages(form.elements.logo_file?.files, 'gang-logo');
      payload.logo_upload = uploads[0] || null;
      const submission = await createSubmission('gang_application', payload, { userId: auth.user?.id, name: auth.profile?.discord_name || payload.discord_contact });
      form.reset();
      document.querySelector('#gang-result').innerHTML = `<div class="form-result"><strong>Gang-Bewerbung eingegangen · ${escapeHtml(submission.reference)}</strong><br>Die Bewerbung wird im Teamportal geprüft.</div>`;
      toast('Gang-Bewerbung eingegangen', submission.reference, 'success');
    } catch (error) { toast('Absenden fehlgeschlagen', error.message, 'error'); }
  });
}
