import { signs, LAP, q } from './shared.js';

export default {
  id: 'stop-sign', shortTitle: 'STOP', kind: 'stop',
  actor: { slot: 1, path: { type: 'line', from: [-8, -3], to: [-8, 38] } },
  title: 'A proper full stop', skill: 'STOP and give way', icon: 'STOP',
  start: 227, gate: LAP + 32.5, end: LAP + 47, trigger: LAP + 10, duration: 7, speedLimit: 50,
  objective: 'Stop completely before the line, then give way to the crossing car.',
  coach: 'The red STOP sign requires a full stop before the white line. A rolling crawl does not count. Let the crossing car clear, then continue.',
  success: 'You stopped completely at the line and gave the crossing car priority.',
  rule: 'At sign B7, stop and give priority to drivers on the crossing road. Stopping alone does not give you priority.',
  reference: 'RVV 1990 · Article 62 / sign B7', source: signs,
  terms: ['stopstreep', 'voorrang verlenen'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('The road is empty at a STOP sign. What is required?', ['Stop fully at the line, then check before going', 'Keep rolling below 10', 'Stop only if a crossing car arrives'], 0, 'STOP requires a complete stop even when the crossing road appears empty.'),
    q('You stopped fully at STOP. A crossing car is now approaching. What next?', ['Go because your stop gives you priority', 'Give priority to the crossing car', 'Go if you signal first'], 1, 'Stopping fulfils one obligation; it does not give you priority over crossing drivers.'),
  ],
};
