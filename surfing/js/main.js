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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(SURF.util.srgb(0xf2ac7c), 140, 1100);
  const camera = (SURF.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 6000));

  const sky = SURF.createSky(scene, renderer);
  sky.captureEnv(); // sky → environment map for reflections and lighting
  SURF.createWaterTextures(renderer);
  const ocean = SURF.createOcean(scene);
  const seabed = SURF.createSeabed(scene);
  SURF.particles = SURF.createParticles(scene);
  const spray = SURF.createSpray(scene);
  SURF.surfer = SURF.createSurfer(scene);
  SURF.surfer2 = SURF.createSurfer(scene, { vest: 0xf2b134, stripe: 0x2a73d9, board: 0xdcefff });
  SURF.rip = SURF.createRip(scene);
  SURF.gameInput = SURF.createGameInput(stage);
  const post = SURF.createPost(renderer, scene, camera);

  // soft sun shadows, from a small shadow camera that follows the surfer
  const sun = SURF.sunLight;
  Object.assign(sun.shadow.camera, { left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 1, far: 60 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  function setShadows(size) {
    sun.castShadow = size > 0;
    if (size > 0 && sun.shadow.mapSize.x !== size) {
      sun.shadow.mapSize.set(size, size);
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    }
  }
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
    setShadows,
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
  // real people replace the sculpted surfers once their models have arrived
  SURF.humansReady = Promise.all([SURF.loadHuman(SURF.surfer, 'models/surfer_m.glb'), SURF.loadHuman(SURF.surfer2, 'models/surfer_f.glb')]);

  // the wave shades the surfer: with the sun behind it, direct light is blocked by the crest and
  // what gets through is filtered teal by the water. March toward the sun and see if we hit water.
  const glow = new THREE.DirectionalLight(SURF.util.srgb(0x6fd6c0), 0);
  scene.add(glow, glow.target);
  const ray = new THREE.Vector3(), surf = new THREE.Vector3();
  let shade = 0;
  function waveShade(dt) {
    const p = SURF.surfer.root.position;
    let hit = 0;
    for (let i = 1; i <= 10; i++) {
      ray.copy(p).addScaledVector(SURF.sunDir, i * 1.2);
      ray.y += 1.0; // test from about chest height
      SURF.wave.surface(ray.x, ray.z, surf);
      if (surf.y > ray.y) { hit = 1; break; }
    }
    shade += (hit - shade) * Math.min(1, dt * 4);
    sun.intensity = 2.6 * (1 - 0.85 * shade);
    glow.intensity = 0.75 * shade;
    glow.position.copy(sun.position);
    glow.target.position.copy(p);
    glow.target.updateMatrixWorld();
  }

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

  // keep the loading screen up until the real surfers have arrived (at most 6 s on a slow connection)
  let humansIn = false, shown = false;
  Promise.race([SURF.humansReady, new Promise((r) => setTimeout(r, 6000))]).then(() => { humansIn = true; });
  let last = performance.now(), frames = 0;
  function frame(now) {
    const raw = (now - last) / 1000, dt = Math.min(0.05, raw);
    last = now;
    quality.frame(raw);
    step(dt);
    if (++frames >= 3 && humansIn && !shown) { shown = true; loading.classList.add('done'); }
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
    for (const s of [SURF.surfer, SURF.surfer2]) if (s.human && s.root.visible) s.human.sync();
    if (S.surferVisible) {
      sun.target.position.copy(SURF.surfer.root.position);
      sun.position.copy(sun.target.position).addScaledVector(SURF.sunDir, 30);
      sun.target.updateMatrixWorld();
      if (S.waveShade) waveShade(dt);
      else { sun.intensity = 2.6; glow.intensity = 0; }
    } else {
      sun.intensity = 2.6;
      glow.intensity = 0;
    }
    updateUnder(dt);
    sky.update(camera, S.t);
    audio.update(S, dt);
    if (post && post.enabled) post.render(S, dt, underS, camera.position.distanceTo(rig.target));
    else renderer.render(scene, camera);
    const unit = S.film.active ? ovCanvas.height / 1080 : SURF.cssScale;
    inset.render(S, unit);
    overlay.draw(S, unit);
    recorder.frame();
    ui.update(dt);
  }
  SURF.step = step;
  requestAnimationFrame(frame);
})();
