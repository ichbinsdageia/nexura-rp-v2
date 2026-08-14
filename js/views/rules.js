import { RULE_SECTIONS } from '../data/rules.js';
import { pageHero } from '../components/layout.js';
import { escapeHtml } from '../lib/utils.js';

export function renderRules() {
  return `${pageHero('Regelwerk', 'Klar genug für Ordnung. <span class="gradient-text">Locker genug für Spielspaß.</span>', 'Dieses Regelwerk ist für anfängerfreundliches bis mittel-realistisches Emergency-Hamburg-RP ausgelegt.')}
  <section class="section section--tight"><div class="shell rules-layout">
    <aside class="rules-nav">${RULE_SECTIONS.map(section => `<a href="#${section.id}">${escapeHtml(section.title)}</a>`).join('')}</aside>
    <div class="rules-content">${RULE_SECTIONS.map(section => `<article class="rule-section" id="${section.id}"><span class="kicker">Nexura RP</span><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.intro)}</p><div class="rule-list">${section.rules.map(([title,text]) => `<div class="rule"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div>`).join('')}</div>${section.id === 'grundlagen' ? '<div class="rule-note">Roblox- und Emergency-Hamburg-Regeln stehen über diesem Community-Regelwerk. Plattformverstöße können zusätzlich direkt durch Roblox oder die Spielmoderation sanktioniert werden.</div>' : ''}</article>`).join('')}</div>
  </div></section>`;
}
export function bindRules() {}
