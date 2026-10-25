import * as THREE from './vendor/three.module.js';
import { box, cylinder, material } from './art.js';
import { textured } from './surfaces.js';
import { BUS_BAY } from './sharing-state.js';

function busSign(parent, x, z) {
  cylinder(parent, .055, 2.6, x, 1.3, z, '#788179');
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e8c54a'; ctx.fillRect(10, 0, 236, 256); ctx.fillStyle = '#213e48';
  ctx.font = 'bold 51px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BUS', 128, 89);
  ctx.font = '28px sans-serif'; ctx.fillText('CENTRUM', 128, 145); ctx.fillRect(62, 178, 132, 5); ctx.fillRect(62, 201, 132, 5);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  // Face east, towards drivers approaching the stop.
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.2), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
  face.position.set(x + .03, 2.45, z); face.rotation.y = Math.PI / 2; parent.add(face);
}

export function busBay(town) {
  const { west, east, kerb, road } = BUS_BAY, width = east - west, centre = (east + west) / 2;
  textured(box(town, width, .16, road - kerb, centre, .09, (road + kerb) / 2, '#879094', false), 'asphalt', '#879094');
  for (let i = 0; i < 6; i++) box(town, 1.05, .012, .13, west + 1.5 + i * 2, .176, road - .1, '#e8cc7c', false);
  textured(box(town, width + 1.2, .18, 1.6, centre, .18, kerb - .8, '#bdbbb3', false), 'paving', '#bdbbb3');
  const curb = material('#b4b3ad');
  for (let x = west + .6; x < east; x += 1.2) box(town, 1.18, .16, .22, x, .22, kerb + .11, '#b4b3ad').material = curb;
  for (const x of [west - .11, east + .11]) box(town, .22, .16, road - kerb, x, .22, (road + kerb) / 2, '#b4b3ad').material = curb;
  // Shelter near the front of the stopped bus, opening towards the road.
  const shelterX = west + 3, shelterZ = kerb - .9;
  const glass = material('#a9bfc1', { transparent: true, opacity: .28, metalness: .15, roughness: .14 });
  for (const side of [-1, 1]) cylinder(town, .055, 2.7, shelterX + side * 1.5, 1.5, shelterZ, '#587075');
  box(town, 3.5, .18, 1.6, shelterX, 2.91, shelterZ, '#52696b');
  box(town, 3, 2.4, .06, shelterX, 1.62, shelterZ - .65, '#a9bfc1').material = glass;
  box(town, 2.4, .12, .5, shelterX, .7, shelterZ - .4, '#9c8060');
  busSign(town, west + .3, kerb - .4);
}
