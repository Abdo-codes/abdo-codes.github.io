import { law, q } from './shared.js';

export default {
  id: 'traffic-light', shortTitle: 'Lights', kind: 'light', title: 'A light to listen to', skill: 'Red means stop', icon: '●',
  start: 159, gate: 211, end: 227, trigger: 166, duration: 8, speedLimit: 50,
  objective: 'Wait before the stop line while the light is red. Continue on green when the road is clear.',
  coach: 'A red light is ahead. Use Slow, then Stop before the white line. Wait for green and check the road before moving.',
  success: 'You crossed on green and kept the stop line clear while the light was red.',
  rule: 'Red means stop. Green permits you to continue; check that you can proceed safely without blocking the junction.',
  reference: 'RVV 1990 · Articles 68 and 14', source: `${law}#HoofdstukIII_Paragraaf3_Artikel68`,
  terms: ['verkeerslicht', 'stopstreep'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('The light is green but traffic blocks your exit. What do you do?', ['Enter and wait in the middle', 'Wait before entering until you can clear the junction', 'Use the opposite lane to get through'], 1, 'Green permits movement, but you must not block the junction.'),
    q('The junction is empty but your light is red. May you continue?', ['Yes, after a brief pause', 'Yes, if you drive slowly', 'No; wait for a permitting signal'], 2, 'An empty junction does not remove the red-light stop requirement.'),
  ],
};
