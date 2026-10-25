import * as THREE from './vendor/three.module.js';
import { box, cylinder } from './art.js';

const windows = new Map();
export function windowGlass(variant = 0) {
  const key = Math.abs(Math.round(variant)) % 4;
  if (windows.has(key)) return windows.get(key);
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const room = ctx.createLinearGradient(0, 0, 0, 256);
  room.addColorStop(0, ['#25333b', '#3b3930', '#34434a', '#292f34'][key]);
  room.addColorStop(1, ['#596368', '#80745c', '#737b79', '#464e52'][key]);
  ctx.fillStyle = room; ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = '#222a2c'; ctx.fillRect(14, 88, 100, 13); ctx.fillRect(18, 192, 95, 37);
  if (key < 2) {
    for (const x of [0, 99]) {
      const curtain = ctx.createLinearGradient(x, 0, x + 29, 0);
      curtain.addColorStop(0, '#b0aca1'); curtain.addColorStop(.45, '#d2caba'); curtain.addColorStop(1, '#8e8d85');
      ctx.fillStyle = curtain; ctx.fillRect(x, 0, 29, 246);
      ctx.fillStyle = '#666b6344'; for (let stripe = x; stripe < x + 29; stripe += 7) ctx.fillRect(stripe, 0, 2, 245);
    }
  } else if (key === 2) {
    ctx.fillStyle = '#d1d0be'; ctx.fillRect(0, 0, 128, 73);
    ctx.strokeStyle = '#939a91'; ctx.lineWidth = 2;
    for (let y = 7; y < 73; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke(); }
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const glass = new THREE.MeshStandardMaterial({ color: '#d1d7d5', map, metalness: .22, roughness: .24, envMapIntensity: .95 });
  windows.set(key, glass); return glass;
}

// A physical sign face stays flush with the wall instead of billboarding toward the camera.
export function shopSign(parent, title, width, height, x, y, z) {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 128;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#344740'; ctx.fillRect(0, 0, 1024, 128);
  ctx.strokeStyle = '#b9b5a5'; ctx.lineWidth = 2; ctx.strokeRect(13, 11, 998, 106);
  ctx.fillStyle = '#eee6d4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 83px sans-serif';
  ctx.fillText(title, 512, 66, 900);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map, roughness: .82 }));
  panel.position.set(x, y, z); panel.receiveShadow = true; parent.add(panel); return panel;
}

export function parkingSign(parent, x, z) {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.rotation.y = Math.PI;
  cylinder(group, .045, 2.7, 0, 1.35, 0, '#747d79');
  box(group, 1.03, 1.18, .065, 0, 2.5, 0, '#87918d');
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 288;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#f0f0e9'; ctx.fillRect(0, 0, 256, 288);
  ctx.fillStyle = '#235377'; ctx.fillRect(10, 10, 236, 268);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 225px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', 128, 156);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.15), new THREE.MeshBasicMaterial({ map }));
  face.position.set(0, 2.5, .037); group.add(face); parent.add(group);
}
