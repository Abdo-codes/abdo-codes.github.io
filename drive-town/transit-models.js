import { batchTown } from './batching.js';
import { trainCab, trainBogie } from './train-detail.js';
import * as THREE from './vendor/three.module.js';
import { box, cylinder, material } from './art.js';

function roundedBody(parent, width, height, length, y, color) {
  const r = .18, shape = new THREE.Shape(), left = -width / 2, right = width / 2;
  shape.moveTo(left + r, 0); shape.lineTo(right - r, 0); shape.quadraticCurveTo(right, 0, right, r);
  shape.lineTo(right, height - r); shape.quadraticCurveTo(right, height, right - r, height);
  shape.lineTo(left + r, height); shape.quadraticCurveTo(left, height, left, height - r);
  shape.lineTo(left, r); shape.quadraticCurveTo(left, 0, left + r, 0);
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: length - .16, bevelEnabled: true,
    bevelThickness: .08, bevelSize: .06, bevelSegments: 2, steps: 1 }), material(color, { metalness: .25, roughness: .42 }));
  mesh.position.set(0, y, -length / 2 + .08); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
}
function wheel(parent, x, z, radius = .47) {
  const tyre = cylinder(parent, radius, .27, x, radius, z, '#252c2c'); tyre.rotation.z = Math.PI / 2;
  const hub = cylinder(parent, radius * .52, .285, x, radius, z, '#9aa6a8'); hub.rotation.z = Math.PI / 2;
}
function windows(parent, width, length, y) {
  const glass = material('#253d46', { metalness: .48, roughness: .18 });
  for (const side of [-1, 1]) for (let z = -length / 2 + .8; z < length / 2 - .5; z += 1.35) {
    const pane = box(parent, .03, 1.25, 1.15, side * (width / 2 + .09), y, z, '#253d46'); pane.material = glass;
    box(parent, .055, 1.31, .07, side * (width / 2 + .11), y, z + .61, '#758a92');
  }
  const front = box(parent, width - .3, 1.25, .04, 0, y, length / 2 + .035, '#253d46'); front.material = glass;
  const rear = box(parent, width - .4, 1.0, .04, 0, y, -length / 2 - .035, '#253d46'); rear.material = glass;
}
function display(parent, text, z, y) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#142526'; ctx.fillRect(0, 0, 512, 96);
  ctx.fillStyle = '#ffe3a1'; ctx.font = 'bold 47px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, 256, 65);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, .4), new THREE.MeshBasicMaterial({ map: texture }));
  mesh.position.set(0, y, z); parent.add(mesh);
}
export { detailedBus as townBus } from './bus-model.js';
export function townTrain() {
  const train = new THREE.Group();
  for (const offset of [-4.5, 4.5]) {
    const carriage = new THREE.Group(); train.add(carriage); carriage.position.z = offset;
    roundedBody(carriage, 2.8, 2.8, 7.55, .5, '#d5b94e'); windows(carriage, 2.8, 7.55, 2.12);
    box(carriage, 3.0, .5, 7.55, 0, 1.14, 0, '#315d77');
    for (const side of [-1, 1]) for (const z of [-2.7, 2.7]) {
      box(carriage, .04, 2.25, .78, side * 1.51, 1.73, z, '#c6ac46');
      box(carriage, .05, 1.0, .52, side * 1.54, 2.18, z, '#253d46');
      box(carriage, .06, 2.23, .035, side * 1.55, 1.73, z, '#6f8082');
    }
    for (const x of [-1.16, 1.16]) for (const z of [-2.7, 2.7]) wheel(carriage, x, z, .4);
    for (const z of [-2.7, 2.7]) trainBogie(carriage, z);
    box(carriage, 2.0, .2, 2.4, 0, 3.39, 0, '#829499');
  }
  box(train, 2.5, 2.5, 1.5, 0, 1.77, 0, '#414e52');
  for (let i = 0; i < 8; i++) box(train, 2.58, 2.55, .07, 0, 1.77, -.65 + i * .18, '#687275');
  trainCab(train); trainCab(train, true);
  display(train, 'SPRINTER', 8.71, 2.98);
  batchTown(train); return train;
}
