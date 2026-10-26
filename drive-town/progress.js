import { MISSIONS } from './missions.js';

const KEY = 'drive-town-progress-v1';
const INDEPENDENT_KEY = 'drive-town-independent-v1';
const known = new Set(MISSIONS.map(mission => mission.id));
const clean = values => [...new Set(values.filter(id => known.has(id)))];

export function loadProgress(storage) {
  try {
    const data = JSON.parse(storage.getItem(KEY));
    return data?.version === 1 && Array.isArray(data.practised) ? clean(data.practised) : [];
  } catch { return []; }
}

export function saveProgress(storage, practised) {
  try { storage.setItem(KEY, JSON.stringify({ version: 1, practised: clean(practised) })); return true; }
  catch { return false; }
}

export function loadIndependent(storage) {
  try {
    const data = JSON.parse(storage.getItem(INDEPENDENT_KEY));
    return data?.version === 1 && Array.isArray(data.passed) ? clean(data.passed) : [];
  } catch { return []; }
}
export function saveIndependent(storage, passed) {
  try { storage.setItem(INDEPENDENT_KEY, JSON.stringify({ version: 1, passed: clean(passed) })); return true; }
  catch { return false; }
}
