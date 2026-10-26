import { recordClip, FPS } from './hazard.js';
import { SCENES, sceneClip } from './exam/scenes.js';
import { showClipFrame } from './clip-view.js';
import { pinWorld, project, pushApart, extraPose } from './exam-pins.js';
import { car } from './models.js';
import { CLIP } from './exam-config.js';

// Plays exam scenes in the shared world. Phases: idle | ready (first frame, Play) | playing | stopped (freeze frame, pins on) | review (clip after the answer).
// The exam never plays past the freeze frame; only `review` does. Recording is on demand and cached by scene id.
export function createExamScene({ world, actors, canvas, record = recordClip }) {
  const cache = new Map(), extras = [];
  let scene = null, run = null, phase = 'idle', time = 0, instant = true, full = false, pins = [], hidden = false;

  function recording(id) {
    if (!cache.has(id)) cache.set(id, record(sceneClip(SCENES[id])));
    return cache.get(id);
  }
  function placeExtras() {
    const list = scene?.extras ?? [];
    while (extras.length < list.length) { const mesh = car(['#9a8fb5', '#6f9c8f'][extras.length % 2]); world.scene.add(mesh); extras.push(mesh); }
    extras.forEach((mesh, i) => {
      mesh.visible = Boolean(list[i]) && phase !== 'idle';
      if (list[i]) { const pose = extraPose(list[i], run.session.mission); mesh.position.set(pose.x, .18, pose.z); mesh.rotation.y = pose.heading; }
    });
  }
  function load(id) {
    scene = id ? SCENES[id] : null; run = scene ? recording(id) : null; time = 0; instant = true; full = false; pins = []; hidden = false;
    phase = !scene ? 'idle' : scene.still ? 'stopped' : 'ready';
    if (phase === 'stopped') time = run.leadDuration;
    placeExtras();
    return scene;
  }
  const play = () => { if (phase === 'ready') phase = 'playing'; };
  // Replay goes back to frame 0 and plays to the freeze frame again. `afterAnswer` plays the whole clip (review only).
  function replay(afterAnswer = false) {
    if (!scene || (!CLIP.replay && !afterAnswer)) return false;
    time = 0; instant = true; full = afterAnswer; pins = []; phase = 'playing'; return true;
  }
  // Goes to the freeze frame at once (a scene the player has already watched).
  const skip = () => { if (scene && (phase === 'ready' || phase === 'playing')) { time = run.leadDuration; phase = 'stopped'; pins = []; } };
  const clear = () => { load(null); };

  // One render frame. `size` is the canvas size in CSS pixels. Returns the projected pins (only when the clip has stopped).
  function frame(dt, size = { w: canvas.clientWidth, h: canvas.clientHeight }) {
    if (!scene) return [];
    const end = full ? run.duration : run.leadDuration;
    if (phase === 'playing') { time = Math.min(time + dt, end); if (time >= end) phase = full ? 'review' : 'stopped'; }
    const index = Math.min(Math.floor(time * FPS + 1e-7), full ? run.frames.length - 1 : run.freezeFrame), snapshot = run.frames[index];
    showClipFrame(world, actors, run, snapshot, instant); instant = false;
    if (phase !== 'stopped' || hidden) { pins = []; return pins; }
    const ctx = { mission: run.session.mission, missionIndex: run.missionIndex, snapshot, scene, player: actors.player.position };
    const projected = scene.pins.map(pin => ({ id: pin.id, label: pin.label, ...project(world.camera, pinWorld(pin, ctx), size.w, size.h) })).filter(pin => pin.visible);
    const spread = pushApart(projected, 44, { w: size.w, h: size.h });
    pins = spread.overlap ? [] : spread.pins; // overlapping pins hide; the named list stays
    return pins;
  }
  return { load, play, skip, replay, clear, frame, recording, get phase() { return phase; }, get scene() { return scene; }, get run() { return run; }, get pins() { return pins; },
    get time() { return time; }, hidePins(value) { hidden = value; } };
}
