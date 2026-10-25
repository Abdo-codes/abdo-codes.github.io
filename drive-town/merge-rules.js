import { ROUTES } from './routes.js';
import { clamp, laneState, playerPose } from './lane-change.js';
import { ruleActors } from './lane-traffic.js';
import { gapAt, hostCheck, hostTimes } from './merge-gap.js';
import { overlaps } from './overlap.js';

// Rules of the merge lessons (pure). The result of a mistake carries `cause` and `measure` for the feedback text.
const SPAN = 3.5, HALF = SPAN / 2;
// The hatched wedge fills the ending lane from its left edge; the road edge of the acceleration lane narrows to nothing.
export const hatchEdge = (hatch, s) => -HALF + SPAN * clamp((s - hatch[0]) / (hatch[1] - hatch[0]));
export const roadEdge = (narrow, s) => HALF - SPAN * clamp((s - narrow[0]) / (narrow[1] - narrow[0]));

const measureOf = pair => ({ gap: pair.gap, headway: pair.headway, projected: pair.projected, ahead: pair.ahead, closing: pair.closing,
  playerKmh: pair.playerKmh, otherKmh: pair.otherKmh, other: pair.actor?.model ?? 'car' });
const mistake = (reason, cause, pair) => ({ type: 'mistake', reason, ...cause && { cause, measure: measureOf(pair) } });

function hostResult(mission, before, after) {
  const { t0, tc, t1 } = hostTimes(mission), time = after.actorTime ?? 0;
  const learnerAt = () => ({ s: after.distance, speed: after.speed / 3.6 });
  const verdict = hostCheck(mission, learnerAt, { overlapTimes: time >= t0 && time <= t1 ? [time] : [], gapTime: (before.actorTime ?? 0) < tc && tc <= time ? time : null });
  if (verdict) return mistake('hinder', verdict.cause, verdict);
  return after.distance >= mission.end ? { type: 'success' } : null;
}

export function evaluateMerge(mission, before, after, context) {
  const lane = mission.lane;
  if (context.mergeRequested) return mission.signal && context.signal !== mission.signal ? { type: 'mistake', reason: 'signal' } : null;
  if (lane.role === 'host') return hostResult(mission, before, after);
  const now = laneState(mission, after.merge ?? null, after.distance, after.time ?? 0);
  if (lane.hatch && now.lateral < hatchEdge(lane.hatch, after.distance) + 1) return { type: 'mistake', reason: 'hatched' };
  if (lane.narrow && now.lateral + 1 > roadEdge(lane.narrow, after.distance)) return { type: 'mistake', reason: 'lane-end' };
  const route = ROUTES[mission.route], player = { s: after.distance, speed: after.speed / 3.6 };
  const actors = ruleActors(mission, after.actorTime ?? 0, [after.distance, 60]);
  if (after.merge) {
    const rect = { ...playerPose(route, mission, after), width: 2, length: 4.5 };
    const hit = actors.find(actor => overlaps(rect, actor, 0));
    if (hit) return mistake('yield', now.progress < 1 ? 'overlap' : 'catch-up', { ...gapAt(player, [hit]), actor: hit });
    const was = laneState(mission, before.merge ?? null, before.distance, before.time ?? 0).progress;
    if (was < .5 && now.progress >= .5) {
      const worst = gapAt(player, actors);
      if (worst?.cause) return mistake('yield', worst.cause, worst);
    }
  }
  return after.distance >= mission.end ? { type: 'success' } : null;
}
