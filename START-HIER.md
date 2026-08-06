# START HIER – Nexura RP v2

Dieses Paket ist **kein Render-/Express-Projekt**. Es ist für folgende Kombination gebaut:

- **GitHub** – Repository und Versionsverlauf
- **Cloudflare Pages** – Website und kleine API-Funktionen
- **Supabase** – Anmeldung, Datenbank, Rechte, 2FA und Bildspeicher
- **Discord OAuth/Webhooks** – Login und Benachrichtigungen, zunächst **ohne Nexura-Bot**

## 1. Neues GitHub-Repository

Erstelle ein neues, leeres Repository mit diesem Namen:

```text
nexura-rp-v2
```

Empfohlene Einstellungen:

- Public
- keine README automatisch erzeugen
- keine `.gitignore` automatisch erzeugen
- keine Lizenz automatisch erzeugen

Entpacke die ZIP-Datei. Öffne den entpackten Projektordner und lade **dessen Inhalt** hoch. Im Repository müssen direkt diese Einträge sichtbar sein:

```text
index.html
_redirects
_routes.json
_headers
assets/
js/
functions/
supabase/
docs/
README.md
```

Nicht richtig wäre:

```text
nexura-rp-v2/nexura-rp-v2/index.html
```

## 2. Neues Cloudflare-Pages-Projekt

Erstelle ein neues Pages-Projekt und verbinde `nexura-rp-v2`.

```text
Framework preset: None
Production branch: main
Build command: exit 0
Build output directory: .
Root directory: leer
```

Öffne zuerst die neue `pages.dev`-Adresse. Die Website läuft dabei im Demo-Modus und speichert Testdaten nur lokal im Browser.

## 3. Supabase erst danach

Folge `docs/02-SUPABASE.md`. Erst danach werden Login, gemeinsame Daten, Akten, Bewerbungen und Rollenrechte produktiv.

## 4. Eigene Domain zuletzt verschieben

Entferne `nexura-rp.de` erst dann vom alten Cloudflare-Pages-Projekt, wenn die neue `pages.dev`-Adresse sauber funktioniert. Danach im neuen Projekt:

```text
Custom domains → Set up a custom domain → nexura-rp.de
```

Die Nameserver bleiben bei Cloudflare und müssen nicht erneut bei STRATO geändert werden.

## Wichtige Grenze

Rechtliche Seiten wurden auf ausdrücklichen Wunsch noch nicht eingebaut. Verwende echte Bewerbungen, Akten und Beweisuploads erst öffentlich, nachdem Impressum, Datenschutzinformation, Löschprozesse und verantwortliche Stelle ergänzt wurden.
