import * as THREE from './vendor/three.module.js';
import { material } from './art.js';
import { textured } from './surfaces.js';
import { LANE_WIDTH } from './merge-layout.js';

// Flat road surfaces of the merge areas, generated from the lane table (LAYOUTS). Local frame: x = u along the road, z = v to the right.
export const HALF = LANE_WIDTH / 2, ASPHALT = '#879094', PAINT = '#f0e9d5';
export const HEIGHT = { asphalt: .14, paint: .156 };
// A flat polygon from [u, v] points at height y. `kind` gives the surface texture.
export function flat(parent, points, y, color, kind) {
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(points.map(([u, v]) => new THREE.Vector2(u, -v)))), material(color));
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; mesh.receiveShadow = true; parent.add(mesh);
  return kind ? textured(mesh, kind, color) : mesh;
}
// The asphalt of one lane. A ramp lane that narrows by its outer (right) edge ends in a taper to its left edge. Grass lies beyond; there is no hard shoulder.
export function laneAsphalt(parent, lane, narrow) {
  const { lateral: c, from, to } = lane, left = c - HALF, right = c + HALF;
  const points = lane.kind === 'ramp' && narrow ? [[from, left], [to, left], [narrow[0], right], [from, right]] : [[from, left], [to, left], [to, right], [from, right]];
  return flat(parent, points, HEIGHT.asphalt, ASPHALT, 'asphalt');
}
// The right and left edge of the road at route distance s (route metres), from the lane table.
export function roadExtent(layout) {
  const edges = layout.lanes.flatMap(lane => [lane.lateral - HALF, lane.lateral + HALF]);
  return { left: Math.min(...edges), right: Math.max(...edges) };
}
