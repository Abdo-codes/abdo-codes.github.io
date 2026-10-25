import { LAW, ARTICLES, ANNEX_LETTERS, CHECKED, REGV, REGV_PATH } from './anchors.js';

// Rule sources of the bank. A key is `rvv-<article>`, `rvv-annex`, `rvv-annex-<letter>` or one of the named pages.
// `figure` says which figure the source states. An item that states a figure (a number with a unit) must cite a source with `figure`.
// A link to the law uses the dated path and an anchor from anchors.js. Every other host must also be listed in RULE-SOURCES.md.
const FIGURES = {
  20: '50 km/h in a built-up area; mopeds 45 km/h on the road and 30 km/h on a cycle path',
  21: '130 km/h on a motorway, 100 km/h on an autoweg, 80 km/h on other roads outside a built-up area',
  23: 'No standing on a junction, a level crossing or a crossing, and within 5 m of a crossing',
  24: 'No parking within 5 m of a junction',
  42: 'A motorway is for motor vehicles that can drive at least 60 km/h',
  34: 'The rear fog lamp is for fog or snowfall that limits the view to less than 50 m',
  58: 'The warning triangle stands about 30 m from the vehicle',
  59: 'A passenger under 18 years and shorter than 1.35 m needs a child restraint system',
};
const REGV_FIGURES = { '5.2.27': 'The main grooves of a car tyre are at least 1.6 mm deep' };
const rvv = article => [`rvv-${article}`, { ref: `RVV 1990 · Article ${article}`, url: `${LAW}#${ARTICLES[article]}`, checked: CHECKED, ...(FIGURES[article] && { figure: FIGURES[article] }) }];
const annex = letter => [`rvv-annex-${letter.toLowerCase()}`, { ref: `RVV 1990 · Annex I, chapter ${letter}`, url: `${LAW}#Bijlage1_DivisieHoofdstuk${letter}`, checked: CHECKED }];
const regv = number => [`regv-${number}`, { ref: `Regeling voertuigen · Article ${number}`, url: `https://wetten.overheid.nl${REGV_PATH}#${REGV[number]}`, checked: CHECKED, ...(REGV_FIGURES[number] && { figure: REGV_FIGURES[number] }) }];

export const SOURCES = Object.fromEntries([
  ...Object.keys(ARTICLES).map(rvv), ['rvv-annex', { ref: 'RVV 1990 · Annex I', url: `${LAW}#Bijlage1`, checked: CHECKED }], ...ANNEX_LETTERS.map(annex),
  ['wvw-5', { ref: 'WVW 1994 · Article 5', url: 'https://wetten.overheid.nl/BWBR0006622/2026-09-01#HoofdstukII_Paragraaf1_Artikel5', checked: CHECKED }],
  ['wvw-7', { ref: 'WVW 1994 · Article 7', url: 'https://wetten.overheid.nl/BWBR0006622/2026-09-01#HoofdstukII_Paragraaf1_Artikel7', checked: CHECKED }],
  ...Object.keys(REGV).map(regv),
  ['cbr-plan', { ref: 'CBR · Theory exam plan, car', url: 'https://www.cbr.nl/nl/rijbewijs-halen/auto/theorie-examen-auto/theorie-examenplan-auto', checked: CHECKED }],
  ['cbr-exam-news', { ref: 'CBR · News of 20 February 2025', url: 'https://www.cbr.nl/nl/over-het-cbr/over/laatste-nieuws/nieuws/vernieuwd-theorie-examen-b-rijbewijs-vanaf-7-april', checked: CHECKED }],
  ['cbr-rijprocedure-b', { ref: 'CBR · Rijprocedure B', url: 'https://www.cbr.nl/nl/service/nl/artikel/rijprocedure-b-printversie', checked: CHECKED }],
  ['cbr-rijprocedure-b-3', { ref: 'CBR · Rijprocedure B, sections 3.2 and 3.4', url: 'https://www.cbr.nl/nl/voor-rijscholen/nl/rijprocedures/rijprocedure-b-6/3.-onderdelen-van-verkeersdeelneming', checked: CHECKED }],
  ['anwb-rotondes', { ref: 'ANWB · Roundabout rules', url: 'https://www.anwb.nl/verkeer/veiligheid/verkeersregels/rotondes', checked: CHECKED }],
  ['anwb-invoegen', { ref: 'ANWB · Merging (invoegen)', url: 'https://www.anwb.nl/verkeer/veiligheid/verkeersregels/invoegen', checked: CHECKED }],
  ['cbr-following-distance', { ref: 'CBR · Rijprocedure B, following distance', url: 'https://www.cbr.nl/nl/service/nl/artikel/rijprocedure-b-printversie', checked: CHECKED, figure: 'The following distance is at least the distance that the car travels in two seconds (the two-second rule)' }],
  ['prorail-overwegen', { ref: 'ProRail · Safely crossing a railway', url: 'https://www.prorail.nl/veiligheid/overwegen/veilig-oversteken', checked: CHECKED }],
  // Official government pages for the responsible-driving and law items. Each page was read on the check date.
  ['rijksoverheid-alcohol', { ref: 'Rijksoverheid · Alcohol and driving', url: 'https://www.rijksoverheid.nl/onderwerpen/verkeersveiligheid/vraag-en-antwoord/mag-ik-met-alcohol-op-deelnemen-aan-het-verkeer', checked: CHECKED, figure: '0.5 per mille of alcohol in the blood; 0.2 per mille for a beginning driver; 5 years as a beginning driver after a first car licence' }],
  ['rijksoverheid-drugs', { ref: 'Rijksoverheid · Drugs and driving', url: 'https://www.rijksoverheid.nl/onderwerpen/verkeersveiligheid/vraag-en-antwoord/drugs-in-het-verkeer', checked: CHECKED }],
  ['rijksoverheid-medicines', { ref: 'Rijksoverheid · Medicines and driving', url: 'https://www.rijksoverheid.nl/vraag-en-antwoord/verkeersveiligheid/medicijnen-in-het-verkeer', checked: CHECKED }],
  ['rijksoverheid-licence', { ref: 'Rijksoverheid · Driving without your licence on you', url: 'https://www.rijksoverheid.nl/onderwerpen/rijbewijs/vraag-en-antwoord/kan-ik-een-boete-bekeuring-krijgen-voor-het-rijden-zonder-rijbewijs', checked: CHECKED }],
  ['rijksoverheid-registration-card', { ref: 'Rijksoverheid · Carrying the registration document', url: 'https://www.rijksoverheid.nl/onderwerpen/auto/vraag-en-antwoord/moet-ik-het-kentekenbewijs-bij-me-hebben-in-de-auto', checked: CHECKED }],
  ['rijksoverheid-car-insurance', { ref: 'Rijksoverheid · Buying a car: WA insurance', url: 'https://www.rijksoverheid.nl/onderwerpen/auto/vraag-en-antwoord/auto-kopen', checked: CHECKED }],
  ['rdw-apk', { ref: 'RDW · When and how often to have the APK', url: 'https://www.rdw.nl/particulier/voertuigen/auto/apk/wanneer-en-hoe-vaak-apk-keuren', checked: CHECKED, figure: 'Petrol and electric car: first APK at 4 years, then at 6 and 8 years, then every year. Diesel car: first APK at 3 years, then every year' }],
  ['rdw-coach', { ref: 'RDW · Accompanied driving (begeleid rijden)', url: 'https://www.rdw.nl/het-rijbewijs/rijbewijs-halen/begeleid-rijden', checked: CHECKED }],
  ['politie-accident', { ref: 'Politie · After a traffic accident', url: 'https://www.politie.nl/informatie/ik-ben-betrokken-bij-een-verkeersongeval.-wat-moet-ik-doen.html', checked: CHECKED }],
]);
