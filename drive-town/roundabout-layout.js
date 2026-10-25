import { buildRoute } from './route-builder.js';

// Roundabout neighbourhood, built far east of the town (beyond its fog) on the same ground plane.
// Map orientation: +x east, +z south. Right-hand traffic circulates anticlockwise on the map
// (east side northbound), so entering and leaving are right turns and the ring curves left.
export const AREA = { x: 420, z: 0 };
export const LANE = 2;            // lane centre offset from an arm's centre line
export const RING = 9;            // circulating lane centre radius
export const RING_ROAD = [6.5, 11.5];
export const ISLAND = 6;
export const CYCLE_RING = 18;     // separate cycle path: one car fits between it and the ring, still part of the roundabout
const CURVE = 6, ARM = 60;
// Entry/exit curves are tangent to both the lane and the ring: cos α = (lane + curve) / (curve + ring).
export const SWING = Math.acos((LANE + CURVE) / (CURVE + RING));
export const MOUTH = (CURVE + RING) * Math.sin(SWING); // where an arm's straight meets its curve, from the centre
export const CENTRES = [{ x: AREA.x, z: AREA.z }, { x: AREA.x - 2 * MOUTH - ARM, z: AREA.z }];

const enter = { arc: CURVE, angle: SWING, turn: 'right' };
const straightOn = [enter, { arc: RING, angle: 2 * SWING, turn: 'left' }, enter];

// The learner drives west from the east arm, straight on at both roundabouts.
const learner = buildRoute({ id: 'roundabout', start: { x: CENTRES[0].x + MOUTH + ARM, z: AREA.z - LANE, dx: -1, dz: 0 },
  segments: [{ straight: ARM }, ...straightOn, { straight: ARM }, ...straightOn, { straight: ARM }] });
// A car from the south arm of the first roundabout goes straight on to the north, passing the learner's entry.
const circulating = buildRoute({ id: 'roundabout-car', start: { x: CENTRES[0].x + LANE, z: AREA.z + MOUTH + 30, dx: 0, dz: -1 },
  segments: [{ straight: 30 }, ...straightOn, { straight: 40 }] });

const piece = index => learner.segments[index];
// Distances along the learner's route.
export const STOPS = {
  firstEntry: piece(1).from,              // end of the east arm, start of the entry curve
  firstExit: piece(3).from,               // start of the exit curve at the first roundabout
  secondEntry: piece(5).from,
  secondExit: piece(7).from,
  secondExitEnd: piece(8).from,           // back on a straight arm
  end: learner.length,
};
// Minimap: fit both roundabouts into the 120 × 96 map.
learner.area = AREA; learner.map = { x: AREA.x - 42, z: AREA.z, scale: .4 };
export const ROUNDABOUT_ROUTES = { roundabout: learner, 'roundabout-car': circulating };
