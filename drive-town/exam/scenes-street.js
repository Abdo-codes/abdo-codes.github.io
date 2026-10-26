// Exam scenes of chapter 07 (hazard-clips-street.js): three at the tram stop and the junction (topic priority), four at the cycle strip (one of them with a van that hides a person) and on the overtake road (topic road-use).
// A pin `{ lane: model, y }` is the lane road user of that model nearest to the car. A pin `{ zone: 'zebra' | 'solid' }` is the paint of a zone of the overtake lesson.
// A pin with `first: true` is the road user who goes first while the hazard is active (the check `who-first`). The check `overtake-block` names the zone pin that lies ahead.
const YOU = { id: 'you', label: 'Your car', at: 'player' };
const RIDER = { id: 'rider', label: 'The cyclist', at: { lane: 'cyclist' } };
export const STREET_SCENES = [
  { id: 'tram-stop-doors', from: 'tram-doors-open', topic: 'priority', describe: 'You drive at 22 km/h in a street with a 30 km/h limit. A tram stands at its stop. The doors are open on your side and people step out onto the road.',
    pins: [YOU, { id: 'passengers', label: 'The people from the tram', at: { lane: 'walker' }, first: true }, { id: 'tram', label: 'The tram', at: { lane: 'tram', y: 3.6 } }] },
  { id: 'tram-crossing', from: 'tram-crossing-far', topic: 'priority', describe: 'You drive at 22 km/h towards a junction. A triangular sign with a tram on it stands before the junction. No priority sign stands there. A tram comes along the cross track from the left.',
    pins: [YOU, { id: 'tram', label: 'The tram', at: { lane: 'tram', y: 3.6, along: 8 }, first: true }] },
  { id: 'tram-arriving', from: 'tram-arriving', topic: 'priority', describe: 'You drive at 30 km/h in a 30 km/h street. A tram slows down into a tram stop beside your lane. The doors are shut. A white line crosses your lane about 36 metres ahead. It is a lesson marker.', pins: [YOU] },
  { id: 'strip-cyclist', from: 'strip-cyclist-pulls-out', topic: 'road-use', describe: 'You drive at 22 km/h in a street with a 30 km/h limit. A van stands on the cycle strip on your right. A cyclist rides on the strip, close behind the van.',
    pins: [YOU, { id: 'cyclist', label: 'The cyclist', at: { lane: 'cyclist' } }, { id: 'van', label: 'The van', at: { lane: 'van', y: 3 } }] },
  { id: 'van-hides', from: 'van-hides-walker', topic: 'road-use', describe: 'You drive at 22 km/h in a street with a 30 km/h limit. A van stands on the cycle strip on your right. A part of a person shows beside the van, at the edge of your lane.', pins: [YOU] },
  { id: 'overtake-zebra-scene', from: 'overtake-zebra', topic: 'road-use', describe: 'You drive at 40 km/h on a two-way road with a 50 km/h limit. A cyclist rides about 23 metres ahead. A zebra crossing and a sign for it lie further ahead.',
    pins: [YOU, RIDER, { id: 'zebra', label: 'The zebra crossing', at: { zone: 'zebra' } }] },
  { id: 'overtake-solid-scene', from: 'overtake-solid-line', topic: 'road-use', describe: 'You drive at 40 km/h on a two-way road with a 50 km/h limit. A cyclist rides about 20 metres ahead. The centre line ahead is solid. No car comes towards you.',
    pins: [YOU, RIDER, { id: 'line', label: 'The centre line', at: { zone: 'solid' } }] },
];
