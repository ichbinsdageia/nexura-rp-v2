import { ROLE_GROUPS } from '../data/roles.js';
import { drawQuestions } from '../data/questions.js';
import { pageHero } from '../components/layout.js';
import { createSubmission, getSettings, listRows } from '../lib/store.js';
import { formDataObject, escapeHtml } from '../lib/utils.js';
import { toast } from '../components/ui.js';
import { currentAuth } from '../lib/auth.js';
import { isSupabaseConfigured } from '../lib/supabase.js';

let activeQuestions = [];
const RETRY_KEY = 'nexura-team-test-retry';

function roleOptions(selected = '', positions = []) {
  const open = new Set(positions.filter(position => position.open && position.applications_open).map(position => position.role_key));
  const useDatabase = positions.length > 0;
  return ROLE_GROUPS.flatMap(group => group.roles)
    .filter(role => role.key !== 'owner')
    .map(role => { const available = !useDatabase || open.has(role.key); return `<option value="${escapeHtml(role.key)}" ${selected === role.key && available ? 'selected' : ''} ${available ? '' : 'disabled'}>${escapeHtml(role.label)}${available ? '' : ' · geschlossen'}</option>`; }).join('');
}

export async function renderApplications() {
  const params = new URLSearchParams(location.search);
  const selectedRole = params.get('role') || 'test_support';
  const [settings, positions, auth] = await Promise.all([getSettings().catch(() => ({ team_applications_open: true })), listRows('team_positions').catch(() => []), currentAuth()]);
  activeQuestions = drawQuestions(5);
  let serverRetryAt = 0;
  if (auth.user) {
    try {
      const attempts = await listRows('submissions', { eq: { submitter_user_id: auth.user.id, type: 'team_test_attempt' }, limit: 10 });
      serverRetryAt = Math.max(0, ...attempts.map(attempt => new Date(attempt.retry_after || 0).getTime()).filter(Number.isFinite));
    } catch {}
  }
  const retryAt = Math.max(Number(localStorage.getItem(RETRY_KEY) || 0), serverRetryAt);
  const locked = retryAt > Date.now();
  const open = settings.team_applications_open !== false;
  const loginRequired = isSupabaseConfigured() && !auth.user;

  return `${pageHero('Team-Bewerbung', 'Dein Weg ins <span class="gradient-text">Nexura-Team.</span>', 'Bewerbungen bleiben sichtbar, können aber im Portal vollständig oder rollenweise geöffnet und geschlossen werden.')}
  <section class="section section--tight"><div class="shell form-layout">
    <aside class="form-aside"><span class="kicker">Bewerbungsablauf</span><h2>In der Regel startest du im Support.</h2><p>Rund 90 % der angenommenen Bewerber beginnen als Support in Ausbildung. Deine Wunschrolle hilft uns, deinen späteren Entwicklungsweg einzuordnen.</p><div class="step-list"><div class="step"><i>1</i>Vollständige Bewerbung</div><div class="step"><i>2</i>5 Fragen, mindestens 3 richtig</div><div class="step"><i>3</i>HR-Vorprüfung und Rückfragen</div><div class="step"><i>4</i>Discord-Gespräch</div><div class="step"><i>5</i>Etwa 14 Tage Probezeit</div></div></aside>
    <form class="form-card" id="team-application-form">
      ${loginRequired ? '<div class="form-result" style="border-color:rgba(255,209,102,.3);background:rgba(255,209,102,.07);color:#ffe7aa">Bitte melde dich zuerst mit Discord an. Dadurch kann die Bewerbung eindeutig deinem Konto zugeordnet werden. <a href="/konto" data-link><strong>Zur Anmeldung</strong></a></div>' : ''}
      ${!open ? '<div class="form-result" style="border-color:rgba(255,100,124,.3);background:rgba(255,100,124,.07);color:#ffc0cc">Team-Bewerbungen sind derzeit geschlossen. Das Formular bleibt zur Information sichtbar.</div>' : ''}
      ${locked ? `<div class="form-result" style="border-color:rgba(255,209,102,.3);background:rgba(255,209,102,.07);color:#ffe7aa">Der Regeltest kann erst wieder am ${new Date(retryAt).toLocaleString('de-DE')} versucht werden.</div>` : ''}
      <div class="form-section"><h3>Grunddaten</h3><p>Nutze Namen, unter denen das Team dich eindeutig finden kann.</p><div class="field-grid">
        <label class="field"><span>Discord-Name *</span><input class="input" name="discord_name" required autocomplete="username"></label>
        <label class="field"><span>Roblox-Name *</span><input class="input" name="roblox_name" required></label>
        <label class="field"><span>Alter *</span><input class="input" name="age" type="number" min="13" max="99" required></label>
        <label class="field"><span>Gewünschte Rolle *</span><select class="select" name="desired_role" required>${roleOptions(selectedRole, positions)}</select></label>
        <label class="field"><span>Wöchentliche Aktivität *</span><input class="input" name="weekly_activity" placeholder="z. B. 8–12 Stunden" required></label>
        <label class="field"><span>Mikrofon vorhanden? *</span><select class="select" name="microphone" required><option value="">Auswählen</option><option>Ja</option><option>Nein</option></select></label>
      </div></div>
      <div class="form-section"><h3>Motivation und Erfahrung</h3><p>Kurze Standardantworten reichen nicht. Zeige, wie du denkst.</p><div class="field-grid">
        <label class="field field--full"><span>Warum Nexura RP? *</span><textarea class="textarea" name="motivation" minlength="80" required></textarea></label>
        <label class="field field--full"><span>Frühere Team-Erfahrungen *</span><textarea class="textarea" name="experience" required></textarea></label>
        <label class="field"><span>Deine Stärken *</span><textarea class="textarea" name="strengths" required></textarea></label>
        <label class="field"><span>Deine Schwächen *</span><textarea class="textarea" name="weaknesses" required></textarea></label>
        <label class="field field--full"><span>Wie würdest du einen schwierigen Supportfall bearbeiten? *</span><textarea class="textarea" name="support_case" minlength="80" required></textarea></label>
      </div></div>
      <div class="form-section"><h3>Mini-Regeltest</h3><p>Fünf zufällige Fragen. Mindestens drei müssen stimmen. Bei Nichtbestehen gilt eine Wartezeit von 24 Stunden.</p><div id="rule-test">${activeQuestions.map((question,index) => `<fieldset class="test-question"><h4>${index + 1}. ${escapeHtml(question.question)}</h4><div class="answer-list">${question.options.map((option,answerIndex) => `<label class="answer"><input type="radio" name="q${index}" value="${answerIndex}" required>${escapeHtml(option)}</label>`).join('')}</div></fieldset>`).join('')}</div></div>
      <div class="form-section"><label class="checkbox"><input type="checkbox" name="rules_accepted" required><span>Ich habe das öffentliche Regelwerk gelesen und bestätige, dass meine Angaben wahrheitsgemäß sind. *</span></label></div>
      <div class="form-actions"><button class="button button--primary" type="submit" ${!open || locked || loginRequired ? 'disabled' : ''}>Bewerbung absenden</button></div><div id="application-result"></div>
    </form>
  </div></section>`;
}

export function bindApplications() {
  const form = document.querySelector('#team-application-form');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const data = formDataObject(form);
    const auth = await currentAuth();
    if (isSupabaseConfigured() && !auth.user) { toast('Anmeldung erforderlich', 'Bitte zuerst mit Discord anmelden.', 'error'); return; }
    const answers = activeQuestions.map((question,index) => Number(data[`q${index}`]));
    const score = answers.reduce((total,answer,index) => total + (answer === activeQuestions[index].answer ? 1 : 0), 0);
    const wrongTopics = activeQuestions.filter((question,index) => answers[index] !== question.answer).map(question => question.topic);
    const result = document.querySelector('#application-result');
    if (score < 3) {
      const retryAt = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(RETRY_KEY, String(retryAt));
      result.innerHTML = `<div class="form-result" style="border-color:rgba(255,100,124,.3);background:rgba(255,100,124,.07);color:#ffc0cc"><strong>Nicht bestanden: ${score}/5</strong><br>Fehlerbereiche: ${escapeHtml(wrongTopics.join(', ') || 'Allgemeine Regeln')}. Die richtigen Lösungen werden nicht angezeigt. Neuer Versuch in 24 Stunden.</div>`;
      try { await createSubmission('team_test_attempt', { score, total: 5, wrong_topics: wrongTopics }, { userId: auth.user?.id, name: auth.profile?.discord_name || data.discord_name }, { status: 'rejected', retry_after: new Date(retryAt).toISOString(), retention_until: new Date(Date.now() + 180 * 86400000).toISOString() }); } catch {}
      toast('Regeltest nicht bestanden', `${score} von 5 richtig.`, 'error');
      return;
    }
    const payload = { ...data, test_score: score, test_total: 5, wrong_topics: wrongTopics, entry_path: 'Support in Ausbildung (Regelfall)', submitted_at: new Date().toISOString() };
    Object.keys(payload).filter(key => /^q\d+$/.test(key)).forEach(key => delete payload[key]);
    try {
      const submission = await createSubmission('team_application', payload, { userId: auth.user?.id, name: auth.profile?.discord_name || data.discord_name }, { retention_until: new Date(Date.now() + 180 * 86400000).toISOString() });
      localStorage.removeItem(RETRY_KEY);
      form.reset();
      result.innerHTML = `<div class="form-result"><strong>Bewerbung eingegangen · ${escapeHtml(submission.reference)}</strong><br>Regeltest bestanden: ${score}/5. Den Bearbeitungsstatus kannst du nach Einrichtung des Logins in deinem Konto verfolgen.</div>`;
      toast('Bewerbung eingegangen', submission.reference, 'success');
    } catch (error) {
      toast('Absenden fehlgeschlagen', error.message, 'error');
    }
  });
}
