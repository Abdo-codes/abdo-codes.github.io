import { HAZARD_CLIPS } from '../hazard-clips.js';
import { LIGHTS_SCENES } from './scenes-lights.js';
import { STREET_SCENES } from './scenes-street.js';

// Exam scenes: a hazard-clip recording plus tap targets (pins). Each scene has ONE owner topic; an item on a scene has the same topic.
// A scene copies mission, variation, speed, lead, actorTime and answer from the hazard clip named in `from`.
// Pin `at`: 'player' | 'actor' | { ahead, side, y } (metres from the mission gate, side > 0 is the driver's right)
//   | { sign: metres from the gate, offset, y } for a sign on the roadside | { extra: n } for the n-th static car of `extras` | 'lane' for the lane car nearest to the player (merge lessons)
//   | { lane: model, y, along } for the lane road user of that model nearest to the player (along: metres in front of its centre) | { zone: 'zebra' | 'solid' } for the paint of a zone (street scenes, scenes-street.js).
// Pin ids a bank item may use as `correct`: see the `pins` list of each scene below.
// `extras` are static cars (still scenes only): { at: { ahead, side }, turn } where turn is 'right' (moves to the driver's right), 'left', 'oncoming' or 'along'.
// `describe` is neutral (at most 40 words, no advice). The scene test rejects advice words.
const YOU = { id: 'you', label: 'Your car', at: 'player' };
const car = (id, label) => ({ id, label, at: 'actor' });
const RAW = [
  // road-use
  { id: 'quiet-street', from: 'quiet-street', topic: 'road-use', describe: 'You drive at 22 km/h on a quiet street with a 30 km/h limit. Nobody is near the road.', pins: [YOU] },
  { id: 'thirty-ahead', from: 'thirty-ahead', topic: 'road-use', describe: 'You drive at 40 km/h in a built-up area. A 30 km/h sign stands a short way ahead on the right.', pins: [YOU, { id: 'limit-sign', label: 'The speed limit sign', at: { sign: .25, offset: 3.6, y: 2.4 } }] },
  // priority
  { id: 'zebra-stepping-out', from: 'zebra-stepping-out', topic: 'priority', describe: 'You drive at 22 km/h towards a zebra crossing. A pedestrian stands at the kerb next to the crossing.', pins: [YOU, car('walker', 'The pedestrian'), { id: 'zebra', label: 'The zebra crossing', at: { ahead: 2, side: 0, y: .3 } }] },
  { id: 'zebra-empty', from: 'zebra-empty', topic: 'priority', describe: 'You drive at 22 km/h towards a zebra crossing. The pedestrian has reached the far side of the road.', pins: [YOU, car('walker', 'The pedestrian')] },
  { id: 'car-from-right', from: 'car-from-right', topic: 'priority', describe: 'You approach a junction with no signs. A car comes from the road on your right and enters the junction.', pins: [YOU, car('car', 'The car from the right')] },
  { id: 'cyclist-beside', from: 'cyclist-beside', topic: 'priority', describe: 'You drive at 22 km/h and your right indicator is on. A cyclist rides on your right side, going straight on.', pins: [YOU, car('cyclist', 'The cyclist')] },
  { id: 'bus-signalling', from: 'bus-signalling', topic: 'priority', describe: 'You drive at 18 km/h in a built-up area. A bus at its stop shows its left indicator.', pins: [YOU, car('bus', 'The bus')] },
  { id: 'junction-three-a', from: 'car-from-right', topic: 'priority', cluster: 'junction-three', still: true, describe: 'A junction with no signs. One car enters from your right. Another car stands on your left. You drive straight on.',
    pins: [YOU, car('right-car', 'The car from the right'), { id: 'left-car', label: 'The car on your left', at: { extra: 0 } }], extras: [{ at: { ahead: 4, side: -7 }, turn: 'right' }] },
  { id: 'junction-three-b', from: 'car-from-right', topic: 'priority', cluster: 'junction-three', still: true, lead: 10, describe: 'A junction with no signs. One car enters from your right. A second car stands on your left, further back. You drive straight on.',
    pins: [YOU, car('right-car', 'The car from the right'), { id: 'left-car', label: 'The car on your left', at: { extra: 0 } }], extras: [{ at: { ahead: 6, side: -9 }, turn: 'right' }] },
  // special-roads
  { id: 'roundabout-car-left', from: 'roundabout-car-left', topic: 'special-roads', describe: 'You are at the shark teeth of a roundabout entry. A car on the roundabout comes towards your entry from your left.', pins: [YOU, car('car', 'The car on the roundabout'), { id: 'teeth', label: 'The shark teeth', at: { ahead: 1.5, side: 0, y: .3 } }] },
  { id: 'roundabout-slow-car', from: 'roundabout-slow-car', topic: 'special-roads', describe: 'You drive at 22 km/h to a roundabout entry with shark teeth. A car on the roundabout is about to pass your entry.', pins: [YOU, car('car', 'The car on the roundabout')] },
  { id: 'roundabout-empty', from: 'roundabout-empty', topic: 'special-roads', describe: 'You drive at 22 km/h towards a roundabout entry with shark teeth. The roundabout is empty.', pins: [YOU] },
  { id: 'roundabout-leaving-clear', from: 'roundabout-leaving-clear', topic: 'special-roads', describe: 'You are on a roundabout with your right indicator on, next to your exit. The road at the exit is empty.', pins: [YOU] },
  { id: 'cycle-path-crossing', from: 'cycle-path-crossing', topic: 'special-roads', describe: 'You leave a roundabout at 18 km/h. A cyclist rides on the cycle path round the roundabout and reaches your exit.', pins: [YOU] },
  { id: 'cycle-path-ahead', from: 'cycle-path-ahead', topic: 'special-roads', describe: 'You drive on a roundabout towards your exit. A cyclist rides on the cycle path round the roundabout, towards the same exit.', pins: [YOU, car('cyclist', 'The cyclist')] },
  { id: 'cycle-path-passed', from: 'cycle-path-passed', topic: 'special-roads', describe: 'You leave a roundabout at 18 km/h. A cyclist has already passed your exit. The cycle path is empty.', pins: [YOU] },
  // merging (chapter 05): the scenes sit on the merge roads. A 'lane' pin is the lane car nearest to the player.
  { id: 'zipper-car-beside', from: 'zipper-car-beside', topic: 'special-roads', describe: 'You drive at 22 km/h in a lane that ends ahead. A car in the other lane is level with the front of your car. A queue drives on slowly in that lane.',
    pins: [YOU, { id: 'car', label: 'The car in the other lane', at: 'lane' }] },
  { id: 'zipper-hatched-close', from: 'zipper-hatched-close', topic: 'special-roads', describe: 'You drive at 22 km/h in a lane that ends ahead. A hatched area starts a short way in front of you. The other lane is full of cars.',
    pins: [YOU, { id: 'hatch', label: 'The hatched area', at: { ahead: 20, side: -.6, y: .3 } }, { id: 'queue', label: 'The queue in the other lane', at: 'lane' }] },
  { id: 'zipper-gap-open', from: 'zipper-gap-open', topic: 'special-roads', describe: 'Your lane ends ahead. You drive at 18 km/h and your right indicator is on. A gap is open in the other lane, next to your car.', pins: [YOU] },
  { id: 'lane-end-car-beside', from: 'lane-end-car-beside', topic: 'special-roads', describe: 'You drive at 22 km/h on an acceleration lane that ends soon. A car on the main road is level with your car.', pins: [YOU] },
  { id: 'lane-short-gap', from: 'lane-short-gap', topic: 'special-roads', describe: 'You drive at 36 km/h on an acceleration lane. Three cars on the main road drive close together, next to and just ahead of you. No gap is open between them.', pins: [YOU] },
  { id: 'lane-clear-road', from: 'lane-clear-road', topic: 'special-roads', describe: 'You drive at 45 km/h on an acceleration lane and your left indicator is on. The main road is empty near you.', pins: [YOU] },
  { id: 'room-slow-lorry', from: 'room-slow-lorry', topic: 'special-roads', describe: 'You drive at 50 km/h in the right-hand lane of a main road. A lorry on the acceleration lane at your right is slower than you. Its lane ends soon.', pins: [YOU] },
  { id: 'room-good-gap', from: 'room-good-gap', topic: 'special-roads', describe: 'You drive at 50 km/h in the right-hand lane of a main road. A car far ahead, on the acceleration lane at your right, starts to join your lane. The gap in front of you is long.', pins: [YOU] },
  // signs
  { id: 'red-light-close', from: 'red-light-close', topic: 'signs', describe: 'You drive at 40 km/h towards a traffic light. The light shows red and the stop line is close.', pins: [YOU, { id: 'light', label: 'The traffic light', at: { sign: 2.25, offset: 3.6, y: 4 } }] },
  { id: 'green-light', from: 'green-light', topic: 'signs', describe: 'You drive at 40 km/h towards a traffic light. The light shows green and the junction is empty.', pins: [YOU, { id: 'light', label: 'The traffic light', at: { sign: 2.25, offset: 3.6, y: 4 } }] },
  { id: 'railway-red', from: 'railway-red', topic: 'signs', describe: 'You drive at 30 km/h towards a level crossing. The lights flash red and the barriers start to come down.', pins: [YOU, { id: 'lights', label: 'The flashing lights', at: { ahead: 5, side: 4.5, y: 3 } }] },
  { id: 'stop-sign', from: 'stop-sign', topic: 'signs', describe: 'You drive at 40 km/h towards a junction. A red sign with a white border stands on the right. A car comes along the crossing road.',
    pins: [YOU, { id: 'sign', label: 'The sign on the right', at: { sign: 2.25, offset: 3.6, y: 2.4 } }, { id: 'line', label: 'The line on the road', at: { ahead: 2.25, side: 0, y: .3 } }] },
  { id: 'yield-car-left', from: 'yield-car-left', topic: 'signs', describe: 'You drive at 22 km/h towards a junction. A triangular sign and shark teeth are ahead. A car comes from the left on the crossing road.',
    pins: [YOU, { id: 'sign', label: 'The triangular sign', at: { sign: 2.25, offset: 3.6, y: 2.4 } }, car('car', 'The car on the left'), { id: 'teeth', label: 'The shark teeth', at: { ahead: 2.25, side: 0, y: .3 } }] },
  { id: 'roundabout-approach', from: 'roundabout-approach', topic: 'signs', describe: 'You drive at 22 km/h towards a roundabout. Two signs stand on one post on the right. A car is on the roundabout.',
    pins: [YOU, { id: 'giveway', label: 'The triangular sign', at: { sign: -7.3, offset: 2.9, y: 2.1 } }, { id: 'roundabout', label: 'The round blue sign', at: { sign: -7.3, offset: 2.9, y: 3.1 } }, car('car', 'The car on the roundabout')] },
  { id: 'narrowing-oncoming', from: 'narrowing-oncoming', topic: 'signs', describe: 'The road ahead narrows to one lane because the other lane is closed. A round sign with two arrows stands on the right. A car comes towards you.',
    pins: [YOU, { id: 'sign', label: 'The round sign with arrows', at: { sign: -1, offset: 3.6, y: 2.45 } }, car('car', 'The oncoming car')] },
  // Chapter 06 Lights and sirens (scenes-lights.js)
  ...LIGHTS_SCENES,
  // Chapter 07 Trams, bikes and overtaking (scenes-street.js)
  ...STREET_SCENES,
];

// Builds the scene registry. `answer`, `mission` and the lead data come from the hazard clip, so they cannot drift apart.
export const SCENES = Object.fromEntries(RAW.map(raw => {
  const clip = HAZARD_CLIPS.find(item => item.id === raw.from);
  if (!clip) throw new Error(`Exam scene "${raw.id}" names the unknown hazard clip "${raw.from}"`);
  return [raw.id, { cluster: clip.mission, still: false, leadSeconds: 3, extras: [], ...raw, mission: clip.mission, answer: clip.answer }];
}));

// The clip a scene records: the hazard clip with the scene's own overrides. A scene needs its car and its pins in a small picture (390 x 287), so it may set `view` (null: the camera of the lesson).
export const sceneClip = scene => {
  const clip = HAZARD_CLIPS.find(item => item.id === scene.from), own = ['variation', 'speed', 'lead', 'actorTime', 'actorTime2', 'view'].filter(key => scene[key] !== undefined);
  return { ...clip, ...Object.fromEntries(own.map(key => [key, scene[key]])), id: scene.id, leadSeconds: scene.leadSeconds };
};
