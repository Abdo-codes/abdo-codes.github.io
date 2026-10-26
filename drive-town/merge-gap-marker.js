import * as THREE from './vendor/three.module.js';
import { ROUTES } from './routes.js';
import { offsetPoint } from './lane-change.js';
import { mergeBusy } from './merge-gap.js';
import { usingHints } from './practice.js';

// Guided help: a translucent strip in the target lane beside the learner. Green when Merge would pass, red when it would not.
const LENGTH = 5, WIDTH = 3.3;
export function createGapMarker(scene) {
  const marker = new THREE.Mesh(new THREE.PlaneGeometry(LENGTH, WIDTH),
    new THREE.MeshBasicMaterial({ color: '#4fbf7a', transparent: true, opacity: .42, depthWrite: false, toneMapped: false }));
  marker.rotation.x = -Math.PI / 2; marker.visible = false; marker.renderOrder = 2; scene.add(marker);
  return marker;
}
export function updateGapMarker(marker, state, snapshot) {
  const mission = state.mission, lane = mission.lane;
  const shown = mission.kind === 'merge' && lane.to !== undefined && state.status === 'driving' && !snapshot.merge && usingHints(state);
  marker.visible = shown; if (!shown) return;
  const point = offsetPoint(ROUTES[mission.route].at(snapshot.distance), lane.to);
  marker.position.set(point.x, .2, point.z); marker.rotation.z = point.heading - Math.PI / 2;
  marker.material.color.set(mergeBusy(mission, snapshot) ? '#df5a47' : '#4fbf7a');
}
