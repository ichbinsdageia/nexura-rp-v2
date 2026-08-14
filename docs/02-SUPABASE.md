# 02 – Supabase einrichten

Supabase übernimmt Datenbank, Anmeldung, Rollenrechte, TOTP-2FA und Bildspeicher.

## Projekt erstellen

1. Neues Supabase-Projekt anlegen.
2. Region in Europa wählen.
3. Ein starkes Datenbankpasswort verwenden und sicher speichern.

## Datenbank aufbauen

1. `SQL Editor` öffnen.
2. Neue Query erstellen.
3. Den gesamten Inhalt aus `supabase/setup.sql` einfügen.
4. `Run` ausführen.
5. Prüfen, ob die Tabellen `profiles`, `submissions`, `player_records`, `team_records`, `sessions`, `projects` und `audit_log` sichtbar sind.

## Owner-Konto

Der SQL-Trigger erkennt ausschließlich diese E-Mail als Owner:

```text
ichbinsdageia@gmail.com
```

Aktiviere in Supabase die E-Mail-Bestätigung. Registriere das Owner-Konto anschließend auf `/konto`. Erst eine bestätigte Kontrolle über diese E-Mail darf Ownerrechte erhalten.

## Clientwerte eintragen

Öffne in Supabase die API-Einstellungen und kopiere:

- Project URL
- Publishable Key beziehungsweise Legacy Anon Key

Trage beide Werte in `js/config.js` ein:

```js
supabase: {
  url: 'https://DEIN-PROJEKT.supabase.co',
  publishableKey: 'DEIN_PUBLIC_KEY',
},
```

Der Publishable-/Anon-Key ist für Browseranwendungen vorgesehen. Schutz entsteht durch RLS. Der **Service Role Key darf niemals in `js/config.js`, GitHub oder Browsercode stehen**.

## Storage

Das SQL-Skript erzeugt:

- `evidence` – privat, für Screenshots
- `public-assets` – öffentlich, für freigegebene Banner und Logos

Direkte Beweisuploads sind auf Bilddateien und 10 MB je Datei begrenzt. Größere Videos werden weiterhin als externer Link eingereicht.

## RLS testen

Vor Veröffentlichung mindestens testen:

1. Gast kann öffentliche News, Sessions, Gangs, Ideen, Stellen und Teammitglieder lesen.
2. Gast kann ein allgemeines Formular absenden, aber keine internen Daten lesen.
3. Spieler sieht nur eigene Eingänge und freigegebene Inhalte der eigenen Spielerakte.
4. Support kann Eingänge erstellen beziehungsweise einfache Supporteingänge sehen, aber keine HR-Akten.
5. Moderation kann Spielerfälle bewerten.
6. Administration kann Sanktionen und Accountverknüpfungen vorbereiten.
7. Teamleitung kann Sessions und Roblox-Verknüpfungen endgültig freigeben.
8. Nur Owner sieht den Audit-Log und darf löschen.

## 2FA

Owner, Teamleitung und Administration werden im Portal auf AAL2/TOTP geprüft. Supabase stellt derzeit keine klassischen einmaligen Recovery-Codes bereit. Verwende deshalb mindestens einen zweiten sicher verwahrten TOTP-Faktor beziehungsweise ein separates Wiederherstellungsverfahren. Ein eigener persönlicher Notfallcode ist in dieser Version bewusst noch nicht als scheinbar sichere Eigenlösung implementiert.
