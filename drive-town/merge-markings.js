import * as THREE from './vendor/three.module.js';
import { box } from './art.js';
import { ROAD_LENGTH } from './merge-layout.js';
import { HALF, HEIGHT, PAINT, flat } from './merge-roads.js';

// Road markings from the lane table. Specs are plain data: { kind: 'edge' | 'lane' | 'block', v, from, to } in route metres.
const SOLID = .15, LANE_LINE = { dash: 3, gap: 6, width: .12 }, BLOCK = { dash: 1, gap: 1, width: .3 };
export function markingsFor(layout) {
  const { lanes, narrow, blockMarking: block } = layout, out = [];
  const taper = lane => lane.kind === 'ramp' && narrow;
  const present = (lateral, s) => lanes.some(lane => Math.abs(lane.lateral - lateral) < .01 && s >= lane.from && s <= lane.to && !(taper(lane) && s > narrow[0]));
  for (const v of new Set(lanes.flatMap(lane => [lane.lateral - HALF, lane.lateral + HALF]))) {
    let run = null;
    const close = end => { if (run) out.push({ ...run, to: end }); run = null; };
    for (let s = 0; s <= ROAD_LENGTH; s++) {
      const left = present(v - HALF, s), right = present(v + HALF, s), onBlock = block && Math.abs(v - block.lateral) < .01 && s >= block.from && s <= block.to;
      const kind = onBlock || !(left || right) ? null : left && right ? 'lane' : 'edge';
      if (run && run.kind !== kind) close(s);
      if (!run && kind) run = { kind, v, from: s };
    }
    close(ROAD_LENGTH);
  }
  if (block) out.push({ kind: 'block', v: block.lateral, from: block.from, to: block.to });
  return out;
}
// The straight diagonal edge of a narrowing ramp, from the lane's right edge to its left edge.
export const taperLine = (layout) => {
  const ramp = layout.lanes.find(lane => lane.kind === 'ramp');
  return layout.narrow && ramp ? { from: [layout.narrow[0], ramp.lateral + HALF], to: [layout.narrow[1], ramp.lateral - HALF] } : null;
};

const strip = (parent, u0, u1, v, width) => box(parent, u1 - u0, .012, width, (u0 + u1) / 2, HEIGHT.paint, v, PAINT, false);
function dashes(parent, spec, { dash, gap, width }) {
  for (let u = spec.from; u < spec.to - .01; u += dash + gap) strip(parent, u, Math.min(u + dash, spec.to), spec.v, width);
}
// A straight paint line between two [u, v] points (used for diagonal edges).
function slanted(parent, [u0, v0], [u1, v1], width) {
  const mesh = box(parent, Math.hypot(u1 - u0, v1 - v0), .012, width, (u0 + u1) / 2, HEIGHT.paint, (v0 + v1) / 2, PAINT, false);
  mesh.rotation.y = -Math.atan2(v1 - v0, u1 - u0); return mesh;
}
// Diagonal white stripes on a transparent tile; the wedge repeats it every 2 m.
function hatchMaterial() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'); ctx.strokeStyle = PAINT; ctx.lineWidth = 18;
  for (const o of [-128, -64, 0, 64, 128]) { ctx.beginPath(); ctx.moveTo(o, 128); ctx.lineTo(o + 128, 0); ctx.stroke(); }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(.5, .5); map.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map, transparent: true, alphaTest: .5, roughness: .9 });
}
// The hatched area: a triangle that fills the ending lane from its left edge, with a white border.
export function hatchedWedge(parent, [from, to], lateral = 0) {
  const a = [from, lateral - HALF], b = [to, lateral - HALF], c = [to, lateral + HALF];
  const mesh = flat(parent, [a, b, c], HEIGHT.paint, PAINT); mesh.material = hatchMaterial();
  slanted(parent, a, c, .2); slanted(parent, c, b, .2);
}
// A diverging arrow: shaft and head along +u, turned `angle` towards the right.
export function divergingArrow(parent, u, v, angle) {
  const shape = [[0, -.15], [2.6, -.15], [2.6, -.55], [3.8, 0], [2.6, .55], [2.6, .15], [0, .15]];
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  flat(parent, shape.map(([a, b]) => [u + a * cos - b * sin, v + a * sin + b * cos]), HEIGHT.paint, PAINT);
}
export function drawMarkings(parent, layout) {
  for (const spec of markingsFor(layout)) {
    if (spec.kind === 'edge') strip(parent, spec.from, spec.to, spec.v, SOLID);
    else dashes(parent, spec, spec.kind === 'block' ? BLOCK : LANE_LINE);
  }
  const taper = taperLine(layout); if (taper) slanted(parent, taper.from, taper.to, SOLID);
  if (layout.wedge) hatchedWedge(parent, layout.wedge, layout.lanes.find(lane => lane.kind === 'ending').lateral);
  for (const u of layout.arrows ?? []) divergingArrow(parent, u, layout.lanes.find(lane => lane.kind === 'ending').lateral, 25 * Math.PI / 180);
}
