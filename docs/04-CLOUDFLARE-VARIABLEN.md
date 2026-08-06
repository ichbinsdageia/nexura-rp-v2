# 04 – Cloudflare-Variablen und Roblox-Status

Öffne im neuen Pages-Projekt:

```text
Settings → Variables and Secrets
```

## Supabase für serverseitige Functions

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   [Secret]
```

Der Service Role Key darf ausschließlich als Cloudflare-Secret gespeichert werden.

## Roblox

```text
ROBLOX_UNIVERSE_ID
```

Die Function `/api/roblox-status` fragt damit Spielerzahl, maximale Spielerzahl und Erreichbarkeit ab. Solange die Universe-ID fehlt, zeigt die Website die manuell hinterlegten Werte an und behauptet keine automatische Verbindung.

## Discord

```text
DISCORD_INTAKE_WEBHOOK       [Secret]
DISCORD_WEBHOOK_ANNOUNCEMENTS [Secret]
DISCORD_WEBHOOK_SESSIONS      [Secret]
SESSION_PING_ROLE_ID
```

## Optional: Cloudflare Turnstile

```text
TURNSTILE_SECRET_KEY [Secret]
```

Die Intake-Function unterstützt eine Turnstile-Prüfung. Das sichtbare Widget muss erst ergänzt werden, wenn der Secret-Key gesetzt wird; andernfalls darf der Key nicht aktiviert werden, da Formulare sonst abgewiesen werden.

Nach Änderungen an Variablen ein neues Deployment starten.
