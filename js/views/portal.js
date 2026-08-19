import { SESSION_STATUSES } from '../config.js';
import { ROLE_GROUPS, roleByKey } from '../data/roles.js';
import { TEAM_RULE_LAYERS } from '../data/team-rules.js';
import { NEWS_CATEGORIES } from '../data/content.js';
import { currentAuth, demoLoginAs, signOut, getAal, challengeMfa } from '../lib/auth.js';
import { hasPermission, inBranch, isLeadership, isOwner, isTeam, requiresMfa } from '../lib/permissions.js';
import { appendAudit, createSubmission, deleteRow, demoStore, getSettings, insertRow, listRows, updateRow, updateSettings } from '../lib/store.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { icon } from '../lib/icons.js';
import { escapeHtml, formatDate, formDataObject, statusLabel, statusTone } from '../lib/utils.js';
import { badge, confirmModal, emptyState, loading, openModal, toast } from '../components/ui.js';

let authState = null;
let activeView = 'overview';
const viewCache = { profiles: [], accountLinks: [] };

const canManageAccounts = role => inBranch(role, 'administration') || isLeadership(role);
const canManageContent = role => ['head_support', 'teamlead', 'leadership', 'project_management', 'co_owner', 'owner'].includes(role);
const canManageProjects = role => inBranch(role, 'administration') || inBranch(role, 'hr') || isLeadership(role);

const NAV = [
  { key: 'overview', label: 'Übersicht', icon: 'dashboard', allowed: () => true },
  { key: 'accounts', label: 'Konten & Rechte', icon: 'lock', allowed: canManageAccounts },
  { key: 'submissions', label: 'Eingänge', icon: 'folder', allowed: role => hasPermission(role, 'read_basic_submissions') || hasPermission(role, 'manage_applications') || inBranch(role, 'moderation') || isLeadership(role) },
  { key: 'player-records', label: 'Spielerakten', icon: 'gavel', allowed: role => hasPermission(role, 'read_player_records') || hasPermission(role, 'manage_player_records') },
  { key: 'team-records', label: 'Teamakten', icon: 'users', allowed: role => hasPermission(role, 'manage_team_records') },
  { key: 'applications', label: 'Bewerbungen', icon: 'briefcase', allowed: role => hasPermission(role, 'manage_applications') || hasPermission(role, 'decide_applications') },
  { key: 'workflows', label: 'Team-Workflows', icon: 'file', allowed: role => hasPermission(role, 'self_workflows') || hasPermission(role, 'propose_promotions') || hasPermission(role, 'approve_promotions') || hasPermission(role, 'manage_absences') },
  { key: 'sessions', label: 'Sessions', icon: 'calendar', allowed: role => hasPermission(role, 'manage_sessions_draft') || hasPermission(role, 'approve_sessions') },
  { key: 'gangs', label: 'Gangverwaltung', icon: 'shield', allowed: role => hasPermission(role, 'manage_gangs') },
  { key: 'content', label: 'News & Ideen', icon: 'edit', allowed: canManageContent },
  { key: 'projects', label: 'Projekte', icon: 'briefcase', allowed: canManageProjects },
  { key: 'rules', label: 'Interne Regeln', icon: 'file', allowed: role => hasPermission(role, 'manage_rules_draft') || hasPermission(role, 'propose_rules') || isOwner(role) },
  { key: 'settings', label: 'Server & Stellen', icon: 'settings', allowed: role => isOwner(role) },
  { key: 'backup', label: 'Export & Sicherung', icon: 'download', allowed: role => isOwner(role) },

  // Nur für den Owner sichtbar
  { key: 'discord-bot', label: 'Discord-Bot', icon: 'settings', allowed: role => isOwner(role) },

  { key: 'audit', label: 'Owner-Log', icon: 'lock', allowed: role => isOwner(role) },
];

function loginGate() {
  const roles = ['owner','teamlead','admin','moderator','hr_staff','supporter','player'];
  return `<section class="auth-shell"><div class="auth-card"><img class="auth-card__logo" src="/assets/nexura-logo.jpg" alt=""><h1>Nexura Control</h1><p>Das interne Portal benötigt ein freigegebenes Konto.</p><a class="button button--primary button--wide" href="/konto" data-link>Anmelden</a>${!isSupabaseConfigured() ? `<div class="auth-divider">Demo</div><div class="field-grid" style="grid-template-columns:1fr 1fr">${roles.map(role => `<button class="button button--secondary button--compact" type="button" data-demo-role="${role}">${escapeHtml(roleByKey(role).label)}</button>`).join('')}</div><div class="auth-note" style="margin-top:15px">Diese Rollenwahl existiert nur im lokalen Demo-Modus und verschwindet nach der Supabase-Konfiguration.</div>` : ''}</div></section>`;
}

function portalShell(profile) {
  const role = profile.website_role || 'player';
  const items = NAV.filter(item => item.allowed(role));
  const requested = new URLSearchParams(location.search).get('view');
  if (requested && items.some(item => item.key === requested)) activeView = requested;
  return `<div class="portal">
    <aside class="portal-sidebar"><a class="brand" href="/" data-link><img src="/assets/nexura-logo.jpg" alt=""><span class="brand-copy"><strong>Nexura</strong><small>Control</small></span></a><div class="portal-profile"><strong>${escapeHtml(profile.discord_name || profile.email || 'Teammitglied')}</strong><span>${escapeHtml(roleByKey(role).label)}</span></div><div class="portal-nav-label">Arbeitsbereiche</div><nav class="portal-nav">${items.map(item => `<button type="button" data-portal-view="${item.key}" class="${item.key === activeView ? 'active' : ''}"><span>${icon(item.icon)}</span><span>${escapeHtml(item.label)}</span></button>`).join('')}</nav></aside>
    <main class="portal-main">${authState.demo ? '<div class="demo-banner">Demo-Modus: Änderungen werden nur in diesem Browser gespeichert. Supabase ist noch nicht verbunden.</div>' : ''}<header class="portal-topbar"><h1 id="portal-title">${escapeHtml(items.find(item => item.key === activeView)?.label || 'Übersicht')}</h1><div class="spacer"></div><a class="button button--ghost button--compact" href="/" data-link>Website</a><a class="button button--secondary button--compact" href="/konto" data-link>Konto</a><button class="button button--danger button--compact" type="button" id="portal-logout">Abmelden</button></header><div class="portal-content" id="portal-content">${loading()}</div></main>
  </div>`;
}

export async function renderPortal() {
  authState = await currentAuth();
  if (!authState.user) return loginGate();
  const profile = authState.profile || {};
  if (!profile.is_approved && !authState.demo) return `<section class="auth-shell"><div class="auth-card"><img class="auth-card__logo" src="/assets/nexura-logo.jpg"><h1>Freigabe ausstehend</h1><p>Dein Discord-Konto wurde erkannt, aber der Owner muss deine Website-Rolle noch bestätigen.</p><a class="button button--secondary button--wide" href="/konto" data-link>Zum Konto</a></div></section>`;
  const suspendedUntil = profile.suspended_until ? new Date(profile.suspended_until) : null;
  const accessBlocked = !authState.demo && (profile.status !== 'active' || (suspendedUntil && suspendedUntil > new Date()));
  if (accessBlocked) return `<section class="auth-shell"><div class="auth-card"><img class="auth-card__logo" src="/assets/nexura-logo.jpg"><h1>Teamzugang gesperrt</h1><p>${escapeHtml(profile.suspended_reason || (profile.status === 'former' ? 'Das Konto wurde zu einem normalen Spielerkonto zurückgestuft.' : 'Der interne Zugang ist derzeit nicht aktiv.'))}</p>${suspendedUntil ? `<div class="auth-note">Voraussichtliches Ende: ${formatDate(suspendedUntil)}</div>` : ''}<a class="button button--primary button--wide" href="/konto" data-link>Mein Konto</a></div></section>`;
  if (!isTeam(profile.website_role)) return `<section class="auth-shell"><div class="auth-card"><h1>Kein Teamzugang</h1><p>Dein Konto wurde zu einem normalen Spielerkonto zurückgestuft. Deine eigene Spielerakte bleibt unter „Mein Konto“ erreichbar.</p><a class="button button--primary button--wide" href="/konto" data-link>Mein Konto</a></div></section>`;
  if (requiresMfa(profile.website_role) && isSupabaseConfigured()) {
    try {
      const aal = await getAal();
      if (aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') return mfaGate();
      if (aal.nextLevel === 'aal1') return `<section class="auth-shell"><div class="auth-card"><h1>2FA erforderlich</h1><p>Für deine Rolle ist eine Authenticator-App verpflichtend. Richte sie zuerst im Konto ein.</p><a class="button button--primary button--wide" href="/konto" data-link>2FA einrichten</a></div></section>`;
    } catch {}
  }
  return portalShell(profile);
}

function mfaGate() {
  return `<section class="auth-shell"><form class="auth-card" id="mfa-login-form"><img class="auth-card__logo" src="/assets/nexura-logo.jpg"><h1>2FA bestätigen</h1><p>Gib den Code aus deiner Authenticator-App ein.</p><label class="field"><span>6-stelliger Code</span><input class="input" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label><button class="button button--primary button--wide" style="margin-top:16px" type="submit">Portal entsperren</button></form></section>`;
}

function setTitle(view) {
  document.querySelector('#portal-title').textContent = NAV.find(item => item.key === view)?.label || 'Nexura Control';
  document.querySelectorAll('[data-portal-view]').forEach(button => button.classList.toggle('active', button.dataset.portalView === view));
}

async function showView(view) {
  activeView = view;
  const content = document.querySelector('#portal-content');
  if (!content) return;
  setTitle(view);
  content.innerHTML = loading();
  const renderers = {
    overview: overviewView,
    accounts: accountsView,
    submissions: submissionsView,
    'player-records': playerRecordsView,
    'team-records': teamRecordsView,
    applications: applicationsView,
    workflows: workflowsView,
    sessions: sessionsView,
    gangs: gangsView,
    content: contentView,
    projects: projectsView,
    rules: rulesView,
    settings: settingsView,
    backup: backupView,
    'discord-bot': discordBotView,
    audit: auditView,
  };
  try {
    content.innerHTML = await (renderers[view] || overviewView)();
    bindViewActions(view);
  } catch (error) {
    content.innerHTML = `<div class="permission-lock"><h2>Bereich konnte nicht geladen werden</h2><p>${escapeHtml(error.message)}</p></div>`;
  }
}

async function overviewView() {
  const [submissions, playerRecords, teamRecords, sessions, logs] = await Promise.all([listRows('submissions'), listRows('player_records'), listRows('team_records'), listRows('sessions'), isOwner(authState.profile.website_role) ? listRows('audit_log', { limit: 8 }) : Promise.resolve([])]);
  const openSubmissions = submissions.filter(item => !['accepted','rejected','closed','done'].includes(item.status));
  const nextSession = sessions.find(item => new Date(item.starts_at) > new Date());
  return `<div class="portal-grid"><div class="stat-card"><small>Offene Eingänge</small><strong>${openSubmissions.length}</strong></div><div class="stat-card"><small>Spielerakten</small><strong>${playerRecords.length}</strong></div><div class="stat-card"><small>Teamakten</small><strong>${teamRecords.length}</strong></div><div class="stat-card"><small>Nächste Session</small><strong style="font-size:1.1rem">${nextSession ? formatDate(nextSession.starts_at) : 'Keine'}</strong></div></div>
  <div class="portal-split"><section class="portal-panel"><div class="portal-panel__head"><div><h2>Neueste Eingänge</h2><p>Bewerbungen, Support, Ideen und Einsprüche.</p></div><button class="button button--ghost button--compact" data-jump="submissions">Alle öffnen</button></div>${submissionTable(openSubmissions.slice(0,6), false)}</section><section class="portal-panel"><div class="portal-panel__head"><div><h2>${isOwner(authState.profile.website_role) ? 'Owner-Aktivität' : 'Nächste Aufgaben'}</h2><p>${isOwner(authState.profile.website_role) ? 'Vollständige Historie ist nur für den Owner sichtbar.' : 'Zugewiesene Aufgaben und relevante Hinweise.'}</p></div></div>${isOwner(authState.profile.website_role) ? `<div class="timeline">${logs.map(log => `<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${escapeHtml(log.action)}</strong><p>${escapeHtml(log.actor_name || 'System')} · ${formatDate(log.created_at)}</p></div></div>`).join('')}</div>` : '<div class="empty-state"><div class="empty-icon">✓</div><h3>Keine dringenden Aufgaben</h3><p>Neue Aufgaben erscheinen nach Zuweisung in diesem Bereich.</p></div>'}</section></div>`;
}

function submissionStatusOptions(row) {
  const leadershipDecision = isLeadership(authState.profile.website_role) || isOwner(authState.profile.website_role);
  const all = [
    ['new','Neu'], ['in_review','In Prüfung'], ['question','Rückfrage'], ['interview','Gespräch'],
    ['accepted','Angenommen'], ['rejected','Abgelehnt'], ['closed','Geschlossen'],
  ];
  return all.filter(([value]) => !(['team_application','appeal'].includes(row.type) && ['accepted','rejected'].includes(value) && !leadershipDecision))
    .map(([value,label]) => `<option value="${value}" ${row.status === value ? 'selected' : ''}>${label}</option>`).join('');
}

function submissionTable(rows, showAll = true) {
  if (!rows.length) return emptyState({ icon: '◇', title: 'Keine Eingänge', text: 'Aktuell liegen keine passenden Vorgänge vor.' });
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Referenz</th><th>Typ</th><th>Person</th><th>Status</th><th>Priorität</th><th>Datum</th><th>Aktionen</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(row.reference)}</td><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.submitter_name || 'Gast')}</td><td>${badge(statusLabel(row.status), statusTone(row.status))}</td><td>${escapeHtml(row.priority || 'normal')}</td><td>${formatDate(row.created_at)}</td><td><div class="table-actions"><button class="button button--ghost button--compact" data-inspect-submission="${row.id}">Öffnen</button>${showAll ? `<select class="select" style="height:36px;width:150px" data-submission-status="${row.id}">${submissionStatusOptions(row)}</select>` : ''}${isOwner(authState.profile.website_role) ? `<button class="button button--danger button--compact" data-delete="submissions:${row.id}">${icon('trash')}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>`;
}

async function accountsView() {
  const [profiles, accountLinks] = await Promise.all([
    listRows('profiles'),
    listRows('account_links'),
  ]);

  viewCache.profiles = profiles;
  viewCache.accountLinks = accountLinks;

  const profilesContent = profiles.length
    ? `<div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Discord / E-Mail</th>
              <th>Roblox</th>
              <th>Website-Rolle</th>
              <th>Freigabe</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            ${profiles.map(profile => `
              <tr>
                <td>${escapeHtml(profile.discord_name || profile.email || 'Unbekannt')}</td>
                <td>${escapeHtml(profile.roblox_name || 'Nicht verknüpft')}</td>
                <td>${escapeHtml(roleByKey(profile.website_role || 'player').label)}</td>
                <td>${badge(profile.is_approved ? 'Freigegeben' : 'Ausstehend', profile.is_approved ? 'done' : 'open')}</td>
                <td>${escapeHtml(profile.status || 'active')}</td>
                <td>${isOwner(authState.profile.website_role)
                  ? `<button class="button button--ghost button--compact" type="button" data-edit-profile="${profile.id}">Bearbeiten</button>`
                  : '<span class="muted">Nur Ansicht</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`
    : emptyState({ icon: '♙', title: 'Keine Konten vorhanden', text: 'Registrierte Konten erscheinen hier.' });

  const linksContent = accountLinks.length
    ? `<div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Discord</th><th>Roblox</th><th>Code</th><th>Status</th><th>Erstellt</th><th>Aktionen</th></tr></thead>
          <tbody>${accountLinks.map(link => `
            <tr>
              <td>${escapeHtml(link.discord_name || '—')}</td>
              <td>${escapeHtml(link.roblox_name || '—')}</td>
              <td><code>${escapeHtml(link.verification_code || '—')}</code></td>
              <td>${badge(statusLabel(link.status || 'pending'), statusTone(link.status || 'pending'))}</td>
              <td>${formatDate(link.created_at)}</td>
              <td><button class="button button--ghost button--compact" type="button" data-review-link="${link.id}">Prüfen</button></td>
            </tr>`).join('')}</tbody>
        </table>
      </div>`
    : emptyState({ icon: '◇', title: 'Keine Roblox-Verknüpfungen', text: 'Neue Verknüpfungsanträge erscheinen hier.' });

  return `<div class="portal-split">
    <section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Konten und Website-Rechte</h2><p>Rollen, Freigaben und Zugangsstatus verwalten.</p></div></div>${profilesContent}</section>
    <section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Roblox-Verknüpfungen</h2><p>Profilcode und Discord-Bestätigung prüfen.</p></div></div>${linksContent}</section>
  </div>`;
}

async function submissionsView() {
  const rows = await listRows('submissions');
  return `<section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Alle Formulareingänge</h2><p>Ideen, Feedback, Support, Meldungen, Partnerschaften, Creator-Anträge, Einsprüche und Bewerbungen.</p></div><input class="input" id="submission-search" placeholder="Suchen …" style="max-width:260px"></div><div id="submission-table-wrap">${submissionTable(rows)}</div></section>`;
}

async function playerRecordsView() {
  const rows = await listRows('player_records');
  return `<section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Spielerakten</h2><p>Punkte, Sanktionen, Beweise und interne Notizen. Löschen darf nur der Owner.</p></div>${hasPermission(authState.profile.website_role, 'manage_player_records') ? '<button class="button button--primary button--compact" data-create-player-record>Neue Akte</button>' : ''}</div>${rows.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Roblox</th><th>Discord</th><th>Punkte</th><th>Aktive Sanktion</th><th>Aktualisiert</th><th>Aktionen</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(row.roblox_name)}</td><td>${escapeHtml(row.discord_name || '—')}</td><td>${Number(row.points || 0)}</td><td>${escapeHtml(row.active_sanction || 'Keine')}</td><td>${formatDate(row.updated_at || row.created_at)}</td><td><div class="table-actions"><button class="button button--ghost button--compact" data-open-player-record="${row.id}">Akte</button>${isOwner(authState.profile.website_role) ? `<button class="button button--danger button--compact" data-delete="player_records:${row.id}">${icon('trash')}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : emptyState({ icon: '▤', title: 'Keine Spielerakten', text: 'Neue Akten können durch Administration angelegt werden.' })}</section>`;
}

async function teamRecordsView() {
  const rows = await listRows('team_records');
  return `<section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Teamakten</h2><p>Rolle, Probezeit, Bewertungen, Beförderungen, Abmahnungen, Schulungen und Abwesenheiten.</p></div><button class="button button--primary button--compact" data-create-team-record>Teamakte anlegen</button></div>${rows.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Discord</th><th>Roblox</th><th>Rolle</th><th>Status</th><th>Bewertung</th><th>Aktionen</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(row.discord_name)}</td><td>${escapeHtml(row.roblox_name || '—')}</td><td>${escapeHtml(roleByKey(row.role_key).label)}</td><td>${badge(row.status === 'leave' ? 'Beurlaubt' : row.status === 'away' ? 'Abwesend' : 'Aktiv', row.status === 'active' ? 'done' : 'open')}</td><td>${Number(row.rating || 0).toFixed(1)} / 5</td><td><button class="button button--ghost button--compact" data-open-team-record="${row.id}">Akte</button>${isOwner(authState.profile.website_role) ? `<button class="button button--danger button--compact" data-delete="team_records:${row.id}">${icon('trash')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : emptyState({ icon: '♙', title: 'Keine Teamakten', text: 'Lege die erste Teamakte an.' })}</section>`;
}

async function applicationsView() {
  const rows = (await listRows('submissions')).filter(row => row.type === 'team_application');
  return `<section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Team-Bewerbungen</h2><p>HR prüft vor, Teamleitung entscheidet, Owner kann übersteuern.</p></div></div>${submissionTable(rows)}</section>`;
}

async function workflowsView() {
  const rows = await listRows('workflow_requests');
  return `<section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Beförderung, Abwesenheit und Austritt</h2><p>Strukturierte Anträge mit Freigaben und Aktenbezug.</p></div><button class="button button--primary button--compact" data-create-workflow>Neuer Antrag</button></div>${rows.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Typ</th><th>Person</th><th>Status</th><th>Zeitraum/Ziel</th><th>Erstellt</th><th>Aktionen</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.subject_name)}</td><td>${badge(statusLabel(row.status), statusTone(row.status))}</td><td>${escapeHtml(row.target_role || row.period || '—')}</td><td>${formatDate(row.created_at)}</td><td><button class="button button--ghost button--compact" data-open-workflow="${row.id}">Öffnen</button>${isOwner(authState.profile.website_role) ? `<button class="button button--danger button--compact" data-delete="workflow_requests:${row.id}">${icon('trash')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : emptyState({ icon: '↟', title: 'Keine offenen Workflows', text: 'Beförderungsinteresse, Abwesenheiten und Austritte werden hier bearbeitet.' })}</section>`;
}

async function sessionsView() {
  const rows = await listRows('sessions');
  return `<div class="portal-split"><form class="portal-panel" id="session-form" style="margin-top:0"><div class="portal-panel__head"><div><h2>Session planen</h2><p>Administration erstellt; Teamleitung oder Owner gibt frei.</p></div></div><div class="portal-form-grid"><label class="field field--full"><span>Titel</span><input class="input" name="title" required></label><label class="field"><span>Beginn</span><input class="input" name="starts_at" type="datetime-local" required></label><label class="field"><span>Status</span><select class="select" name="status">${SESSION_STATUSES.map(item => `<option value="${item.value}">${item.label}</option>`).join('')}</select></label><label class="field field--full"><span>Session-Hinweis</span><textarea class="textarea" name="note" required></textarea></label><label class="field field--full"><span>Optionales Banner</span><input class="input" name="banner_url" type="url" placeholder="Standardbanner wird sonst verwendet"></label></div><div class="form-actions"><button class="button button--primary" type="submit">Entwurf speichern</button></div></form><section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Geplante Sessions</h2><p>Kurztext für #ankündigungen, ausführlich für #session-ankündigungen.</p></div></div><div class="session-stack">${rows.length ? rows.map(row => `<article class="session-card"><div class="session-card__head"><div><span class="tag">${escapeHtml(statusLabel(row.status))}</span><h3>${escapeHtml(row.title)}</h3></div>${badge(row.approved ? 'Freigegeben' : 'Entwurf', row.approved ? 'done' : 'open')}</div><p>${formatDate(row.starts_at)} · ${escapeHtml(row.note || '')}</p><div class="table-actions" style="margin-top:13px">${hasPermission(authState.profile.website_role, 'approve_sessions') && !row.approved ? `<button class="button button--success button--compact" data-approve-session="${row.id}">Freigeben</button>` : ''}${row.approved ? `<button class="button button--primary button--compact" data-announce-session="${row.id}">Discord ankündigen</button>` : ''}${isOwner(authState.profile.website_role) ? `<button class="button button--danger button--compact" data-delete="sessions:${row.id}">${icon('trash')}</button>` : ''}</div></article>`).join('') : '<p class="muted">Noch keine Session geplant.</p>'}</div></section></div>`;
}

async function gangsView() {
  const submissions = (await listRows('submissions')).filter(row => row.type === 'gang_application');
  const gangs = await listRows('gangs');
  return `<div class="portal-split"><section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Gang-Bewerbungen</h2><p>Prüfen, Rückfrage stellen und freischalten.</p></div></div>${submissionTable(submissions)}</section><section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Öffentliche Gangs</h2><p>Freigegebene Einträge auf der Website.</p></div></div>${gangs.length ? gangs.map(gang => `<div class="role-row"><div><strong>${escapeHtml(gang.name)}</strong><small>${escapeHtml(gang.motto || '')}</small></div><span>${badge(gang.published ? 'Öffentlich' : 'Versteckt', gang.published ? 'done' : 'open')}</span></div>`).join('') : '<p class="muted">Noch keine Gang freigeschaltet.</p>'}</section></div>`;
}

async function contentView() {
  const [news, ideas] = await Promise.all([listRows('news'), listRows('ideas').catch(() => [])]);
  return `<div class="portal-split"><form class="portal-panel" id="news-form" style="margin-top:0"><div class="portal-panel__head"><div><h2>News veröffentlichen</h2><p>Updates, Events, Team-, Fraktions-News und Ankündigungen.</p></div></div><div class="portal-form-grid"><label class="field"><span>Kategorie</span><select class="select" name="category">${NEWS_CATEGORIES.map(item => `<option>${escapeHtml(item)}</option>`).join('')}</select></label><label class="field"><span>Titel</span><input class="input" name="title" required></label><label class="field field--full"><span>Kurztext</span><textarea class="textarea" name="excerpt" required></textarea></label><label class="checkbox field--full"><input type="checkbox" name="published" checked><span>Sofort veröffentlichen</span></label></div><div class="form-actions"><button class="button button--primary" type="submit">News speichern</button></div></form>
  <form class="portal-panel" id="idea-publish-form" style="margin-top:0"><div class="portal-panel__head"><div><h2>Öffentliche Idee</h2><p>Freigegebene Community-Ideen mit Bearbeitungsstatus.</p></div></div><div class="portal-form-grid"><label class="field"><span>Kategorie</span><input class="input" name="category" value="Community"></label><label class="field"><span>Status</span><select class="select" name="status"><option value="new">Neu</option><option value="reviewing">Wird geprüft</option><option value="planned">Geplant</option><option value="implemented">Umgesetzt</option><option value="rejected">Nicht umgesetzt</option></select></label><label class="field field--full"><span>Titel</span><input class="input" name="title" required></label><label class="field field--full"><span>Öffentliche Zusammenfassung</span><textarea class="textarea" name="summary" required></textarea></label><label class="field"><span>Urheber-Anzeige</span><input class="input" name="author_name" value="Community"></label><label class="checkbox"><input type="checkbox" name="public" checked><span>Öffentlich anzeigen</span></label></div><div class="form-actions"><button class="button button--primary" type="submit">Idee veröffentlichen</button></div></form></div>
  <div class="portal-split"><section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>News</h2><p>Neueste Beiträge zuerst.</p></div></div>${news.length ? news.map(item => `<div class="role-row"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)} · ${formatDate(item.published_at || item.created_at)}</small></div>${isOwner(authState.profile.website_role) ? `<button class="button button--danger button--compact" data-delete="news:${item.id}">${icon('trash')}</button>` : ''}</div>`).join('') : '<p class="muted">Keine Beiträge.</p>'}</section>
  <section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Öffentliche Ideen</h2><p>Status auf der Community-Seite.</p></div></div>${ideas.length ? ideas.map(item => `<div class="role-row"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category || 'Idee')} · ${escapeHtml(item.status || 'new')}</small></div>${isOwner(authState.profile.website_role) ? `<button class="button button--danger button--compact" data-delete="ideas:${item.id}">${icon('trash')}</button>` : ''}</div>`).join('') : '<p class="muted">Keine öffentlichen Ideen.</p>'}</section></div>`;
}

async function projectsView() {
  const rows = await listRows('projects').catch(() => []);
  return `<div class="portal-split"><form class="portal-panel" id="project-form" style="margin-top:0"><div class="portal-panel__head"><div><h2>Projekt anlegen</h2><p>Aufgaben, Verantwortliche, Priorität, Status und Zieltermin.</p></div></div><div class="portal-form-grid"><label class="field field--full"><span>Titel</span><input class="input" name="title" required></label><label class="field"><span>Verantwortlich</span><input class="input" name="owner_name" required></label><label class="field"><span>Status</span><select class="select" name="status"><option value="planned">Geplant</option><option value="in_progress">In Arbeit</option><option value="blocked">Blockiert</option><option value="done">Erledigt</option></select></label><label class="field"><span>Priorität</span><select class="select" name="priority"><option value="normal">Normal</option><option value="high">Hoch</option><option value="urgent">Dringend</option></select></label><label class="field"><span>Zieltermin</span><input class="input" name="due_at" type="datetime-local"></label><label class="field field--full"><span>Beschreibung</span><textarea class="textarea" name="description" required></textarea></label></div><div class="form-actions"><button class="button button--primary" type="submit">Projekt speichern</button></div></form><section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Projektübersicht</h2><p>Interne Vorhaben und Verantwortlichkeiten.</p></div></div>${rows.length ? rows.map(row => `<div class="role-row"><div><strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.owner_name || 'Ohne Verantwortlichen')} · ${escapeHtml(row.status || 'planned')} · ${escapeHtml(row.priority || 'normal')}</small></div>${isOwner(authState.profile.website_role) ? `<button class="button button--danger button--compact" data-delete="projects:${row.id}">${icon('trash')}</button>` : ''}</div>`).join('') : '<p class="muted">Keine Projekte vorhanden.</p>'}</section></div>`;
}

async function rulesView() {
  const versions = await listRows('internal_rules').catch(() => []);
  return `<section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Kumulative interne Teamregeln</h2><p>Allgemein → Support → Moderation → Administration → HR/Teamleitung → Owner.</p></div>${isOwner(authState.profile.website_role) ? '<button class="button button--primary button--compact" data-publish-rule>Neue Version veröffentlichen</button>' : '<button class="button button--secondary button--compact" data-propose-rule>Änderung vorschlagen</button>'}</div><div class="card-grid">${TEAM_RULE_LAYERS.map(layer => `<article class="card"><span class="tag">${escapeHtml(layer.appliesTo)}</span><h3>${escapeHtml(layer.title)}</h3><div class="rule-list">${layer.rules.map(rule => `<div class="rule"><p>${escapeHtml(rule)}</p></div>`).join('')}</div></article>`).join('')}</div>${versions.length ? `<div class="portal-panel"><div class="portal-panel__head"><h2>Versionen</h2></div>${versions.map(version => `<div class="role-row"><div><strong>Version ${escapeHtml(version.version)}</strong><small>${formatDate(version.published_at || version.created_at)} · ${escapeHtml(version.change_summary || '')}</small></div>${badge(version.critical ? 'Kritisch' : 'Normal', version.critical ? 'rejected' : 'new')}</div>`).join('')}</div>` : ''}</section>`;
}

async function discordBotView() {
  if (!isOwner(authState.profile.website_role)) {
    return '<div class="permission-lock">Nur der Owner kann den Discord-Bot verwalten.</div>';
  }

  const [
    settingsRows,
    statusRows,
    logs,
    actions,
    tickets,
    banRequests,
    shifts,
    sessionRequests,
    securityEvents,
    moderationCases,
    giveaways,
    activeSuggestions,
    backups,
    creatorProofs,
  ] = await Promise.all([
    listRows('bot_settings').catch(() => []),
    listRows('bot_status').catch(() => []),
    listRows('bot_logs', { limit: 100 }).catch(() => []),
    listRows('bot_actions', { limit: 40 }).catch(() => []),
    listRows('bot_tickets', { limit: 500 }).catch(() => []),
    listRows('bot_ban_requests', { limit: 40 }).catch(() => []),
    listRows('bot_duty_shifts', { limit: 40 }).catch(() => []),
    listRows('bot_session_requests', { limit: 40 }).catch(() => []),
    listRows('bot_security_events', { limit: 40 }).catch(() => []),
    listRows('bot_moderation_cases', { limit: 40 }).catch(() => []),
    listRows('bot_giveaways', { limit: 30 }).catch(() => []),
    listRows('bot_active_member_suggestions', { limit: 30 }).catch(() => []),
    listRows('bot_structure_backups', { limit: 20 }).catch(() => []),
    listRows('bot_creator_proofs', { limit: 30 }).catch(() => []),
  ]);

  const settings = settingsRows[0] || {};
  const status = statusRows.find(row => row.guild_id === settings.guild_id) || statusRows[0] || {};
  const modules = settings.modules || {};
  const automod = settings.automod || {};
  const leveling = settings.leveling || {};
  const custom = settings.custom || {};
  const joinIds = value => Array.isArray(value) ? value.join(', ') : '';
  const heartbeatAge = status.last_heartbeat ? Date.now() - new Date(status.last_heartbeat).getTime() : Infinity;
  const online = Boolean(status.online && heartbeatAge < 120000);
  const openTickets = tickets.filter(row => ['open', 'claimed'].includes(row.status)).length;
  const pendingBans = banRequests.filter(row => row.status === 'pending').length;
  const activeShifts = shifts.filter(row => row.status === 'active' && new Date(row.ends_at) > new Date()).length;
  const pendingSessions = sessionRequests.filter(row => row.status === 'pending').length;
  const pendingSuggestions = activeSuggestions.filter(row => row.status === 'pending').length;
  const activeGiveaways = giveaways.filter(row => row.status === 'active').length;
  const ratedTickets = tickets.filter(row => {
  const rating = Number(row.rating);
  return Number.isFinite(rating) && rating >= 1 && rating <= 5;
});

const ratingCount = ratedTickets.length;

const ratingAverage = ratingCount
  ? ratedTickets.reduce((sum, row) => sum + Number(row.rating), 0) / ratingCount
  : 0;

const fiveStarCount = ratedTickets.filter(
  row => Number(row.rating) === 5
).length;

const fiveStarRate = ratingCount
  ? Math.round((fiveStarCount / ratingCount) * 100)
  : 0;

const supporterMap = new Map();

for (const row of ratedTickets) {
  if (!row.claimed_by_id && !row.claimed_by_name) continue;

  const key =
    row.claimed_by_id ||
    row.claimed_by_name;

  const current = supporterMap.get(key) || {
    name:
      row.claimed_by_name ||
      row.claimed_by_id ||
      'Unbekannt',
    count: 0,
    total: 0,
    fiveStars: 0,
  };

  current.count += 1;
  current.total += Number(row.rating);

  if (Number(row.rating) === 5) {
    current.fiveStars += 1;
  }

  supporterMap.set(key, current);
}

const supporterRanking = [...supporterMap.values()]
  .map(item => ({
    ...item,
    average: item.total / item.count,
  }))
  .sort((a, b) =>
    b.average - a.average ||
    b.count - a.count
  );

const recentRatings = [...ratedTickets]
  .sort(
    (a, b) =>
      new Date(
        b.rated_at ||
        b.closed_at ||
        b.created_at
      ).getTime() -
      new Date(
        a.rated_at ||
        a.closed_at ||
        a.created_at
      ).getTime()
  )
  .slice(0, 10);

  if (!settings.id) {
    return `<section class="portal-panel" style="margin-top:0"><div class="permission-lock"><h2>Bot-Datenbank noch nicht initialisiert</h2><p>In <code>bot_settings</code> wurde keine Konfigurationszeile gefunden. Führe zuerst das Nexura-Bot-SQL in Supabase aus.</p></div></section>`;
  }

  const moduleLabels = {
    moderation: 'Moderation',
    automod: 'AutoMod',
    tickets: 'Tickets',
    welcome: 'Welcome / Mitglieder',
    logging: 'Discord-Logs',
    leveling: 'Leveling',
    verification: 'Legacy-Verifizierung',
    role_sync: 'Website-Rollensync',
    session_sync: 'Session-Sync',
    security: 'Anti-Raid / Anti-Nuke',
  };

  return `
    <div class="portal-grid">
      <div class="stat-card"><small>Botstatus</small><strong>${online ? 'ONLINE' : 'OFFLINE'}</strong></div>
      <div class="stat-card"><small>Ping</small><strong>${Number(status.ping || 0)} ms</strong></div>
      <div class="stat-card"><small>Discord-Mitglieder</small><strong>${Number(status.member_count || 0)}</strong></div>
      <div class="stat-card"><small>Letzter Heartbeat</small><strong style="font-size:1rem">${status.last_heartbeat ? formatDate(status.last_heartbeat) : 'Nie'}</strong></div>
    </div>

    <div class="portal-grid">
      <div class="stat-card"><small>Offene Tickets</small><strong>${openTickets}</strong></div>
      <div class="stat-card"><small>Offene Ban-Freigaben</small><strong>${pendingBans}</strong></div>
      <div class="stat-card"><small>Admins im Dienst</small><strong>${activeShifts}</strong></div>
      <div class="stat-card"><small>Sessionanträge</small><strong>${pendingSessions}</strong></div>
    </div>

    <form class="portal-panel" id="bot-settings-form">
      <div class="portal-panel__head">
        <div><h2>Discord-Bot konfigurieren</h2><p>Module, Kanäle, Rollen und Nexura-Automationen direkt über das Owner-Portal verwalten.</p></div>
        <button class="button button--primary" type="submit">Bot-Konfiguration speichern</button>
      </div>
      <input type="hidden" name="row_id" value="${escapeHtml(settings.id || '')}">
      <input type="hidden" name="guild_id" value="${escapeHtml(settings.guild_id || '')}">

      <div class="form-section">
        <h3>Bot und Module</h3>
        <div class="card-grid">
          <label class="checkbox"><input type="checkbox" name="enabled" ${settings.enabled !== false ? 'checked' : ''}><span>Bot-Automationen aktiviert</span></label>
          ${Object.entries(moduleLabels).map(([key, label]) => `<label class="checkbox"><input type="checkbox" name="module_${key}" ${modules[key] !== false ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`).join('')}
        </div>
      </div>

      <div class="form-section">
        <h3>Discord-Kanäle</h3>
        <div class="portal-form-grid">
          <label class="field"><span>Welcome-Kanal ID</span><input class="input" name="welcome_channel_id" value="${escapeHtml(settings.welcome_channel_id || '')}"></label>
          <label class="field"><span>Goodbye-Kanal ID</span><input class="input" name="goodbye_channel_id" value="${escapeHtml(settings.goodbye_channel_id || '')}"></label>
          <label class="field"><span>Ticket-Kategorie ID</span><input class="input" name="ticket_category_id" value="${escapeHtml(settings.ticket_category_id || '')}"></label>
          <label class="field"><span>Ticket-Panel-Kanal ID</span><input class="input" name="ticket_panel_channel_id" value="${escapeHtml(settings.ticket_panel_channel_id || '')}"></label>
          <label class="field"><span>Session-Kanal ID</span><input class="input" name="session_channel_id" value="${escapeHtml(settings.session_channel_id || '')}"></label>
          <label class="field"><span>Dezente Begrüßung / Screening-Kanal ID</span><input class="input" name="greeting_channel_id" value="${escapeHtml(custom.greeting_channel_id || '')}"></label>
          <label class="field"><span>Ban-Freigabekanal ID</span><input class="input" name="ban_approval_channel_id" value="${escapeHtml(custom.ban_approval_channel_id || '')}"></label>
          <label class="field"><span>Session-Prüfkanal ID</span><input class="input" name="session_review_channel_id" value="${escapeHtml(custom.session_review_channel_id || '')}"></label>
          <label class="field"><span>Session-Ankündigungskanal ID</span><input class="input" name="session_announcement_channel_id" value="${escapeHtml(custom.session_announcement_channel_id || '')}"></label>
          <label class="field"><span>Partnerwerbung-Kanal ID</span><input class="input" name="partner_channel_id" value="${escapeHtml(custom.partner_channel_id || '')}"></label>
          <label class="field"><span>Creator-Erinnerungskanal ID</span><input class="input" name="creator_reminder_channel_id" value="${escapeHtml(custom.creator_reminder_channel_id || '')}"></label>
          <label class="field"><span>Staff-Review-Kanal ID</span><input class="input" name="staff_review_channel_id" value="${escapeHtml(custom.staff_review_channel_id || '')}"></label>
        </div>
      </div>

      <div class="form-section">
        <h3>Discord-Rollen</h3>
        <div class="portal-form-grid">
          <label class="field"><span>👤 Mitglied-Rolle ID</span><input class="input" name="member_role_id" value="${escapeHtml(custom.member_role_id || '')}"></label>
          <label class="field"><span>🟢 Im Dienst-Rolle ID</span><input class="input" name="on_duty_role_id" value="${escapeHtml(custom.on_duty_role_id || '')}"></label>
          <label class="field"><span>Verified-Rolle ID</span><input class="input" name="verified_role_id" value="${escapeHtml(settings.verified_role_id || '')}"></label>
          <label class="field"><span>Unverified-Rolle ID</span><input class="input" name="unverified_role_id" value="${escapeHtml(settings.unverified_role_id || '')}"></label>
          <label class="field"><span>Booster-Rolle ID</span><input class="input" name="booster_role_id" value="${escapeHtml(custom.booster_role_id || '')}"></label>
          <label class="field"><span>🌟 Aktives Mitglied-Rolle ID</span><input class="input" name="active_member_role_id" value="${escapeHtml(custom.active_member_role_id || '')}"></label>
          <label class="field field--full"><span>Staff-Rollen IDs (Komma getrennt)</span><input class="input" name="staff_role_ids" value="${escapeHtml(joinIds(settings.staff_role_ids))}"></label>
          <label class="field field--full"><span>Support-Rollen IDs (Komma getrennt)</span><input class="input" name="support_role_ids" value="${escapeHtml(joinIds(settings.support_role_ids))}"></label>
          <label class="field field--full"><span>Geschützte Rollen IDs</span><input class="input" name="protected_role_ids" value="${escapeHtml(joinIds(settings.protected_role_ids))}"></label>
          <label class="field field--full"><span>Autorollen IDs</span><input class="input" name="autorole_ids" value="${escapeHtml(joinIds(settings.autorole_ids))}"></label>
          <label class="field field--full"><span>Ingame-Admin-Rollen IDs</span><input class="input" name="ingame_admin_role_ids" value="${escapeHtml(joinIds(custom.ingame_admin_role_ids))}"></label>
          <label class="field field--full"><span>Senior-Administrator+-Rollen IDs</span><input class="input" name="senior_admin_role_ids" value="${escapeHtml(joinIds(custom.senior_admin_role_ids))}"></label>
          <label class="field field--full"><span>Höchste Leitung / Notfallban-Rollen IDs</span><input class="input" name="highest_management_role_ids" value="${escapeHtml(joinIds(custom.highest_management_role_ids))}"></label>
        </div>
      </div>

      <div class="form-section">
        <h3>Website ↔ Discord und erweiterte Einstellungen</h3>
        <div class="portal-form-grid">
          <label class="field field--full"><span>Website-Basis-URL</span><input class="input" name="website_base_url" type="url" placeholder="https://..." value="${escapeHtml(custom.website_base_url || '')}"></label>
          <label class="field"><span>Anti-Nuke-Schwellenwert</span><input class="input" name="security_threshold" type="number" min="1" max="20" value="${Number(custom.security_threshold || 3)}"></label>
          <label class="field field--full"><span>Website-Rolle → Discord-Rollen-ID (JSON)</span><textarea class="textarea" name="role_map" rows="8">${escapeHtml(JSON.stringify(settings.role_map || {}, null, 2))}</textarea></label>
          <label class="field field--full"><span>Pingrollen fürs Rollenpanel (JSON)</span><textarea class="textarea" name="ping_roles" rows="8">${escapeHtml(JSON.stringify(custom.ping_roles || {}, null, 2))}</textarea></label>
          <label class="field field--full"><span>RP-Ranggruppen (JSON)</span><textarea class="textarea" name="rp_rank_groups" rows="8">${escapeHtml(JSON.stringify(custom.rp_rank_groups || {}, null, 2))}</textarea></label>
          <label class="field field--full"><span>AutoMod (JSON)</span><textarea class="textarea" name="automod" rows="10">${escapeHtml(JSON.stringify(automod, null, 2))}</textarea></label>
          <label class="field field--full"><span>Leveling (JSON)</span><textarea class="textarea" name="leveling" rows="8">${escapeHtml(JSON.stringify(leveling, null, 2))}</textarea></label>
          <label class="field field--full"><span>Weitere benutzerdefinierte Bot-Einstellungen (JSON)</span><textarea class="textarea" name="custom_json" rows="12">${escapeHtml(JSON.stringify(custom, null, 2))}</textarea><small>Bekannte Felder oben überschreiben beim Speichern die entsprechenden Werte in diesem JSON. Zusätzliche Felder bleiben erhalten.</small></label>
        </div>
      </div>
    </form>

    <section class="portal-panel">
      <div class="portal-panel__head"><div><h2>Sofortaktionen</h2><p>Die Website schreibt sichere Aufträge in die gemeinsame Bot-Queue. Der laufende Bot verarbeitet sie automatisch.</p></div></div>
      <div class="table-actions">
        <button class="button button--secondary" type="button" data-bot-action="REFRESH_SETTINGS">Konfiguration neu laden</button>
        <button class="button button--secondary" type="button" data-bot-action="SYNC_ROLES">Website-Rollen synchronisieren</button>
        <button class="button button--secondary" type="button" data-bot-action="TEST_LOG">Test-Log erzeugen</button>
      </div>
      <div class="portal-split" style="margin-top:20px">
        <form class="portal-panel" id="bot-send-channel-form" style="margin-top:0">
          <div class="portal-panel__head"><div><h3>Bot-Nachricht senden</h3><p>Direkt über den Bot in einen Discord-Kanal.</p></div></div>
          <label class="field"><span>Kanal-ID</span><input class="input" name="channel_id" required></label>
          <label class="field" style="margin-top:12px"><span>Nachricht</span><textarea class="textarea" name="message" maxlength="1900" required></textarea></label>
          <div class="form-actions"><button class="button button--primary" type="submit">In Discord senden</button></div>
        </form>
        <form class="portal-panel" id="bot-send-dm-form" style="margin-top:0">
          <div class="portal-panel__head"><div><h3>Discord-DM senden</h3><p>Nachricht an eine konkrete Discord-User-ID.</p></div></div>
          <label class="field"><span>User-ID</span><input class="input" name="user_id" required></label>
          <label class="field" style="margin-top:12px"><span>Nachricht</span><textarea class="textarea" name="message" maxlength="1900" required></textarea></label>
          <div class="form-actions"><button class="button button--primary" type="submit">DM über Bot senden</button></div>
        </form>
      </div>
    </section>

    <section class="portal-panel">    <section class="portal-panel">
      <div class="portal-panel__head">
        <div>
          <h2>⭐ Support-Bewertungen</h2>
          <p>Auswertung der Ticketbewertungen aus den Discord-DMs.</p>
        </div>
      </div>

      <div class="portal-grid">
        <div class="stat-card">
          <small>Durchschnitt</small>
          <strong>${ratingCount ? `${ratingAverage.toFixed(2)} ★` : '—'}</strong>
        </div>

        <div class="stat-card">
          <small>Bewertungen</small>
          <strong>${ratingCount}</strong>
        </div>

        <div class="stat-card">
          <small>5-Sterne-Quote</small>
          <strong>${ratingCount ? `${fiveStarRate} %` : '—'}</strong>
        </div>

        <div class="stat-card">
          <small>Bewertete Supporter</small>
          <strong>${supporterRanking.length}</strong>
        </div>
      </div>

      <div class="portal-split" style="margin-top:18px">
        <div>
          <div class="portal-panel__head">
            <div>
              <h3>Supporter-Ranking</h3>
              <p>Durchschnitt pro Ticketbearbeiter.</p>
            </div>
          </div>

          ${
            supporterRanking.length
              ? `
                <div class="table-wrap">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Supporter</th>
                        <th>Bewertungen</th>
                        <th>Ø</th>
                        <th>5 ★</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${supporterRanking.map(item => `
                        <tr>
                          <td>${escapeHtml(item.name)}</td>
                          <td>${item.count}</td>
                          <td><strong>${item.average.toFixed(2)} ★</strong></td>
                          <td>${item.fiveStars}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `
              : '<p class="muted">Noch keine Support-Bewertungen vorhanden.</p>'
          }
        </div>

        <div>
          <div class="portal-panel__head">
            <div>
              <h3>Letzte Bewertungen</h3>
              <p>Die zehn zuletzt abgegebenen Ticketbewertungen.</p>
            </div>
          </div>

          ${
            recentRatings.length
              ? `
                <div class="table-wrap">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Typ</th>
                        <th>Supporter</th>
                        <th>Bewertung</th>
                        <th>Zeit</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${recentRatings.map(row => `
                        <tr>
                          <td>#${escapeHtml(String(row.ticket_number || '—'))}</td>
                          <td>${escapeHtml(row.ticket_type || 'support')}</td>
                          <td>${escapeHtml(row.claimed_by_name || row.claimed_by_id || '—')}</td>
                          <td>
                            <strong>
                              ${'★'.repeat(Number(row.rating))}
                              ${'☆'.repeat(5 - Number(row.rating))}
                            </strong>
                          </td>
                          <td>${formatDate(row.rated_at || row.closed_at || row.created_at)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `
              : '<p class="muted">Noch keine Bewertungen abgegeben.</p>'
          }
        </div>
      </div>
    </section>
      <div class="portal-panel__head"><div><h2>Live-Betrieb</h2><p>Tickets, Ban-Freigaben, Dienste, Sessions, Gewinnspiele, Aktivitätsvorschläge und Security.</p></div></div>
      <div class="portal-grid">
        <div class="stat-card"><small>Aktive Gewinnspiele</small><strong>${activeGiveaways}</strong></div>
        <div class="stat-card"><small>Aktiv-Mitglied-Vorschläge</small><strong>${pendingSuggestions}</strong></div>
        <div class="stat-card"><small>Security-Ereignisse</small><strong>${securityEvents.length}</strong></div>
        <div class="stat-card"><small>Struktur-Backups</small><strong>${backups.length}</strong></div>
      </div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Bereich</th><th>Status</th><th>Zeit</th><th>Details</th></tr></thead><tbody>
        ${tickets.slice(0, 8).map(row => `<tr><td>Ticket #${escapeHtml(String(row.ticket_number || ''))}</td><td>${escapeHtml(row.status || '')}</td><td>${formatDate(row.created_at)}</td><td>${escapeHtml(row.ticket_type || 'support')} · ${escapeHtml(row.opener_id || '')}${row.claimed_by_id ? ` · Claim: ${escapeHtml(row.claimed_by_id)}` : ''}</td></tr>`).join('')}
        ${banRequests.slice(0, 8).map(row => `<tr><td>${row.emergency ? 'Notfallban' : 'Ban-Antrag'}</td><td>${escapeHtml(row.status || '')}</td><td>${formatDate(row.created_at)}</td><td>${escapeHtml(row.target_user_id || '')} · ${escapeHtml(row.reason || '').slice(0, 140)}</td></tr>`).join('')}
        ${sessionRequests.slice(0, 8).map(row => `<tr><td>Session</td><td>${escapeHtml(row.status || '')}</td><td>${formatDate(row.starts_at)}</td><td>${escapeHtml(row.title || '')} · Quelle: ${escapeHtml(row.source || '')}</td></tr>`).join('')}
        ${securityEvents.slice(0, 8).map(row => `<tr><td>Security</td><td>${escapeHtml(row.severity || '')}</td><td>${formatDate(row.created_at)}</td><td>${escapeHtml(row.event_type || '')} · ${escapeHtml(row.executor_id || 'unbekannt')}</td></tr>`).join('')}
      </tbody></table></div>
    </section>

    <section class="portal-panel">
      <div class="portal-panel__head"><div><h2>Moderationsfälle</h2><p>Discord- und Ingame-Fälle bleiben getrennt über die Quelle erkennbar.</p></div></div>
      ${moderationCases.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Fall</th><th>Typ</th><th>Quelle</th><th>Ziel</th><th>Moderator</th><th>Grund</th><th>Zeit</th></tr></thead><tbody>${moderationCases.slice(0, 25).map(row => `<tr><td>#${escapeHtml(String(row.case_number || ''))}</td><td>${escapeHtml(row.type || '')}</td><td>${escapeHtml(row.source || 'discord')}</td><td>${escapeHtml(row.target_user_id || '')}</td><td>${escapeHtml(row.actor_user_id || '')}</td><td>${escapeHtml(row.reason || '—').slice(0, 160)}</td><td>${formatDate(row.created_at)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Noch keine Moderationsfälle.</p>'}
    </section>

    <section class="portal-panel">
      <div class="portal-panel__head"><div><h2>Bot-Logs</h2><p>Nachrichten-, Mitglieder-, Rollen-, Kanal-, Invite-, Ban-, AutoMod-, Backup- und Systemlogs aus Supabase.</p></div></div>
      ${logs.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Zeit</th><th>Level</th><th>Kategorie</th><th>Aktion</th><th>Akteur</th><th>Ziel</th><th>Info</th></tr></thead><tbody>${logs.slice(0, 100).map(row => `<tr><td>${formatDate(row.created_at)}</td><td>${escapeHtml(row.level || 'info')}</td><td>${escapeHtml(row.category || '')}</td><td>${escapeHtml(row.action || '')}</td><td>${escapeHtml(row.actor_id || '—')}</td><td>${escapeHtml(row.target_id || '—')}</td><td>${escapeHtml(row.message || JSON.stringify(row.details || {})).slice(0, 190)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Noch keine Bot-Logs vorhanden.</p>'}
    </section>

    <div class="portal-split">
      <section class="portal-panel" style="margin-top:0">
        <div class="portal-panel__head"><div><h2>Aktions-Queue</h2><p>Letzte Dashboard- und Website-Aufträge an den Bot.</p></div></div>
        ${actions.length ? actions.slice(0, 20).map(row => `<div class="role-row"><div><strong>${escapeHtml(row.action || '')}</strong><small>${formatDate(row.created_at)}${row.last_error ? ` · ${escapeHtml(row.last_error).slice(0, 120)}` : ''}</small></div>${badge(row.status || 'pending', row.status === 'done' ? 'done' : row.status === 'failed' ? 'rejected' : 'open')}</div>`).join('') : '<p class="muted">Keine Bot-Aktionen.</p>'}
      </section>
      <section class="portal-panel" style="margin-top:0">
        <div class="portal-panel__head"><div><h2>Automationen</h2><p>Tägliche Backups, Creator-Nachweise und Aktivitätsvorschläge.</p></div></div>
        <div class="role-list">
          <div class="role-row"><div><strong>Letztes Strukturbackup</strong><small>${backups[0]?.created_at ? formatDate(backups[0].created_at) : 'Noch keines gespeichert'}</small></div></div>
          <div class="role-row"><div><strong>Creator-Nachweise</strong><small>${creatorProofs.length} gespeicherte Nachweise</small></div></div>
          <div class="role-row"><div><strong>Aktives Mitglied</strong><small>${pendingSuggestions} offene manuelle Vorschläge</small></div></div>
        </div>
      </section>
    </div>`;
}

async function settingsView() {
  const [settings, positions] = await Promise.all([getSettings(), listRows('team_positions')]);
  return `<div class="portal-split"><form class="portal-panel" id="settings-form" style="margin-top:0"><div class="portal-panel__head"><div><h2>Serverstatus</h2><p>Automatik plus manuelle Übersteuerung.</p></div></div><div class="portal-form-grid"><label class="field"><span>Offizieller Sessionstatus</span><select class="select" name="official_status">${SESSION_STATUSES.map(item => `<option value="${item.value}" ${settings.official_status===item.value?'selected':''}>${item.label}</option>`).join('')}</select></label><label class="field"><span>Servercode</span><input class="input" name="server_code" value="${escapeHtml(settings.server_code || 'NEXURA')}"></label><label class="field"><span>Spielerzahl manuell</span><input class="input" name="players" type="number" min="0" value="${Number(settings.players || 0)}"></label><label class="field"><span>Max. Spieler</span><input class="input" name="max_players" type="number" min="1" value="${Number(settings.max_players || 40)}"></label><label class="checkbox field--full"><input type="checkbox" name="manual_override" ${settings.manual_override?'checked':''}><span>Automatische Roblox-Daten manuell übersteuern</span></label><label class="checkbox field--full"><input type="checkbox" name="team_applications_open" ${settings.team_applications_open!==false?'checked':''}><span>Team-Bewerbungen insgesamt geöffnet</span></label></div><div class="form-actions"><button class="button button--primary" type="submit">Speichern</button></div></form><section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Stellenplan</h2><p>Hauptschalter plus einzelne Rollen.</p></div></div><div class="role-list">${positions.map(position => `<div class="role-row"><div><strong>${escapeHtml(position.label)}</strong><small>${escapeHtml(position.group_name)}</small></div><label class="checkbox"><input type="checkbox" data-position-open="${position.id}" ${position.open?'checked':''}><span>${position.open ? 'Offen' : 'Geschlossen'}</span></label></div>`).join('')}</div></section></div>`;
}

async function backupView() {
  if (!isOwner(authState.profile.website_role)) return '<div class="permission-lock">Nur der Owner kann Daten exportieren.</div>';
  return `<section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>JSON-Export und lokale Sicherung</h2><p>Exportiert strukturierte Portal-Daten. Auth-Konten, Passwörter und Cloudflare-Secrets sind niemals enthalten.</p></div></div><div class="card-grid"><article class="card"><span class="tag">Export</span><h3>Aktuelle Daten herunterladen</h3><p>News, Ideen, Sessions, Stellen, Eingänge, Akten, Workflows, Projekte, Gangs, Regeln und Einstellungen.</p><button class="button button--primary" type="button" data-export-backup>JSON exportieren</button></article><article class="card"><span class="tag">Demo</span><h3>Lokale Demo zurücksetzen</h3><p>Nur im Demo-Modus werden Browserdaten gelöscht und neu erzeugt. Produktivdaten in Supabase bleiben unberührt.</p><button class="button button--danger" type="button" data-reset-demo ${isSupabaseConfigured() ? 'disabled' : ''}>Demo zurücksetzen</button></article><article class="card"><span class="tag">Sicherheit</span><h3>Kein Geheimnis im Export</h3><p>Webhook-URLs, Service-Role-Key, Discord-Secret und andere Zugangsdaten liegen ausschließlich in Cloudflare beziehungsweise Supabase.</p></article></div></section>`;
}

async function auditView() {
  if (!isOwner(authState.profile.website_role)) return '<div class="permission-lock">Nur der Owner kann den vollständigen Audit-Log sehen.</div>';
  const rows = await listRows('audit_log');
  return `<section class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Owner-Log</h2><p>Änderungen, Löschungen, Freigaben, Rollenwechsel und Sicherheitsaktionen.</p></div></div>${rows.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Zeit</th><th>Aktion</th><th>Akteur</th><th>Ziel</th><th>Details</th></tr></thead><tbody>${rows.map(row => `<tr><td>${formatDate(row.created_at)}</td><td>${escapeHtml(row.action)}</td><td>${escapeHtml(row.actor_name || row.actor_id || 'System')}</td><td>${escapeHtml(`${row.target_type || ''}:${row.target_id || ''}`)}</td><td><code>${escapeHtml(JSON.stringify(row.details || {})).slice(0,220)}</code></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Noch keine Audit-Einträge.</p>'}</section>`;
}

function inspectSubmission(row) {
  const payload = row.payload || {};
  const role = authState.profile.website_role;
  const canDecideApplication = isLeadership(role) || isOwner(role);
  const applicationPanel = row.type === 'team_application' ? `<form id="application-review-form" class="form-section"><h3>Bewerbungsstatus und Gespräch</h3><div class="portal-form-grid"><label class="field"><span>Status</span><select class="select" name="status"><option value="in_review" ${row.status === 'in_review' ? 'selected' : ''}>In Prüfung</option><option value="question" ${row.status === 'question' ? 'selected' : ''}>Rückfrage</option><option value="interview" ${row.status === 'interview' ? 'selected' : ''}>Vorstellungsgespräch</option>${canDecideApplication ? `<option value="accepted" ${row.status === 'accepted' ? 'selected' : ''}>Angenommen</option><option value="rejected" ${row.status === 'rejected' ? 'selected' : ''}>Abgelehnt</option>` : ''}</select></label><label class="field"><span>Vorgeschlagener Termin</span><input class="input" type="datetime-local" name="interview_at" value="${payload.interview_at ? new Date(payload.interview_at).toISOString().slice(0,16) : ''}"></label><label class="field field--full"><span>Alternative Termine</span><textarea class="textarea" name="alternative_slots" placeholder="Ein Termin pro Zeile">${escapeHtml(payload.alternative_slots || '')}</textarea></label><label class="field field--full"><span>Nachricht an Bewerber</span><textarea class="textarea" name="public_message" required>${escapeHtml(row.public_message || '')}</textarea></label></div><div class="form-actions"><button class="button button--primary" type="submit">Status und Termin speichern</button></div><p class="muted">Der Nexura-Bot ist mit derselben Supabase-Datenbank verbunden. Discord-Aktionen können über die Bot-Queue verarbeitet werden.</p></form>` : '';
  openModal({ title: `${row.reference} · ${row.type}`, content: `<div class="server-metrics"><div class="metric"><small>Status</small><strong>${escapeHtml(statusLabel(row.status))}</strong></div><div class="metric"><small>Priorität</small><strong>${escapeHtml(row.priority || 'normal')}</strong></div></div><div class="rule-list" style="margin-top:20px">${Object.entries(payload).map(([key,value]) => `<div class="rule"><strong>${escapeHtml(key.replaceAll('_',' '))}</strong><p>${escapeHtml(Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''))}</p></div>`).join('')}</div>${applicationPanel}${row.type === 'gang_application' ? '<div class="form-actions"><button class="button button--success" type="button" data-approve-gang>Gang freischalten</button></div>' : ''}`, onOpen(root, close) {
    root.querySelector('#application-review-form')?.addEventListener('submit', async event => {
      event.preventDefault(); const data = formDataObject(event.currentTarget);
      const mergedPayload = { ...payload, interview_at: data.interview_at ? new Date(data.interview_at).toISOString() : null, alternative_slots: data.alternative_slots || '' };
      try {
        await updateRow('submissions', row.id, { status: data.status, payload: mergedPayload, public_message: data.public_message, decision_reason: ['accepted','rejected'].includes(data.status) ? data.public_message : null });
        await appendAudit('application.review_updated', 'submission', row.id, { status: data.status, interview_at: mergedPayload.interview_at }, { id: authState.user.id, name: authState.profile.discord_name });
        close(); toast('Bewerbung aktualisiert', statusLabel(data.status), 'success'); showView('applications');
      } catch (error) { toast('Aktualisierung fehlgeschlagen', error.message, 'error'); }
    });
    root.querySelector('[data-approve-gang]')?.addEventListener('click', async () => {
      try { await insertRow('gangs', { submission_id: row.id, name: payload.gang_name, founder: payload.founder, description: payload.description, colors: payload.colors, motto: payload.motto, logo_url: payload.logo_url || null, discord_contact: payload.discord_contact, member_count: Number(payload.member_count || 0), member_roblox_names: payload.member_roblox_names || '', status: 'approved', published: true, reviewed_by: authState.user.id }); await updateRow('submissions', row.id, { status: 'accepted' }); await appendAudit('gang.approved', 'submission', row.id, { gang_name: payload.gang_name }, { id: authState.user.id, name: authState.profile.discord_name }); close(); toast('Gang freigeschaltet', payload.gang_name, 'success'); showView('gangs'); } catch (error) { toast('Freigabe fehlgeschlagen', error.message, 'error'); }
    });
  }});
}

async function openWorkflow(id) {
  const row = (await listRows('workflow_requests')).find(item => item.id === id);
  if (!row) return;
  const role = authState.profile.website_role;
  const canDecidePromotion = row.type === 'promotion' && (hasPermission(role, 'approve_promotions') || isOwner(role));
  const canDecideAbsence = ['absence', 'exit'].includes(row.type) && (hasPermission(role, 'manage_absences') || isLeadership(role));
  const canDecideOther = !['promotion', 'absence', 'exit'].includes(row.type) && (isLeadership(role) || isOwner(role));
  const canDecide = canDecidePromotion || canDecideAbsence || canDecideOther;
  openModal({ title: `Workflow · ${row.subject_name}`, content: `<div class="server-metrics"><div class="metric"><small>Typ</small><strong>${escapeHtml(row.type)}</strong></div><div class="metric"><small>Status</small><strong>${escapeHtml(statusLabel(row.status))}</strong></div><div class="metric"><small>Ziel / Zeitraum</small><strong>${escapeHtml(row.target_role || row.period || '—')}</strong></div></div><div class="rule-list" style="margin-top:18px"><div class="rule"><strong>Begründung</strong><p>${escapeHtml(row.reason || '—')}</p></div><div class="rule"><strong>Übergabe / offene Aufgaben</strong><p>${escapeHtml(row.handover || '—')}</p></div>${row.decision_note ? `<div class="rule"><strong>Entscheidung</strong><p>${escapeHtml(row.decision_note)}</p></div>` : ''}</div>${canDecide ? `<form id="workflow-decision-form" class="form-section"><h3>Entscheidung</h3><div class="portal-form-grid"><label class="field"><span>Status</span><select class="select" name="status"><option value="question">Rückfrage</option><option value="approved">Genehmigt</option><option value="rejected">Abgelehnt</option><option value="done">Erledigt</option></select></label><label class="field field--full"><span>Begründung / nächste Schritte</span><textarea class="textarea" name="decision_note" required></textarea></label></div><div class="form-actions"><button class="button button--primary" type="submit">Entscheidung speichern</button></div></form>` : '<div class="auth-note">Du kannst diesen Vorgang lesen, aber nicht endgültig entscheiden.</div>'}`, onOpen(root, close) {
    root.querySelector('#workflow-decision-form')?.addEventListener('submit', async event => {
      event.preventDefault(); const data = formDataObject(event.currentTarget);
      try {
        await updateRow('workflow_requests', row.id, { status: data.status, decision_note: data.decision_note, reviewed_by: authState.user.id, decided_by: ['approved','rejected','done'].includes(data.status) ? authState.user.id : null });
        await appendAudit('workflow.status_changed', 'workflow_request', row.id, { type: row.type, status: data.status }, { id: authState.user.id, name: authState.profile.discord_name });
        close(); toast('Workflow aktualisiert', statusLabel(data.status), 'success'); showView('workflows');
      } catch (error) { toast('Entscheidung fehlgeschlagen', error.message, 'error'); }
    });
  }});
}

async function openPlayerRecord(id) {
  const record = (await listRows('player_records')).find(row => row.id === id);
  const entries = (await listRows('player_record_entries')).filter(row => row.record_id === id);
  openModal({ title: `Spielerakte · ${record?.roblox_name || ''}`, content: `<div class="server-metrics"><div class="metric"><small>Punkte</small><strong>${Number(record?.points || 0)}</strong></div><div class="metric"><small>Sanktion</small><strong>${escapeHtml(record?.active_sanction || 'Keine')}</strong></div></div><div class="rule-list">${entries.map(entry => `<div class="rule"><strong>${escapeHtml(entry.category)} · ${Number(entry.points || 0)} Punkte</strong><p>${escapeHtml(entry.reason)}<br>Verfall: ${formatDate(entry.expires_at)}</p></div>`).join('') || '<p class="muted">Keine Einträge.</p>'}</div>${hasPermission(authState.profile.website_role,'create_player_entry') || hasPermission(authState.profile.website_role,'manage_player_records') ? `<form id="record-entry-form" class="form-section"><h3>Eintrag ergänzen</h3><div class="portal-form-grid"><label class="field"><span>Kategorie</span><input class="input" name="category" required></label><label class="field"><span>Punkte</span><input class="input" name="points" type="number" min="0" max="20" required></label><label class="field field--full"><span>Grund</span><textarea class="textarea" name="reason" required></textarea></label><label class="field"><span>Schwere</span><select class="select" name="severity"><option value="light">Leicht · 30 Tage</option><option value="medium">Mittel · 60 Tage</option><option value="severe">Schwer · 120 Tage</option><option value="critical">Sehr schwer · kein Verfall</option></select></label><label class="field"><span>Sanktionsvorschlag</span><input class="input" name="suggested_sanction"></label></div><div class="form-actions"><button class="button button--primary" type="submit">Eintrag speichern</button></div></form>` : ''}`, onOpen(root, close) {
    root.querySelector('#record-entry-form')?.addEventListener('submit', async event => { event.preventDefault(); const data = formDataObject(event.currentTarget); const days = { light:30, medium:60, severe:120 }[data.severity]; const expires = days ? new Date(Date.now()+days*86400000).toISOString() : null; try { await insertRow('player_record_entries', { record_id:id, category:data.category, points:Number(data.points), reason:data.reason, severity:data.severity, expires_at:expires, suggested_sanction:data.suggested_sanction, created_by:authState.user.id, created_by_name:authState.profile.discord_name }); await appendAudit('player_record.entry_created','player_record',id,{points:Number(data.points),reason:data.reason},{id:authState.user.id,name:authState.profile.discord_name}); close(); toast('Akteneintrag gespeichert','','success'); showView('player-records'); } catch(error){toast('Speichern fehlgeschlagen',error.message,'error');} });
  }});
}

async function openTeamRecord(id) {
  const record = (await listRows('team_records')).find(row => row.id === id);
  const entries = (await listRows('team_record_entries')).filter(row => row.record_id === id);
  openModal({ title: `Teamakte · ${record?.discord_name || ''}`, content: `<div class="server-metrics"><div class="metric"><small>Rolle</small><strong>${escapeHtml(roleByKey(record?.role_key).label)}</strong></div><div class="metric"><small>Status</small><strong>${escapeHtml(record?.status || 'active')}</strong></div><div class="metric"><small>Bewertung</small><strong>${Number(record?.rating || 0).toFixed(1)} / 5</strong></div></div><div class="rule-list">${entries.map(entry => `<div class="rule"><strong>${escapeHtml(entry.entry_type || entry.type)}</strong><p>${escapeHtml(entry.title || '')}<br>${escapeHtml(entry.details || '')}</p></div>`).join('') || '<p class="muted">Noch keine Einträge.</p>'}</div><form id="team-entry-form" class="form-section"><h3>Teamakte ergänzen</h3><div class="portal-form-grid"><label class="field"><span>Typ</span><select class="select" name="type"><option>Bewertung</option><option>Beförderung</option><option>Abmahnung</option><option>Schulung</option><option>Beurlaubung</option><option>Notiz</option></select></label><label class="field"><span>Titel</span><input class="input" name="title" required></label><label class="field field--full"><span>Details</span><textarea class="textarea" name="details" required></textarea></label><label class="field"><span>Bewertung 1–5</span><input class="input" name="rating" type="number" min="1" max="5" step=".1"></label><label class="field"><span>Ergebnis</span><select class="select" name="result"><option>bestanden</option><option>verbesserungswürdig</option><option>nicht bestanden</option></select></label></div><div class="form-actions"><button class="button button--primary" type="submit">Speichern</button></div></form>`, onOpen(root, close) {
    root.querySelector('#team-entry-form').addEventListener('submit', async event => { event.preventDefault(); const data=formDataObject(event.currentTarget); try { await insertRow('team_record_entries',{record_id:id,entry_type:data.type,title:data.title,details:data.details,score:data.rating?Number(data.rating):null,result:data.result,created_by:authState.user.id}); if(data.rating) await updateRow('team_records',id,{rating:Number(data.rating)}); await appendAudit('team_record.entry_created','team_record',id,{type:data.type},{id:authState.user.id,name:authState.profile.discord_name}); close(); toast('Teamakte ergänzt','','success'); showView('team-records'); } catch(error){toast('Speichern fehlgeschlagen',error.message,'error');} });
  }});
}

function bindViewActions(view) {
  document.querySelectorAll('[data-edit-profile]').forEach(button => button.addEventListener('click', () => {
    if (!isOwner(authState.profile.website_role)) return;
    const profile = viewCache.profiles.find(item => item.id === button.dataset.editProfile);
    if (!profile) return;
    const roleOptions = [`<option value="player">Spieler</option>`, ...ROLE_GROUPS.flatMap(group => group.roles).map(role => `<option value="${role.key}" ${profile.website_role === role.key ? 'selected' : ''}>${escapeHtml(role.label)}</option>`)].join('');
    const until = profile.suspended_until ? new Date(profile.suspended_until).toISOString().slice(0, 16) : '';
    openModal({ title: `Konto bearbeiten · ${profile.discord_name || profile.email || ''}`, content: `<form id="profile-access-form"><div class="portal-form-grid"><label class="field"><span>Website-Rolle</span><select class="select" name="website_role">${roleOptions}</select></label><label class="field"><span>Zugangsstatus</span><select class="select" name="status"><option value="active" ${profile.status === 'active' ? 'selected' : ''}>Aktiv</option><option value="pending" ${profile.status === 'pending' ? 'selected' : ''}>Ausstehend</option><option value="suspended" ${profile.status === 'suspended' ? 'selected' : ''}>Vorübergehend gesperrt</option></select></label><label class="checkbox field--full"><input type="checkbox" name="is_approved" ${profile.is_approved ? 'checked' : ''}><span>Website-Rolle durch Owner bestätigt</span></label><label class="field"><span>Sperre bis</span><input class="input" type="datetime-local" name="suspended_until" value="${until}"></label><label class="field"><span>Sperrgrund</span><input class="input" name="suspended_reason" value="${escapeHtml(profile.suspended_reason || '')}"></label><label class="checkbox field--full"><input type="checkbox" name="downgrade_to_player"><span>Teamzugang entfernen und zum normalen Spielerkonto zurückstufen. Die Teamakte bleibt archiviert.</span></label><label class="checkbox field--full"><input type="checkbox" name="former_public"><span>Nach der Rückstufung öffentlich unter „Ehemaliges Team“ anzeigen</span></label><label class="field field--full"><span>Optionale Würdigung</span><textarea class="textarea" name="tribute" placeholder="Kurze öffentliche Würdigung"></textarea></label></div><div class="form-actions"><button class="button button--primary" type="submit">Änderungen speichern</button></div></form>`, onOpen(root, close) {
      root.querySelector('#profile-access-form').addEventListener('submit', async event => {
        event.preventDefault();
        const data = formDataObject(event.currentTarget);
        const downgrade = Boolean(data.downgrade_to_player);
        const oldRole = profile.website_role;
        const patch = downgrade ? {
          website_role: 'player', is_approved: true, status: 'active', former_team_role: oldRole,
          suspended_reason: null, suspended_until: null,
        } : {
          website_role: data.website_role,
          is_approved: Boolean(data.is_approved),
          status: data.status,
          suspended_reason: data.status === 'suspended' ? (data.suspended_reason || null) : null,
          suspended_until: data.status === 'suspended' && data.suspended_until ? new Date(data.suspended_until).toISOString() : null,
        };
        try {
          await updateRow('profiles', profile.id, patch);
          const members = (await listRows('team_members')).filter(item => item.user_id === profile.id || (profile.discord_name && String(item.discord_name || '').toLowerCase() === String(profile.discord_name).toLowerCase()));
          const records = (await listRows('team_records')).filter(item => item.user_id === profile.id || (profile.discord_name && String(item.discord_name || '').toLowerCase() === String(profile.discord_name).toLowerCase()));
          const nextRole = patch.website_role;
          const isNextTeam = roleByKey(nextRole).rank >= 20;
          if (isNextTeam) {
            const memberPatch = { user_id: profile.id, discord_name: profile.discord_name || profile.email || 'Teammitglied', roblox_name: profile.roblox_name || null, role_key: nextRole, public: true, public_status: 'active', left_at: null };
            if (members[0]) await updateRow('team_members', members[0].id, memberPatch); else await insertRow('team_members', memberPatch);
            const recordPatch = { user_id: profile.id, discord_name: profile.discord_name || profile.email || 'Teammitglied', roblox_name: profile.roblox_name || null, role_key: nextRole, previous_role_key: oldRole !== nextRole ? oldRole : null, status: nextRole === 'test_support' ? 'probation' : 'active', left_at: null };
            if (records[0]) await updateRow('team_records', records[0].id, recordPatch); else await insertRow('team_records', { ...recordPatch, joined_at: new Date().toISOString(), rating: 0 });
          } else {
            if (members[0]) await updateRow('team_members', members[0].id, { public: Boolean(data.former_public), public_status: 'former', former_public: Boolean(data.former_public), tribute: data.tribute || null, left_at: new Date().toISOString() });
            if (records[0]) await updateRow('team_records', records[0].id, { status: 'former', previous_role_key: oldRole, left_at: new Date().toISOString() });
          }
          await appendAudit('profile.access_updated', 'profile', profile.id, { old_role: oldRole, new_role: nextRole, status: patch.status, downgraded: downgrade }, { id: authState.user.id, name: authState.profile.discord_name });
          close(); toast('Konto aktualisiert', roleByKey(nextRole).label, 'success'); showView('accounts');
        } catch (error) { toast('Änderung fehlgeschlagen', error.message, 'error'); }
      });
    }});
  }));

  document.querySelectorAll('[data-review-link]').forEach(button => button.addEventListener('click', () => {
    const link = viewCache.accountLinks.find(item => item.id === button.dataset.reviewLink);
    if (!link) return;
    const role = authState.profile.website_role;
    const canPrepare = hasPermission(role, 'prepare_account_links') || isOwner(role);
    const canApprove = hasPermission(role, 'approve_account_links') || isOwner(role);
    openModal({ title: `Roblox-Verknüpfung · ${link.roblox_name}`, content: `<div class="server-metrics"><div class="metric"><small>Discord</small><strong>${escapeHtml(link.discord_name || '—')}</strong></div><div class="metric"><small>Roblox</small><strong>${escapeHtml(link.roblox_name)}</strong></div><div class="metric"><small>Code</small><strong>${escapeHtml(link.verification_code)}</strong></div></div><form id="account-link-review"><div class="form-section"><label class="checkbox"><input type="checkbox" name="profile_code_confirmed" ${link.profile_code_confirmed ? 'checked' : ''} ${canPrepare ? '' : 'disabled'}><span>Code wurde in der Roblox-Profilbeschreibung geprüft</span></label><label class="checkbox" style="margin-top:12px"><input type="checkbox" name="ticket_confirmed" ${link.ticket_confirmed ? 'checked' : ''} ${canPrepare ? '' : 'disabled'}><span>Discord-Ticket und Identität wurden geprüft</span></label></div><div class="form-actions">${canPrepare ? '<button class="button button--secondary" type="submit">Prüfung speichern</button>' : ''}${canApprove ? `<button class="button button--success" type="button" data-approve-account-link ${link.profile_code_confirmed && link.ticket_confirmed ? '' : 'disabled'}>Endgültig freigeben</button>` : ''}${isOwner(role) ? '<button class="button button--danger" type="button" data-revoke-account-link>Verknüpfung aufheben</button>' : ''}</div></form><p class="muted">Die endgültige Freigabe ist erst möglich, wenn beide Prüfschritte bestätigt sind.</p>`, onOpen(root, close) {
      root.querySelector('#account-link-review')?.addEventListener('submit', async event => {
        event.preventDefault(); const data = formDataObject(event.currentTarget);
        try { await updateRow('account_links', link.id, { profile_code_confirmed: Boolean(data.profile_code_confirmed), ticket_confirmed: Boolean(data.ticket_confirmed), admin_checked_by: authState.user.id, status: 'prepared' }); await appendAudit('account_link.prepared', 'account_link', link.id, {}, { id: authState.user.id, name: authState.profile.discord_name }); close(); toast('Prüfung gespeichert', '', 'success'); showView('accounts'); } catch (error) { toast('Prüfung fehlgeschlagen', error.message, 'error'); }
      });
      root.querySelector('[data-approve-account-link]')?.addEventListener('click', async () => {
        try { await updateRow('account_links', link.id, { status: 'approved', approved_by: authState.user.id }); await appendAudit('account_link.approved', 'account_link', link.id, {}, { id: authState.user.id, name: authState.profile.discord_name }); close(); toast('Verknüpfung freigegeben', '', 'success'); showView('accounts'); } catch (error) { toast('Freigabe fehlgeschlagen', error.message, 'error'); }
      });
      root.querySelector('[data-revoke-account-link]')?.addEventListener('click', async () => {
        try { await updateRow('account_links', link.id, { status: 'revoked', approved_by: authState.user.id }); await appendAudit('account_link.revoked', 'account_link', link.id, {}, { id: authState.user.id, name: authState.profile.discord_name }); close(); toast('Verknüpfung aufgehoben', '', 'success'); showView('accounts'); } catch (error) { toast('Aufheben fehlgeschlagen', error.message, 'error'); }
      });
    }});
  }));

  document.querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', () => showView(button.dataset.jump)));
  document.querySelectorAll('[data-inspect-submission]').forEach(button => button.addEventListener('click', async () => { const row=(await listRows('submissions')).find(item=>item.id===button.dataset.inspectSubmission); if(row) inspectSubmission(row); }));
  document.querySelectorAll('[data-submission-status]').forEach(select => select.addEventListener('change', async () => { try { await updateRow('submissions',select.dataset.submissionStatus,{status:select.value}); await appendAudit('submission.status_changed','submission',select.dataset.submissionStatus,{status:select.value},{id:authState.user.id,name:authState.profile.discord_name}); toast('Status aktualisiert','','success'); } catch(error){toast('Änderung fehlgeschlagen',error.message,'error');} }));
  document.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async () => { if(!isOwner(authState.profile.website_role)) return; const [table,id]=button.dataset.delete.split(':'); const ok=await confirmModal({title:'Eintrag löschen?',message:'Nur der Owner darf löschen. Diese Aktion wird im Audit-Log dokumentiert.',confirmText:'Endgültig löschen',danger:true}); if(!ok)return; try{await deleteRow(table,id);await appendAudit(`${table}.deleted`,table,id,{}, {id:authState.user.id,name:authState.profile.discord_name});toast('Eintrag gelöscht','','success');showView(view);}catch(error){toast('Löschen fehlgeschlagen',error.message,'error');} }));
  document.querySelectorAll('[data-open-player-record]').forEach(button=>button.addEventListener('click',()=>openPlayerRecord(button.dataset.openPlayerRecord)));
  document.querySelectorAll('[data-open-team-record]').forEach(button=>button.addEventListener('click',()=>openTeamRecord(button.dataset.openTeamRecord)));
  document.querySelectorAll('[data-open-workflow]').forEach(button=>button.addEventListener('click',()=>openWorkflow(button.dataset.openWorkflow)));

  document.querySelector('[data-create-player-record]')?.addEventListener('click',()=>openModal({title:'Neue Spielerakte',content:`<form id="new-player-record"><div class="portal-form-grid"><label class="field"><span>Roblox-Name</span><input class="input" name="roblox_name" required></label><label class="field"><span>Discord-Name</span><input class="input" name="discord_name"></label><label class="field"><span>Startpunkte</span><input class="input" name="points" type="number" value="0" min="0"></label><label class="field"><span>Aktive Sanktion</span><input class="input" name="active_sanction" placeholder="Keine"></label></div><div class="form-actions"><button class="button button--primary" type="submit">Akte anlegen</button></div></form>`,onOpen(root,close){root.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{const row=await insertRow('player_records',{...data,points:Number(data.points||0)});await appendAudit('player_record.created','player_record',row.id,{roblox_name:data.roblox_name},{id:authState.user.id,name:authState.profile.discord_name});close();showView('player-records');}catch(error){toast('Fehler',error.message,'error');}})}}));
  document.querySelector('[data-create-team-record]')?.addEventListener('click',()=>openModal({title:'Neue Teamakte',content:`<form id="new-team-record"><div class="portal-form-grid"><label class="field"><span>Discord-Name</span><input class="input" name="discord_name" required></label><label class="field"><span>Roblox-Name</span><input class="input" name="roblox_name"></label><label class="field"><span>Rolle</span><select class="select" name="role_key">${ROLE_GROUPS.flatMap(g=>g.roles).map(r=>`<option value="${r.key}">${escapeHtml(r.label)}</option>`).join('')}</select></label><label class="field"><span>Status</span><select class="select" name="status"><option value="active">Aktiv</option><option value="leave">Beurlaubt</option><option value="away">Abwesend</option></select></label></div><div class="form-actions"><button class="button button--primary" type="submit">Teamakte anlegen</button></div></form>`,onOpen(root,close){root.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{const row=await insertRow('team_records',{...data,rating:0,joined_at:new Date().toISOString()});await appendAudit('team_record.created','team_record',row.id,{discord_name:data.discord_name},{id:authState.user.id,name:authState.profile.discord_name});close();showView('team-records');}catch(error){toast('Fehler',error.message,'error');}})}}));

  document.querySelector('[data-create-workflow]')?.addEventListener('click',()=>{
    const role = authState.profile.website_role;
    const canOfficialPromotion = hasPermission(role, 'propose_promotions') || isLeadership(role);
    const typeOptions = `${canOfficialPromotion ? '<option value="promotion">Offizieller Beförderungsantrag</option>' : ''}<option value="promotion_interest">Eigenes Beförderungsinteresse</option><option value="absence">Abwesenheit/Beurlaubung</option><option value="exit">Austrittsantrag</option><option value="mfa_reset">2FA-Reset-Anfrage</option>`;
    openModal({title:'Team-Workflow starten',content:`<form id="workflow-form"><div class="portal-form-grid"><label class="field"><span>Typ</span><select class="select" name="type">${typeOptions}</select></label><label class="field"><span>Person</span><input class="input" name="subject_name" value="${escapeHtml(authState.profile.discord_name || '')}" required></label><label class="field"><span>Zielrolle</span><input class="input" name="target_role"></label><label class="field"><span>Zeitraum</span><input class="input" name="period"></label><label class="field field--full"><span>Begründung und Leistungen</span><textarea class="textarea" name="reason" required></textarea></label><label class="field field--full"><span>Übergabe / offene Aufgaben</span><textarea class="textarea" name="handover"></textarea></label></div><div class="form-actions"><button class="button button--primary" type="submit">Antrag erstellen</button></div></form>`,onOpen(root,close){root.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{const row=await insertRow('workflow_requests',{...data,subject_user_id:data.subject_name === authState.profile.discord_name ? authState.user.id : null,status:'in_review',created_by:authState.user.id});await appendAudit('workflow.created','workflow_request',row.id,{type:data.type,subject:data.subject_name},{id:authState.user.id,name:authState.profile.discord_name});close();showView('workflows');}catch(error){toast('Fehler',error.message,'error');}})}});
  });

  document.querySelector('#session-form')?.addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{const row=await insertRow('sessions',{...data,starts_at:new Date(data.starts_at).toISOString(),approved:false,published:false,created_by:authState.user.id});await appendAudit('session.draft_created','session',row.id,{title:data.title},{id:authState.user.id,name:authState.profile.discord_name});toast('Session-Entwurf gespeichert','','success');showView('sessions');}catch(error){toast('Fehler',error.message,'error');}});
  document.querySelectorAll('[data-approve-session]').forEach(button=>button.addEventListener('click',async()=>{try{await updateRow('sessions',button.dataset.approveSession,{approved:true,published:true,approved_by:authState.user.id});await appendAudit('session.approved','session',button.dataset.approveSession,{}, {id:authState.user.id,name:authState.profile.discord_name});toast('Session freigegeben','','success');showView('sessions');}catch(error){toast('Fehler',error.message,'error');}}));
  document.querySelectorAll('[data-announce-session]').forEach(button => button.addEventListener('click', async () => {
    try {
      const botSettings = (await listRows('bot_settings'))[0];
      if (!botSettings) throw new Error('Bot ist noch nicht mit der Website konfiguriert.');
      await insertRow('bot_actions', {
        guild_id: botSettings.guild_id,
        action: 'ANNOUNCE_SESSION',
        payload: { session_id: button.dataset.announceSession },
        status: 'pending',
        created_by: authState.user.id,
      });
      toast('Discord-Ankündigung eingereiht', 'Der Nexura Bot übernimmt die Veröffentlichung.', 'success');
    } catch (error) {
      toast('Ankündigung nicht eingereiht', error.message, 'error');
    }
  }));

  document.querySelector('#news-form')?.addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{await insertRow('news',{category:data.category,title:data.title,excerpt:data.excerpt,published:Boolean(data.published),published_at:new Date().toISOString(),created_by:authState.user.id});toast('News gespeichert','','success');showView('content');}catch(error){toast('Fehler',error.message,'error');}});
  document.querySelector('#idea-publish-form')?.addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{await insertRow('ideas',{category:data.category,title:data.title,status:data.status,summary:data.summary,author_name:data.author_name,public:Boolean(data.public),created_by:authState.user.id});toast('Idee veröffentlicht','','success');showView('content');}catch(error){toast('Fehler',error.message,'error');}});
  document.querySelector('#project-form')?.addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{await insertRow('projects',{...data,due_at:data.due_at?new Date(data.due_at).toISOString():null,created_by:authState.user.id});toast('Projekt gespeichert','','success');showView('projects');}catch(error){toast('Fehler',error.message,'error');}});
  document.querySelector('[data-export-backup]')?.addEventListener('click',async()=>{try{const tables=['profiles','app_settings','team_positions','team_members','news','ideas','sessions','gangs','submissions','account_links','player_records','player_record_entries','team_records','team_record_entries','workflow_requests','projects','internal_rules','internal_rule_acknowledgements','audit_log','bot_settings','bot_status','bot_logs','bot_actions','bot_moderation_cases','bot_tickets','bot_ticket_transcripts','bot_duty_shifts','bot_admin_calls','bot_ban_requests','bot_roblox_profiles','bot_roblox_name_history','bot_user_files','bot_session_requests','bot_session_rsvps','bot_giveaways','bot_giveaway_entries','bot_partner_posts','bot_creator_proofs','bot_activity_daily','bot_active_member_suggestions','bot_rp_rank_assignments','bot_structure_backups','bot_security_events','bot_hr_records'];const payload={exported_at:new Date().toISOString(),project:'Nexura RP v2',data:{}};for(const table of tables){try{payload.data[table]=table==='app_settings'?await getSettings():await listRows(table);}catch{payload.data[table]=[];}}const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`nexura-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);toast('Export erstellt','','success');}catch(error){toast('Export fehlgeschlagen',error.message,'error');}});
  document.querySelector('[data-reset-demo]')?.addEventListener('click',async()=>{const ok=await confirmModal({title:'Demo zurücksetzen?',message:'Alle Änderungen dieses Browsers gehen verloren.',confirmText:'Zurücksetzen',danger:true});if(ok){demoStore.reset();toast('Demo zurückgesetzt','','success');showView('backup');}});

  document.querySelector('[data-publish-rule]')?.addEventListener('click',()=>openModal({title:'Interne Regelversion veröffentlichen',content:`<form id="rule-version-form"><div class="portal-form-grid"><label class="field"><span>Versionsnummer</span><input class="input" name="version" placeholder="1.0" required></label><label class="field"><span>Frist in Tagen</span><input class="input" name="ack_deadline_days" type="number" value="3" min="0"></label><label class="field field--full"><span>Änderungsübersicht</span><textarea class="textarea" name="change_summary" required></textarea></label><label class="checkbox field--full"><input type="checkbox" name="critical"><span>Kritische Änderung – Bestätigung vor weiterer Nutzung sensibler Funktionen</span></label><label class="checkbox field--full"><input type="checkbox" name="test_required"><span>Kurzer Kontrolltest erforderlich</span></label></div><div class="form-actions"><button class="button button--primary" type="submit">Veröffentlichen</button></div></form>`,onOpen(root,close){root.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{const row=await insertRow('internal_rules',{version:data.version,change_summary:data.change_summary,critical:Boolean(data.critical),test_required:Boolean(data.test_required),ack_deadline_days:Number(data.ack_deadline_days),published_at:new Date().toISOString(),published_by:authState.user.id});await appendAudit('internal_rules.published','internal_rules',row.id,{version:data.version},{id:authState.user.id,name:authState.profile.discord_name});close();showView('rules');}catch(error){toast('Fehler',error.message,'error');}})}}));
  document.querySelector('[data-propose-rule]')?.addEventListener('click',()=>openModal({title:'Regeländerung vorschlagen',content:`<form id="rule-proposal"><label class="field"><span>Betroffene Rollen</span><input class="input" name="affected_roles" required></label><label class="field" style="margin-top:14px"><span>Vorschlag und Begründung</span><textarea class="textarea" name="reason" required></textarea></label><div class="form-actions"><button class="button button--primary" type="submit">Vorschlag einreichen</button></div></form>`,onOpen(root,close){root.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{await insertRow('workflow_requests',{type:'rule_change',subject_name:authState.profile.discord_name,reason:data.reason,target_role:data.affected_roles,status:'in_review',created_by:authState.user.id});close();toast('Vorschlag eingereicht','','success');}catch(error){toast('Fehler',error.message,'error');}})}}));


  document.querySelector('#bot-settings-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const data = formDataObject(event.currentTarget);
    const splitIds = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean);
    const parseJson = (value, label) => {
      try { return JSON.parse(String(value || '{}')); }
      catch { throw new Error(`${label} enthält ungültiges JSON.`); }
    };

    try {
      const modules = {
        moderation: Boolean(data.module_moderation),
        automod: Boolean(data.module_automod),
        tickets: Boolean(data.module_tickets),
        welcome: Boolean(data.module_welcome),
        logging: Boolean(data.module_logging),
        leveling: Boolean(data.module_leveling),
        verification: Boolean(data.module_verification),
        role_sync: Boolean(data.module_role_sync),
        session_sync: Boolean(data.module_session_sync),
        security: Boolean(data.module_security),
      };

      const custom = {
        ...parseJson(data.custom_json, 'Erweiterte Bot-Konfiguration'),
        member_role_id: data.member_role_id || '',
        greeting_channel_id: data.greeting_channel_id || '',
        on_duty_role_id: data.on_duty_role_id || '',
        ingame_admin_role_ids: splitIds(data.ingame_admin_role_ids),
        senior_admin_role_ids: splitIds(data.senior_admin_role_ids),
        highest_management_role_ids: splitIds(data.highest_management_role_ids),
        ban_approval_channel_id: data.ban_approval_channel_id || '',
        website_base_url: data.website_base_url || '',
        session_review_channel_id: data.session_review_channel_id || '',
        session_announcement_channel_id: data.session_announcement_channel_id || '',
        booster_role_id: data.booster_role_id || '',
        active_member_role_id: data.active_member_role_id || '',
        partner_channel_id: data.partner_channel_id || '',
        creator_reminder_channel_id: data.creator_reminder_channel_id || '',
        staff_review_channel_id: data.staff_review_channel_id || '',
        ping_roles: parseJson(data.ping_roles, 'Pingrollen'),
        rp_rank_groups: parseJson(data.rp_rank_groups, 'RP-Ranggruppen'),
        security_threshold: Math.max(1, Math.min(20, Number(data.security_threshold || 3))),
        legacy_verification: false,
      };

      await updateRow('bot_settings', data.row_id, {
        enabled: Boolean(data.enabled),
        log_channel_id: data.log_channel_id || null,
        welcome_channel_id: data.welcome_channel_id || null,
        goodbye_channel_id: data.goodbye_channel_id || null,
        ticket_category_id: data.ticket_category_id || null,
        ticket_panel_channel_id: data.ticket_panel_channel_id || null,
        session_channel_id: data.session_channel_id || null,
        verified_role_id: data.verified_role_id || null,
        unverified_role_id: data.unverified_role_id || null,
        staff_role_ids: splitIds(data.staff_role_ids),
        support_role_ids: splitIds(data.support_role_ids),
        protected_role_ids: splitIds(data.protected_role_ids),
        autorole_ids: splitIds(data.autorole_ids),
        role_map: parseJson(data.role_map, 'Website-Rollen-Mapping'),
        automod: parseJson(data.automod, 'AutoMod'),
        leveling: parseJson(data.leveling, 'Leveling'),
        custom,
        modules,
        updated_at: new Date().toISOString(),
      });

      await insertRow('bot_actions', {
        guild_id: data.guild_id,
        action: 'REFRESH_SETTINGS',
        payload: {},
        status: 'pending',
        created_by: authState.user.id,
      });
      await appendAudit('bot.settings_updated', 'bot_settings', data.row_id, { modules }, { id: authState.user.id, name: authState.profile.discord_name });
      toast('Bot-Konfiguration gespeichert', 'Der Bot lädt die Einstellungen automatisch neu.', 'success');
      showView('discord-bot');
    } catch (error) {
      toast('Bot-Konfiguration nicht gespeichert', error.message, 'error');
    }
  });

  document.querySelectorAll('[data-bot-action]').forEach(button => button.addEventListener('click', async () => {
    try {
      const settings = (await listRows('bot_settings'))[0];
      if (!settings) throw new Error('Keine bot_settings-Zeile gefunden.');
      await insertRow('bot_actions', {
        guild_id: settings.guild_id,
        action: button.dataset.botAction,
        payload: {},
        status: 'pending',
        created_by: authState.user.id,
      });
      toast('Bot-Aktion eingereiht', button.dataset.botAction, 'success');
      setTimeout(() => showView('discord-bot'), 700);
    } catch (error) {
      toast('Bot-Aktion fehlgeschlagen', error.message, 'error');
    }
  }));

  document.querySelector('#bot-send-channel-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const data = formDataObject(event.currentTarget);
    try {
      const settings = (await listRows('bot_settings'))[0];
      if (!settings) throw new Error('Keine Bot-Konfiguration gefunden.');
      await insertRow('bot_actions', {
        guild_id: settings.guild_id,
        action: 'SEND_CHANNEL_MESSAGE',
        payload: { channel_id: data.channel_id, message: data.message },
        status: 'pending',
        created_by: authState.user.id,
      });
      event.currentTarget.reset();
      toast('Discord-Nachricht eingereiht', 'Der Bot sendet sie über die gemeinsame Queue.', 'success');
    } catch (error) {
      toast('Nachricht nicht eingereiht', error.message, 'error');
    }
  });

  document.querySelector('#bot-send-dm-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const data = formDataObject(event.currentTarget);
    try {
      const settings = (await listRows('bot_settings'))[0];
      if (!settings) throw new Error('Keine Bot-Konfiguration gefunden.');
      await insertRow('bot_actions', {
        guild_id: settings.guild_id,
        action: 'SEND_DM',
        payload: { user_id: data.user_id, message: data.message },
        status: 'pending',
        created_by: authState.user.id,
      });
      event.currentTarget.reset();
      toast('Discord-DM eingereiht', 'Der Bot verarbeitet die Nachricht automatisch.', 'success');
    } catch (error) {
      toast('DM nicht eingereiht', error.message, 'error');
    }
  });

  document.querySelector('#settings-form')?.addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{await updateSettings({official_status:data.official_status,server_code:data.server_code,players:Number(data.players),max_players:Number(data.max_players),manual_override:Boolean(data.manual_override),team_applications_open:Boolean(data.team_applications_open)});await appendAudit('settings.updated','app_settings','1',data,{id:authState.user.id,name:authState.profile.discord_name});toast('Einstellungen gespeichert','','success');}catch(error){toast('Fehler',error.message,'error');}});
  document.querySelectorAll('[data-position-open]').forEach(input=>input.addEventListener('change',async()=>{try{await updateRow('team_positions',input.dataset.positionOpen,{open:input.checked,applications_open:input.checked});input.nextElementSibling.textContent=input.checked?'Offen':'Geschlossen';}catch(error){toast('Fehler',error.message,'error');}}));
}

export function bindPortal() {
  document.querySelectorAll('[data-demo-role]').forEach(button=>button.addEventListener('click',()=>{demoLoginAs(button.dataset.demoRole);location.href='/portal';}));
  document.querySelector('#mfa-login-form')?.addEventListener('submit',async e=>{e.preventDefault();const data=formDataObject(e.currentTarget);try{await challengeMfa(data.code);location.reload();}catch(error){toast('2FA fehlgeschlagen',error.message,'error');}});
  document.querySelectorAll('[data-portal-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.portalView)));
  document.querySelector('#portal-logout')?.addEventListener('click',async()=>{await signOut();location.href='/konto';});
  if(document.querySelector('#portal-content')) showView(activeView);
}
