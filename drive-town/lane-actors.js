import { laneCar, bodyMaterials } from './lane-car-model.js';
import { lorry } from './lorry-model.js';
import { tram, setTramDoors } from './tram-model.js';
import { van } from './van-model.js';
import { moped } from './moped-model.js';
import { cyclist, pedal } from './cyclist-model.js';
import { walkingPerson, animateWalk } from './people.js';
import { laneActors, nearestLaneActor } from './lane-traffic.js';
import { isLaneKind } from './lane-kind.js';
import { ROUTES } from './routes.js';

// Pool of road users for the lane lessons (chapters 05 and 07), placed from the lane traffic data each frame. Hidden meshes cost no draw call.
// Cars: 24. One lorry, two trams (lesson 21 has the stop tram and the crossing tram together), one van, one moped, three cyclists and four walkers (passengers). `model` in the traffic data picks the pool.
export const POOL_CARS = 24, WINDOW = 70, WINDOW_STREET = 170, SHADOW_RANGE = 40, READY_WINDOW = 60, WALKERS = 4, CYCLISTS = 3, TRAMS = 2, WALK_SPEED = 1.1;
// The traffic on show: around the learner (street lessons: 170 m, inside the street fog, so an oncoming car of the overtake lesson shows), or on the ready screen around the middle of the overview window.
export const windowFor = (state, snapshot) => {
  const { start, end, route } = state.mission, view = ROUTES[route].view;
  return state.status === 'ready' && view ? [(start + end) / 2 + view.centre, READY_WINDOW] : [snapshot.distance, state.mission.kind === 'street' ? WINDOW_STREET : WINDOW];
};
export function createLaneActors(scene) {
  const cars = Array.from({ length: POOL_CARS }, laneCar), truck = lorry(), buses = Array.from({ length: TRAMS }, tram), delivery = van(), scooter = moped();
  const riders = Array.from({ length: CYCLISTS }, (_, i) => cyclist(i)), walkers = Array.from({ length: WALKERS }, (_, i) => walkingPerson(['#c2a65e', '#7d9bb5', '#b9697a', '#8aa57a'][i]));
  const all = [...cars, truck, ...buses, delivery, scooter, ...riders, ...walkers];
  all.forEach(actor => { actor.visible = false; scene.add(actor); });
  const setLamps = (actor, { brake, signal, model }, time) => {
    const blink = Math.floor(time * 2) % 2 === 0, { lamps } = actor.userData;
    if (!lamps) return;
    lamps.brake.visible = brake; lamps.left.visible = (signal === 'left' || model === 'van') && blink; lamps.right.visible = (signal === 'right' || model === 'van') && blink;
  };
  // A walker walks while its lateral position changes: the walk phase follows the distance, so a standing passenger stands.
  const walk = (mesh, actor) => {
    const data = mesh.userData, moved = Math.abs(actor.lateral - (data.lastLateral ?? actor.lateral));
    data.lastLateral = actor.lateral; data.walkTime = (data.walkTime ?? 0) + (moved < .5 ? moved / WALK_SPEED : 0); animateWalk(mesh, data.walkTime);
  };
  function update(state, snapshot) {
    const mission = state.mission, time = snapshot.time ?? 0;
    const used = { car: 0, cyclist: 0, walker: 0, tram: 0 };
    all.forEach(actor => { actor.visible = false; });
    if (!isLaneKind(mission)) return null;
    for (const actor of laneActors(mission, snapshot.actorTime ?? 0, windowFor(state, snapshot), snapshot.time2 ?? null)) {
      const { model } = actor;
      const mesh = model === 'lorry' ? truck : model === 'tram' ? buses[used.tram++] : model === 'van' ? delivery : model === 'moped' ? scooter
        : model === 'cyclist' ? riders[used.cyclist++] : model === 'walker' ? walkers[used.walker++] : cars[used.car++];
      if (!mesh) continue;
      mesh.visible = true; mesh.position.set(actor.x, model === 'walker' ? .2 : .14, actor.z); mesh.rotation.y = actor.heading;
      const body = mesh.userData.body ?? mesh.userData.walkMesh;
      if (body) body.castShadow = Math.abs(actor.s - snapshot.distance) < SHADOW_RANGE;
      if (model === 'car') mesh.userData.body.material = bodyMaterials[actor.index % bodyMaterials.length];
      if (model === 'tram') setTramDoors(mesh, actor.door, actor.lamp);
      else if (model === 'cyclist') pedal(mesh, actor.speed === 0 ? 0 : actor.s);
      else if (model === 'walker') walk(mesh, actor);
      else setLamps(mesh, actor, time);
    }
    return mission.kind === 'merge' ? nearestLaneActor(mission, snapshot) : null;
  }
  return { update, cars, truck, tram: buses[0], trams: buses, van: delivery, moped: scooter, riders, walkers };
}
