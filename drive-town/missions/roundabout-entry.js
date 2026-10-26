import { signs, STOPS, q } from './shared.js';

export default {
  id: 'roundabout-entry', shortTitle: 'Entering', kind: 'roundabout', route: 'roundabout',
  title: 'Traffic on the roundabout first', skill: 'Give way on entry', icon: '↺',
  start: 0, gate: STOPS.firstEntry - 2, end: STOPS.firstEntry + 8, trigger: 25, duration: 16,
  // The car from the south arm passes the learner's entry about halfway along its route.
  actor: { slot: 1, name: 'car on the roundabout', retire: true, clearAt: .56, path: { type: 'route', route: 'roundabout-car', from: 0, to: 100.36 } },
  objective: 'Give way to the car already on the roundabout, then enter when it has passed.',
  coach: 'This roundabout has a give-way sign and shark teeth at your entry. Traffic already on the roundabout comes from your left and goes first. Slow down, let it pass, then enter. Going straight on, you do not need to signal on entry.',
  success: 'You gave way to the car on the roundabout and entered when it had passed.',
  clearSuccess: 'You checked the roundabout, saw it was clear, and entered without an unnecessary stop.',
  rule: 'Most Dutch roundabouts have a give-way sign and shark teeth on each entry: traffic already on the roundabout has priority. Without signs or markings, the general rule applies and traffic from the right goes first.',
  reference: 'RVV 1990 · Articles 15, 62 and 80 / signs B6 and D1', source: signs,
  terms: ['rotonde', 'haaientanden', 'voorrang verlenen'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('Your entry to a roundabout has shark teeth and a give-way sign. A car is already on the roundabout, coming from your left. What do you do?',
      ['Give way to the car on the roundabout', 'Enter first because you come from its right', 'Enter quickly before it reaches you'], 0,
      'Shark teeth and the give-way sign mean traffic already on the roundabout has priority over you.'),
    q('A roundabout has no signs and no shark teeth. Who goes first?',
      ['Traffic already on the roundabout, always', 'Traffic from the right, which includes traffic entering', 'Whoever is driving the larger vehicle'], 1,
      'Without signs or markings, the general rule applies: give way to traffic from the right. Most Dutch roundabouts are signed so that circulating traffic goes first instead.'),
  ],
};
