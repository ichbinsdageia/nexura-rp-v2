import { CONFIG } from '../config.js';
import { pageHero } from '../components/layout.js';
import { currentAuth, signInEmail, signInDiscord, signOut, signUpOwner, updateProfile, enrollMfa, verifyMfaEnrollment, getAal } from '../lib/auth.js';
import { insertRow, listRows } from '../lib/store.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { escapeHtml, formatDate, formDataObject, reference } from '../lib/utils.js';
import { toast, openModal, badge } from '../components/ui.js';
import { roleByKey } from '../data/roles.js';
import { requiresMfa } from '../lib/permissions.js';

function authCard() {
  return `<section class="auth-shell"><div class="auth-card"><img class="auth-card__logo" src="/assets/nexura-logo.jpg" alt="Nexura RP"><h1>Anmelden</h1><p>Owner nutzt E-Mail und Passwort. Spieler und Teammitglieder nutzen Discord.</p><div class="auth-tabs"><button class="active" type="button" data-auth-tab="login">Anmelden</button><button type="button" data-auth-tab="signup">Owner-Konto erstellen</button></div><form id="email-login-form"><label class="field"><span>E-Mail</span><input class="input" type="email" name="email" required></label><label class="field" style="margin-top:13px"><span>Passwort</span><input class="input" type="password" name="password" minlength="8" required></label><button class="button button--primary button--wide" style="margin-top:17px" type="submit">Mit E-Mail anmelden</button></form><form id="email-signup-form" hidden><div class="auth-note">Diese Registrierung ist nur für das hinterlegte Owner-Konto gedacht. Teammitglieder melden sich über Discord an.</div><label class="field" style="margin-top:13px"><span>Owner-E-Mail</span><input class="input" type="email" name="email" value="${escapeHtml(CONFIG.ownerEmail)}" required readonly></label><label class="field" style="margin-top:13px"><span>Neues Passwort</span><input class="input" type="password" name="password" minlength="12" required></label><button class="button button--primary button--wide" style="margin-top:17px" type="submit">Owner-Konto erstellen</button></form><div class="auth-divider">oder</div><button class="button button--secondary button--wide" type="button" id="discord-login">Mit Discord anmelden</button>${!isSupabaseConfigured() ? '<div class="auth-note" style="margin-top:15px">Demo-Modus: E-Mail-Login funktioniert mit der hinterlegten Owner-E-Mail und einem beliebigen Passwort ab 8 Zeichen. Echte Konten werden nach Supabase-Einrichtung aktiv.</div>' : ''}</div></section>`;
}

export async function renderAccount() {
  const auth = await currentAuth();
  if (!auth.user) return authCard();
  const role = roleByKey(auth.profile?.website_role || 'player');
  const [submissions, records, links] = await Promise.all([
    listRows('submissions', { eq: isSupabaseConfigured() ? { submitter_user_id: auth.user.id } : undefined, filter: row => !row.submitter_user_id || row.submitter_user_id === auth.user.id }).catch(() => []),
    listRows('player_records', { filter: row => row.user_id === auth.user.id || row.roblox_name === auth.profile?.roblox_name }).catch(() => []),
    listRows('account_links', { filter: row => row.user_id === auth.user.id }).catch(() => []),
  ]);
  const link = links[0];
  const record = records[0];
  let aal = { currentLevel: 'aal1', nextLevel: 'aal1' };
  try { aal = await getAal(); } catch {}

  return `${pageHero('Mein Konto', `Willkommen, <span class="gradient-text">${escapeHtml(auth.profile?.discord_name || auth.user.email || 'Nexura-Spieler')}.</span>`, 'Hier verwaltest du die Roblox-Verknüpfung, eigene Anfragen, Punkte, aktive Sanktionen und die Kontosicherheit.')}
  <section class="section section--tight"><div class="shell">
    ${auth.demo ? '<div class="demo-banner" style="border:1px solid rgba(255,209,102,.18);border-radius:14px;margin-bottom:18px">Demo-Modus: Die Daten liegen nur in diesem Browser.</div>' : ''}
    <div class="card-grid"><article class="card"><span class="tag">Profil</span><h3>${escapeHtml(auth.profile?.discord_name || 'Discord noch nicht hinterlegt')}</h3><p>Roblox: ${escapeHtml(auth.profile?.roblox_name || 'Noch nicht verknüpft')}<br>Website-Rolle: ${escapeHtml(role.label)}<br>Status: ${auth.profile?.is_approved ? 'Freigegeben' : 'Freigabe ausstehend'}</p><button class="button button--ghost button--compact" type="button" id="logout" style="margin-top:18px">Abmelden</button></article>
    <article class="card"><span class="tag">Roblox-Verknüpfung</span><h3>${link?.status === 'approved' ? 'Verknüpfung bestätigt' : link ? 'Prüfung ausstehend' : 'Noch nicht beantragt'}</h3><p>${link ? `Roblox: ${escapeHtml(link.roblox_name)} · Code: ${escapeHtml(link.verification_code)} · Status: ${escapeHtml(link.status)}` : 'Discord-Login, Roblox-Code in der Profilbeschreibung und zusätzliche Bestätigung über ein Discord-Ticket.'}</p><button class="button button--primary button--compact" type="button" id="link-roblox" data-link-id="${escapeHtml(link?.id || '')}" style="margin-top:18px">${link ? 'Verknüpfung aktualisieren' : 'Roblox verknüpfen'}</button></article>
    <article class="card"><span class="tag">Kontosicherheit</span><h3>${aal.currentLevel === 'aal2' ? '2FA aktiv' : 'Authenticator einrichten'}</h3><p>${requiresMfa(role.key) ? 'Für Owner, Teamleitung und Administration ist eine Authenticator-App verpflichtend.' : '2FA ist für dein Konto optional, erhöht aber die Sicherheit.'}</p><button class="button button--secondary button--compact" type="button" id="setup-mfa" style="margin-top:18px" ${auth.demo ? 'disabled' : ''}>2FA einrichten</button></article></div>

    <div class="portal-split" style="margin-top:20px"><article class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Eigene Spielerakte</h2><p>Nur freigegebene Punkte und aktive Sanktionen.</p></div></div>${record ? `<div class="server-metrics"><div class="metric"><small>Punkte</small><strong>${Number(record.points || 0)}</strong></div><div class="metric"><small>Aktive Sanktion</small><strong>${escapeHtml(record.active_sanction || 'Keine')}</strong></div></div><p class="muted">Interne Notizen und der Owner-Log werden nicht angezeigt.</p>` : '<div class="empty-state"><div class="empty-icon">▤</div><h3>Keine sichtbare Akte</h3><p>Entweder existiert keine Spielerakte oder die Roblox-Verknüpfung ist noch nicht freigegeben.</p></div>'}</article>
    <article class="portal-panel" style="margin-top:0"><div class="portal-panel__head"><div><h2>Eigene Anfragen</h2><p>Status von Bewerbungen, Meldungen und Einsprüchen.</p></div></div>${submissions.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Referenz</th><th>Typ</th><th>Status</th><th>Termin / Nachricht</th><th>Datum</th></tr></thead><tbody>${submissions.slice(0,10).map(item => `<tr><td>${escapeHtml(item.reference)}</td><td>${escapeHtml(item.type)}</td><td>${badge(item.status, item.status === 'accepted' ? 'done' : item.status === 'rejected' ? 'rejected' : 'open')}</td><td>${item.payload?.interview_at ? `<strong>${formatDate(item.payload.interview_at)}</strong><br>` : ''}${escapeHtml(item.public_message || '—')}</td><td>${formatDate(item.created_at)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state"><div class="empty-icon">◇</div><h3>Noch keine Anfragen</h3><p>Neue Supportanfragen und Bewerbungen erscheinen nach dem Absenden hier.</p></div>'}</article></div>
  </div></section>`;
}

export function bindAccount() {
  document.querySelectorAll('[data-auth-tab]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-auth-tab]').forEach(tab => tab.classList.toggle('active', tab === button));
    document.querySelector('#email-login-form').hidden = button.dataset.authTab !== 'login';
    document.querySelector('#email-signup-form').hidden = button.dataset.authTab !== 'signup';
  }));
  document.querySelector('#email-login-form')?.addEventListener('submit', async event => {
    event.preventDefault(); const data = formDataObject(event.currentTarget);
    try { await signInEmail(data.email, data.password); toast('Anmeldung erfolgreich', '', 'success'); location.href = '/konto'; } catch (error) { toast('Anmeldung fehlgeschlagen', error.message, 'error'); }
  });
  document.querySelector('#email-signup-form')?.addEventListener('submit', async event => {
    event.preventDefault(); const data = formDataObject(event.currentTarget);
    try { await signUpOwner(data.email, data.password); toast('Konto angelegt', 'Bestätige gegebenenfalls die E-Mail.', 'success'); } catch (error) { toast('Registrierung fehlgeschlagen', error.message, 'error'); }
  });
  document.querySelector('#discord-login')?.addEventListener('click', async () => { try { await signInDiscord('/konto'); } catch (error) { toast('Discord-Login nicht verfügbar', error.message, 'error'); } });
  document.querySelector('#logout')?.addEventListener('click', async () => { await signOut(); location.href = '/konto'; });
  document.querySelector('#link-roblox')?.addEventListener('click', () => {
    openModal({ title: 'Roblox-Konto verknüpfen', content: `<form id="roblox-link-form"><label class="field"><span>Roblox-Benutzername</span><input class="input" name="roblox_name" required></label><div class="auth-note" style="margin-top:15px">Nach dem Absenden erhältst du einen Code. Setze ihn vorübergehend in deine Roblox-Profilbeschreibung und bestätige die Verknüpfung zusätzlich über ein Discord-Ticket. Administration prüft vor; Teamleitung oder Owner gibt endgültig frei.</div><div class="form-actions"><button class="button button--primary" type="submit">Code erzeugen</button></div></form>`, onOpen(root, close) {
      root.querySelector('#roblox-link-form').addEventListener('submit', async event => {
        event.preventDefault(); const data = formDataObject(event.currentTarget); const auth = await currentAuth(); const code = reference('NXR-VERIFY');
        try {
          const button = document.querySelector('#link-roblox');
          const existingId = button?.dataset.linkId;
          const patch = { discord_name: auth.profile?.discord_name, roblox_name: data.roblox_name, verification_code: code, profile_code_confirmed: false, ticket_confirmed: false, admin_checked_by: null, approved_by: null, status: 'pending' };
          if (existingId) {
            const { updateRow } = await import('../lib/store.js');
            await updateRow('account_links', existingId, patch);
          } else {
            await insertRow('account_links', { user_id: auth.user.id, ...patch });
          }
          await updateProfile({ roblox_name: data.roblox_name });
          close();
          openModal({ title: 'Bestätigungscode', size: 'small', content: `<p class="muted">Setze diesen Code in deine Roblox-Profilbeschreibung:</p><div class="metric"><small>Code</small><strong>${escapeHtml(code)}</strong></div><p class="muted">Öffne danach ein Discord-Ticket und nenne den Code. Entferne ihn erst nach Freigabe.</p><a class="button button--primary button--wide" href="${CONFIG.supportTicketUrl}" target="_blank" rel="noopener">Discord-Ticket öffnen</a>` });
        } catch (error) { toast('Verknüpfung fehlgeschlagen', error.message, 'error'); }
      });
    }});
  });
  document.querySelector('#setup-mfa')?.addEventListener('click', async () => {
    try {
      const factor = await enrollMfa();
      openModal({ title: 'Authenticator-App einrichten', content: `<div style="display:grid;place-items:center"><img src="${factor.totp.qr_code}" alt="TOTP QR-Code" style="width:240px;background:white;padding:10px;border-radius:14px"><p class="muted">Scanne den QR-Code und gib anschließend den sechsstelligen Code ein.</p></div><form id="mfa-verify"><label class="field"><span>Authenticator-Code</span><input class="input" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label><div class="form-actions"><button class="button button--primary" type="submit">2FA aktivieren</button></div></form>`, onOpen(root, close) { root.querySelector('#mfa-verify').addEventListener('submit', async event => { event.preventDefault(); const code = formDataObject(event.currentTarget).code; try { await verifyMfaEnrollment(factor.id, code); close(); toast('2FA aktiviert', '', 'success'); location.reload(); } catch (error) { toast('Code ungültig', error.message, 'error'); } }); } });
    } catch (error) { toast('2FA-Einrichtung fehlgeschlagen', error.message, 'error'); }
  });
}
