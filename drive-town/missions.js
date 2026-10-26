import gentleStart from './missions/gentle-start.js';
import rightOfWay from './missions/right-of-way.js';
import zebra from './missions/zebra.js';
import cyclist from './missions/cyclist.js';
import parking from './missions/parking.js';
import trafficLight from './missions/traffic-light.js';
import stopSign from './missions/stop-sign.js';
import yieldSign from './missions/yield-sign.js';
import changingLimit from './missions/changing-limit.js';
import departingBus from './missions/departing-bus.js';
import narrowPassage from './missions/narrow-passage.js';
import railwayCrossing from './missions/railway-crossing.js';
import roundaboutEntry from './missions/roundabout-entry.js';
import roundaboutExit from './missions/roundabout-exit.js';
import roundaboutCyclist from './missions/roundabout-cyclist.js';
import zipperMerge from './missions/zipper-merge.js';
import accelerationLane from './missions/acceleration-lane.js';
import roomToMerge from './missions/room-to-merge.js';
import amberLight from './missions/amber-light.js';
import emergencyVehicle from './missions/emergency-vehicle.js';
import priorityOrder from './missions/priority-order.js';
import tramStreet from './missions/tram-street.js';
import cycleLane from './missions/cycle-lane.js';
import overtaking from './missions/overtaking.js';

// Lesson order. Chapters group these by index (chapters.js); each file holds one mission and its rule questions.
export const MISSIONS = [
  gentleStart, rightOfWay, zebra, cyclist, parking,
  trafficLight, stopSign, yieldSign, changingLimit,
  departingBus, narrowPassage, railwayCrossing,
  roundaboutEntry, roundaboutExit, roundaboutCyclist,
  zipperMerge, accelerationLane, roomToMerge,
  amberLight, emergencyVehicle, priorityOrder,
  tramStreet, cycleLane, overtaking,
];
export const SHARING_MISSIONS = MISSIONS.filter(mission => ['bus', 'narrow', 'rail'].includes(mission.kind));

export const FEEDBACK = {
  speed: { title: 'A little too quick', body: 'The signs here say 30 km/h. Ease off, use the brake, and tap Drive for a calmer 22 km/h pace.' },
  yield: { title: 'Give them a little space', body: 'Your path was still occupied. Slow down before the conflict point and let the other road user clear it.' },
  signal: { title: 'Let people know your plan', body: 'Use the right indicator before starting the turn or parking manoeuvre. Select the Right indicator control, then check that the path is safe.' },
  bay: { title: 'You passed the bakery bay.', body: 'Choose Try again to restart this lesson. On the next approach, brake beside the marked bay, wait for a clear entrance, and select Park.' },
  'red-light': { title: 'Red means wait', body: 'You crossed the stop line while the light was red. Stop before the white line, then continue on green when the road is clear.' },
  'amber-run': { title: 'Amber means stop', body: 'The light was amber and you could stop in a safe way. Stop before the white line. Go on only when you are too close to stop.' },
  'siren-yield': { title: 'The ambulance goes first', body: 'You crossed the line while the ambulance was still coming. All road users let a priority vehicle go first. Article 50 names no exception for a green light.' },
  'officer-ignored': { title: 'The officer ranks first', body: 'A police officer showed stop and you crossed the line. An instruction from an officer ranks above a traffic light (Article 84).' },
  stop: { title: 'That needed a full stop', body: 'A STOP sign requires a complete stop before the white line. A rolling crawl, or a stop far from the line, does not complete this step. Then give way to the crossing road.' },
};
