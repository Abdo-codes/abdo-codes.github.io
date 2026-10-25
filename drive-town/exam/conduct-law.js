import { yn, mc, multi, fill } from './make.js';

// Topic 6 (responsible, K+) and topic 7 (law, K). Text items only. Original wording, written from the RVV, CBR Rijprocedure B and official government pages.
// Ids are law-01 to law-22. Law-01 to law-14 are topic 6, law-15 to law-22 are topic 7. A figure in an item comes from the source named in `source`.
export default [
  // Alcohol, drugs and medicines (responsible)
  mc('law-01', 'responsible', 'Your car licence is your first licence and is 2 years old. What is the highest alcohol level you may have when you drive?', ['0.5 per mille', '0.2 per mille', '0.8 per mille'], 1,
    { explanation: 'A beginning driver may have 0.2 per mille of alcohol in the blood at most. You are a beginning driver for 5 years after a first car licence.', source: 'rijksoverheid-alcohol', terms: ['promille', 'beginnend bestuurder'], cluster: 'beginner-driver' }),
  yn('law-02', 'responsible', 'You used a drug and you drank alcohol. You may still drive if both amounts were small.', false,
    { explanation: 'When you combine drugs and alcohol, a zero limit applies. The amount does not matter.', source: 'rijksoverheid-drugs', terms: ['nullimiet'] }),
  mc('law-03', 'responsible', 'Your doctor gives you a medicine. The leaflet says it can make you sleepy. What do you do before you drive?',
    ['Drive, but only on quiet roads near your home', 'Take less of the medicine and tell nobody', 'Ask your doctor or pharmacist first'], 2,
    { explanation: 'Some medicines make driving dangerous. Ask your doctor or pharmacist whether you may drive with the medicine that you use.', source: 'rijksoverheid-medicines', terms: ['medicijnen'] }),

  // Phone and distraction (responsible)
  yn('law-04', 'responsible', 'The ban on holding a mobile device while you drive also covers a tablet and a media player.', true,
    { explanation: 'Article 61a forbids holding a mobile electronic device while you drive. The article names a mobile phone, a tablet and a media player.', source: 'rvv-61a', terms: ['mobiel elektronisch apparaat'] }),
  mc('law-05', 'responsible', 'Your phone rings while you drive. What is the best thing to do?',
    ['Let it ring and call back after you stop', 'Hold it in your hand to see who is calling', 'Pick it up and keep the call very short'], 0,
    { explanation: 'Do not hold a phone while you drive. A call or a screen also takes your attention away from the road.', source: ['rvv-61a', 'cbr-rijprocedure-b'], terms: ['afleiding'] }),
  mc('law-06', 'responsible', 'A passenger asks you to look at a photo on a phone while you drive. What do you do?',
    ['Look quickly when the road ahead is empty', 'Look at it only when you drive slowly', 'Say no and keep your eyes on the road'], 2,
    { explanation: 'Do not let a passenger, the radio or a phone distract you. Keep your attention on the road.', source: 'cbr-rijprocedure-b', terms: ['afleiding'] }),

  // Tiredness, distance and weather (responsible)
  mc('law-07', 'responsible', 'You feel very tired and you have a long trip to make. What is the best choice?',
    ['Start now and stop only if you get more tired', 'Rest first and start the trip later', 'Start now and open a window for fresh air'], 1,
    { explanation: 'Do not begin a trip when you are tired. Rest first, and plan enough time for a long drive.', source: 'cbr-rijprocedure-b', terms: ['vermoeid'] }),
  mc('law-08', 'responsible', 'Why is a good distance to the car in front important?',
    ['You can read its number plate more easily', 'Other drivers then cannot pass you', 'It gives you time and space to react if it brakes'], 2,
    { explanation: 'Too little distance to the car in front often leads to accidents. A good space cushion gives you time to react. You must always be able to stop within the distance that you can see to be clear.',
      source: ['rvv-19', 'cbr-rijprocedure-b'], terms: ['remmen', 'ruimtekussen'] }),
  mc('law-09', 'responsible', 'Heavy rain makes the road wet and your view poor. What do you adapt?',
    ['Your speed, to the view you have', 'Only the speed of your windscreen wipers', 'Nothing, if you stay below the speed limit'], 0,
    { explanation: 'Adapt your speed to the road, the weather and the traffic. In rain you see less and you need more room to stop. The maximum speed is a limit, not a target.', source: ['rvv-19', 'cbr-rijprocedure-b'], terms: ['maximumsnelheid'] }),

  // Vulnerable road users, social behaviour and noise (responsible)
  multi('law-10', 'responsible', 'Which road users need extra care from you because they run more risk?',
    ['A child who plays near the road', 'An older person who crosses slowly', 'A blind person who walks with a stick', 'A lorry driver on the motorway', 'A driver who sits in a parked car'], [0, 1, 2],
    { explanation: 'Children, older people and blind people run more risk in traffic. Expect the unexpected from them and give them room.', source: 'cbr-rijprocedure-b', terms: ['kwetsbare weggebruikers'] }),
  yn('law-11', 'responsible', 'You may sound your horn at a slow driver in front of you to make that driver hurry.', false,
    { explanation: 'Article 28 allows sound signals and flashing signals only to avert danger. Wanting a driver to hurry is not a reason to use the horn.', source: ['rvv-28', 'cbr-rijprocedure-b'], terms: ['claxon'] }),
  mc('law-12', 'responsible', 'You drive through a quiet street with houses. What must you avoid with your vehicle?',
    ['Looking carefully in your mirrors', 'Noise that you do not need', 'Using your indicator before a turn'], 1,
    { explanation: 'Article 57 forbids unnecessary noise from a motor vehicle. Revving the engine for no reason is an example.', source: 'rvv-57', terms: ['onnodig geluid'] }),

  // Economical and environment-aware driving (responsible)
  multi('law-13', 'responsible', 'Which actions help you to save fuel while you drive?',
    ['Release the accelerator early when you must slow down', 'Keep a steady speed when the traffic allows it', 'Check the tyre pressure every month', 'Keep a roof box on the car all year', 'Let the engine run during a long stop'], [0, 1, 2],
    { explanation: 'Release the accelerator early. The engine then takes no fuel while the car rolls in gear. A steady speed and the right tyre pressure also save fuel.', source: 'cbr-rijprocedure-b', terms: ['gas loslaten', 'milieubewust rijden'] }),
  multi('law-14', 'responsible', 'Which choices before a trip are good for the environment?',
    ['Plan the trip outside the busiest hours', 'Remove luggage that you do not need', 'Check if you can share the ride', 'Keep the air conditioning on all the time'], [0, 1, 2],
    { explanation: 'Less queueing, less weight and fewer cars on the road lower the load on the environment. Do not use the air conditioning when you do not need it.', source: 'cbr-rijprocedure-b', terms: ['milieubewust rijden'] }),

  // Licence, insurance, car papers and the vehicle test (law)
  yn('law-15', 'law', 'An officer asks to see your driving licence. A copy of the licence is enough.', false,
    { explanation: 'You must carry your original driving licence when you drive a car. A copy is not valid.', source: 'rijksoverheid-licence', terms: ['rijbewijs'] }),
  yn('law-16', 'law', 'A car that is registered in your name needs at least a liability insurance (WA).', true,
    { explanation: 'The Wam says that you need a WA insurance for a car in your name. A WA insurance pays for damage that you cause to other people.', source: 'rijksoverheid-car-insurance', terms: ['verzekering', 'wa-verzekering'] }),
  fill('law-17', 'law', 'Your first licence is a car licence. For how many years are you a beginning driver?', 'years', 5,
    { explanation: 'After a first car licence you are a beginning driver for 5 years. A stricter alcohol limit applies in this time.', source: 'rijksoverheid-alcohol', terms: ['beginnend bestuurder', 'rijbewijs'], cluster: 'beginner-driver' }),
  fill('law-18', 'law', 'A new petrol car must go to its first APK (vehicle test). How old is the car then?', 'years', 4,
    { explanation: 'A petrol or electric car goes to its first APK at 4 years old. After that it goes at 6 and 8 years, and then every year. A diesel car goes at 3 years old and then every year.', source: 'rdw-apk', terms: ['apk'] }),
  mc('law-19', 'law', 'Besides your driving licence, which vehicle document must you carry when you drive?',
    ['The registration card (kentekencard)', 'The invoice that you got when you bought the car', 'The manual with the maintenance list of the car'], 0,
    { explanation: 'Carry the kentekencard or the paper kentekenbewijs when you drive. It shows the registration of the vehicle.', source: 'rijksoverheid-registration-card', terms: ['kenteken', 'kentekenbewijs'] }),

  // Accidents, young drivers and the general rule (law)
  mc('law-20', 'law', 'You have a small accident. Nobody is hurt and the other driver is there. What must you do before you leave?',
    ['Leave, as the damage is small', 'Wait for the police in every case', 'Give your details to the other driver'], 2,
    { explanation: 'Never leave the scene without giving your details to the other party. This is an offence, also after a small accident. If someone is hurt, call 112.', source: ['politie-accident', 'wvw-7'], terms: ['ongeval'] }),
  mc('law-21', 'law', 'A young driver drives with a coach. Which documents must the young driver carry?',
    ['The driving licence and nothing else', 'The licence and the begeleiderspas', 'The begeleiderspas and nothing else'], 1,
    { explanation: 'The young driver must have the coach, the driving licence and the begeleiderspas on the road. The coach must also carry a valid driving licence.', source: 'rdw-coach', terms: ['begeleiderspas', 'rijbewijs'] }),
  mc('law-22', 'law', 'You break no single traffic rule, but your behaviour puts other road users at risk. What is true?',
    ['A general rule against danger still applies', 'You commit no offence, because you broke no single rule', 'The risk matters only if it leads to an accident'], 0,
    { explanation: 'Article 5 of the Wegenverkeerswet forbids behaviour that causes danger, or can cause danger, on the road. No accident has to happen.', source: 'wvw-5', terms: ['wegenverkeerswet'] }),
];
