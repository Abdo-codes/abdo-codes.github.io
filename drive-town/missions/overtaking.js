import { STREET_STOPS, article, q } from './shared.js';

const S = STREET_STOPS.overtake;
// A cyclist rides at 18 km/h on a two-way road. Variant: { traffic, zones, go, sign, mission? }. `go` says if a pass is allowed and safe.
// The oncoming car (speed < 0) comes in the left lane at 40 km/h. Its start s0 and the zones are first guesses (tuned in tests/overtake-zones.test.mjs).
const rider = { model: 'cyclist', length: 1.8, s0: 78, speed: 5, lateral: .9 };
const oncoming = s0 => ({ model: 'car', length: 4.5, s0, speed: -11.1, lateral: -3.5 });
const zebra = { kind: 'zebra', from: 125, to: 154 }, solid = (from, to) => ({ kind: 'solid', from, to });
const variants = [
  { traffic: [rider], zones: [], go: true },
  { traffic: [rider], zones: [zebra], go: false, sign: 'J22', mission: { gate: 125 } },
  { traffic: [rider], zones: [solid(110, 200)], go: false, mission: { gate: 110 } },
  { traffic: [rider, oncoming(210)], zones: [], go: false },
  { traffic: [rider, oncoming(360)], zones: [], go: true, sign: 'F1' },
  { traffic: [rider, oncoming(210)], zones: [solid(150, 200)], go: false },
];
export default {
  id: 'overtaking', shortTitle: 'Overtake', kind: 'street', route: 'street-overtake', signal: 'left',
  title: 'Overtaking', skill: 'Pass only when you may and can', icon: '↰',
  start: S.start, gate: S.gate, end: S.end, trigger: 0, initialActorTime: 0, speedLimit: 50, startSpeed: 18, driveSpeed: 18, slowSpeed: 10, lookSide: 'look-left',
  lane: { role: 'overtake', side: -1, from: 0, to: -3, back: 0, limit: S.limit, zones: [], go: true, traffic: variants[0].traffic, variants },
  objective: 'Look at the line, the crossing and the road ahead. Pass only when you may and can.',
  coach: 'A cyclist rides ahead. Check the centre line. Check for a zebra. Check for oncoming cars. If all is clear: left indicator, speed up, tap Overtake. If not: stay behind.',
  readyNote: 'Tap Overtake to move out. Tap Back to lane when you are past.',
  success: 'You checked the line and the road ahead.',
  rule: 'Overtake on the left (Article 11). Do not overtake just before or on a zebra crossing (Article 12). Do not cross a solid line between lanes (Article 76 paragraph 1). A broken line on your side may be crossed (Article 76 paragraph 2 part b). Be able to stop within the distance that is free (Article 19). An oncoming car takes that distance. Show your indicator before you move out (Article 55). Sign F1 bans motor vehicles from passing each other. A cyclist is not a motor vehicle, so you may pass it if the other rules allow.',
  reference: 'RVV 1990 · Articles 11, 12, 19, 55 and 76', source: article(12),
  terms: ['inhalen', 'doorgetrokken streep', 'zebrapad'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('A slow cyclist rides in front of you. A zebra crossing is just ahead. May you overtake?',
      ['Yes, if the line is broken', 'No; do not overtake just before a zebra crossing', 'Yes, if you sound the horn'], 1,
      'Article 12 forbids overtaking just before or on a pedestrian crossing.'),
    q('The centre line is solid and the road looks clear. May you overtake?',
      ['Yes, with the left indicator on', 'Yes, if no car is in view', 'No; do not cross a solid line between lanes'], 2,
      'A solid line between lanes may not be crossed (Article 76 paragraph 1). A clear view does not change this.'),
  ],
};
