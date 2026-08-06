import { CONFIG } from '../config.js';
import { NEWS_SEED } from '../data/content.js';
import { PUBLIC_TEAM, ROLE_GROUPS } from '../data/roles.js';
import { getSupabase, isSupabaseConfigured } from './supabase.js';
import { reference } from './utils.js';

const KEY = 'nexura-rp-v2-demo';

const initial = {
  settings: {
    official_status: CONFIG.serverDefaults.officialStatus,
    roblox_reachable: CONFIG.serverDefaults.robloxReachable,
    players: CONFIG.serverDefaults.players,
    max_players: CONFIG.serverDefaults.maxPlayers,
    manual_override: false,
    server_code: 'NEXURA',
    updated_at: new Date().toISOString(),
    team_applications_open: true,
  },
  news: NEWS_SEED,
  ideas: [
    { id: 'idea-demo-1', title: 'Mehr kleine Einsatzlagen', category: 'Sessions', status: 'planned', summary: 'Regelmäßige kurze Mini-Events zwischen den großen Community-Sessions.', author_name: 'Community', public: true, created_at: new Date(Date.now() - 43200000).toISOString() },
  ],
  projects: [
    { id: 'project-demo-1', title: 'Website & Teamportal v2', owner_name: 'vibevisionde', status: 'in_progress', priority: 'high', due_at: null, description: 'Cloudflare-, Supabase- und Discord-OAuth-Version von Nexura RP.', created_at: new Date().toISOString() },
  ],
  sessions: [
    { id: 's1', title: 'Nexura Community-Session', status: 'planned', starts_at: new Date(Date.now() + 3 * 86400000 + 19 * 3600000).toISOString(), note: 'Entspanntes Community-RP mit freien Fraktionen.', approved: true, published: true },
  ],
  profiles: [
    { id: 'demo-owner', email: CONFIG.ownerEmail, discord_name: 'vibevisionde', roblox_name: 'Idk765433454', website_role: 'owner', is_approved: true, status: 'active', suspended_until: null },
    { id: 'demo-player', email: 'spieler@example.invalid', discord_name: 'DemoSpieler', roblox_name: 'DemoSpieler', website_role: 'player', is_approved: false, status: 'pending', suspended_until: null },
  ],
  account_links: [
    { id: 'link-demo-1', user_id: 'demo-player', discord_name: 'DemoSpieler', roblox_name: 'DemoSpieler', verification_code: 'NXR-VERIFY-DEMO', profile_code_confirmed: true, ticket_confirmed: false, status: 'pending', created_at: new Date().toISOString() },
  ],
  gangs: [],
  team_members: PUBLIC_TEAM.map((m, index) => ({ id: `tm${index + 1}`, ...m, public: true })),
  team_positions: ROLE_GROUPS.flatMap(group => group.roles.map(role => ({ id: role.key, role_key: role.key, label: role.label, group_name: group.name, open: !role.filled, applications_open: !role.filled }))),
  submissions: [
    { id: 'sub-demo-1', reference: 'NXR-DEMO-001', type: 'idea', status: 'new', priority: 'normal', created_at: new Date(Date.now() - 7200000).toISOString(), payload: { title: 'Mehr geplante Mini-Events', message: 'Ein Vorschlag für regelmäßige kleine Einsatzlagen.' }, submitter_name: 'DemoUser' },
    { id: 'sub-demo-2', reference: 'NXR-DEMO-002', type: 'team_application', status: 'in_review', priority: 'high', created_at: new Date(Date.now() - 86400000).toISOString(), payload: { discord_name: 'Bewerber', roblox_name: 'Bewerber123', desired_role: 'Support in Ausbildung', test_score: 4 }, submitter_name: 'Bewerber' },
  ],
  player_records: [
    { id: 'pr1', roblox_name: 'DemoSpieler', discord_name: 'Demo#0001', points: 2, active_sanction: 'Verwarnung', updated_at: new Date().toISOString() },
  ],
  player_record_entries: [
    { id: 'pre1', record_id: 'pr1', category: 'Leichter Verstoß', points: 2, reason: 'Unrealistisches Fahren', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), created_at: new Date().toISOString(), created_by_name: 'Demo Moderator' },
  ],
  team_records: [
    { id: 'tr1', discord_name: 'vibevisionde', roblox_name: 'Idk765433454', role_key: 'owner', status: 'active', joined_at: new Date().toISOString(), rating: 5 },
  ],
  workflow_requests: [],
  internal_rules: [],
  audit_log: [
    { id: 'log1', action: 'demo.initialized', actor_name: 'System', target_type: 'project', target_id: 'nexura', created_at: new Date().toISOString(), details: { note: 'Demo-Daten wurden erstellt.' } },
  ],
  faq: [],
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadDemo() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (parsed && typeof parsed === 'object') return { ...clone(initial), ...parsed };
  } catch {}
  const seed = clone(initial);
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}
function saveDemo(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

export const demoStore = {
  get(table) { return clone(loadDemo()[table] ?? []); },
  set(table, value) { const data = loadDemo(); data[table] = clone(value); saveDemo(data); return clone(value); },
  insert(table, row) {
    const data = loadDemo();
    if (!Array.isArray(data[table])) data[table] = [];
    const created = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row };
    data[table].unshift(created); saveDemo(data); return clone(created);
  },
  update(table, id, patch) {
    const data = loadDemo();
    const list = Array.isArray(data[table]) ? data[table] : [];
    const index = list.findIndex(item => item.id === id);
    if (index < 0) throw new Error('Eintrag nicht gefunden.');
    list[index] = { ...list[index], ...patch, updated_at: new Date().toISOString() };
    saveDemo(data); return clone(list[index]);
  },
  remove(table, id) {
    const data = loadDemo();
    data[table] = (data[table] || []).filter(item => item.id !== id);
    saveDemo(data); return true;
  },
  settings(patch) {
    const data = loadDemo();
    if (patch) { data.settings = { ...data.settings, ...patch, updated_at: new Date().toISOString() }; saveDemo(data); }
    return clone(data.settings);
  },
  reset() { localStorage.removeItem(KEY); return loadDemo(); },
};

const orderColumns = {
  news: ['published_at', { ascending: false }],
  ideas: ['created_at', { ascending: false }],
  projects: ['created_at', { ascending: false }],
  sessions: ['starts_at', { ascending: true }],
  submissions: ['created_at', { ascending: false }],
  player_records: ['updated_at', { ascending: false }],
  team_records: ['updated_at', { ascending: false }],
  audit_log: ['created_at', { ascending: false }],
  profiles: ['created_at', { ascending: false }],
  account_links: ['created_at', { ascending: false }],
};

export async function listRows(table, options = {}) {
  if (!isSupabaseConfigured()) {
    let rows = demoStore.get(table);
    if (options.filter) rows = rows.filter(options.filter);
    if (options.limit) rows = rows.slice(0, options.limit);
    return rows;
  }
  const supabase = await getSupabase();
  let query = supabase.from(table).select(options.select || '*');
  if (options.eq) Object.entries(options.eq).forEach(([key, value]) => { query = query.eq(key, value); });
  const [column, direction] = orderColumns[table] || ['created_at', { ascending: false }];
  query = query.order(options.order || column, options.orderOptions || direction);
  if (options.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getRow(table, id) {
  if (!isSupabaseConfigured()) return demoStore.get(table).find(row => row.id === id) || null;
  const supabase = await getSupabase();
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertRow(table, row) {
  if (!isSupabaseConfigured()) return demoStore.insert(table, row);
  const supabase = await getSupabase();
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateRow(table, id, patch) {
  if (!isSupabaseConfigured()) return demoStore.update(table, id, patch);
  const supabase = await getSupabase();
  const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRow(table, id) {
  if (!isSupabaseConfigured()) return demoStore.remove(table, id);
  const supabase = await getSupabase();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getSettings() {
  if (!isSupabaseConfigured()) return demoStore.settings();
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}

export async function updateSettings(patch) {
  if (!isSupabaseConfigured()) return demoStore.settings(patch);
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('app_settings').update(patch).eq('id', 1).select().single();
  if (error) throw error;
  return data;
}

export async function createSubmission(type, payload, identity = {}, meta = {}) {
  const row = {
    reference: reference(type === 'team_application' ? 'BEW' : type === 'gang_application' ? 'GANG' : type === 'appeal' ? 'EIN' : 'NXR'),
    type,
    status: 'new',
    priority: 'normal',
    payload,
    submitter_name: identity.name || payload.discord_name || payload.roblox_name || payload.name || 'Gast',
    submitter_user_id: identity.userId || null,
    ...meta,
  };
  return insertRow('submissions', row);
}

export async function appendAudit(action, targetType, targetId, details = {}, actor = {}) {
  return insertRow('audit_log', {
    action,
    actor_id: actor.id || null,
    actor_name: actor.name || 'System',
    target_type: targetType,
    target_id: targetId,
    details,
  });
}
