import { CONFIG } from '../config.js';
import { pageHero } from '../components/layout.js';
import { currentAuth } from '../lib/auth.js';
import { createSubmission, listRows } from '../lib/store.js';
import { escapeHtml, formDataObject } from '../lib/utils.js';
import { toast } from '../components/ui.js';

const FORM_TYPES = {
  idea: {
    title: 'Idee einreichen',
    intro: 'Verbesserungen für Sessions, RP, Fraktionen, Website oder Community.',
    fields: `
      <label class="field"><span>Kategorie *</span><select class="select" name="category" required><option>Roleplay</option><option>Sessions</option><option>Fraktionen</option><option>Website</option><option>Discord</option><option>Community</option><option>Sonstiges</option></select></label>
      <label class="field"><span>Titel *</span><input class="input" name="title" required maxlength="100"></label>
      <label class="field field--full"><span>Idee *</span><textarea class="textarea" name="message" minlength="30" maxlength="3000" required></textarea></label>
      <label class="field field--full"><span>Welches Problem löst sie?</span><textarea class="textarea" name="benefit" maxlength="1500"></textarea></label>`,
  },
  feedback: {
    title: 'Feedback geben',
    intro: 'Sachliches Lob, Kritik oder ein Verbesserungsvorschlag.',
    fields: `
      <label class="field"><span>Bereich *</span><select class="select" name="category" required><option>Roleplay</option><option>Team</option><option>Support</option><option>Website</option><option>Discord</option><option>Allgemein</option></select></label>
      <label class="field"><span>Bewertung</span><select class="select" name="rating"><option value="">Keine Angabe</option><option>1 / 5</option><option>2 / 5</option><option>3 / 5</option><option>4 / 5</option><option>5 / 5</option></select></label>
      <label class="field field--full"><span>Feedback *</span><textarea class="textarea" name="message" minlength="20" maxlength="3000" required></textarea></label>`,
  },
  partnership: {
    title: 'Partnerschaft anfragen',
    intro: 'Für passende Roblox-, Discord- oder Community-Projekte.',
    fields: `
      <label class="field"><span>Projektname *</span><input class="input" name="project_name" required></label>
      <label class="field"><span>Discord-Kontakt *</span><input class="input" name="discord_name" required></label>
      <label class="field"><span>Mitgliederzahl</span><input class="input" name="member_count" type="number" min="1"></label>
      <label class="field"><span>Projekt-Link *</span><input class="input" name="project_url" type="url" required></label>
      <label class="field field--full"><span>Projektbeschreibung *</span><textarea class="textarea" name="description" minlength="80" required></textarea></label>
      <label class="field field--full"><span>Was bringt die Partnerschaft beiden Seiten? *</span><textarea class="textarea" name="benefit" minlength="40" required></textarea></label>`,
  },
  creator: {
    title: 'Content-Creator-Anfrage',
    intro: 'Für Creator, die Nexura RP begleiten oder Inhalte produzieren möchten.',
    fields: `
      <label class="field"><span>Creator-Name *</span><input class="input" name="creator_name" required></label>
      <label class="field"><span>Discord-Name *</span><input class="input" name="discord_name" required></label>
      <label class="field"><span>Plattform *</span><select class="select" name="platform" required><option>YouTube</option><option>TikTok</option><option>Twitch</option><option>Instagram</option><option>Andere</option></select></label>
      <label class="field"><span>Kanal-Link *</span><input class="input" name="channel_url" type="url" required></label>
      <label class="field field--full"><span>Welche Inhalte planst du? *</span><textarea class="textarea" name="content_plan" minlength="50" required></textarea></label>`,
  },
  rp_nomination: {
    title: 'RP-Spieler vorschlagen',
    intro: 'Nenne jemanden, der besonders faires, glaubwürdiges oder hilfreiches RP gezeigt hat.',
    fields: `
      <label class="field"><span>Roblox-Name der Person *</span><input class="input" name="nominee_roblox" required></label>
      <label class="field"><span>Dein Roblox-Name</span><input class="input" name="submitter_roblox"></label>
      <label class="field field--full"><span>Warum verdient die Person Anerkennung? *</span><textarea class="textarea" name="reason" minlength="40" required></textarea></label>
      <label class="field field--full"><span>Beweis- oder Clip-Link</span><input class="input" name="evidence_url" type="url"></label>`,
  },
  support_rating: {
    title: 'Support bewerten',
    intro: 'Bewerte einen abgeschlossenen Supportfall sachlich und fair.',
    fields: `
      <label class="field"><span>Fallnummer</span><input class="input" name="case_reference"></label>
      <label class="field"><span>Bewertung *</span><select class="select" name="rating" required><option value="">Auswählen</option><option>1 / 5</option><option>2 / 5</option><option>3 / 5</option><option>4 / 5</option><option>5 / 5</option></select></label>
      <label class="field field--full"><span>Begründung *</span><textarea class="textarea" name="message" minlength="20" required></textarea></label>`,
  },
};

function formCard(key, definition, profile = {}) {
  return `<article class="community-form-card" id="${key}"><div class="community-form-card__head"><span class="tag">${escapeHtml(definition.title)}</span><h2>${escapeHtml(definition.title)}</h2><p>${escapeHtml(definition.intro)}</p></div><form data-community-form="${key}"><div class="field-grid">
    <label class="field"><span>Discord-Name</span><input class="input" name="contact_name" value="${escapeHtml(profile.discord_name || '')}"></label>
    <label class="field"><span>Roblox-Name</span><input class="input" name="roblox_name" value="${escapeHtml(profile.roblox_name || '')}"></label>
    ${definition.fields}
  </div><label class="checkbox" style="margin-top:16px"><input type="checkbox" name="truthful" required><span>Die Angaben sind wahrheitsgemäß und sachlich formuliert. *</span></label><div class="form-actions"><button class="button button--primary" type="submit">Absenden</button></div><div data-result></div></form></article>`;
}

export async function renderCommunity() {
  const auth = await currentAuth();
  const ideas = (await listRows('ideas').catch(() => [])).filter(item => item.public !== false);
  return `${pageHero('Community-Portal', 'Deine Idee. Dein Feedback. <span class="gradient-text">Dein Nexura.</span>', 'Hier laufen die öffentlichen Community-Formulare aus dem früheren Discord-Web-App-Konzept zusammen.')}
  <section class="section section--tight"><div class="shell">
    <div class="section-heading"><div><span class="kicker">Öffentliche Ideen</span><h2>Von der Community. <span class="gradient-text">Mit Status.</span></h2></div><p>Freigegebene Vorschläge werden transparent als neu, geprüft, geplant oder umgesetzt angezeigt.</p></div>
    ${ideas.length ? `<div class="card-grid">${ideas.map(idea => `<article class="card"><span class="tag">${escapeHtml(idea.category || 'Idee')} · ${escapeHtml(idea.status || 'new')}</span><h3>${escapeHtml(idea.title)}</h3><p>${escapeHtml(idea.summary || '')}</p><span class="card-badge">${escapeHtml(idea.author_name || 'Community')}</span></article>`).join('')}</div>` : `<div class="empty-state"><div class="empty-icon">💡</div><h3>Noch keine öffentlichen Ideen</h3><p>Reiche den ersten Vorschlag ein. Nach Freigabe kann er mit Bearbeitungsstatus hier erscheinen.</p></div>`}
    <div class="community-shortcuts">${Object.entries(FORM_TYPES).map(([key, item]) => `<a class="shortcut-card" href="#${key}"><span>${escapeHtml(item.title)}</span><small>Formular öffnen →</small></a>`).join('')}</div>
    <div class="community-form-stack">${Object.entries(FORM_TYPES).map(([key, item]) => formCard(key, item, auth.profile || {})).join('')}</div>
    <div class="cta-panel"><div><span class="kicker">Roblox-Verknüpfung</span><h2>Spielerkonto und Akte <span class="gradient-text">sauber verbinden.</span></h2><p>Die sichere Verknüpfung läuft über Discord-Login, einen Code in der Roblox-Profilbeschreibung und zusätzliche Bestätigung im Discord-Ticket.</p><div class="hero-actions" style="justify-content:center"><a class="button button--primary" href="/konto" data-link>Zum Konto</a><a class="button button--secondary" href="${CONFIG.supportTicketUrl}" target="_blank" rel="noopener">Discord-Ticket</a></div></div></div>
  </div></section>`;
}

export function bindCommunity() {
  document.querySelectorAll('[data-community-form]').forEach(form => form.addEventListener('submit', async event => {
    event.preventDefault();
    const current = event.currentTarget;
    const type = current.dataset.communityForm;
    const payload = formDataObject(current);
    const auth = await currentAuth();
    const submit = current.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const row = await createSubmission(type, payload, { userId: auth.user?.id, name: auth.profile?.discord_name || payload.contact_name });
      current.reset();
      const result = current.querySelector('[data-result]');
      result.innerHTML = `<div class="form-result"><strong>Eingang bestätigt · ${escapeHtml(row.reference)}</strong><br>Dein Beitrag erscheint im Teamportal und kann dort bearbeitet werden.</div>`;
      fetch('/api/intake-webhook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reference: row.reference, category: type, subject: payload.title || payload.project_name || FORM_TYPES[type]?.title, priority: 'normal' }) }).catch(() => {});
      toast('Erfolgreich übermittelt', row.reference, 'success');
    } catch (error) {
      toast('Absenden fehlgeschlagen', error.message, 'error');
    } finally { submit.disabled = false; }
  }));
}
