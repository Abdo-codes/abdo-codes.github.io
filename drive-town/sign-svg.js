// Draws the road signs of the exam as inline SVG. The pictures are original simple drawings of the shapes and symbols of the RVV 1990 annexes.
// `signs` is the registry of exam/sign-data.js: id -> { annex, shape, glyph, num?, term }. An unknown id gives an empty string.
// The alt text describes how the sign looks and never says what it means, so it does not give the answer away.
const RED = '#c8202a', BLUE = '#0e5ca8', YELLOW = '#f5c400', WHITE = '#fafafa', BLACK = '#1b1b1b', GREY = '#8c8c8c';
const at = (r, degrees) => [50 + r * Math.cos(degrees * Math.PI / 180), 50 + r * Math.sin(degrees * Math.PI / 180)].map(n => +n.toFixed(1));
const stroke = (colour, width = 8) => `fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

// Each frame: the shape of the sign, the box (translate and scale) in which a glyph is drawn, the glyph colour and the background of the glyph.
const FRAMES = {
  'circle-red': { svg: `<circle cx="50" cy="50" r="47" fill="${RED}"/><circle cx="50" cy="50" r="34" fill="${WHITE}"/>`, box: [20, 20, .6], ink: BLACK, back: WHITE },
  'circle-blue': { svg: `<circle cx="50" cy="50" r="47" fill="${WHITE}"/><circle cx="50" cy="50" r="44" fill="${BLUE}"/>`, box: [16, 16, .68], ink: WHITE, back: BLUE },
  'square-blue': { svg: `<rect x="3" y="3" width="94" height="94" rx="8" fill="${WHITE}"/><rect x="6" y="6" width="88" height="88" rx="6" fill="${BLUE}"/>`, box: [15, 15, .7], ink: WHITE, back: BLUE },
  'circle-blue-red': { svg: `<circle cx="50" cy="50" r="47" fill="${RED}"/><circle cx="50" cy="50" r="38" fill="${BLUE}"/>`, box: [0, 0, 1], ink: RED, back: BLUE },
  'circle-grey': { svg: `<circle cx="50" cy="50" r="47" fill="${GREY}"/><circle cx="50" cy="50" r="40" fill="${WHITE}"/>`, box: [20, 20, .6], ink: GREY, back: WHITE },
  diamond: { svg: `<polygon points="50,2 98,50 50,98 2,50" fill="${WHITE}"/><polygon points="50,10 90,50 50,90 10,50" fill="${YELLOW}" stroke="${BLACK}" stroke-width="2"/>`, box: [0, 0, 1], ink: BLACK, back: YELLOW },
  'tri-up': { svg: `<polygon points="50,6 96,88 4,88" fill="${RED}" stroke="${RED}" stroke-width="6" stroke-linejoin="round"/><polygon points="50,26 79,76 21,76" fill="${WHITE}" stroke="${WHITE}" stroke-width="6" stroke-linejoin="round"/>`, box: [28, 36, .44], ink: BLACK, back: WHITE },
  'tri-down': { svg: `<polygon points="5,12 95,12 50,92" fill="${RED}" stroke="${RED}" stroke-width="6" stroke-linejoin="round"/><polygon points="22,24 78,24 50,72" fill="${WHITE}" stroke="${WHITE}" stroke-width="6" stroke-linejoin="round"/>`, box: [0, 0, 1], ink: BLACK, back: WHITE },
  octagon: { svg: `<polygon points="30,3 70,3 97,30 97,70 70,97 30,97 3,70 3,30" fill="${WHITE}"/><polygon points="31,7 69,7 93,31 93,69 69,93 31,93 7,69 7,31" fill="${RED}"/>`, box: [0, 0, 1], ink: WHITE, back: RED },
};

// Glyphs are drawn in a box of 100 by 100. `ink` is the colour of the symbol and `back` the colour behind it.
const car = (ink, back) => `<g fill="${ink}"><rect x="12" y="50" width="76" height="24" rx="8"/><polygon points="27,50 38,28 62,28 73,50"/></g><g fill="${back}"><polygon points="35,47 42,32 49,32 49,47"/><polygon points="53,32 59,32 66,47 53,47"/></g><g fill="${ink}" stroke="${back}" stroke-width="4"><circle cx="30" cy="76" r="10"/><circle cx="70" cy="76" r="10"/></g>`;
// One arrow of the roundabout symbol: an arc that runs against the clock from `start`, with a head at its end.
const roundArrow = (start, ink) => {
  const end = start - 70, rad = end * Math.PI / 180, [x, y] = at(34, end), tip = [x + 13 * Math.sin(rad), y - 13 * Math.cos(rad)], side = [9 * Math.cos(rad), 9 * Math.sin(rad)];
  return `<path d="M${at(34, start)} A34 34 0 0 0 ${x} ${y}" ${stroke(ink, 8)}/><polygon points="${tip.map(n => n.toFixed(1))} ${x + side[0]},${y + side[1]} ${x - side[0]},${y - side[1]}" fill="${ink}"/>`;
};
const GLYPHS = {
  num: (ink, back, sign) => `<text x="50" y="70" font-size="${String(sign.num).length > 2 ? 46 : 58}" font-weight="700" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" fill="${ink}">${sign.num}</text>`,
  bike: ink => `<g ${stroke(ink, 6)}><circle cx="24" cy="64" r="17"/><circle cx="76" cy="64" r="17"/><path d="M24 64 L40 36 L64 36 L76 64 M40 36 L54 64 M64 36 L58 24 L72 24 M36 28 L48 28"/></g>`,
  walker: ink => `<circle cx="50" cy="18" r="9" fill="${ink}"/><g ${stroke(ink, 9)}><path d="M50 32 L50 60 L36 88 M50 60 L64 88 M50 40 L32 54 M50 40 L68 52"/></g>`,
  car,
  roundabout: ink => [270, 30, 150].map(start => roundArrow(start, ink)).join(''),
  'arrows-priority': () => `<polygon points="22,48 36,12 50,48 41,48 41,88 31,88 31,48" fill="${WHITE}"/><polygon points="54,52 68,88 82,52 73,52 73,14 63,14 63,52" fill="${RED}"/>`,
  barrier: ink => `<rect x="14" y="26" width="12" height="62" fill="${ink}"/><rect x="26" y="36" width="64" height="16" fill="${WHITE}" stroke="${ink}" stroke-width="3"/><g fill="${RED}"><rect x="38" y="37.5" width="10" height="13"/><rect x="58" y="37.5" width="10" height="13"/><rect x="78" y="37.5" width="10" height="13"/></g>`,
  tram: (ink, back) => `<g ${stroke(ink, 5)}><path d="M50 30 L50 14 M32 14 L68 14"/></g><rect x="16" y="30" width="68" height="46" rx="9" fill="${ink}"/><g fill="${back}"><rect x="26" y="38" width="18" height="16"/><rect x="56" y="38" width="18" height="16"/></g><g fill="${ink}"><circle cx="32" cy="84" r="6"/><circle cx="68" cy="84" r="6"/></g>`,
  narrow: ink => `<g ${stroke(ink, 9)}><path d="M22 90 L22 66 C22 50 38 52 38 36 L38 8 M78 90 L78 66 C78 50 62 52 62 36 L62 8"/></g>`,
  'end-bar': ink => `<g ${stroke(ink, 5)}><path d="M26 74 L74 26 M20 62 L62 20 M38 80 L80 38"/></g>`,
  'text-stop': () => `<text x="50" y="62" font-size="25" font-weight="800" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" fill="${WHITE}" letter-spacing="1">STOP</text>`,
  bar: () => `<circle cx="50" cy="50" r="57" fill="${RED}"/><rect x="8" y="41" width="84" height="18" fill="${WHITE}"/>`,
  'overtake-ban': () => `<g transform="translate(2 24) scale(.5)">${car(BLACK, WHITE)}</g><g transform="translate(48 24) scale(.5)">${car(RED, WHITE)}</g>`,
  'overtake-end': () => `<g transform="translate(2 24) scale(.5)">${car(GREY, WHITE)}</g><g transform="translate(48 24) scale(.5)">${car(GREY, WHITE)}</g><g ${stroke(GREY, 5)}><path d="M24 90 L76 10 M10 76 L62 -4 M38 100 L90 20"/></g>`,
  diag: () => `<line x1="24" y1="76" x2="76" y2="24" stroke="${RED}" stroke-width="10" stroke-linecap="round"/>`,
  cross: () => `<g stroke="${RED}" stroke-width="10" stroke-linecap="round"><line x1="22" y1="78" x2="78" y2="22"/><line x1="22" y1="22" x2="78" y2="78"/></g>`,
};
const SHAPE_WORDS = { 'circle-red': 'round sign with a red border', 'circle-blue': 'round blue sign', 'square-blue': 'square blue sign', 'circle-blue-red': 'round blue sign with a red border',
  'circle-grey': 'round white sign with a grey border', diamond: 'yellow diamond sign with a white border', 'tri-up': 'triangular sign with a red border', 'tri-down': 'triangular sign with a red border and the point down', octagon: 'red eight-sided sign' };
const GLYPH_WORDS = { num: sign => `the number ${sign.num}`, bike: () => 'a bicycle', walker: () => 'a person who walks', car: () => 'a car', roundabout: () => 'three arrows in a circle',
  'arrows-priority': () => 'a white arrow up and a red arrow down', barrier: () => 'a barrier', tram: () => 'a tram', narrow: () => 'two lines that come closer', 'end-bar': () => 'black diagonal lines',
  'text-stop': () => 'the word STOP', bar: () => 'a white bar', 'overtake-ban': () => 'a red car and a black car side by side', 'overtake-end': () => 'two grey cars and grey diagonal lines', diag: () => 'one red diagonal line', cross: () => 'a red cross' };

export const hasSign = (id, signs) => Boolean(signs?.[id]?.shape && FRAMES[signs[id].shape]);
export function signAlt(id, signs) {
  const sign = signs?.[id]; if (!hasSign(id, signs)) return `Sign ${id}`;
  const text = SHAPE_WORDS[sign.shape] + (sign.glyph ? ` with ${GLYPH_WORDS[sign.glyph](sign)}` : '');
  return text[0].toUpperCase() + text.slice(1);
}
export function signSvg(id, signs) {
  if (!hasSign(id, signs)) return '';
  const sign = signs[id], frame = FRAMES[sign.shape], [x, y, k] = frame.box, glyph = sign.glyph ? GLYPHS[sign.glyph](frame.ink, frame.back, sign) : '';
  const inner = glyph && (k === 1 && !x ? glyph : `<g transform="translate(${x} ${y}) scale(${k})">${glyph}</g>`);
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${signAlt(id, signs)}" focusable="false">${frame.svg}${inner}</svg>`;
}
// The `view.sign` object of the exam screens.
export const signView = signs => ({ svg: id => signSvg(id, signs), alt: id => signAlt(id, signs) });
