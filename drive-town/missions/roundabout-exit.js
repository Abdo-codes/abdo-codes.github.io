import { law, STOPS, q } from './shared.js';

export default {
  id: 'roundabout-exit', shortTitle: 'Leaving', kind: 'roundabout', route: 'roundabout', signal: 'right',
  title: 'Say where you are going', skill: 'Signal right to leave', icon: '↱',
  start: STOPS.firstEntry + 8, gate: STOPS.firstExit, end: STOPS.firstExit + 16, trigger: Infinity, duration: 0,
  objective: 'Go straight on: switch on your right indicator before you leave the roundabout.',
  coach: 'You are going straight on, which is the second exit. Keep going around, and switch on your right indicator after you pass the first exit, before you leave.',
  success: 'You signalled right before leaving, so others knew where you were going.',
  rule: 'Leaving a roundabout is a change of direction: signal right in good time before you exit. Going straight on, no signal is needed on entry.',
  reference: 'RVV 1990 · Article 55', source: `${law}#HoofdstukII_Paragraaf24_Artikel55`,
  terms: ['rotonde', 'richtingaanwijzer'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('You are about to take your exit off a roundabout. What do you do with your indicator?',
      ['Signal right before you leave', 'Signal left until you leave', 'Nothing; roundabouts need no signals'], 0,
      'Leaving a roundabout is a change of direction, so signal right in good time before your exit.'),
    q('You go straight on at a roundabout. Do you need to signal as you enter?',
      ['Yes, always signal left on entry', 'No; signal right before you leave', 'Yes, switch on your hazard lights'], 1,
      'Going straight on, no signal is required on entry. Signal right before your exit.'),
  ],
};
