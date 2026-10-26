import { yn, mc, fill, hot, ord } from './make.js';

// Chapter 07 Trams, bikes and overtaking: 15 items. 3 are in the topic priority (prio-60 to prio-62: the tram stop and the junction)
// and 12 are in the topic road-use (road-60 to road-71: the cycle strip and overtaking). 8 are text items and 7 sit on the scenes of scenes-street.js.
// The order item road-70 and the item prio-62 are driving habits, not rules, so they carry `notCbr`. road-62 is our reading of Articles 2b and 10 together.
// No item names a gap for a cyclist: the law gives no number. These items wait for the instructor review.
const P = 'priority', R = 'road-use';

export default [
  // Tram stop and junction (Articles 52 and 15)
  hot('prio-60', P, 'Tap the road user who goes first at the tram stop.', 'tram-stop-doors', 'passengers',
    { check: 'who-first', explanation: 'People leave a standing tram on your side of the road. You give them the chance to do so (Article 52). They go first.',
      source: 'rvv-52', terms: ['tram', 'tramhalte'], mission: 'tram-street' }),
  hot('prio-61', P, 'Tap the road user who goes first at the junction.', 'tram-crossing', 'tram',
    { check: 'who-first', explanation: 'A tram has priority at a junction (Article 15). This is also true when the tram comes from your left.',
      source: 'rvv-15', terms: ['tram', 'kruispunt', 'voorrang'], mission: 'tram-street' }),
  mc('prio-62', P, 'You drive towards this tram stop. A tram brakes into the stop beside your lane. What do you do?',
    ['Speed up to pass the tram', 'Take your foot off the accelerator', 'Sound the horn'], 1,
    { scene: 'tram-arriving', action: 'release', notCbr: true, explanation: 'The doors open soon and people step out (Article 52). Take your foot off the accelerator early, so you can stop in time. The best moment is a driving habit and not a rule.',
      source: 'rvv-52', terms: ['tram', 'tramhalte'], mission: 'tram-street' }),

  // Cycle strip (Articles 10, 2b, 23 and 20)
  yn('road-60', R, 'A cycle strip next to your lane has a solid line. May you drive your car on the strip?', false,
    { explanation: 'Only cyclists and drivers of a disabled-person vehicle may use a cycle strip with a solid line (Article 10). A light moped counts as a bicycle (Article 2b). A car is neither.',
      source: ['rvv-10', 'rvv-2b'], terms: ['fietsstrook', 'doorgetrokken streep', 'gehandicaptenvoertuig'], mission: 'cycle-lane' }),
  yn('road-61', R, 'You drive a car. May you let your car stand still on a cycle strip?', false,
    { explanation: 'A driver may not let a vehicle stand still on a cycle strip (Article 23). The same ban holds on the road along a cycle strip.',
      source: 'rvv-23', terms: ['fietsstrook'], mission: 'cycle-lane' }),
  yn('road-62', R, 'You ride a light moped (snorfiets). May you use a cycle strip with a solid line?', true,
    { explanation: 'A light moped counts as a bicycle (Article 2b), and cyclists may use a cycle strip with a solid line (Article 10). So you may use it. This is our reading of the two articles together.',
      source: ['rvv-10', 'rvv-2b'], terms: ['snorfiets', 'fietsstrook', 'doorgetrokken streep'], mission: 'cycle-lane' }),
  fill('road-63', R, 'You ride a moped (bromfiets) on the road in a built-up area. What is the highest speed that you may ride?', 'km/h', 45,
    { explanation: 'In a built-up area, a moped on the road may ride at 45 km/h (Article 20). A car may drive at 50 km/h.',
      source: 'rvv-20', terms: ['bromfiets', 'bebouwde kom'], mission: 'cycle-lane' }),
  hot('road-64', R, 'A van stands on the cycle strip. Tap the road user who will ride out into your lane.', 'strip-cyclist', 'cyclist',
    { pictureOnly: true, explanation: 'The van stands on the cycle strip, where it may not stand still (Article 23). The cyclist rides out into your lane to pass it. Give room early; this advice is a habit and not a rule.',
      source: 'rvv-23', terms: ['fietsstrook'], mission: 'cycle-lane' }),

  // Overtaking (Articles 11, 12, 19, 55, 76 and 3)
  mc('road-65', R, 'You drive a car and overtake a slower car on a two-way road. On which side do you pass?',
    ['On the right', 'On the left', 'On the side with more room'], 1,
    { explanation: 'Article 11 says that you overtake on the left. The exceptions in the article, such as a car that turns left, do not apply here.',
      source: 'rvv-11', terms: ['inhalen'], mission: 'overtaking' }),
  yn('road-66', R, 'You drive a car and want to overtake a slower car. Must you show your direction indicator?', true,
    { explanation: 'A driver of a motor vehicle shows the indicator when he wants to overtake another motor vehicle (Article 55). You pass on the left, so you show the left indicator.',
      source: ['rvv-55', 'rvv-11'], terms: ['richtingaanwijzer', 'inhalen'], mission: 'overtaking' }),
  mc('road-67', R, 'The centre line is broken and a car comes towards you, close. May you overtake?',
    ['Yes, because the line is broken', 'Yes, if the other driver brakes', 'No; the car takes the free distance that you need'], 2,
    { explanation: 'You may cross a broken line (Article 76), but you must be able to stop within the distance that is free (Article 19). A close oncoming car takes that distance away (our reading of Article 19). A pass with a car coming also causes danger (WVW Article 5).',
      source: ['rvv-76', 'rvv-19', 'wvw-5'], terms: ['onderbroken streep', 'inhalen'], mission: 'overtaking' }),
  hot('road-68', R, 'Tap what forbids you to overtake the cyclist.', 'overtake-zebra-scene', 'zebra',
    { check: 'overtake-block', cluster: 'overtake-zebra', explanation: 'You may not overtake just before or on a zebra crossing (Article 12). The crossing is ahead, so you stay behind the cyclist.',
      source: 'rvv-12', terms: ['zebrapad', 'inhalen'], mission: 'overtaking' }),
  hot('road-69', R, 'Tap what forbids you to overtake the cyclist on this road.', 'overtake-solid-scene', 'line',
    { check: 'overtake-block', cluster: 'overtake-solid', explanation: 'You may not cross a solid line between lanes with traffic in both directions (Article 76). The line is ahead, so you stay behind the cyclist.',
      source: 'rvv-76', terms: ['doorgetrokken streep', 'inhalen'], mission: 'overtaking' }),
  ord('road-70', R, 'Put the steps of an overtake in the right order. Start with the first.', [2, 1, 0, 3],
    { choices: ['Pass the vehicle', 'Show the left indicator', 'Check the road ahead and behind', 'Move back to the right'], notCbr: true,
      explanation: 'This order is a driving habit and not a rule. The law asks for a signal when you overtake (Article 55). It asks you to keep right as far as you can (Article 3).',
      source: ['rvv-55', 'rvv-3'], terms: ['inhalen', 'rechts houden'], mission: 'overtaking' }),

  // A van on the cycle strip hides a person (the hazard clip van-hides-walker; WVW Article 5, our reading)
  mc('road-71', R, 'A van stands on the cycle strip. Part of a person shows beside the van, at the edge of your lane. What do you do?',
    ['Keep your speed, because the person is not on the road yet', 'Brake and be ready to stop', 'Sound the horn and drive on'], 1,
    { scene: 'van-hides', action: 'brake', explanation: 'The van hides the pavement, so a person can step into your lane with no warning. Do not cause danger (WVW Article 5; that it covers a person that the van hides is our reading). Brake and be ready to stop.',
      source: 'wvw-5', terms: ['fietsstrook'], mission: 'cycle-lane' }),
];
