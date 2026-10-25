import * as THREE from './vendor/three.module.js';
import { routeFor } from './routes.js';
import { playerPose, laneState } from './lane-change.js';
import { isLaneKind } from './lane-kind.js';

// The lane camera of the merge lessons. The Following camera cannot show a lane 3.5 m to the side, so this one sits 40 m behind and above.
// Metres (design values). `side` is -1 or 1: the side of the other lane. It comes back to 0 while the car crosses.
export const LANE_VIEW = { back: 40, side: 3, up: 8, lookBack: 20, lookSide: 4, lookUp: 1 };
// The street lessons need people, a tram door and a rider in view, so the camera is closer and looks ahead of the car (lookBack < 0).
export const STREET_VIEW = { look: 4, lookAhead: 16, back: 17, side: 1.6, up: 5.6, lookBack: -9, lookSide: 2.2, lookUp: 1 };
// The Look camera of the siren lesson (chapter 06). The cross road starts 4 m ahead of the stop line, so the camera sits further back and looks ahead.
// A phone view is only about 6 m wide at 13 m, so a view that looks straight across the road shows only a house wall.
export const SIREN_LOOK = { look: 10, behind: 9, ahead: 5 };
export const lookCamera = mission => mission.kind === 'siren' ? SIREN_LOOK : null;
// The Following camera of the other lessons as a lane view. A hazard clip may set `view` (recordClip puts it on the mission as `clipView`) to move its camera: the fields
// replace those of the lane view of its lesson, or of this one. In the Following view a positive `lookSide` aims to the driver's right. In a lane lesson it aims to the side of the other lane.
export const CHASE_VIEW = { back: 9, side: 0, up: 3.4, lookBack: -7, lookSide: 0, lookUp: 1.3 };
// { side } for a merge lesson, else null (a clip with its own `view` gets a side of 1). A merger's camera returns to the centre during the move.
export function laneCamera(mission, snapshot) {
  const own = mission.clipView;
  if (!isLaneKind(mission)) return own ? { side: 1, view: { ...CHASE_VIEW, ...own } } : null;
  const progress = mission.lane.role === 'merger' && snapshot.merge ? laneState(mission, snapshot.merge, snapshot.distance, snapshot.time ?? 0).progress : 0;
  const view = own ? { ...(mission.kind === 'street' ? STREET_VIEW : LANE_VIEW), ...own } : mission.kind === 'street' ? STREET_VIEW : undefined;
  return { side: (mission.lane.side ?? 0) * (1 - progress), ...view && { view } };
}

export function laneView(player, forward, side, view = LANE_VIEW) {
  const right = new THREE.Vector3(-forward.z, 0, forward.x), { back, up, lookBack, lookUp } = view;
  return { position: player.clone().addScaledVector(forward, -back).addScaledVector(right, side * view.side).add(new THREE.Vector3(0, up, 0)),
    target: player.clone().addScaledVector(forward, -lookBack).addScaledVector(right, side * view.lookSide).add(new THREE.Vector3(0, lookUp, 0)) };
}
// The point the decision view frames. A merge with another vehicle: halfway between the learner and that vehicle.
// A merge with none (signal, hatched, lane-end, speed): 8 m ahead of the learner. Other lessons: the gate.
export function decisionFocus(mission, snapshot, actor = null) {
  const route = routeFor(mission);
  if (!isLaneKind(mission)) return route.at(mission.gate);
  const me = playerPose(route, mission, snapshot);
  if (actor) return { x: (me.x + actor.x) / 2, z: (me.z + actor.z) / 2 };
  return { x: me.x + Math.sin(me.heading) * 8, z: me.z + Math.cos(me.heading) * 8 };
}
