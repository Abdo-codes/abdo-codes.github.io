import { source, q } from './shared.js';

export default {
  id: 'cyclist', shortTitle: 'Cyclist', title: 'One last look', skill: 'Turn safely', icon: '↱',
  start: 89, gate: 99, end: 123, trigger: 89, duration: 9,
  actor: { slot: 3, path: { type: 'line', from: [-30.8, -1], to: [-30.8, -35] } },
  objective: 'Signal right and let the cyclist continue straight.',
  coach: 'Your route turns right. Use the right indicator, check beside and behind for the cyclist, and let them continue straight before you turn.',
  success: 'A thoughtful turn. You signalled and waited for the cyclist to pass.',
  rule: 'When turning, yield to traffic continuing on the same road beside or close behind you. Indicate your turn.',
  reference: 'RVV 1990 · Articles 18 and 55', source: source(18),
  terms: ['afslaan', 'richtingaanwijzer', 'voor laten gaan'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('You turn right while a cyclist beside you continues straight on the same road. What matters?', ['Indicate and let the cyclist continue first', 'Your indicator gives you priority', 'The cyclist must stop because you are ahead'], 0, 'Indicating shows intention; turning traffic still yields to traffic continuing on the same road.'),
    q('You signalled right and the cyclist has passed. What should you do?', ['Assume nobody else can approach', 'Check beside and behind again, then turn if safe', 'Cancel the indicator before starting the turn'], 1, 'Keep checking for traffic; a signal never makes the path safe by itself.'),
  ],
};
