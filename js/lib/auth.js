import { CONFIG } from '../config.js';
import { getSupabase, isSupabaseConfigured } from './supabase.js';
import { demoStore } from './store.js';

const DEMO_PROFILE_KEY = 'nexura-demo-profile';

export async function currentAuth() {
  if (!isSupabaseConfigured()) {
    const saved = localStorage.getItem(DEMO_PROFILE_KEY);
    const profile = saved ? JSON.parse(saved) : null;

    return {
      session: profile
        ? { user: { id: profile.id, email: profile.email } }
        : null,
      user: profile
        ? { id: profile.id, email: profile.email }
        : null,
      profile,
      demo: true,
    };
  }

  const supabase = await getSupabase();

  let {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.warn('Session konnte nicht gelesen werden:', sessionError);
  }

  if (!session) {
    const {
      data: refreshed,
      error: refreshError,
    } = await supabase.auth.refreshSession();

    if (!refreshError) {
      session = refreshed.session;
    }
  }

  if (!session?.user) {
    return {
      session: null,
      user: null,
      profile: null,
      demo: false,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileError) {
    console.warn('Profil konnte nicht geladen werden:', profileError);
  }

  return {
    session,
    user: session.user,
    profile: profile ?? null,
    demo: false,
  };
}

export async function signInEmail(email, password) {
  if (!isSupabaseConfigured()) {
    if (email.toLowerCase() !== CONFIG.ownerEmail.toLowerCase()) throw new Error('Im Demo-Modus ist nur die hinterlegte Owner-E-Mail freigeschaltet.');
    const profile = { id: 'demo-owner', email, discord_name: 'vibevisionde', roblox_name: 'Idk765433454', website_role: 'owner', is_approved: true, status: 'active' };
    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
    return { user: { id: profile.id, email }, profile };
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpOwner(email, password) {
  if (!isSupabaseConfigured()) throw new Error('Supabase ist noch nicht eingerichtet.');
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/konto` } });
  if (error) throw error;
  return data;
}

export async function signInDiscord(next = '/konto') {
  if (!isSupabaseConfigured()) throw new Error('Discord-Login wird aktiv, sobald Supabase eingerichtet ist.');
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: `${location.origin}${next}`, scopes: 'identify email' } });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!isSupabaseConfigured()) { localStorage.removeItem(DEMO_PROFILE_KEY); return; }
  const supabase = await getSupabase();
  await supabase.auth.signOut();
}

export async function updateProfile(patch) {
  const auth = await currentAuth();
  if (!auth.user) throw new Error('Nicht angemeldet.');
  if (!isSupabaseConfigured()) {
    const profile = { ...auth.profile, ...patch };
    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', auth.user.id).select().single();
  if (error) throw error;
  return data;
}

export async function getAal() {
  if (!isSupabaseConfigured()) return { currentLevel: 'aal2', nextLevel: 'aal2' };
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data;
}

export async function listMfaFactors() {
  if (!isSupabaseConfigured()) return { totp: [] };
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data;
}

export async function enrollMfa() {
  if (!isSupabaseConfigured()) throw new Error('MFA benötigt Supabase.');
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Nexura ${new Date().toLocaleDateString('de-DE')}` });
  if (error) throw error;
  return data;
}

export async function verifyMfaEnrollment(factorId, code) {
  const supabase = await getSupabase();
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) throw challenge.error;
  const verified = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
  if (verified.error) throw verified.error;
  return verified.data;
}

export async function challengeMfa(code) {
  const factors = await listMfaFactors();
  const factor = factors.totp?.[0];
  if (!factor) throw new Error('Kein Authenticator eingerichtet.');
  return verifyMfaEnrollment(factor.id, code);
}

export function demoLoginAs(roleKey = 'owner') {
  const profile = { id: `demo-${roleKey}`, email: CONFIG.ownerEmail, discord_name: roleKey === 'owner' ? 'vibevisionde' : `Demo ${roleKey}`, roblox_name: roleKey === 'owner' ? 'Idk765433454' : 'DemoRoblox', website_role: roleKey, is_approved: true, status: 'active' };
  localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}
