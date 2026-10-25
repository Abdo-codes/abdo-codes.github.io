import { DriveSession } from './simulation.js';
import { MISSIONS } from './missions.js';
import { lightPhase, stopNeed } from './lesson-state.js';
import { railwayState } from './sharing-state.js';
import { crossingBusy } from './road-users.js';
import { HAZARD_CLIPS } from './hazard-clips.js';
import { drawClips, TEST_SIZE } from './hazard-draw.js';
import { streetHazard } from './street-busy.js';

export const ANSWERS = {
  brake: { label: 'Brake', dutch: 'Remmen', key: '1' },
  release: { label: 'Release accelerator', dutch: 'Gas loslaten', key: '2' },
  nothing: { label: 'Do nothing', dutch: 'Niets', key: '3' },
};
// Clips record every simulation tick so playback matches the 60 Hz render and the car moves smoothly.
export const FPS = 60, ANSWER_SECONDS = 8, LEAD_SECONDS = 3, AFTER_SECONDS = 3;
// The former CBR gevaarherkenning part (2019 to 6 Apr 2025): 25 questions, pass at 13 correct (secondary sources).
// CBR confirms 8 s for the 2017 exam (news, 10 Feb 2017); for 2019 to 2025 only secondary sources say 8 s.
// The score is a count of correct answers; no source gives points for answer speed.
export const PASS_MARK = 13, PASS_OUT_OF = 25;
const TICK = 1 / FPS;

export function hazardActive(missionIndex, snapshot) {
  const mission = snapshot.scenario;
  if (mission.kind === 'light') return lightPhase(mission, snapshot) === 'red';
  if (mission.kind === 'amber') return lightPhase(mission, snapshot) === 'amber';
  if (mission.kind === 'rail') return railwayState(mission, snapshot).red;
  if (mission.kind === 'stop') return !snapshot.stoppedAtLine;
  if (mission.kind === 'street') return streetHazard(mission, snapshot);
  return crossingBusy(missionIndex, snapshot);
}

// Consistency check for authored answers: brake when an active hazard is within
// reaction + braking distance (1 s, 5 m/s²) plus a margin; release when it is further away.
export function expectedAnswer(missionIndex, snapshot) {
  const mission = snapshot.scenario;
  if (mission.kind === 'limit') {
    const ahead = mission.changeAt - snapshot.distance;
    return ahead > 0 && ahead < 45 && snapshot.speed > mission.nextLimit ? 'release' : 'nothing';
  }
  if (!hazardActive(missionIndex, snapshot)) return 'nothing';
  const gap = mission.gate - snapshot.distance, need = stopNeed(snapshot.speed);
  if (mission.kind === 'amber') return gap >= need ? 'brake' : 'nothing'; // too close to stop in a safe way: go on
  return gap <= need ? 'brake' : 'release';
}

// The rule source a clip teaches: its own `reference` and `source`, else those of its mission.
export function clipRule(clip) {
  const mission = MISSIONS.find(item => item.id === clip.mission);
  return { reference: clip.reference ?? mission.reference, source: clip.source ?? mission.source };
}

export function recordClip(clip) {
  const lead = clip.leadSeconds ?? LEAD_SECONDS; // exam scenes may run 2 to 5 s
  const missionIndex = MISSIONS.findIndex(mission => mission.id === clip.mission);
  const session = new DriveSession(missionIndex, { mode: 'independent', variation: clip.variation });
  // `traffic` replaces the road users of a street or merge lesson for this clip only (a parked van that hides a person).
  // `view` moves the camera of the clip (see laneCamera in lane-camera.js). `quiet` hides the cars of the town (a car at the edge of the picture looks like a road user of the question).
  if (clip.traffic || clip.view || clip.quiet) session.activeMission = { ...session.mission, ...clip.view && { clipView: clip.view }, ...clip.quiet && { quiet: true }, ...clip.traffic && { lane: { ...session.mission.lane, traffic: clip.traffic } } };
  const freezeAt = session.mission.gate - clip.lead;
  session.distance = freezeAt - clip.speed / 3.6 * lead;
  session.start(); session.speed = clip.speed; session.drive(clip.speed);
  if (session.mission.signal && clip.signal !== false) session.toggleSignal(session.mission.signal); // a careful driver signals as the lesson requires; `signal: false` is a car that does not plan a move
  // Optional road-user clock at the freeze, so the hazard is visibly in place when the picture stops.
  if (clip.actorTime !== undefined) session.actorTime = clip.actorTime - lead;
  if (clip.actorTime2 !== undefined) session.time2 = clip.actorTime2 - lead; // the second clock of lesson 21 (the crossing tram)
  const frames = [];
  let ticks = 0;
  const step = () => { session.tick(TICK); ticks++; frames.push(session.snapshot()); };
  while (session.status === 'driving' && session.distance < freezeAt) step();
  const frozen = session.status === 'driving';
  frames.push(session.snapshot());
  const freezeFrame = frames.length - 1;
  // Continue with the correct response so feedback can show what happens next.
  if (clip.merge) session.changeLane(); // a merge lesson where the gap is open: the follow-up shows the move
  if (clip.answer === 'brake') session.requestStop();
  if (clip.answer === 'release') session.drive(Math.min(clip.speed, 15));
  ticks = 0;
  while (session.status === 'driving' && ticks < AFTER_SECONDS / TICK) step();
  return { clip, missionIndex, session, frames, freezeFrame, frozen, outcome: session.result,
    leadDuration: freezeFrame / FPS, duration: (frames.length - 1) / FPS };
}

// One test run: draws a fresh mixed sequence from `pool` (see hazard-draw.js) each time it starts.
export class HazardTest {
  constructor(pool = HAZARD_CLIPS, { record = recordClip, random = Math.random, size = TEST_SIZE } = {}) {
    this.pool = pool; this.record = record; this.random = random; this.size = size;
    this.cache = new Map(); // recordings by clip id, so they survive a new order
    this.phase = 'intro'; this.draw();
  }
  draw() { this.clips = drawClips(this.pool, this.random, this.size); this.index = 0; this.answers = []; this.time = 0; this.waited = 0; }
  get clip() { return this.clips[this.index]; }
  get run() {
    if (!this.cache.has(this.clip.id)) this.cache.set(this.clip.id, this.record(this.clip));
    return this.cache.get(this.clip.id);
  }
  get frame() {
    const frames = this.run.frames;
    return frames[Math.min(frames.length - 1, Math.floor(this.time * FPS + 1e-7))];
  }
  get last() { return this.answers.at(-1); }
  get score() { return this.answers.filter(answer => answer.correct).length; }
  // Only a full 25-clip test is compared with the former pass mark.
  get passed() { return this.clips.length === PASS_OUT_OF ? this.score >= PASS_MARK : null; }
  get remaining() { return Math.max(0, ANSWER_SECONDS - this.waited); }
  start() { this.draw(); this.begin(); }
  begin() { this.phase = 'watch'; this.time = 0; this.waited = 0; }
  tick(dt) {
    if (this.phase === 'watch') {
      this.time = Math.min(this.time + dt, this.run.leadDuration);
      if (this.time >= this.run.leadDuration) this.phase = 'answer';
    } else if (this.phase === 'answer') {
      this.waited += dt;
      if (this.waited >= ANSWER_SECONDS) this.answer(null);
    } else if (this.phase === 'feedback') this.time = Math.min(this.time + dt, this.run.duration);
  }
  answer(choice) {
    if (this.phase !== 'answer' || (choice !== null && !ANSWERS[choice])) return;
    const expected = this.clip.answer;
    this.answers.push({ id: this.clip.id, topic: this.clip.topic, choice, expected,
      correct: choice === expected, seconds: Math.min(this.waited, ANSWER_SECONDS) });
    this.phase = 'feedback';
  }
  replay() { if (this.phase === 'feedback') this.time = 0; }
  next() {
    if (this.phase !== 'feedback') return;
    if (this.index + 1 >= this.clips.length) { this.phase = 'summary'; return; }
    this.index++; this.begin();
  }
}
