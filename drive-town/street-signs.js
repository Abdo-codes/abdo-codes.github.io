import * as THREE from './vendor/three.module.js';
import { cylinder, box, material } from './art.js';
import { SIGNS } from './exam/sign-data.js';
import { signSvg } from './sign-svg.js';

// Signs of the street roads. J14 (tram), J22 (zebra crossing) and F1 (no overtaking between motor vehicles) use the exam sign pictures (sign-svg.js),
// drawn once on a canvas. The picture loads from an SVG; until then the plate is white. The tram stop pole carries a plain "TRAM" board:
// sign L3 is not in the sign data, so the board is a Drive Town drawing and makes no claim about the official sign.
const PX = 256, textures = new Map();
function plateTexture(kind) {
  if (textures.has(kind)) return textures.get(kind);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = PX;
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; textures.set(kind, map);
  if (typeof Image === 'undefined') return map;
  const image = new Image();
  image.onload = () => { canvas.getContext('2d').drawImage(image, 0, 0, PX, PX); map.needsUpdate = true; };
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(signSvg(kind, SIGNS).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" '))}`;
  return map;
}
// Signs stand at the road side, turned back towards the traffic (local +z of the plate points against the direction of travel).
export function roadPlate(parent, kind, u, lateral, size = 1.15) {
  const group = new THREE.Group(); cylinder(group, .055, 2.7, 0, 1.35, 0, '#7a837c');
  const face = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: plateTexture(kind), transparent: true, toneMapped: false }));
  face.position.set(0, 2.5, .06); group.add(face);
  const back = new THREE.Mesh(new THREE.CircleGeometry(size / 2 + .03, 20), material('#8c9686', { side: THREE.DoubleSide })); back.position.set(0, 2.5, .03); group.add(back);
  group.position.set(u, 0, lateral); group.rotation.y = -Math.PI / 2; parent.add(group); return group;
}
function boardTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 160; const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, 256, 160); ctx.fillStyle = '#0e5ca8'; ctx.fillRect(8, 8, 240, 144);
  ctx.fillStyle = '#fafafa'; ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TRAM', 128, 70);
  ctx.fillRect(48, 112, 160, 8);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}
export function tramStopPole(parent, u, lateral) {
  const group = new THREE.Group(); cylinder(group, .05, 3.2, 0, 1.6, 0, '#6c757a');
  const board = new THREE.Mesh(new THREE.PlaneGeometry(.9, .56), new THREE.MeshBasicMaterial({ map: boardTexture(), toneMapped: false }));
  board.position.set(0, 3.0, .06); group.add(board); box(group, .96, .62, .04, 0, 3.0, .02, '#4d575b', false);
  group.position.set(u, 0, lateral); group.rotation.y = -Math.PI / 2; parent.add(group); return group;
}
// A glass shelter with a roof and a bench on the pavement at the tram stop.
export function shelter(parent, u, lateral) {
  const group = new THREE.Group();
  const glass = box(group, 5, 1.9, .05, 0, 1.2, .9, '#9ec0c6', false); glass.material = material('#9ec0c6', { transparent: true, opacity: .35, roughness: .1 });
  for (const x of [-2.5, 2.5]) { box(group, .08, 2.4, .08, x, 1.2, .9, '#4d575b'); const side = box(group, .05, 1.9, 1.6, x, 1.2, .1, '#9ec0c6', false); side.material = glass.material; }
  box(group, 5.4, .1, 2.2, 0, 2.45, .3, '#5d676b'); box(group, 3, .08, .45, 0, .55, .55, '#8d6b4a'); box(group, 3, .5, .06, 0, .3, .75, '#4d575b');
  group.position.set(u, 0, lateral); parent.add(group); return group;
}
