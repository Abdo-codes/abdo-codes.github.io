import { cleanWeak, emptyWeak, recordExam } from './weak-topics.js';
import { DEFAULT_PREFS, HISTORY_LIMIT } from './exam-config.js';
import { TOPIC_IDS } from './exam/topics.js';

// Browser storage for the mock exam. `storage` is injected and may be null or throw: every call is guarded, and every stored value is untrusted.
export const KEYS = { run: 'drive-town-exam-run-v1', last: 'drive-town-exam-last-v1', history: 'drive-town-exam-history-v1', weak: 'drive-town-weak-v1', prefs: 'drive-town-exam-prefs-v1' };

function read(storage, key) { try { return JSON.parse(storage.getItem(key)); } catch { return null; } }
function write(storage, key, value) { try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
function remove(storage, key) { try { storage.removeItem(key); return true; } catch { return false; } }

const sessionJson = raw => raw && typeof raw === 'object' && raw.v === 1 && Array.isArray(raw.ids) ? raw : null;
export const loadRun = storage => sessionJson(read(storage, KEYS.run));
export const saveRun = (storage, session) => write(storage, KEYS.run, session.toJSON());
export const clearRun = storage => remove(storage, KEYS.run);
export const loadLast = storage => sessionJson(read(storage, KEYS.last));
export const saveLast = (storage, session) => write(storage, KEYS.last, session.toJSON());

export function loadHistory(storage) {
  const raw = read(storage, KEYS.history);
  if (raw?.version !== 1 || !Array.isArray(raw.entries)) return [];
  return raw.entries.filter(entry => entry && typeof entry.id === 'string' && Number.isFinite(entry.score)).slice(-HISTORY_LIMIT).map(entry => ({
    id: entry.id, date: String(entry.date ?? '').slice(0, 10), score: entry.score, total: Number.isFinite(entry.total) ? entry.total : 50, passed: Boolean(entry.passed),
    fresh: Number.isFinite(entry.fresh) ? entry.fresh : 0, clock: entry.clock === 'extra' ? 'extra' : 'standard',
    perTopic: Object.fromEntries(Object.entries(entry.perTopic ?? {}).filter(([topic, row]) => TOPIC_IDS.includes(topic) && Number.isFinite(row?.wrong)).map(([topic, row]) => [topic, { total: Number(row.total) || 0, wrong: row.wrong }])) }));
}
export function saveHistory(storage, entries) { return write(storage, KEYS.history, { version: 1, entries: entries.slice(-HISTORY_LIMIT) }); }

export const loadWeak = (storage, itemIds = null) => cleanWeak(read(storage, KEYS.weak), itemIds);
export const saveWeak = (storage, data) => write(storage, KEYS.weak, data);

export function loadPrefs(storage) {
  const raw = read(storage, KEYS.prefs), prefs = { ...DEFAULT_PREFS };
  if (raw && typeof raw === 'object') for (const key of Object.keys(DEFAULT_PREFS)) if (typeof raw[key] === 'boolean') prefs[key] = raw[key];
  return prefs;
}
export const savePrefs = (storage, prefs) => write(storage, KEYS.prefs, prefs);

// Runs once at finish: keep the result, then (for a counted exam) the history entry and the weak record, then clear the run.
// Each store checks the run id, so a reload or a second call never counts twice. Returns false when a write failed.
export function commitFinished(storage, session) {
  let ok = saveLast(storage, session);
  if (session.counts) {
    const result = session.result(), history = loadHistory(storage);
    if (!history.some(entry => entry.id === session.id)) {
      history.push({ id: session.id, date: new Date(session.endedAt ?? Date.now()).toISOString().slice(0, 10), score: result.score, total: result.total, passed: result.passed,
        perTopic: result.perTopic, fresh: result.fresh, clock: session.seconds > 1800 ? 'extra' : 'standard' });
      ok = saveHistory(storage, history) && ok;
    }
    ok = saveWeak(storage, recordExam(loadWeak(storage), session)) && ok;
  }
  // A drill or a redo finishes without touching a different saved exam run.
  const saved = loadRun(storage);
  return (saved && saved.id !== session.id ? true : clearRun(storage)) && ok;
}

// "Reset practice progress": run, last result, history and weak store go. The preferences stay.
export function clearExamData(storage) {
  return [KEYS.run, KEYS.last, KEYS.history, KEYS.weak].map(key => remove(storage, key)).every(Boolean);
}
export { emptyWeak };
