import { MISSIONS } from './missions.js';
import { evaluateDecision } from './rules.js';
import { TownTraffic } from './traffic.js';
import { driveTarget, besideStopLine, stopNeed } from './lesson-state.js';
import { practiceMission } from './practice.js';
import { ruleQuestion } from './questions.js';
import { recordFailure } from './attempt-feedback.js';
import { crossingBusy } from './road-users.js';
import { chapterFor } from './chapters.js';
import { laneState, laneStage } from './lane-change.js';
import { isLaneKind } from './lane-kind.js';
import { nextTime2 } from './street-state.js';
import { pressMeasure } from './overtake-rules.js';
import { streetPressNotes, streetTrackNotes } from './street-notes.js';
import { contextAction } from './context-action.js';
import { pressNotes, trackNotes } from './merge-notes.js';

export class DriveSession {
  constructor(missionIndex = 0, { mode = 'guided', variation = 0 } = {}) {
    this.missionIndex = missionIndex;
    this.mode = mode === 'independent' ? mode : 'guided'; this.variation = variation;
    this.time = 0;
    this.status = 'ready';
    this.retries = 0; this.traffic = new TownTraffic(); this.trafficCheckpoint = this.traffic.snapshot();
    this.reset();
  }
  get mission() { return this.activeMission; }
  get question() { return ruleQuestion(this.missionIndex, this.questionRound, this.mode === 'independent' ? this.variation : 0); }
  get independentPass() { return ['success', 'complete'].includes(this.status) && this.mode === 'independent' && !this.hintUsed && this.questionMisses === 0; }
  get busy() { return crossingBusy(this.missionIndex, this); }
  reset() {
    this.activeMission = practiceMission(this.missionIndex, this.mode, this.variation);
    this.distance = this.mission.start; this.speed = this.mission.startSpeed ?? 0; this.signal = null;
    this.merge = null; this.signalSince = null; this.notes = []; this.time2 = null; this.summary = {};
    this.cruise = this.mission.startSpeed !== undefined; this.brakeLatched = false; this.actorTime = this.mission.initialActorTime ?? null; this.history = []; this.result = null;
    this.cruiseSpeed = this.mission.startSpeed ?? driveTarget(this.mission, this.distance); this.stoppedAtLine = false; this.questionError = ''; this.questionFeedback = null;
    this.lastStopDistance = null; this.failureSnapshot = null; this.hintUsed = false;
    this.questionRound = 0; this.questionMisses = 0; this.canStop = this.onsetGap = this.onsetSpeed = null;
    this.braking = false; this.heldSpeed = null; this.parkingTime = 0; this.replayTime = 0; this.replayPaused = false; this.traffic.restore(this.trafficCheckpoint);
  }
  start() { this.status = 'driving'; }
  drive(speed = driveTarget(this.mission, this.distance)) { if (this.status === 'driving') { this.cruiseSpeed = speed; this.cruise = true; this.brakeLatched = false; } }
  toggleCruise(speed = this.mission.slowSpeed ?? 10) {
    if (this.status !== 'driving') return;
    if (this.cruise && this.cruiseSpeed === speed) this.cruise = false; else this.drive(speed);
  }
  requestStop() { if (this.status === 'driving') { this.brakeLatched = true; this.cruise = false; } }
  retry() { this.retries++; if (this.mode === 'independent') this.variation++; this.reset(); this.start(); }
  next() {
    if (this.missionIndex === MISSIONS.length - 1) return;
    this.trafficCheckpoint = this.traffic.snapshot();
    this.missionIndex++; if (this.mode === 'independent') this.variation++; this.reset(); this.start();
  }
  pause() {
    if (this.status === 'driving') { this.heldSpeed = ['moving-out', 'moving-back'].includes(laneStage(this.mission, this.merge, this.distance, this.time)) ? this.speed : null; this.cruise = false; this.status = 'paused'; }
    else if (this.status === 'paused') {
      this.status = 'driving';
      if (this.heldSpeed != null) { this.cruise = true; this.cruiseSpeed = this.heldSpeed; } // a pause in the middle of a lane shift keeps the speed
      this.heldSpeed = null;
    }
  }
  toggleSignal(side) {
    if (this.status !== 'driving') return;
    this.signal = this.signal === side ? null : side; this.signalSince = this.signal ? this.time : null;
  }
  revealHint() { if (this.status === 'driving') this.hintUsed = true; }
  snapshot() {
    const lane = laneState(this.mission, this.merge, this.distance, this.time);
    return { distance: this.distance, speed: this.speed, time: this.time, actorTime: this.actorTime, time2: this.time2, braking: this.braking,
      stoppedAtLine: this.stoppedAtLine, signal: this.signal, scenario: this.mission, traffic: this.traffic.snapshot(),
      lateral: lane.lateral, yaw: lane.yaw, merge: this.merge, signalSince: this.signalSince, canStop: this.canStop, onsetGap: this.onsetGap, onsetSpeed: this.onsetSpeed };
  }
  // The Merge button (key F in lessons that change lane). The route then moves the car over in a smooth shift (lane-change.js).
  changeLane() {
    const lane = this.mission.lane;
    if (this.status !== 'driving' || lane?.to === undefined) return null;
    if (this.merge) return this.moveBack();
    const result = evaluateDecision(this.mission, this.snapshot(), this.snapshot(),
      { busy: this.busy, rightSignal: this.signal === 'right', signal: this.signal, mergeRequested: true });
    if (result) { this.handleResult(result); return result; }
    this.merge = { s: this.distance, t: this.time, from: lane.from, to: lane.to, kmh: this.speed, lead: this.signalSince === null ? 0 : this.time - this.signalSince,
      ...lane.role === 'overtake' && { measure: pressMeasure(this.mission, this.snapshot()) } };
    this.holdSpeed();
    this.addNotes(lane.role === 'overtake' ? streetPressNotes(this.mission, this.merge, this.snapshot()) : pressNotes(this.mission, this.merge));
    return { type: 'merge' };
  }
  // The busy prediction assumes constant speeds, so the car holds its speed through the shift.
  holdSpeed() { this.cruise = true; this.cruiseSpeed = this.speed; this.brakeLatched = false; }
  addNotes(ids) { if (ids.length) this.notes = [...new Set([...this.notes, ...ids])]; }
  // Overtake lesson: the second press moves the car back. It makes a new `merge` object, so earlier snapshots keep the old one (lane-change.js).
  moveBack() {
    const lane = this.mission.lane;
    if (lane.back === undefined || this.merge.back) return { type: 'hint', message: 'You already changed lane.' };
    if (laneStage(this.mission, this.merge, this.distance, this.time) !== 'out') return { type: 'hint', message: 'Wait until you are out in the other lane.' };
    this.merge = { ...this.merge, back: { s: this.distance, t: this.time, kmh: this.speed, signal: this.signal } };
    this.holdSpeed(); this.addNotes(streetPressNotes(this.mission, this.merge, this.snapshot()));
    return { type: 'back' };
  }
  act() { return contextAction(this.mission) === 'merge' ? this.changeLane() : this.park(); }
  park() {
    if (this.status !== 'driving' || this.missionIndex !== 4) return null;
    const result = evaluateDecision(this.mission, this.snapshot(), this.snapshot(),
      { busy: this.busy, rightSignal: this.signal === 'right', signal: this.signal, parkingRequested: true });
    if (result?.type !== 'hint') this.handleResult(result);
    return result;
  }
  handleResult(result) {
    if (!result) return;
    this.result = result;
    this.cruise = false;
    if (result.type === 'mistake') {
      this.failureSnapshot = recordFailure(this);
      this.status = 'review'; this.replayHistory = [...this.history, this.snapshot()]; this.speed = 0;
    } else if (result.type === 'success') {
      this.speed = 0; this.status = this.mission.id === 'parking' ? 'parking' : 'question';
    }
  }
  answer(index) {
    if (this.status !== 'question') return;
    if (!Number.isInteger(index) || index < 0 || index >= this.question.choices.length) return;
    if (index !== this.question.correct) {
      this.questionFeedback = { prompt: this.question.prompt, explanation: this.question.explanation };
      this.questionError = this.question.explanation;
      this.questionMisses++; this.questionRound++; return;
    }
    this.questionError = ''; this.questionFeedback = null;
    this.status = chapterFor(this.missionIndex).indices.at(-1) === this.missionIndex ? 'complete' : 'success';
  }
  get replayDuration() { return Math.max(0, ((this.replayHistory?.length ?? 1) - 1 - (this.replayStart ?? 0)) / 30); }
  replay() { this.replayStart = Math.max(0, (this.replayHistory?.length ?? 0) - (this.mission.replayFrames ?? 180)); this.replayTime = 0; this.replayPaused = false; this.status = 'replay'; }
  pauseReplay() {
    if (this.status !== 'replay') return;
    if (this.replayPaused && this.replayTime >= this.replayDuration) this.replayTime = 0;
    this.replayPaused = !this.replayPaused;
  }
  seekReplay(seconds) {
    if (this.status !== 'replay' || !Number.isFinite(seconds)) return;
    this.replayTime = Math.max(0, Math.min(seconds, this.replayDuration)); this.replayPaused = true;
  }
  exitReplay() { if (this.status === 'replay') this.status = 'review'; }
  replaySnapshot() {
    const history = this.replayHistory ?? [];
    if (!history.length) return this.snapshot();
    return history[Math.min(history.length - 1, (this.replayStart ?? 0) + Math.floor(this.replayTime * 30 + 1e-7))];
  }
  tick(dt, input = {}) {
    if (this.status === 'replay') {
      if (!this.replayPaused) {
        this.replayTime = Math.min(this.replayTime + dt, this.replayDuration);
        if (this.replayTime >= this.replayDuration) this.replayPaused = true;
      }
      return;
    }
    if (this.status === 'parking') {
      this.parkingTime += dt;
      if (this.parkingTime >= 2.4) this.status = 'question';
      return;
    }
    if (this.status !== 'driving') return;
    const before = this.snapshot();
    this.time += dt;
    if (this.distance >= this.mission.trigger && this.actorTime === null) this.actorTime = 0;
    if (this.actorTime !== null) this.actorTime += dt;
    if (this.mission.lane?.trigger2 !== undefined) this.time2 = nextTime2(this.mission.lane, this.time2, this.distance, dt);
    // Amber light: at the onset, the gap to the line and the speed decide whether the car can stop in a safe way.
    if (this.mission.kind === 'amber' && this.canStop === null && this.actorTime !== null && this.actorTime >= 0) {
      this.onsetGap = this.mission.gate - this.distance; this.onsetSpeed = this.speed; this.canStop = this.onsetGap >= stopNeed(this.speed);
    }
    if (input.accelerate && !input.brake) this.brakeLatched = false;
    this.braking = Boolean(input.brake || this.brakeLatched || this.cruise && this.speed > this.cruiseSpeed + .5);
    if (input.brake || this.brakeLatched) { this.speed = Math.max(0, this.speed - dt * 18); this.cruise = false; }
    else if (input.accelerate) { this.speed = Math.min(65, this.speed + dt * 7); this.cruise = false; }
    else if (this.cruise) this.speed += Math.sign(this.cruiseSpeed - this.speed) * Math.min(Math.abs(this.cruiseSpeed - this.speed), dt * 10);
    else this.speed = Math.max(0, this.speed - dt * 1.4);
    if (this.speed === 0) this.brakeLatched = false;
    this.distance += (before.speed + this.speed) / 2 / 3.6 * dt;
    if (before.speed > 0 && this.speed === 0) this.lastStopDistance = this.distance;
    if (this.mission.kind === 'stop' && this.speed === 0 && besideStopLine(this.mission, this.snapshot())) this.stoppedAtLine = true;
    this.traffic.tick(dt, this.snapshot(), this.missionIndex);
    this.history.push(this.snapshot()); if (this.history.length > 300) this.history.shift();
    if (isLaneKind(this.mission)) this.addNotes(this.mission.kind === 'street' ? streetTrackNotes(this, before, this.snapshot()) : trackNotes(this, before, this.snapshot()));
    const session = this; // `busy` is read only when a rule needs it: the street preview is costly
    this.handleResult(evaluateDecision(this.mission, before, this.snapshot(),
      { get busy() { return session.busy; }, rightSignal: this.signal === 'right', signal: this.signal, parkingRequested: false }));
  }
}
