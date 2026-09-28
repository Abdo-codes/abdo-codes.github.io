/* Overlay for the pop-up timing chapter: a frame around the surfer's-view inset, the timing bar
   (too early / pop up now / too late) with a live marker, and the result of each take. */
(function () {
  const SURF = window.SURF;
  const SERIF = '"Fraunces", Georgia, serif';
  const SANS = '"Manrope", system-ui, -apple-system, sans-serif';
  const MAX = 3.2; // bar spans from 3.2 wave heights away down to the crest
  const ZONES = [
    { from: MAX, to: 1.3, label: 'Too early', short: 'Early', color: 'rgba(156,200,224,0.55)' },
    { from: 1.3, to: 0.5, label: 'Pop up now!', short: 'Now!', color: '#3fd6c4' },
    { from: 0.5, to: 0, label: 'Too late', short: 'Late', color: '#ff7a59' },
  ];
  const COLORS = { early: '#9cc8e0', sweet: '#3fd6c4', late: '#ff7a59', wait: '#ff7a59' };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function inset(ctx, S, u) {
    const r = S.insetRect;
    if (!r) return;
    ctx.save();
    ctx.globalAlpha = 1 - S.fade;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2 * u;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    if (r.label) {
      ctx.font = `800 ${12 * u}px ${SANS}`;
      const tw = ctx.measureText(r.label.toUpperCase()).width + 20 * u;
      ctx.fillStyle = 'rgba(6,18,26,0.75)';
      rr(ctx, r.x + 10 * u, r.y + 10 * u, tw, 24 * u, 12 * u);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.label.toUpperCase(), r.x + 20 * u, r.y + 22.5 * u);
    }
    ctx.restore();
  }

  SURF.drawTiming = function (ctx, S, u, W, H) {
    inset(ctx, S, u);
    const T = S.timing;
    if (!T) return;
    const film = S.film.active, free = SURF.freeRect, k = SURF.cssScale || 1;
    // keep the bar inside the part of the screen the panel doesn't cover
    const fx0 = film || !free ? 0 : free.x0 * k, fx1 = film || !free ? W : free.x1 * k;
    const fy1 = film || !free ? H : Math.min(H, free.y1 * k + 96 * u);
    const cx = (fx0 + fx1) / 2;
    const bw = Math.min(560 * u, (fx1 - fx0) * 0.86), bh = 12 * u, x = cx - bw / 2;
    const y = film ? H - H * 0.075 - 235 * u : fy1 - 142 * u; // in the film, clear of two-line subtitles
    const toX = (v) => x + bw * (1 - Math.min(MAX, Math.max(0, v)) / MAX);
    ctx.save();
    ctx.globalAlpha = (1 - S.fade) * (film && S.film.title ? 1 - S.film.title.alpha : 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const live = T.pop == null && T.uN <= MAX;
    for (const z of ZONES) {
      const x0 = toX(z.from), x1 = toX(z.to), inZone = live && T.uN <= z.from && T.uN > z.to;
      ctx.fillStyle = z.color;
      ctx.globalAlpha *= inZone ? 1 : 0.8;
      rr(ctx, x0, y, x1 - x0 - 3 * u, bh, bh / 2);
      ctx.fill();
      ctx.globalAlpha /= inZone ? 1 : 0.8;
      ctx.font = `${inZone ? 800 : 700} ${(inZone ? 15 : 13) * u}px ${SANS}`;
      ctx.fillStyle = inZone ? '#fff' : 'rgba(255,255,255,0.75)';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 8 * u;
      ctx.fillText(bw < 440 * u ? z.short : z.label, (x0 + x1) / 2, y - 12 * u);
      ctx.shadowBlur = 0;
    }
    // live marker
    const mx = toX(T.pop != null ? T.pop : T.uN);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10 * u;
    ctx.beginPath();
    ctx.arc(mx, y + bh / 2, (T.pop != null ? 9 : 8 + 2 * Math.sin(performance.now() / 120)) * u, 0, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (T.pop != null && T.kind) {
      ctx.fillStyle = COLORS[T.kind];
      ctx.beginPath();
      ctx.arc(mx, y + bh / 2, 5 * u, 0, 7);
      ctx.fill();
      ctx.font = `800 ${12 * u}px ${SANS}`;
      ctx.fillStyle = '#fff';
      ctx.fillText('YOU POPPED UP HERE', mx, y + bh + 22 * u);
    }
    // result
    if (T.result) {
      ctx.globalAlpha = 1 - S.fade;
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 20 * u;
      ctx.fillStyle = T.result.color;
      ctx.font = `italic 500 ${60 * u}px ${SERIF}`;
      const ty = film ? H * 0.3 : H * 0.26;
      ctx.fillText(T.result.title, cx, ty);
      ctx.fillStyle = '#fff';
      ctx.font = `600 ${20 * u}px ${SANS}`;
      ctx.fillText(T.result.sub, cx, ty + 42 * u);
    }
    ctx.restore();
  };
})();
