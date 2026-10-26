// Animation follows travelled distance, so waiting actors keep their wheels still.
export function rollWheels(actor) {
  if (!actor.userData.wheels?.length) return;
  const previous = actor.userData.wheelPosition;
  const p = actor.position;
  if (previous) {
    const dx = p.x - previous.x, dz = p.z - previous.z;
    const travelled = Math.hypot(dx, dz);
    if (travelled < 2) {
      const sign = Math.sign(dx * Math.sin(actor.rotation.y) + dz * Math.cos(actor.rotation.y));
      for (const wheel of actor.userData.wheels) wheel.rotation.x += sign * travelled / .47;
    }
  }
  actor.userData.wheelPosition = { x: p.x, z: p.z };
}
