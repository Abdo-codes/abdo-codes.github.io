// Route builder. A route is a start pose and a list of segments, driven like a turtle:
// `{ straight: metres }` or `{ arc: radius, angle: radians, turn: 'right' | 'left' }`.
// Coordinates: x/z ground plane, heading = atan2(dx, dz). Traffic drives on the right.

const snap = value => Math.abs(value) < 1e-12 ? 0 : value;
// Snap rounding residue so quarter turns give exact axis directions (and a stable ±π heading).
const rotate = (x, z, angle) => [snap(x * Math.cos(angle) - z * Math.sin(angle)), snap(z * Math.cos(angle) + x * Math.sin(angle))];

function pieces(start, segments) {
  let x = start.x, z = start.z, dx = start.dx, dz = start.dz, from = 0;
  return segments.map(segment => {
    const piece = { from, x, z, dx, dz };
    if (segment.straight !== undefined) {
      piece.length = segment.straight;
      x += dx * piece.length; z += dz * piece.length;
    } else {
      const sign = segment.turn === 'left' ? -1 : 1, [rx, rz] = rotate(dx, dz, sign * Math.PI / 2);
      Object.assign(piece, { length: segment.arc * segment.angle, radius: segment.arc, sign, turn: segment.turn,
        cx: x + rx * segment.arc, cz: z + rz * segment.arc });
      [x, z] = rotate(x - piece.cx, z - piece.cz, sign * segment.angle); x += piece.cx; z += piece.cz;
      [dx, dz] = rotate(dx, dz, sign * segment.angle);
    }
    from += piece.length;
    return piece;
  });
}

function pointOn(piece, s) {
  if (piece.radius === undefined) return { x: piece.x + piece.dx * s, z: piece.z + piece.dz * s, dx: piece.dx, dz: piece.dz };
  const angle = piece.sign * s / piece.radius, [ox, oz] = rotate(piece.x - piece.cx, piece.z - piece.cz, angle);
  const [dx, dz] = rotate(piece.dx, piece.dz, angle);
  return { x: piece.cx + ox, z: piece.cz + oz, dx, dz };
}

export function buildRoute({ id, start, segments, loop = false }) {
  const parts = pieces(start, segments), last = parts.at(-1);
  const length = last.from + last.length;
  const turns = parts.filter(part => part.turn).map((part, index) => ({ id: `bend-${index + 1}`, direction: part.turn, start: part.from, end: part.from + part.length }));
  function at(distance) {
    let d = loop ? ((distance % length) + length) % length : distance;
    let part = parts.find(item => d <= item.from + item.length) ?? last;
    if (!loop && d < 0) part = parts[0];
    const point = pointOn(part, d - part.from);
    return { ...point, heading: Math.atan2(point.dx, point.dz) };
  }
  return { id, length, loop, turns, segments: parts, at };
}
