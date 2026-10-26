import * as THREE from './vendor/three.module.js';
import { laneView } from './lane-camera.js';
import { isLaneKind } from './lane-kind.js';

export const CAMERA_LABELS = { overview: 'Overview', chase: 'Following', 'look-right': 'Look right', 'look-left': 'Look left' };
export const DEFAULT_MODES = ['overview', 'chase', 'look-right'];
// The merge lessons cycle Following (the lane camera) and Look on the side of the indicator. The ready screen keeps Overview.
// The siren lesson cycles Following and Look towards the ambulance; the red-hold variant (ambulance behind) keeps Following only.
export const cameraModes = mission => isLaneKind(mission) ? ['chase', mission.lookSide]
  : mission?.kind === 'siren' ? mission.before === 'red' ? ['chase'] : ['chase', mission.flip ? 'look-right' : 'look-left'] : DEFAULT_MODES;
export function nextCameraMode(mode, modes = DEFAULT_MODES) {
  return modes[(modes.indexOf(mode) + 1) % modes.length];
}
// `view` places the overview window of a route (route.view, in route metres from `area`). `lane` is { side } for the lane camera.
// `lookView` is { look, behind, ahead } for a Look camera that must show a cross road ahead (lookCamera in lane-camera.js).
// `aspect` is the canvas width over its height. A view with a `narrow` entry swaps its centre and eye for it on a canvas that is taller than wide.
export function drivingView(player, forward, mode, speed = 0, area = { x: 0, z: 0 }, view = null, lane = null, lookView = null, aspect = 1.5) {
  if (mode === 'overview') {
    if (view) { const { centre, eye } = aspect < 1 && view.narrow ? view.narrow : view;
      return { position: new THREE.Vector3(area.x + centre + eye[0], eye[1], area.z + eye[2]), target: new THREE.Vector3(area.x + centre + view.look[0], 0, area.z + view.look[1]) }; }
    return { position: new THREE.Vector3(62 + area.x, 65, 76 + area.z), target: new THREE.Vector3(-3 + area.x, 0, area.z) };
  }
  if (mode === 'look-right' || mode === 'look-left') {
    const sign = mode === 'look-right' ? 1 : -1, right = new THREE.Vector3(-forward.z, 0, forward.x);
    return { position: player.clone().addScaledVector(right, -(lane?.view?.look ?? lookView?.look ?? 10) * sign).addScaledVector(forward, -(lookView?.behind ?? 3)).add(new THREE.Vector3(0, 6, 0)),
      target: player.clone().addScaledVector(right, 3 * sign).addScaledVector(forward, lane?.view?.lookAhead ?? lookView?.ahead ?? 0).add(new THREE.Vector3(0, 1.3, 0)) };
  }
  if (lane) return laneView(player, forward, lane.side, lane.view);
  return { position: player.clone().addScaledVector(forward, -(8.5 + Math.min(Math.max(speed, 0), 50) * .025)).add(new THREE.Vector3(0, 3.4, 0)),
    target: player.clone().addScaledVector(forward, 7 + Math.min(Math.max(speed, 0), 50) * .04).add(new THREE.Vector3(0, 1.3, 0)) };
}

// The field of view (degrees, vertical) of a hazard clip or an exam scene. A canvas that is taller than wide shows a narrow slice at 55, so a road user at the side can be out of the picture.
// Below an aspect of 1 the view widens until it shows as much to the side as a square canvas does, up to 80.
export const BASE_FOV = 55, MAX_FOV = 80;
export const clipFov = aspect => aspect >= 1 ? BASE_FOV : Math.min(MAX_FOV, 2 * Math.atan(Math.tan(BASE_FOV / 2 * Math.PI / 180) / Math.max(aspect, .01)) * 180 / Math.PI);

export function cameraBlend(dt) { return 1 - Math.exp(-4.7 * Math.min(Math.max(dt, 0), .1)); }
