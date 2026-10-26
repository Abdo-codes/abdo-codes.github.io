import { yn, mc, multi, fill, hot, ord } from './make.js';

// Topic 5, Verkeerstekens en aanwijzingen: priority, speed, prohibition, command and warning signs, lights, markings and instructions. 26 items, sorted by subtopic.
// Items with `sign` show the sign above the prompt, or a sign in each choice. The text never names it. Scene items (7) use the picture at the freeze frame.
// Sign ids come from the annex of the RVV. `A1-60` and `A4-40` are the A1 and A4 sign with a number. The sign data (exam/sign-data.js) must hold every id used here.
const T = 'signs';
export default [
  // Priority signs (chapter B; Article 15, 62, 63, 79)
  mc('sign-01', T, 'You drive on a priority road and see this sign. What changes at the next junction?',
    ['You keep your priority at the next junction', 'You lose your priority at the next junction', 'You must stop at the next junction'], 1,
    { sign: 'B2', explanation: 'This sign shows that the priority road ends. After it, traffic from the right goes first, unless a sign says otherwise (Article 15).', source: ['rvv-annex-b', 'rvv-15'], terms: ['voorrang'] }),
  mc('sign-02', T, 'Which sign tells you that you have priority at the next junctions?',
    [{ sign: 'B6' }, { sign: 'B1' }, { sign: 'B7' }], 1,
    { explanation: 'The priority road sign gives you priority at junctions. The other two signs tell you to give way, and one of them also tells you to stop.', source: ['rvv-annex-b', 'rvv-62'], terms: ['voorrang'] }),
  mc('sign-03', T, 'You reach this sign and a white line across the road. The crossing road is empty. What must you do?',
    ['Stop only if a car comes', 'Slow down and go on if it is clear', 'Stop at the line first, then go on'], 2,
    { sign: 'B7', cluster: 'stop-sign', explanation: 'This sign orders you to stop at the line, even when the crossing road is empty. After you stop, give way to crossing traffic.',
      source: ['rvv-annex-b', 'rvv-79', 'rvv-62'], terms: ['stopstreep'], mission: 'stop-sign' }),

  // Speed, prohibition and command signs (chapters A, C, F)
  fill('sign-04', T, 'This sign stands on an ordinary road outside a built-up area. What is the highest speed you may drive here?', 'km/h', 60,
    { sign: 'A1-60', explanation: 'The sign sets the highest speed. It replaces the usual limit of 80 km/h for this kind of road (Article 21).', source: ['rvv-annex-a', 'rvv-21'], terms: ['bebouwde kom'], mission: 'changing-limit' }),
  yn('sign-05', T, 'This sign stands before a narrow part of the road. A car comes towards you. Must that car give way to you?', true,
    { sign: 'F6', cluster: 'narrow-passage', explanation: 'This sign gives you priority. The driver who comes towards you must let you go first.', source: ['rvv-annex-f', 'rvv-62'], terms: ['voorrang'], mission: 'narrow-passage' }),
  mc('sign-06', T, 'What does the number on this sign tell you?',
    ['The speed that is advised here', 'The highest speed you may drive here', 'The lowest speed you must drive here'], 0,
    { sign: 'A4-40', explanation: 'This sign gives advice. It is not a command or a ban, so the number is not a limit. Drive at a speed that suits the road.', source: ['rvv-annex-a', 'rvv-62'], terms: ['maximumsnelheid'] }),
  multi('sign-07', T, 'Which signs forbid you to drive into this street with your car?',
    [{ sign: 'C14' }, { sign: 'C1' }, { sign: 'C16' }, { sign: 'C6' }, { sign: 'C2' }], [1, 3, 4],
    { explanation: 'Three signs close the street to your car. They close it to all vehicles, to motor vehicles on more than two wheels, and to traffic that comes the wrong way. The other two signs close it to cyclists or to people on foot.',
      source: ['rvv-annex-c', 'rvv-62'] }),

  // Mandatory direction and cycle path signs (chapters D, G; Article 5, 10)
  mc('sign-08', T, 'What does this sign tell all drivers?',
    ['To give way to traffic from the right', 'To follow the arrows round the island', 'To stop before you enter the island'], 1,
    { sign: 'D1', explanation: 'The sign marks a roundabout. All drivers must drive round the island in the direction of the arrows.', source: ['rvv-annex-d', 'rvv-62'] }),
  mc('sign-09', T, 'You drive a car. A path next to the road starts at this sign. Where do you drive?',
    ['On the path, when the road is busy', 'On the path, at low speed', 'On the road, not on the path'], 2,
    { sign: 'G11', explanation: 'This sign marks a mandatory cycle path. Cyclists must use it. Drivers of cars use the road (Article 10).', source: ['rvv-annex-g', 'rvv-5', 'rvv-10'], terms: ['fietspad'] }),
  mc('sign-10', T, 'This sign stands at a path beside the road. Where may a cyclist ride?',
    ['Only on the path, never on the road', 'Only on the road, never on the path', 'On the path or on the road'], 2,
    { sign: 'G13', explanation: 'This sign marks a cycle path that is not mandatory. A cyclist may use the path and may also ride on the road (Article 5).', source: ['rvv-annex-g', 'rvv-5'], terms: ['fietspad'] }),

  // Warning signs (chapter J) and the sign of a crossing (chapter L)
  mc('sign-11', T, 'What does this sign warn you about?',
    ['A level crossing with barriers', 'A bridge that can open and close', 'A place where trams cross the road'], 0,
    { sign: 'J10', cluster: 'railway-crossing', explanation: 'The sign warns of a level crossing with barriers. At a level crossing, a train always goes first.', source: ['rvv-annex-j', 'rvv-15a'] }),
  mc('sign-12', T, 'You see this sign. What can you expect on the road ahead?',
    ['The road bends to the right', 'The road goes steeply downhill', 'The road becomes narrower'], 2,
    { sign: 'J17', explanation: 'The sign warns that the road becomes narrower. Look for oncoming traffic and be ready to slow down.', source: ['rvv-annex-j'] }),
  multi('sign-13', T, 'Which signs warn you about people on foot or on a bike who may cross the road?',
    [{ sign: 'J14' }, { sign: 'J22' }, { sign: 'J9' }, { sign: 'J24' }], [1, 3],
    { explanation: 'One sign warns of a place where people on foot cross. One warns of cyclists and moped riders. The other two warn of trams and of a roundabout.', source: ['rvv-annex-j'] }),
  mc('sign-14', T, 'You approach this sign. A pedestrian stands at the kerb, ready to cross. What do you do?',
    ['Let the pedestrian cross first', 'Sound your horn and drive on', 'Drive on, because the pedestrian is not on the crossing yet'], 0,
    { sign: 'L2', cluster: 'zebra', explanation: 'The sign marks a pedestrian crossing. You must let people go first when they cross, or when they are about to cross (Article 49).',
      source: ['rvv-annex-l', 'rvv-49'], terms: ['zebrapad'], mission: 'zebra' }),

  // Traffic lights (Article 68) and markings (Article 77)
  mc('sign-15', T, 'A traffic light turns amber. You are far enough away to stop in a reasonable way. What do you do?',
    ['Speed up and cross before it turns red', 'Go on, because amber means go', 'Stop before the stop line'], 2,
    { cluster: 'traffic-light', explanation: 'Amber means stop. Go on only when you are so close that you can no longer stop in a reasonable way (Article 68).', source: ['rvv-68', 'rvv-79'], terms: ['verkeerslicht', 'stopstreep'], mission: 'traffic-light' }),
  yn('sign-16', T, 'The traffic light for your lane shows only a green arrow to the right. You want to drive straight on. May you go?', false,
    { explanation: 'A lit arrow makes the light valid only for the direction of the arrow (Article 68). Traffic that goes straight on has no green light and must wait.', source: ['rvv-68'], terms: ['verkeerslicht'] }),
  yn('sign-17', T, 'Diagonal white stripes are painted on a part of the road. May you drive on that part to pass a slow car?', false,
    { explanation: 'You may not drive on an area with diagonal stripes, also not to pass a slow car (Article 77). Only a few special lanes are an exception.', source: ['rvv-77'] }),

  // Scene items (7): the picture stops at the key moment
  mc('sign-18', T, 'You drive towards this traffic light. What do you do?',
    ['Keep your speed and cross before it changes', 'Brake and stop before the stop line', 'Release the accelerator and drive through slowly'], 1,
    { scene: 'red-light-close', action: 'brake', mission: 'traffic-light', explanation: 'The light is red and the stop line is close. Red means stop, so you brake now and stop before the line (Article 68).',
      source: ['rvv-68', 'rvv-79'], terms: ['verkeerslicht', 'stopstreep'] }),
  mc('sign-19', T, 'You drive towards this level crossing. What do you do?',
    ['Stop before the barrier and wait', 'Cross quickly, before the train arrives', 'Slow down and cross if you see no train'], 0,
    { scene: 'railway-red', action: 'brake', mission: 'railway-crossing', explanation: 'Flashing red lights mean stop (Article 71). Wait until the lights are off and the barriers are fully open, because a second train can follow.',
      source: ['rvv-71', 'rvv-15a', 'prorail-overwegen'], terms: ['overweg'] }),
  yn('sign-20', T, 'The light is green and the junction ahead is clear. You keep your speed. Is this right?', true,
    { scene: 'green-light', action: 'nothing', mission: 'traffic-light', explanation: 'Green means go on (Article 68). The junction is clear, so you do not block it (Article 14). Do not brake without a reason.',
      source: ['rvv-68', 'rvv-14'], terms: ['verkeerslicht', 'kruispunt'] }),
  hot('sign-21', T, 'Tap the sign that tells you to stop.', 'stop-sign', 'sign',
    { pictureOnly: true, mission: 'stop-sign', explanation: 'The red sign on the right orders you to stop at the line. After the stop, you give way to the car on the crossing road.',
      source: ['rvv-annex-b', 'rvv-79'], terms: ['stopstreep'] }),
  hot('sign-22', T, 'Tap the road marking that tells you to give way to the crossing road.', 'yield-car-left', 'teeth',
    { pictureOnly: true, mission: 'yield-sign', explanation: 'Shark teeth tell you to give way to traffic on the crossing road (Article 80). The triangular sign tells you the same.',
      source: ['rvv-80', 'rvv-annex-b'], terms: ['haaientanden'] }),
  hot('sign-23', T, 'Tap the sign that marks the roundabout.', 'roundabout-approach', 'roundabout',
    { pictureOnly: true, mission: 'roundabout-entry', explanation: 'The round blue sign with arrows marks the roundabout. The triangular sign tells you to give way to traffic on it.',
      source: ['rvv-annex-d', 'rvv-annex-b'], terms: ['rotonde'] }),
  hot('sign-24', T, 'Tap the sign that gives the oncoming car priority.', 'narrowing-oncoming', 'sign',
    { pictureOnly: true, mission: 'narrow-passage', explanation: 'This sign forbids you to go on when traffic from the other side comes. You wait before the narrow part until the oncoming car has passed.',
      source: ['rvv-annex-f', 'rvv-62'], terms: ['voorrang'] }),

  // Instructions and ranking (Article 63, 64, 82, 84). Labelled text order items, not a CBR type.
  ord('sign-25', T, 'Put these in the order you must follow them. Start with the one that ranks highest.', [0, 1, 2, 3],
    { choices: ['An instruction from a police officer', 'A traffic light', 'A sign that gives priority', 'The rule that traffic from the right goes first'], notCbr: true, cluster: 'rank-order',
      explanation: 'An instruction from an officer ranks above all signs and rules (Article 84). A traffic light ranks above a sign that gives priority (Article 64). A sign ranks above a general rule (Article 63).',
      source: ['rvv-84', 'rvv-64', 'rvv-63'], terms: ['aanwijzing', 'verkeerslicht'] }),
  ord('sign-26', T, 'Four things can tell you who goes first. Put them in order, starting with the one that you obey before all the others.', [0, 1, 2, 3],
    { choices: ['The hand signals of a traffic controller', 'The colours of the traffic light', 'The priority sign beside the road', 'The rule to give way to traffic from the right'], notCbr: true, cluster: 'rank-order',
      explanation: 'A traffic controller gives instructions, and these rank first (Articles 82 and 84). A light ranks above a priority sign. A sign ranks above the general rule.',
      source: ['rvv-82', 'rvv-84', 'rvv-64', 'rvv-63'], terms: ['verkeersregelaar', 'voorrang'] }),
];
