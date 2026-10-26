import * as THREE from './vendor/three.module.js';
import { box, cylinder, material } from './art.js';
import { textured } from './surfaces.js';
import { building } from './architecture.js';
import { tree } from './vegetation.js';
import { streetLamp, bench } from './buildings.js';
import { batchTown } from './batching.js';
import { AREA, CENTRES, LANE, RING_ROAD, ISLAND, CYCLE_RING } from './roundabout-layout.js';

const ARMS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // outward directions: east, south, west, north
const ROAD_WIDTH = 8, ARM_LENGTH = 70;

function flatRing(parent, inner, outer, x, z, y, kind, color) {
  const mesh = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 72), material(color));
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z); mesh.receiveShadow = true; parent.add(mesh);
  if (kind) textured(mesh, kind, color);
  return mesh;
}
// Sign faces are drawn on a y-up unit square (one opaque 512 px texture) and cut to shape by the mesh, so mip levels never fringe.
const TAU = Math.PI * 2, SIGN_PX = 512, WHITE = '#fafafa', RED = '#c8202a', BLUE = '#0e5ca8';
const SIDE = .94, CIRCUM = SIDE / Math.sqrt(3), CENTROID = .5 + SIDE * Math.sqrt(3) / 12; // B6: inverted equilateral triangle, box centred on .5
const inverted = k => [150, 30, 270].map(d => [.5 + CIRCUM * k * Math.cos(d * TAU / 360), CENTROID + CIRCUM * k * Math.sin(d * TAU / 360)]);
function rounded(path, points, round) {
  points.forEach((p, i) => {
    const near = q => [p[0] + (q[0] - p[0]) * round, p[1] + (q[1] - p[1]) * round];
    const from = near(points[(i + points.length - 1) % points.length]), to = near(points[(i + 1) % points.length]);
    if (i) path.lineTo(...from); else path.moveTo(...from);
    path.quadraticCurveTo(...p, ...to);
  });
  path.closePath();
}
const giveWay = ctx => { // B6: red border, white inside
  ctx.fillStyle = RED; ctx.fillRect(0, 0, 1, 1); ctx.fillStyle = WHITE; ctx.beginPath(); rounded(ctx, inverted(.687), .09); ctx.fill();
};
// D1: blue disc with a thin white rim and three white arrows circulating anticlockwise (right-hand traffic).
const roundaboutSign = ctx => {
  const R = .27, BAND = .042, HEAD = .095, HEAD_LENGTH = .48, BODY = 1.3, at = (r, a) => [.5 + r * Math.cos(a), .5 + r * Math.sin(a)];
  ctx.fillStyle = WHITE; ctx.fillRect(0, 0, 1, 1); ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(.5, .5, .47, 0, TAU); ctx.fill();
  ctx.fillStyle = WHITE;
  for (let i = 0; i < 3; i++) {
    const tip = Math.PI / 2 + i * TAU / 3, base = tip - HEAD_LENGTH, tail = base - BODY; // angles grow anticlockwise on the sign
    ctx.beginPath(); ctx.arc(.5, .5, R + BAND, tail, base);
    ctx.lineTo(...at(R + HEAD, base)); ctx.lineTo(...at(R, tip)); ctx.lineTo(...at(R - HEAD, base));
    ctx.arc(.5, .5, R - BAND, base, tail, true); ctx.closePath(); ctx.fill();
  }
};
const triangle = () => { const shape = new THREE.Shape(); rounded(shape, inverted(1), .07); return new THREE.ShapeGeometry(shape, 10).translate(-.5, -.5, 0); };
const FACES = { giveWay: { draw: giveWay, geometry: triangle }, roundabout: { draw: roundaboutSign, geometry: () => new THREE.CircleGeometry(.5, 96) } };
function signFace(face) {
  if (!face.material) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = SIGN_PX;
    const ctx = canvas.getContext('2d'); ctx.setTransform(SIGN_PX, 0, 0, -SIGN_PX, 0, SIGN_PX); face.draw(ctx);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    map.generateMipmaps = true; map.minFilter = THREE.LinearMipmapLinearFilter; map.anisotropy = 16; // clamped to the GPU limit
    face.material = new THREE.MeshBasicMaterial({ map }); face.shape = face.geometry();
  }
  return new THREE.Mesh(face.shape, face.material);
}
function signPost(parent, x, z, rotation, face, size = 1.3, height = 2.3) {
  const group = new THREE.Group(); parent.add(group);
  cylinder(group, .055, height + .3, 0, (height + .3) / 2, 0, '#7a837c');
  const plate = signFace(face); plate.scale.set(size, size, 1); plate.position.set(0, height, .075); group.add(plate); // in front of the pole
  group.position.set(x, 0, z); group.rotation.y = rotation;
}

function roundabout(parent, { x, z }) {
  flatRing(parent, RING_ROAD[1], CYCLE_RING - 1.2, x, z, .13, 'paving', '#c8c4bb');
  flatRing(parent, RING_ROAD[0], RING_ROAD[1], x, z, .165, 'asphalt', '#879094');
  flatRing(parent, CYCLE_RING - 1, CYCLE_RING + 1, x, z, .175, 'asphalt', '#ce9889');
  flatRing(parent, CYCLE_RING + 1, CYCLE_RING + 2.6, x, z, .13, 'paving', '#c8c4bb');
  // Raised island with a mountable apron, planting and a tree.
  textured(cylinder(parent, ISLAND + .5, .14, x, .2, z, '#b9b4a8'), 'paving', '#b9b4a8');
  textured(cylinder(parent, ISLAND - .3, .36, x, .3, z, '#7f9a63'), 'grass', '#7f9a63');
  tree(parent, x, z, 1.1);
  for (const [dx, dz] of ARMS) {
    const heading = Math.atan2(-dx, -dz), right = [dz, -dx];
    // Incoming lane: shark teeth at the ring edge, then give-way and roundabout signs on the right.
    const laneX = x + right[0] * LANE, laneZ = z + right[1] * LANE;
    for (let i = -1.5; i <= 1.5; i += .75) {
      const shape = new THREE.Shape(); shape.moveTo(-.27, 0); shape.lineTo(.27, 0); shape.lineTo(0, -.65); shape.closePath();
      const tooth = new THREE.Mesh(new THREE.ShapeGeometry(shape), material('#f2f2e8', { side: THREE.DoubleSide }));
      tooth.rotation.set(-Math.PI / 2, 0, heading + Math.PI); // points back at the driver who gives way
      tooth.position.set(laneX + dx * (RING_ROAD[1] + .9) + right[0] * i, .19, laneZ + dz * (RING_ROAD[1] + .9) + right[1] * i);
      parent.add(tooth);
    }
    const signX = x + dx * (CYCLE_RING + 4) + right[0] * (ROAD_WIDTH / 2 + .9), signZ = z + dz * (CYCLE_RING + 4) + right[1] * (ROAD_WIDTH / 2 + .9);
    signPost(parent, signX, signZ, heading + Math.PI, FACES.giveWay, 1.25, 2.1);
    signPost(parent, signX, signZ, heading + Math.PI, FACES.roundabout, .95, 3.1);
  }
}

function armRoad(parent, from, to, axis) {
  const length = Math.abs(to - from), middle = (from + to) / 2;
  const [w, d, x, z] = axis.dir === 'x' ? [length, ROAD_WIDTH, middle, axis.at] : [ROAD_WIDTH, length, axis.at, middle];
  textured(box(parent, w + (axis.dir === 'x' ? 0 : 3), .14, d + (axis.dir === 'x' ? 3 : 0), x, .06, z, '#c8c4bb', false), 'paving', '#c8c4bb');
  textured(box(parent, w, .1, d, x, .11, z, '#879094', false), 'asphalt', '#879094');
  for (let s = Math.min(from, to) + 2; s < Math.max(from, to) - 2; s += 5) {
    box(parent, axis.dir === 'x' ? 2.1 : .12, .012, axis.dir === 'x' ? .12 : 2.1, axis.dir === 'x' ? s : axis.at, .168, axis.dir === 'x' ? axis.at : s, '#f0e9d5', false);
  }
}

export function createRoundabouts(scene) {
  const area = new THREE.Group(); scene.add(area);
  const west = CENTRES[1].x - ARM_LENGTH, east = CENTRES[0].x + ARM_LENGTH;
  textured(box(area, east - west + 80, .6, 170, (east + west) / 2, -.2, AREA.z, '#899574', false), 'grass', '#899574');
  const edge = RING_ROAD[1] - .3;
  armRoad(area, CENTRES[0].x + edge, east, { dir: 'x', at: AREA.z });
  armRoad(area, CENTRES[1].x + edge, CENTRES[0].x - edge, { dir: 'x', at: AREA.z });
  armRoad(area, west, CENTRES[1].x - edge, { dir: 'x', at: AREA.z });
  for (const centre of CENTRES) for (const side of [-1, 1]) {
    armRoad(area, centre.z + side * edge, centre.z + side * 60, { dir: 'z', at: centre.x });
  }
  CENTRES.forEach(centre => roundabout(area, centre));
  // Terraced houses face the connecting street; gaps leave room for the side roads and cycle paths.
  const colors = ['#b99177', '#a87561', '#ba8971', '#b5ad9c', '#c4aa8e', '#947360'];
  let seed = 0;
  for (let x = west + 6; x < east - 4; x += 9) {
    const nearRoundabout = CENTRES.some(centre => Math.abs(x - centre.x) < CYCLE_RING + 8);
    if (nearRoundabout) continue;
    for (const side of [-1, 1]) building(area, { x, z: AREA.z + side * 15, width: 7, height: 6.8 + seed % 3,
      color: colors[seed++ % colors.length], variant: seed % 6, facing: side < 0 ? 0 : Math.PI });
  }
  for (const centre of CENTRES) for (const [dx, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    tree(area, centre.x + dx * 22, centre.z + dz * 22, 1.2);
    streetLamp(area, centre.x + dx * (CYCLE_RING + 3.4), centre.z + dz * 4.6, dz > 0 ? Math.PI : 0);
  }
  bench(area, CENTRES[0].x + 20, AREA.z + 21, Math.PI);
  batchTown(area);
  return area;
}
