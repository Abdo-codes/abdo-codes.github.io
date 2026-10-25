import * as THREE from './vendor/three.module.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { part, wheel, colored, trianglesOf } from './lane-car-model.js';

// The tram of lesson 21: 24 m by 2.65 m by 3.4 m, two sections with a bellows, blue and white. Forward is +z. The doors and the door lamps are on the -x side,
// which is the learner side when the tram runs in the learner direction. Door panels slide along z; the four door lamps are one InstancedMesh.
// The geometry is shared by every tram. At most 4,500 triangles.
export const TRAM = { length: 24, width: 2.65, height: 3.4, doors: [-10, -4, 4, 10], slide: .55, lampY: 3.02 };
const WHITE = '#eef1ef', BLUE = '#1f5aa0', DARK = '#252f35', ROOF = '#bfc5c6', GLASS = '#33444e', INSIDE = '#c8c2b3';
const W = TRAM.width / 2, SIDE = -W - .02;
const tilted = (w, h, d, x, y, z, color, angle) => colored(new THREE.BoxGeometry(w, h, d).rotateX(angle).translate(x, y, z), color);
const section = z => [
  part(TRAM.width, .62, 11.2, 0, 1.22, z, BLUE), part(TRAM.width, 1.7, 11.2, 0, 2.38, z, WHITE), part(TRAM.width - .2, .12, 11.2, 0, 3.28, z, ROOF),
  ...[-1, 1].map(side => part(.03, .9, 10.6, side * (W + .005), 2.5, z, GLASS)), part(TRAM.width - .1, .5, 10.4, 0, .66, z, DARK),
];
function staticParts() {
  const out = [...section(-6.2), ...section(6.2), part(TRAM.width - .5, 2.3, 1.2, 0, 2.05, 0, DARK)];
  for (const [z, face] of [[12.02, 1], [-12.02, -1]]) {
    out.push(part(TRAM.width - .1, 1.1, .06, 0, 2.55, z, GLASS), part(TRAM.width, .5, .12, 0, 1.4, z, face > 0 ? BLUE : '#7c1f22'), part(.5, .16, .08, .8, 1.1, z, face > 0 ? '#fff7d6' : '#ff2a24'),
      part(.5, .16, .08, -.8, 1.1, z, face > 0 ? '#fff7d6' : '#ff2a24'));
  }
  for (const z of [-8.5, 0, 8.5]) out.push(wheel(.95, .36, z - .6, .36, .12), wheel(-.95, .36, z - .6, .36, .12), wheel(.95, .36, z + .6, .36, .12), wheel(-.95, .36, z + .6, .36, .12));
  // The door openings on the learner side: a dark frame and a light inside. The panels in front of them slide.
  for (const z of TRAM.doors) out.push(part(.05, 1.95, 1.3, SIDE + .015, 1.62, z, INSIDE), part(.06, .08, 1.4, SIDE, 2.62, z, DARK), part(.06, .08, 1.4, SIDE, .66, z, DARK));
  // Pantograph on the front section: a base, two arms, a bar. Roof units on both sections.
  out.push(part(1.6, .1, 1.4, 0, 3.4, -5), tilted(.08, 1.5, .08, .6, 4.05, -5.5, DARK, .5), tilted(.08, 1.5, .08, -.6, 4.05, -5.5, DARK, .5), part(1.7, .06, .14, 0, 4.7, -4.8, DARK));
  for (const z of [-8.6, -3.2, 3.2, 8.6]) out.push(part(1.5, .35, 1.6, 0, 3.52, z, '#aab1b3'));
  return out;
}
const panels = side => TRAM.doors.flatMap(z => [part(.04, 1.9, .55, SIDE - .01, 1.62, z + side * .28, '#3f6f93'), part(.045, .85, .4, SIDE - .02, 1.95, z + side * .28, GLASS)]);
export const LAMP_COLORS = { green: '#38d46a', amber: '#ffb21e', off: '#3a4044' };
export function tram() {
  const group = new THREE.Group(), material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5, metalness: .2 });
  const body = new THREE.Mesh(mergeGeometries(staticParts()), material); body.castShadow = true; group.add(body);
  const doors = [1, -1].map(side => { const mesh = new THREE.Mesh(mergeGeometries(panels(side)), material); mesh.castShadow = true; group.add(mesh); return mesh; });
  const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(.06, .12, .5), new THREE.MeshBasicMaterial({ toneMapped: false }), TRAM.doors.length), matrix = new THREE.Matrix4();
  TRAM.doors.forEach((z, i) => { lamps.setMatrixAt(i, matrix.makeTranslation(SIDE - .01, TRAM.lampY, z)); lamps.setColorAt(i, new THREE.Color(LAMP_COLORS.off)); });
  group.add(lamps); group.userData = { body, doors, lamps, kind: 'tram', lamp: 'off', open: -1 };
  return group;
}
// `open` is 0 (closed) to 1 (open); `lamp` is 'green', 'amber' or 'off'. Only touches the GPU data when a value changes.
export function setTramDoors(group, open, lamp) {
  const data = group.userData;
  if (Math.abs(open - data.open) > .002) { data.open = open; data.doors[0].position.z = open * TRAM.slide; data.doors[1].position.z = -open * TRAM.slide; }
  if (lamp !== data.lamp) {
    data.lamp = lamp; const color = new THREE.Color(LAMP_COLORS[lamp] ?? LAMP_COLORS.off);
    for (let i = 0; i < TRAM.doors.length; i++) data.lamps.setColorAt(i, color);
    data.lamps.instanceColor.needsUpdate = true;
  }
}
export const tramTriangles = () => trianglesOf(mergeGeometries(staticParts())) + trianglesOf(mergeGeometries(panels(1))) * 2;
