export { detailedCar as car } from './vehicle.js';
export { walkingPerson as pedestrian } from './people.js';
export { cityCyclist as cyclist } from './cycling.js';
import { animateWalk } from './people.js';
import { animateCycle } from './cycling.js';

export function animateActor(actor, time) {
  if (actor.userData.animationTime === time) return;
  actor.userData.animationTime = time;
  animateWalk(actor, time);
  animateCycle(actor, time);
}
