export const TEAM_RULE_LAYERS = [
  {
    key: 'general', title: 'Allgemeine Teamregeln', appliesTo: 'Alle Teammitglieder',
    rules: [
      'Teamrechte werden ausschließlich für dienstliche Zwecke eingesetzt.',
      'Interne Informationen, Akten, Bewerbungen und Beweise bleiben vertraulich.',
      'Entscheidungen müssen sachlich, nachvollziehbar und frei von persönlichen Konflikten sein.',
      'Befangenheit ist offenzulegen; betroffene Teammitglieder geben den Fall ab.',
      'Beleidigungen, Machtdemonstrationen, Provokationen und öffentliche Bloßstellung sind untersagt.',
      'Jede Maßnahme erhält einen klaren Grund und – soweit vorhanden – Beweise oder Fallreferenzen.',
      'Neue Regelversionen werden innerhalb der angegebenen Frist bestätigt.',
    ],
  },
  {
    key: 'support', title: 'Ergänzung Support', appliesTo: 'Test-Supporter und höher',
    rules: [
      'Support nimmt Anliegen neutral auf und verspricht keine Entscheidungen außerhalb der eigenen Rechte.',
      'Sensible Fälle werden an die zuständige Rolle weitergegeben.',
      'Support darf neue Aktenmeldungen erstellen, aber keine endgültigen Sanktionen festlegen.',
      'Nutzer erhalten verständliche Statusinformationen ohne interne Notizen offenzulegen.',
      'Gespräche werden nicht unnötig verlängert; wiederkehrende Fragen werden sauber dokumentiert.',
    ],
  },
  {
    key: 'moderation', title: 'Ergänzung Moderation', appliesTo: 'Moderation und höher',
    rules: [
      'Moderation bewertet Verstöße und Punkte anhand der Beweislage und vergleichbarer Fälle.',
      'Keine Sanktion wird als persönliche Strafe oder zur Abschreckung einzelner Kritiker genutzt.',
      'Unklare Beweise führen nicht automatisch zur schwersten Auslegung.',
      'Moderation ergänzt Akten, verändert aber keine fremden Einträge ohne nachvollziehbare Korrektur.',
    ],
  },
  {
    key: 'administration', title: 'Ergänzung Administration', appliesTo: 'Administration und höher',
    rules: [
      'Administration bestätigt oder ändert Sanktionsvorschläge und begründet Abweichungen.',
      'Roblox-Verknüpfungen werden geprüft und anschließend Teamleitung oder Owner zur Freigabe vorgelegt.',
      'Geplante Sessions dürfen erstellt und bearbeitet, aber erst nach Freigabe veröffentlicht werden.',
      '2FA per Authenticator-App ist verpflichtend.',
      'Administration darf keine Einsprüche entscheiden, an deren Ausgangsfall sie beteiligt war.',
    ],
  },
  {
    key: 'hr', title: 'Ergänzung Human Resources', appliesTo: 'HR und höher',
    rules: [
      'Bewerbungen werden nach nachvollziehbaren Kriterien und ohne Bevorzugung geprüft.',
      'Ablehnungen erhalten eine kurze sachliche Begründung; sensible interne Details bleiben geschützt.',
      'Probezeiten, Bewertungen, Abwesenheiten und Beförderungsanträge werden vollständig dokumentiert.',
      'Bewerbungsdaten werden nach der vorgesehenen Frist gelöscht oder anonymisiert.',
      'HR darf Regelentwürfe vorschlagen, aber nicht selbst verbindlich veröffentlichen.',
    ],
  },
  {
    key: 'teamlead', title: 'Ergänzung Teamleitung', appliesTo: 'Teamleitung und höher',
    rules: [
      'Teamleitung kontrolliert Entscheidungen, löst Konflikte und wahrt einheitliche Standards.',
      'Kritische Zugriffe erfordern verpflichtende 2FA.',
      'Probezeit-, Beförderungs- und Einspruchsentscheidungen werden begründet.',
      '2FA-Resets für Administration erfolgen erst nach Identitätsprüfung.',
      'Regelentwürfe können vorbereitet, aber nur durch den Owner veröffentlicht werden.',
    ],
  },
  {
    key: 'owner', title: 'Ergänzung Owner', appliesTo: 'Owner',
    rules: [
      'Der Owner ist einzige Rolle mit Löschrecht für Akten und vollständiger Einsicht in Audit-Logs.',
      'Löschungen sollen Ausnahme bleiben und müssen einen Audit-Eintrag erzeugen.',
      'Der Owner veröffentlicht interne Regelversionen und kontrolliert Rollenfreigaben.',
      'Notfallzugriff wird über Wiederherstellungs-E-Mail und persönlichen Notfallcode geschützt.',
      'Service-Role-Keys, Webhooks und andere Secrets werden niemals im Browsercode oder Repository gespeichert.',
    ],
  },
];
