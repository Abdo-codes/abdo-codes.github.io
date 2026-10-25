import { ExamSession } from './exam-session.js';
import { keyAction } from './exam-input.js';
import { startHtml, barHtml, footHtml, questionHtml, confirmHtml, timeupHtml } from './exam-ui.js';
import { overviewHtml } from './exam-ui-overview.js';
import { resultHtml, feedbackHtml } from './exam-ui-result.js';
import { helpHtml } from './exam-help.js';
import { syncAnswer, entriesOf, ORDINAL } from './exam-answer-ui.js';
import { createExamScene } from './exam-scene.js';
import { createStage } from './exam-stage.js';
import { newExam, newDrill, weakestTopic, examPlan } from './exam-flow.js';
import { keyOf, picked, withoutLast } from './exam-pick.js';
import { SCENES } from './exam/scenes.js';
import { weakTopics, practiceFor } from './weak-topics.js';
import { signView } from './sign-svg.js';
import { parseNumber } from './exam-grade.js';
import { formatClock } from './exam-result.js';
import * as store from './exam-store.js';

// The DOM controller of the mock exam. It owns #exam-root and moves #world into the picture area while the exam is open.
// Answers, marks and the clock change in place. The card is rebuilt only when the screen or the question changes, then the heading gets the focus.
// Nothing here trusts storage: every read goes through exam-store.js.
const FOCUS = [['input[type=radio]', 'radio'], ['input[type=checkbox]', 'check'], ['input', 'input'], ['button', 'button'], ['a', 'link']];
const focusKind = target => FOCUS.find(([selector]) => target?.matches?.(selector))?.[1] ?? 'body';
const WARN = [600, 300, 60], BROKEN = '<div class="exam-start"><h2 id="exam-heading" tabindex="-1">The exam could not load</h2><p>Reload the page and try again.</p><button type="button" class="primary-button" data-act="exit">Back to driving</button></div>';

export function createExamMode({ root, doc = typeof document === 'undefined' ? null : document, getWorld = () => false, storage = null, onExit = () => {}, onLesson = () => {}, onHazard = () => {},
  loadBank = () => import('./exam/index.js').then(module => module.loadExam()), now = Date.now, random = Math.random, search = '', inertTargets = () => [],
  pause = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  const $ = id => root.querySelector(`#${id}`), prefs = store.loadPrefs(storage), watched = new Set();
  let active = false, bundle = null, session = null, scene = null, stage = null, screen = 'start', timeup = false, filter = 'all', key = '', clock = -1, toasted = false;
  let clipFrom = null, phase = '', feedback = '', weak, history, lastRun, canResume = false, resumeKind = 'exam', timer = null, opener = null, toastTimer = null;

  const kind = () => session.passAt === null ? 'drill' : 'exam';
  const opts = () => ({ random, now, scenes: SCENES });
  const env = () => ({ bank: bundle.bank, weak, prefs, scenesOn: Boolean(stage), random, now, search });
  const view = () => ({ prefs, glossary: bundle.registry.glossary, scenes: SCENES, sources: bundle.registry.sources, sign: signView(bundle.registry.signs ?? {}), practice: (topic, focus) => practiceFor(topic, weak, focus),
    canResume, resumeKind, last: lastRun ? { kind: lastRun.passAt === null ? 'drill' : 'exam' } : null, weak: weakTopics(weak), history, scenesOn: Boolean(stage), bankSize: bundle.bank.length, plan: examPlan(env()) });
  const say = text => { $('exam-live').textContent = text; };
  function toast(text) { const el = $('exam-toast'); el.textContent = text; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 6000); toastTimer.unref?.(); }
  // Only an exam is saved. A drill never replaces the saved exam run.
  function persist() { if (session.passAt !== null && !store.saveRun(storage, session) && !toasted) { toasted = true; toast('Your answers cannot be saved in this browser. They stay on this page until you close it.'); } }
  function refresh() {
    weak = store.loadWeak(storage); history = store.loadHistory(storage); lastRun = store.loadLast(storage);
    const run = store.loadRun(storage); canResume = Boolean(run) && Boolean(ExamSession.fromJSON(run, bundle.bank, opts())); resumeKind = run?.passAt === null ? 'drill' : 'exam';
    if (run && !canResume) store.clearRun(storage);
  }
  function finishRun() { if (!store.commitFinished(storage, session) && !toasted) { toasted = true; toast('Your result cannot be saved in this browser.'); } refresh(); }

  const BUILD = { loading: () => '<p class="exam-loading" role="status">Loading the questions…</p>', start: () => startHtml(view()), question: () => questionHtml(session, session.index, view()),
    overview: () => overviewHtml(session, filter, view()), timeup: () => timeupHtml(), result: () => resultHtml(session, session.result(), view(), kind()) };

  function showPicture() {
    const item = screen === 'question' ? session.item : null;
    if (item?.scene && stage) stage.open(item.scene, { watched: watched.has(session.index), pinsOn: !item.choices && ['hotspot', 'order'].includes(item.type) });
    else if (!clipFrom) stage?.close();
    if (item?.scene && !stage) { $('exam-describe').hidden = false; root.querySelectorAll('.exam-scene-tools').forEach(el => el.remove()); }
  }
  function render(force = false) {
    if (session) screen = session.finished ? (timeup ? 'timeup' : 'result') : session.phase === 'overview' ? 'overview' : 'question';
    const next = `${screen}:${session?.id ?? ''}:${screen === 'question' ? session.index : ''}`;
    if (!force && next === key) return sync();
    key = next; root.dataset.screen = screen; const timed = ['question', 'overview'].includes(screen);
    $('exam-bar').hidden = !timed; $('exam-foot').hidden = screen !== 'question';
    $('exam-bar').innerHTML = timed ? barHtml(session, prefs) : ''; $('exam-foot').innerHTML = screen === 'question' ? footHtml(session, prefs) : '';
    const card = $('exam-card'); card.innerHTML = BUILD[screen](); card.scrollTop = 0;
    showPicture(); clock = -1; feedback = ''; sync(); tickClock();
    // Focus the heading, never an answer: a habitual Enter or Space must not choose one.
    (screen === 'timeup' ? root.querySelector('[data-act="show-result"]') : $('exam-heading') ?? card)?.focus?.({ preventScroll: true });
  }
  function sync() {
    if (screen !== 'question') return;
    const i = session.index, item = session.item, value = session.answers[i], locked = session.isChecked(i);
    syncAnswer(root, item, session, i); stage?.syncPins(item, value);
    for (const el of root.querySelectorAll('.exam-answers input, .exam-answers [data-order], #exam-fill')) el.disabled = locked;
    const html = feedbackHtml(session, i, view()); if (html !== feedback) { feedback = html; $('exam-feedback').innerHTML = html; }
    root.querySelector('[data-act="mark"]')?.setAttribute('aria-pressed', String(session.marked.has(i)));
    const note = $('exam-fill-note'); if (note) note.textContent = item.type === 'fill' && value && Number.isNaN(parseNumber(value, item.unit)) ? 'Type a number' : '';
  }

  // The clock changes in place once per second. It runs on the question and overview screens, and while a dialog is open.
  function tickClock() {
    if (!session || session.finished || session.seconds === null) return;
    if (session.tick()) return timeUp();
    const left = session.remaining; if (left === clock) return; clock = left;
    const el = $('exam-clock'); if (el) { el.textContent = formatClock(left); el.dataset.seconds = String(left); }
    const bar = $('exam-timebar'); if (bar) bar.style.width = `${left / session.seconds * 100}%`;
    root.dataset.low = left <= 300 ? 'yes' : 'no';
    if (WARN.includes(left)) say(`${left / 60} minute${left === 60 ? '' : 's'} left.`);
  }
  function timeUp() { closeDialogs(); clipClose(); timeup = true; finishRun(); render(true); }

  const dialogs = () => [$('exam-help'), $('exam-confirm')];
  function openDialog(id, html, focus) { const d = $(id); d.innerHTML = html; if (d.showModal) { if (!d.open) d.showModal(); } else d.open = true; d.querySelector(focus)?.focus?.(); }
  function closeDialogs() { for (const d of dialogs()) if (d.open) { if (d.close) d.close(); else d.open = false; } }
  function clipOpen(id, opener) {
    if (!stage) return toast('The picture is not available on this device.');
    clipFrom = opener; stage.open(id, { pinsOn: false }); scene.replay(true); $('exam-clip-close').hidden = false; root.dataset.clip = 'yes'; $('exam-clip-close').focus?.();
  }
  function clipClose() { if (!clipFrom) return; stage.close(); $('exam-clip-close').hidden = true; root.dataset.clip = 'no'; clipFrom.focus?.(); clipFrom = null; }
  function closeTop() {
    if (dialogs().some(d => d.open)) return closeDialogs();
    if (clipFrom) return clipClose();
    if (screen === 'overview') { session.closeOverview(); persist(); render(); }
  }

  function setAnswer(value) { if (!session.answer(value)) return false; persist(); sync(); return true; }
  function pickKey(pick) {
    const item = session.item, i = session.index, next = picked(item, session.answers[i], pick);
    if (next === undefined || !setAnswer(next)) return;
    if (item.type !== 'order') return;
    const name = entriesOf(item, session, i, view()).find(entry => entry.key === pick)?.name, n = (next ?? []).indexOf(pick) + 1;
    say(n ? `${ORDINAL[n - 1]}: ${name}` : `Removed: ${name}`);
  }
  const begin = next => {
    if (!next.items.length) return toast('No questions are ready for this yet.');
    session = next; timeup = false; filter = 'all'; watched.clear(); persist(); render(true);
  };
  const drill = options => begin(newDrill(env(), options));
  const step = name => { session[name](); persist(); render(); };
  function toStart() { session = null; timeup = false; screen = 'start'; clipClose(); refresh(); render(true); }
  function reopen(json) {
    const next = ExamSession.fromJSON(json, bundle.bank, opts());
    if (!next) return null;
    session = next; timeup = false; return next;
  }
  const ACT = {
    start: () => begin(newExam(env())), again: () => ACT.start(), 'start-card': () => toStart(), exit: () => close(),
    resume: () => {
      if (!reopen(store.loadRun(storage))) { store.clearRun(storage); toast('The saved exam does not fit the questions now. It was removed.'); return toStart(); }
      if (session.finished) { timeup = true; finishRun(); }
      render(true);
    },
    'review-last': () => { if (reopen(lastRun)) render(true); else toast('The last result cannot be shown now.'); },
    'drill-weak': () => drill({ topic: weakestTopic(weak, random) }), 'drill-weakest': () => drill({ topic: weakestTopic(weak, random) }),
    'drill-topic': el => drill({ topic: el.dataset.topic }), redo: () => drill({ ids: session.result().wrong.map(entry => entry.item.id) }),
    'exit-ask': () => openDialog('exam-confirm', confirmHtml('exit', session), '[data-act="cancel"]'),
    'finish-ask': () => openDialog('exam-confirm', confirmHtml('finish', session), '[data-act="cancel"]'),
    cancel: () => closeDialogs(), 'confirm-exit': () => { closeDialogs(); close(); },
    'confirm-finish': () => { closeDialogs(); session.finish('handed-in'); timeup = false; finishRun(); render(true); },
    'show-result': () => { timeup = false; render(true); },
    mark: () => { const on = session.toggleMark(); persist(); sync(); say(on ? 'Marked.' : 'Mark removed.'); },
    overview: () => { session.openOverview(); persist(); render(); }, 'close-overview': () => { session.closeOverview(); persist(); render(); },
    previous: () => step('prev'), next: () => step('next'), help: () => openDialog('exam-help', helpHtml(prefs), 'h2'), 'close-help': () => closeDialogs(),
    play: () => { scene?.play(); watched.add(session.index); say('The clip plays.'); }, replay: () => { scene?.replay(); say('The clip plays again.'); },
    describe: el => { const text = $('exam-describe'); text.hidden = !text.hidden; el.setAttribute('aria-expanded', String(!text.hidden)); },
    check: () => { session.check(); persist(); sync(); }, 'clear-order': () => { setAnswer(null); say('The order is clear.'); },
    clip: el => clipOpen(el.dataset.scene, el), 'clip-close': () => clipClose(),
    lesson: el => { close(); onLesson(el.dataset.mission); }, 'hazard-lesson': el => { close(); onHazard(el.dataset.mission.split(',')); },
  };

  function onClick(event) {
    const hit = selector => event.target.closest?.(selector); let el;
    if ((el = hit('[data-act]'))) return void ACT[el.dataset.act]?.(el);
    if ((el = hit('[data-goto]'))) { session.goto(Number(el.dataset.goto)); persist(); return render(); }
    if ((el = hit('[data-filter]'))) { filter = el.dataset.filter; render(true); return void root.querySelector(`[data-filter="${filter}"]`)?.focus?.(); }
    if ((el = hit('[data-order]')) && !el.disabled) return pickKey(keyOf(session.item, el.dataset.order));
    if ((el = hit('[data-pin]'))) pickKey(keyOf(session.item, el.dataset.pin));
  }
  function onChange(event) {
    const target = event.target;
    if (target.matches?.('[data-pref]')) { prefs[target.dataset.pref] = target.checked; store.savePrefs(storage, prefs); render(true); return void $(`opt-${target.dataset.pref}`)?.focus?.(); }
    if (screen !== 'question' || !target.matches?.('.exam-answers input')) return;
    if (target.type === 'radio') return void setAnswer(keyOf(session.item, target.value));
    const all = [...root.querySelectorAll('.exam-answers input:checked')].map(input => Number(input.value)).sort((a, b) => a - b);
    setAnswer(all.length ? all : null);
  }
  const onInput = event => { if (screen === 'question' && event.target.id === 'exam-fill') setAnswer(event.target.value || null); };
  const overlay = () => $('exam-confirm').open ? 'confirm' : $('exam-help').open || clipFrom ? 'dialog' : screen === 'overview' ? 'overview' : 'none';
  function run(action) {
    if (action === 'close') return closeTop();
    if (typeof action === 'object') {
      if ('answer' in action) return void setAnswer(action.answer);
      const entry = entriesOf(session.item, session, session.index, view())[action.pick]; return entry ? pickKey(entry.key) : undefined;
    }
    if (action === 'remove-last') return void setAnswer(withoutLast(session.answers[session.index]));
    ACT[action]?.();
  }
  function onKey(event) {
    if (!active || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Enter' && event.target?.id === 'exam-fill' && screen === 'question') { event.preventDefault(); return ACT[session.feedback === 'instant' && !session.isChecked() ? 'check' : 'next'](); }
    const action = keyAction(event.key, { focus: focusKind(event.target), overlay: overlay(), type: screen === 'question' ? session.item.type : '', singleKeys: prefs.singleKeys });
    if (!action || (action !== 'close' && screen !== 'question')) return;
    event.preventDefault(); run(action);
  }
  root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('input', onInput); (doc ?? root).addEventListener('keydown', onKey);
  const viewport = typeof window === 'undefined' ? null : window.visualViewport;
  viewport?.addEventListener('resize', () => { if (active) root.style.setProperty('--vv-bottom', `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`); });

  async function attachWorld() {
    if (stage) return;
    let handle = getWorld(); // null: not ready yet, false: no 3D view
    for (let waited = 0; handle === null && waited < 3000; waited += 100) { await pause(100); handle = getWorld(); }
    if (!handle) return;
    scene = createExamScene({ world: handle.world, actors: handle.actors, canvas: handle.canvas }); stage = createStage({ root, canvas: handle.canvas, scene });
  }
  async function open() {
    if (active) return;
    const from = doc?.activeElement; opener = !from || from === doc.body || from.closest?.('.practice-menu') ? doc?.getElementById?.('practice-open') ?? null : from; // the Practice button, also when a click did not focus the menu item
    active = true; toasted = false; timer = setInterval(tickClock, 500); timer.unref?.(); // the clock also runs without frames (no 3D view, hidden tab)
    session = null; screen = 'loading'; root.hidden = false; for (const el of inertTargets()) el.inert = true; if (doc) doc.body.dataset.exam = 'open'; render(true);
    try { bundle ??= await loadBank(); await attachWorld(); if (active) toStart(); }
    catch (error) { console.error('Mock exam could not start:', error); if (active) { $('exam-card').innerHTML = BROKEN; $('exam-heading').focus?.(); } }
  }
  function close() {
    if (!active) return;
    active = false; clearInterval(timer); closeDialogs(); clipClose(); stage?.release(); root.hidden = true; for (const el of inertTargets()) el.inert = false;
    if (doc) delete doc.body.dataset.exam;
    root.style.removeProperty?.('--vv-bottom'); const back = opener; opener = null; onExit(); if (back?.isConnected) back.focus?.();
  }
  function frame(dt) {
    if (!active) return;
    tickClock();
    if (!stage?.visible) return;
    stage.frame(dt);
    if (phase === 'playing' && scene.phase === 'stopped') say('The clip stopped. Choose your answer.');
    phase = scene.phase;
  }
  return { open, close, frame, get active() { return active; }, get screen() { return screen; }, get session() { return session; } };
}
