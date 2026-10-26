import { law, q } from './shared.js';

// The light is green, then amber for 4 s, then red for 8 s, then green. There is no cross traffic.
// Each variant is [km/h, gap to the line in metres at the amber onset]. The trigger starts the light clock at that gap.
const GATE = 165;
export default {
  id: 'amber-light', shortTitle: 'Amber', kind: 'amber', title: 'The light turns amber', skill: 'Amber means stop', icon: '◐',
  start: 90, gate: GATE, end: 181.7, trigger: 125, speedLimit: 50, startSpeed: 40, duration: 12, replayFrames: 240,
  phases: [[0, 4, 'amber'], [4, 12, 'red']], before: 'green',
  variants: [[40, 40], [40, 16], [30, 29], [40, 38], [50, 28], [30, 11]].map(([kmh, gap]) => ({ startSpeed: kmh, trigger: GATE - gap })),
  objective: 'Watch the light. When it turns amber, stop if you can stop in a safe way.',
  coach: 'The light is green now. It will turn amber. Look at the stop line. If you can stop, use Slow, then Stop. If you are too close, drive on.',
  success: 'You judged the amber light well.',
  rule: 'Amber means stop, unless you can no longer stop in a safe way. The law word is redelijkerwijs: in a reasonable way. Your speed and the distance to the stop line decide this.',
  reference: 'RVV 1990 · Article 68', source: `${law}#HoofdstukIII_Paragraaf3_Artikel68`,
  terms: ['geel licht', 'verkeerslicht', 'stopstreep'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('The light turns amber. The stop line is still far ahead. What do you do?', ['Speed up and cross', 'Stop before the line', 'Sound your horn'], 1, 'Amber means stop. You can stop in a safe way, so you stop (Article 68).'),
    q('The light turns amber when you are almost at the stop line and you drive fast. What do you do?', ['Go on through the junction', 'Stop on the line, whatever happens', 'Reverse behind the line'], 0, 'You cannot stop in a safe way, so you go on (Article 68).'),
  ],
};
