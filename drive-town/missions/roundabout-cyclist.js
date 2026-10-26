import { STOPS, CENTRES, CYCLE_RING, roundaboutGuide, q } from './shared.js';

const deg = Math.PI / 180;
export default {
  id: 'roundabout-cyclist', shortTitle: 'Cycle path', kind: 'roundabout', route: 'roundabout', signal: 'right',
  title: 'Cyclists around the roundabout', skill: 'Give way as you leave', icon: '⇄',
  start: STOPS.firstExit + 16, gate: STOPS.secondExitEnd - 1, end: STOPS.secondExitEnd + 15, trigger: 158, duration: 10,
  // The cyclist rides the separate ring path anticlockwise on the map and crosses your exit at about -173°.
  actor: { slot: 3, name: 'cyclist on the cycle path', retire: true, clearAt: .56,
    path: { type: 'arc', centre: [CENTRES[1].x, CENTRES[1].z], radius: CYCLE_RING, from: -95 * deg, to: -255 * deg } },
  objective: 'Signal right, then let the cyclist on the roundabout cycle path pass before you leave.',
  coach: 'A cycle path runs close around this roundabout, so it counts as part of it. Signal right before you leave, and give way to the cyclist crossing your exit.',
  success: 'You signalled, waited for the cyclist on the roundabout cycle path, then left safely.',
  clearSuccess: 'You signalled, checked the cycle path, and left the roundabout safely.',
  rule: 'A cycle path close around a roundabout counts as part of it: drivers leaving give way to cyclists on it. Shark teeth or signs on the cycle path can change this, so read them.',
  reference: 'RVV 1990 · Articles 18 and 55 · ANWB roundabout guidance', source: roundaboutGuide,
  terms: ['rotonde', 'fietspad', 'voorrang verlenen'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('A cyclist on the cycle path around the roundabout is about to cross your exit. What do you do?',
      ['Leave first because you are faster', 'Give way and let the cyclist pass', 'Leave if your right indicator is on'], 1,
      'A cycle path close around a roundabout counts as part of it: drivers leaving give way to cyclists on it.'),
    q('You signalled right to leave and the cycle path looks clear. What next?',
      ['Leave without checking again', 'Check again for cyclists and pedestrians, then leave', 'Always stop fully before leaving'], 1,
      'Your indicator gives you no priority. Keep checking the crossing as you leave.'),
  ],
};
