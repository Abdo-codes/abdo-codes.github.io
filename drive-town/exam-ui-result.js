import { esc } from './exam-text.js';
import { termsHtml } from './exam-ui.js';
import { answerText, correctText } from './exam-answer-ui.js';
import { gradeItem } from './exam-grade.js';
import { mistakesByTopic, formatClock } from './exam-result.js';
import { topicById } from './exam/topics.js';
import { focusLessons } from './weak-topics.js';
import { HAZARD_CLIPS } from './hazard-clips.js';

// The result screen (Uitslag) and the review cards. Pure: they return strings. Stored text is escaped.
const sourceLinks = (item, view) => [].concat(item.source ?? []).map(key => view.sources[key]).filter(Boolean)
  .map(source => `<a class="hazard-rule" href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.ref)} ↗</a>`).join(' ');

export function reviewCard(entry, view) {
  const { item, value } = entry, sign = item.sign && view.sign ? `<div class="exam-sign">${view.sign.svg(item.sign)}</div>` : '';
  const clips = item.mission && HAZARD_CLIPS.some(entry => entry.mission === item.mission) ? `<button type="button" class="secondary-button" data-act="hazard-lesson" data-mission="${esc(item.mission)}">Hazard clips for this lesson</button>` : '';
  const lesson = item.mission ? `<button type="button" class="secondary-button" data-act="lesson" data-mission="${esc(item.mission)}">Practise this lesson</button>${clips}` : '';
  const watch = item.scene ? `<button type="button" class="secondary-button" data-act="clip" data-scene="${esc(item.scene)}">Watch the clip again</button>` : '';
  return `<li class="review-card"><p class="review-q"><span>Question ${entry.index + 1}</span> ${esc(item.prompt)}</p>${sign}
    <dl class="review-answers"><dt>Your answer</dt><dd class="wrong">${esc(answerText(item, value, view))}</dd><dt>Right answer</dt><dd class="right">${esc(correctText(item, view))}</dd></dl>
    <p>${esc(item.explanation)}</p><p class="review-source">${sourceLinks(item, view)}</p>${termsHtml(item, view)}
    <div class="exam-actions">${watch}${lesson}</div></li>`;
}

function topicBlock(row, entries, view, open) {
  const topic = topicById[row.topic], focus = focusLessons(entries.map(entry => entry.item)), practice = view.practice(row.topic, focus), seen = new Set();
  const sources = entries.flatMap(entry => [].concat(entry.item.source ?? [])).filter(key => !seen.has(key) && seen.add(key)).map(key => view.sources[key]).filter(Boolean);
  // The lesson button starts the lesson of the wrong items. The clip button keeps to those lessons when they have clips.
  const own = practice.clipMissions.filter(id => focus.includes(id)), hazard = own.length ? own : practice.clipMissions;
  const lessons = practice.missions.length
    ? `<button type="button" class="secondary-button" data-act="lesson" data-mission="${esc(practice.missions[0])}">Practise lessons</button>` : '<p class="exam-note">No lesson yet. Read the rule sources.</p>';
  const clips = hazard.length ? `<button type="button" class="secondary-button" data-act="hazard-lesson" data-mission="${esc(hazard.join(','))}">Hazard clips</button>` : '';
  return `<details class="review-topic" ${open ? 'open' : ''}><summary><strong>${esc(topic.en)}</strong> <small lang="nl">${esc(topic.nl)}</small> <span>${row.wrong} to review</span></summary>
    <div class="exam-actions">${lessons}${clips}<button type="button" class="secondary-button" data-act="drill-topic" data-topic="${row.topic}">Drill: 10 questions</button></div>
    ${practice.missions.length ? '' : `<p class="review-source">${sources.map(s => `<a class="hazard-rule" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.ref)} ↗</a>`).join(' ')}</p>`}
    <ol class="review-list">${entries.map(entry => reviewCard(entry, view)).join('')}</ol></details>`;
}

// kind: 'exam' (pass mark) | 'drill' (no pass mark). The order is score, mistakes by topic, numbers, one action, review.
export function resultHtml(session, result, view, kind) {
  const exam = kind === 'exam', { prefs } = view, rows = mistakesByTopic(result);
  const verdict = !exam ? '' : result.passed ? '<p class="verdict pass"><span aria-hidden="true">✓</span> Pass</p>' : '<p class="verdict fail"><span aria-hidden="true">✕</span> Not pass</p>';
  const time = session.reason === 'time' ? '<p class="exam-note" role="status">Time is up. The questions without an answer count as wrong.</p>' : '';
  const total = rows.length ? `<ul class="result-topics">${rows.map(row => `<li><strong>${esc(topicById[row.topic].en)}</strong>: ${row.total - row.wrong} of ${row.total} right · ${row.wrong} of your ${result.mistakes} mistakes</li>`).join('')}</ul>` : '<p>No mistakes. Well done.</p>';
  const primary = result.mistakes ? `<button type="button" class="primary-button" data-act="redo">Redo my ${result.mistakes} mistakes</button>`
    : `<button type="button" class="primary-button" data-act="drill-weakest">Drill the weakest topic</button>`;
  const groups = rows.map((row, n) => topicBlock(row, result.wrong.filter(entry => entry.item.topic === row.topic), view, n === 0)).join('');
  return `<div class="exam-result">
    <span class="eyebrow">${prefs.dutch ? 'UITSLAG · ' : ''}RESULT · PRACTICE</span>
    <h2 id="exam-heading" tabindex="-1">${result.score} of ${result.total}</h2>
    ${exam ? `<p class="exam-passmark">Pass mark: ${result.passAt} of ${result.total}</p>` : '<p class="exam-passmark">Drill: there is no pass mark.</p>'}${verdict}${time}
    <p class="exam-note">Practice result. It does not predict your exam. Questions repeat after a few exams.</p>
    <section class="result-block"><h3>Mistakes by topic</h3>${total}
    <p class="result-stats">Time used: ${formatClock(result.used)} · Not answered: ${result.unanswered}${exam ? ` · New to you: ${result.fresh} of ${result.total}` : ''}</p></section>
    <div class="exam-actions result-actions">${primary}<button type="button" class="secondary-button" data-act="again">New exam</button><button type="button" class="secondary-button" data-act="start-card">Start card</button><button type="button" class="secondary-button" data-act="exit">Back to driving</button></div>
    ${groups ? `<section class="result-review"><h3>Review</h3><div class="review">${groups}</div></section>` : ''}
  </div>`;
}

// Feedback of a drill (instant feedback): the check button, then the verdict, the right answer, the reason and the source.
export function feedbackHtml(session, i, view) {
  if (session.feedback !== 'instant') return '';
  const item = session.items[i], value = session.answers[i];
  if (!session.isChecked(i)) return ['multi', 'fill', 'order'].includes(item.type) && session.isAnswered(i) ? '<button type="button" class="secondary-button" data-act="check">Check answer</button>' : '';
  const right = gradeItem(item, value);
  return `<div class="exam-verdict ${right ? 'pass' : 'fail'}"><p><strong><span aria-hidden="true">${right ? '✓' : '✕'}</span> ${right ? 'Right' : 'Not right'}</strong></p>
    ${right ? '' : `<p>Right answer: ${esc(correctText(item, view))}</p>`}<p>${esc(item.explanation)}</p><p class="review-source">${sourceLinks(item, view)}</p></div>`;
}
