import { createWorld } from './world.js';
import { createActors } from './actors.js';
import { loadDaylight } from './lighting.js';
import { loadSurfaceMaps } from './pbr-surfaces.js';
import { loadVehicle } from './vehicle.js';
import { loadPeople } from './people.js';
import { loadCyclist } from './cycling.js';
import { DriveSession } from './simulation.js';
import { GameUI } from './ui.js';
import { MISSIONS } from './missions.js';
import { routeFor } from './routes.js';
import { actorContext, actorIndexFor, CONFLICT_REASONS } from './road-users.js';
import { CAMERA_LABELS, nextCameraMode, cameraModes } from './camera-modes.js';
import { laneCamera, lookCamera, decisionFocus } from './lane-camera.js';
import { nearestLaneActor } from './lane-traffic.js';
import { nearestStreetActor } from './street-actors.js';
import { loadProgress, saveProgress, loadIndependent, saveIndependent } from './progress.js';
import { loadMode, saveMode, usingHints } from './practice.js';
import { bindPedals } from './input.js';
import { CHAPTERS, chapterFor, loadChapter, saveChapter } from './chapters.js';
import { createHazardMode } from './hazard-mode.js';
import { createExamMode } from './exam-mode.js';
import { bindPracticeMenu } from './practice-menu.js';
import { createDriveRecorder, recordWeak } from './drive-record.js';
import { clearExamData, loadWeak } from './exam-store.js';
import { MISSION_TOPIC } from './exam/topics.js';
import { decisionActor, isLightsMission, sirenLevel } from './lights-navigation.js';
import { createSiren } from './siren-sound.js';
import { createStreetSounds } from './street-sounds.js';

const byId = id => document.getElementById(id);
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let practised = loadProgress(storage), independent = loadIndependent(storage);
let mode = loadMode(storage), practiceRound = 0;
const sessionFor = index => new DriveSession(index, { mode, variation: practiceRound++ });
const initialChapter = CHAPTERS[loadChapter(storage)];
const remaining = initialChapter.indices.find(index => !practised.includes(MISSIONS[index].id));
let state = sessionFor(remaining ?? initialChapter.indices[0]);
let world, actors, ui, assetsReady = false;
let cameraMode = 'overview', soundEnabled = false, audio;
let previousStatus = 'ready', instantCamera = true, lastRoute;
let pedals, hazardMode, examMode, worldFailed = false;
const recordDrive = createDriveRecorder(storage);

function clearInput() { pedals?.clear(); }
// Hazard test and mock exam replace the drive while they are open. Only one runs at a time.
const activeMode = () => [hazardMode, examMode].find(mode => mode?.active);
function openMode(name, options) {
  if (activeMode()) return;
  clearInput(); siren.stop(); if (state.status === 'driving') state.pause(); byId('help-dialog').close(); byId('lessons-dialog').close();
  ({ hazard: hazardMode, exam: examMode })[name]?.open(options);
}
function resumeDrive() { if (ui) { ui.lastOverlay = ''; ui.lastCoach = ''; } instantCamera = true; }
function audioContext() { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); return audio; }
const siren = createSiren(audioContext), streetSounds = createStreetSounds(audioContext);
function chime(correct = true) {
  if (!soundEnabled) return;
  try {
    const audio = audioContext();
    [0, .13].forEach((delay, i) => {
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = (correct ? 523 : 294) * (i ? 1.25 : 1);
      gain.gain.setValueAtTime(.045, audio.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + delay + .25);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(audio.currentTime + delay); oscillator.stop(audio.currentTime + delay + .3);
    });
  } catch { soundEnabled = false; }
}
function changeCamera() {
  cameraMode = nextCameraMode(cameraMode, cameraModes(state.mission)); instantCamera = true;
}
function setChapter(index, start = false) {
  if (!start && CHAPTERS[index] === chapterFor(state.missionIndex)) return;
  clearInput(); saveChapter(storage, index);
  const chapter = CHAPTERS[index];
  const next = start ? chapter.indices[0] : chapter.indices.find(i => !practised.includes(MISSIONS[i].id)) ?? chapter.indices[0];
  state = sessionFor(next); instantCamera = true;
  if (start) { state.start(); if (cameraMode === 'overview') changeCamera(); }
}
function selectMission(index) {
  clearInput(); saveChapter(storage, CHAPTERS.indexOf(chapterFor(index)));
  state = sessionFor(index); instantCamera = true; byId('lessons-dialog').close();
}
function setMode(nextMode) {
  const selected = nextMode === 'independent' ? nextMode : 'guided';
  if (selected === mode) return;
  mode = selected; saveMode(storage, mode);
  selectMission(state.missionIndex);
}
function showLessons() { clearInput(); if (state.status === 'driving') state.pause(); byId('lessons-dialog').showModal(); }
function action(name) {
  clearInput();
  if (name === 'start') { state.start(); if (cameraMode === 'overview') changeCamera(); }
  if (name === 'retry') { state.retry(); if (cameraMode === 'overview') changeCamera(); instantCamera = true; }
  if (name === 'next') state.next();
  if (name === 'resume') state.pause();
  if (name === 'replay') { state.replay(); if (cameraMode === 'overview') changeCamera(); instantCamera = true; }
  if (name === 'replay-toggle') state.pauseReplay();
  if (name === 'replay-decision') { state.seekReplay(state.replayDuration); instantCamera = true; }
  if (name === 'replay-exit') state.exitReplay();
  if (name === 'lessons') showLessons();
  if (name === 'independent') setMode('independent');
  if (name === 'restart') setChapter(CHAPTERS.indexOf(chapterFor(state.missionIndex)), true);
  if (name === 'chapter-next') setChapter(CHAPTERS.indexOf(chapterFor(state.missionIndex)) + 1, true);
}
function park() { const result = state.act(); if (result?.type === 'hint') ui.toast(result.message); }
function toggleCruise() { state.toggleCruise(); }
function attachControls() {
  pedals = bindPedals(() => state);
  byId('cruise').addEventListener('click', toggleCruise);
  byId('signal-left').addEventListener('click', () => state.toggleSignal('left'));
  byId('signal-right').addEventListener('click', () => state.toggleSignal('right'));
  byId('park').addEventListener('click', park);
  byId('camera').addEventListener('click', changeCamera);
  byId('pause').addEventListener('click', () => { clearInput(); state.pause(); });
  byId('sound').addEventListener('click', () => {
    soundEnabled = !soundEnabled; byId('sound').classList.toggle('active', soundEnabled);
    byId('sound').setAttribute('aria-label', soundEnabled ? 'Disable sound' : 'Enable sound');
    byId('sound').setAttribute('aria-pressed', String(soundEnabled)); chime();
  });
  byId('overlay').addEventListener('click', event => {
    const answer = event.target.closest('[data-answer]');
    if (answer) state.answer(Number(answer.dataset.answer));
    const button = event.target.closest('[data-action]'); if (button) action(button.dataset.action);
  });
  byId('overlay').addEventListener('input', event => {
    if (event.target.matches('[data-replay-seek]')) state.seekReplay(Number(event.target.value) / 30);
  });
  byId('practice-modes').addEventListener('click', event => {
    const button = event.target.closest('button[data-mode]'); if (button) setMode(button.dataset.mode);
  });
  byId('show-hint').addEventListener('click', () => {
    state.revealHint(); ui.toast('Hint on. This attempt earns practice credit. Try again without hints for an Independent pass.');
  });
  const lessons = byId('lessons-dialog');
  byId('open-lessons').addEventListener('click', showLessons);
  byId('close-lessons').addEventListener('click', () => lessons.close());
  lessons.addEventListener('click', event => {
    const button = event.target.closest('button[data-mission]'); if (button) selectMission(Number(button.dataset.mission));
  });
  byId('chapter-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-chapter]'); if (button) setChapter(Number(button.dataset.chapter));
  });
  byId('mission-list').addEventListener('click', event => {
    const button = event.target.closest('button[data-mission]');
    if (button && !button.disabled) selectMission(Number(button.dataset.mission));
  });
  const help = byId('help-dialog');
  byId('help').addEventListener('click', () => { clearInput(); if (state.status === 'driving') state.pause(); help.showModal(); });
  byId('close-help').addEventListener('click', () => help.close());
  byId('reset-progress').addEventListener('click', () => {
    clearInput(); practised = []; independent = []; saveProgress(storage, practised); saveIndependent(storage, independent); saveChapter(storage, 0); clearExamData(storage);
    state = sessionFor(0); cameraMode = 'overview'; instantCamera = true;
    byId('camera').innerHTML = '◈ <span>Overview</span>'; help.close();
  });
  byId('hazard-open').addEventListener('click', () => openMode('hazard'));
  document.addEventListener('keydown', event => {
    if (activeMode()) return;
    if (help.open || lessons.open || event.target?.matches?.('input, textarea, select')) return;
    if (event.defaultPrevented) return; // the Practice list took this Escape
    const code = event.code;
    if (!['KeyQ','ArrowLeft','KeyE','ArrowRight','KeyC','KeyF','KeyV','KeyP','Escape'].includes(code)) return;
    event.preventDefault();
    if (state.status === 'driving') {
      if (!event.repeat && ['KeyQ','ArrowLeft'].includes(code)) state.toggleSignal('left');
      if (!event.repeat && ['KeyE','ArrowRight'].includes(code)) state.toggleSignal('right');
      if (!event.repeat && code === 'KeyC') toggleCruise();
      if (!event.repeat && code === 'KeyF') park();
    }
    if (!event.repeat && code === 'KeyV') changeCamera();
    if (!event.repeat && ['KeyP','Escape'].includes(code)) { clearInput(); state.pause(); }
  });
  const suspend = () => { clearInput(); siren.stop(); if (state.status === 'driving') state.pause(); };
  window.addEventListener('blur', suspend);
  document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
  byId('world').addEventListener('webglcontextlost', event => {
    event.preventDefault(); suspend(); ui.toast('The 3D view was interrupted. Reload to restore your saved progress.');
  });
}

const startLesson = id => { const index = MISSIONS.findIndex(mission => mission.id === id); if (index >= 0) selectMission(index); };
examMode = createExamMode({ root: byId('exam-root'), storage, search: location.search, inertTargets: () => document.querySelectorAll('.site-header, .game-layout'), onExit: resumeDrive,
  getWorld: () => world ? { world, actors, canvas: byId('world') } : worldFailed ? false : null, // null: not ready yet, false: no 3D view
  onLesson: startLesson, onHazard: missions => openMode('hazard', { missions }) });
byId('exam-open').addEventListener('click', () => openMode('exam')); bindPracticeMenu();

try {
  await Promise.all([loadVehicle(), loadPeople(), loadCyclist(), loadSurfaceMaps(), loadDaylight()]); assetsReady = true;
  world = createWorld(byId('world')); actors = createActors(world.scene); ui = new GameUI(() => chime());
  hazardMode = createHazardMode({ world, actors, onExit: resumeDrive, onLesson: startLesson, weak: () => loadWeak(storage),
    onResult: ({ clip, correct }) => recordWeak(storage, { source: 'hazard', topic: MISSION_TOPIC[clip.mission], correct, mission: clip.mission }) });
  attachControls();
  let last = performance.now(), accumulator = 0;
  function frame(now) {
    const elapsed = Math.min((now - last) / 1000, .25); last = now;
    const mode = activeMode();
    if (mode) { accumulator = 0; try { mode.frame(elapsed); } catch (error) { console.error('Practice mode frame failed:', error); } requestAnimationFrame(frame); return; }
    accumulator += elapsed;
    while (accumulator >= 1 / 60) { state.tick(1 / 60, pedals.sample()); accumulator -= 1 / 60; }
    if (state.status !== previousStatus) {
      if (state.status !== 'driving') clearInput();
      if (state.status === 'review') chime(false);
      if (['review', 'success', 'complete'].includes(state.status)) recordDrive(state.mission, state.status, state.result?.reason);
      if (state.status === 'success' || state.status === 'complete') {
        if (!practised.includes(state.mission.id)) { practised.push(state.mission.id); if (!saveProgress(storage, practised)) ui.toast('Your progress stays here for this session. Browser storage is unavailable.'); }
        if (state.independentPass && !independent.includes(state.mission.id)) {
          independent.push(state.mission.id); saveIndependent(storage, independent);
        }
        chime();
      }
      previousStatus = state.status;
    }
    const display = state.status === 'replay' ? state.replaySnapshot() : state.status === 'review' ? state.failureSnapshot : null;
    world.updateLesson(state, display); actors.update(state, display); ui.update(state, practised, display, independent);
    try { streetSounds.update(state, soundEnabled); } catch (error) { console.error('Street sound failed:', error); }
    try { siren.update(soundEnabled ? sirenLevel(state, display ?? state, actors.player.position) : null); } catch (error) { soundEnabled = false; console.error('Siren sound failed:', error); }
    const mission = state.mission, route = routeFor(mission), snapshot = display ?? state.snapshot();
    if (mission.route !== lastRoute) { lastRoute = mission.route; instantCamera = true; }
    if (cameraMode !== 'overview' && !cameraModes(mission).includes(cameraMode)) { cameraMode = 'chase'; instantCamera = true; }
    const recorded = ['review', 'replay'].includes(state.status), actorIndex = actorIndexFor(state.missionIndex), conflict = recorded && CONFLICT_REASONS.includes(state.result?.reason);
    const recordedActor = recorded && isLightsMission(mission) ? decisionActor(state, display) : !conflict ? null : mission.kind === 'merge' ? nearestLaneActor(mission, display) : mission.kind === 'street' ? nearestStreetActor(mission, display, state.result?.reason)
      : actorIndex ? actorContext(actorIndex, display, state.missionIndex).point : null;
    const focus = recorded ? decisionFocus(mission, snapshot, recordedActor) : route.at(mission.gate);
    world.setArea(route.area, route.view); world.updateMerge(state, snapshot);
    const cameraLabel = recorded ? 'Decision view' : CAMERA_LABELS[cameraMode];
    if (byId('camera').dataset.view !== cameraLabel) {
      byId('camera').dataset.view = cameraLabel; byId('camera').innerHTML = `◈ <span>${cameraLabel}</span>`;
    }
    world.render(actors.player, recorded ? 'decision' : cameraMode, display?.time ?? state.time, focus, instantCamera,
      usingHints(state) && state.missionIndex < 5, recordedActor, display?.speed ?? state.speed, laneCamera(mission, snapshot), lookCamera(mission)); instantCamera = false;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
} catch (error) {
  console.error('Drive Town could not start:', error); worldFailed = true;
  document.body.dataset.status = 'unsupported';
  const message = assetsReady
    ? 'This town needs a browser with WebGL 2 and graphics acceleration enabled. Try a current Chrome, Safari or Firefox.'
    : 'The town’s 3D assets could not load. Run the included local server and reload this page.';
  byId('overlay').innerHTML = `<div class="floating-card"><h2>The town could not load.</h2><p>${message}</p><button class="primary-button" onclick="location.reload()">Try loading again</button></div>`;
  byId('coach-message').textContent = 'The 3D view could not start. Your existing saved progress is safe.';
}
