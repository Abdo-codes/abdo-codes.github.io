import * as THREE from './vendor/three.module.js';
import { scannedSurface, surfaceTint, PBR_SURFACES } from './pbr-surfaces.js';

const cache = new Map();
const textures = new Map();
function random(seed) {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}
function texture(kind) {
  if (textures.has(kind)) return textures.get(kind);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d'), rand = random(218 + kind.length);
  const base = { asphalt: 114, brick: 160, paving: 181, grass: 134, roof: 137, gravel: 166, wood: 163 }[kind];
  const pixels = ctx.createImageData(512, 512);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grain = (rand() - .5) * (kind === 'grass' ? 70 : 32);
    const value = base + grain;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value; pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  if (['brick', 'paving', 'roof'].includes(kind)) {
    const rows = kind === 'roof' ? 9 : 8, columns = kind === 'paving' ? 4 : 6;
    const h = 512 / rows, w = 512 / columns;
    ctx.lineWidth = kind === 'brick' ? 3 : 2;
    for (let row = 0; row < rows; row++) for (let col = -1; col <= columns; col++) {
      const x = col * w + (row % 2 ? w / 2 : 0), y = row * h;
      const shade = base + (rand() - .5) * 45;
      ctx.fillStyle = `rgba(${shade},${shade},${shade},.24)`; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      ctx.strokeStyle = kind === 'brick' ? '#b2aaa0' : '#565655'; ctx.strokeRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(245,245,245,.22)'; ctx.beginPath(); ctx.moveTo(x + 3, y + h - 3); ctx.lineTo(x + w - 3, y + h - 3); ctx.stroke();
    }
  } else if (kind === 'asphalt') {
    for (let i = 0; i < 30; i++) {
      const x = rand() * 512, y = rand() * 512;
      ctx.strokeStyle = 'rgba(24,26,28,.09)'; ctx.lineWidth = rand() * 3 + .4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rand() * 80 - 40, y + rand() * 70); ctx.stroke();
    }
  } else if (kind === 'wood') {
    for (let i = 0; i < 110; i++) {
      ctx.strokeStyle = `rgba(50,38,25,${rand() * .12})`; ctx.lineWidth = rand() * 3;
      const y = rand() * 512; ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(150, y + 4, 350, y - 4, 512, y); ctx.stroke();
    }
  }
  // Albedo is colour data; height and roughness are linear surface measurements.
  const heightCanvas = document.createElement('canvas'), roughCanvas = document.createElement('canvas');
  heightCanvas.width = heightCanvas.height = roughCanvas.width = roughCanvas.height = 512;
  const heightCtx = heightCanvas.getContext('2d'), roughCtx = roughCanvas.getContext('2d');
  const albedo = ctx.getImageData(0, 0, 512, 512), heights = ctx.createImageData(512, 512), roughness = ctx.createImageData(512, 512);
  for (let i = 0; i < albedo.data.length; i += 4) {
    const relief = Math.max(20, Math.min(235, 128 + (albedo.data[i] - base) * 2.4));
    const rough = Math.min(255, 225 + (rand() - .5) * 28);
    for (let channel = 0; channel < 3; channel++) {
      heights.data[i + channel] = relief; roughness.data[i + channel] = rough;
    }
    heights.data[i + 3] = roughness.data[i + 3] = 255;
  }
  heightCtx.putImageData(heights, 0, 0); roughCtx.putImageData(roughness, 0, 0);
  if (['brick', 'paving', 'roof'].includes(kind)) {
    const rows = kind === 'roof' ? 9 : 8, columns = kind === 'paving' ? 4 : 6, h = 512 / rows, w = 512 / columns;
    heightCtx.strokeStyle = '#252525'; heightCtx.lineWidth = kind === 'brick' ? 3 : 2;
    for (let row = 0; row < rows; row++) for (let col = -1; col <= columns; col++) {
      heightCtx.strokeRect(col * w + (row % 2 ? w / 2 : 0), row * h, w, h);
    }
  }
  const makeMap = (source, colorSpace = THREE.NoColorSpace) => {
    const result = new THREE.CanvasTexture(source); result.colorSpace = colorSpace;
    result.wrapS = result.wrapT = THREE.RepeatWrapping; result.anisotropy = 8; return result;
  };
  const result = { map: makeMap(canvas, THREE.SRGBColorSpace), bumpMap: makeMap(heightCanvas), roughnessMap: makeMap(roughCanvas) };
  textures.set(kind, result); return result;
}
export function surface(kind, color) {
  const key = kind + color;
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshStandardMaterial({ color: surfaceTint(kind, color), ...(scannedSurface(kind) ?? texture(kind)),
      bumpScale: kind === 'brick' ? .018 : kind === 'paving' ? .012 : kind === 'roof' ? .024 : .006,
      roughness: kind === 'roof' ? .88 : 1 }));
  }
  return cache.get(key);
}
export function textured(mesh, kind, color) {
  mesh.material = surface(kind, color);
  const positions = mesh.geometry.attributes.position, normals = mesh.geometry.attributes.normal, uv = mesh.geometry.attributes.uv;
  const scale = PBR_SURFACES[kind]?.scale ?? (kind === 'brick' ? [1.5, .6] : kind === 'roof' ? [1.3, 1.4] : kind === 'paving' ? [1.8, 1.8] : [3, 3]);
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(normals.getX(i)), ny = Math.abs(normals.getY(i)), nz = Math.abs(normals.getZ(i));
    if (ny > nx && ny > nz) uv.setXY(i, positions.getX(i) / scale[0], positions.getZ(i) / scale[1]);
    else if (nx > nz) uv.setXY(i, positions.getZ(i) / scale[0], positions.getY(i) / scale[1]);
    else uv.setXY(i, positions.getX(i) / scale[0], positions.getY(i) / scale[1]);
  }
  return mesh;
}
export { random };
