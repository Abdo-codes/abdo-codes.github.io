import * as THREE from './vendor/three.module.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { part, wheel, lamp, LAMPS, bodyMaterials } from './lane-car-model.js';

// The delivery van of lesson 22: 5.5 m by 2.1 m, a cab and a box body, a coloured stripe. It stands on the cycle strip with the hazard lamps on.
// Same lamp contract as the lane car: userData.lamps.left and .right are the four amber corners; the hazard blink shows both.
let shared;
export function vanGeometry() {
  shared ??= mergeGeometries([
    part(2.0, .45, 5.4, 0, .6, 0, '#2e3336'), part(2.1, 1.95, 3.5, 0, 1.78, -.85, '#ffffff'), part(2.1, 1.35, 1.7, 0, 1.5, 1.8, '#ffffff'), part(2.12, .22, 3.5, 0, 1.15, -.85, '#2b6cb0'),
    part(1.9, .6, .06, 0, 1.9, 2.66, '#26323a'), part(.06, .5, 1.1, 1.05, 1.9, 1.85, '#26323a'), part(.06, .5, 1.1, -1.05, 1.9, 1.85, '#26323a'),
    part(1.9, .14, .06, 0, .9, 2.73, '#fff7d6'), part(2.0, .14, .06, 0, .9, -2.73, '#7a1814'), part(.04, 1.5, .04, 0, 1.8, -2.62, '#c9ccc8'), part(2.0, .1, .1, 0, .46, 2.7, '#444b4e'),
    ...[1.6, -1.7].flatMap(z => [wheel(1.0, .38, z, .38, .26), wheel(-1.0, .38, z, .38, .26)]),
  ]);
  return shared;
}
export function van() {
  const group = new THREE.Group(), body = new THREE.Mesh(vanGeometry(), bodyMaterials[5]); body.castShadow = true; group.add(body);
  const make = (parts) => { const mesh = new THREE.Mesh(mergeGeometries(parts), LAMPS.amber); mesh.visible = false; group.add(mesh); return mesh; };
  const lamps = { brake: make([lamp(.8, 1.0, -2.75), lamp(-.8, 1.0, -2.75)]), left: make([lamp(.95, .7, 2.76, .22), lamp(1.0, 1.0, -2.76, .22)]), right: make([lamp(-.95, .7, 2.76, .22), lamp(-1.0, 1.0, -2.76, .22)]) };
  lamps.brake.material = LAMPS.brake; group.userData = { lamps, body, kind: 'van' }; return group;
}
