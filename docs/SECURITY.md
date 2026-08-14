# Sicherheit

## Niemals in GitHub speichern

- Supabase Service Role Key
- Discord Client Secret
- Discord Webhook-URLs
- Datenbankpasswort
- Cloudflare API-Token
- echte `.env`- oder `.dev.vars`-Dateien

## Datenbank

- RLS ist auf allen sensiblen Tabellen aktiviert.
- Browserzugriffe verwenden ausschließlich den Publishable-/Anon-Key.
- privilegierte Cloudflare-Functions verwenden den Service Role Key nur serverseitig.
- Löschrichtlinien erlauben zentrale Löschungen nur dem Owner.
- Audit-Einträge sind nur für den Owner lesbar.

## 2FA

AAL2 wird für Administration, Teamleitung und Owner geprüft. Teste nach jeder Rollenänderung, ob ein aktiver AAL2-Nachweis verlangt wird.

## Formulare

- Eingaben werden in der Oberfläche escaped.
- Payload-Größen werden in Cloudflare-Functions begrenzt.
- Webhooks erhalten nur Metadaten, keine vollständigen sensiblen Texte.
- Bilduploads sind auf definierte MIME-Typen und 10 MB begrenzt.
- Videos werden nicht auf der Website gespeichert.

## Vor echtem Start

1. E-Mail-Bestätigung einschalten.
2. Owner-Konto zuerst erzeugen und 2FA aktivieren.
3. Demo-Zugänge durch Supabase-Konfiguration deaktivieren.
4. RLS mit mehreren Testkonten prüfen.
5. Webhook-URLs nur als Secrets speichern.
6. Impressum, Datenschutzinformation und Löschprozess ergänzen.
7. Keine echten Moderationsdaten importieren, bevor die Rechte geprüft wurden.
