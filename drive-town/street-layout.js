import { buildRoute } from './route-builder.js';
import { LANE_WIDTH, ROAD_X, ROAD_LENGTH } from './merge-layout.js';

// Chapter 07: three straight 300 m streets east of the town, 420 m apart (the fog is 170 m). Frame: u along the road (east), lateral to the right (south).
// The route centre line is the centre of the learner lane. `gate` is the stop line (tram), the van (cycle) and the first free place to start a pass (overtake).
// `show` is the farthest point that the ready camera of a phone must show: the stopped tram, the van, the cyclist with its first free place.
export const STREET_X = ROAD_X, STREET_Z = { tram: -300, cycle: -720, overtake: -1140 };
export const STREET_STOPS = {
  tram: { start: 60, gate: 118, end: 250, show: 140 },
  cycle: { start: 80, gate: 142, end: 220, show: 152 },
  overtake: { start: 60, gate: 100, end: 230, limit: 290, show: 112 },
};
// Scenery data (metres): tram track beside the lane, the tram stop, the junction, the cycle strip and the van, the overtake road.
export const STREET_LAYOUTS = {
  'street-tram': { track: { lateral: -3.3, width: 2.65 }, oncoming: -7, kerb: 1.75, stop: { at: 138, length: 24, doors: [128, 134, 142, 148], pole: 150 },
    junction: { cross: 215, line: 205, from: 205, to: 225 }, signs: [{ kind: 'J14', s: 190, lateral: 3.2 }], poles: 30 },
  'street-cycle': { strip: { lateral: 2.75, width: 2, from: 0, to: 220, solid: [0, 120] }, kerb: 3.75, van: { s: 150, length: 5.5, lateral: 2.7 }, symbols: 25 },
  'street-overtake': { oncoming: -LANE_WIDTH, centre: -LANE_WIDTH / 2, pass: -3, rider: .9 },
};
const ROADS = [['street-tram', STREET_Z.tram, STREET_STOPS.tram], ['street-cycle', STREET_Z.cycle, STREET_STOPS.cycle], ['street-overtake', STREET_Z.overtake, STREET_STOPS.overtake]];

function road(id, z, stops) {
  const route = buildRoute({ id, start: { x: STREET_X, z, dx: 1, dz: 0 }, segments: [{ straight: ROAD_LENGTH }] });
  const middle = (stops.start + stops.end) / 2;
  route.area = { x: STREET_X + middle, z };
  route.map = { x: STREET_X + ROAD_LENGTH / 2, z, scale: .33 };
  // The ready camera looks at the road from the side, so the road runs across the scene and shows on both sides of the lesson card.
  // From the end of the road it ran away behind the card (merge roads keep that view).
  // On a phone (canvas taller than wide) the card sits at the bottom, so the view centres on the road from the start to `show` and rises until all of it is in the picture.
  // The view keeps the slope of the wide view. A distance d along the view shows about .31 d metres to each side on a 356 x 588 canvas, and 4 m more are the margin.
  const d = ((stops.show - stops.start) / 2 + 4) / .31;
  route.view = { centre: stops.gate - 15 - middle, eye: [0, 72, 30], look: [0, 2], span: 70,
    narrow: { centre: (stops.start + stops.show) / 2 - middle, eye: [0, Math.round(d * .928), Math.round(2 + d * .371)] } };
  return route;
}
export const STREET_ROUTES = Object.fromEntries(ROADS.map(([id, z, stops]) => [id, road(id, z, stops)]));
// Street areas set the fog to 170 and 330 m; other areas keep 110 and 245 m (an oncoming car can be 154 m away).
export const STREET_FOG = { near: 170, far: 330 };
