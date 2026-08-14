# 01 – GitHub und Cloudflare Pages

## Neues Repository im Browser

1. GitHub öffnen.
2. `New repository` wählen.
3. Name: `nexura-rp-v2`.
4. Public auswählen.
5. README, `.gitignore` und Lizenz **nicht** automatisch anlegen.
6. Repository erstellen.
7. `uploading an existing file` beziehungsweise `Add file → Upload files` öffnen.
8. Im entpackten Projektordner `Strg + A` drücken und den **Inhalt** hochladen.
9. Commit-Nachricht: `Initial Nexura RP v2 release`.
10. Auf `Commit changes` klicken.

## Kontrolle

Im Repository-Hauptverzeichnis müssen `index.html`, `assets`, `js`, `functions`, `supabase` und `docs` direkt sichtbar sein.

## Cloudflare Pages

1. `Workers & Pages` öffnen.
2. Neues Pages-Projekt erstellen.
3. `Connect to Git` wählen.
4. Repository `nexura-rp-v2` auswählen.
5. Einstellungen:

```text
Project name: nexura-rp-v2
Production branch: main
Framework preset: None
Build command: exit 0
Build output directory: .
Root directory: leer
```

6. Deploy starten.
7. Die erzeugte `pages.dev`-Adresse prüfen.

## Domain ohne Ausfall umziehen

1. Neue `pages.dev`-Website vollständig testen.
2. Im alten Pages-Projekt `Custom domains` öffnen.
3. `nexura-rp.de` dort entfernen.
4. Im neuen Projekt `Custom domains → Set up a custom domain` öffnen.
5. `nexura-rp.de` eintragen.
6. Auf `Active` warten.

Die Cloudflare-Zone und die bei STRATO eingetragenen Nameserver bleiben bestehen.

## Spätere Updates

Jeder Commit auf `main` löst automatisch ein neues Deployment aus. Vor größeren Änderungen empfiehlt sich ein eigener Branch.
