import * as THREE from './vendor/three.module.js';
import { box, cylinder, material } from './art.js';
import { speedSign } from './buildings.js';
import { routeAt } from './route.js';
import { SHARING_MISSIONS } from './missions.js';
import { railwayState } from './sharing-state.js';

function roadside(parent, distance, width, height, draw, offset = 4.3) {
  const p = routeAt(distance), group = new THREE.Group(); parent.add(group);
  cylinder(group, .055, 2.6, 0, 1.3, 0, '#788179');
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  draw(canvas.getContext('2d'));
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
  face.position.set(0, 2.45, .03); group.add(face);
  group.position.set(p.x - p.dz * offset, 0, p.z + p.dx * offset); group.rotation.y = p.heading + Math.PI;
  return group;
}
function arrow(ctx, x, up, color) {
  ctx.fillStyle = color; ctx.fillRect(x - 11, 65, 22, 130);
  ctx.beginPath(); ctx.moveTo(x, up ? 39 : 217); ctx.lineTo(x - 32, up ? 81 : 175); ctx.lineTo(x + 32, up ? 81 : 175); ctx.closePath(); ctx.fill();
}
function passage(parent, mission) {
  roadside(parent, mission.gate - 1, 1.65, 1.65, ctx => {
    ctx.fillStyle = '#c53732'; ctx.beginPath(); ctx.arc(128, 128, 123, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(128, 128, 99, 0, Math.PI * 2); ctx.fill();
    arrow(ctx, 90, false, '#242a2c'); arrow(ctx, 163, true, '#c53732');
  });
  // The opposite lane is closed; the assisted route stays inside the single open passage.
  for (let z = -17; z <= -10; z += 2.1) {
    const cone = cylinder(parent, .31, .85, -39.3, .62, z, '#da7842', .07);
    box(parent, .68, .09, .68, cone.position.x, .24, z, '#47534d');
    cylinder(parent, .17, .14, -39.3, .78, z, '#f3ece0', .13);
  }
  box(parent, 2.4, .07, 8, -41.1, .23, -13.5, '#c1b397', false);
}
function busRoute(parent, mission) {
  roadside(parent, mission.start + 6, 2.6, 1.25, ctx => {
    ctx.fillStyle = '#315776'; ctx.fillRect(0, 42, 256, 170); ctx.fillStyle = '#fff'; ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DRIVE TOWN', 128, 145);
  });
}
function railway(parent, mission) {
  const track = routeAt(mission.gate + 7), marking = routeAt(mission.gate + 2.25);
  box(parent, 3.5, .035, 132, track.x, .195, -4, '#9c9e91', false);
  for (let z = -68; z <= 60; z += 1.4) box(parent, 2.5, .06, .23, track.x, .21, z, '#6d665d');
  for (const offset of [-.73, .73]) box(parent, .08, .10, 132, track.x + offset, .25, -4, '#aeb8b9');
  box(parent, .38, .015, 3.9, marking.x, .24, marking.z, '#f5eee2', false);
  const pivots = [], lamps = [];
  for (const approach of [-1, 1]) for (const side of [-1, 1]) {
    const group = new THREE.Group(); parent.add(group);
    group.position.set(track.x + approach * 4.75, 0, -26); group.rotation.y = approach === -1 ? marking.heading : marking.heading + Math.PI;
    const x = side * 4.5;
    box(group, .7, 1.3, .6, x, .8, 0, '#d3d7ce');
    cylinder(group, .075, 3.8, x, 1.9, 0, '#747d77');
    const pivot = new THREE.Group(); group.add(pivot); pivot.position.set(x, 1.5, 0);
    box(pivot, 4.25, .13, .17, -side * 2.12, 0, 0, '#f0eee5');
    for (let segment = 0; segment < 5; segment++) box(pivot, .39, .145, .19, -side * (.33 + segment * .8), 0, 0, '#c3483a');
    pivots.push({ pivot, side });
    // Signal faces look back along the approaching road.
    const signals = new THREE.Group(); group.add(signals); signals.position.set(x, 2.8, 0); signals.rotation.y = Math.PI;
    box(signals, 1.4, .7, .2, 0, 0, 0, '#252c2a');
    for (const lampX of [-.38, .38]) {
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(.24, 24), new THREE.MeshBasicMaterial({ color: '#ff3f30', toneMapped: false }));
      lamp.position.set(lampX, 0, .12); signals.add(lamp); lamps.push(lamp);
    }
    for (const angle of [-.65, .65]) { const cross = box(signals, 1.65, .18, .07, 0, .86, .04, '#f5efdc'); cross.rotation.z = angle; }
  }
  return (state, view) => {
    const phase = railwayState(state.mission, view);
    pivots.forEach(({ pivot, side }) => { pivot.rotation.z = -side * phase.barrierAngle; });
    lamps.forEach((lamp, index) => lamp.material.color.set(phase.red && index % 2 === Math.floor(view.time * 2.5) % 2 ? '#ff3f30' : '#342424'));
  };
}
export function createSharingScenery(scene) {
  const groups = SHARING_MISSIONS.map(mission => {
    const group = new THREE.Group(); group.visible = false; scene.add(group);
    const p = routeAt(mission.start); speedSign(group, p.x - p.dz * 4.2, p.z + p.dx * 4.2, p.heading + Math.PI, 30);
    if (mission.kind === 'bus') busRoute(group, mission);
    if (mission.kind === 'narrow') passage(group, mission);
    return { group, kind: mission.kind, update: mission.kind === 'rail' ? railway(group, mission) : null };
  });
  return (state, display = null) => {
    groups.forEach(({ group, kind, update }) => {
      group.visible = state.mission.kind === kind;
      if (group.visible) update?.(state, display ?? state);
    });
  };
}
