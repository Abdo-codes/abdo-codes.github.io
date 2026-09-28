/* Procedural ocean ambience (no audio files): surf rumble, wind hiss, and crashes.
   Also exposes a MediaStream so recordings can include the sound. */
(function () {
  const SURF = window.SURF;

  SURF.createAudio = function () {
    const api = { enabled: false, stream: null };
    let ctx, master, surfG, windG, windF, crashG, crash = 0;

    function noise(brown) {
      const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
      return buf;
    }
    function loop(buf, offset) {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start(0, offset || 0);
      return s;
    }
    function filter(type, freq, q) {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      if (q) f.Q.value = q;
      return f;
    }
    function gain() { const g = ctx.createGain(); g.gain.value = 0; return g; }

    function build() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      if (ctx.createMediaStreamDestination) {
        const dest = ctx.createMediaStreamDestination();
        master.connect(dest);
        api.stream = dest.stream;
      }
      const brown = noise(true), white = noise(false);
      surfG = gain();
      loop(brown).connect(filter('lowpass', 650)).connect(surfG).connect(master);
      windF = filter('bandpass', 900, 0.7);
      windG = gain();
      loop(white).connect(windF).connect(windG).connect(master);
      crashG = gain();
      loop(brown, 1.7).connect(filter('lowpass', 2400)).connect(crashG).connect(master);
    }

    api.toggle = function () {
      if (!ctx) build();
      api.enabled = !api.enabled;
      if (api.enabled) ctx.resume();
      master.gain.setTargetAtTime(api.enabled ? 0.9 : 0, ctx.currentTime, 0.15);
      return api.enabled;
    };

    api.update = function (S, dt) {
      const snd = S.sound;
      if (snd.crash > crash) crash = snd.crash;
      snd.crash = 0;
      crash *= Math.exp(-dt * 0.9);
      if (!ctx) return;
      const t = ctx.currentTime;
      const pulse = 0.6 + 0.4 * Math.pow(Math.sin(S.t * 0.9), 2);
      surfG.gain.setTargetAtTime(0.55 * snd.surf * pulse, t, 0.3);
      windG.gain.setTargetAtTime(0.16 * snd.wind, t, 0.4);
      windF.frequency.setTargetAtTime(700 + 900 * snd.wind, t, 0.5);
      crashG.gain.setTargetAtTime(0.75 * crash, t, 0.08);
    };

    return api;
  };
})();
