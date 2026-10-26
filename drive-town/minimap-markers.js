// Markers of the minimap: one per lesson of the chapter, labelled with its place in the chapter. `route` is the route id,
// so the minimap draws only the markers of the road on show (the three merge roads each show one marker).
export const markersFor = (chapter, missions) => chapter.indices.map((index, place) => ({ index, route: missions[index].route ?? 'town', label: place + 1 }));
