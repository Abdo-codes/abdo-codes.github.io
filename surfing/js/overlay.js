/* 2D overlay drawn on a canvas above the 3D view: labels, fades, and in film mode the letterbox,
   title cards, subtitles and HUD. Being a canvas, it is captured straight into recorded video. */
(function () {
  const SURF = window.SURF;
  const SERIF = '"Fraunces", Georgia, serif';
  const SANS = '"Manrope", system-ui, -apple-system, sans-serif';
  const strip = (s) => s.replace(/<[^>]+>/g, '');

  SURF.createOverlay = function (canvas, camera) {
    const ctx = canvas.getContext('2d');
    const v = new THREE.Vector3();

    function rr(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function wrap(text, maxW) {
      const words = text.split(' '), lines = [];
      let line = '';
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
      }
      if (line) lines.push(line);
      return lines;
    }
    function spacing(px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }

    function labels(S, u, W, H) {
      for (const L of S.labels) {
        const show = S.captionIndex >= L.from;
        L.a += ((show ? 1 : 0) - L.a) * 0.07;
        if (L.a < 0.02) continue;
        v.copy(L.p).project(camera);
        if (v.z > 1 || Math.abs(v.x) > 1.3 || Math.abs(v.y) > 1.3) continue;
        const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
        const lift = (L.lift || 46) * u, dir = Math.sign(lift);
        ctx.globalAlpha = L.a * (1 - S.fade);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1.5 * u;
        ctx.beginPath(); ctx.moveTo(x, y - 5 * u * dir); ctx.lineTo(x, y - lift); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, y, 4 * u, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.arc(x, y, 9 * u, 0, 7); ctx.stroke();
        ctx.font = `700 ${15 * u}px ${SANS}`;
        spacing(0.2 * u);
        const tw = ctx.measureText(L.text).width, pw = tw + 26 * u, ph = 32 * u;
        const px = x - pw / 2, py = dir > 0 ? y - lift - ph : y - lift;
        ctx.fillStyle = 'rgba(6,18,26,0.74)';
        rr(px, py, pw, ph, ph / 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = u; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(L.text, x, py + ph / 2 + u);
      }
      ctx.globalAlpha = 1;
      spacing(0);
    }

    function titleCard(F, u, W, H) {
      const t = F.title;
      if (!t || t.alpha < 0.01) return;
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 30 * u;
      const hero = F.titleStyle === 'hero';
      const x = hero ? W / 2 : 120 * u, y = hero ? H * 0.47 : H * 0.72;
      ctx.textAlign = hero ? 'center' : 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#ffb877';
      ctx.font = `800 ${(hero ? 19 : 18) * u}px ${SANS}`;
      spacing(4 * u);
      ctx.fillText(t.kicker.toUpperCase(), x, y - (hero ? 104 : 88) * u);
      spacing(-1 * u);
      ctx.fillStyle = '#fff';
      ctx.font = `italic 400 ${(hero ? 118 : 86) * u}px ${SERIF}`;
      ctx.fillText(t.text, x, y);
      if (t.sub) {
        spacing(0);
        ctx.font = `500 ${30 * u}px ${SANS}`;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(t.sub, x, y + 62 * u);
      }
      ctx.restore();
      spacing(0);
    }

    function caption(F, u, W, H, bar) {
      const c = F.caption;
      if (!c || !c.text || c.alpha < 0.01) return;
      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.font = `500 ${31 * u}px ${SANS}`;
      const lines = wrap(strip(c.text), Math.min(1320 * u, W - 120 * u));
      const lh = 44 * u, y0 = H - bar - 56 * u - (lines.length - 1) * lh;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 16 * u;
      ctx.fillStyle = '#fff';
      lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh));
      ctx.restore();
    }

    function hud(S, u, W, bar) {
      const h = S.hud;
      if (!h) return;
      const w = 400 * u, x = W - w - 60 * u, y = bar + 40 * u;
      const rows = h.rows.length, hh = 34 * u + rows * 30 * u + (h.meter != null ? 44 * u : 0) + 34 * u;
      ctx.save();
      ctx.globalAlpha = 1 - S.fade;
      ctx.fillStyle = 'rgba(6,18,26,0.66)';
      rr(x, y, w, hh, 18 * u); ctx.fill();
      ctx.textBaseline = 'middle';
      let yy = y + 32 * u;
      ctx.font = `600 ${17 * u}px ${SANS}`;
      for (const [k, val] of h.rows) {
        ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText(k, x + 24 * u, yy);
        ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(val, x + w - 24 * u, yy);
        yy += 30 * u;
      }
      if (h.meter != null) {
        yy += 8 * u;
        const mw = w - 48 * u;
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; rr(x + 24 * u, yy, mw, 8 * u, 4 * u); ctx.fill();
        const g = ctx.createLinearGradient(x + 24 * u, 0, x + 24 * u + mw, 0);
        g.addColorStop(0, '#3fd6c4'); g.addColorStop(0.7, '#ffd27a'); g.addColorStop(1, '#ff7a59');
        ctx.fillStyle = g; rr(x + 24 * u, yy, Math.max(8 * u, mw * h.meter), 8 * u, 4 * u); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(x + 24 * u + mw * h.mark - u, yy - 5 * u, 2 * u, 18 * u);
        yy += 30 * u;
      }
      ctx.textAlign = 'left'; ctx.fillStyle = '#ffb877'; ctx.font = `700 ${17 * u}px ${SANS}`;
      ctx.fillText(h.state, x + 24 * u, yy + 4 * u, w - 48 * u);
      ctx.restore();
    }

    return {
      draw(S, u) {
        const W = canvas.width, H = canvas.height, F = S.film;
        ctx.clearRect(0, 0, W, H);
        labels(S, u, W, H);
        if (F.active) {
          const g = ctx.createLinearGradient(0, H * 0.62, 0, H);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(1, 'rgba(0,0,0,0.5)');
          ctx.fillStyle = g;
          ctx.fillRect(0, H * 0.62, W, H * 0.38);
        }
        if ((S.timing || S.insetRect) && SURF.drawTiming) SURF.drawTiming(ctx, S, u, W, H);
        if (S.fade > 0.001) { ctx.fillStyle = `rgba(3,8,12,${Math.min(1, S.fade)})`; ctx.fillRect(0, 0, W, H); }
        F.lb += ((F.active ? 1 : 0) - F.lb) * 0.06;
        const bar = Math.round(H * 0.075 * F.lb);
        if (bar > 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar); }
        if (S.game && SURF.drawGameHud) SURF.drawGameHud(ctx, S, u, W, H);
        if (!F.active) return;
        titleCard(F, u, W, H);
        caption(F, u, W, H, bar);
        hud(S, u, W, bar);
      },
    };
  };
})();
