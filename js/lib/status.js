import { getSettings } from './store.js';
import { formatRelative } from './utils.js';

export async function loadServerStatus() {
  let manual;
  try { manual = await getSettings(); } catch { manual = {}; }
  let automatic = null;
  try {
    const response = await fetch('/api/roblox-status', { headers: { accept: 'application/json' } });
    if (response.ok) automatic = await response.json();
  } catch {}
  const manualOverride = Boolean(manual.manual_override);
  return {
    officialStatus: manual.official_status || 'closed',
    robloxReachable: manualOverride ? Boolean(manual.roblox_reachable) : (automatic?.reachable ?? Boolean(manual.roblox_reachable)),
    players: manualOverride ? Number(manual.players || 0) : Number(automatic?.players ?? manual.players ?? 0),
    maxPlayers: Number(automatic?.maxPlayers ?? manual.max_players ?? 40),
    serverCode: manual.server_code || 'NEXURA',
    updatedAt: automatic?.updatedAt || manual.updated_at || new Date().toISOString(),
    source: manualOverride ? 'manual' : (automatic?.configured ? 'automatic' : 'manual'),
  };
}

export function statusPresentation(status) {
  const labels = { live: 'Offizielle Session live', planned: 'Session geplant', preparation: 'Session in Vorbereitung', pause: 'Session pausiert', maintenance: 'Wartung', closed: 'Aktuell geschlossen' };
  const active = status.officialStatus === 'live';
  const planned = ['planned', 'preparation', 'pause'].includes(status.officialStatus);
  return {
    label: labels[status.officialStatus] || 'Status unbekannt',
    dotClass: active ? '' : planned ? 'status-dot--planned' : 'status-dot--offline',
    tone: active ? 'done' : planned ? 'open' : 'rejected',
    updated: `Aktualisiert ${formatRelative(status.updatedAt)}`,
  };
}
