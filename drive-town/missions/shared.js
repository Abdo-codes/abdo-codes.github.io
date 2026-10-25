// Shared constants for mission data files. Each mission file exports one plain object.
export { ROUTE_LENGTH as LAP, ROUTE_TURNS, routeAt } from '../route.js';
export { BUS_BAY } from '../sharing-state.js';

export const law = 'https://wetten.overheid.nl/BWBR0004825/2026-07-01';
export const signs = `${law}#Bijlage1`;
// Chapter A to L of Annex I: A Snelheid, B Voorrang, D Rijrichting (D1 roundabout), F Overige geboden en verboden (F5 and F6 narrow road), L Informatie.
export const annex = letter => `${law}#Bijlage1_DivisieHoofdstuk${letter}`;
// Deep links into RVV 1990 chapter II paragraphs used by chapter one.
export const source = article => `${law}#HoofdstukII_Paragraaf${article === 15 ? 5 : article === 18 ? 7 : article === 49 ? 19 : 24}_Artikel${article}`;
// A rule-check question: three choices, the index of the correct one, and the explanation shown after a mistake.
export const q = (prompt, choices, correct, explanation) => ({ prompt, choices, correct, explanation });
export { STOPS, CENTRES, CYCLE_RING } from '../roundabout-layout.js';
export { MERGE_STOPS } from '../merge-layout.js';
export { queue } from '../lane-traffic.js';
// Plain-language roundabout guidance used alongside the law: priority, signalling and cycle paths.
export const roundaboutGuide = 'https://www.anwb.nl/verkeer/veiligheid/verkeersregels/rotondes';
// Chapter 05 sources: RVV 1990 Article 54 (special manoeuvres, merging last), Article 55 (indicating) and Article 77 (hatched markings).
export const article54 = source(54);
// Chapter 07 sources: an RVV 1990 article by number (anchors checked in exam/anchors.js) and the three street layouts.
export { STREET_STOPS } from '../street-layout.js';
export { LAW, ARTICLES } from '../exam/anchors.js';
import { LAW, ARTICLES } from '../exam/anchors.js';
export const article = number => `${LAW}#${ARTICLES[number]}`;
