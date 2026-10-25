import { HazardTest, ANSWER_SECONDS } from './hazard.js';
import { HAZARD_CLIPS } from './hazard-clips.js';
import { hazardKey, hazardOverlay } from './hazard-ui.js';
import { routeFor } from './routes.js';
import { showClipFrame } from './clip-view.js';
import { practiceFor, emptyWeak } from './weak-topics.js';

const byId = id => document.getElementById(id);
const KEYS = { Digit1: 'brake', Numpad1: 'brake', Digit2: 'release', Numpad2: 'release', Digit3: 'nothing', Numpad3: 'nothing' };

// Runs the hazard test in place of the drive: plays recorded clips through the same world and actors.
// `pool` replaces the clip pool in tests. `onResult({ clip, correct })` reports each answer once (the weak-topic store).
// `weak()` returns the weak-topic data and `onLesson(id)` starts a lesson: both serve the "Practise this" buttons of the result.
export function createHazardMode({ world, actors, onExit, pool, onResult, onLesson = () => {}, weak = emptyWeak }) {
  let test = null, key = '', clipId = '', instant = true, reported = 0;
  const overlay = byId('overlay');
  // `missions` limits the clips to the given lessons (the exam's "Hazard clips for this lesson"). A lesson with no clip uses the full pool.
  function open({ missions } = {}) {
    const source = pool ?? HAZARD_CLIPS, own = missions?.length ? source.filter(clip => missions.includes(clip.mission)) : [];
    test = new HazardTest(own.length ? own : source); key = ''; clipId = ''; instant = true; reported = 0;
    byId('coach-message').textContent = 'Hazard perception: decide what you would do the moment the picture freezes. Brake, release the accelerator, or do nothing.';
  }
  function close() { test = null; delete document.body.dataset.hazardPhase; onExit(); }
  function act(action, choice, mission) {
    if (!test) return;
    if (action === 'start') { test.start(); clipId = ''; reported = 0; }
    if (action === 'answer') test.answer(choice);
    if (action === 'next') test.next();
    if (action === 'replay') { test.replay(); instant = true; }
    if (action === 'exit') close();
    if (action === 'lesson') { close(); onLesson(mission); }
    if (action === 'clips') open({ missions: mission.split(',') });
  }
  overlay.addEventListener('click', event => {
    const target = event.target.closest('[data-hazard]');
    if (target && !target.disabled) act(target.dataset.hazard, target.dataset.choice, target.dataset.mission);
  });
  document.addEventListener('keydown', event => {
    if (!test || event.repeat || document.querySelector('dialog[open]')) return;
    if (KEYS[event.code]) { event.preventDefault(); act('answer', KEYS[event.code]); }
    if (event.code === 'Escape') { event.preventDefault(); close(); }
  });
  function report() {
    while (reported < test.answers.length) {
      const answer = test.answers[reported++];
      try { onResult?.({ clip: test.clips.find(clip => clip.id === answer.id), correct: answer.correct }); } catch (error) { console.error('Hazard result not recorded:', error); }
    }
  }
  function frame(dt) {
    test.tick(dt); report();
    document.body.dataset.status = 'hazard'; document.body.dataset.hazardPhase = test.phase;
    if (hazardKey(test) !== key) {
      key = hazardKey(test); overlay.innerHTML = hazardOverlay(test, (topic, focus) => practiceFor(topic, weak(), focus));
      // The drive footer says there is no timer, but this test has one. The drive UI sets its text again on exit.
      byId('footer-state').textContent = ['watch', 'answer'].includes(test.phase) ? `Answer within ${ANSWER_SECONDS} seconds.` : 'Hazard test · practice only.';
      // Never pre-focus an answer: a habitual Space press must not submit Brake.
      overlay.querySelector('.primary-button')?.focus({ preventScroll: true });
    }
    if (['intro', 'summary'].includes(test.phase)) {
      world.setArea();
      world.render(actors.player, 'overview', 0, routeFor().at(0), instant, false); instant = false; return;
    }
    if (clipId !== test.clip.id) { clipId = test.clip.id; instant = true; }
    const snapshot = test.frame; showClipFrame(world, actors, test.run, snapshot, instant);
    instant = false;
    const speed = byId('hazard-speed'), countdown = byId('hazard-countdown');
    if (speed) speed.textContent = `${Math.round(snapshot.speed)} km/h`;
    if (countdown) countdown.style.width = `${test.phase === 'answer' ? test.remaining / ANSWER_SECONDS * 100 : 100}%`;
  }
  return { open, frame, get active() { return Boolean(test); } };
}
