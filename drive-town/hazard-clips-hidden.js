import { SOURCES } from './exam/sources.js';
import { van } from './missions/cycle-lane.js';

// Hazard clips with a parked van that hides a person (lesson 22, the cycle street). The van stands on the strip at s 150, where the lesson puts it.
// The `traffic` field replaces the road users of the lesson for the clip (see recordClip). The person stands at the kerb behind the van, then steps out round the front of the van.
// `actorTime` is the clock at the freeze. The walker stands behind the van from the start of the clip, then walks to the left at WALK m/s, so the car meets it in the lane.
const H = Math.PI / 2, WALK = 1.1;
// WVW 1994 Article 5 (do not cause danger) is the only law text that fits a person you cannot see yet. That it covers this case is our reading.
const DANGER = { reference: 'WVW 1994 · Article 5 (our reading)', source: SOURCES['wvw-5'].url };
// Parked at the kerb side of the strip, 10 cm closer to the kerb than the lesson van (lateral 2.8 against 2.7), so the van alone leaves 0.75 m to the car (the lesson counts 0.7 m as busy, a margin of 5 cm).
// The van is 2.1 m wide and the strip is 2 m wide, so the kerb side of the van is 10 cm over the kerb (lateral 3.85 against 3.75). The lesson van is 10 cm over the lane line instead. This is too small to see.
const parked = { ...van, lateral: 2.8 };
// At the freeze (clock 6) the person is at lateral 1.4: an arm, a leg and a part of the head show beside the van and the rest of the person stays behind it (checked with the camera of the clip).
const walker = (t0, extra = {}) => ({ model: 'walker', length: .6, s0: 155, speed: 0, lateral: 3.3, turn: H, drift: { t0, t1: t0 + 10, to: 3.3 - WALK * 10 }, ...extra });
export const HIDDEN_CLIPS = [
  {
    id: 'van-hides-walker', mission: 'cycle-lane', variation: 0, speed: 22, lead: 2, actorTime: 6, signal: false, answer: 'brake', topic: 'Parked vehicles',
    traffic: [parked, walker(6 - (3.3 - 1.4) / WALK)], ...DANGER,
    explanation: 'A van stands on the strip and hides the pavement behind it. A person steps out from behind the van. You could not see them before. Do not cause danger: brake and let them cross.',
  },
  {
    id: 'van-hides-nobody', mission: 'cycle-lane', variation: 0, speed: 22, lead: 2, actorTime: 6, signal: false, answer: 'nothing', topic: 'Parked vehicles',
    traffic: [parked], ...DANGER,
    explanation: 'A van stands on the strip, but nobody is near it and nobody steps out. You do not need to brake. Pass with care and keep looking at the gaps beside the van.',
  },
];
