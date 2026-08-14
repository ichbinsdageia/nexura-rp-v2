export const CONFIG = Object.freeze({
  siteName: 'Nexura RP',
  domain: 'https://nexura-rp.de',
  slogan: 'Erlebe Hamburg neu – in Nexura RP.',
  description: 'Realistische Einsätze, freie Fraktionen, aktive Community und eine Stadt voller Möglichkeiten.',
  ownerEmail: 'ichbinsdageia@gmail.com',
  discordUrl: 'https://discord.gg/tHzDpA7w3U',
  robloxUrl: 'https://www.roblox.com/share?v=v2&code=5ihdm3h6no7z43',
  supportTicketUrl: 'https://discord.gg/tHzDpA7w3U',
  sessionPingLabel: '🚨 | Session-Ping',
  timezone: 'Europe/Berlin',

  project: {
    game: 'Emergency Hamburg',
    language: 'Deutsch',
    public: true,
    minimumPlayerAge: null,
    minimumTeamAge: 13,
    playStyle: 'Anfängerfreundlich bis mittel-realistisch',
  },

  supabase: {
    url: 'https://xrukjxewcpqmdlvutgja.supabase.co',
    publishableKey: 'sb_publishable_lNGQSsk52stH_KwDe2Z5Jg_CslW7bII',
  },

  features: {
    demoMode: false,
    discordLogin: true,
    emailOwnerLogin: true,
    robloxAutoStatus: true,
    webhookAnnouncements: true,
    botDependentFeatures: true,
  },

  serverDefaults: {
    officialStatus: 'live',
    robloxReachable: true,
    players: 0,
    maxPlayers: 40,
    manualOverride: false,
    updatedAt: new Date().toISOString(),
  },
});

export const SESSION_STATUSES = [
  { value: 'live', label: 'Live', tone: 'done' },
  { value: 'planned', label: 'Geplant', tone: 'open' },
  { value: 'preparation', label: 'Vorbereitung', tone: 'new' },
  { value: 'pause', label: 'Pause', tone: 'open' },
  { value: 'maintenance', label: 'Wartung', tone: 'rejected' },
  { value: 'closed', label: 'Geschlossen', tone: 'rejected' },
];

export const PUBLIC_NAV = [
  ['/', 'Start'],
  ['/team', 'Team'],
  ['/gangs', 'Gangs'],
  ['/community', 'Community'],
  ['/regelwerk', 'Regelwerk'],
  ['/support', 'Support'],
];