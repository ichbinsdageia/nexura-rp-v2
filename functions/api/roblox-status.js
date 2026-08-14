import { json } from '../_lib/http.js';

export async function onRequestGet({ env }) {
  const universeId = String(env.ROBLOX_UNIVERSE_ID || '').trim();
  if (!universeId) {
    return json({ configured: false, reachable: null, players: null, maxPlayers: null, updatedAt: new Date().toISOString() });
  }
  try {
    const response = await fetch(`https://games.roblox.com/v1/games?universeIds=${encodeURIComponent(universeId)}`, {
      headers: { accept: 'application/json', 'user-agent': 'Nexura-RP-Website/2.0' },
      cf: { cacheTtl: 45, cacheEverything: true },
    });
    if (!response.ok) throw new Error(`Roblox API ${response.status}`);
    const payload = await response.json();
    const game = Array.isArray(payload?.data) ? payload.data[0] : null;
    if (!game) throw new Error('Spiel nicht gefunden');
    return json({
      configured: true,
      reachable: true,
      players: Number(game.playing || 0),
      maxPlayers: Number(game.maxPlayers || 0),
      visits: Number(game.visits || 0),
      name: game.name || 'Nexura RP',
      updatedAt: new Date().toISOString(),
    }, { headers: { 'cache-control': 'public, max-age=30' } });
  } catch (error) {
    return json({ configured: true, reachable: false, players: null, maxPlayers: null, error: String(error.message || error), updatedAt: new Date().toISOString() }, { status: 502 });
  }
}
