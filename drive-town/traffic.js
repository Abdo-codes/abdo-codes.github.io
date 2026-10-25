import { trafficPoint, roadUsers, hazardPoint, actorIndexFor, overlaps } from './road-users.js';
import { MISSIONS } from './missions.js';
import { railwayState, railwayZone } from './sharing-state.js';
import { isLaneKind } from './lane-kind.js';

const TOP_SPEED = 3.5, BRAKING = 4.5;
export class TownTraffic {
  constructor(distances = [185, 255]) {
    this.cars = distances.map(distance => ({ distance, speed: TOP_SPEED, waiting: false }));
  }
  snapshot() { return this.cars.map(car => ({ ...car })); }
  restore(cars) { this.cars = cars.map(car => ({ ...car })); }
  tick(dt, snapshot, missionIndex) {
    if (isLaneKind(snapshot.scenario ?? MISSIONS[missionIndex])) return;
    const before = this.snapshot(), envelope = roadUsers(snapshot, missionIndex);
    const mission = snapshot.scenario ?? MISSIONS[missionIndex];
    const actorIndex = actorIndexFor(missionIndex);
    if (snapshot.actorTime !== null && mission.duration && actorIndex !== null) {
      const active = envelope[actorIndex];
      for (let future = .2; future < mission.duration - snapshot.actorTime; future += .2) {
        envelope.push({ ...active, ...hazardPoint(actorIndex, snapshot.actorTime + future, mission) });
      }
    }
    this.cars.forEach((car, index) => {
      const zone = mission.kind === 'rail' && railwayState(mission, snapshot).red ? railwayZone(mission) : null;
      // Cars already on the crossing clear it; approaching cars wait for red to go out.
      const barrier = zone && !overlaps(trafficPoint(car.distance), zone) ? zone : null;
      const stoppingDistance = car.speed * car.speed / (2 * BRAKING), lookahead = 5 + stoppingDistance;
      const inside = envelope.some(user => overlaps(trafficPoint(car.distance), user, .6));
      let blocked = false;
      for (let travel = 0; travel <= lookahead && !blocked; travel += .4) {
        const future = travel / TOP_SPEED, point = trafficPoint(car.distance - travel);
        // Reserve the crossing before entering it; a car already there can clear ahead of the actor.
        const users = inside ? roadUsers(snapshot, missionIndex, future) : [...envelope];
        if (barrier) users.push(barrier);
        before.forEach((other, otherIndex) => {
          if (otherIndex !== index) users.push(trafficPoint(other.distance - other.speed * future));
        });
        blocked = users.some(user => overlaps(point, user, .6));
      }
      const speed = blocked ? Math.max(0, car.speed - BRAKING * dt) : Math.min(TOP_SPEED, car.speed + 2 * dt);
      const travel = (car.speed + speed) / 2 * dt, next = trafficPoint(car.distance - travel);
      const occupied = roadUsers(snapshot, missionIndex, dt).some(user => overlaps(next, user, .45))
        || barrier && overlaps(next, barrier, .45);
      car.distance -= occupied ? 0 : travel;
      car.speed = occupied ? 0 : speed; car.waiting = blocked || occupied;
    });
  }
}
