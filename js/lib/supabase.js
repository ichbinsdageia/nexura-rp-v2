import { CONFIG } from '../config.js';

let clientPromise;

export function isSupabaseConfigured() {
  return (
    CONFIG.supabase.url.startsWith('https://')
    && !CONFIG.supabase.publishableKey.includes('HIER_EINTRAGEN')
  );
}

export async function getSupabase() {
  if (!isSupabaseConfigured()) return null;

  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(({ createClient }) => createClient(
        CONFIG.supabase.url,
        CONFIG.supabase.publishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            flowType: 'pkce',
          },
        },
      ));
  }

  return clientPromise;
}

export async function finishOAuthCallback() {
  if (!isSupabaseConfigured()) return false;

  const supabase = await getSupabase();
  const params = new URLSearchParams(location.search);
  const code = params.get('code');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    history.replaceState({}, document.title, location.pathname);
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;

  return Boolean(session);
}
