import { source, q } from './shared.js';

export default {
  id: 'right-of-way', shortTitle: 'Priority', title: 'Someone on your right', skill: 'Give way', icon: '↗',
  start: 22, gate: 32, end: 44, trigger: 22, duration: 7,
  actor: { slot: 1, path: { type: 'line', from: [-8, -3], to: [-8, 38] } },
  objective: 'Let the orange car from your right pass.',
  coach: 'This is an unmarked junction. Look right: the orange car is approaching. Slow down and give it room to pass.',
  success: 'Good judgement. You gave the driver from your right room to cross.',
  rule: 'At an equal-priority junction, yield to drivers approaching from your right. Signs and specific exceptions can change this.',
  reference: 'RVV 1990 · Article 15', source: source(15),
  terms: ['voorrang', 'kruispunt'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('Two paved roads have equal priority and no signs. A car approaches from your right. Who goes first?', ['Whoever reached the junction first', 'You, because you are going straight', 'The driver from your right'], 2, 'At this equal-priority junction, the driver from your right has priority.'),
    q('At another equal-priority paved junction, a car approaches only from your left. What should you do?', ['Check it is safe to proceed; the right-hand priority rule favours you', 'Always give the car from your left priority', 'Proceed without looking because you have priority'], 0, 'Check the whole junction. Priority never removes your need to avoid a conflict.'),
  ],
};
