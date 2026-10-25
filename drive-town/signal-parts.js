import * as THREE from './vendor/three.module.js';
import { box, cylinder, material } from './art.js';
import { routeAt } from './route.js';

// Signs face the approaching learner; the model's forward axis is +Z.
export function signPose(distance, offset = 3.6) {
  const p = routeAt(distance);
  return { x: p.x - p.dz * offset, z: p.z + p.dx * offset, rotation: p.heading + Math.PI };
}
export function stopLine(parent, distance, teeth = false) {
  // The front bumper reaches the marking when the car's centre reaches the gate.
  const p = routeAt(distance + 2.25), group = new THREE.Group(); parent.add(group);
  group.position.set(p.x, .23, p.z); group.rotation.y = p.heading;
  if (!teeth) box(group, 3.9, .015, .38, 0, 0, 0, '#f2f2e8', false);
  else for (let x = -1.6; x <= 1.6; x += .8) {
    const shape = new THREE.Shape(); shape.moveTo(-.28, 0); shape.lineTo(.28, 0); shape.lineTo(0, .65); shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material('#f2f2e8', { side: THREE.DoubleSide }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.x = x; group.add(mesh);
  }
}
// A soft round glow that sits on the lit lamp. About 22 px wide at 40 m on a phone.
let glowMap;
function glowTexture() {
  if (glowMap) return glowMap;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d'), fade = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  fade.addColorStop(0, '#fff'); fade.addColorStop(.28, '#fffa'); fade.addColorStop(1, '#fff0');
  ctx.fillStyle = fade; ctx.fillRect(0, 0, 64, 64);
  glowMap = new THREE.CanvasTexture(canvas); glowMap.colorSpace = THREE.SRGBColorSpace; return glowMap;
}
const LAMP_ON = ['#ff4132', '#ffc446', '#55e792'], PHASES = ['red', 'amber', 'green'];
export function trafficLight(parent, distance) {
  const pose = signPose(distance), group = new THREE.Group(); parent.add(group);
  cylinder(group, .065, 3.8, 0, 1.9, 0, '#606963');
  box(group, .65, 1.85, .35, 0, 3.8, 0, '#242a2b');
  const lamps = LAMP_ON.map((color, i) => {
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(.22, 24), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
    lamp.position.set(0, 4.38 - i * .57, .184); group.add(lamp);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    glow.scale.setScalar(2.4); glow.position.z = .3; lamp.add(glow); lamp.userData.glow = glow; return lamp;
  });
  group.position.set(pose.x, 0, pose.z); group.rotation.y = pose.rotation;
  return lamps;
}
// Lights the lamp of `phase` (red, amber or green) and dims the other two.
export function setLamps(lamps, phase) {
  const on = Math.max(0, PHASES.indexOf(phase));
  lamps.forEach((lamp, i) => { lamp.material.color.set(i === on ? LAMP_ON[i] : '#242c28'); lamp.userData.glow.visible = i === on; });
}
