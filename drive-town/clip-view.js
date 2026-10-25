import { routeFor } from './routes.js';
import { laneCamera } from './lane-camera.js';

// Draws one frame of a recorded hazard clip in the world. The Hazard test and the exam scenes share it.
// `run` comes from recordClip. A canvas taller than wide gets a wider view (clipFov). `instant` snaps the chase camera instead of gliding.
export function showClipFrame(world, actors, run, snapshot, instant) {
  const mission = run.session.mission, route = routeFor(mission);
  world.setArea(route.area, route.view);
  world.updateLesson(run.session, snapshot); actors.update(run.session, snapshot);
  world.render(actors.player, 'chase', snapshot.time, route.at(mission.gate), instant, false, null, snapshot.speed, laneCamera(mission, snapshot), null, true);
}
