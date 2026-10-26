import * as THREE from './vendor/three.module.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { part, wheel, colored } from './lane-car-model.js';

// A light moped (snorfiets, lesson 22 variant 5): a scooter with a rider, 1.8 m long. Forward is +z. The plate is plain: the game makes no claim about plate colours.
let shared;
const ball = (r, x, y, z, color) => colored(new THREE.SphereGeometry(r, 8, 6).translate(x, y, z), color);
export function mopedGeometry() {
  shared ??= mergeGeometries([
    part(.34, .22, 1.0, 0, .46, -.1, '#2f7d6f'), part(.3, .52, .5, 0, .6, .5, '#2f7d6f'), part(.34, .1, .75, 0, .72, -.3, '#26292b'), part(.12, .62, .1, 0, .65, .75, '#555c60'),
    part(.6, .06, .06, 0, 1.0, .8, '#26292b'), part(.2, .14, .06, 0, .86, .82, '#fff7d6'), part(.2, .1, .04, 0, .5, -.66, '#d8d6cb'),
    wheel(0, .27, .72, .27, .12), wheel(0, .27, -.62, .27, .12),
    part(.36, .6, .26, 0, 1.12, -.22, '#c9792f'), part(.14, .5, .14, .2, 1.0, .15, '#c9792f'), part(.14, .5, .14, -.2, 1.0, .15, '#c9792f'), part(.2, .55, .22, .13, .72, -.3, '#2c3a52'), part(.2, .55, .22, -.13, .72, -.3, '#2c3a52'),
    ball(.14, 0, 1.58, -.12, '#e7c9a6'), ball(.16, 0, 1.62, -.12, '#e8e6df'),
  ]);
  return shared;
}
export function moped() {
  const group = new THREE.Group(), body = new THREE.Mesh(mopedGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5, metalness: .2 }));
  body.castShadow = true; group.add(body); group.userData = { body, kind: 'moped', lamps: { brake: { visible: false }, left: { visible: false }, right: { visible: false } } };
  return group;
}
