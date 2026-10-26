import * as THREE from './vendor/three.module.js';
import { box } from './art.js';
import { textured } from './surfaces.js';

// The tram track of lesson 21 in route-local metres (x = u along the road, z = lateral to the right): a track bed, two rails and instanced sleepers,
// the cross track at the junction, catenary poles with arms (instanced) and the wire. Rail gauge 1.435 m.
const GAUGE = 1.435, BED = '#85837a', RAIL = '#a2a7a8', SLEEPER = '#6f6a62', POLE = '#5d676b';
const place = (x, y, z, rotation = 0) => { const m = new THREE.Matrix4().makeRotationY(rotation); m.setPosition(x, y, z); return m; };
const instanced = (geometry, color, matrices, cast = true) => {
  const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .85 }), matrices.length);
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m)); mesh.castShadow = cast; mesh.receiveShadow = true; return mesh;
};
// One straight track along u (`axis` 'u') or along lateral (`axis` 'v') at `at`, from `from` to `to`.
export function track(parent, { axis, at, width = 3, from, to }) {
  const length = to - from, mid = (from + to) / 2, along = axis === 'u';
  const size = (long, wide, height) => along ? [long, height, wide] : [wide, height, long];
  const spot = (a, b) => along ? [a, b] : [b, a];
  textured(box(parent, ...size(length, width, .06), ...[spot(mid, at)[0], .17, spot(mid, at)[1]], BED, false), 'gravel', BED);
  for (const side of [-1, 1]) { const [x, z] = spot(mid, at + side * GAUGE / 2); box(parent, ...size(length, .07, .09), x, .21, z, RAIL, false); }
  const sleepers = [], count = Math.floor(length / .75);
  for (let i = 0; i < count; i++) { const [x, z] = spot(from + .4 + i * .75, at); sleepers.push(place(x, .2, z, along ? 0 : Math.PI / 2)); }
  parent.add(instanced(new THREE.BoxGeometry(.22, .05, 2.5), SLEEPER, sleepers, false));
}
// Catenary: a pole every 30 m on the pavement side (lateral `side`), an arm over the track at `lateral`, and one wire along the track.
export function catenary(parent, { lateral, side, from, to, wireY = 5, skip = [] }) {
  const poles = [], arms = [];
  for (let u = from; u <= to; u += 30) {
    if (skip.some(([a, b]) => u >= a && u <= b)) continue;
    poles.push(place(u, 3.3, side)); arms.push(place(u, wireY + .1, (side + lateral) / 2));
  }
  parent.add(instanced(new THREE.CylinderGeometry(.1, .13, 6.6, 8), POLE, poles), instanced(new THREE.BoxGeometry(.08, .08, Math.abs(side - lateral)), POLE, arms));
  box(parent, to - from, .035, .035, (from + to) / 2, wireY, lateral, '#2d3033', false);
}
