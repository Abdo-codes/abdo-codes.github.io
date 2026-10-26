import { esc } from './exam-text.js';
import { topicById } from './exam/topics.js';
import { resultByTopic } from './hazard-topics.js';

// The "By topic" block of the hazard result. `practice(topic, focus)` is practiceFor of the weak-topic store.
// Both buttons start from the lessons of the missed clips, and from the first lesson when nothing was missed.
export function topicResultHtml(test, practice) {
  const rows = resultByTopic(test.answers, test.clips);
  if (!rows.length) return '';
  const items = rows.map(row => {
    const topic = topicById[row.topic], plan = practice(row.topic, row.wrongLessons), share = Math.round(row.correct / row.total * 100);
    const own = plan.clipMissions.filter(id => row.wrongLessons.includes(id)), clips = own.length ? own : plan.clipMissions;
    const lesson = plan.missions.length ? `<button type="button" class="secondary-button" data-hazard="lesson" data-mission="${esc(plan.missions[0])}">Practise this</button>` : '';
    const more = clips.length ? `<button type="button" class="secondary-button" data-hazard="clips" data-mission="${esc(clips.join(','))}">Hazard clips</button>` : '';
    return `<li class="${row.correct === row.total ? 'topic-full' : 'topic-miss'}"><div class="topic-head"><strong>${esc(topic.en)}</strong><span>${row.correct} of ${row.total} right</span></div>
      <div class="topic-bar" role="img" aria-label="${share} percent right"><span style="width:${share}%"></span></div>
      <div class="topic-actions">${lesson}${more}</div></li>`;
  }).join('');
  return `<section class="hazard-topics" aria-label="Result by topic"><h3>By topic</h3><ul>${items}</ul></section>`;
}
