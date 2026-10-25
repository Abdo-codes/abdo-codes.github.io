// Exam scenes of chapter 06 (hazard-clips-lights.js): three on the amber light, three on the siren and three on the officer. Spread into RAW of scenes.js.
// The amber and officer scenes belong to the topic signs, the siren scenes to the topic priority. The lamp stands at the stop line, 3.6 m to the right.
const YOU = { id: 'you', label: 'Your car', at: 'player' };
const LAMP = { id: 'lamp', label: 'The traffic light', at: { sign: 2.25, offset: 3.6, y: 3.8 } };
export const LIGHTS_SCENES = [
  { id: 'amber-far', from: 'amber-far', topic: 'signs', describe: 'You drive at 40 km/h towards a traffic light. The light shows amber. The stop line is far ahead.', pins: [YOU] },
  { id: 'amber-late', from: 'amber-late', topic: 'signs', describe: 'You drive at 40 km/h towards a traffic light. The light turned amber a moment ago. The stop line is very close.', pins: [YOU] },
  { id: 'amber-slow-stop', from: 'amber-slow-stop', topic: 'signs', describe: 'You drive at 22 km/h towards a traffic light. The light shows amber. The stop line is a little way ahead.',
    pins: [YOU, LAMP, { id: 'line', label: 'The stop line', at: { ahead: 2.25, side: 0, y: .3 } }] },
  { id: 'ambulance-left-close', from: 'ambulance-left-close', topic: 'priority', describe: 'You drive at 40 km/h and the light ahead is green. An ambulance with a siren and blue lights comes from the left on the crossing road.', pins: [YOU] },
  { id: 'ambulance-right-far', from: 'ambulance-right-far', topic: 'priority', describe: 'You drive at 22 km/h and the light ahead is green. An ambulance with a siren and blue lights comes from the right on the crossing road.',
    pins: [YOU, { id: 'ambulance', label: 'The ambulance', at: 'actor' }] },
  { id: 'ambulance-passed', from: 'ambulance-passed', topic: 'priority', describe: 'You drive at 40 km/h and the light ahead is green. An ambulance with a siren has just passed the junction and drives away.', pins: [YOU] },
  { id: 'officer-stop-close', from: 'officer-stop-close', topic: 'signs', describe: 'You drive at 40 km/h towards a traffic light. The light is green. A police officer in the junction shows stop to your lane.', pins: [YOU] },
  { id: 'officer-stop-far', from: 'officer-stop-far', topic: 'signs', describe: 'You drive at 30 km/h towards a traffic light. The light is green. A police officer in the junction shows stop to your lane.',
    pins: [YOU, { id: 'officer', label: 'The police officer', at: 'actor' }, LAMP] },
  { id: 'officer-kerb', from: 'officer-kerb', topic: 'signs', describe: 'You drive at 40 km/h towards a traffic light. The light is green. A police officer stands at the kerb and shows nothing.', pins: [YOU] },
];
