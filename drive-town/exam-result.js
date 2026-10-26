import { gradeItem, isAnswered } from './exam-grade.js';

// Scores a session. `session` needs items, answers, passAt, startedAt, endedAt, seconds, reason and fresh.
export function summarise(session) {
  const { items, answers } = session, perTopic = {}, wrong = [];
  items.forEach((item, index) => {
    const row = perTopic[item.topic] ??= { total: 0, wrong: 0, unanswered: 0 };
    row.total++;
    if (gradeItem(item, answers[index])) return;
    row.wrong++; if (!isAnswered(item, answers[index])) row.unanswered++;
    wrong.push({ index, item, value: answers[index] ?? null, correct: item.correct });
  });
  const total = items.length, score = total - wrong.length;
  const unanswered = wrong.filter(entry => !isAnswered(entry.item, entry.value)).length;
  const end = session.endedAt ?? session.now(), used = Math.max(0, Math.round((end - session.startedAt) / 1000));
  return { score, total, passed: session.passAt === null ? null : score >= session.passAt, passAt: session.passAt, mistakes: wrong.length, unanswered,
    used: session.seconds === null ? used : Math.min(used, session.seconds), perTopic, wrong, reason: session.reason, fresh: session.fresh ?? 0 };
}

// Topics sorted by mistakes, most first. Topics without a mistake are left out.
export const mistakesByTopic = result => Object.entries(result.perTopic).filter(([, row]) => row.wrong).sort((a, b) => b[1].wrong - a[1].wrong).map(([topic, row]) => ({ topic, ...row }));

export const formatClock = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
