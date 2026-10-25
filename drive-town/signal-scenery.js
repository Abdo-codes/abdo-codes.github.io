import * as THREE from './vendor/three.module.js';
import { box } from './art.js';
import { speedSign } from './buildings.js';
import { textured } from './surfaces.js';
import { MISSIONS } from './missions.js';
import { lightPhase } from './lesson-state.js';
import { signPose, stopLine, trafficLight, setLamps } from './signal-parts.js';

// Scenery of chapter 06: a pole with three lamps, the stop line and a 50 sign for each lesson (amber, siren, priority).
// Lesson 20 also gets the west street crossing again, with the numbers of the chapter 2 crossing (lesson-scenery.js).
const KINDS = ['amber', 'siren', 'priority'];
export function createSignalScenery(scene) {
  const groups = MISSIONS.map((mission, index) => ({ mission, index })).filter(({ mission }) => KINDS.includes(mission.kind)).map(({ mission, index }) => {
    const group = new THREE.Group(); group.visible = false; scene.add(group);
    const lamps = trafficLight(group, mission.gate + 2.25); stopLine(group, mission.gate);
    const pose = signPose(mission.start + 4); speedSign(group, pose.x, pose.z, pose.rotation, 50);
    if (mission.kind === 'priority') {
      textured(box(group, 26, .07, 10, -34, .08, -18, '#c8c4bb', false), 'paving', '#c8c4bb');
      textured(box(group, 26, .035, 8, -34, .19, -18, '#879094', false), 'asphalt', '#879094');
    }
    return { group, lamps, index };
  });
  return (state, display = null) => {
    for (const { group, lamps, index } of groups) {
      group.visible = state.missionIndex === index;
      if (group.visible) setLamps(lamps, lightPhase(state.mission, display ?? state));
    }
  };
}
