import { GLOSSARY } from './exam/glossary.js';

// The Dutch exam words of a lesson: `mission.terms` holds glossary keys (exam/glossary.js), so the lessons and the mock exam use one word for one meaning.
// The lesson card and the rule result show them. The words are static text from the data files, so they need no escaping.
export const termsOf = mission => (mission.terms ?? []).map(key => GLOSSARY[key]).filter(Boolean);
export function termsHtml(mission) {
  const terms = termsOf(mission);
  return terms.length ? `<p class="dutch-terms" aria-label="Dutch exam words">${terms.map(term => `<span class="dutch-term"><b lang="nl">${term.nl}</b> ${term.en}</span>`).join('')}</p>` : '';
}
