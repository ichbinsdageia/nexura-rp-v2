export const FACTIONS = [
  { icon: '🚓', name: 'Polizei', text: 'Streifendienst, Verkehrskontrollen, Fahndungen und anspruchsvolle Einsatzlagen.' },
  { icon: '🚒', name: 'Feuerwehr', text: 'Brandbekämpfung, technische Hilfeleistung und koordinierte Großlagen.' },
  { icon: '🚑', name: 'Rettungsdienst', text: 'Medizinische Notfälle, Versorgung und glaubwürdiges Patienten-RP.' },
  { icon: '🏙️', name: 'Zivilisten', text: 'Freies Stadtleben, Unternehmen, Verkehr, Alltag und eigene Geschichten.' },
  { icon: '🚌', name: 'Busbetrieb', text: 'Öffentlicher Nahverkehr, Fahrpläne und realistische Linienfahrten.' },
  { icon: '🔧', name: 'ADAC', text: 'Pannenhilfe, Abschleppdienst und Absicherung von Unfallstellen.' },
];

export const FAQ = [
  ['Wie kann ich Nexura RP beitreten?', 'Öffne den Discord und anschließend den Roblox-Link. Alle wichtigen Sessioninformationen stehen auf der Website und im Discord.'],
  ['Brauche ich eine Bewerbung?', 'Nein. Die normalen Fraktionen sind frei zugänglich. Nur Teamrollen und offiziell eingetragene Gangs nutzen ein Bewerbungs- beziehungsweise Prüfverfahren.'],
  ['Welche Fraktionen gibt es?', 'Polizei, Feuerwehr, Rettungsdienst, Zivilisten, Busbetrieb und ADAC.'],
  ['Wie kann ich eine Gang gründen?', 'Über die Gang-Seite reichst du Name, Logo, Gründer, Mitglieder, Beschreibung, Farben, Motto, Discord-Kontakt und Roblox-Namen ein. Nach Prüfung wird die Gang veröffentlicht.'],
  ['Gibt es ein Mindestalter?', 'Für normale Spieler gibt es kein festes Mindestalter. Entscheidend sind vernünftiges Verhalten und regelkonformes RP. Für Teammitglieder gilt mindestens 13 Jahre.'],
  ['Was passiert bei Regelverstößen?', 'Verstöße werden in einer Akte dokumentiert und mit Punkten bewertet. Das System schlägt eine Sanktion vor, die zuständige Teamrollen prüfen und bestätigen.'],
  ['Wo bekomme ich Support?', 'Über das Supportformular oder ein Discord-Ticket. Sensible Anfragen erfordern später einen Discord-Login.'],
];

export const NEWS_SEED = [
  { id: 'n1', category: 'Ankündigungen', title: 'Nexura RP ist öffentlich spielbar', excerpt: 'Tritt dem Discord bei, öffne den Roblox-Server und starte deine erste Geschichte in Hamburg.', published_at: new Date().toISOString(), published: true },
  { id: 'n2', category: 'Team-News', title: 'Teamstellen sind geöffnet', excerpt: 'Fast alle Rollen sind aktuell gesucht. Der normale Einstieg beginnt in der Regel als Test-Supporter.', published_at: new Date(Date.now() - 86400000).toISOString(), published: true },
  { id: 'n3', category: 'Updates', title: 'Website und Portal werden aufgebaut', excerpt: 'Bewerbungen, Akten, Sessions, Gangverwaltung und das interne Teamportal werden zusammengeführt.', published_at: new Date(Date.now() - 172800000).toISOString(), published: true },
];

export const SUPPORT_CATEGORIES = [
  'Allgemeiner Support',
  'Ingame-Admin rufen',
  'Spieler melden',
  'Teammitglied melden',
  'Bug melden',
  'Technikproblem',
  'Roblox-Name oder Accountverknüpfung',
  'Ban- oder Sanktionseinspruch',
  'Gang-Bewerbung oder Gang-Frage',
  'Team-Bewerbung',
  'Team-Bewerbungs-Einspruch',
  'Partnerschaftsanfrage',
  'Content-Creator-Anfrage',
  'Fraktionsfrage',
  'Event- oder Mini-Event-Antrag',
  'Idee und Feedback',
  'Besonders guten RP-Spieler vorschlagen',
  'Support bewerten',
  'Sonstige Anfrage',
];

export const NEWS_CATEGORIES = ['Updates', 'Events', 'Team-News', 'Fraktions-News', 'Ankündigungen'];
