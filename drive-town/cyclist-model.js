import * as THREE from './vendor/three.module.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { part, colored } from './lane-car-model.js';

// A light cyclist for the street lessons (the city cyclist of lesson 3 is a heavy animated asset): bike frame, two spinning wheels, a rider with two pedalling legs.
// Forward is +z, 1.8 m long. `pedal(group, s)` turns the wheels and the legs from the distance travelled.
const R = .34, TUBE = .028, JACKETS = ['#d9692f', '#3d7ea6', '#7a5aa8'];
const tube = (x, y1, z1, y2, z2, color = '#2d3236') => {
  const length = Math.hypot(y2 - y1, z2 - z1), angle = Math.atan2(z2 - z1, y2 - y1);
  return colored(new THREE.CylinderGeometry(TUBE, TUBE, length, 5).rotateX(angle).translate(x, (y1 + y2) / 2, (z1 + z2) / 2), color);
};
const ball = (r, x, y, z, color) => colored(new THREE.SphereGeometry(r, 8, 6).translate(x, y, z), color);
const frame = () => mergeGeometries([tube(0, .34, -.62, .34, .62), tube(0, .34, -.1, .95, -.18), tube(0, .34, .08, .95, .12, '#555c60'), tube(0, .34, -.62, .95, -.18), tube(0, .95, .12, 1.02, .16),
  part(.56, .04, .04, 0, 1.04, .16, '#26292b'), part(.12, .05, .26, 0, .98, -.22, '#26292b'), tube(0, .34, .62, .34, .1)]);
const wheelGeometry = () => mergeGeometries([colored(new THREE.TorusGeometry(R, TUBE * 1.4, 5, 16).rotateY(Math.PI / 2), '#1d2022'), part(.02, R * 2 - .04, .02, 0, 0, 0, '#9aa0a3'), part(.02, .02, R * 2 - .04, 0, 0, 0, '#9aa0a3')]);
const leg = () => mergeGeometries([part(.12, .46, .14, 0, -.23, 0, '#2c3a52'), part(.1, .1, .22, 0, -.5, .06, '#2a2a2a')]);
const riderGeometry = (jacket) => mergeGeometries([part(.34, .56, .24, 0, 1.4, -.12, jacket), part(.12, .5, .12, .2, 1.28, .12, jacket), part(.12, .5, .12, -.2, 1.28, .12, jacket), ball(.14, 0, 1.82, -.04, '#e7c9a6'), ball(.155, 0, 1.86, -.06, '#5b4632')]);
let shared;
export function cyclist(index = 0) {
  shared ??= { frame: frame(), wheel: wheelGeometry(), leg: leg() };
  const group = new THREE.Group(), material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .55, metalness: .15 });
  const add = (geometry, x, y, z) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; group.add(mesh); return mesh; };
  add(shared.frame, 0, 0, 0); add(riderGeometry(JACKETS[index % JACKETS.length]), 0, 0, 0);
  const wheels = [add(shared.wheel, 0, R, .62), add(shared.wheel, 0, R, -.62)], legs = [add(shared.leg, .1, .96, -.12), add(shared.leg, -.1, .96, -.12)];
  group.userData = { wheels, legs, kind: 'cyclist', lamps: { brake: { visible: false }, left: { visible: false }, right: { visible: false } } };
  return group;
}
export function pedal(group, s) {
  const { wheels, legs } = group.userData;
  wheels.forEach(wheel => { wheel.rotation.x = s / R; });
  legs[0].rotation.x = Math.sin(s * 2.4) * .7; legs[1].rotation.x = Math.sin(s * 2.4 + Math.PI) * .7;
}
