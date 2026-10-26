import * as THREE from './vendor/three.module.js';
import { ROUTES } from './routes.js';
import { offsetPoint, laneStage } from './lane-change.js';
import { usingHints } from './practice.js';
import { sightCones } from './sight-cone.js';
import { actorsAt } from './street-state.js';
import { riderOf, oncomingOf, pressMeasure, rearPast } from './overtake-rules.js';
import { HINT_KMH, REAR, LOOK_CAP } from './overtake-gap.js';

// Guided aids of the street lessons, drawn on the ground. (1) A light amber fan behind a standing tram and behind the van: the area the driver cannot see.
// (2) The overtake strip: in the oncoming lane from the front of the car, as long as the pass needs (green when free, red with a mark at an oncoming car);
// after moving out, a strip in the own lane that is green when the rear of the car is REAR m past the rider. They show only in the guided mode.
const flat = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
const GREEN = '#4fbf7a', RED = '#df5a47', STRIP_WIDTH = 3.2;
function fan() {
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); geometry.setIndex([0, 1, 2, 0, 2, 3]);
  const mesh = new THREE.Mesh(geometry, flat('#f0b429', .26)); mesh.visible = false; mesh.renderOrder = 2; mesh.frustumCulled = false; return mesh;
}
export function createStreetAids(scene) {
  const fans = [fan(), fan()], strip = new THREE.Mesh(new THREE.PlaneGeometry(1, STRIP_WIDTH), flat(GREEN, .42)), mark = new THREE.Mesh(new THREE.PlaneGeometry(1.2, STRIP_WIDTH), flat(RED, .8));
  for (const mesh of [strip, mark]) { mesh.rotation.x = -Math.PI / 2; mesh.visible = false; mesh.renderOrder = 2; scene.add(mesh); }
  fans.forEach(mesh => scene.add(mesh));
  const world = (route, s, lateral) => { const p = offsetPoint(route.at(s), lateral); return [p.x, .22, p.z]; };
  function lay(mesh, route, from, length, lateral) {
    const p = offsetPoint(route.at(from + length / 2), lateral);
    mesh.scale.x = length; mesh.position.set(p.x, .23, p.z); mesh.rotation.z = p.heading - Math.PI / 2; mesh.visible = true;
  }
  function update(state, snapshot) {
    const mission = state.mission, street = mission.kind === 'street', shown = street && ['driving', 'paused'].includes(state.status) && usingHints(state), route = ROUTES[mission.route];
    fans.forEach(mesh => { mesh.visible = false; }); strip.visible = mark.visible = false;
    if (!shown) return;
    sightCones(mission, snapshot).slice(0, 2).forEach((cone, i) => {
      const position = fans[i].geometry.attributes.position;
      cone.points.forEach((point, k) => position.setXYZ(k, ...world(route, point.s, point.lateral))); position.needsUpdate = true; fans[i].visible = true;
    });
    if (mission.lane.role !== 'overtake') return;
    const actors = actorsAt(mission, snapshot, 400), rider = riderOf(actors), stage = laneStage(mission, snapshot.merge ?? null, snapshot.distance, snapshot.time ?? 0);
    if (!rider) return;
    if (stage === 'idle') {
      const { need } = pressMeasure(mission, { ...snapshot, speed: Math.max(snapshot.speed, HINT_KMH) }), length = Math.min(need ?? LOOK_CAP, LOOK_CAP), from = snapshot.distance + 2.25;
      const inside = oncomingOf(actors).find(car => car.s - car.length / 2 > from && car.s - car.length / 2 < from + length);
      strip.material.color.set(inside ? RED : GREEN); lay(strip, route, from, length, mission.lane.to - .5);
      if (inside) { mark.position.set(...world(route, inside.s, inside.lateral)); mark.rotation.z = route.at(inside.s).heading - Math.PI / 2; mark.visible = true; }
    } else if (stage === 'out' || stage === 'moving-out') {
      const front = rider.s + rider.length / 2;
      strip.material.color.set(rearPast(snapshot, rider) >= REAR ? GREEN : RED); lay(strip, route, front, REAR, mission.lane.from);
    }
  }
  return { update, fans, strip, mark };
}
