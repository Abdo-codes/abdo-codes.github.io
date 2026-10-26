import * as THREE from './vendor/three.module.js';
import { box } from './art.js';
import { HEIGHT, PAINT } from './merge-roads.js';
import { batchTown } from './batching.js';

// Road paint of the street roads (route-local metres, x = u, z = lateral). Specs are plain data from STREET_LAYOUTS and the lane zones of the variant.
// Dutch practice: a broken centre line has 3 m dashes and 6 m gaps; a solid line between lanes may not be crossed (Article 76); a zebra crossing is a row of stripes.
const Y = HEIGHT.paint, DASH = { dash: 3, gap: 6, width: .12 }, STRIP_DASH = { dash: 1, gap: 1, width: .12 };
const strip = (parent, u0, u1, v, width, color = PAINT) => box(parent, u1 - u0, .012, width, (u0 + u1) / 2, Y, v, color, false);
export function dashes(parent, from, to, v, { dash, gap, width } = DASH) {
  for (let u = from; u < to - .01; u += dash + gap) strip(parent, u, Math.min(u + dash, to), v, width);
}
// The centre line from `from` to `to`: broken, except where a solid zone lies (a solid line between lanes).
export function centreLine(parent, v, from, to, zones = []) {
  const solid = zones.filter(zone => zone.kind === 'solid').sort((a, b) => a.from - b.from);
  let at = from;
  for (const zone of solid) { dashes(parent, at, zone.from, v); strip(parent, zone.from, zone.to, v, .15); at = zone.to; }
  dashes(parent, at, to, v);
}
// A zebra crossing: stripes along the road, 0.5 m wide with 0.5 m gaps, across the width from `v0` to `v1`.
export function zebra(parent, u0, u1, v0, v1) {
  for (let v = v0 + .25; v < v1 - .2; v += 1) strip(parent, u0, u1, v, .5, '#f6f2e4');
}
// The paint that depends on the practised variant: the centre line with its solid parts, and the zebra stripes. Rebuilt when the variant changes.
export function zoneMarks(lane, from, to, v) {
  const group = new THREE.Group(), zones = lane.zones ?? [];
  centreLine(group, v, from, to, zones);
  for (const zone of zones) if (zone.kind === 'zebra') zebra(group, zone.to - 4, zone.to, v - 3.5, v + 3.5);
  batchTown(group); return group;
}
export function stopLine(parent, u, v0 = -1.75, v1 = 1.75) { strip(parent, u - .2, u + .2, (v0 + v1) / 2, v1 - v0); }
// Bicycle symbols on the cycle strip: one InstancedMesh of flat planes with a white bicycle on a clear texture.
function bikeTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128; const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#f6f2e4'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const x of [58, 198]) { ctx.beginPath(); ctx.arc(x, 78, 30, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(58, 78); ctx.lineTo(100, 36); ctx.lineTo(160, 36); ctx.lineTo(198, 78); ctx.moveTo(100, 36); ctx.lineTo(128, 78); ctx.lineTo(160, 36); ctx.moveTo(160, 36); ctx.lineTo(176, 20); ctx.lineTo(196, 20); ctx.stroke();
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}
export function bikeSymbols(parent, from, to, v, every = 25) {
  const spots = []; for (let u = from; u <= to; u += every) spots.push(u);
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.6, .8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: bikeTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), spots.length);
  spots.forEach((u, i) => mesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(u, Y + .006, v))); parent.add(mesh);
}
export { strip, STRIP_DASH };
