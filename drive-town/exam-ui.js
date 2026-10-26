import { esc, word, plain } from './exam-text.js';
import { formatClock } from './exam-result.js';
import { answerHtml } from './exam-answer-ui.js';
import { topicById } from './exam/topics.js';
import { EXAM_SIZE, EXAM_SECONDS } from './exam-config.js';

// HTML builders for the start card and the question screen. Pure: they return strings.
export { esc, word };
const button = (act, text, cls = 'secondary-button', attrs = '') => `<button type="button" class="${cls}" data-act="${act}" ${attrs}>${text}</button>`;
const option = (id, text, checked, note = '') => `<label class="exam-option"><input type="checkbox" id="opt-${id}" data-pref="${id}" ${checked ? 'checked' : ''}><span>${text}${note ? `<small>${note}</small>` : ''}</span></label>`;

export function startHtml(view) {
  const { prefs, canResume, resumeKind, last, weak, history, scenesOn, bankSize } = view, plan = view.plan ?? { size: EXAM_SIZE, passAt: 44 };
  const minutes = (prefs.extra ? 45 : EXAM_SECONDS / 60);
  const practise = topic => { const { missions, clipMissions } = view.practice(topic); return missions.length ? `<span class="exam-actions">${button('lesson', 'Practise lessons', 'secondary-button', `data-mission="${esc(missions[0])}"`)}${clipMissions.length ? button('hazard-lesson', 'Hazard clips', 'secondary-button', `data-mission="${esc(clipMissions.join(','))}"`) : ''}</span>` : ''; };
  const weakRows = weak.map(row => `<li><strong>${esc(topicById[row.topic].en)}</strong> <small lang="nl">${esc(topicById[row.topic].nl)}</small><span>${row.wrong} wrong in your last ${row.n} answers</span>${practise(row.topic)}</li>`).join('');
  const past = history.slice(-5).reverse().map(entry => `<li><span>${esc(entry.date)}</span><strong>${entry.score} of ${entry.total}</strong><span>${entry.passed ? 'Pass' : 'Not pass'}${entry.clock === 'extra' ? ' (45 min)' : ''}</span></li>`).join('');
  return `<div class="exam-start">
    <span class="eyebrow">THEORIE-EXAMEN · MOCK EXAM</span>
    <h2 id="exam-heading" tabindex="-1">Practise with a mock exam</h2>
    <ul class="exam-facts"><li><strong>${plan.size}</strong> questions</li><li><strong>${minutes}</strong> minutes</li><li>Pass at <strong>${plan.passAt}</strong> <small>(up to ${plan.size - plan.passAt} mistakes)</small></li></ul>
    ${plan.size < EXAM_SIZE ? `<p class="exam-note" role="status">This build has ${plan.size} questions, not ${EXAM_SIZE}. The pass mark is scaled to ${plan.passAt}.</p>` : ''}
    <p>This is practice only. It does not predict your result. The real exam also has 2 test questions and 2 practice questions that do not count. CBR does not publish topic counts or how many questions have a clip. Drive Town chooses its own mix.</p>
    <p>Questions repeat after a few exams. Results stay in this browser. The real exam may not show how many answers to choose.</p>
    ${scenesOn ? '' : '<p class="exam-note" role="status">Pictures are off: the 3D view is not available.</p>'}
    <fieldset class="exam-options"><legend>Options</legend>
      ${option('dutch', 'Show Dutch exam words', prefs.dutch, 'Most come from a CBR sample screen. Some labels are our own wording. The current screen may differ.')}
      ${option('singleKeys', 'Letter and digit shortcuts', prefs.singleKeys, 'Turn off if you use voice control.')}
      ${option('chooseN', 'Show how many answers to choose', prefs.chooseN, 'It keeps the strict rule fair.')}
      ${option('extra', 'Extra time: 45 minutes', prefs.extra, 'For a test with extra time.')}
    </fieldset>
    <div class="exam-actions">
      ${canResume ? button('resume', `Resume your ${resumeKind ?? 'exam'}`, 'primary-button') : ''}
      ${button('start', canResume ? 'Start a new exam' : 'Start the exam →', canResume ? 'secondary-button' : 'primary-button')}
      ${last ? button('review-last', last.kind === 'drill' ? 'Review last drill' : 'Review last exam') : ''}
      ${weak.length ? button('drill-weak', 'Weak-topic drill') : ''}
      ${button('exit', 'Back to driving')}
    </div>
    <section class="exam-weak" aria-labelledby="weak-title"><h3 id="weak-title">Weak topics</h3>
      ${weakRows ? `<ul>${weakRows}</ul>` : '<p>No weak topics yet. Finish a few exams and they show here.</p>'}</section>
    ${past ? `<section class="exam-history"><h3>Your last exams</h3><ul>${past}</ul></section>` : ''}
    <small class="exam-foot-note">${bankSize} questions in the bank.</small>
  </div>`;
}

// The header bar of the question screen. The clock is updated in place by the mode (#exam-clock).
export function barHtml(session, prefs) {
  const marked = session.marked.has(session.index), timed = session.remaining !== null;
  return `<div class="exam-clock" ${timed ? '' : 'hidden'}><small>${word('time', prefs)}</small><time id="exam-clock" data-seconds="${session.remaining ?? ''}">${formatClock(session.remaining ?? 0)}</time><span class="exam-timebar" aria-hidden="true"><i id="exam-timebar"></i></span></div>
    ${timed ? '' : '<div class="exam-clock"><small>Drill</small><time>No timer</time></div>'}
    <div class="exam-tools">
      <button type="button" class="exam-tool" data-act="mark" aria-pressed="${marked}"><span aria-hidden="true">⚑</span> ${word('mark', prefs)}</button>
      <button type="button" class="exam-tool" data-act="overview"><span aria-hidden="true">▦</span> ${word('overview', prefs)}</button>
      <button type="button" class="exam-tool" data-act="help"><span aria-hidden="true">?</span> ${word('help', prefs)}</button>
      <button type="button" class="exam-tool exam-exit" data-act="exit-ask">Exit</button>
    </div>`;
}

export function footHtml(session, prefs) {
  const last = session.index === session.items.length - 1;
  return `<button type="button" class="exam-nav" data-act="previous" ${session.index ? '' : 'disabled'}>← ${word('previous', prefs)}</button>
    <span class="exam-count" id="exam-count">${word('question', prefs)} ${session.index + 1} ${word('of', prefs)} ${session.items.length}</span>
    <button type="button" class="exam-nav exam-nav-next" data-act="next">${last ? word('overview', prefs) : word('next', prefs)} →</button>`;
}

export const termsHtml = (item, view) => (item.terms ?? []).length
  ? `<p class="exam-terms"><small>Exam words</small> ${item.terms.map(key => { const term = view.glossary[key]; return `<span><b lang="nl">${esc(term.nl)}</b> = ${esc(term.en)}</span>`; }).join('')}</p>` : '';

// The card of one question. It is rebuilt only when the index or the phase changes.
export function questionHtml(session, i, view) {
  const item = session.items[i], scene = item.scene ? view.scenes[item.scene] : null, { prefs } = view;
  const sign = item.sign && view.sign ? `<div class="exam-sign">${view.sign.svg(item.sign)}</div>` : '';
  const sceneNote = scene ? `<p class="exam-scene-tools">${button('replay', '↻ Replay', 'exam-link')}${button('describe', 'Describe the picture', 'exam-link', 'aria-expanded="false" aria-controls="exam-describe"')}</p>
    <p id="exam-describe" class="exam-describe" hidden>${esc(scene.describe)}</p>` : '';
  const cbr = item.notCbr ? '<p class="exam-tag">Drive Town item, not a CBR question type</p>' : '';
  return `<article class="exam-item" data-type="${item.type}" aria-labelledby="exam-heading">
    <p class="exam-qno"><span>${plain('question', prefs)} ${i + 1}</span> <small>${esc(topicById[item.topic].en)}</small></p>
    <h2 id="exam-heading" tabindex="-1">${esc(item.prompt)}</h2>${sign}${sceneNote}${cbr}
    ${answerHtml(item, session, i, view)}
    <div id="exam-feedback" class="exam-feedback" aria-live="polite"></div>
    ${termsHtml(item, view)}
  </article>`;
}

// The confirm dialogs. The safe button (stay) comes first, so it gets the focus.
export function confirmHtml(kind, session) {
  const open = session.items.length - session.answeredCount, timed = session.seconds !== null, name = session.passAt === null ? 'drill' : 'exam';
  const copy = kind === 'finish'
    ? { title: `Finish the ${name}?`, text: `${open ? `${open} question${open === 1 ? ' has' : 's have'} no answer.` : 'All questions have an answer.'} ${session.marked.size} marked. You cannot change an answer after you finish.`, stay: 'Back to the questions', go: `Finish ${name}`, act: 'confirm-finish' }
    : { title: `Leave the ${name}?`, text: name === 'drill' ? 'A drill is not saved. If you leave, you start a new drill later. Your saved exam stays.' : timed ? 'Your answers are saved. The clock keeps running while you are away. You can resume from the start card.' : 'Your answers are saved. You can resume from the start card.', stay: 'Stay', go: 'Leave', act: 'confirm-exit' };
  return `<h2 id="exam-confirm-title" tabindex="-1">${copy.title}</h2><p>${copy.text}</p>
    <div class="exam-actions">${button('cancel', copy.stay, 'primary-button')}${button(copy.act, copy.go)}</div>`;
}
export const timeupHtml = () => `<div class="exam-timeup"><span class="eyebrow">TIJD IS OM · TIME IS UP</span><h2 id="exam-heading" tabindex="-1">Time is up</h2>
  <p>The exam is over. A question without an answer counts as wrong.</p>${button('show-result', 'See your result', 'primary-button')}</div>`;
