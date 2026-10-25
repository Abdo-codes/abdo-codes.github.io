import * as THREE from './vendor/three.module.js';
import { box, cylinder } from './art.js';
import { speedSign } from './buildings.js';
import { textured } from './surfaces.js';
import { MISSIONS } from './missions.js';
import { lightPhase } from './lesson-state.js';
import { createSharingScenery } from './sharing-scenery.js';
import { createSignalScenery } from './signal-scenery.js';
import { signPose, stopLine, trafficLight, setLamps } from './signal-parts.js';

function polygon(ctx, sides, radius, angle) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = angle + i * Math.PI * 2 / sides;
    const x = 128 + Math.cos(a) * radius, y = 128 + Math.sin(a) * radius;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath(); ctx.fill();
}
function prioritySign(parent, distance, stop) {
  const pose = signPose(distance), group = new THREE.Group(); parent.add(group);
  cylinder(group, .055, 2.6, 0, 1.3, 0, '#788179');
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'), sides = stop ? 8 : 3, angle = stop ? Math.PI / 8 : Math.PI / 2;
  ctx.fillStyle = stop ? '#fafafa' : '#bd2525'; polygon(ctx, sides, 124, angle);
  ctx.fillStyle = stop ? '#bd2525' : '#fafafa'; polygon(ctx, sides, stop ? 116 : 88, angle);
  if (stop) {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 68px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('STOP', 128, 131);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
  face.position.set(0, 2.4, .02); group.add(face);
  group.position.set(pose.x, 0, pose.z); group.rotation.y = pose.rotation;
}
export function createLessonScenery(scene, firstSigns) {
  const group = new THREE.Group(); group.visible = false; scene.add(group);
  const [light, stop, yieldMission, limit] = MISSIONS.slice(5);
  const lamps = trafficLight(group, light.gate + 2.25);
  stopLine(group, light.gate); stopLine(group, stop.gate); stopLine(group, yieldMission.gate, true);
  prioritySign(group, stop.gate + 2.25, true); prioritySign(group, yieldMission.gate + 2.25, false);
  const lightLimits = new THREE.Group(), changingLimits = new THREE.Group(); group.add(lightLimits, changingLimits);
  for (const [distance, maximum, parent] of [[light.start, 50, lightLimits], [limit.start, 50, changingLimits], [limit.changeAt, 30, changingLimits]]) {
    const pose = signPose(distance === limit.changeAt ? distance + 2.25 : distance); speedSign(parent, pose.x, pose.z, pose.rotation, maximum);
  }
  // A crossing priority road for chapter two, with traffic approaching from the left.
  textured(box(group, 26, .07, 10, -34, .08, -18, '#c8c4bb', false), 'paving', '#c8c4bb');
  textured(box(group, 26, .035, 8, -34, .19, -18, '#879094', false), 'asphalt', '#879094');
  const updateSharing = createSharingScenery(scene), updateSignals = createSignalScenery(scene);
  return (state, display = null) => {
    const second = state.missionIndex >= 5 && state.missionIndex < 9;
    group.visible = second; firstSigns.visible = state.missionIndex < 5;
    updateSharing(state, display); updateSignals(state, display);
    // The final lesson revisits the light approach on a new lap with a lower limit.
    // Its 30 sign must not appear beside the earlier lesson's 50 sign.
    lightLimits.visible = state.missionIndex !== 8; changingLimits.visible = state.missionIndex === 8;
    const phase = state.missionIndex > 5 ? 'green' : lightPhase(state.missionIndex === 5 ? state.mission : light, display ?? state);
    setLamps(lamps, phase);
  };
}
