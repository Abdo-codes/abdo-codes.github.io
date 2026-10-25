import { batchTown } from './batching.js';
import * as THREE from './vendor/three.module.js';
import { box, cylinder, material } from './art.js';

const glass = new THREE.MeshStandardMaterial({ color: '#24343d', metalness: .32, roughness: .14, envMapIntensity: 1.25 });
const paint = new THREE.MeshPhysicalMaterial({ color: '#e4e6df', metalness: .25, roughness: .32, clearcoat: .5 });
export function wheel(parent, x, z) {
  const group = new THREE.Group(); group.position.set(x, .47, z); parent.add(group);
  const tyre = cylinder(group, .47, .24, 0, 0, 0, '#242727'); tyre.rotation.z = Math.PI / 2;
  const hub = cylinder(group, .31, .25, 0, 0, 0, '#9da4a6'); hub.rotation.z = Math.PI / 2;
  const cap = cylinder(group, .12, .275, 0, 0, 0, '#535c60'); cap.rotation.z = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    for (const side of [-1, 1]) {
      const bolt = cylinder(group, .025, .018, side * .143, Math.sin(a) * .18, Math.cos(a) * .18, '#d0d2d1'); bolt.rotation.z = Math.PI / 2;
    }
  }
  batchTown(group); return group;
}
function body(parent) {
  // Side silhouette includes real openings around both axles and a swept cab corner.
  const shape = new THREE.Shape(); shape.moveTo(-4.7, .42); shape.lineTo(-4.7, 1.7);
  shape.quadraticCurveTo(-4.7, 2.8, -4.4, 3.08); shape.lineTo(4.5, 3.08);
  shape.quadraticCurveTo(4.7, 3.08, 4.7, 2.84); shape.lineTo(4.7, .42);
  for (const z of [2.9, -3]) {
    shape.lineTo(z + .57, .42); shape.absarc(z, .47, .57, 0, Math.PI, false); shape.lineTo(z - .57, .42);
  }
  shape.lineTo(-4.7, .42);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 2.33, bevelEnabled: true, bevelThickness: .045, bevelSize: .04, bevelSegments: 3, curveSegments: 16 });
  const mesh = new THREE.Mesh(geometry, paint); mesh.rotation.y = Math.PI / 2; mesh.position.x = -1.165;
  mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
}
function destination(parent) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 80;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#121a1d'; ctx.fillRect(0, 0, 512, 80);
  ctx.fillStyle = '#f3bb62'; ctx.font = 'bold 48px monospace'; ctx.textAlign = 'center'; ctx.fillText('4  CENTRUM', 256, 56);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.04, .31), new THREE.MeshBasicMaterial({ map }));
  mesh.position.set(0, 2.81, 4.64); parent.add(mesh);
}
export function detailedBus() {
  const bus = new THREE.Group(); body(bus);
  for (const side of [-1, 1]) {
    box(bus, .035, 1.14, 8.1, side * 1.23, 2.18, -.24, '#202c32');
    for (let z = -3.7; z < 4; z += 1.25) {
      const pane = box(bus, .025, 1.03, 1.16, side * 1.25, 2.2, z, '#24343d'); pane.material = glass;
      box(bus, .026, 1.1, .045, side * 1.27, 2.2, z + .6, '#323d41');
    }
    box(bus, .04, .18, 9.0, side * 1.24, 1.5, 0, '#4e7775');
    for (let row = 0; row < 5; row++) box(bus, .04, .018, 1.8, side * 1.24, .7 + row * .085, -1, '#697473');
    for (const z of [-3.4, 2.4]) {
      box(bus, .03, .17, .38, side * 1.25, .9, z, '#d1c77c');
    }
    const arm = box(bus, .38, .04, .07, side * 1.4, 2.58, 4.23, '#333e42'); arm.rotation.z = side * .2;
    box(bus, .15, .4, .28, side * 1.56, 2.39, 4.2, '#29363b');
  }
  // Entry and centre doors on the pavement side; black seals and split panes.
  for (const z of [3.25, -.55]) {
    box(bus, .04, 2.1, 1.04, 1.275, 1.65, z, '#18272b');
    for (const dz of [-.26, .26]) {
      const pane = box(bus, .03, 1.9, .47, 1.3, 1.7, z + dz, '#24343d'); pane.material = glass;
      box(bus, .035, .08, .42, 1.32, 1.04, z + dz, '#677b7d');
    }
  }
  const windshield = box(bus, 2.17, 1.18, .035, 0, 2.04, 4.72, '#263a43'); windshield.material = glass; windshield.rotation.x = -.07;
  for (const x of [-.47, .47]) {
    const wiper = box(bus, .022, .55, .035, x, 1.73, 4.79, '#242b2e'); wiper.rotation.z = .22;
  }
  box(bus, 2.34, .21, .15, 0, .56, 4.66, '#444d4f');
  for (const x of [-.85, .85]) {
    box(bus, .44, .26, .04, x, .99, 4.72, '#38454c');
    const headlight = cylinder(bus, .083, .045, x, 1.02, 4.76, '#eee9dd'); headlight.rotation.x = Math.PI / 2;
    box(bus, .15, .3, .035, x, 1.13, -4.76, '#923c35');
  }
  box(bus, .51, .11, .035, 0, .7, 4.77, '#e3ba36');
  box(bus, 1.62, .22, 2.8, 0, 3.21, -.3, '#aab4b2');
  for (let i = 0; i < 10; i++) box(bus, 1.2, .025, .035, 0, 3.34, -.95 + i * .15, '#5b696b');
  destination(bus);
  bus.userData.wheels = [-1.18, 1.18].flatMap(x => [-2.9, 3].map(z => wheel(bus, x, z)));
  bus.userData.departureLamps = [-3.8, 3.9].map(z => {
    const lamp = box(bus, .04, .12, .22, -1.285, 1.42, z, '#cf8934');
    lamp.material = material('#dd9a3c', { emissive: '#ff970e', emissiveIntensity: 0 }); return lamp;
  });
  const rearGlass = box(bus, 2.01, .92, .035, 0, 2.22, -4.77, '#24343d'); rearGlass.material = glass;
  box(bus, .51, .11, .035, 0, .78, -4.77, '#e3ba36');
  batchTown(bus, { exclude: [...bus.userData.wheels, ...bus.userData.departureLamps] });
  return bus;
}
