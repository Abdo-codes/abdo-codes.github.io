import { source, q } from './shared.js';

export default {
  id: 'zebra', shortTitle: 'Crossing', title: 'People come first', skill: 'Protect pedestrians', icon: '≋',
  start: 44, gate: 78, end: 89, trigger: 63, duration: 11, crossingExit: -32.4,
  actor: { slot: 2, path: { type: 'line', from: [-46, 2], to: [-30, 2] } },
  objective: 'Turn right slowly, then let the pedestrian finish crossing the zebra.',
  coach: 'First turn right slowly. After the turn, check the zebra crossing and let the pedestrian cross before you continue.',
  success: 'You made space for someone on foot. That is the kind of driver people trust.',
  rule: 'Let pedestrians who are crossing, or clearly about to cross, a zebra crossing go first.',
  reference: 'RVV 1990 · Article 49', source: source(49),
  terms: ['zebrapad', 'voor laten gaan'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('A person is clearly about to step onto an unsignalised zebra. What do you do?', ['Continue until they enter your lane', 'Let them cross before you proceed', 'Sound the horn and keep going'], 1, 'Give way to people crossing or clearly about to cross this zebra.'),
    q('The zebra looks clear after a pedestrian crosses. What next?', ['Wait for a coach message before checking', 'Accelerate immediately without looking', 'Check for others, then continue safely'], 2, 'Re-check the crossing rather than treating a timer as permission.'),
  ],
};
