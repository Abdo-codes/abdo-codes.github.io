import { MISSION_TOPIC, TOPICS } from './exam/topics.js';
import { focusLessons } from './weak-topics.js';

// The result of a hazard test per exam topic (the topic of each clip's lesson, as in the weak-topic store).
// `answers` come from HazardTest and `clips` are the clips of the run. A row has the topic id, the answers that
// were right, the answers in all, and `wrongLessons`: the lessons of the missed clips, the most missed first.
// Rows are weakest first: the lowest share of right answers, then the most missed, then the topic order.
export function resultByTopic(answers, clips) {
  const clipOf = new Map(clips.map(clip => [clip.id, clip])), rows = new Map(), missed = new Map();
  for (const answer of answers) {
    const clip = clipOf.get(answer.id), topic = clip && MISSION_TOPIC[clip.mission];
    if (!topic) continue;
    const row = rows.get(topic) ?? { topic, correct: 0, total: 0 };
    row.total++; if (answer.correct) row.correct++; else missed.set(topic, [...(missed.get(topic) ?? []), clip]);
    rows.set(topic, row);
  }
  const order = topic => TOPICS.findIndex(item => item.id === topic);
  return [...rows.values()].map(row => ({ ...row, wrongLessons: focusLessons(missed.get(row.topic) ?? []) }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total || (b.total - b.correct) - (a.total - a.correct) || order(a.topic) - order(b.topic));
}
