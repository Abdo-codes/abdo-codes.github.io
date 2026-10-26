// Rectangle overlap of two road users { x, z, heading, width, length }, with an optional clearance in metres.
export function overlaps(a, b, clearance = 0) {
  const radius = (a.width + a.length + b.width + b.length) / 2 + clearance;
  if (Math.abs(a.x - b.x) > radius || Math.abs(a.z - b.z) > radius) return false;
  const forward = p => [Math.sin(p.heading), Math.cos(p.heading)];
  const right = p => [Math.cos(p.heading), -Math.sin(p.heading)];
  const af = forward(a), ar = right(a), bf = forward(b), br = right(b);
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
  const delta = [b.x - a.x, b.z - a.z];
  const extent = (p, f, r, axis) => Math.abs(dot(f, axis)) * p.length / 2 + Math.abs(dot(r, axis)) * p.width / 2;
  return [af, ar, bf, br].every(axis => Math.abs(dot(delta, axis)) < extent(a, af, ar, axis) + extent(b, bf, br, axis) + clearance);
}
