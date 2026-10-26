import { MERGE_STOPS, queue, article54, q } from './shared.js';

const S = MERGE_STOPS.lane;
// Main-road cars drive at 50 km/h in the lane to the left (-3.5 m): twelve cars in groups of three, with a long gap after each group.
const flow = from => queue({ speed: 50 / 3.6, lateral: -3.5, gaps: [6, 6, 48], from, count: 12 });
const variants = [flow(-58), flow(260), flow(-80), flow(300), flow(-95), flow(260)];
export default {
  id: 'acceleration-lane', shortTitle: 'Joining', kind: 'merge', route: 'merge-lane', signal: 'left',
  title: 'Join the road', skill: 'Merge from an acceleration lane', icon: '↗',
  start: S.start, gate: S.gate, end: S.end, trigger: 0, initialActorTime: 0, speedLimit: 60, startSpeed: 30, driveSpeed: 50, slowSpeed: 30, lookSide: 'look-left',
  lane: { role: 'merger', side: -1, from: 0, to: -3.5, narrow: S.narrow, traffic: variants[0], variants },
  objective: 'Build speed on the lane. Merge left when there is a gap.',
  coach: 'Use the lane to reach the speed of the road. Tap Drive to reach 50. Switch on your left indicator, check the gap, then choose Merge. Use Slow to drive behind a group of cars.',
  readyNote: 'Model road: real entries are faster and longer.',
  success: 'You matched the speed, signalled and merged into a gap.',
  rule: 'Traffic on the main road goes first. Use the lane to match its speed. Signal, then merge in one smooth move. To merge before the lane ends is a safe-driving habit from the CBR driving procedure, not an article.',
  reference: 'RVV 1990 · Articles 1, 54 and 55', source: article54,
  terms: ['invoegstrook', 'invoegen', 'voor laten gaan'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('You drive from an acceleration lane onto the main road. Who goes first?',
      ['You, because you signal', 'Traffic on the main road', 'The faster car'], 1,
      'Merging from an acceleration lane is a special manoeuvre. Let other traffic go first (Article 54). A signal gives no priority.'),
    q('The lane is almost full and no gap is open. What is best?',
      ['Keep your speed. Other drivers must make room', 'Force your way in', 'Adjust your speed to fit into a gap. Stop only if you must'], 2,
      'Do not expect other drivers to make room. You change lane, so you let other traffic go first (Article 54). If you must stop, stop early so you keep lane to build speed.'),
  ],
};
