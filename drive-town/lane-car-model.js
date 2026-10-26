import * as THREE from './vendor/three.module.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

// Light road users for the merge lanes. One shared geometry per model (vertex colours give glass, tyres and trim, the
// material gives the body colour), at most 3,000 triangles. The town car model has about 117,000, too heavy for a pool of 25.
export const BODY_COLORS = ['#c9573f', '#3f7fa8', '#d5a629', '#5e8f68', '#8d6aa6', '#cfcfc8'];
export const MAX_TRIANGLES = 3000;
export const colored = (geometry, color) => {
  const c = new THREE.Color(color), count = geometry.attributes.position.count, data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) data.set([c.r, c.g, c.b], i * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(data, 3)); geometry.deleteAttribute('uv'); return geometry;
};
export const part = (w, h, d, x, y, z, color) => colored(new THREE.BoxGeometry(w, h, d).translate(x, y, z), color);
export const wheel = (x, y, z, radius = .36, width = .26) => colored(new THREE.CylinderGeometry(radius, radius, width, 12).rotateZ(Math.PI / 2).translate(x, y, z), '#1b1d1e');
export const trianglesOf = geometry => (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3;
export const bodyMaterials = BODY_COLORS.map(color => new THREE.MeshStandardMaterial({ color, vertexColors: true, roughness: .42, metalness: .25 }));
// Lamp meshes switch on and off with `visible`. All cars share the lamp materials.
const lampMaterial = color => new THREE.MeshBasicMaterial({ color, toneMapped: false });
export const LAMPS = { brake: lampMaterial('#ff2a24'), amber: lampMaterial('#ffb21e') };
export const lamp = (x, y, z, w = .3) => new THREE.BoxGeometry(w, .13, .05).translate(x, y, z);

let shared;
export function carGeometry() {
  shared ??= mergeGeometries([
    part(1.96, .62, 4.5, 0, .62, 0, '#ffffff'), part(1.8, .5, 2.2, 0, 1.17, -.15, '#26323a'), part(1.7, .1, 1.7, 0, 1.47, -.15, '#ffffff'),
    part(1.9, .14, .06, 0, .78, 2.25, '#fff7d6'), part(1.9, .14, .06, 0, .78, -2.25, '#7a1814'),
    wheel(.98, .36, 1.4), wheel(-.98, .36, 1.4), wheel(.98, .36, -1.4), wheel(-.98, .36, -1.4),
  ]);
  return shared;
}
// A lane car: body mesh plus three lamp meshes. Forward is +z, left is +x. `userData.lamps` drives the lamps.
export function laneCar() {
  const group = new THREE.Group(), body = new THREE.Mesh(carGeometry(), bodyMaterials[0]);
  body.castShadow = true; group.add(body);
  const make = (parts, material) => { const mesh = new THREE.Mesh(mergeGeometries(parts), material); mesh.visible = false; group.add(mesh); return mesh; };
  const lamps = { brake: make([lamp(.7, .9, -2.27), lamp(-.7, .9, -2.27)], LAMPS.brake),
    left: make([lamp(.85, .72, 2.27, .22), lamp(.85, .72, -2.27, .22)], LAMPS.amber), right: make([lamp(-.85, .72, 2.27, .22), lamp(-.85, .72, -2.27, .22)], LAMPS.amber) };
  group.userData = { lamps, body, kind: 'car' }; return group;
}
