import { law } from './missions/shared.js';

// Hazard clips of chapter 06 (amber light, siren, officer). The fields are those of hazard-clips.js.
// `actorTime` is the clock of the lesson at the freeze: the light clock (amber from 0), the siren clock (the ambulance appears at 4 s before the
// start of its path) or the officer clock (the arm is up from 0). The answer is the one of expectedAnswer in hazard.js.
// The amber and siren clips show the rule of their lesson (Articles 68 and 50). The officer clips teach Articles 82 and 84.
const OFFICER = { reference: 'RVV 1990 · Articles 82 and 84', source: `${law}#HoofdstukIV_Paragraaf2_Artikel84` };
export const LIGHTS_CLIPS = [
  {
    id: 'amber-far', mission: 'amber-light', variation: 0, speed: 40, lead: 40, actorTime: .3, answer: 'brake',
    topic: 'Amber light',
    explanation: 'The light is amber and the stop line is far ahead. You can stop in a safe way, so start to stop now.',
  },
  {
    id: 'amber-late', mission: 'amber-light', variation: 0, speed: 40, lead: 14, actorTime: .3, answer: 'nothing',
    topic: 'Amber light',
    explanation: 'The light turned amber and the stop line is very close. You can no longer stop in a safe way. Keep your speed and drive on.',
  },
  {
    id: 'amber-slow-stop', mission: 'amber-light', variation: 0, speed: 22, lead: 28, actorTime: .3, answer: 'brake',
    topic: 'Amber light',
    explanation: 'At a low speed you can still stop before the line. The light is amber, so start to stop now.',
  },
  {
    id: 'amber-too-close', mission: 'amber-light', variation: 0, speed: 30, lead: 8, actorTime: .3, answer: 'nothing',
    topic: 'Amber light',
    explanation: 'The stop line is very close, even at this speed. You can no longer stop in a safe way. Keep your speed and drive on.',
  },
  {
    id: 'ambulance-left-close', mission: 'emergency-vehicle', variation: 0, speed: 40, lead: 14, actorTime: 2, answer: 'brake',
    topic: 'Emergency vehicles',
    explanation: 'An ambulance with a siren and blue lights comes from the left and is close. It goes first. Brake and let it pass.',
  },
  {
    id: 'ambulance-right-far', mission: 'emergency-vehicle', variation: 1, speed: 22, lead: 22, actorTime: 1.5, view: { lookBack: -34, lookSide: 6 }, answer: 'release',
    topic: 'Emergency vehicles',
    explanation: 'An ambulance with a siren comes from the right. It goes first. Release the accelerator and be ready to stop.',
  },
  {
    id: 'ambulance-right-close', mission: 'emergency-vehicle', variation: 1, speed: 22, lead: 12, actorTime: 2.6, answer: 'brake',
    topic: 'Emergency vehicles',
    explanation: 'An ambulance with a siren comes from the right and is close to your path. It goes first. Brake and let it pass.',
  },
  {
    id: 'ambulance-passed', mission: 'emergency-vehicle', variation: 0, speed: 40, lead: 14, actorTime: 5, view: { lookBack: -20, lookSide: 9 }, answer: 'nothing',
    topic: 'Emergency vehicles',
    explanation: 'The ambulance has passed your path. Nothing else is in your way. Keep your speed and keep looking.',
  },
  {
    id: 'officer-stop-far', mission: 'priority-order', variation: 0, speed: 30, lead: 28, actorTime: 1, answer: 'release',
    topic: 'Officer instructions', ...OFFICER,
    explanation: 'The police officer shows stop and the light is green. The officer ranks first. Release the accelerator and be ready to stop.',
  },
  {
    id: 'officer-stop-close', mission: 'priority-order', variation: 0, speed: 40, lead: 20, actorTime: 1, answer: 'brake',
    topic: 'Officer instructions', ...OFFICER,
    explanation: 'The police officer shows stop. The instruction ranks above the green light. Brake and stop before the line.',
  },
  {
    id: 'officer-kerb', mission: 'priority-order', variation: 2, speed: 40, lead: 22, actorTime: 1, answer: 'nothing',
    topic: 'Officer instructions', ...OFFICER,
    explanation: 'The police officer stands at the kerb and shows nothing. The light is green. Keep your speed and keep looking.',
  },
  {
    id: 'officer-slow', mission: 'priority-order', variation: 1, speed: 22, lead: 26, actorTime: 1, answer: 'release',
    topic: 'Officer instructions', ...OFFICER,
    explanation: 'You drive slowly, but the police officer shows stop. The green light does not change this. Release the accelerator and stop.',
  },
];
