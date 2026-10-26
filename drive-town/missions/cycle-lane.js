import { STREET_STOPS, article, q } from './shared.js';

const S = STREET_STOPS.cycle;
// A van stands on the cycle strip (lateral 1.65 to 3.75). A cyclist rides on the strip at 15 km/h and must ride out round the van, into the learner lane.
// At the van the rider is at lateral 0.9 (rider 0.6 to 1.2; the car body ends at 1.0). All numbers are first guesses.
export const van = { model: 'van', length: 5.5, s0: 150, speed: 0, lateral: 2.7 };
const out = [{ at: 132, over: 8, by: -2.1 }, { at: 166, over: 8, by: 2.1 }];
const rider = (extra = {}) => ({ model: 'cyclist', length: 1.8, s0: 100, speed: 4.17, lateral: 3, ...extra });
const snor = { model: 'moped', plate: 'snorfiets', length: 1.8, s0: 100, speed: 4.4, lateral: 3, shifts: out };
const variants = [
  [van, rider({ shifts: out })], [rider()], [van, rider({ s0: 40, shifts: out })],
  [rider({ lateral: .45 }), rider({ lateral: -.45 })], [van, rider({ s0: 190, shifts: out })], [van, snor],
].map(traffic => ({ traffic }));
export default {
  id: 'cycle-lane', shortTitle: 'Bikes', kind: 'street', route: 'street-cycle',
  title: 'Cyclists and the strip', skill: 'Give room to cyclists', icon: 'BIKE',
  start: S.start, gate: S.gate, end: S.end, trigger: 0, initialActorTime: 0, speedLimit: 30, startSpeed: 22, driveSpeed: 22, slowSpeed: 10, lookSide: 'look-right',
  lane: { role: 'cycle', side: 1, from: 0, strip: { from: 0, to: 220, lateral: 2.75, width: 2, solid: [0, 120] }, traffic: variants[0].traffic, variants },
  objective: 'Drive on. Watch the van and the cyclist. Give room.',
  coach: 'A van stands on the cycle strip. A cyclist must ride round it. Tap Slow. Let the cyclist go round. Then drive on.',
  readyNote: 'No Merge button here. You control your speed.',
  success: 'You gave the cyclist room.',
  rule: 'A cycle strip with a solid line is for cyclists, light mopeds and disabled-person vehicles (Article 10 paragraph 2 and Article 2b). Do not let your car stand still on a cycle strip (Article 23). Two cyclists may ride side by side (Article 3 paragraph 2). A snorfiets may not.',
  reference: 'RVV 1990 · Articles 10 and 23', source: article(10),
  terms: ['fietsstrook', 'bromfiets', 'snorfiets'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('A cycle strip has a solid line next to the lane. Who may use it?',
      ['Cars, if the road is narrow', 'Cyclists, light mopeds and disabled-person vehicles', 'Cars and mopeds, if no cyclist is near'], 1,
      'Other drivers may not use a cycle strip with a solid line (Article 10 paragraph 2). A snorfiets counts as a bicycle (Article 2b).'),
    q('A delivery van stands on the cycle strip. A cyclist comes up behind it. What do you expect?',
      ['The cyclist waits behind the van', 'The cyclist rides out into your lane', 'The cyclist rides over the pavement'], 1,
      'A cyclist may leave the strip to pass the van. Slow down early and give room. This advice is a habit, not a rule.'),
  ],
};
