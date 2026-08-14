import { CONFIG } from '../config.js';
import { FACTIONS, FAQ } from '../data/content.js';
import { ROLE_GROUPS } from '../data/roles.js';
import { icon } from '../lib/icons.js';
import { listRows } from '../lib/store.js';
import { loadServerStatus, statusPresentation } from '../lib/status.js';
import { escapeHtml, formatDate, formatRelative } from '../lib/utils.js';
import { badge } from '../components/ui.js';

export async function renderHome() {
  const [status, sessions, news, positions, gangs] = await Promise.all([
    loadServerStatus(),
    listRows('sessions', { limit: 3 }).catch(() => []),
    listRows('news', { filter: row => row.published !== false, limit: 3 }).catch(() => []),
    listRows('team_positions').catch(() => []),
    listRows('gangs', { filter: row => row.status === 'approved' || row.published }).catch(() => []),
  ]);
  const present = statusPresentation(status);
  const openRoles = positions.filter(position => position.open).slice(0, 8);
  const nextSession = sessions.find(session => new Date(session.starts_at) > new Date()) || sessions[0];

  return `<section class="hero">
    <div class="shell hero-grid">
      <div class="hero-copy">
        <div class="hero-eyebrow"><span></span> Deutscher Emergency-Hamburg-RP-Server</div>
        <h1>Erlebe Hamburg neu – <span class="gradient-text">in Nexura RP.</span></h1>
        <p class="hero-lead">${escapeHtml(CONFIG.description)}</p>
        <div class="hero-actions">
          <a class="button button--primary" href="${CONFIG.discordUrl}" target="_blank" rel="noopener">${icon('discord')}Discord beitreten${icon('arrow')}</a>
          <a class="button button--secondary" href="${CONFIG.robloxUrl}" target="_blank" rel="noopener">${icon('game')}Roblox spielen</a>
        </div>
        <div class="hero-trust"><div><strong>6</strong><span>freie Fraktionen</span></div><div><strong>DE</strong><span>Hauptsprache</span></div><div><strong>0 €</strong><span>Community-Zugang</span></div></div>
      </div>
      <div class="hero-visual">
        <div class="logo-stage"><div class="orbit"></div><img src="/assets/nexura-logo.jpg" alt="Neon-Logo von Nexura RP"></div>
        <div class="floating-card floating-card--top"><small>Offizieller Status</small><strong>${escapeHtml(present.label)}</strong></div>
        <div class="floating-card floating-card--bottom"><small>Nächste Session</small><strong>${nextSession ? escapeHtml(nextSession.title) : 'Wird angekündigt'}</strong></div>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="shell status-board">
      <article class="server-card">
        <div class="server-card__top"><span class="status-pill"><span class="status-dot ${present.dotClass}"></span>${escapeHtml(present.label)}</span><span class="muted">${escapeHtml(present.updated)}</span></div>
        <h3>${status.players} / ${status.maxPlayers}</h3>
        <p>Roblox-Spielerzahl und Erreichbarkeit können automatisch geladen werden. Der offizielle Sessionstatus wird vom Team kontrolliert und kann bei Ausfällen manuell übersteuert werden.</p>
        <div class="server-metrics"><div class="metric"><small>Roblox</small><strong>${status.robloxReachable ? 'Erreichbar' : 'Nicht erreichbar'}</strong></div><div class="metric"><small>Quelle</small><strong>${status.source === 'automatic' ? 'Automatisch' : 'Manuell'}</strong></div><div class="metric"><small>Servercode</small><strong>${escapeHtml(status.serverCode)}</strong></div></div>
        <div class="hero-actions"><a class="button button--primary button--compact" href="${CONFIG.robloxUrl}" target="_blank" rel="noopener">Jetzt spielen</a><button class="button button--ghost button--compact" type="button" data-copy-server-code="${escapeHtml(status.serverCode)}">Code kopieren</button></div>
      </article>
      <div class="session-stack">
        ${(sessions.length ? sessions : [{ title: 'Noch keine Session geplant', status: 'closed', starts_at: null, note: 'Sobald eine Session freigegeben wurde, erscheint sie hier.' }]).map(session => `<article class="session-card"><div class="session-card__head"><div><span class="kicker">Session</span><h3>${escapeHtml(session.title)}</h3></div>${badge(session.status === 'planned' ? 'Geplant' : session.status === 'live' ? 'Live' : 'Info', session.status === 'live' ? 'done' : 'open')}</div><p>${session.starts_at ? formatDate(session.starts_at) : 'Termin folgt'} · ${escapeHtml(session.note || 'Weitere Informationen folgen.')}</p>${session.starts_at ? `<div class="countdown" style="width:fit-content;margin-top:14px">${formatRelative(session.starts_at)}</div>` : ''}</article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section section--surface" id="community"><div class="shell">
    <div class="section-heading"><div><span class="kicker">Warum Nexura</span><h2>Anfängerfreundlich. Strukturiert. <span class="gradient-text">Trotzdem echtes RP.</span></h2></div><p>Kein überkompliziertes Hardcore-Regelwerk, aber klare Grenzen gegen Trolling, FailRP und unfairen Spielstil.</p></div>
    <div class="card-grid">
      <article class="card"><div class="card-icon">${icon('shield')}</div><h3>Nachvollziehbare Moderation</h3><p>Verstöße werden dokumentiert. Punkte liefern einen Vorschlag; die endgültige Entscheidung bleibt beim zuständigen Team.</p><span class="card-badge">Einspruch möglich</span></article>
      <article class="card"><div class="card-icon">${icon('users')}</div><h3>Freie Fraktionen</h3><p>Polizei, Feuerwehr, Rettungsdienst, Bus, ADAC und Zivilisten sind grundsätzlich ohne Fraktionsbewerbung zugänglich.</p><span class="card-badge">Direkt losspielen</span></article>
      <article class="card"><div class="card-icon">${icon('dashboard')}</div><h3>Eigenes Community-Portal</h3><p>Sessions, Bewerbungen, Gangs, Support, Akten und Teamorganisation werden an einem Ort zusammengeführt.</p><span class="card-badge">Transparent aufgebaut</span></article>
    </div>
  </div></section>

  <section class="section" id="fraktionen"><div class="shell">
    <div class="section-heading"><div><span class="kicker">Fraktionen</span><h2>Deine Rolle in <span class="gradient-text">Hamburg.</span></h2></div><p>Alle Standardfraktionen sind frei. Entscheidend sind Regeln, Teamplay und eine nachvollziehbare Rolle.</p></div>
    <div class="faction-grid">${FACTIONS.map(faction => `<article class="faction-card"><div class="faction-symbol">${faction.icon}</div><div><h3>${escapeHtml(faction.name)}</h3><p>${escapeHtml(faction.text)}</p></div></article>`).join('')}</div>
  </div></section>

  <section class="section section--surface" id="news"><div class="shell">
    <div class="section-heading"><div><span class="kicker">News & Updates</span><h2>Was bei Nexura <span class="gradient-text">passiert.</span></h2></div><p>Updates, Events, Team-News, Fraktions-News und Ankündigungen können später direkt im Owner-Bereich veröffentlicht werden.</p></div>
    <div class="news-grid">${news.map(item => `<article class="news-card"><span class="tag">${escapeHtml(item.category || 'Update')}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.excerpt || '')}</p><small class="muted" style="margin-top:15px">${formatDate(item.published_at || item.created_at, { withTime: false })}</small></article>`).join('')}</div>
  </div></section>

  <section class="section" id="team"><div class="shell">
    <div class="section-heading"><div><span class="kicker">Nexura Team</span><h2>Klare Rollen. <span class="gradient-text">Offene Stellen.</span></h2></div><p>Fast alle Rollen sind zum Start gesucht. Etwa 90 % angenommener Bewerber beginnen als Support in Ausbildung.</p></div>
    <div class="team-preview"><article class="owner-card"><div class="owner-avatar">VV</div><span class="tag">Owner</span><h3>vibevisionde</h3><p>Roblox: Idk765433454</p></article><div class="role-list">${(openRoles.length ? openRoles : ROLE_GROUPS.flatMap(group => group.roles.filter(role => !role.filled).map(role => ({ label: role.label, group_name: group.name, role_key: role.key })))).slice(0, 8).map(role => `<div class="role-row"><div><strong>${escapeHtml(role.label)}</strong><small>${escapeHtml(role.group_name || '')}</small></div><a class="role-status role-status--open" href="/bewerbung?role=${encodeURIComponent(role.role_key || '')}" data-link>Gesucht</a></div>`).join('')}<a class="button button--secondary" href="/team" data-link>Alle Teamrollen ansehen${icon('arrow')}</a></div></div>
  </div></section>

  <section class="section section--surface" id="gangs"><div class="shell">
    <div class="section-heading"><div><span class="kicker">Gangs</span><h2>Eigene Identität. <span class="gradient-text">Geprüfter Auftritt.</span></h2></div><p>Gangs reichen ihre vollständigen Angaben ein. Nach Teamprüfung werden bestätigte Gruppen öffentlich angezeigt.</p></div>
    ${gangs.length ? `<div class="card-grid">${gangs.slice(0,3).map(gang => `<article class="card"><span class="tag">Bestätigt</span><h3>${escapeHtml(gang.name)}</h3><p>${escapeHtml(gang.description || '')}</p></article>`).join('')}</div>` : `<div class="empty-state"><div class="empty-icon">♠</div><h3>Noch keine bestätigten Gangs</h3><p>Sei eine der ersten Gruppen, die sich bei Nexura RP offiziell registriert und auf der Website vorgestellt wird.</p><a class="button button--primary" href="/gangs" data-link>Gang bewerben</a></div>`}
  </div></section>

  <section class="section" id="faq"><div class="shell">
    <div class="section-heading"><div><span class="kicker">FAQ</span><h2>Die wichtigsten <span class="gradient-text">Antworten.</span></h2></div></div>
    <div class="faq-list">${FAQ.map(([question, answer], i) => `<div class="faq-item" ${i === 0 ? 'open' : ''}><button type="button" data-faq><span>${escapeHtml(question)}</span><span>+</span></button><div class="faq-answer" ${i === 0 ? '' : 'hidden'}>${escapeHtml(answer)}</div></div>`).join('')}</div>
  </div></section>

  <section class="section"><div class="shell"><div class="cta-panel"><div><span class="kicker">Bereit für den Einsatz?</span><h2>Deine nächste Geschichte beginnt <span class="gradient-text">jetzt.</span></h2><p>Komm auf den Discord, lies das Regelwerk und öffne anschließend den Roblox-Server.</p><div class="hero-actions" style="justify-content:center"><a class="button button--primary" href="${CONFIG.discordUrl}" target="_blank" rel="noopener">Discord beitreten</a><a class="button button--secondary" href="${CONFIG.robloxUrl}" target="_blank" rel="noopener">Roblox öffnen</a></div></div></div></div></section>`;
}

export function bindHome() {
  document.querySelectorAll('[data-faq]').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const isOpen = item.hasAttribute('open');
    if (isOpen) { item.removeAttribute('open'); answer.hidden = true; }
    else { item.setAttribute('open', ''); answer.hidden = false; }
  }));
}
