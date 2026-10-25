import { MERGE_STOPS, queue, article54, q } from './shared.js';

const S = MERGE_STOPS.zipper;
// The queue drives at 20 km/h in the lane that continues (+3.5 m) and never ends (span 560 m).
// An open gap is 30 m. At Slow (10 km/h) the gap rule keeps it open for about 4.7 s, and it returns every 16 to 18 s (every 37 s in the block of ten cars).
// A 22 m gap kept it open for only 1.9 s. The first variant starts beside a car, so the learner who matches 20 km/h must use Slow to reach the gap.
const OPEN = 30, line = (gaps, from) => queue({ speed: 20 / 3.6, lateral: 3.5, gaps, from, span: 560 });
const variants = [line([OPEN, 3, 3], 0), line([3, OPEN], 0), line([3, 3, 3, 3, 3, 3, 3, 3, 3, OPEN], 20), [], line([3, 3, OPEN], 20), line([3, OPEN], 20)];
export default {
  id: 'zipper-merge', shortTitle: 'Zipper', kind: 'merge', route: 'merge-zipper', signal: 'right',
  title: 'Take turns', skill: 'Merge where a lane ends', icon: '⇉',
  start: S.start, gate: S.gate, end: S.end, trigger: 0, initialActorTime: 0, speedLimit: 60, driveSpeed: 20, slowSpeed: 10, lookSide: 'look-right',
  lane: { role: 'merger', side: 1, from: 0, to: 3.5, openAt: S.sign, hatch: S.wedge, traffic: variants[0], variants },
  objective: 'Drive on in your lane. Merge from the sign, when a gap is open.',
  coach: 'Your lane ends ahead. Tap Drive to match the queue. At the sub-sign Ritsen vanaf hier, switch on your right indicator. Tap Merge when a gap is open.',
  readyNote: 'Merge is a button. Tap Merge when a gap is open.',
  success: 'You waited for a gap, signalled and merged.',
  rule: 'When two lanes become one, drivers in the ending lane drive on and merge near the end. A driver in the continuing lane may let one car in. This is courtesy, not a duty of the law. The CBR examiner expects you to give merging traffic the chance when a road narrows. The driver who changes lane lets other traffic go first (Article 54).',
  reference: 'RVV 1990 · Articles 54, 55 and 77', source: article54,
  terms: ['ritsen', 'einde rijstrook', 'voor laten gaan'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('Your lane ends. A sub-sign says Ritsen vanaf hier. What do you do?',
      ['Match the speed of the other lane and merge from here, when a gap is open', 'Merge at once, in front of the queue', 'Stop at the sign and wait until a driver waves you in'], 0,
      'This sub-sign tells you where to start the zipper (ANWB). You change lane, so you let other traffic go first (Article 54). Do not wait for a wave. Merge when a gap is open.'),
    q('You drive in the lane that continues. A car from the ending lane shows its indicator. What does the zipper method ask?',
      ['Speed up to close the gap', 'Let one car in, then drive on', 'Brake hard and stop'], 1,
      'Zipper works when drivers let one car in at a time. The law puts the duty on the car that changes lane (Article 54). Letting one in is courtesy.'),
  ],
};
