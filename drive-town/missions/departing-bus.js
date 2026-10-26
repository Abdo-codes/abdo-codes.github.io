import { law, LAP, BUS_BAY, q } from './shared.js';

const BUS_GATE = LAP * 2 + 14;

export default {
  id: 'departing-bus', shortTitle: 'Bus', kind: 'bus',
  actor: { slot: 5, path: { type: 'route-merge', from: BUS_GATE + 9, to: BUS_GATE + 37, offset: BUS_BAY.offset, merge: .45 } },
  title: 'Room for the bus', skill: 'Let a signalling bus leave', icon: 'BUS',
  start: LAP + 166, gate: BUS_GATE, end: LAP * 2 + 44,
  trigger: LAP * 2 - 12, duration: 12, approachDelay: 1.5,
  objective: 'In this built-up area, make room for the bus indicating left to leave its stop.',
  coach: 'We are inside the built-up area. The bus ahead signals left to leave its stop. Slow early and give it room to pull away before you follow.',
  success: 'You made room for the signalling bus to leave its stop, then continued safely.',
  clearSuccess: 'You checked the stop and continued safely after the bus had already left.',
  rule: 'Inside a built-up area, drivers must give a bus room to leave its stop when its indicator shows that intention. Keep checking the road before following.',
  reference: 'RVV 1990 · Article 56', source: `${law}#HoofdstukII_Paragraaf24_Artikel56`,
  terms: ['bushalte', 'bebouwde kom'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('Inside a built-up area, a bus indicates to leave its stop. What should you do?',
      ['Give the bus room to pull away', 'Pass quickly because you are already moving', 'Make room only after it enters your lane'], 0,
      'Inside the built-up area, give a bus room to leave its stop when it signals that intention.'),
    q('A bus is still boarding at its stop and gives no departure signal. Does merely being a bus give it permission to pull out ahead of you?',
      ['Yes, every bus always has priority', 'No; observe carefully and be ready if it signals to leave', 'No; accelerate past without looking'], 1,
      'This departure rule depends on the built-up location, stop and departure signal. Stay alert even before a signal appears.'),
  ],
};
