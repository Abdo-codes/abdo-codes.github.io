/* DOM UI: chapter panel, controls, HUD, chapter nav, film / record / sound buttons. */
(function () {
  const SURF = window.SURF;

  SURF.createUI = function ({ S, director: D, recorder, audio }) {
    const $ = (id) => document.getElementById(id);
    const C = SURF.chapters;
    const panel = $('panel'), linesEl = $('p-lines'), controlsEl = $('p-controls'), hudEl = $('p-hud');
    let current = null, hudTick = 0, lastHud = '', autoCollapsed = false;

    // chapter nav
    const navButtons = D.EXPLORE.map((id, i) => {
      const b = document.createElement('button');
      b.className = 'chap';
      b.innerHTML = `<span>${C[id].num}</span>${C[id].short}`;
      b.onclick = () => D.goTo(i);
      $('chapters').appendChild(b);
      return b;
    });

    function control(def, c) {
      const wrap = document.createElement('div');
      wrap.className = 'ctl';
      const val = def.params[c.key];
      if (c.type === 'toggle') {
        wrap.innerHTML = `<label class="toggle"><input type="checkbox" ${val ? 'checked' : ''}> ${c.label}</label>`;
        wrap.querySelector('input').onchange = (e) => { def.params[c.key] = e.target.checked; };
        return wrap;
      }
      const head = document.createElement('div');
      head.className = 'ctl-label';
      head.innerHTML = `<span>${c.label}</span><output></output>`;
      wrap.appendChild(head);
      const out = head.querySelector('output');
      if (c.type === 'seg') {
        const seg = document.createElement('div');
        seg.className = 'seg';
        c.options.forEach(([v, text]) => {
          const b = document.createElement('button');
          b.textContent = text;
          b.classList.toggle('on', v === val);
          b.onclick = () => {
            def.params[c.key] = v;
            seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
          };
          seg.appendChild(b);
        });
        out.remove();
        wrap.appendChild(seg);
        return wrap;
      }
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', min: c.min, max: c.max, step: c.step, value: val });
      const sync = () => {
        const v = parseFloat(input.value);
        def.params[c.key] = v;
        out.textContent = c.fmt ? c.fmt(v) : v;
        input.style.setProperty('--p', ((v - c.min) / (c.max - c.min)) * 100 + '%');
      };
      input.oninput = sync;
      sync();
      wrap.appendChild(input);
      return wrap;
    }

    function render(def) {
      current = def;
      panel.classList.add('swap');
      setTimeout(() => {
        $('p-kicker').textContent = `${def.num} · ${def.kicker}`;
        $('p-title').textContent = def.title;
        linesEl.className = 'lines' + (def.steps ? ' steps' : '');
        linesEl.innerHTML = def.lines.map((l) => `<li>${l}</li>`).join('');
        controlsEl.innerHTML = '';
        (def.controls || []).forEach((c) => controlsEl.appendChild(control(def, c)));
        panel.scrollTop = 0;
        panel.classList.remove('swap');
      }, 180);
      navButtons.forEach((b, i) => b.classList.toggle('on', i === D.index));
      try { history.replaceState(null, '', '#' + def.id); } catch (e) { /* file:// may refuse */ }
      $('btn-prev').style.visibility = D.index === 0 ? 'hidden' : 'visible';
      $('btn-next').textContent = D.index === D.EXPLORE.length - 1 ? '▶ Watch the film' : 'Next →';
      if (def.id === 'play' || (def.id === 'timing' && innerWidth < 760)) { panel.classList.add('collapsed'); autoCollapsed = true; }
      else if (autoCollapsed) { panel.classList.remove('collapsed'); autoCollapsed = false; }
      lastHud = '';
    }
    D.listeners.push(() => { if (D.mode === 'explore') render(D.def); });

    $('btn-prev').onclick = () => D.goTo(D.index - 1);
    $('btn-next').onclick = () => (D.index === D.EXPLORE.length - 1 ? startFilm(false) : D.goTo(D.index + 1));
    $('btn-collapse').onclick = () => panel.classList.toggle('collapsed');

    // film + recording
    const recBtn = $('btn-record'), exitBtn = $('btn-film-exit');
    if (!recorder.supported) {
      recBtn.disabled = true;
      recBtn.title = 'Video recording is not supported in this browser';
    } else recBtn.title = 'Plays the film at 1920×1080 and saves it as a video file';

    function startFilm(record) {
      document.body.classList.add('film');
      if (record) {
        SURF.main.setFixedSize(1920, 1080);
        if (!recorder.start()) { SURF.main.setFixedSize(null); record = false; }
      }
      $('rec-badge').hidden = !record;
      exitBtn.textContent = record ? '■ Stop & save video' : 'Exit film · Esc';
      D.startFilm();
    }
    D.onFilmEnd = () => {
      document.body.classList.remove('film');
      $('rec-badge').hidden = true;
      if (recorder.active) {
        recorder.stop();
        SURF.main.setFixedSize(null);
      }
    };
    $('btn-film').onclick = () => startFilm(false);
    $('btn-play').onclick = (e) => { e.currentTarget.blur(); D.goTo(D.EXPLORE.indexOf('play')); };
    recBtn.onclick = () => startFilm(true);
    exitBtn.onclick = () => D.stopFilm(false);

    // tilt steering chip (phones, play chapter only). Enabling must happen inside the tap for iOS.
    const tiltBtn = $('btn-tilt');
    const tiltLabel = (on) => { tiltBtn.textContent = `📱 Tilt to steer: ${on ? 'on' : 'off'}`; tiltBtn.setAttribute('aria-pressed', on); };
    tiltBtn.onclick = () => {
      const I = SURF.gameInput;
      tiltBtn.blur();
      if (I.tilt.on) { I.disableTilt(); tiltLabel(false); return; }
      I.enableTilt().then((err) => {
        if (!err) { tiltLabel(true); return; }
        tiltBtn.textContent = `📱 ${err}`;
        setTimeout(() => tiltLabel(I.tilt.on), 3000);
      });
    };
    const syncTilt = () => { tiltBtn.hidden = !(SURF.gameInput && SURF.gameInput.canTilt && D.mode === 'explore' && D.def.id === 'play'); };
    D.listeners.push(syncTilt);

    $('btn-sound').onclick = (e) => {
      const on = audio.toggle();
      const b = e.currentTarget;
      b.setAttribute('aria-pressed', on);
      b.querySelector('.txt').textContent = on ? 'Sound on' : 'Sound off';
    };

    addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' && e.key !== 'Escape') return;
      if (e.key === 'Escape') D.stopFilm(false);
      if (D.mode !== 'explore' || D.def.id === 'play') return;
      if (e.key === 'ArrowRight') D.goTo(D.index + 1);
      if (e.key === 'ArrowLeft') D.goTo(D.index - 1);
    });

    function renderHud() {
      const h = S.hud;
      if (!h || D.mode !== 'explore') { hudEl.hidden = true; return; }
      hudEl.hidden = false;
      const rows = h.rows.map(([k, v]) => `<div class="hud-row"><span>${k}</span><b>${v}</b></div>`).join('');
      if (rows !== lastHud) { $('hud-rows').innerHTML = rows; lastHud = rows; }
      const hasMeter = h.meter != null;
      $('hud-meter').hidden = !hasMeter;
      if (hasMeter) {
        $('hud-fill').style.width = (h.meter * 100).toFixed(1) + '%';
        $('hud-mark').style.left = h.mark * 100 + '%';
        $('hud-mlabel').textContent = h.mlabel;
        $('hud-mnote').textContent = h.mnote;
      }
      $('hud-state').textContent = h.state;
    }

    return {
      update(dt) {
        if (D.mode === 'film') {
          $('film-progress').style.width = (S.film.progress * 100).toFixed(2) + '%';
          if (recorder.active) {
            const s = Math.floor((performance.now() - recorder.startedAt) / 1000);
            $('rec-time').textContent = `REC ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
          }
          return;
        }
        if (current) {
          const lis = linesEl.children;
          for (let i = 0; i < lis.length; i++) lis[i].classList.toggle('active', i === S.activeLine);
        }
        hudTick += dt;
        if (hudTick > 0.1) { hudTick = 0; renderHud(); }
      },
    };
  };
})();
