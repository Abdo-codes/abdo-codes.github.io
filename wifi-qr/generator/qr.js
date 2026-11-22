/* Minimal, zero-dependency ISO/IEC 18004 QR Code encoder (Byte mode, EC Level M, Versions 1-10).
 * Runs 100% locally in the browser. Zero network calls. MIT License.
 */
(function (root) {
  'use strict';

  const EC_M_TABLE = [
    null,
    { ver: 1, size: 21, total: 26, data: 16, ec: 10, groups: [[1, 16]], align: [] },
    { ver: 2, size: 25, total: 44, data: 28, ec: 16, groups: [[1, 28]], align: [6, 18] },
    { ver: 3, size: 29, total: 70, data: 44, ec: 26, groups: [[1, 44]], align: [6, 22] },
    { ver: 4, size: 33, total: 100, data: 64, ec: 18, groups: [[2, 32]], align: [6, 26] },
    { ver: 5, size: 37, total: 134, data: 86, ec: 24, groups: [[2, 43]], align: [6, 30] },
    { ver: 6, size: 41, total: 172, data: 108, ec: 16, groups: [[4, 27]], align: [6, 34] },
    { ver: 7, size: 45, total: 196, data: 124, ec: 18, groups: [[4, 31]], align: [6, 22, 38], vbits: 0x07c94 },
    { ver: 8, size: 49, total: 242, data: 154, ec: 22, groups: [[2, 38], [2, 39]], align: [6, 24, 42], vbits: 0x085bc },
    { ver: 9, size: 53, total: 292, data: 182, ec: 22, groups: [[3, 36], [2, 37]], align: [6, 26, 46], vbits: 0x09a99 },
    { ver: 10, size: 57, total: 346, data: 216, ec: 26, groups: [[4, 43], [1, 44]], align: [6, 28, 50], vbits: 0x0a4d3 }
  ];

  // GF(256) with primitive polynomial 0x11D
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  (function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();

  function gfMul(a, b) {
    return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
  }

  function rsGeneratorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      const factor = EXP[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], factor);
      }
      poly = next;
    }
    return poly;
  }

  function rsRemainder(data, ecLen) {
    const gen = rsGeneratorPoly(ecLen);
    const rem = new Uint8Array(ecLen);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ rem[0];
      rem.copyWithin(0, 1);
      rem[ecLen - 1] = 0;
      if (factor !== 0) {
        for (let j = 0; j < ecLen; j++) {
          rem[j] ^= gfMul(gen[j + 1], factor);
        }
      }
    }
    return rem;
  }

  function utf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') {
      return Array.from(new TextEncoder().encode(str));
    }
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
    return out;
  }

  function pickVersion(byteLen) {
    for (let v = 1; v < EC_M_TABLE.length; v++) {
      const spec = EC_M_TABLE[v];
      const countBits = v <= 9 ? 8 : 16;
      const neededBits = 4 + countBits + byteLen * 8;
      if (neededBits <= spec.data * 8) return spec;
    }
    throw new Error('Input exceeds Version 10 QR capacity (213 bytes).');
  }

  function encodeDataCodewords(bytes, spec) {
    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };
    pushBits(0b0100, 4); // Byte mode
    pushBits(bytes.length, spec.ver <= 9 ? 8 : 16);
    for (const b of bytes) pushBits(b, 8);

    const maxBits = spec.data * 8;
    const term = Math.min(4, maxBits - bits.length);
    for (let i = 0; i < term; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let val = 0;
      for (let j = 0; j < 8; j++) val = (val << 1) | bits[i + j];
      codewords.push(val);
    }
    const pads = [0xec, 0x11];
    let p = 0;
    while (codewords.length < spec.data) {
      codewords.push(pads[p++ & 1]);
    }
    return codewords;
  }

  function interleaveBlocks(dataCodewords, spec) {
    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;
    for (const [count, blockDataLen] of spec.groups) {
      for (let i = 0; i < count; i++) {
        const slice = dataCodewords.slice(offset, offset + blockDataLen);
        offset += blockDataLen;
        dataBlocks.push(slice);
        ecBlocks.push(rsRemainder(slice, spec.ec));
      }
    }
    const maxDataLen = Math.max(...dataBlocks.map((b) => b.length));
    const finalBytes = [];
    for (let i = 0; i < maxDataLen; i++) {
      for (const b of dataBlocks) if (i < b.length) finalBytes.push(b[i]);
    }
    for (let i = 0; i < spec.ec; i++) {
      for (const b of ecBlocks) finalBytes.push(b[i]);
    }
    return finalBytes;
  }

  function createBaseMatrix(spec) {
    const n = spec.size;
    const mod = Array.from({ length: n }, () => new Uint8Array(n));
    const isFunc = Array.from({ length: n }, () => new Uint8Array(n));

    const setFunc = (r, c, dark) => {
      if (r < 0 || c < 0 || r >= n || c >= n) return;
      mod[r][c] = dark ? 1 : 0;
      isFunc[r][c] = 1;
    };

    const drawFinder = (top, left) => {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const r = top + dr;
          const c = left + dc;
          if (r < 0 || c < 0 || r >= n || c >= n) continue;
          const onBorder = dr === -1 || dr === 7 || dc === -1 || dc === 7;
          const dark =
            !onBorder &&
            (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
          setFunc(r, c, dark);
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, n - 7);
    drawFinder(n - 7, 0);

    // Timing patterns
    for (let i = 8; i < n - 8; i++) {
      setFunc(6, i, i % 2 === 0);
      setFunc(i, 6, i % 2 === 0);
    }

    // Alignment patterns
    const pos = spec.align;
    for (const r of pos) {
      for (const c of pos) {
        if ((r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6)) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            setFunc(r + dr, c + dc, dark);
          }
        }
      }
    }

    // Reserve format info strips + dark module
    for (let i = 0; i <= 8; i++) {
      if (i !== 6) {
        setFunc(8, i, false);
        setFunc(i, 8, false);
      }
    }
    for (let i = n - 8; i < n; i++) {
      setFunc(8, i, false);
      setFunc(i, 8, false);
    }
    setFunc(n - 8, 8, true);

    // Version info for versions >= 7
    if (spec.vbits) {
      for (let i = 0; i < 18; i++) {
        const bit = ((spec.vbits >>> i) & 1) === 1;
        const a = n - 11 + (i % 3);
        const b = Math.floor(i / 3);
        setFunc(b, a, bit);
        setFunc(a, b, bit);
      }
    }

    return { mod, isFunc };
  }

  function formatBitsForMask(mask) {
    // EC Level M = 0b00
    const data = (0b00 << 3) | mask;
    let rem = data << 10;
    for (let i = 4; i >= 0; i--) {
      if (rem & (1 << (i + 10))) rem ^= 0x537 << i;
    }
    return ((data << 10) | rem) ^ 0x5412;
  }

  function writeFormatBits(mod, n, mask) {
    const bits = formatBitsForMask(mask);
    // Around top-left finder
    for (let i = 0; i <= 5; i++) mod[8][i] = (bits >>> (14 - i)) & 1;
    mod[8][7] = (bits >>> 8) & 1;
    mod[8][8] = (bits >>> 7) & 1;
    mod[7][8] = (bits >>> 6) & 1;
    for (let i = 0; i <= 5; i++) mod[5 - i][8] = (bits >>> (5 - i)) & 1;
    // Split between bottom-left and top-right
    for (let i = 0; i < 7; i++) mod[n - 1 - i][8] = (bits >>> (14 - i)) & 1;
    for (let i = 0; i < 8; i++) mod[8][n - 8 + i] = (bits >>> (7 - i)) & 1;
  }

  const MASK_FNS = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  ];

  function placeData(mod, isFunc, n, allBytes) {
    let bitIdx = 0;
    const totalBits = allBytes.length * 8;
    let upward = true;
    for (let right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < n; vert++) {
        const r = upward ? n - 1 - vert : vert;
        for (let j = 0; j < 2; j++) {
          const c = right - j;
          if (isFunc[r][c]) continue;
          let bit = 0;
          if (bitIdx < totalBits) {
            bit = (allBytes[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          }
          mod[r][c] = bit;
        }
      }
      upward = !upward;
    }
  }

  function penaltyScore(mod, n) {
    let score = 0;
    // Rule 1: adjacent runs >= 5
    for (let r = 0; r < n; r++) {
      let runColor = mod[r][0], runLen = 1;
      for (let c = 1; c < n; c++) {
        if (mod[r][c] === runColor) {
          runLen++;
          if (runLen === 5) score += 3;
          else if (runLen > 5) score += 1;
        } else {
          runColor = mod[r][c];
          runLen = 1;
        }
      }
    }
    for (let c = 0; c < n; c++) {
      let runColor = mod[0][c], runLen = 1;
      for (let r = 1; r < n; r++) {
        if (mod[r][c] === runColor) {
          runLen++;
          if (runLen === 5) score += 3;
          else if (runLen > 5) score += 1;
        } else {
          runColor = mod[r][c];
          runLen = 1;
        }
      }
    }
    // Rule 2: 2x2 blocks
    for (let r = 0; r < n - 1; r++) {
      for (let c = 0; c < n - 1; c++) {
        const v = mod[r][c];
        if (v === mod[r][c + 1] && v === mod[r + 1][c] && v === mod[r + 1][c + 1]) score += 3;
      }
    }
    // Rule 3: finder-like 1:1:3:1:1 patterns
    const matchFinder = (arr, i) =>
      (arr[i] === 1 && arr[i + 1] === 0 && arr[i + 2] === 1 && arr[i + 3] === 1 && arr[i + 4] === 1 &&
       arr[i + 5] === 0 && arr[i + 6] === 1 &&
       ((i + 10 < arr.length && arr[i + 7] === 0 && arr[i + 8] === 0 && arr[i + 9] === 0 && arr[i + 10] === 0) ||
        (i >= 4 && arr[i - 1] === 0 && arr[i - 2] === 0 && arr[i - 3] === 0 && arr[i - 4] === 0)));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c <= n - 7; c++) if (matchFinder(mod[r], c)) score += 40;
    }
    const col = new Uint8Array(n);
    for (let c = 0; c < n; c++) {
      for (let r = 0; r < n; r++) col[r] = mod[r][c];
      for (let r = 0; r <= n - 7; r++) if (matchFinder(col, r)) score += 40;
    }
    // Rule 4: dark ratio balance
    let dark = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) dark += mod[r][c];
    const pct = (dark * 100) / (n * n);
    score += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return score;
  }

  function encodeQR(text) {
    const bytes = utf8Bytes(text);
    const spec = pickVersion(bytes.length);
    const dataCw = encodeDataCodewords(bytes, spec);
    const allBytes = interleaveBlocks(dataCw, spec);
    const { mod: baseMod, isFunc } = createBaseMatrix(spec);
    placeData(baseMod, isFunc, spec.size, allBytes);

    let bestMask = 0;
    let bestScore = Infinity;
    let bestMod = null;
    for (let m = 0; m < 8; m++) {
      const cand = baseMod.map((row) => new Uint8Array(row));
      const fn = MASK_FNS[m];
      for (let r = 0; r < spec.size; r++) {
        for (let c = 0; c < spec.size; c++) {
          if (!isFunc[r][c] && fn(r, c)) cand[r][c] ^= 1;
        }
      }
      writeFormatBits(cand, spec.size, m);
      const sc = penaltyScore(cand, spec.size);
      if (sc < bestScore) {
        bestScore = sc;
        bestMask = m;
        bestMod = cand;
      }
    }
    return { size: spec.size, version: spec.ver, mask: bestMask, modules: bestMod };
  }

  function escapeWifiField(str) {
    return String(str).replace(/([\\;,:"])/g, '\\$1');
  }

  function buildWifiPayload({ ssid, password, security, hidden }) {
    const sec = security === 'nopass' ? 'nopass' : security === 'WEP' ? 'WEP' : 'WPA';
    const s = escapeWifiField(ssid || '');
    const p = sec === 'nopass' ? '' : escapeWifiField(password || '');
    const h = hidden ? 'H:true;' : '';
    return `WIFI:T:${sec};S:${s};P:${p};${h};`;
  }

  function toSVG(qr, { quiet = 4, dark = '#102033', light = '#ffffff' } = {}) {
    const total = qr.size + quiet * 2;
    let path = '';
    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (qr.modules[r][c]) {
          path += `M${c + quiet},${r + quiet}h1v1h-1z`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="Wi-Fi QR Code"><rect width="${total}" height="${total}" fill="${light}"/><path d="${path}" fill="${dark}"/></svg>`;
  }

  const api = { encodeQR, buildWifiPayload, escapeWifiField, toSVG };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WifiQR = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
