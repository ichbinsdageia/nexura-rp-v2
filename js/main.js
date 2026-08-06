import { bindRouter, renderRoute } from './router.js';
import { finishOAuthCallback } from './lib/supabase.js';

try {
  await finishOAuthCallback();
} catch (error) {
  console.error('Discord-OAuth-Callback fehlgeschlagen:', error);
}

bindRouter();
await renderRoute();
