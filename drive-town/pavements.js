import { box, cylinder } from './art.js';
import { textured } from './surfaces.js';

function paving(parent, width, depth, x, z, top = .27) {
  return textured(box(parent, width, .18, depth, x, top - .09, z, '#bdbbb3', false), 'paving', '#bdbbb3');
}
function horizontal(parent, z, gaps = []) {
  let left = -33;
  for (const [start, end] of [...gaps, [33, 33]]) {
    if (start > left) paving(parent, start - left, 1.3, (start + left) / 2, z);
    left = end;
  }
}
export function createPavements(town, firstChapter) {
  horizontal(town, -31.65, [[-32.4, -29.2]]);
  horizontal(town, -20.35, [[-33, -21], [6, 16]]);
  // The incoming priority road crosses this corner in chapter two.
  paving(firstChapter, .6, 1.3, -32.7, -20.35);
  paving(firstChapter, 8.2, 1.3, -25.1, -20.35);
  // The inner north pavement makes way for the bus bay (bus-bay.js).
  horizontal(town, 20.35, [[-13, -3], [-1.2, 12.2]]); horizontal(town, 31.65, [[-13, -3]]);
  for (const x of [-43.65, -32.35, 32.35, 43.65]) {
    if (x > 0) paving(town, 1.3, 38, x, 0);
    else {
      // The extra priority road opens only in chapter two. Keep its pavement and curb out of that road.
      paving(firstChapter, 1.3, 5, x, -16.5);
      paving(town, 1.3, 13, x, -7.5); paving(town, 1.3, 14, x, 12);
      paving(town, 1.3, 6, x, 2, .17);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
        cylinder(town, .017, .006, x - .36 + row * .24, .176, 1.62 + col * .15, '#b5b4a8');
      }
    }
  }
  for (const x of [-13.65, -2.35]) paving(town, 1.3, 18, x, 42);
}
