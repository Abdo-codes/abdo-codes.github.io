import { article } from './missions/shared.js';

// Hazard clips of chapter 07 (tram stop, cycle strip, overtaking). The fields are those of hazard-clips.js.
// `actorTime` is the clock of the road users at the freeze (tram A and its passengers, the riders, the oncoming car). `actorTime2` is the second clock of
// lesson 21 (tram B at the junction; it starts at 0 when the car passes s 175). `signal: false` is a car that plans no move, so its left indicator stays off.
// The answers are those of expectedAnswer in hazard.js. The times were tuned with the picture at the freeze (tests/street-clips.test.mjs).
// The lessons of the cycle strip give no rule for the room beside a cyclist, so those clips say "give room" and name no number.
// `view` moves the camera of a clip (see laneCamera in lane-camera.js; a positive `lookSide` aims to the side of the lesson). The Following camera of these lessons sits 17 m behind
// the car, so a road user 35 m ahead is only a few dozen pixels. NEAR is 9 m behind the car and looks further ahead, so the tram, the people and the van show larger.
const NEAR = { back: 9, side: 0, up: 3.6, lookBack: -26, lookSide: 2, lookUp: 1.4 };
export const STREET_CLIPS = [
  {
    id: 'tram-doors-open', mission: 'tram-street', variation: 0, speed: 22, lead: 8, actorTime: 11.6, view: NEAR, answer: 'brake',
    topic: 'Trams',
    explanation: 'The tram stands at its stop and the doors are open on your side. People step out onto the road. Brake and stop before the line (a lesson marker), so they have time to reach the kerb.',
  },
  {
    id: 'tram-arriving', mission: 'tram-street', variation: 0, speed: 30, lead: 36, actorTime: 4.4, answer: 'release',
    topic: 'Trams',
    explanation: 'A tram brakes into its stop beside your lane. The doors open soon and people step out. Release the accelerator now, so you can stop before the line (a lesson marker).',
  },
  {
    id: 'tram-doors-closed', mission: 'tram-street', variation: 1, speed: 22, lead: 8, actorTime: 13, view: NEAR, answer: 'nothing',
    topic: 'Trams',
    explanation: 'The tram stands at its stop, but the doors are shut and nobody is on the road. You do not need to brake. Pass with care and watch for people.',
  },
  {
    id: 'tram-crossing-far', mission: 'tram-street', variation: 4, speed: 22, lead: 21, actorTime2: 2.5, view: { ...NEAR, back: 6, lookBack: -38, lookSide: 14 }, answer: 'release',
    topic: 'Trams', reference: 'RVV 1990 · Article 15', source: article(15),
    explanation: 'A tram comes along the cross track from the left. A tram has priority at a junction, also from the left. Release the accelerator now and be ready to stop at the line.',
  },
  {
    id: 'strip-cyclist-pulls-out', mission: 'cycle-lane', variation: 0, speed: 22, lead: 14, actorTime: 8.8, answer: 'brake',
    topic: 'Cycle strips',
    explanation: 'A van stands on the cycle strip, so the cyclist rides out into your lane to pass it. Brake and give the cyclist room to go round the van.',
  },
  {
    id: 'strip-cyclist-nears-van', mission: 'cycle-lane', variation: 0, speed: 30, lead: 27, actorTime: 7, view: { ...NEAR, lookBack: -24, lookSide: 0 }, answer: 'release',
    topic: 'Cycle strips',
    explanation: 'A van stands on the cycle strip and a cyclist comes up behind it. The cyclist must ride out into your lane. Release the accelerator early and give room.',
  },
  {
    id: 'strip-clear', mission: 'cycle-lane', variation: 1, speed: 22, lead: 20, actorTime: 8, answer: 'nothing',
    topic: 'Cycle strips',
    explanation: 'The cyclist stays on the cycle strip and no van blocks the way. The cyclist does not come into your lane, so you do not need to brake. Keep looking.',
  },
  {
    id: 'cyclists-abreast', mission: 'cycle-lane', variation: 3, speed: 30, lead: 20, actorTime: 8.5, answer: 'brake',
    topic: 'Cycle strips', reference: 'RVV 1990 · Article 3', source: article(3),
    explanation: 'Two cyclists ride side by side in your lane. Cyclists may do this (Article 3). Brake and stay behind them.',
  },
  {
    id: 'overtake-zebra', mission: 'overtaking', variation: 1, speed: 40, lead: 40, actorTime: 6, signal: false, answer: 'release',
    topic: 'Overtaking', reference: 'RVV 1990 · Article 12', source: article(12),
    explanation: 'A slow cyclist rides ahead and a zebra crossing lies in front of it. Do not overtake just before a zebra crossing. Release the accelerator and stay behind the cyclist.',
  },
  {
    id: 'overtake-solid-line', mission: 'overtaking', variation: 2, speed: 40, lead: 22, actorTime: 6, signal: false, answer: 'brake',
    topic: 'Overtaking', reference: 'RVV 1990 · Article 76', source: article(76),
    explanation: 'The centre line ahead is solid and you close in on a slow cyclist. Do not cross a solid line between lanes. Brake and stay behind the cyclist.',
  },
  {
    id: 'overtake-oncoming', mission: 'overtaking', variation: 3, speed: 40, lead: 36, actorTime: 6, signal: false, view: { ...NEAR, lookBack: -30, lookSide: 0 }, answer: 'release',
    topic: 'Overtaking', reference: 'RVV 1990 · Article 19 (our reading for an oncoming car)', source: article(19),
    explanation: 'A car comes towards you and takes the free distance that you need (Article 19). Release the accelerator and stay behind the cyclist.',
  },
  {
    id: 'overtake-clear', mission: 'overtaking', variation: 0, speed: 40, lead: 12, actorTime: 5, merge: true, answer: 'nothing',
    topic: 'Overtaking', reference: 'RVV 1990 · Articles 11 and 55', source: article(11),
    explanation: 'The line is broken, no zebra crossing is near and the road ahead is free. Your left indicator is on. Keep your speed and pass the cyclist on the left.',
  },
];
