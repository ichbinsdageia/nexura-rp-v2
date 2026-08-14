import { clean, decodeJwtPayload, json, readJson } from '../_lib/http.js';

const ALLOWED = new Set(['test_admin','junior_admin','admin','senior_admin','lead_admin','head_admin','teamlead','leadership','project_management','co_owner','owner']);

async function getUserAndProfile(request, env) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) throw new Error('UNAUTHORIZED');
  const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${token}` },
  });
  if (!userResponse.ok) throw new Error('UNAUTHORIZED');
  const user = await userResponse.json();
  const profileResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,website_role,is_approved,status,suspended_until`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, accept: 'application/json' },
  });
  if (!profileResponse.ok) throw new Error('PROFILE_LOOKUP_FAILED');
  const profile = (await profileResponse.json())[0];
  if (!profile?.is_approved || profile.status !== 'active' || (profile.suspended_until && new Date(profile.suspended_until) > new Date()) || !ALLOWED.has(profile.website_role)) throw new Error('FORBIDDEN');
  const claims = decodeJwtPayload(token);
  if (['test_admin','junior_admin','admin','senior_admin','lead_admin','head_admin','teamlead','leadership','project_management','co_owner','owner'].includes(profile.website_role) && claims?.aal !== 'aal2') throw new Error('MFA_REQUIRED');
  return { user, profile };
}

async function getSession(sessionId, env) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/sessions?id=eq.${encodeURIComponent(sessionId)}&select=*`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, accept: 'application/json' },
  });
  if (!response.ok) throw new Error('SESSION_LOOKUP_FAILED');
  const session = (await response.json())[0];
  if (!session || !session.approved || !session.published) throw new Error('SESSION_NOT_APPROVED');
  return session;
}

async function sendWebhook(url, body) {
  if (!url) return false;
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Discord ${response.status}`);
  return true;
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Serverseitige Supabase-Variablen fehlen.' }, { status: 503 });
    await getUserAndProfile(request, env);
    const body = await readJson(request, 8_000);
    const sessionId = clean(body.sessionId, 100);
    if (!sessionId) return json({ error: 'Session-ID fehlt.' }, { status: 400 });
    const session = await getSession(sessionId, env);
    const start = new Date(session.starts_at);
    const unix = Math.floor(start.getTime() / 1000);
    const pingRoleId = String(env.SESSION_PING_ROLE_ID || '').trim();
    const mention = pingRoleId ? `<@&${pingRoleId}>` : '';
    const allowedMentions = pingRoleId ? { roles: [pingRoleId], parse: [] } : { parse: [] };
    const gameUrl = String(env.PUBLIC_ROBLOX_URL || 'https://www.roblox.com/share?v=v2&code=5ihdm3h6no7z43');
    const title = clean(session.title, 200);
    const note = clean(session.note, 1500);
    const shortBody = {
      content: mention,
      username: 'Nexura Sessions',
      embeds: [{ title: `🚨 ${title}`, description: `Nächste Nexura-RP-Session: <t:${unix}:F> · <t:${unix}:R>`, color: 0xff2d95, url: gameUrl }],
      allowed_mentions: allowedMentions,
    };
    const detailedBody = {
      content: mention,
      username: 'Nexura Sessions',
      embeds: [{
        title: `Nexura RP · ${title}`,
        description: note || 'Weitere Informationen folgen.',
        color: 0x8b5cf6,
        image: { url: session.banner_url || `${String(env.PUBLIC_SITE_URL || 'https://nexura-rp.de').replace(/\/$/, '')}/assets/session-banner.svg` },
        fields: [
          { name: 'Start', value: `<t:${unix}:F>`, inline: true },
          { name: 'Countdown', value: `<t:${unix}:R>`, inline: true },
          { name: 'Status', value: clean(session.status, 40) || 'planned', inline: true },
          { name: 'Roblox', value: `[Spiel öffnen](${gameUrl})` },
        ],
        footer: { text: 'Nexura RP · Erlebe Hamburg neu' },
        timestamp: new Date().toISOString(),
      }],
      allowed_mentions: allowedMentions,
    };
    const [shortSent, detailedSent] = await Promise.all([
      sendWebhook(env.DISCORD_WEBHOOK_ANNOUNCEMENTS, shortBody),
      sendWebhook(env.DISCORD_WEBHOOK_SESSIONS, detailedBody),
    ]);
    if (!shortSent && !detailedSent) return json({ error: 'Keine Discord-Webhooks konfiguriert.' }, { status: 503 });
    return json({ ok: true, shortSent, detailedSent });
  } catch (error) {
    const mapping = { UNAUTHORIZED: 401, FORBIDDEN: 403, MFA_REQUIRED: 403, SESSION_NOT_APPROVED: 409 };
    const messages = { UNAUTHORIZED: 'Nicht angemeldet.', FORBIDDEN: 'Keine Berechtigung.', MFA_REQUIRED: 'Für diese Aktion ist 2FA erforderlich.', SESSION_NOT_APPROVED: 'Die Session ist nicht freigegeben.' };
    return json({ error: messages[error.message] || 'Discord-Ankündigung fehlgeschlagen.' }, { status: mapping[error.message] || 500 });
  }
}
