import { signs, LAP, q } from './shared.js';

export default {
  id: 'yield-sign', shortTitle: 'Yield', kind: 'yield',
  actor: { slot: 1, path: { type: 'line', from: [-45, -18], to: [-22, -18] } },
  title: 'The triangle has a say', skill: 'Recognise signed priority', icon: '▽',
  start: LAP + 47, gate: LAP + 99, end: LAP + 124, trigger: LAP + 77, duration: 10.5, approachDelay: 2.5, speedLimit: 50,
  objective: 'Give priority at the yield sign and shark teeth. Continue once the crossing road is clear.',
  coach: 'The triangular yield sign and white road triangles (shark teeth) give the crossing road priority. This car comes from your left. Slow early and let it pass. Stop if needed.',
  success: 'You respected the signed priority and entered after the crossing car cleared.',
  rule: 'The B6 yield sign and white triangular road markings (shark teeth) require you to give priority to drivers on the crossing road. Unlike STOP, they do not always require a full stop.',
  reference: 'RVV 1990 · Articles 62, 80 / sign B6', source: signs,
  terms: ['haaientanden', 'voorrang verlenen', 'kruispunt'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('A yield sign faces you. A car comes from your left on the crossing road. What applies?', ['The normal right-hand rule means you go first', 'You go first after sounding the horn', 'Give priority to the crossing car'], 2, 'The yield sign gives the crossing road priority, including traffic from the left.'),
    q('At the same yield sign the crossing road is now clear. Must you always stop?', ['No; assess the road and continue if safe', 'Yes; every yield sign requires a complete stop', 'No; you can stop checking for traffic'], 0, 'Yield requires priority, with a stop when necessary; STOP additionally requires a full stop.'),
  ],
};
