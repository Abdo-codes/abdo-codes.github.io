import { law, signs, q } from './shared.js';

export default {
  id: 'gentle-start', shortTitle: 'Speed', title: 'A gentle start', skill: 'Read the road', icon: '30',
  start: 0, gate: 22, end: 22, trigger: Infinity, duration: 0,
  objective: 'Drive through the signed 30 km/h zone.',
  coach: 'Welcome! Follow the blue route. Tap Drive to travel at 22 km/h. Use Slow to approach at 10, and tap Stop whenever you need to wait. The signs set a 30 km/h maximum.',
  success: 'A calm start. You kept your speed within the posted limit.',
  rule: 'A posted speed limit is a maximum. Choose a lower speed when the situation calls for it.',
  reference: 'RVV 1990 · Article 62 / sign A1', source: `${law}#HoofdstukIII_Paragraaf1_Artikel62`,
  terms: ['maximumsnelheid', 'bebouwde kom'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('The sign shows 30. Which speed choice respects it?', ['At most 30, slower when needed', 'Exactly 30 even near a hazard', '40 until another car appears'], 0, 'A posted maximum is a ceiling, not a target you must maintain.'),
    q('Children are near a road signed 30. What is a sensible response?', ['Keep exactly 30 because the sign allows it', 'Choose a lower speed if the situation needs it', 'Use 40 to clear the area quickly'], 1, 'The maximum still applies; conditions can require a slower pace.'),
  ],
};
