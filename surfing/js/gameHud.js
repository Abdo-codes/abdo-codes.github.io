/* Canvas HUD for the play chapter: score, multiplier, timer, speed, messages, control hints. */
(function () {
  const SURF = window.SURF;
  const SERIF = '"Fraunces", Georgia, serif';
  const SANS = '"Manrope", system-ui, -apple-system, sans-serif';

  function pill(ctx, x, y, w, h, fill) {
    const r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  SURF.drawGameHud = function (ctx, S, u, W, H) {
    const g = S.game;
    if (!g) return;
    const touch = SURF.gameInput && SURF.gameInput.touchUsed;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 16 * u;
    const top = 70 * u;

    if (g.state === 'ride' || g.state === 'wipe' || g.state === 'done') {
      ctx.fillStyle = '#fff';
      ctx.font = `italic 500 ${58 * u}px ${SERIF}`;
      ctx.fillText(Math.round(g.score).toLocaleString(), W / 2, top + 10 * u);
      const chip = g.zone === 'barrel' ? 'IN THE BARREL' : g.zone === 'pocket' ? `POCKET ×${g.mult}` : g.zone === 'shoulder' ? 'ON THE SHOULDER — CUT BACK' : '';
      if (chip) {
        ctx.font = `800 ${14 * u}px ${SANS}`;
        const w = ctx.measureText(chip).width + 30 * u;
        ctx.shadowBlur = 0;
        pill(ctx, W / 2 - w / 2, top + 44 * u, w, 30 * u, g.zone === 'barrel' ? '#3fd6c4' : g.zone === 'pocket' ? '#ffb877' : 'rgba(255,255,255,0.2)');
        ctx.fillStyle = g.zone === 'shoulder' ? '#fff' : '#10232c';
        ctx.fillText(chip, W / 2, top + 60 * u);
      }
      // timer + speed on the right
      ctx.shadowBlur = 0;
      const x = W - 70 * u;
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `700 ${13 * u}px ${SANS}`;
      ctx.fillText('WAVE TIME', x, top - 8 * u);
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${24 * u}px ${SANS}`;
      ctx.fillText(Math.max(0, 45 - g.time).toFixed(0) + 's', x, top + 20 * u);
      const sw = 140 * u, sx = x - sw, sy = top + 46 * u;
      pill(ctx, sx, sy, sw, 8 * u, 'rgba(255,255,255,0.18)');
      pill(ctx, sx, sy, Math.max(8 * u, (sw * Math.min(g.speed, 16)) / 16), 8 * u, '#3fd6c4');
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `700 ${12 * u}px ${SANS}`;
      ctx.fillText(Math.round(g.speed * 3.6) + ' km/h', x, sy + 24 * u);
    }

    ctx.textAlign = 'center';
    if (g.state === 'ready') {
      ctx.fillStyle = '#fff';
      ctx.font = `italic 400 ${54 * u}px ${SERIF}`;
      ctx.fillText('Here comes a set.', W / 2, H * 0.3);
      ctx.font = `600 ${22 * u}px ${SANS}`;
      ctx.fillText(touch ? 'Tap to paddle in' : 'Press Space to paddle in', W / 2, H * 0.3 + 50 * u);
      if (g.best) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = `700 ${15 * u}px ${SANS}`;
        const last = g.last != null ? `Last ${g.last.toLocaleString()}   ·   ` : '';
        ctx.fillText(`${last}Best ${g.best.toLocaleString()}${g.newBest ? '  — new best!' : ''}`, W / 2, H * 0.3 + 90 * u);
      }
    }
    if (g.msgT > 0 && g.msg) {
      const a = Math.min(1, g.msgT * 3);
      ctx.globalAlpha = a;
      ctx.fillStyle = g.state === 'wipe' ? '#ff9a7a' : '#fff';
      const big = g.msg === 'BARREL!' || g.msg === 'Go!';
      ctx.font = big ? `italic 500 ${86 * u}px ${SERIF}` : `italic 400 ${46 * u}px ${SERIF}`;
      ctx.fillText(g.state === 'wipe' ? 'Wipeout!' : g.msg, W / 2, H * 0.42);
      if (g.state === 'wipe') {
        ctx.font = `600 ${22 * u}px ${SANS}`;
        ctx.fillText(g.msg, W / 2, H * 0.42 + 56 * u);
      }
      ctx.globalAlpha = 1;
    }
    if (g.state === 'ride' && g.time < 8) {
      ctx.shadowBlur = 10 * u;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `600 ${16 * u}px ${SANS}`;
      const tilt = SURF.gameInput.tilt.on;
      const hint = tilt ? 'Tilt forward to drop, back to climb · tilt left to race, right to stall · tap to pump'
        : touch ? 'Drag up/down to climb & drop · drag left to race, right to stall · tap to pump'
        : '↑ ↓ climb & drop   ·   ← race   → stall   ·   Space pump';
      ctx.fillText(hint, W / 2, H - 110 * u);
    }
    ctx.restore();
  };
})();
