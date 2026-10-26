import { rollWheels } from './vehicle-motion.js';
import * as THREE from './vendor/three.module.js';
import { car, pedestrian, cyclist, animateActor } from './models.js';
import { usingHints } from './practice.js';
import { routeFor } from './routes.js';
import { label } from './art.js';
import { trafficPoint, actorContext, actorIndexFor, crossingBusy, CONFLICT_REASONS } from './road-users.js';
import { townBus, townTrain } from './transit-models.js';
import { playerPose } from './lane-change.js';
import { createLaneActors } from './lane-actors.js';
import { nearestStreetActor } from './street-actors.js';
import { streetActorName } from './street-feedback.js';
import { ambulance, flashBar } from './ambulance.js';
import { officer, officerPose } from './officer-model.js';
import { actorProgress } from './actor-paths.js';
import { sirenOn, armUp } from './lights-state.js';
export { hazardPoint } from './road-users.js';

export function createActors(scene) {
  const player = car(); scene.add(player);
  const people = [null, car('#d47b53'), pedestrian(), cyclist(), pedestrian('#849b78'), townBus(), townTrain(), ambulance(), officer()];
  people.forEach(actor => { if (actor) scene.add(actor); });
  const traffic = [car('#89a09b'), car('#aabb9a')]; traffic.forEach(actor => scene.add(actor));
  const lanes = createLaneActors(scene);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.4, .1, 6, 32),
    new THREE.MeshBasicMaterial({ color: '#dd7b5c', transparent: true, opacity: .8 }));
  halo.rotation.x = Math.PI / 2; halo.position.y = .22; scene.add(halo);
  const crossing = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.1),
    new THREE.MeshBasicMaterial({ color: '#dba44e', transparent: true, opacity: .24, depthWrite: false }));
  crossing.rotation.x = -Math.PI / 2; scene.add(crossing);
  const badges = { 1: label('Crossing car', 3), 2: label('Pedestrian', 3), 3: label('Cyclist', 3), 5: label('Departing bus', 3), 6: label('Train', 3), 7: label('Ambulance', 3), narrow: label('Oncoming car', 3), roundabout: label('Car on roundabout', 3), lane: label('Other vehicle', 3), merger: label('Merging vehicle', 3),
    passenger: label('Passenger', 3), tram: label('Tram', 3), cyclist: label('Cyclist', 3), rider: label('Rider', 3), van: label('Van', 3) };
  Object.values(badges).forEach(badge => { badge.material.depthTest = false; badge.renderOrder = 10; scene.add(badge); });
  function update(state, display = null) {
    const snapshot = display ?? state.snapshot();
    const point = playerPose(routeFor(state.mission), state.mission, snapshot);
    player.position.set(point.x, .18, point.z); player.rotation.y = point.heading;
    if (state.mission.id === 'parking' && (state.status === 'parking' || state.parkingTime >= 2.4)) {
      const progress = state.parkingTime >= 2.4 ? 1 : Math.min(state.parkingTime / 2.4, 1);
      const eased = progress * progress * (3 - 2 * progress);
      player.position.lerp(new THREE.Vector3(11.2, .18, -17.4), eased);
      player.rotation.y = point.heading * (1 - eased);
    }
    player.userData.brakeLights.forEach(lamp => { lamp.material.emissiveIntensity = snapshot.braking ? 2 : .1; });
    for (const [side, lamps] of Object.entries(player.userData.lamps)) {
      const on = ('signal' in snapshot ? snapshot.signal : state.signal) === side && Math.floor(snapshot.time * 2) % 2 === 0;
      lamps.forEach(lamp => { lamp.material.emissiveIntensity = on ? 1.5 : 0; });
    }
    const recorded = ['review', 'replay'].includes(state.status), recordedConflict = recorded && CONFLICT_REASONS.includes(state.result?.reason);
    const shown = {};
    people.forEach((actor, index) => {
      if (!actor) return;
      const { time, point: p, mission } = actorContext(index, snapshot, state.missionIndex);
      actor.visible = index <= 4 || actorIndexFor(state.missionIndex) === index;
      // The ambulance appears with its clock and leaves at the end of its path. The officer stays; only the arm and the label change.
      if (index === 7) { actor.visible &&= time !== null && time >= 0 && actorProgress(mission, time) < 1; actor.userData.label.visible = actor.visible && sirenOn(mission, time) && !recordedConflict; flashBar(actor, time ?? 0); }
      if (index === 8) officerPose(actor, armUp(mission, time));
      shown[index] = actor.visible;
      actor.position.set(p.x, .2, p.z); actor.rotation.y = p.heading;
      animateActor(actor, time ?? 0); rollWheels(actor);
      actor.userData.departureLamps?.forEach(lamp => { lamp.material.emissiveIntensity =
        crossingBusy(state.missionIndex, snapshot) && Math.floor(snapshot.time * 2.5) % 2 === 0 ? 2 : 0; });
    });
    traffic.forEach((actor, index) => {
      const carState = snapshot.traffic[index], p = trafficPoint(carState.distance);
      actor.visible = !state.mission.quiet;
      actor.position.set(p.x, .18, p.z); actor.rotation.y = p.heading;
      actor.userData.waiting = carState.waiting;
      actor.userData.brakeLights.forEach(lamp => { lamp.material.emissiveIntensity = carState.waiting ? 2 : .1; });
    });
    // Merge lessons: the ring and the badge go on the lane vehicle that matters (the failed gap, or the merging driver).
    const laneTarget = lanes.update(state, snapshot), merge = state.mission.kind === 'merge' ? laneTarget : null;
    const street = state.mission.kind === 'street' ? nearestStreetActor(state.mission, snapshot, recordedConflict ? state.result?.reason : null) : null;
    const subject = merge ?? street ?? (actorIndexFor(state.missionIndex) !== null ? actorContext(actorIndexFor(state.missionIndex), snapshot, state.missionIndex).point : null);
    halo.visible = Boolean(subject) && shown[actorIndexFor(state.missionIndex)] !== false && (recordedConflict || !recorded && usingHints(state) && crossingBusy(state.missionIndex, snapshot) && (!merge || state.mission.lane.role === 'host' || state.signal === state.mission.signal));
    halo.material.color.set(recordedConflict ? '#dba44e' : '#dd7b5c');
    if (halo.visible) halo.position.set(subject.x, recordedConflict ? .43 : .23, subject.z);
    crossing.visible = recordedConflict && [2, 4].includes(state.missionIndex);
    if (crossing.visible) {
      const zebra = state.missionIndex === 2;
      crossing.position.set(zebra ? -38 : 11, .43, zebra ? 2 : -18);
      crossing.scale.set(zebra ? 1 : .8, zebra ? 1 : 3 / 4.1, 1);
    }
    Object.values(badges).forEach(badge => { badge.visible = false; });
    if (recordedConflict && subject) {
      const index = actorIndexFor(state.missionIndex), badge = street ? badges[{ 'oncoming car': 'narrow', car: 'lane' }[streetActorName(state)] ?? streetActorName(state)] : merge ? badges[merge.merger ? 'merger' : 'lane']
        : badges[state.mission.kind === 'narrow' ? 'narrow' : state.mission.kind === 'roundabout' && index === 1 ? 'roundabout' : index === 4 ? 2 : index];
      if (badge) {
        const width = window.innerWidth <= 800 ? 7 : 3;
        badge.scale.set(width, width * 160 / 512, 1);
        badge.position.set(subject.x, 2.8, subject.z); badge.visible = true;
      }
    }
  }
  return { player, update };
}
