import { source, q } from './shared.js';

export default {
  id: 'parking', shortTitle: 'Parking', title: 'Made it to the bakery', skill: 'Finish with care', icon: 'P',
  start: 123, gate: 149, end: 159, trigger: 133, duration: 8, crossingExit: 15.6,
  actor: { slot: 4, path: { type: 'line', from: [3, -18], to: [20, -18] } },
  objective: 'Signal, stop by the bay, let the pedestrian pass, then park.',
  coach: 'The bakery bay is on your right. Signal and stop beside it. Someone is walking past the entrance: let them clear it, then press Park.',
  success: 'Safely parked. You signalled, waited for a clear entrance, and parked beside the bakery.',
  rule: 'During a special manoeuvre such as parking, yield to all other traffic.',
  reference: 'RVV 1990 · Article 54', source: source(54),
  terms: ['parkeerhaven', 'richtingaanwijzer'], // Dutch exam words (exam/glossary.js)
  questions: [
    q('You enter a parking bay while someone walks across its entrance. What do you do?', ['Enter because the car is on the roadway', 'Enter slowly while they move around you', 'Wait and let the pedestrian pass'], 2, 'A special manoeuvre requires you to let other traffic go first.'),
    q('You leave a parking place and another car approaches. Who must make room?', ['You must let the other traffic pass', 'The approaching driver must stop for your indicator', 'Whoever started moving last'], 0, 'When moving off as a special manoeuvre, let the other traffic go first.'),
  ],
};
