# 00 – Neues Repository ohne verschachtelten Ordner

## Repository anlegen

Erstelle bei GitHub ein **leeres** Repository:

```text
nexura-rp-v2
```

Einstellungen:

- Public
- README **nicht** automatisch erstellen
- `.gitignore` **nicht** automatisch erstellen
- Lizenz **nicht** automatisch erstellen

## Dateien richtig hochladen

1. ZIP entpacken.
2. Den entpackten Ordner `nexura-rp-v2` öffnen.
3. In diesem Ordner `Strg + A` drücken.
4. Bei GitHub `uploading an existing file` öffnen.
5. Die markierten **Inhalte** in das Upload-Feld ziehen.
6. Commit-Nachricht: `Initial Nexura RP v2 release`.
7. `Commit changes` anklicken.

Im GitHub-Hauptverzeichnis müssen danach direkt diese Einträge stehen:

```text
index.html
404.html
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

Falsch wäre ein zusätzlicher Zwischenordner:

```text
nexura-rp-v2/nexura-rp-v2/index.html
```

## Danach

Das neue Repository wird als **neues Cloudflare-Pages-Projekt** verbunden. Die bestehende Domain wird erst umgezogen, nachdem die neue `pages.dev`-Adresse getestet wurde.
