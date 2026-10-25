import { MERGE_STOPS, article54, q } from './shared.js';

const S = MERGE_STOPS.room;
// You drive in the right-hand main lane. A driver on the acceleration lane (+3.5 m) moves into your lane at s 175 to 195 and crosses at 185.
const LORRY = { model: 'lorry', length: 9.5, speed: 30 / 3.6, signal: 'left' }, CAR = { model: 'car', length: 4.5, speed: 40 / 3.6, signal: 'left' };
const merger = (kind, s0) => ({ ...kind, s0, lateral: 3.5, shifts: [{ at: 175, over: 20, by: -3.5 }] });
// One cosmetic car in the left lane shows that moving left is not free. It does not enter the rules.
const side = { model: 'car', length: 4.5, s0: 0, speed: 50 / 3.6, lateral: -3.5 };
const variants = [merger(LORRY, 86), merger(CAR, 106), merger(LORRY, 90), merger(CAR, 118), merger(LORRY, 94), merger(CAR, 98)].map(entry => [entry, side]);
export default {
  id: 'room-to-merge', shortTitle: 'Room', kind: 'merge', route: 'merge-room',
  title: 'Make room', skill: 'Help a merging driver', icon: '⇆',
  start: S.start, gate: S.gate, end: S.end, trigger: 0, initialActorTime: 0, speedLimit: 60, startSpeed: 50, driveSpeed: 40, slowSpeed: 30, lookSide: 'look-right',
  lane: { role: 'host', side: 1, from: 0, narrow: S.narrow, traffic: variants[0], variants },
  objective: 'Watch the acceleration lane. Give room if the driver cannot merge.',
  coach: 'A lorry on the lane cannot reach your speed. Slow down early. Tap Drive for 40 km/h, or use Slow, so it can merge in front of you.',
  readyNote: 'No Merge button here. You keep your lane and change your speed.',
  success: 'You slowed down and the driver merged safely.',
  rule: 'A merging driver lets you go first (Article 54). A careful driver still slows down early to help a merger who cannot merge. This is a safe-driving habit, not a rule of the law. If the driver can merge, keep your lane and speed.',
  reference: 'RVV 1990 · Article 54', source: article54,
  terms: ['invoegstrook', 'voor laten gaan'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('A lorry on the acceleration lane cannot reach your speed. The lane ends soon. What helps?',
      ['Speed up so it stays behind you', 'Keep your speed because the lorry must give way', 'Slow down, or move left if it is safe'], 2,
      'The lorry must give way (Article 54). But a careful driver helps a driver who cannot merge. Slow down or move left if it is safe.'),
    q('A car on the lane has a good gap and your speed. Should you move left?',
      ['No, keep your lane and speed', 'Yes, always move left near an acceleration lane', 'Brake to a stop'], 0,
      'When the merger has a real chance, stay in your lane. Needless moves and braking hinder other drivers.'),
  ],
};
