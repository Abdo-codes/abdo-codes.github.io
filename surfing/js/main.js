/* Boot: renderer, scene, modules, resize and the frame loop. */
(function () {
  const SURF = window.SURF, S = SURF.state;
  const loading = document.getElementById('loading');

  if (!window.THREE || !window.WebGL2RenderingContext) {
    loading.classList.add('error');
    loading.querySelector('span').textContent = 'This page needs WebGL 2 and an internet connection to load three.js. Try a recent Chrome, Edge, Safari or Firefox.';
    return;
  }

  const stage = document.getElementById('stage');
  const glCanvas = document.getElementById('gl'), ovCanvas = document.getElementById('overlay');
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(SURF.util.srgb(0xf2ac7c), 140, 1100);
  const camera = (SURF.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 6000));

  const sky = SURF.createSky(scene);
  const ocean = SURF.createOcean(scene);
  const seabed = SURF.createSeabed(scene);
  SURF.particles = SURF.createParticles(scene);
  const spray = SURF.createSpray(scene);
  SURF.surfer = SURF.createSurfer(scene);
  SURF.surfer2 = SURF.createSurfer(scene, { vest: 0xf2b134, stripe: 0x2a73d9, board: 0xdcefff });
  SURF.rip = SURF.createRip(scene);
  SURF.gameInput = SURF.createGameInput(stage);
  const post = SURF.createPost(renderer, scene, camera);
  const inset = SURF.createInset({ renderer, scene, ocean, seabed, sky, canvas: glCanvas });
  const overlay = SURF.createOverlay(ovCanvas, camera);
  const rig = SURF.createRig(camera, stage);
  const audio = SURF.createAudio();
  const recorder = (SURF.recorder = SURF.createRecorder(glCanvas, ovCanvas, audio));
  const director = (SURF.director = SURF.createDirector(S, rig));

  let fixed = null, rScale = 1, rDpr = 1.75;
  function resize() {
    const ww = innerWidth, wh = innerHeight;
    let cw = ww, ch = wh;
    if (fixed) {
      const a = fixed.w / fixed.h;
      if (ww / wh > a) cw = wh * a; else ch = ww / a;
    }
    stage.style.width = cw + 'px';
    stage.style.height = ch + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, rDpr) * rScale;
    const bw = fixed ? fixed.w : Math.round(cw * dpr), bh = fixed ? fixed.h : Math.round(ch * dpr);
    renderer.setPixelRatio(1);
    renderer.setSize(bw, bh, false);
    ovCanvas.width = bw;
    ovCanvas.height = bh;
    camera.aspect = bw / bh;
    camera.fov = camera.aspect < 0.8 ? 64 : 50;
    camera.updateProjectionMatrix();
    spray.setScale(bh, camera.fov);
    if (post) post.setSize(bw, bh);
    SURF.cssScale = bw / cw;
  }
  SURF.main = {
    setFixedSize(w, h) { fixed = w ? { w, h } : null; resize(); },
    setRender(scale, dpr) { rScale = scale; rDpr = dpr; resize(); },
  };
  addEventListener('resize', resize);
  resize();

  const quality = (SURF.quality = SURF.createQuality({ ocean, post, main: SURF.main, recorder }));
  const ui = SURF.createUI({ S, director, recorder, audio });
  // deep links: #play, #ride, #safety … open that chapter directly
  const fromHash = () => {
    const i = director.EXPLORE.indexOf(location.hash.slice(1));
    if (i >= 0 && director.mode === 'explore' && i !== director.index) director.goTo(i);
  };
  director.goTo(Math.max(0, director.EXPLORE.indexOf(location.hash.slice(1))));
  addEventListener('hashchange', fromHash);
  if (/[?&]clean\b/.test(location.search)) document.body.classList.add('clean');

  // underwater camera: swap fog + tell the shaders
  const U = SURF.util, fogAir = scene.fog.color.clone(), fogWater = U.srgb(0x0b3a48), probe = new THREE.Vector3();
  let underS = 0;
  function updateUnder(dt) {
    let under = 0;
    if (S.allowUnder) {
      SURF.wave.surface(camera.position.x, camera.position.z, probe);
      under = camera.position.y < probe.y - 0.05 ? 1 : 0;
    }
    SURF.under.value = under;
    underS += (under - underS) * Math.min(1, dt * 10);
    scene.fog.color.copy(under ? fogWater : fogAir);
    scene.fog.near = under ? 1 : 140;
    scene.fog.far = under ? 55 : 1100;
  }

  let last = performance.now(), frames = 0;
  function frame(now) {
    const raw = (now - last) / 1000, dt = Math.min(0.05, raw);
    last = now;
    quality.frame(raw);
    step(dt);
    if (++frames === 3) loading.classList.add('done');
    requestAnimationFrame(frame);
  }
  /* one simulation + render step (exposed so a hidden tab can be driven for testing) */
  function step(dt) {
    const sdt = director.update(dt);
    ocean.update(S, camera);
    seabed.update();
    SURF.particles.update(dt);
    spray.update(dt, sdt);
    SURF.rip.update(dt, sdt);
    SURF.surfer.root.visible = S.surferVisible;
    SURF.surfer2.root.visible = S.surfer2Visible;
    updateUnder(dt);
    sky.update(camera, S.t);
    audio.update(S, dt);
    if (post && post.enabled) post.render(S, dt, underS); else renderer.render(scene, camera);
    const unit = S.film.active ? ovCanvas.height / 1080 : SURF.cssScale;
    inset.render(S, unit);
    overlay.draw(S, unit);
    recorder.frame();
    ui.update(dt);
  }
  SURF.step = step;
  requestAnimationFrame(frame);
})();
