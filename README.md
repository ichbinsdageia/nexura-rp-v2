# Nexura RP v2 – Cloudflare + Supabase

Neu aufgebautes Website- und Community-Portal für **Nexura RP** im futuristischen Neon-Stil.

## Öffentliche Website

- Startseite mit eigenem Logo, Discord- und Roblox-Link
- offizieller Sessionstatus, Spielerzahl, letzte Aktualisierung und Servercode
- sechs freie Bereiche: Polizei, Feuerwehr, Rettungsdienst, Zivilisten, Bus und ADAC
- News, FAQ, Teamseite, offene Rollen und rollenbezogene Bewerbungsbuttons
- ausführliches, eigenständig formuliertes Notruf-Hamburg-/Emergency-Hamburg-RP-Regelwerk
- Gang-Bewerbung und Veröffentlichung bestätigter Gangs
- Supportcenter mit Kategorien, Referenznummern, Bilduploads und Video-/Beweislinks
- Community-Portal für Ideen, Feedback, Partnerschaften, Creator-Anfragen, RP-Spieler-Vorschläge und Supportbewertungen
- öffentliche Ideenübersicht mit Status

## Konten und Sicherheit

- Owner-Login mit E-Mail und Passwort
- Spieler- und Teamlogin über Discord OAuth
- manuelle Roblox-Verknüpfung über Profilcode plus Discord-Ticket
- Owner-Freigabe der Website-Rolle
- TOTP-2FA für Owner, Teamleitung und Administration
- Supabase Row Level Security
- nur für den Owner sichtbarer Audit-Log
- ausschließlich der Owner darf Akten und zentrale Datensätze löschen

## Internes Teamportal

- rollenabhängige Navigation und Rechte
- alle Formulareingänge mit Status, Priorität und internen Notizen
- Spielerakten mit Punkten, Verfallsfristen, Sanktionen und Beweisen
- Teamakten mit Probezeit, Bewertungen, Schulungen, Verwarnungen und Laufbahn
- Beförderungs-, Abwesenheits- und Austrittsanträge
- Sessionentwürfe, Freigaben, Countdown, Banner und Discord-Webhooks
- Gangfreigaben
- News und öffentliche Ideen
- Projekte und Verantwortlichkeiten
- kumulative interne Teamregeln mit Versionen und Bestätigungen
- Stellenplan und Bewerbungsöffnungen
- JSON-Export und Demo-Sicherung

## Kein Bot zum Start

Die Website setzt **keinen Nexura-Bot** voraus. Funktionieren können:

- Discord-Login über eine Discord-Anwendung
- Discord-Benachrichtigungen über Webhooks

Ohne Bot funktionieren noch nicht automatisch:

- private Discord-Ticketkanäle erzeugen
- Discord-DMs verschicken
- Discord-Rollen live erkennen oder synchronisieren
- Ticketstatus zwischen Discord und Website bidirektional abgleichen

## Wichtige Dokumente

- `START-HIER.md` – empfohlene Reihenfolge
- `docs/00-NEUES-REPOSITORY.md` – Repository ohne verschachtelten Ordner
- `PROJEKT-STATUS.md` – fertig, konfigurationsabhängig und botabhängig
- `docs/SECURITY.md` – Sicherheitsgrenzen vor dem Echtbetrieb

## Schnellstart

1. `START-HIER.md` lesen.
2. Neues Repository `nexura-rp-v2` erstellen.
3. Projektinhalt hochladen.
4. Neues Cloudflare-Pages-Projekt verbinden.
5. Supabase mit `supabase/setup.sql` einrichten.
6. Discord OAuth und Cloudflare-Secrets konfigurieren.
7. Erst danach die Domain vom alten auf das neue Pages-Projekt verschieben.

## Demo-Modus

Solange in `js/config.js` keine echten Supabase-Werte stehen:

- öffentliche Seiten funktionieren vollständig
- Formulare und Portaländerungen werden nur in `localStorage` gespeichert
- im Portal kann eine Demo-Rolle gewählt werden
- es gibt keinen echten Zugriffsschutz und keine gemeinsame Datenbank

Der Demo-Modus ist für Gestaltung und Funktionstests gedacht, nicht für echte Moderationsdaten.

## Projektstruktur

```text
assets/                  Design, Logo, Favicon, Sessionbanner
functions/api/           Cloudflare Pages Functions
js/components/           Layout und UI-Komponenten
js/data/                 Rollen, Regeln, Tests und öffentliche Inhalte
js/lib/                  Auth, Supabase, Datenzugriff, Uploads, Rechte
js/views/                öffentliche Seiten und Teamportal
supabase/setup.sql       Datenbank, RLS, Storage und Seeds
docs/                    Einrichtungs- und Sicherheitsanleitungen
index.html               Einstiegspunkt der Single-Page-Website
_redirects               SPA-Fallback
_routes.json             Functions nur unter /api/*
_headers                  Sicherheitsheader
```
