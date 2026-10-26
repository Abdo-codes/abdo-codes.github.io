import * as THREE from './vendor/three.module.js';
import { box } from './art.js';
import { textured } from './surfaces.js';
import { tree } from './vegetation.js';
import { batchTown } from './batching.js';
import { ROUTES } from './routes.js';
import { LAYOUTS, ROAD_LENGTH } from './merge-layout.js';
import { laneAsphalt, roadExtent } from './merge-roads.js';
import { drawMarkings } from './merge-markings.js';
import { roadSign } from './merge-signs.js';

// The three merge roads, far from the town. Each area is one group in route-local metres (x along the road, z to the right),
// placed at the route start and turned by the route heading. Road surfaces and markings come from LAYOUTS.
const GRASS = '#899574', HEDGE = '#5f7b4f', MIDDLE = ROAD_LENGTH / 2 - 15, WIDTH = 580, DEPTH = 220;
function area(scene, id) {
  const route = ROUTES[id], layout = LAYOUTS[id], start = route.at(0), group = new THREE.Group();
  group.position.set(start.x, 0, start.z); group.rotation.y = start.heading - Math.PI / 2; scene.add(group);
  textured(box(group, WIDTH, .6, DEPTH, MIDDLE, -.2, 0, GRASS, false), 'grass', GRASS);
  for (const lane of layout.lanes) laneAsphalt(group, lane, layout.narrow);
  drawMarkings(group, layout);
  const { left, right } = roadExtent(layout);
  for (const sign of layout.signs) roadSign(group, sign, sign.lateral);
  // A hedge on both sides hides the edge of the world; trees stand in front of it.
  for (const v of [left - 11, right + 11]) {
    box(group, WIDTH, 1.4, 1.6, MIDDLE, .7, v, HEDGE, false);
    for (let u = -15; u <= ROAD_LENGTH + 15; u += 21) tree(group, u + (v > 0 ? 7 : 0), v + (v > 0 ? -2.5 : 2.5), 1.1 + (u / 21 & 1) * .25);
  }
  batchTown(group);
  return group;
}
export const createMergeAreas = scene => ['merge-zipper', 'merge-lane', 'merge-room'].map(id => area(scene, id));
