import { stopTimes, DOOR_OPEN } from './lane-entry.js';
import { stopTram } from './tram-state.js';

// The sounds of the tram lesson and the text cue that shows with each one (pure). Sound is off by default and the lessons never need it:
// every sound has a cue on screen, and the door lamps carry the same meaning. Times are on the actor clock (seconds).
export const CUE_SECONDS = 2.5;
export const TEXT = { brake: 'Tram bell · the tram brakes', doors: 'Door chime · the doors open', leave: 'Tram bell · the tram leaves' };
// The moments with a sound: { id, at, sound } for the tram of the stop. `bell` is two tones; `chime` is one. A tram whose doors stay shut has no door chime.
export function soundMoments(mission) {
  const tram = mission.lane?.role === 'tram' ? stopTram(mission) : null;
  if (!tram) return [];
  const { brakeAt, arrive, depart } = stopTimes(tram);
  return [{ id: 'brake', at: brakeAt, sound: 'bell' }, ...tram.stop.doors ? [{ id: 'doors', at: arrive + DOOR_OPEN, sound: 'chime' }] : [], { id: 'leave', at: depart, sound: 'bell' }];
}
// The sounds that start in (from, to] on the actor clock. A jump of more than a second (replay seek, retry) plays none.
export function soundsBetween(mission, from, to) {
  if (from === null || from === undefined || to === null || to === undefined || to <= from || to - from > 1) return [];
  return soundMoments(mission).filter(moment => moment.at > from && moment.at <= to).map(moment => moment.sound);
}
// The cue on screen for `view` (a snapshot): the text of the latest sound of the last CUE_SECONDS, or null.
export function streetCue(mission, view) {
  const time = view.actorTime;
  if (time === null || time === undefined) return null;
  const moment = soundMoments(mission).filter(item => time >= item.at && time < item.at + CUE_SECONDS).at(-1);
  return moment ? { id: moment.id, text: TEXT[moment.id] } : null;
}
