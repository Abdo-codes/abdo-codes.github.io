/* Director: runs one chapter at a time. In explore mode the user picks chapters; in film mode
   it plays a fixed sequence with title cards, timed subtitles and fades. */
(function () {
  const SURF = window.SURF;

  SURF.createDirector = function (S, rig) {
    const C = SURF.chapters, U = SURF.util;
    const EXPLORE = ['wind', 'breaking', 'anatomy', 'breaks', 'ride', 'timing', 'forecast', 'safety', 'play'];
    const FILM = [['intro', 7], ['wind', 26], ['breaking', 30], ['anatomy', 26], ['breaks', 22], ['ride', 26], ['timing', 30], ['safety', 24], ['outro', 8]];
    const TOTAL = FILM.reduce((a, f) => a + f[1], 0);
    for (const d of Object.values(C)) if (d.params) d.defaults = { ...d.params };

    const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
    const D = { EXPLORE, FILM, TOTAL, mode: 'explore', index: 0, def: null, ct: 0, film: null, listeners: [], onFilmEnd: null };

    function enter(def, film) {
      if (D.def && D.def.leave) D.def.leave(S);
      SURF.resetScene();
      if (film && def.defaults) Object.assign(def.params, def.defaults);
      D.def = def;
      D.ct = 0;
      def.enter(S, film);
      rig.reset();
      rig.snap = true;
      rig.interactive = !film;
      rig.orbit = !film && !def.noOrbit;
      S.captionIndex = film ? -1 : 99;
      D.listeners.forEach((f) => f(D));
    }

    D.goTo = (i) => {
      D.index = (i + EXPLORE.length) % EXPLORE.length;
      enter(C[EXPLORE[D.index]], false);
    };

    D.startFilm = () => {
      D.mode = 'film';
      D.film = { i: 0, elapsed: 0, cap: -2, capT: 0 };
      S.film.active = true;
      enter(C[FILM[0][0]], true);
    };

    D.stopFilm = (completed) => {
      if (D.mode !== 'film') return;
      D.mode = 'explore';
      D.film = null;
      S.film.active = false;
      D.goTo(D.index);
      if (D.onFilmEnd) D.onFilmEnd(!!completed);
    };

    function filmStep(dt) {
      const F = D.film, dur = FILM[F.i][1], def = D.def, ct = D.ct, SF = S.film;
      const card = !def.num;
      SF.titleStyle = card ? 'hero' : 'chapter';
      const tIn = card ? 0.9 : 0.5, tOut = card ? dur - 1.4 : 3.9;
      SF.title = {
        kicker: def.num ? `${def.num} · ${def.kicker}` : def.kicker,
        text: def.title,
        sub: def.subtitle || '',
        alpha: U.ss(tIn, tIn + 0.8, ct) * (1 - U.ss(tOut, tOut + 0.7, ct)),
      };
      const n = def.lines ? def.lines.length : 0;
      let idx = -1;
      if (n) {
        if (def.captionIndex) idx = def.captionIndex(S);
        else if (ct > 3.8) idx = Math.min(n - 1, Math.floor((ct - 3.8) / ((dur - 4.4) / n)));
      }
      if (idx !== F.cap) { F.cap = idx; F.capT = 0; }
      F.capT += dt;
      S.captionIndex = idx;
      SF.caption = {
        text: idx >= 0 ? def.lines[idx] : '',
        alpha: U.ss(0, 0.45, F.capT) * (1 - SF.title.alpha) * (1 - U.ss(dur - 0.9, dur - 0.3, ct)),
      };
      SF.progress = (F.elapsed + ct) / TOTAL;
      S.fade = Math.max(S.fade, 1 - U.ss(0, 0.8, ct), U.ss(dur - 0.8, dur, ct));
      if (ct >= dur) {
        F.elapsed += dur;
        F.i++;
        if (F.i >= FILM.length) { D.stopFilm(true); return; }
        enter(C[FILM[F.i][0]], true);
      }
    }

    D.update = (dt) => {
      const sdt = dt * S.timeScale;
      SURF.wave.advance(sdt);
      S.fade = 0;
      D.def.update(S, D.ct, sdt, dt);
      if (D.mode === 'film') filmStep(dt);
      D.def.camera(S, D.ct, cam);
      if (S.camSnap) { rig.snap = true; rig.reset(); S.camSnap = false; }
      rig.desiredPos.copy(cam.pos);
      rig.desiredTarget.copy(cam.target);
      rig.update(dt);
      S.focus.copy(rig.target);
      D.ct += dt;
      return sdt;
    };

    return D;
  };
})();
