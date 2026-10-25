import * as THREE from './vendor/three.module.js';
import { cylinder, material } from './art.js';
import { speedSign } from './buildings.js';

// Original sign art, drawn from the lane table. L5 (a lane ends) is a blue panel with a lane diagram; the sub-sign gives the zipper instruction.
const BLUE = '#0e5ca8', WHITE = '#fafafa', PX = 256;
function textureOf(width, height, draw) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; return map;
}
const panel = map => new THREE.MeshBasicMaterial({ map, toneMapped: false });
// Two lanes. The left one bends into the right one, so it ends: a white diagram on blue.
function l5Face(ctx) {
  ctx.fillStyle = WHITE; ctx.fillRect(0, 0, PX, PX); ctx.fillStyle = BLUE; ctx.fillRect(10, 10, PX - 20, PX - 20);
  ctx.strokeStyle = WHITE; ctx.lineCap = 'butt';
  ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(176, 236); ctx.lineTo(176, 20); ctx.stroke(); // right edge line
  ctx.beginPath(); ctx.moveTo(60, 236); ctx.lineTo(60, 150); ctx.lineTo(120, 70); ctx.lineTo(120, 20); ctx.stroke(); // the left lane bends right and ends
  ctx.lineWidth = 6; ctx.setLineDash([16, 14]); ctx.beginPath(); ctx.moveTo(118, 236); ctx.lineTo(118, 150); ctx.stroke(); ctx.setLineDash([]);
}
function subFace(ctx, width, height) {
  ctx.fillStyle = WHITE; ctx.fillRect(0, 0, width, height); ctx.strokeStyle = '#1d2326'; ctx.lineWidth = 6; ctx.strokeRect(5, 5, width - 10, height - 10);
  ctx.fillStyle = '#1d2326'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Ritsen', width / 2, height * .33); ctx.fillText('vanaf hier', width / 2, height * .72);
}
// Signs stand at the road side, turned back towards the traffic (local +z of the plate points against the direction of travel).
export function l5Sign(parent, u, v) {
  const group = new THREE.Group(); cylinder(group, .055, 3.2, 0, 1.6, 0, '#7a837c');
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), panel(textureOf(PX, PX, l5Face)));
  plate.position.set(0, 2.85, .06); group.add(plate);
  const sub = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .62), panel(textureOf(PX, 146, subFace)));
  sub.position.set(0, 2.0, .06); group.add(sub);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.8), material('#8c9686', { side: THREE.DoubleSide }));
  back.position.set(0, 2.42, .03); group.add(back);
  group.position.set(u, 0, v); group.rotation.y = -Math.PI / 2; parent.add(group); return group;
}
export function roadSign(parent, sign, lateral) {
  if (sign.kind === 'L5') return l5Sign(parent, sign.s, lateral);
  speedSign(parent, sign.s, lateral, -Math.PI / 2, 60);
}
