import { TOPICS, TOPIC_IDS } from './topics.js';
import { SOURCES } from './sources.js';
import { GLOSSARY } from './glossary.js';
import { SCENES } from './scenes.js';
import { CHECKS } from './checks.js';
import { MISSIONS } from '../missions.js';
import { validateItem } from '../exam-items.js';

// Loads the bank. The bank files are listed by topic (topics.js) plus merging.js (chapter 05), chapter-06.js and chapter-07.js, and sign-data.js holds the signs.
// Every file is required: a file that fails to load makes the whole load fail, and the exam shows its "could not load" card.
export const BANK_FILES = [...new Set(TOPICS.map(topic => topic.file)), 'merging.js', 'chapter-06.js', 'chapter-07.js'];

export async function loadExam() {
  const [signData, ...modules] = await Promise.all(['sign-data.js', ...BANK_FILES].map(name => import(`./${name}`)));
  const items = modules.flatMap(module => module.default);
  const registry = { topics: TOPIC_IDS, scenes: SCENES, sources: SOURCES, glossary: GLOSSARY, signs: signData.SIGNS, missions: MISSIONS.map(mission => mission.id), checks: CHECKS };
  const bank = [], problems = [];
  for (const item of items) { const errors = validateItem(item, registry); if (errors.length) problems.push(...errors); else bank.push(item); }
  if (problems.length) console.error(`Exam items dropped (${problems.length}):`, problems.slice(0, 8));
  return { bank, registry, problems };
}
