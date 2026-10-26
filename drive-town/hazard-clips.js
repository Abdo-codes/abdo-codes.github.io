import { law, annex } from './missions/shared.js';
import { LIGHTS_CLIPS } from './hazard-clips-lights.js';
import { STREET_CLIPS } from './hazard-clips-street.js';
import { HIDDEN_CLIPS } from './hazard-clips-hidden.js';

// Hazard-perception situations built from the existing missions.
// `lead` is the distance in metres from the freeze point to the mission's decision line;
// `variation` uses the Independent timing variants (odd numbers are already-clear roads);
// `actorTime` optionally sets the road user's clock at the freeze point.
// `merge: true` presses Merge at the freeze, so the follow-up shows the move (merge lessons, gap open).
// `view` moves the camera of a clip so the road user stays in the picture on a phone (see laneCamera in lane-camera.js; `lookBack` is minus the metres ahead that the camera aims at,
// `lookSide` is the metres to the right at that point). `quiet: true` hides the cars of the town, so no car other than the road users of the clip shows at the edge of the picture.
// Each clip shows the `reference` and `source` of its mission unless it sets its own, where the
// mission's article is not the one this clip teaches. The roundabout cycle-path clips keep the ANWB source of their
// mission: no RVV article says that a cycle path round a roundabout is part of it. Tests check every link.
const rvv = anchor => `${law}#${anchor}`;
const HATCHED = { reference: 'RVV 1990 · Article 77', source: rvv('HoofdstukIII_Paragraaf4_Artikel77') };
// The merge lessons look from 40 m behind, so the cars are tiny in a picture of a clip. The two zipper clips with a pin look from 9 m behind, 24 m ahead.
const ZIPPER_VIEW = { back: 9, side: 0, up: 3.4, lookBack: -24, lookSide: 1, lookUp: .6 };
const GIVE_WAY = { reference: 'RVV 1990 · Article 80 / sign B6', source: rvv('HoofdstukIII_Paragraaf4_Artikel80') };
export const HAZARD_CLIPS = [
  {
    id: 'quiet-street', mission: 'gentle-start', variation: 0, speed: 22, lead: 10, answer: 'nothing',
    topic: 'Speed',
    explanation: 'A quiet 30 km/h street with nobody near the road, and you are below the limit. Keep your pace: no action is needed.',
  },
  {
    id: 'zebra-stepping-out', mission: 'zebra', variation: 0, speed: 22, lead: 10, actorTime: 3.5, answer: 'brake',
    topic: 'Pedestrians',
    explanation: 'A pedestrian is stepping onto the zebra crossing just ahead. They go first, and this close only braking stops you in time.',
  },
  {
    id: 'thirty-ahead', mission: 'changing-limit', variation: 0, speed: 40, lead: 18, answer: 'release',
    topic: 'Speed limits', reference: 'RVV 1990 · Article 62 / sign A1', source: annex('A'),
    explanation: 'A 30 sign is ahead and you are doing 40. Release the accelerator now so you reach the sign at 30 or below; hard braking is not needed yet.',
  },
  {
    id: 'red-light-close', mission: 'traffic-light', variation: 0, speed: 40, lead: 15, answer: 'brake',
    topic: 'Traffic lights',
    explanation: 'The light is red and the stop line is close. Brake to stop before the line.',
  },
  {
    id: 'zebra-empty', mission: 'zebra', variation: 1, speed: 22, lead: 10, answer: 'nothing',
    topic: 'Pedestrians',
    explanation: 'The zebra crossing is empty and the pedestrian has already reached the far side. Keep going at this calm pace and keep looking.',
  },
  {
    id: 'car-from-right', mission: 'right-of-way', variation: 0, speed: 22, lead: 8, actorTime: 3.5, quiet: true, answer: 'brake',
    topic: 'Priority',
    explanation: 'At this unmarked junction the car from your right has priority and is about to cross your path. Brake and let it go first.',
  },
  {
    id: 'bus-signalling', mission: 'departing-bus', variation: 0, speed: 18, lead: 18, view: { lookBack: -24, lookSide: 11 }, quiet: true, answer: 'release',
    topic: 'Buses',
    explanation: 'Inside a built-up area, a bus is signalling to leave its stop. Release the accelerator to give it room; it is still far enough away that braking is not needed yet.',
  },
  {
    id: 'green-light', mission: 'traffic-light', variation: 1, speed: 40, lead: 15, answer: 'nothing',
    topic: 'Traffic lights',
    explanation: 'The light is green and the junction is clear. Continue: braking here would surprise traffic behind you.',
  },
  {
    id: 'cyclist-beside', mission: 'cyclist', variation: 0, speed: 22, lead: 8, actorTime: 2.1, answer: 'brake',
    topic: 'Cyclists', reference: 'RVV 1990 · Article 18', source: rvv('HoofdstukII_Paragraaf7_Artikel18'),
    explanation: 'You are about to turn right and the cyclist beside you is going straight on. They go first: brake and let them pass before you turn.',
  },
  {
    id: 'narrowing-oncoming', mission: 'narrow-passage', variation: 0, speed: 22, lead: 10, actorTime: 7, answer: 'brake',
    topic: 'Narrow roads', reference: 'RVV 1990 · Article 62 / sign F5', source: annex('F'),
    explanation: 'The F5 sign gives the oncoming car priority, and it is already in the narrowing. Brake and wait before the narrowing until it has passed.',
  },
  {
    id: 'stop-sign', mission: 'stop-sign', variation: 0, speed: 40, lead: 20, answer: 'brake',
    topic: 'STOP sign', reference: 'RVV 1990 · Article 79 / sign B7', source: rvv('HoofdstukIII_Paragraaf4_Artikel79'),
    explanation: 'A STOP sign requires a complete stop at the line, even if the crossing road looks clear. Brake now.',
  },
  {
    id: 'yield-car-left', mission: 'yield-sign', variation: 0, speed: 22, lead: 20, actorTime: 3, answer: 'release',
    topic: 'Signed priority', ...GIVE_WAY,
    explanation: 'Beyond the empty zebra, shark teeth and a yield sign give the crossing road priority, and a car is coming from the left. Release the accelerator so you can give way if needed.',
  },
  {
    id: 'railway-red', mission: 'railway-crossing', variation: 0, speed: 30, lead: 18, answer: 'brake',
    topic: 'Railway crossings', reference: 'RVV 1990 · Article 71', source: rvv('HoofdstukIII_Paragraaf3_Artikel71'),
    explanation: 'The railway lights are flashing red and the barrier is close. Brake and stop before it.',
  },
  {
    id: 'roundabout-car-left', mission: 'roundabout-entry', variation: 0, speed: 22, lead: 8, actorTime: 6.4, answer: 'brake',
    topic: 'Roundabouts', ...GIVE_WAY,
    explanation: 'A car is already on the roundabout, coming from your left, and you are at the shark teeth. Brake and let it pass before you enter.',
  },
  {
    id: 'roundabout-approach', mission: 'roundabout-entry', variation: 0, speed: 22, lead: 25, actorTime: 4, answer: 'release',
    topic: 'Roundabouts', ...GIVE_WAY,
    explanation: 'A roundabout with shark teeth is ahead and a car is heading onto it. Release the accelerator so you can give way at the line if it is still coming.',
  },
  {
    id: 'roundabout-slow-car', mission: 'roundabout-entry', variation: 2, speed: 22, lead: 10, actorTime: 9, answer: 'brake',
    topic: 'Roundabouts', ...GIVE_WAY,
    explanation: 'The car on the roundabout is about to pass your entry. Traffic on the roundabout goes first: brake and wait.',
  },
  {
    id: 'roundabout-from-thirty', mission: 'roundabout-entry', variation: 0, speed: 30, lead: 30, actorTime: 3, view: { lookBack: -35, lookSide: -12 }, answer: 'release',
    topic: 'Roundabouts', ...GIVE_WAY,
    explanation: 'You are approaching a roundabout at 30 with traffic heading onto it. Release the accelerator early; you will need a low speed at the give-way line.',
  },
  {
    id: 'roundabout-empty', mission: 'roundabout-entry', variation: 1, speed: 22, lead: 20, answer: 'nothing',
    topic: 'Roundabouts', ...GIVE_WAY,
    explanation: 'The roundabout is empty and you are already at a calm speed. Keep your pace while you keep checking the roundabout.',
  },
  {
    id: 'roundabout-leaving-clear', mission: 'roundabout-exit', variation: 0, speed: 22, lead: 8, answer: 'nothing',
    topic: 'Leaving a roundabout',
    explanation: 'You are signalling right and your exit is clear. Keep going: no braking is needed.',
  },
  {
    id: 'roundabout-circulating', mission: 'roundabout-exit', variation: 0, speed: 22, lead: 16, answer: 'nothing',
    topic: 'Leaving a roundabout',
    explanation: 'You are on an empty roundabout at a calm speed. Keep going and signal right before your exit.',
  },
  {
    id: 'cycle-path-crossing', mission: 'roundabout-cyclist', variation: 0, speed: 18, lead: 6, actorTime: 4, view: { lookSide: 5 }, answer: 'brake',
    topic: 'Roundabout cycle paths',
    explanation: 'A cyclist on the cycle path around the roundabout is about to cross your exit. The path is close to the roundabout, so it is part of it. The cyclist goes first: brake.',
  },
  {
    id: 'cycle-path-ahead', mission: 'roundabout-cyclist', variation: 0, speed: 22, lead: 20, actorTime: 1, answer: 'release',
    topic: 'Roundabout cycle paths',
    explanation: 'A cyclist is riding around the roundabout towards your exit. Release the accelerator so you can give way when you leave.',
  },
  {
    id: 'cycle-path-clear', mission: 'roundabout-cyclist', variation: 1, speed: 18, lead: 8, answer: 'nothing',
    topic: 'Roundabout cycle paths',
    explanation: 'The cycle path at your exit is clear and you are signalling right. Leave at this calm pace.',
  },
  {
    id: 'cycle-path-slow-rider', mission: 'roundabout-cyclist', variation: 2, speed: 18, lead: 8, actorTime: 6, answer: 'brake',
    topic: 'Roundabout cycle paths',
    explanation: 'A slower cyclist is still crossing your exit on the roundabout cycle path. Brake and let them pass.',
  },
  {
    id: 'cycle-path-passed', mission: 'roundabout-cyclist', variation: 3, speed: 18, lead: 14, answer: 'nothing',
    topic: 'Roundabout cycle paths',
    explanation: 'The cyclist has already passed and the cycle path is clear. Keep your calm pace as you leave.',
  },
  {
    id: 'zipper-queue-ahead', mission: 'zipper-merge', variation: 0, speed: 40, lead: 45, actorTime: 11, answer: 'release',
    topic: 'Zipper merge',
    explanation: 'The queue in the other lane drives at 20 and you drive at 40. You would close in fast on the cars. Release the accelerator to match their speed. Hard braking is not needed yet.',
  },
  {
    id: 'zipper-car-beside', mission: 'zipper-merge', variation: 0, speed: 22, lead: 10, actorTime: 5.7, view: ZIPPER_VIEW, answer: 'brake',
    topic: 'Zipper merge',
    explanation: 'A car in the other lane is level with your front and the gap is closed. The driver who changes lane lets the other car go first (Article 54). Brake, let it pass and merge behind it.',
  },
  {
    id: 'zipper-gap-open', mission: 'zipper-merge', variation: 1, speed: 18, lead: 12, actorTime: 12, answer: 'nothing', merge: true,
    topic: 'Zipper merge',
    explanation: 'A gap of about two seconds is open behind you and your indicator is on. Keep a calm speed and merge. Braking now wastes the gap.',
  },
  {
    id: 'zipper-hatched-close', mission: 'zipper-merge', variation: 2, speed: 22, lead: 12, actorTime: 12, view: ZIPPER_VIEW, answer: 'brake',
    topic: 'Hatched areas', ...HATCHED,
    explanation: 'The hatched area starts in 12 m and the other lane is full. Do not drive on the hatched area (Article 77). Brake and wait for a gap.',
  },
  {
    id: 'lane-short-gap', mission: 'acceleration-lane', variation: 0, speed: 36, lead: 40, actorTime: 4.5, answer: 'release',
    topic: 'Acceleration lanes',
    explanation: 'Three cars drive close together on the main road. No gap is open yet. Release the accelerator and drive behind the last car. Do not push in.',
  },
  {
    id: 'lane-clear-road', mission: 'acceleration-lane', variation: 1, speed: 45, lead: 30, actorTime: 8, answer: 'nothing', merge: true,
    topic: 'Acceleration lanes',
    explanation: 'The main road is empty near you and you drive close to its speed. The gap is large. Keep your speed, signal and merge.',
  },
  {
    id: 'lane-end-car-beside', mission: 'acceleration-lane', variation: 0, speed: 22, lead: 8, actorTime: 6, answer: 'brake',
    topic: 'Acceleration lanes',
    explanation: 'The lane ends soon and a car is level with you. Traffic on the main road goes first (Article 54). Slow down early and wait for a gap. If you must stop, stop early on the lane and not at its end.',
  },
  {
    id: 'room-slow-lorry', mission: 'room-to-merge', variation: 0, speed: 50, lead: 50, actorTime: 8.8, answer: 'release',
    topic: 'Making room',
    explanation: 'A lorry on the lane cannot reach your speed and will join your lane close ahead of you. Release the accelerator now to open a gap for it. A careful driver does this.',
  },
  {
    id: 'room-good-gap', mission: 'room-to-merge', variation: 1, speed: 50, lead: 40, actorTime: 7, answer: 'nothing',
    topic: 'Making room',
    explanation: 'The car on the lane has a long gap and can merge by itself. Keep your speed and your lane. Braking or moving over only hinders other drivers.',
  },
  {
    id: 'room-squeeze-in', mission: 'room-to-merge', variation: 0, speed: 36, lead: 20, actorTime: 10.3, answer: 'brake',
    topic: 'Making room',
    explanation: 'The lorry starts to move into your lane and the gap is short. The lorry should have waited (Article 54), but it is now in your way. Brake to leave room.',
  },
  // Chapter 06: amber light, siren, officer (hazard-clips-lights.js)
  ...LIGHTS_CLIPS,
  // Chapter 07: tram stop, cycle strip, overtaking (hazard-clips-street.js)
  ...STREET_CLIPS,
  // A parked van that hides a person, and its companion with nobody (hazard-clips-hidden.js)
  ...HIDDEN_CLIPS,
];
