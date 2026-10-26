import { isLaneKind } from './lane-kind.js';
// The contextual action button (key F): Park in the parking lesson, Merge in the lessons that change lane, else none.
export const contextAction = mission => mission.id === 'parking' ? 'park' : isLaneKind(mission) && mission.lane.to !== undefined ? 'merge' : null;
