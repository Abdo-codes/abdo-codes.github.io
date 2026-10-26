import { signs, LAP, q } from './shared.js';

export default {
  id: 'narrow-passage', shortTitle: 'Narrow road', kind: 'narrow',
  // The oncoming car swings left around the cones, then back into its lane.
  actor: { slot: 1, path: { type: 'lane', from: -21, to: 16, base: -40, shifts: [{ start: -21, over: 4, by: 4 }, { start: -9, over: 7, by: -4 }] } },
  title: 'One car at a time', skill: 'Read priority at a narrowing', icon: '↕',
  start: LAP * 2 + 44, gate: LAP * 2 + 84, end: LAP * 2 + 103,
  trigger: LAP * 2 + 58, duration: 12, approachDelay: 2,
  objective: 'The circular F5 sign gives the oncoming car priority through the narrow passage.',
  coach: 'The red-bordered sign has a red arrow for your direction. Give the oncoming car priority. Wait before the narrowing until it has cleared, then check and continue.',
  success: 'You respected F5 and let the oncoming car clear the narrow passage.',
  clearSuccess: 'You read F5, checked the empty passage, and continued safely without an unnecessary stop.',
  rule: 'At F5, give priority to oncoming traffic. F6 is the blue sign granting priority over oncoming vehicles; either sign still requires a safe, clear passage.',
  reference: 'RVV 1990 · Article 62 / signs F5 and F6', source: signs,
  terms: ['tegemoetkomende bestuurders', 'voor laten gaan'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('A circular red-bordered F5 sign faces you at a narrow passage. An oncoming car approaches. What applies?',
      ['Your red arrow gives you priority', 'Both cars should enter together slowly', 'Give the oncoming car priority'], 2,
      'F5 requires you to give priority to oncoming vehicles. Wait before the narrowing if necessary.'),
    q('At another narrowing you face the blue F6 sign, but an oncoming vehicle is already in the passage. What is safe?',
      ['Wait for it to clear before entering', 'Force your way in because F6 favours you', 'Treat F6 as a mandatory full STOP'], 0,
      'F6 favours your direction, but priority never makes an occupied passage safe to enter.'),
  ],
};
