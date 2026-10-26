import { buildRoute } from './route-builder.js';

// Chapter 05: three straight 300 m roads far from the town, 280 m apart (the fog hides the others).
// Route-local frame: u along the road (east), lateral to the right (south). Lane width 3.5 m.
export const LANE_WIDTH = 3.5, ROAD_X = 270, ROAD_LENGTH = 300;
// Route distances of every lesson. The latest Merge press is the last point from which a 16 m shift stays off the wedge or the road edge.
export const MERGE_STOPS = {
  zipper: { start: 90, sign: 110, gate: 230, wedge: [230, 260], end: 280 },
  lane: { start: 70, gate: 200, narrow: [200, 230], end: 250 },
  room: { start: 20, gate: 185, narrow: [200, 230], end: 215 },
};
const ROADS = [['merge-zipper', 300, MERGE_STOPS.zipper], ['merge-lane', 580, MERGE_STOPS.lane], ['merge-room', 860, MERGE_STOPS.room]];

function road(id, z, stops) {
  const route = buildRoute({ id, start: { x: ROAD_X, z, dx: 1, dz: 0 }, segments: [{ straight: ROAD_LENGTH }] });
  const middle = (stops.start + stops.end) / 2;
  route.area = { x: ROAD_X + middle, z };
  // The minimap shows the whole road. The overview window is 100 m wide around the gate: 65 m before it, 35 m after.
  route.map = { x: ROAD_X + ROAD_LENGTH / 2, z, scale: .33 };
  route.view = { centre: stops.gate - 15 - middle, eye: [-95, 30, 0], look: [-35, 0], span: 70 };
  return route;
}
export const MERGE_ROUTES = Object.fromEntries(ROADS.map(([id, z, stops]) => [id, road(id, z, stops)]));

const lane = (lateral, from, to, kind) => ({ lateral, from, to, kind });
// Scenery data per route: lanes (route metres), the hatched wedge, the road-edge taper, the block marking, signs and arrows.
export const LAYOUTS = {
  'merge-zipper': { lanes: [lane(0, 0, 260, 'ending'), lane(LANE_WIDTH, 0, ROAD_LENGTH, 'through')], wedge: MERGE_STOPS.zipper.wedge,
    signs: [{ kind: 'L5', s: MERGE_STOPS.zipper.sign, lateral: 6.5 }, { kind: 'speed', s: 20, lateral: 6.5 }], arrows: [110, 122, 134] },
  'merge-lane': { lanes: [lane(0, 40, 230, 'ramp'), lane(-LANE_WIDTH, 0, ROAD_LENGTH, 'through'), lane(-2 * LANE_WIDTH, 0, ROAD_LENGTH, 'through')],
    narrow: MERGE_STOPS.lane.narrow, blockMarking: { lateral: -1.75, from: 40, to: 230 }, signs: [{ kind: 'speed', s: 20, lateral: 3 }] },
  'merge-room': { lanes: [lane(0, 0, ROAD_LENGTH, 'through'), lane(-LANE_WIDTH, 0, ROAD_LENGTH, 'through'), lane(LANE_WIDTH, 0, 230, 'ramp')],
    narrow: MERGE_STOPS.room.narrow, blockMarking: { lateral: 1.75, from: 0, to: 230 }, signs: [{ kind: 'speed', s: 20, lateral: 6.5 }] },
};
