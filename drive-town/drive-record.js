import { MISSION_TOPIC } from './exam/topics.js';
import { loadWeak, saveWeak } from './exam-store.js';
import { recordResult } from './weak-topics.js';

// Feeds the weak-topic store from the drive and the hazard test. The exam itself records through commitFinished.
// A mistake is filed under the topic of the broken rule when the reason says so, else under the topic of the lesson.
// The merge lessons keep their signal mistake: Article 55 on a lane change belongs to special roads and manoeuvres, and the lesson link needs that topic.
// Chapter 07: passengers and trams are priority; the pass reasons are road use.
const BY_REASON = { speed: 'road-use', bay: 'road-use', signal: 'safe-driving', passengers: 'priority', 'tram-way': 'priority',
  oncoming: 'road-use', 'cut-in': 'road-use', 'overtake-zebra': 'road-use', 'solid-line': 'road-use', 'no-return': 'road-use' };
const LANE_LESSONS = ['zipper-merge', 'acceleration-lane', 'room-to-merge', 'tram-street', 'cycle-lane', 'overtaking'];
export const driveTopic = (missionId, reason) => (LANE_LESSONS.includes(missionId) && reason === 'signal' ? null : BY_REASON[reason]) ?? MISSION_TOPIC[missionId];

// Never throws. A bad topic is an error in the data: it goes to the console, not to the player.
export function recordWeak(storage, entry) {
  try { return saveWeak(storage, recordResult(loadWeak(storage), entry)); }
  catch (error) { console.error('Weak-topic result not recorded:', error); return false; }
}
// Only the first result of a lesson in one page session counts, so a retry loop does not skew the topic.
export function createDriveRecorder(storage) {
  const done = new Set();
  return (mission, status, reason) => {
    if (done.has(mission.id)) return false;
    done.add(mission.id);
    const wrong = status === 'review';
    return recordWeak(storage, { source: 'drive', topic: driveTopic(mission.id, wrong ? reason : null), correct: !wrong, mission: wrong ? mission.id : undefined });
  };
}
