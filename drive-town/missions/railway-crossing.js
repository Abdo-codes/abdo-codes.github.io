import { LAP, ROUTE_TURNS, routeAt, q } from './shared.js';

const RAIL_GATE = LAP * 2 + ROUTE_TURNS[1].end + 18.5, TRACK_X = routeAt(RAIL_GATE + 7).x;

export default {
  id: 'railway-crossing', shortTitle: 'Railway', kind: 'rail',
  actor: { slot: 6, path: { type: 'line', from: [TRACK_X, -58], to: [TRACK_X, 46] } },
  title: 'Wait beyond the train', skill: 'Watch lights and barriers', icon: '✕',
  start: LAP * 2 + 103, gate: RAIL_GATE,
  end: LAP * 2 + ROUTE_TURNS[1].end + 33.5,
  trigger: LAP * 2 + 104, duration: 14,
  objective: 'Wait before the crossing until the red lights are off and the barriers fully open. Check that you can clear the tracks.',
  coach: 'Red railway lights mean wait. Stop before the barrier. A passing train or a rising barrier is not permission: wait until the red lights go out and the barrier is fully up.',
  success: 'You waited for the red lights to go out and the barriers to open, then cleared the tracks.',
  clearSuccess: 'You checked the open crossing, inactive red lights and clear exit before crossing.',
  rule: 'Wait at flashing red railway lights and closed or moving barriers. Give trains priority; enter only when you can clear the whole crossing immediately.',
  reference: 'RVV 1990 · Articles 15a, 71 / ProRail', source: 'https://www.prorail.nl/veiligheid/overwegen/veilig-oversteken',
  terms: ['overweg'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('The train has passed and the barrier is rising, but the red railway lights still flash. What next?',
      ['Go around the end of the barrier', 'Keep waiting until red is off and the barrier fully open', 'Go if no second train is visible'], 1,
      'A passing train or rising barrier is not permission. Red lights still require you to wait; another train may follow.'),
    q('The lights are off and the barriers are fully open, but a queue blocks your exit beyond the tracks. What do you do?',
      ['Enter and stop between the rails', 'Follow the car ahead onto the tracks', 'Wait before the crossing until you can clear it completely'], 2,
      'Only enter a railway crossing when you can pass through and immediately clear the whole crossing.'),
  ],
};
