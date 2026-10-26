import { STREET_STOPS, article, q } from './shared.js';
import { stopTimes } from '../lane-entry.js';

const S = STREET_STOPS.tram, H = Math.PI / 2;
// Tram A brakes into a stop beside the lane, stands with its doors open on the learner side and leaves. Tram B crosses the road at the junction.
// Times are on the actor clock (seconds) and first guesses. T is the moment tram A stands still. Tram B uses the second clock (clock 2), which starts at s 175.
const tram = (doors = true) => ({ model: 'tram', length: 24, s0: 90, speed: 6.94, lateral: -3.3, stop: { at: 138, decel: 1.2, wait: 8, accel: .9, doors } });
const T = stopTimes(tram()).arrive;
const alight = s0 => ({ model: 'walker', length: .6, s0, speed: 0, lateral: -1.9, turn: -H, appear: T + 1, drift: { t0: T + 1.1, t1: T + 4.45, to: 2.4 } });
const board = { model: 'walker', length: .6, s0: 134, speed: 0, lateral: 2.4, turn: H, appear: T - 2, vanish: T + 4.1, drift: { t0: T + 1, t1: T + 4, to: -1.9 } };
const crossing = { clock: 2, model: 'tram', length: 24, s0: 215, speed: 0, lateral: -40, turn: -H, drift: { t0: 0, t1: 11.6, to: 40 } };
const stopBeat = [tram(), alight(128), alight(140)];
const variants = [
  { traffic: [...stopBeat, crossing] }, { traffic: [tram(false)] }, { traffic: [tram(), board, crossing] },
  { traffic: [crossing] }, { traffic: [crossing], mission: { gate: 205, start: 150 } }, { traffic: [], mission: { gate: 205, start: 150 } },
];
export default {
  id: 'tram-street', shortTitle: 'Trams', kind: 'street', route: 'street-tram',
  title: 'Trams and passengers', skill: 'Give way to passengers and trams', icon: 'TRAM',
  start: S.start, gate: S.gate, end: S.end, trigger: 0, initialActorTime: 0, speedLimit: 30, startSpeed: 22, driveSpeed: 22, slowSpeed: 10, lookSide: 'look-left',
  lane: { role: 'tram', side: -1, from: 0, stop: { line: S.gate, zone: [S.gate, 160] }, cross: { line: 205, zone: [205, 225] }, trigger2: 175, traffic: variants[0].traffic, variants },
  objective: 'Drive on. Give the passengers time. Let the tram go first.',
  coach: 'A tram stops ahead. Tap Slow when it brakes. Stop before the white line while the doors are open and people are on the road. The line is a lesson marker. At the crossing, let the tram go first.',
  readyNote: 'No Merge button here. You control your speed.',
  success: 'You gave the passengers time and let the tram go first.',
  rule: 'A tram has priority at a junction. You give way to it, also when it comes from the left (Article 15). When a tram stands at a stop, give the passengers the chance to get on and off (Article 52). You may pass a tram on the right (Article 11).',
  reference: 'RVV 1990 · Articles 15 and 52', source: article(52),
  terms: ['tram', 'tramhalte', 'voorrang verlenen'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('A tram stands at a stop with no island. The doors are open on your side and people cross the road. What do you do?',
      ['Pass at once and slowly', 'Stop and give the people time', 'Pass at once and use the horn'], 1,
      'You give passengers the chance to get on or off (Article 52). Go on when they have left the road.'),
    q('You come to a junction with no priority signs or markings. A tram comes from your left. What do you do?',
      ['Go first, because you use your indicator', 'Go first, because the tram is slow', 'Let the tram go first'], 2,
      'A tram has priority at a junction, also from the left (Article 15 paragraph 2 part b).'),
  ],
};
