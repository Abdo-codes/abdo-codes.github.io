// The 8 CBR topics (CBR page theorie-examenplan-auto). Only the Dutch titles and the levels come from CBR.
// CBR gives no question counts: `quota` and `animQuota` are a Drive Town mix. K+ is a decision in a traffic situation, K is knowledge.
export const TOPICS = [
  { id: 'road-use', nl: 'Gebruik van de weg', en: 'Road use', level: 'K+', quota: 9, animQuota: 1, file: 'road-use.js' },
  { id: 'priority', nl: 'Voorrang en voor laten gaan', en: 'Priority', level: 'K+', quota: 10, animQuota: 3, file: 'priority.js' },
  { id: 'special-roads', nl: 'Bijzondere wegen, weggedeelten, weggebruikers en manoeuvres', en: 'Special roads and manoeuvres', level: 'K+', quota: 6, animQuota: 2, file: 'special-roads.js' },
  { id: 'safe-driving', nl: 'Veilig rijden met het voertuig en reageren in noodsituaties', en: 'Safe driving and emergencies', level: 'K+', quota: 5, animQuota: 0, file: 'vehicle-safety.js' },
  { id: 'signs', nl: 'Verkeerstekens en aanwijzingen', en: 'Signs and instructions', level: 'K+', quota: 9, animQuota: 2, file: 'signs.js' },
  { id: 'responsible', nl: 'Verantwoorde verkeersdeelname en milieubewust rijden', en: 'Responsible and economical driving', level: 'K+', quota: 5, animQuota: 0, file: 'conduct-law.js' },
  { id: 'law', nl: 'Wetgeving', en: 'Law', level: 'K', quota: 3, animQuota: 0, file: 'conduct-law.js' },
  { id: 'vehicle', nl: 'Voertuigkennis', en: 'Vehicle knowledge', level: 'K', quota: 3, animQuota: 0, file: 'vehicle-safety.js' },
];
export const TOPIC_IDS = TOPICS.map(topic => topic.id);
export const topicById = Object.fromEntries(TOPICS.map(topic => [topic.id, topic]));
export const TOTAL_QUOTA = TOPICS.reduce((sum, topic) => sum + topic.quota, 0);

// The one map from lesson (mission id) to exam topic. Chapter 05 Merging adds its three lessons to special-roads.
export const MISSION_TOPIC = {
  'gentle-start': 'road-use', parking: 'road-use', 'changing-limit': 'road-use',
  'right-of-way': 'priority', zebra: 'priority', cyclist: 'priority', 'stop-sign': 'priority', 'yield-sign': 'priority', 'departing-bus': 'priority', 'narrow-passage': 'priority',
  'railway-crossing': 'special-roads', 'roundabout-entry': 'special-roads', 'roundabout-exit': 'special-roads', 'roundabout-cyclist': 'special-roads',
  'zipper-merge': 'special-roads', 'acceleration-lane': 'special-roads', 'room-to-merge': 'special-roads',
  'traffic-light': 'signs',
  // Chapter 06. The siren lesson is a priority lesson; the amber light and the officer are signs and instructions.
  'amber-light': 'signs', 'emergency-vehicle': 'priority', 'priority-order': 'signs',
  // Chapter 07. Trams and passengers are priority; the cycle strip and overtaking are road use.
  'tram-street': 'priority', 'cycle-lane': 'road-use', overtaking: 'road-use',
};
export const topicOfMission = id => MISSION_TOPIC[id] ?? null;
export const lessonsOf = topic => Object.keys(MISSION_TOPIC).filter(id => MISSION_TOPIC[id] === topic);
