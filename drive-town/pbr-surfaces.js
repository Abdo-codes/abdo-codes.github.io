import * as THREE from './vendor/three.module.js';

// Scanned maps are bundled locally; no network connection is needed during play.
export const PBR_SURFACES = {
  asphalt: { asset: 'aerial_asphalt_01', scale: [30, 30], tint: '#eeeeee', normal: .32 },
  brick: { asset: 'red_brick_03', scale: [1, 1], tint: '#ffffff', normal: .65 },
  grass: { asset: 'leafy_grass', scale: [2, 2], tint: '#96ad81', normal: .25 },
  roof: { asset: 'grey_roof_01', scale: [8, 8], tint: '#ffffff', normal: .6 },
  paving: { asset: 'pavement_01', scale: [1.5, 1.5], tint: '#eeeeee', normal: .45 },
};
const maps = new Map();
export async function loadSurfaceMaps() {
  const loader = new THREE.TextureLoader();
  await Promise.all(Object.entries(PBR_SURFACES).map(async ([kind, spec]) => {
    const loaded = await Promise.all(['diff', 'nor_gl', 'rough'].map(async name => {
      const map = await loader.loadAsync(new URL(`./assets/surfaces/${spec.asset}_${name}.jpg`, import.meta.url).href);
      map.colorSpace = name === 'diff' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 4;
      return map;
    }));
    maps.set(kind, { map: loaded[0], normalMap: loaded[1], roughnessMap: loaded[2],
      normalScale: new THREE.Vector2(spec.normal, spec.normal) });
  }));
}
export function scannedSurface(kind) { return maps.get(kind); }
export function surfaceTint(kind, color) {
  if (kind === 'asphalt' && color === '#879094') return PBR_SURFACES.asphalt.tint;
  if (kind === 'grass') return PBR_SURFACES.grass.tint;
  if (kind === 'roof') return new THREE.Color(color).lerp(new THREE.Color('#ffffff'), .7);
  if (kind === 'paving') return '#eeeeee';
  // Keep brick variations subtle: the photograph already contains the brick colour.
  if (kind === 'brick') return new THREE.Color(color).lerp(new THREE.Color('#ffffff'), .72);
  return color;
}
