import * as THREE from './vendor/three.module.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { part, wheel, lamp, LAMPS, bodyMaterials } from './lane-car-model.js';

// The lorry of the merge lessons: 9.5 m by 2.5 m, a cab and a box body. Same lamp contract as the lane car.
let shared;
export function lorryGeometry() {
  shared ??= mergeGeometries([
    part(2.3, .5, 9.5, 0, .75, 0, '#2e3336'), part(2.4, 2.5, 6.0, 0, 2.2, -1.75, '#ffffff'), part(2.4, 1.9, 2.6, 0, 1.9, 3.55, '#ffffff'),
    part(2.2, .8, .06, 0, 2.5, 4.87, '#26323a'), part(2.1, .12, .06, 0, .95, 4.78, '#fff7d6'), part(2.3, .12, .06, 0, .95, -4.77, '#7a1814'),
    ...[3.5, -.5, -3, -4].flatMap(z => [wheel(1.2, .5, z, .5, .34), wheel(-1.2, .5, z, .5, .34)]),
  ]);
  return shared;
}
export function lorry() {
  const group = new THREE.Group(), body = new THREE.Mesh(lorryGeometry(), bodyMaterials[5]);
  body.castShadow = true; group.add(body);
  const make = (parts, material) => { const mesh = new THREE.Mesh(mergeGeometries(parts), material); mesh.visible = false; group.add(mesh); return mesh; };
  const lamps = { brake: make([lamp(.9, 1.1, -4.8), lamp(-.9, 1.1, -4.8)], LAMPS.brake),
    left: make([lamp(1.0, .9, 4.82, .25), lamp(1.2, 1.1, -4.8, .25)], LAMPS.amber), right: make([lamp(-1.0, .9, 4.82, .25), lamp(-1.2, 1.1, -4.8, .25)], LAMPS.amber) };
  group.userData = { lamps, body, kind: 'lorry' }; return group;
}
