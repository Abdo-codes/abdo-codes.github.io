export function renderProfile(width, pixelRatio = 1) {
  const compact = width <= 800;
  return { tier: compact ? 'compact' : 'desktop', pixelRatio: Math.min(pixelRatio, compact ? 1.25 : 1.7), shadowSize: compact ? 1024 : 2048 };
}
export function recordFrames(canvas, renderer) {
  if (!new URLSearchParams(location.search).has('profile')) return () => {};
  let last = performance.now(), warmup = 90, intervals = [], sampleCount = 0;
  return () => {
    const now = performance.now(), interval = now - last; last = now;
    if (document.hidden || interval > 250) { intervals = []; return; }
    if (warmup-- > 0) return;
    intervals.push(interval); sampleCount++; if (intervals.length > 300) intervals.shift();
    if (intervals.length < 120 || sampleCount % 30 !== 0) return;
    const sorted = intervals.toSorted((a, b) => a - b);
    const average = intervals.reduce((a, b) => a + b) / intervals.length;
    canvas.dataset.renderStats = JSON.stringify({ samples: intervals.length,
      fps: +(1000 / average).toFixed(1), medianMs: +sorted[Math.floor(sorted.length * .5)].toFixed(2),
      p95Ms: +sorted[Math.floor(sorted.length * .95)].toFixed(2),
      drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      textures: renderer.info.memory.textures, pixelRatio: renderer.getPixelRatio(),
      width: canvas.clientWidth, height: canvas.clientHeight });
  };
}
