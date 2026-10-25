import * as THREE from './vendor/three.module.js';
import { box, cylinder } from './art.js';
import { hedge } from './vegetation.js';
import { textured, random } from './surfaces.js';

let wear;
function wearMaterial() {
  if (wear) return wear;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'), rand = random(724);
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 125);
  gradient.addColorStop(0, 'rgba(34,34,29,.25)'); gradient.addColorStop(1, 'rgba(34,34,29,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(28,28,24,${rand() * .09})`; ctx.fillRect(rand() * 256, rand() * 256, 2, 7);
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  wear = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  return wear;
}
export function streetSection(town) {
  // The north frontage is the reusable art section. Keep the learning route and
  // all actor paths clear; dressing sits behind the pavement or flush with it.
  for (let i = 0; i < 8; i++) {
    const x = -34 + i * 9;
    if (i === 3 || i === 4 || i === 5) continue; // railway corridor and flower shop
    textured(box(town, 7.8, .045, 4, x, .17, -34.7, '#8c9279', false), 'grass', '#8c9279');
    textured(box(town, 1.35, .055, 4.1, x + 1.45, .2, -34.7, '#b5b4ad', false), 'paving', '#b5b4ad');
    for (const side of [-1, 1]) {
      hedge(town, x + side * 2.55, -32.7, 2.6, .55 + i % 2 * .18);
    }
    // A downpipe drain and modest timber fence vary the frontage rhythm.
    const drain = cylinder(town, .12, .02, x + 3.2, .235, -35.9, '#555c58');
    for (let slat = 0; slat < 6; slat++) box(town, .07, .85, .045, x - 3.65, .57, -34.9 + slat * .28, '#80776b');
    box(town, .08, .065, 1.5, x - 3.65, .83, -34.2, '#80776b');
    drain.receiveShadow = true;
  }
  // Flush stains break the uniform road colour without adding obstacles.
  for (const [x, z, w, d] of [[-25,-29,5,1.1],[12,-28,4,1.2],[27,-23,3,1],[-12,23,4,.8]]) {
    const stain = new THREE.Mesh(new THREE.PlaneGeometry(w, d), wearMaterial());
    stain.rotation.x = -Math.PI / 2; stain.position.set(x, .196, z); town.add(stain);
  }
}
