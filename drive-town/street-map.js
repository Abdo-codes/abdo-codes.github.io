// The street shapes of the minimap as SVG text (pure). `shapes` come from streetMarkers(); positions are in minimap units, angles in degrees.
const FILL = { tram: '#4a7fb3', rider: '#d98a2b', van: '#8e9497', car: '#6d7882', walker: '#c9503f', stop: '#d65a4a', line: '#fffaf0' };
const n = value => +value.toFixed(2);
export function shapeSvg(shape) {
  const { type, x, y, w, h, angle, tone } = shape, fill = FILL[tone] ?? '#888', turn = angle ? ` transform="rotate(${n(-angle)} ${n(x)} ${n(y)})"` : '';
  if (type === 'dot') return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(Math.max(2, Math.max(w, h) / 2))}" fill="${fill}" stroke="#fffaf0" stroke-width=".35"/>`;
  const rect = (extra = '') => `<rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}"${turn} ${extra}/>`;
  if (type === 'zone') return rect(`fill="${fill}" opacity=".4"`);
  if (type === 'zebra') return rect(`fill="${fill}" opacity=".4" stroke="#fffaf0" stroke-width=".5" stroke-dasharray=".8 .8"`);
  if (type === 'tick') return rect(`fill="${fill}"`);
  return rect(`rx=".7" fill="${fill}" stroke="#fffaf0" stroke-width=".3"`);
}
export const streetMapSvg = shapes => shapes.map(shapeSvg).join('');
