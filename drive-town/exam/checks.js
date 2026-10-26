import { speedLimit } from '../lesson-state.js';
import { hazardActive } from '../hazard.js';
import { MISSIONS } from '../missions.js';
import { rear } from '../street-state.js';

// Named machine checks for scene items. Each takes the snapshot at the freeze frame and the scene, and returns the right answer
// that the picture shows: a number for a fill item, a pin id for a hotspot item. The scene test runs every check named by an item.
export const CHECKS = {
  'limit-now': snapshot => speedLimit(snapshot.scenario, snapshot.distance),
  'limit-next': snapshot => snapshot.scenario.nextLimit ?? speedLimit(snapshot.scenario, snapshot.distance),
  // The road user goes first while the hazard is active at the freeze frame; otherwise the player does. A lane car (merge lessons) is a road user too.
  // A pin with `first: true` (street scenes) is the one who goes first; it takes the place of the actor pin and the lane pin.
  'who-first': (snapshot, scene) => {
    const index = MISSIONS.findIndex(mission => mission.id === scene.mission), other = hazardActive(index, snapshot);
    return scene.pins.find(pin => other ? pin.first ?? (pin.at === 'actor' || pin.at === 'lane') : pin.at === 'player').id;
  },
  // The paint that forbids the pass: the first zone of the overtake lesson that is not behind the car yet. The pin of that zone is the answer.
  'overtake-block': (snapshot, scene) => {
    const zone = (snapshot.scenario.lane.zones ?? []).find(item => item.to >= rear(snapshot));
    return zone ? scene.pins.find(pin => pin.at.zone === zone.kind)?.id ?? null : null;
  },
};
