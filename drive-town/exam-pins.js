import * as THREE from './vendor/three.module.js';
import { routeFor } from './routes.js';
import { actorContext } from './road-users.js';
import { nearestLaneActor } from './lane-traffic.js';
import { STREET_LAYOUTS } from './street-layout.js';

// Pins of an exam scene. Pure maths: no WebGL, no DOM. Side > 0 is the driver's right (the same rule as signPose in lesson-scenery.js).
const ABOVE = 1.3, GONE = { x: NaN, z: NaN }; // a pin whose road user or zone is not there has no place: it is not in the picture
const offsetPoint = (p, side) => ({ x: p.x - p.dz * side, z: p.z + p.dx * side });

// A static car of a still scene: { at: { ahead, side }, turn } -> { x, z, heading }. turn: right | left | oncoming | along.
export function extraPose(extra, mission) {
  const p = routeFor(mission).at(mission.gate + extra.at.ahead), q = offsetPoint(p, extra.at.side);
  const turn = { right: -Math.PI / 2, left: Math.PI / 2, oncoming: Math.PI, along: 0 }[extra.turn ?? 'along'];
  return { x: q.x, z: q.z, heading: p.heading + turn };
}

// World position { x, y, z } of a pin at the freeze snapshot. `ctx` = { mission, missionIndex, snapshot, scene, player: { x, z } }.
export function pinWorld(pin, ctx) {
  const { at } = pin, { mission, missionIndex, snapshot } = ctx, route = routeFor(mission);
  if (at === 'player') return { x: ctx.player.x, y: 1.4, z: ctx.player.z };
  if (at === 'actor') {
    const point = actorContext(mission.actor?.slot ?? 1, snapshot, missionIndex).point;
    return { x: point.x, y: ABOVE + ([2, 4].includes(mission.actor?.slot) ? .5 : .6), z: point.z };
  }
  if (at === 'lane') { const other = nearestLaneActor(mission, snapshot); return { x: other.x, y: ABOVE + .5, z: other.z }; } // the lane car nearest to the player (merge lessons)
  if (at.lane !== undefined) { const other = nearestLaneActor(mission, snapshot, at.lane) ?? GONE, along = at.along ?? 0; return { x: other.x + Math.sin(other.heading) * along, y: at.y ?? ABOVE + .5, z: other.z + Math.cos(other.heading) * along }; } // the lane road user of that model nearest to the player (street lessons)
  if (at.zone !== undefined) { // the paint of a zone of the overtake lesson: the stripes of a zebra, or the first metres of a solid line, on the centre line
    const zone = (mission.lane?.zones ?? []).find(item => item.kind === at.zone);
    if (!zone) return { ...GONE, y: 0 };
    const q = offsetPoint(route.at(at.zone === 'zebra' ? zone.to - 2 : zone.from + 8), STREET_LAYOUTS['street-overtake'].centre);
    return { x: q.x, y: at.y ?? .3, z: q.z };
  }
  if (at.extra !== undefined) { const pose = extraPose(ctx.scene.extras[at.extra], mission); return { x: pose.x, y: 1.6, z: pose.z }; }
  if (at.sign !== undefined) { const q = offsetPoint(route.at(mission.gate + at.sign), at.offset ?? 3.6); return { x: q.x, y: at.y ?? 2.4, z: q.z }; }
  const q = offsetPoint(route.at(mission.gate + (at.ahead ?? 0)), at.side ?? 0);
  return { x: q.x, y: at.y ?? .3, z: q.z };
}

// Screen position of a world point in a canvas of w x h pixels. `visible` is false behind the camera or outside the picture.
export function project(camera, point, w, h) {
  const v = new THREE.Vector3(point.x, point.y, point.z).project(camera);
  return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, visible: v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 };
}

// A pin is a 44 px circle with a label box under it (exam.css: 27 px below the centre, 12 px type, about 22 px high). The label width is an estimate of 6.6 px a character.
const LABEL_TOP = 27, LABEL_HIGH = 22, LABEL_GAP = 3, CHAR = 6.6, PADDING = 18;
export const labelWidth = label => label ? Math.min(Math.ceil(label.length * CHAR + PADDING), 220) : 0;
const rectsOf = (pin, min) => [{ x: pin.x, y: pin.y, w: min, h: min }, ...pin.label ? [{ x: pin.x, y: pin.y + LABEL_TOP + LABEL_HIGH / 2, w: labelWidth(pin.label), h: LABEL_HIGH }] : []];
// The overlap of the two worst rectangles of a pair: { ox, oy } in px, or null. Two pins with no label keep the round rule: centres at least `min` apart.
function clash(a, b, min) {
  if (!a.label && !b.label) return Math.hypot(a.x - b.x, a.y - b.y) < min - .01 ? { round: true } : null;
  let worst = null;
  for (const ra of rectsOf(a, min)) for (const rb of rectsOf(b, min)) {
    const ox = (ra.w + rb.w) / 2 + LABEL_GAP - Math.abs(ra.x - rb.x), oy = (ra.h + rb.h) / 2 + LABEL_GAP - Math.abs(ra.y - rb.y);
    if (ox > 0 && oy > 0 && (!worst || Math.min(ox, oy) > Math.min(worst.ox, worst.oy))) worst = { ox, oy };
  }
  return worst;
}
// Moves overlapping pins apart until no circle and no label touches another, inside the box [0, w] x [0, h]. Returns the pins and whether an overlap remains.
// A pin with a `label` keeps its label inside the box too.
export function pushApart(pins, min = 44, bounds = { w: Infinity, h: Infinity }) {
  const out = pins.map(pin => ({ ...pin })), first = pins.map(pin => pin.y), half = min / 2; // `first`: the order from top to bottom stays the order of the picture
  for (let round = 0; round < 80; round++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j], hit = clash(a, b, min);
      if (!hit) continue;
      moved = true;
      if (hit.round) {
        let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < .01) { dx = 1; dy = 0; d = 1; }
        const push = (min - d) / 2 + .01;
        a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push;
      } else if (hit.ox <= hit.oy) { const move = hit.ox / 2 + .01, sign = b.x < a.x ? -1 : 1; a.x -= sign * move; b.x += sign * move; }
      else { const move = hit.oy / 2 + .01, sign = first[j] < first[i] || (first[j] === first[i] && b.y < a.y) ? -1 : 1; a.y -= sign * move; b.y += sign * move; }
    }
    for (const pin of out) {
      const side = Math.max(half, labelWidth(pin.label) / 2), bottom = pin.label ? LABEL_TOP + LABEL_HIGH : half;
      pin.x = Math.min(Math.max(pin.x, side), Math.max(side, bounds.w - side)); pin.y = Math.min(Math.max(pin.y, half), Math.max(half, bounds.h - bottom));
    }
    if (!moved) break;
  }
  const overlap = out.some((a, i) => out.slice(i + 1).some(b => { const hit = clash(a, b, min - 1); return hit && (hit.round || Math.min(hit.ox, hit.oy) > 1); }));
  return { pins: out, overlap };
}
