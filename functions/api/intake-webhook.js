import { clean, json, readJson } from '../_lib/http.js';

async function verifyTurnstile(token, ip, secret) {
  if (!secret) return true;
  if (!token) return false;
  const body = new FormData();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const data = await response.json();
  return Boolean(data.success);
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await readJson(request, 12_000);
    const verified = await verifyTurnstile(data.turnstileToken, request.headers.get('CF-Connecting-IP'), env.TURNSTILE_SECRET_KEY);
    if (!verified) return json({ error: 'Sicherheitsprüfung fehlgeschlagen.' }, { status: 403 });
    const reference = clean(data.reference, 80);
    const category = clean(data.category, 100);
    const subject = clean(data.subject, 180);
    const priority = clean(data.priority, 30) || 'normal';
    if (!reference || !category) return json({ error: 'Referenz und Kategorie fehlen.' }, { status: 400 });
    const webhook = String(env.DISCORD_INTAKE_WEBHOOK || '').trim();
    if (!webhook) return json({ ok: true, configured: false });
    const embed = {
      title: 'Neuer Website-Eingang',
      color: priority === 'urgent' ? 0xff2d95 : priority === 'high' ? 0x8b5cf6 : 0x159dff,
      fields: [
        { name: 'Referenz', value: reference, inline: true },
        { name: 'Kategorie', value: category, inline: true },
        { name: 'Priorität', value: priority, inline: true },
        { name: 'Betreff', value: subject || 'Ohne Betreff' },
      ],
      footer: { text: 'Nexura RP Website · Vollständige Inhalte nur im geschützten Portal' },
      timestamp: new Date().toISOString(),
    };
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'Nexura Website', embeds: [embed], allowed_mentions: { parse: [] } }),
    });
    if (!response.ok) return json({ error: 'Discord-Webhook hat die Nachricht abgelehnt.' }, { status: 502 });
    return json({ ok: true, configured: true });
  } catch (error) {
    const status = error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
    return json({ error: error.message === 'INVALID_JSON' ? 'Ungültige Anfrage.' : 'Anfrage konnte nicht verarbeitet werden.' }, { status });
  }
}
