import * as THREE from './vendor/three.module.js';
import { box, cylinder, sphere, tree, material } from './art.js';
import { building, streetLamp, bench, speedSign } from './buildings.js';
import { routeAt, ROUTE_LENGTH } from './route.js';
import { renderProfile, recordFrames } from './render-profile.js';
import { streetSection } from './street-section.js';
import { textured } from './surfaces.js';
import { daylight } from './lighting.js';
import { streetDetail } from './street-detail.js';
import { batchTown } from './batching.js';
import { createLessonScenery } from './lesson-scenery.js';
import { createPavements } from './pavements.js';
import { busBay } from './bus-bay.js';
import { createRoundabouts } from './roundabout-scenery.js';
import { createMergeAreas } from './merge-scenery.js';
import { createStreetAreas, setStreetView } from './street-scenery.js';
import { createStreetAids } from './street-aids.js';
import { createGapMarker, updateGapMarker } from './merge-gap-marker.js';
import { distantTown } from './distant-town.js';
import { parkingSign } from './facade-detail.js';
import { frameDecision } from './decision-camera.js';
import { drivingView, cameraBlend, clipFov, BASE_FOV } from './camera-modes.js';

function road(parent, width, depth, x, z) {
  textured(box(parent, width + 2.5, .2, depth + 2.5, x, .01, z, '#c8c4bb', false), 'paving', '#c8c4bb');
  textured(box(parent, width, .04, depth, x, .15, z, '#879094', false), 'asphalt', '#879094');
}

function line(parent, w, d, x, z, color = '#f0e9d5') {
  return box(parent, w, .014, d, x, .185, z, color, false);
}

function createTown(scene) {
  const town = new THREE.Group(); scene.add(town);
  textured(box(town, 300, .6, 280, 0, -.2, 0, '#899574', false), 'grass', '#899574');
  road(town, 82, 10, 0, 26); road(town, 82, 10, 0, -26);
  road(town, 10, 52, -38, 0); road(town, 10, 52, 38, 0);
  road(town, 10, 54, -8, 26);
  // The right-hand branch is an equal-priority road: no give-way marks.
  for (let x = -33; x <= 33; x += 5) {
    if (Math.abs(x + 8) > 8) line(town, 2.1, .12, x, 26);
    line(town, 2.1, .12, x, -26);
  }
  for (let z = -18; z <= 18; z += 5) {
    if (Math.abs(z - 2) > 4) line(town, .12, 2.1, -38, z);
    line(town, .12, 2.1, 38, z);
  }
  // Crossing stripes extend across both lanes.
  for (let x = -42.5; x < -33.4; x += .8) line(town, .45, 4.1, x, 2);
  textured(line(town, 3.2, 59, -30.8, -10, '#ce9889'), 'asphalt', '#ce9889');
  // Bakery bay and its entry across the footpath.
  textured(box(town, 9, .08, 9, 11, .14, -17.5, '#b9b6ad', false), 'paving', '#b9b6ad');
  for (const x of [7, 15]) line(town, .12, 7, x, -17.5);
  line(town, 8, .12, 11, -14);
  parkingSign(town, 17, -15);
  // Navigation dots follow the actual assisted route.
  const routeMaterial = new THREE.MeshBasicMaterial({ color: '#78cbd1', transparent: true, opacity: .8, toneMapped: false });
  for (let d = 0; d < ROUTE_LENGTH; d += 3) {
    const p = routeAt(d);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(.12, 8), routeMaterial);
    dot.rotation.x = -Math.PI / 2; dot.position.set(p.x, .206, p.z); town.add(dot);
  }
  const firstSigns = new THREE.Group(); scene.add(firstSigns);
  createPavements(town, firstSigns);
  speedSign(firstSigns, 18, 20.5, Math.PI / 2); speedSign(firstSigns, -44, 16, 0);
  speedSign(firstSigns, -18, -20.5, -Math.PI / 2);
  // A small central park, canal and quiet neighbourhood buildings.
  textured(box(town, 31, .04, 27, 9, .115, 1, '#809363', false), 'grass', '#809363');
  textured(box(town, 3, .06, 28, 7, .13, 1, '#d4c8af', false), 'gravel', '#d4c8af');
  textured(box(town, 32, .06, 2.8, 9, .13, 5, '#d4c8af', false), 'gravel', '#d4c8af');
  const pond = cylinder(town, 4.2, .09, 17, .115, -4, '#486e7a'); pond.scale.z = .66;
  pond.material = material('#477785', { metalness: .4, roughness: .19 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.2, .12, 10, 64), material('#a9aba5'));
  rim.rotation.x = Math.PI / 2; rim.scale.y = .66; rim.position.set(17,.2,-4); rim.castShadow = true; town.add(rim);
  cylinder(town, .45, .12, 17, .17, -4, '#e8e2c5');
  sphere(town, .28, 17, .48, -4, '#eee7ce', [1, 1.3, 1]);
  const canal = box(town, 9, .08, 150, -66, .085, 0, '#4d7787', false);
  canal.material = material('#4d7787', { metalness: .45, roughness: .22 });
  for (const x of [-71, -61]) box(town, .8, .5, 150, x, .09, 0, '#d3cab3', false);
  const colors = ['#b99177', '#a87561', '#ba8971', '#b5ad9c', '#c4aa8e', '#947360'];
  for (let i = 0; i < 8; i++) {
    const x = -34 + i * 9;
    // Keep a railway corridor between the central frontages.
    const frontageX = x === 2 ? 3.5 : x === -7 ? -8.5 : x;
    if (Math.abs(x + 8) > 7) building(town, { x: frontageX, z: 39, width: 6.9, height: 6.8 + i % 3, color: colors[i % 6], variant: (i + 2) % 6, facing: Math.PI });
    building(town, { x: frontageX, z: -40, width: 6.7, height: 7 + i % 3, color: colors[(i + 2) % 6], variant: i % 6, shop: i === 5 ? 'FLOWERS' : '' });
  }
  for (let i = 0; i < 4; i++) {
    building(town, { x: -51, z: i === 0 ? -34 : -18 + i * 11, width: 7, height: 7 + i % 2, color: colors[i], facing: Math.PI / 2 });
    building(town, { x: 52, z: -19 + i * 12, width: 8, height: 7.5, color: colors[(i + 3) % 6], facing: -Math.PI / 2 });
  }
  building(town, { x: 12, z: -9, width: 9, depth: 6, height: 6.4, color: '#b69b7e', facing: Math.PI, shop: 'BAKKERIJ' });
  building(town, { x: -20, z: 10, width: 6, depth: 5, height: 5.5, color: '#b2a18a', facing: Math.PI, shop: 'KOFFIE' });
  for (const [x, z, size] of [[-23,-6,1.2],[22,12,1.3],[16,14,1],[0,12,.8],[27,-9,1.1],[-19,-10,1],
    [-24,17,.8],[28,17,.8],[-56,30,1.1],[-57,-32,1.2],[45,33,1],[44,-33,1.3]]) tree(town, x, z, size);
  for (let i = 0; i < 14; i++) tree(town, -85 + i * 13, -64 - (i % 3) * 7, 1.5 + i % 2 * .3, '#7f9d79');
  bench(town, 3, 9, Math.PI / 2); bench(town, 20, 2); bench(town, -21, 17);
  for (const x of [-27, 4, 29]) { streetLamp(town, x === 4 ? 14.5 : x, 20.1); streetLamp(town, x, -20.3, Math.PI); }
  for (const z of [-13, 13]) { streetLamp(town, -32.5, z); streetLamp(town, 32.5, z, Math.PI); }
  for (const [x, z] of [[4,14],[22,6],[-23,14],[16,-14],[19,-14]]) {
    cylinder(town, .6, .5, x, .3, z, '#bd8667');
    sphere(town, .65, x, .7, z, '#719569', [1,.5,1]);
    for (let i = 0; i < 4; i++) sphere(town, .12, x + Math.cos(i * 2) * .3, 1, z + Math.sin(i * 2) * .3, '#e4b375');
  }
  busBay(town); streetSection(town); distantTown(town); streetDetail(town, firstSigns); batchTown(town);
  return firstSigns;
}

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(renderProfile(window.innerWidth, window.devicePixelRatio).pixelRatio);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  const scene = new THREE.Scene(); const sun = daylight(scene, renderer);
  const updateLesson = createLessonScenery(scene, createTown(scene));
  createRoundabouts(scene); createMergeAreas(scene);
  const streets = createStreetAreas(scene), aids = createStreetAids(scene), baseFog = { near: scene.fog.near, far: scene.fog.far };
  const gapMarker = createGapMarker(scene);
  let area = { x: 0, z: 0 }, view = null;
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 220);
  camera.position.set(67, 73, 77); camera.lookAt(0, 0, 0);
  const beacon = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.65, .018, 6, 32),
    new THREE.MeshBasicMaterial({ color: '#78cbd1', transparent: true, opacity: .55, toneMapped: false }));
  ring.rotation.x = Math.PI / 2; ring.position.y = .213; beacon.add(ring); scene.add(beacon);
  const cameraTarget = new THREE.Vector3(), measureFrame = recordFrames(canvas, renderer);
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    renderer.setSize(width, height, false); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();
  let renderCount = 0, lastShadowTime = -1, shadowMode = null, shadowSpan = 0, lastFrame = performance.now();
  function render(player, mode, elapsed, focus, instant = false, showBeacon = true, recordedActor = null, speed = 0, lane = null, lookView = null, wide = false) {
    const fov = wide ? clipFov(camera.aspect) : BASE_FOV;
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    const p = player.position, forward = new THREE.Vector3(0, 0, 1).applyQuaternion(player.quaternion);
    const { position: desired, target } = drivingView(p, forward, mode, speed, area, view, lane, lookView, camera.aspect);
    const now = performance.now(), blend = instant ? 1 : cameraBlend((now - lastFrame) / 1000); lastFrame = now;
    if (mode === 'decision') {
      const sceneRect = canvas.getBoundingClientRect();
      const card = canvas.parentElement.querySelector('.floating-card')?.getBoundingClientRect();
      const reservedRight = window.innerWidth > 800 && card ? Math.max(0, sceneRect.right - card.left + 12) : 0;
      frameDecision(camera, { player: p, forward, focus, actor: recordedActor,
        width: canvas.clientWidth, height: canvas.clientHeight, reservedRight });
      cameraTarget.copy(p);
    } else {
      camera.clearViewOffset();
      camera.position.lerp(desired, blend); cameraTarget.lerp(target, blend); camera.lookAt(cameraTarget);
    }
    beacon.visible = showBeacon;
    beacon.position.set(focus.x, 0, focus.z); ring.scale.setScalar(1 + Math.sin(elapsed * 2) * .035);
    const centre = mode === 'overview' ? new THREE.Vector3(area.x + (view?.centre ?? 0), 0, area.z) : p;
    const span = mode === 'overview' ? view?.span ?? 82 : 38;
    sun.position.copy(centre).add(new THREE.Vector3(-45, 62, 28)); sun.target.position.copy(centre);
    if (shadowMode !== mode || shadowSpan !== span) {
      shadowSpan = span;
      Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span });
      sun.shadow.camera.updateProjectionMatrix();
    }
    const moving = elapsed !== lastShadowTime || shadowMode !== mode;
    renderer.shadowMap.needsUpdate = instant || moving && renderCount++ % 3 === 0;
    if (renderer.shadowMap.needsUpdate) { lastShadowTime = elapsed; shadowMode = mode; }
    renderer.render(scene, camera); measureFrame();
  }
  // The overview camera and its shadows follow the neighbourhood of the current route (`route.view` is the overview window of a merge road).
  const setArea = (next, window = null) => { area = next ?? { x: 0, z: 0 }; view = window; };
  const updateMerge = (state, snapshot) => { updateGapMarker(gapMarker, state, snapshot); aids.update(state, snapshot); };
  // The street roads set a longer fog (an oncoming car can be 154 m away) and a longer camera range; other lessons restore the town values.
  function showLesson(state, display) {
    updateLesson(state, display);
    setStreetView(scene, camera, streets.update(state), baseFog);
  }
  return { scene, render, renderer, camera, updateLesson: showLesson, setArea, updateMerge, streets };
}
