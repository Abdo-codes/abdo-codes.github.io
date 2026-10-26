import { law, q, LAP } from './shared.js';

// An ambulance with a siren drives along the 54 m cross road (x -13 to -3). The clock starts at the start, `delay` seconds before it appears.
// Variant 3 is a red light with the ambulance behind you in the oncoming lane (the older [U] case: the game keeps the red-light rule).
const REDHOLD = { before: 'red', phases: [[0, 12, 'red']], delay: 0, duration: 11.7,
  actor: { clearAt: 1, path: { type: 'route-offset', from: 150, to: 290, lateral: -3.5 } } };
export default {
  id: 'emergency-vehicle', shortTitle: 'Siren', kind: 'siren', title: 'Make way', skill: 'Let a priority vehicle go first', icon: '◉',
  start: 181.7, gate: LAP + 27, end: LAP + 44, trigger: 181.7, speedLimit: 50, startSpeed: 40, duration: 5.6, delay: 4,
  phases: [], before: 'green',
  actor: { slot: 7, name: 'ambulance', retire: true, pivot: [-8, 26], clearAt: .62, path: { type: 'line', from: [-5.5, 51], to: [-5.5, 1] } },
  variants: [{}, { flip: true, delay: 4.9, actor: { clearAt: .56 } }, { delay: 5.5 }, REDHOLD, { flip: true, delay: 6.4, actor: { clearAt: .56 } }, { delay: 0 }],
  objective: 'When you hear or see a siren, find the ambulance. Let it go first, then go on.',
  coach: 'A siren and a blue light show an ambulance. Use Slow, then Stop before the line. Let the ambulance pass, then go on.',
  readyNote: 'Sound is off. Tap ♫ to hear the siren. The blue light at the edge shows the same.',
  success: 'You let the ambulance go first.',
  rule: 'A priority vehicle uses a blue flashing light and a two-tone horn. All road users let its driver go first (Article 50). Article 50 names no exception for a green light.',
  reference: 'RVV 1990 · Article 50', source: `${law}#HoofdstukII_Paragraaf20_Artikel50`,
  terms: ['voorrangsvoertuig', 'voor laten gaan', 'tweetonige hoorn'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('You have a green light. An ambulance with a siren and blue lights comes from the side. What do you do?', ['Stop and let it pass', 'Go on, because your light is green', 'Speed up to cross first'], 0,
      'All road users let a priority vehicle go first (Article 50). The article names no exception for a green light.'),
    // [U] The red-light answer follows the plain text of Articles 68 and 91; the sources do not say more.
    q('You wait at a red light. An ambulance with a siren comes up behind you. What do you do?', ['Stay behind the line and let it pass', 'Drive through the red light', 'Reverse to make room'], 0,
      'The red light still applies to you. The law lets the priority driver depart from the rules (Article 91). It says nothing about other drivers.'),
  ],
};
