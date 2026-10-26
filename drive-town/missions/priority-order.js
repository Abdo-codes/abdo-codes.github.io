import { law, q, LAP } from './shared.js';

// The west street crossing: the light is green all the time. An officer at (-38,-18) shows stop with one raised arm and ranks above the light.
// The kerb variants have no arm: the officer stands at the kerb and gives no instruction.
export default {
  id: 'priority-order', shortTitle: 'Rank', kind: 'priority', title: 'Who ranks first?', skill: 'An instruction ranks above a light', icon: '▲',
  start: LAP + 44, gate: LAP + 95.3, end: LAP + 111, trigger: LAP + 69.3, speedLimit: 50, startSpeed: 22, duration: 12,
  phases: [], before: 'green', arm: [0, 8],
  actor: { slot: 8, name: 'officer', retire: true, path: { type: 'stand', at: [-38, -18], kerb: [-32.5, -14.5], face: 0 } },
  variants: [{}, { arm: [0, 6] }, { arm: null, kerb: true }, { arm: [0, 10] }, { arm: null, kerb: true, startSpeed: 40 }, { arm: [0, 7] }],
  objective: 'Look at the officer and at the light. Obey the officer first.',
  coach: 'The light is green, but the officer shows stop. An instruction from an officer ranks above a traffic light. Use Slow, then Stop before the line.',
  success: 'You obeyed the officer before the light.',
  rule: 'An instruction from a police officer ranks above signs, lights and rules (Articles 82 and 84). A traffic light ranks above a priority sign (Article 64).',
  reference: 'RVV 1990 · Articles 64, 82 and 84', source: `${law}#HoofdstukIV_Paragraaf2_Artikel84`,
  terms: ['aanwijzing', 'rangorde', 'verkeerslicht'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('The light is green. A police officer shows you stop. What do you do?', ['Go on, because the light is green', 'Stop before the line', 'Go on if the junction is empty'], 1, 'The instruction of an officer ranks above a traffic light (Articles 82 and 84).'),
    q('A sign gives you priority. The traffic light for you is red. Which one ranks higher?', ['The priority sign', 'The traffic light', 'The rule for traffic from the right'], 1, 'A traffic light ranks above a sign that gives priority (Article 64).'),
  ],
};
