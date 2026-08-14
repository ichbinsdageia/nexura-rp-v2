# 03 – Discord OAuth und Webhooks ohne Bot

## Discord-Anwendung für Login

Es wird nur eine Discord-Anwendung benötigt. Ein Bot muss nicht erstellt oder eingeladen werden.

1. Im Discord Developer Portal eine Anwendung `Nexura RP Website` erstellen.
2. Unter OAuth2 die Supabase-Callback-URL eintragen:

```text
https://DEIN-PROJEKT.supabase.co/auth/v1/callback
```

3. Client ID und Client Secret kopieren.
4. In Supabase unter Authentication → Providers → Discord eintragen und aktivieren.
5. In Supabase unter URL Configuration setzen:

```text
Site URL: https://nexura-rp.de
Additional Redirect URLs:
https://nexura-rp-v2.pages.dev/**
https://nexura-rp.de/**
```

Die Website fordert `identify email` an. Nach dem ersten Login besitzt der Nutzer zunächst nur ein normales, nicht freigegebenes Profil.

## Teamfreigabe

Eine Discord-Rolle wird ohne Bot nicht automatisch synchronisiert. Der Owner bestätigt die Website-Rolle manuell in Supabase beziehungsweise später im Owner-Bereich. Eine Discord-Teamrolle allein reicht nicht aus.

## Webhooks

Erstelle bei Bedarf drei Discord-Webhooks:

- Eingangsmeldungen
- `#ankündigungen`
- `#session-ankündigungen`

Speichere die URLs in Cloudflare Pages unter Settings → Variables and Secrets:

```text
DISCORD_INTAKE_WEBHOOK
DISCORD_WEBHOOK_ANNOUNCEMENTS
DISCORD_WEBHOOK_SESSIONS
```

Zusätzlich:

```text
SESSION_PING_ROLE_ID
PUBLIC_SITE_URL=https://nexura-rp.de
PUBLIC_ROBLOX_URL=https://www.roblox.com/share?v=v2&code=5ihdm3h6no7z43
```

Webhook-URLs gehören nie in GitHub oder Client-JavaScript. Die Function sendet nur eine knappe Eingangsmeldung; sensible Anfragetexte bleiben im geschützten Portal.

## Was ohne Bot nicht möglich ist

- automatisch private Ticketkanäle erstellen
- Nutzern automatisch DMs schicken
- Discord-Rollenentzug sofort erkennen
- Rollen automatisch auf Website-Rechte übertragen
- Bewerbungstermine per Discord-DM erinnern

Diese Stellen sind im Datenmodell vorbereitet, werden zum Start aber manuell bearbeitet.
