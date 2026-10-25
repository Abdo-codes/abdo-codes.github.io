import * as THREE from './vendor/three.module.js';
import { box } from './art.js';
import { textured } from './surfaces.js';
import { tree } from './vegetation.js';
import { building } from './buildings.js';
import { batchTown } from './batching.js';
import { ROUTES } from './routes.js';
import { LANE_WIDTH, ROAD_LENGTH } from './merge-layout.js';
import { STREET_LAYOUTS, STREET_STOPS, STREET_FOG } from './street-layout.js';
import { HEIGHT, ASPHALT } from './merge-roads.js';
import { track, catenary } from './street-rails.js';
import { dashes, strip, stopLine, bikeSymbols, zoneMarks } from './street-markings.js';
import { roadPlate, tramStopPole, shelter } from './street-signs.js';

// The three street areas of chapter 07, far east of the town. Each area is one group in route-local metres (x = u along the road, z = lateral to the right),
// placed at the route start. `update(state)` shows the area of the lesson on screen, rebuilds the variant paint and signs, and sets the fog.
const GRASS = '#899574', PAVING = '#c8c4bb', HEDGE = '#5f7b4f', RED = '#ce9889', COLORS = ['#b99177', '#a87561', '#947360'];
const FROM = -30, TO = ROAD_LENGTH + 30, MIDDLE = (FROM + TO) / 2, WIDTH = TO - FROM, DEPTH = 220, HALF = LANE_WIDTH / 2;
const slab = (parent, u0, u1, v0, v1, top, color, kind = 'asphalt') => textured(box(parent, u1 - u0, .2, v1 - v0, (u0 + u1) / 2, top - .1, (v0 + v1) / 2, color, false), kind, color);
// Houses face the road from `lateral` (negative: left side). `gaps` are [u0, u1] ranges without houses (cross roads).
function houses(parent, lateral, gaps = [], seed = 0) {
  let n = seed;
  for (let u = 6; u < ROAD_LENGTH + 10; u += 9) {
    if (gaps.some(([a, b]) => u > a - 6 && u < b + 6)) continue;
    // Built at the origin and then moved: the window seeds follow the position, and equal seeds share materials, so the batch stays small.
    building(parent, { x: 0, z: 0, width: 7, height: 7.4, color: COLORS[n % 3], variant: (n + 2) % 3, facing: lateral < 0 ? 0 : Math.PI }).position.set(u, .22, lateral); n++;
  }
}
function trees(parent, lateral, every = 21, offset = 0, size = 1.15) {
  for (let u = -15 + offset; u <= ROAD_LENGTH + 15; u += every) tree(parent, u, lateral + (u / every & 1) * 1.4, size + (u / every & 1) * .25);
}
// The field reaches behind the start, where the ready view stands (95 m back), and beyond the end of the road.
function ground(group) { textured(box(group, WIDTH + 260, .6, DEPTH + 120, MIDDLE - 40, -.2, 0, GRASS, false), 'grass', GRASS); }
// Lesson 21: the road with the tram track beside the lane, pavements, the stop and the cross street.
function tramArea(group, layout) {
  const { track: bed, oncoming, kerb, stop, junction } = layout, cut = [junction.from - 2, junction.to + 2];
  ground(group);
  slab(group, FROM, TO, oncoming - HALF, kerb, HEIGHT.asphalt, ASPHALT);
  slab(group, junction.from, junction.to, -42, 42, HEIGHT.asphalt - .001, ASPHALT);
  for (const [a, b] of [[FROM, cut[0]], [cut[1], TO]]) { slab(group, a, b, kerb, kerb + 4.5, .2, PAVING, 'paving'); slab(group, a, b, oncoming - HALF - 3.5, oncoming - HALF, .2, PAVING, 'paving'); }
  track(group, { axis: 'u', at: bed.lateral, from: FROM, to: TO }); track(group, { axis: 'v', at: junction.cross, from: -42, to: 42 });
  catenary(group, { lateral: bed.lateral, side: kerb + .6, from: 20, to: TO, skip: [[junction.from - 4, junction.to + 4]] });
  for (const [a, b] of [[FROM, cut[0]], [cut[1], TO]]) { strip(group, a, b, kerb - .1, .12); strip(group, a, b, oncoming - HALF + .1, .12); }
  stopLine(group, junction.line); stopLine(group, STREET_STOPS.tram.gate);
  tramStopPole(group, stop.pole, kerb + .6); shelter(group, stop.at, kerb + 2.7);
  for (const sign of layout.signs) roadPlate(group, sign.kind, sign.s, sign.lateral);
  houses(group, 10.5, [[junction.from, junction.to]], 1); houses(group, oncoming - HALF - 8, [[junction.from, junction.to]], 3);
  trees(group, kerb + 4.6, 90, 10); trees(group, oncoming - HALF - 4.4, 90, 40);
}
// Lesson 22: a two-way road with a red cycle strip on the right (a solid line first, then a broken one), a kerb and pavements.
function cycleArea(group, layout) {
  const { strip: lane, kerb } = layout;
  ground(group);
  slab(group, FROM, TO, -HALF - LANE_WIDTH, kerb, HEIGHT.asphalt, ASPHALT);
  slab(group, lane.from, lane.to, lane.lateral - lane.width / 2, lane.lateral + lane.width / 2, HEIGHT.asphalt + .003, RED);
  slab(group, FROM, TO, kerb, kerb + 4.5, .2, PAVING, 'paving'); slab(group, FROM, TO, -HALF - LANE_WIDTH - 3.5, -HALF - LANE_WIDTH, .2, PAVING, 'paving');
  const edge = lane.lateral - lane.width / 2;
  strip(group, lane.solid[0], lane.solid[1], edge, .15); dashes(group, lane.solid[1], lane.to, edge, { dash: 1, gap: 1, width: .12 });
  dashes(group, FROM, TO, -HALF); strip(group, FROM, TO, -HALF - LANE_WIDTH + .1, .12);
  bikeSymbols(group, lane.from + 12, lane.to, lane.lateral);
  houses(group, kerb + 8.5, [], 2); houses(group, -HALF - LANE_WIDTH - 8, [], 4);
  trees(group, kerb + 4.3, 54, 5); trees(group, -HALF - LANE_WIDTH - 4.2, 54, 30);
}
// Lesson 23: a country road. The paint that depends on the variant (the centre line, the zebra) and the signs are built by `variantParts`.
function overtakeArea(group, layout) {
  const left = layout.oncoming - HALF, right = HALF;
  ground(group);
  slab(group, FROM, TO, left, right, HEIGHT.asphalt, ASPHALT);
  strip(group, FROM, TO, right - .1, .12); strip(group, FROM, TO, left + .1, .12);
  for (const v of [left - 9, right + 9]) { box(group, WIDTH, 1.3, 1.5, MIDDLE, .65, v, HEDGE, false); trees(group, v + (v > 0 ? -3.6 : 3.6), 40, v > 0 ? 7 : 0, 1.25); }
}
const BUILD = { 'street-tram': tramArea, 'street-cycle': cycleArea, 'street-overtake': overtakeArea };
// The fog and the camera range of the lesson on show: street roads see 170 to 330 m (an oncoming car can be 154 m away); other lessons get `base` back.
export function setStreetView(scene, camera, street, base) {
  const fog = street ? STREET_FOG : base, far = street ? 360 : 220;
  scene.fog.near = fog.near; scene.fog.far = fog.far;
  if (camera.far !== far) { camera.far = far; camera.updateProjectionMatrix(); }
}
export function createStreetAreas(scene) {
  const areas = Object.fromEntries(Object.entries(BUILD).map(([id, build]) => {
    const route = ROUTES[id], start = route.at(0), group = new THREE.Group();
    group.position.set(start.x, 0, start.z); group.rotation.y = start.heading - Math.PI / 2; group.visible = false; scene.add(group);
    build(group, STREET_LAYOUTS[id]); batchTown(group);
    return [id, { group, key: null, dynamic: null }];
  }));
  // The variant paint: rebuilt when the zones or the sign of the practised variant change.
  function variantParts(id, mission) {
    const area = areas[id], lane = mission.lane, key = id === 'street-overtake' ? JSON.stringify([lane.zones ?? [], lane.sign ?? null]) : 'static';
    if (area.key === key) return;
    area.key = key;
    if (area.dynamic) { area.group.remove(area.dynamic); area.dynamic.traverse(node => node.geometry?.dispose()); area.dynamic = null; }
    if (id !== 'street-overtake') return;
    const parts = zoneMarks(lane, FROM, TO, STREET_LAYOUTS[id].centre); parts.name = 'variant';
    const sign = { J22: 112, F1: 100 }[lane.sign];
    if (sign) roadPlate(parts, lane.sign, sign, 3.2);
    area.dynamic = parts; area.group.add(parts);
  }
  // Shows the area of the lesson. Returns true while a street lesson is on (the fog is 170 and 330 m; the world restores the old fog otherwise).
  function update(state) {
    const mission = state.mission, id = mission.kind === 'street' ? mission.route : null;
    for (const [key, area] of Object.entries(areas)) area.group.visible = key === id;
    if (id) variantParts(id, mission);
    return Boolean(id);
  }
  return { areas, update };
}
