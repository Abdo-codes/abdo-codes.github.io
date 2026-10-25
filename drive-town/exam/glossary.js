// Dutch exam words: key -> { nl, en }. One English word for one Dutch term. Spell each as in the RVV or a CBR page.
// Each item shows its terms in an "Exam words" line.
const entries = [
  ['voorrang', 'voorrang', 'priority (right of way)'], ['voorrangsweg', 'voorrangsweg', 'priority road'], ['voorrangsvoertuig', 'voorrangsvoertuig', 'priority vehicle'],
  ['verleen voorrang', 'verleen voorrang', 'give way'], ['haaientanden', 'haaientanden', 'shark teeth'], ['rotonde', 'rotonde', 'roundabout'], ['zebrapad', 'zebrapad', 'zebra crossing'],
  ['kruispunt', 'kruispunt', 'junction'], ['bebouwde kom', 'bebouwde kom', 'built-up area'], ['invoegstrook', 'invoegstrook', 'acceleration lane'], ['rijstrook', 'rijstrook', 'lane'],
  ['inhalen', 'inhalen', 'overtake'], ['voorsorteren', 'voorsorteren', 'preselect'], ['fietspad', 'fietspad', 'cycle path'], ['fietsstrook', 'fietsstrook', 'cycle strip'],
  ['overweg', 'overweg', 'level crossing'], ['autosnelweg', 'autosnelweg', 'motorway'], ['autoweg', 'autoweg', 'road for motor vehicles'], ['bromfiets', 'bromfiets', 'moped'],
  ['snorfiets', 'snorfiets', 'light moped'], ['gevaarherkenning', 'gevaarherkenning', 'hazard perception'], ['verkeersbord', 'verkeersbord', 'traffic sign'],
  ['verkeerslicht', 'verkeerslicht', 'traffic light'], ['stopstreep', 'stopstreep', 'stop line'], ['doorgetrokken streep', 'doorgetrokken streep', 'solid line'],
  ['onderbroken streep', 'onderbroken streep', 'broken line'], ['uitrit', 'uitrit', 'driveway exit'], ['tram', 'tram', 'tram'], ['vluchtheuvel', 'vluchtheuvel', 'traffic island'],
  ['parkeerverbod', 'parkeerverbod', 'no parking'], ['stopverbod', 'stopverbod', 'no stopping'], ['maximumsnelheid', 'maximumsnelheid', 'maximum speed'],
  ['verkeersregelaar', 'verkeersregelaar', 'traffic controller'], ['aanwijzing', 'aanwijzing', 'instruction'], ['rijbewijs', 'rijbewijs', 'driving licence'],
  ['verzekering', 'verzekering', 'insurance'], ['kenteken', 'kenteken', 'registration number'], ['veiligheidsgordel', 'veiligheidsgordel', 'seat belt'],
  ['claxon', 'claxon', 'horn'], ['dimlicht', 'dimlicht', 'dipped headlights'], ['grootlicht', 'grootlicht', 'main beam'], ['mistlamp', 'mistlamp', 'fog lamp'],
  ['waarschuwingsknipperlichten', 'waarschuwingsknipperlichten', 'hazard warning lights'], ['remmen', 'Remmen', 'brake'], ['gas loslaten', 'Gas loslaten', 'release the accelerator'],
  ['ja', 'ja', 'yes'], ['nee', 'nee', 'no'],
  ['gevarendriehoek', 'gevarendriehoek', 'warning triangle'], ['ongeval', 'ongeval', 'accident'], ['kinderbeveiligingssysteem', 'kinderbeveiligingssysteem', 'child restraint system'],
  ['airbag', 'airbag', 'airbag'], ['achterlicht', 'achterlicht', 'rear light'], ['mistachterlicht', 'mistachterlicht', 'rear fog lamp'], ['slippen', 'slippen', 'skid'],
  ['rijhulpsysteem', 'rijhulpsysteem', 'driver assistance system'], ['cruisecontrole', 'cruisecontrole', 'cruise control'], ['antiblokkeersysteem', 'antiblokkeersysteem', 'anti-lock braking system (ABS)'],
  ['buitenspiegel', 'buitenspiegel', 'outside mirror'], ['slepen', 'slepen', 'tow'], ['aanhangwagen', 'aanhangwagen', 'trailer'], ['lading', 'lading', 'load'], ['profieldiepte', 'profieldiepte', 'tread depth'],
  ['promille', 'promille', 'per mille'], ['beginnend bestuurder', 'beginnend bestuurder', 'beginning driver'], ['nullimiet', 'nullimiet', 'zero limit'], ['medicijnen', 'medicijnen', 'medicines'],
  ['mobiel elektronisch apparaat', 'mobiel elektronisch apparaat', 'mobile electronic device'], ['afleiding', 'afleiding', 'distraction'], ['vermoeid', 'vermoeid', 'tired'],
  ['ruimtekussen', 'ruimtekussen', 'space cushion'], ['kwetsbare weggebruikers', 'kwetsbare weggebruikers', 'vulnerable road users'], ['milieubewust rijden', 'milieubewust rijden', 'environment-aware driving'],
  ['onnodig geluid', 'onnodig geluid', 'unnecessary noise'], ['apk', 'APK', 'vehicle test'], ['kentekenbewijs', 'kentekenbewijs', 'registration document'], ['wa-verzekering', 'WA-verzekering', 'liability insurance'],
  ['begeleiderspas', 'begeleiderspas', 'coach pass'], ['wegenverkeerswet', 'Wegenverkeerswet', 'Road Traffic Act'],
  // Chapter 05 and the lesson cards. RVV words: voorrang verlenen and invoegstrook (Article 1), voor laten gaan (Article 54), verdrijvingsvlak (Article 77), blokmarkering (Article 1).
  // ritsen is not in the RVV: it comes from the sub-signs of sign L5 and from CBR Rijprocedure B. Annex I names L5 "Einde rijstrook".
  ['voorrang verlenen', 'voorrang verlenen', 'give way'], ['voor laten gaan', 'voor laten gaan', 'let go first'], ['ritsen', 'ritsen', 'zipper merge'], ['invoegen', 'invoegen', 'merge'],
  ['blokmarkering', 'blokmarkering', 'block marking'], ['verdrijvingsvlak', 'verdrijvingsvlak', 'hatched area'], ['einde rijstrook', 'einde rijstrook', 'end of lane'],
  ['vluchtstrook', 'vluchtstrook', 'hard shoulder'], ['volgafstand', 'volgafstand', 'following distance'], ['richtingaanwijzer', 'richtingaanwijzer', 'indicator'],
  ['afslaan', 'afslaan', 'turn'], ['parkeerhaven', 'parkeerhaven', 'parking bay'], ['bushalte', 'bushalte', 'bus stop'], ['tegemoetkomende bestuurders', 'tegemoetkomende bestuurders', 'oncoming drivers'],
  // The term of each sign in sign-data.js. An item never lists the term of its own sign.
  ['adviessnelheid', 'adviessnelheid', 'advised speed'], ['einde voorrangsweg', 'einde voorrangsweg', 'end of priority road'], ['stop', 'stop', 'stop and give way'],
  ['gesloten voor voertuigen', 'gesloten voor voertuigen', 'closed to vehicles'], ['gesloten in deze richting', 'gesloten in deze richting', 'closed in this direction'],
  ['gesloten voor motorvoertuigen', 'gesloten voor motorvoertuigen', 'closed to motor vehicles'], ['gesloten voor fietsen', 'gesloten voor fietsen', 'closed to bicycles'],
  ['gesloten voor voetgangers', 'gesloten voor voetgangers', 'closed to pedestrians'], ['voorrang op tegenliggers', 'voorrang op tegenliggers', 'priority over oncoming traffic'],
  ['verplicht fietspad', 'verplicht fietspad', 'mandatory cycle path'], ['onverplicht fietspad', 'onverplicht fietspad', 'optional cycle path'], ['rijbaanversmalling', 'rijbaanversmalling', 'road narrows'],
  ['voetgangersoversteekplaats', 'voetgangersoversteekplaats', 'pedestrian crossing'], ['fietsers en bromfietsers', 'fietsers en bromfietsers', 'cyclists and moped riders'],
  ['inhaalverbod', 'inhaalverbod', 'overtaking ban'], ['einde inhaalverbod', 'einde inhaalverbod', 'end of overtaking ban'],
  // Chapter 06. All four words are in the RVV text (geel licht, rood licht, tweetonige hoorn in Articles 1, 29 and 68; rangorde in Article 84).
  ['geel licht', 'geel licht', 'amber light'], ['rood licht', 'rood licht', 'red light'], ['tweetonige hoorn', 'tweetonige hoorn', 'two-tone horn'], ['rangorde', 'rangorde', 'order of rank'],
  // Chapter 07. tramhalte is spelled as in the text of sign L3 ("Bushalte / tramhalte", Annex I). rechts houden is the wording of Article 3 paragraph 1 ("zoveel mogelijk rechts te houden").
  // gehandicaptenvoertuig is the word of Article 10 paragraph 2.
  ['tramhalte', 'tramhalte', 'tram stop'], ['rechts houden', 'rechts houden', 'keep right'], ['gehandicaptenvoertuig', 'gehandicaptenvoertuig', 'disabled-person vehicle'],
];
export const GLOSSARY = Object.fromEntries(entries.map(([key, nl, en]) => [key, { nl, en }]));
