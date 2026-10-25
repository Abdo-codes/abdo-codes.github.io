import * as THREE from './vendor/three.module.js';
import { box, label, material } from './art.js';
import { batchTown } from './batching.js';
import { wheel } from './bus-model.js';

// A yellow van (RAL 1016, screen value of the Wikipedia list of RAL colours) with a blue band, a thin red band and a roof bar of two blue lights. The protected striping and the Star of Life are not copied (see RULE-SOURCES.md, Ambulance livery). The forward axis is +Z. Size 2.3 m by 6.2 m (ACTOR_SIZES[7]).
const glass = new THREE.MeshStandardMaterial({ color: '#24343d', metalness: .32, roughness: .14 });
const blue = () => material('#1d63d8', { emissive: '#2f7dff', emissiveIntensity: 0 });
function sideText(parent) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#f1dd38'; ctx.fillRect(0, 0, 512, 96);
  ctx.fillStyle = '#1d3f8f'; ctx.font = 'bold 66px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('AMBULANCE', 256, 52);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  for (const side of [-1, 1]) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.3, .62), new THREE.MeshBasicMaterial({ map }));
    mesh.position.set(side * 1.111, 2.18, -1.05); mesh.rotation.y = side * Math.PI / 2; parent.add(mesh);
  }
}
export function ambulance() {
  const van = new THREE.Group(), yellow = '#f1dd38';
  box(van, 2.2, .9, 6.1, 0, .9, 0, yellow);                // lower body
  box(van, 2.2, 1.5, 4.0, 0, 2.1, -1.05, yellow);          // cargo box
  box(van, 2.1, .95, 1.9, 0, 1.825, 1.8, yellow);          // cab
  box(van, 2.22, .2, 6.12, 0, 1.2, 0, '#1d3f8f');         // blue band
  box(van, 2.22, .07, 6.12, 0, 1.0, 0, '#c8202a');        // thin red band
  box(van, 2.0, .16, .3, 0, .58, 3.1, '#59605f'); box(van, 2.0, .16, .3, 0, .58, -3.1, '#59605f');
  const screen = box(van, 1.86, .7, .05, 0, 1.92, 2.77, '#24343d'); screen.material = glass; screen.rotation.x = -.12;
  for (const side of [-1, 1]) {
    const pane = box(van, .04, .6, 1.2, side * 1.06, 1.95, 1.8, '#24343d'); pane.material = glass;
    box(van, .05, 1.2, .05, side * 1.11, 2.1, -3.02, '#9aa1a0');
    for (const z of [3.04, -3.04]) box(van, .3, .13, .05, side * .78, 1.05, z, z > 0 ? '#f2eed4' : '#a82722');
  }
  box(van, .04, 1.3, .05, 0, 2.1, -3.02, '#9aa1a0');
  sideText(van);
  const bar = [-.5, .5].map(x => { const lamp = box(van, .9, .2, .34, x, 3.0, .75, '#1d63d8', false); lamp.material = blue(); return lamp; });
  box(van, 1.9, .1, .44, 0, 2.88, .75, '#2a3033');
  const grille = [-.55, .55].map(x => { const lamp = box(van, .3, .1, .05, x, .98, 3.07, '#1d63d8', false); lamp.material = blue(); return lamp; });
  van.userData.wheels = [-1.14, 1.14].flatMap(x => [-2.0, 2.15].map(z => wheel(van, x, z)));
  van.userData.bar = [...bar, ...grille];
  batchTown(van, { exclude: [...van.userData.wheels, ...van.userData.bar] });
  const tag = label('Siren on', 4, '#1d4f9f', '#ffffff');
  tag.material.depthTest = false; tag.renderOrder = 10; tag.position.y = 4.1; van.add(tag); van.userData.label = tag;
  return van;
}
// The two blue lights flash in turn, every 0.12 s of the clock.
export function flashBar(van, time, on = true) {
  const phase = Math.floor(Math.max(time, 0) / .12) % 2;
  van.userData.bar.forEach((lamp, i) => { lamp.material.emissiveIntensity = on && i % 2 === phase ? 3 : on ? .2 : 0; });
}
