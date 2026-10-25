import { signs, LAP, q } from './shared.js';

export default {
  id: 'changing-limit', shortTitle: '50 → 30', kind: 'limit', title: 'A quieter street ahead', skill: '50 becomes 30', icon: '30',
  start: LAP + 124, gate: LAP + 158, end: LAP + 166, trigger: Infinity, duration: 0,
  speedLimit: 50, changeAt: LAP + 156, nextLimit: 30,
  objective: 'Choose a comfortable pace on the 50 road. Slow to 30 or below before the new 30 sign.',
  coach: 'This road allows up to 50. Drive uses a comfortable 40 here. A 30 sign is ahead: slow before you reach it. The new maximum starts at the sign.',
  success: 'You reached the new sign at 30 or below and stayed within the quieter street’s limit.',
  rule: 'A1 sets the maximum speed. Reach a lower posted limit by its sign, and choose an even lower speed when conditions require it.',
  reference: 'RVV 1990 · Article 62 / sign A1', source: signs,
  terms: ['maximumsnelheid', 'bebouwde kom'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('A 50 road changes to 30 at the next sign. When should you be at 30 or below?', ['After travelling 30 metres past it', 'By the time you reach the sign', 'Only when the coach announces it'], 1, 'Anticipate the lower maximum and reach it by the sign.'),
    q('You passed the new 30 sign on an otherwise empty street. What maximum applies?', ['50 because the road is empty', '40 because that was the Drive preset', '30, with a lower speed when needed'], 2, 'The new posted maximum applies from the sign, regardless of an earlier preset.'),
  ],
};
