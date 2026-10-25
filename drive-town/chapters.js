export const CHAPTERS = [
  { id: 'bakery-run', name: 'Bakery run', number: '01', indices: [0, 1, 2, 3, 4],
    heading: 'Good habits.<br> Great journeys.', intro: 'Five small missions. A whole new way to see the road.',
    ready: 'Let’s take<br>the scenic route.', description: 'A little trip to the bakery. A few people to look out for. And a road full of things to learn.',
    summary: 'Speed, priority, crossings, cyclists and parking. Keep building on these habits with the next chapter.' },
  { id: 'signs-signals', name: 'Signs & signals', number: '02', indices: [5, 6, 7, 8],
    heading: 'Read the signs.<br> Choose your moment.', intro: 'Four more missions: lights, STOP, yield and changing limits.',
    ready: 'Let the signs<br>guide you.', description: 'Leave the bakery for a new loop around town. Practise lights, STOP, signed priority and a quieter 30 street.',
    summary: 'Lights, STOP, signed priority and a changing limit. Take these habits into a new chapter about sharing the road.' },
  { id: 'sharing-road', name: 'Sharing the road', number: '03', indices: [9, 10, 11],
    heading: 'Make room.<br> Read the whole road.', intro: 'Three new missions: buses, narrow passages and railway crossings.',
    ready: 'A little room<br>goes a long way.', description: 'Let a bus pull away, share a narrow road, and wait safely at the railway. Three new reasons to look ahead.',
    summary: 'Buses leaving stops, oncoming priority and railway crossings. Take these habits to the roundabouts.' },
  { id: 'roundabouts', name: 'Roundabouts', number: '04', indices: [12, 13, 14],
    heading: 'Round and round.<br> Signal your way out.', intro: 'Three new missions: entering, leaving and cyclists on the cycle path.',
    ready: 'Give way, go round,<br>signal out.', description: 'Two roundabouts on the edge of town. Give way on entry, signal before you leave, and watch the cycle path.',
    summary: 'Priority on entry, signalling on exit and cyclists around the roundabout. Keep reading the signs at every roundabout you meet.' },
  { id: 'merging', name: 'Merging', number: '05', indices: [15, 16, 17],
    heading: 'Take turns.<br> Join with care.', intro: 'Three new missions: a lane that ends, an acceleration lane and making room.',
    ready: 'Wait for a gap.<br>Letting one in is courtesy.', description: 'Three roads outside town. Merge where a lane ends, join a faster road, and make room for a driver who needs it.',
    summary: 'Waiting for a gap, signalling and making room. Check your mirrors and the gaps on every road.' },
  { id: 'lights-sirens', name: 'Lights & sirens', number: '06', indices: [18, 19, 20],
    heading: 'Look and listen.<br> Then decide.', intro: 'Three new missions: an amber light, an ambulance and a police officer.',
    ready: 'Eyes up.<br>Ears open.', description: 'Back in town, with more to see and hear. Judge an amber light, make way for an ambulance and obey an officer.',
    summary: 'Amber lights, emergency vehicles and officers. Look and listen at every junction.' },
  { id: 'trams-bikes-overtaking', name: 'Trams & bikes', number: '07', indices: [21, 22, 23],
    heading: 'Share the street.<br> Pass with care.', intro: 'Three new missions: a tram stop, a cycle strip and overtaking.',
    ready: 'Look first.<br>Pass only when it is safe.', description: 'A street with tram tracks, a cycle strip with a parked van, and a country road where passing is allowed in one place and not in another.',
    summary: 'Passengers, trams, cyclists and a safe pass. Check the road ahead before every move.' },
];
export const chapterFor = missionIndex => CHAPTERS.find(chapter => chapter.indices.includes(missionIndex)) ?? CHAPTERS[0];

const KEY = 'drive-town-chapter-v1';
export function loadChapter(storage) {
  try { const id = storage.getItem(KEY); return Math.max(0, CHAPTERS.findIndex(chapter => chapter.id === id)); }
  catch { return 0; }
}
export function saveChapter(storage, index) {
  try { storage?.setItem(KEY, CHAPTERS[index].id); } catch { /* Chapter selection remains available for this session. */ }
}
