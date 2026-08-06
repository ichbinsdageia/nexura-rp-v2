import { ROLE_GROUPS, PUBLIC_TEAM, roleByKey } from '../data/roles.js';
import { listRows } from '../lib/store.js';
import { escapeHtml } from '../lib/utils.js';
import { pageHero } from '../components/layout.js';

export async function renderTeam() {
  const [members, positions] = await Promise.all([
    listRows('team_members').catch(() => PUBLIC_TEAM),
    listRows('team_positions').catch(() => []),
  ]);
  const visibleMembers = members.filter(member => member.public !== false);
  const currentMembers = visibleMembers.filter(member => (member.public_status || member.status) !== 'former');
  const formerMembers = visibleMembers.filter(member => (member.public_status || member.status) === 'former' && (member.former_public || member.public));
  return `${pageHero('Team', 'Menschen hinter <span class="gradient-text">Nexura RP.</span>', 'Discord-Name, Roblox-Name und Rolle werden öffentlich angezeigt. Unbesetzte Rollen sind direkt als gesucht markiert.')}
  <section class="section section--tight"><div class="shell">
    <div class="card-grid">${currentMembers.map(member => `<article class="card"><div class="owner-avatar" style="width:64px;height:64px;border-radius:18px">${escapeHtml((member.discordName || member.discord_name || '?').slice(0,2).toUpperCase())}</div><span class="tag" style="margin-top:20px">${escapeHtml(member.role || member.role_label || roleByKey(member.roleKey || member.role_key).label || 'Team')}</span><h3>${escapeHtml(member.discordName || member.discord_name)}</h3><p>Roblox: ${escapeHtml(member.robloxName || member.roblox_name || 'Nicht angegeben')}</p><span class="card-badge">${(member.public_status || member.status) === 'away' ? 'Abwesend' : (member.public_status || member.status) === 'leave' ? 'Beurlaubt' : 'Aktiv'}</span></article>`).join('')}</div>
  </div></section>
  <section class="section section--surface"><div class="shell">
    <div class="section-heading"><div><span class="kicker">Stellenplan</span><h2>Dein Einstieg ins <span class="gradient-text">Team.</span></h2></div><p>Der normale Weg beginnt als Support in Ausbildung. Höhere Direkteinstiege sind seltene, begründete Ausnahmen.</p></div>
    <div class="role-list">${ROLE_GROUPS.map(group => `<div class="card" style="padding:18px"><h3 style="margin:0 0 13px">${escapeHtml(group.name)}</h3><div class="role-list">${group.roles.map(role => {
      const position = positions.find(item => item.role_key === role.key || item.id === role.key);
      const member = currentMembers.find(item => (item.roleKey || item.role_key) === role.key || (item.role || item.role_label) === role.label);
      const open = position ? position.open : !member && !role.filled;
      return `<div class="role-row"><div><strong>${escapeHtml(role.label)}</strong><small>${member ? `${escapeHtml(member.discordName || member.discord_name)} · ${escapeHtml(member.robloxName || member.roblox_name || '')}` : 'Unbesetzt'}</small></div>${open ? `<a class="role-status role-status--open" href="/bewerbung?role=${encodeURIComponent(role.key)}" data-link>Für diese Rolle bewerben</a>` : `<span class="role-status ${(member?.public_status || member?.status) === 'leave' || (member?.public_status || member?.status) === 'away' ? 'role-status--away' : 'role-status--filled'}">${(member?.public_status || member?.status) === 'leave' ? 'Beurlaubt' : (member?.public_status || member?.status) === 'away' ? 'Abwesend' : 'Besetzt'}</span>`}</div>`;
    }).join('')}</div></div>`).join('')}</div>
  </div></section>

  ${formerMembers.length ? `<section class="section section--surface"><div class="shell"><div class="section-heading"><div><span class="kicker">Ehemaliges Team</span><h2>Menschen, die Nexura <span class="gradient-text">mitgeprägt haben.</span></h2></div><p>Dieser Bereich enthält ausschließlich Personen, die der Owner bewusst öffentlich ausgewählt hat.</p></div><div class="card-grid">${formerMembers.map(member => `<article class="card"><span class="tag">Ehemalig · ${escapeHtml(member.role || member.role_label || roleByKey(member.roleKey || member.role_key).label)}</span><h3>${escapeHtml(member.discordName || member.discord_name)}</h3><p>Roblox: ${escapeHtml(member.robloxName || member.roblox_name || 'Nicht angegeben')}</p>${member.joined_at || member.left_at ? `<small class="muted">${member.joined_at ? new Date(member.joined_at).toLocaleDateString('de-DE') : '—'} – ${member.left_at ? new Date(member.left_at).toLocaleDateString('de-DE') : '—'}</small>` : ''}${member.tribute ? `<p style="margin-top:14px">${escapeHtml(member.tribute)}</p>` : ''}</article>`).join('')}</div></div></section>` : ''}
  <section class="section"><div class="shell"><div class="cta-panel"><div><span class="kicker">Team-Bewerbung</span><h2>Starte als <span class="gradient-text">Test-Supporter.</span></h2><p>Mindestalter 13 Jahre, vollständige Bewerbung und ein Mini-Regeltest mit fünf Fragen. Mindestens drei Antworten müssen richtig sein.</p><a class="button button--primary" href="/bewerbung" data-link>Jetzt bewerben</a></div></div></div></section>`;
}

export function bindTeam() {}
