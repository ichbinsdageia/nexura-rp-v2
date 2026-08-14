export const RULE_QUESTION_POOL = [
  { topic: 'Meta-Gaming', question: 'Was ist Meta-Gaming?', options: ['Informationen aus OOC-Quellen im RP verwenden', 'Eine Verfolgung abbrechen', 'Eine Fraktion wechseln', 'Im Discord eine Frage stellen'], answer: 0 },
  { topic: 'RDM', question: 'Wann ist ein Angriff auf einen anderen Spieler zulässig?', options: ['Immer, wenn man eine Waffe hat', 'Nur mit nachvollziehbarem RP-Konflikt und angemessener Eskalation', 'Wenn der Spieler langsam fährt', 'Sobald jemand widerspricht'], answer: 1 },
  { topic: 'VDM', question: 'Was bedeutet VDM?', options: ['Ein Fahrzeug absichtlich als Waffe einsetzen', 'Verkehrsregeln beachten', 'Ein Fahrzeug abschleppen', 'Ein Dienstfahrzeug parken'], answer: 0 },
  { topic: 'Support', question: 'Was sollst du tun, wenn du mit einer Sanktion nicht einverstanden bist?', options: ['Das Team öffentlich beleidigen', 'Einen sachlichen Einspruch mit Fallnummer und Beweisen einreichen', 'Einen Alt-Account nutzen', 'Die Szene durch Combat Logging verlassen'], answer: 1 },
  { topic: 'New-Life-Regel', question: 'Was darfst du nach einem vollständigen Tod nicht tun?', options: ['Später an einer neuen Szene teilnehmen', 'Sofort zur selben Szene zurückkehren und Rache nehmen', 'Eine andere Rolle spielen', 'Den Support kontaktieren'], answer: 1 },
  { topic: 'Fear-RP', question: 'Wie verhältst du dich bei einer klar lebensbedrohlichen Situation?', options: ['Gefahr vollständig ignorieren', 'Glaubwürdig reagieren und das Leben des Charakters schützen', 'Sofort resetten', 'Andere mit OOC-Wissen warnen'], answer: 1 },
  { topic: 'Combat Logging', question: 'Was ist Combat Logging?', options: ['Den Server verlassen, um einer laufenden RP-Situation zu entgehen', 'Nach einer Session ausloggen', 'Einen Bug melden', 'Im Teamportal eine Akte öffnen'], answer: 0 },
  { topic: 'Verkehr', question: 'Was ist nach einem schweren Unfall richtig?', options: ['Ohne Reaktion weiterfahren', 'Den Unfall angemessen ausspielen', 'Das Fahrzeug sofort despawnen', 'Die andere Person beleidigen'], answer: 1 },
  { topic: 'Polizei', question: 'Wann darf die Polizei Zwangsmittel einsetzen?', options: ['Aus Langeweile', 'Verhältnismäßig und mit nachvollziehbarem Anlass', 'Immer gegen Zivilisten', 'Nur nach Abstimmung mit der Gang'], answer: 1 },
  { topic: 'Beweise', question: 'Welche Beweise sind grundsätzlich möglich?', options: ['Nur Gerüchte', 'Screenshots, Videos, Nachrichten, Zeugen und vorhandene Logs', 'Nur Aussagen des Teams', 'Manipulierte Clips'], answer: 1 },
  { topic: 'Team', question: 'Wie beginnt der normale Teamweg meistens?', options: ['Direkt als Administrator', 'Als Support in Ausbildung/Test-Supporter', 'Als Co-Owner', 'Ohne Probezeit als Moderator'], answer: 1 },
  { topic: 'Datenschutz', question: 'Wie gehst du mit internen Akten um?', options: ['Öffentlich posten', 'Vertraulich behandeln und nur für dienstliche Zwecke nutzen', 'An Freunde senden', 'Als Meme verwenden'], answer: 1 },
  { topic: 'Befangenheit', question: 'Was tust du, wenn du persönlich an einem Fall beteiligt bist?', options: ['Du entscheidest trotzdem allein', 'Du gibst den Fall an eine unbeteiligte zuständige Person ab', 'Du löschst die Akte', 'Du ignorierst den Fall'], answer: 1 },
  { topic: 'Sanktionen', question: 'Wie wird eine Sanktion festgelegt?', options: ['Immer automatisch ohne Prüfung', 'Systemvorschlag plus Prüfung und manuelle Entscheidung', 'Nur nach Beliebtheit', 'Durch eine öffentliche Abstimmung'], answer: 1 },
  { topic: 'Exploits', question: 'Was gilt für Cheats und Exploits?', options: ['Sie sind erlaubt, solange niemand zusieht', 'Sie sind verboten und werden schwer sanktioniert', 'Nur Teammitglieder dürfen sie nutzen', 'Sie sind bei Verfolgungen erlaubt'], answer: 1 },
];

export function drawQuestions(count = 5) {
  return [...RULE_QUESTION_POOL].sort(() => Math.random() - .5).slice(0, count);
}
