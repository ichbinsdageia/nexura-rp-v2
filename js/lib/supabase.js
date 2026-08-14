import { CONFIG } from '../config.js';

let clientPromise;

export function isSupabaseConfigured() {
  return CONFIG.supabase.url.startsWith('https://') && !CONFIG.supabase.publishableKey.includes('HIER_EINTRAGEN');
}

export async function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) => createClient(
      CONFIG.supabase.url,
      CONFIG.supabase.publishableKey,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
    ));
  }
  return clientPromise;
}
