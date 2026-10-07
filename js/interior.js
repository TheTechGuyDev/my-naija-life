'use strict';
/* =========================================================
   INTERIORS: walk-in rooms, stations, cutaway walls, scenes
   Interiors are built far from the city (x < -900 m) so the
   same camera, lighting and character code works inside.
   ========================================================= */
const IOX = -1000, IOZ = -420, ISLOT = 70;
const WALL_H = 2.8, WALL_T = 0.15;
let inside = null;
const intCache = {};
let sceneBusy = false;
const indoorLight = new THREE.PointLight(0xffefd6, 0, 16, 1.4);
scene.add(indoorLight);
const INDOOR_BG = new THREE.Color('#121212');

/* ---------- textures ---------- */
const ITEX = {};
function floorTexture(kind){
  if (ITEX[kind]) return ITEX[kind];
  let t;
  if (kind === 'tile') t = ctex(256, 256, (g, w, h) => {
    g.fillStyle = '#b9b2a4'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++){ g.fillStyle = (x + y) % 2 ? '#ece6da' : '#e3dccd'; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
    speckle(g, w, h, 1500, ['rgba(0,0,0,.04)', 'rgba(255,255,255,.08)'], 2);
  }, {repeat:true});
  else if (kind === 'terrazzo') t = ctex(256, 256, (g, w, h) => {
    g.fillStyle = '#d8d2c6'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 4000, ['#a39c90', '#7b746a', '#efe9de', '#b58d6a', '#6d7d6a'], 3);
    g.strokeStyle = 'rgba(80,70,60,.35)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  }, {repeat:true});
  else if (kind === 'wood') t = ctex(256, 256, (g, w, h) => {
    for (let y = 0; y < 8; y++){
      g.fillStyle = pick(['#8a5a34', '#93623a', '#7e5230', '#9a6a40']); g.fillRect(0, y * 32, w, 32);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y * 32, w, 2);
      const off = (y % 2) * 128; g.fillRect(off + 60, y * 32, 2, 32);
      for (let k = 0; k < 6; k++){ g.strokeStyle = 'rgba(40,20,5,.18)'; g.beginPath(); const yy = y * 32 + 6 + Math.random() * 20; g.moveTo(0, yy); g.bezierCurveTo(80, yy - 4, 160, yy + 4, 256, yy); g.stroke(); }
    }
  }, {repeat:true});
  else if (kind === 'carpet') t = ctex(128, 128, (g, w, h) => { g.fillStyle = '#5b3a4a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 2500, ['#6a4658', '#4e3140'], 2); }, {repeat:true});
  else t = ctex(256, 256, (g, w, h) => {
    g.fillStyle = '#8e8b85'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 6000, ['rgba(0,0,0,.07)', 'rgba(255,255,255,.07)', 'rgba(60,50,40,.08)'], 3);
    g.strokeStyle = 'rgba(30,30,30,.25)'; g.lineWidth = 1.5; for (let i = 0; i < 4; i++){ let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++){ x += (Math.random() - .5) * 50; y += (Math.random() - .5) * 50; g.lineTo(x, y); } g.stroke(); }
  }, {repeat:true});
  return ITEX[kind] = t;
}
const ART_TEX = [0, 1, 2, 3].map(k => ctex(128, 96, (g, w, h) => {
  const pal = [['#f4d35e','#ee964b','#0d3b66','#faf0ca'], ['#2a9d8f','#e9c46a','#264653','#f4a261'], ['#e63946','#f1faee','#1d3557','#a8dadc'], ['#6a994e','#bc4749','#f2e8cf','#386641']][k];
  g.fillStyle = pal[3]; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++){ g.fillStyle = pal[i % 3]; g.globalAlpha = 0.85; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 26, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
}));

/* ---------- small helpers ---------- */
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CY = (rt, rb, h, s) => new THREE.CylinderGeometry(rt, rb, h, s || 14);
function part(g, geo, mat, x, y, z, rx, ry, rz){
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
  if (GFX === 'high'){ m.castShadow = true; m.receiveShadow = true; }
  g.add(m); return m;
}
const WOOD = () => STD('#7a4f2c', {roughness:0.7});
const WOOD2 = () => STD('#a0703f', {roughness:0.65});
const METAL = () => STD('#9ea4a8', {metalness:0.7, roughness:0.35});
const WHITE = () => STD('#f2f2ee', {roughness:0.5});
const BLACK = () => STD('#1a1a1a', {roughness:0.5});

/* ---------- furniture (front faces +z when rot = 0) ---------- */
const FURN = {
  bed(kind){
    const g = new THREE.Group();
    const sheet = STD(pick(['#c0392b', '#2e86c1', '#8e44ad', '#16a085', '#d35400']), {roughness:0.9});
    if (kind === 'mattress'){
      part(g, BX(1.2, 0.22, 2.0), STD('#e8e2d0', {roughness:0.95}), 0, 0.11, 0);
      part(g, BX(1.18, 0.05, 1.3), sheet, 0, 0.245, 0.3);
      part(g, BX(0.6, 0.1, 0.35), WHITE(), 0, 0.27, -0.75);
      g.userData.lieY = 0.26; return g;
    }
    const w = kind === 'single' ? 1.0 : 1.6, d = 2.1;
    part(g, BX(w, 0.28, d), WOOD(), 0, 0.28, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => part(g, BX(0.08, 0.15, 0.08), WOOD(), sx * (w / 2 - 0.05), 0.07, sz * (d / 2 - 0.05)));
    part(g, BX(w + 0.06, 1.1, 0.08), WOOD2(), 0, 0.55, -d / 2);
    part(g, BX(w - 0.06, 0.2, d - 0.1), STD('#f3eee3', {roughness:0.95}), 0, 0.51, 0.02);
    part(g, BX(w - 0.02, 0.06, d * 0.62), sheet, 0, 0.63, 0.35);
    part(g, BX(w * 0.4, 0.12, 0.35), WHITE(), -w * 0.22, 0.66, -d / 2 + 0.3);
    if (kind !== 'single') part(g, BX(w * 0.4, 0.12, 0.35), WHITE(), w * 0.22, 0.66, -d / 2 + 0.3);
    g.userData.lieY = 0.62; return g;
  },
  wardrobe(){
    const g = new THREE.Group();
    part(g, BX(1.2, 2.0, 0.6), WOOD2(), 0, 1.0, 0);
    part(g, BX(0.01, 1.9, 0.01), BLACK(), 0, 1.0, 0.305);
    [-0.06, 0.06].forEach(x => part(g, BX(0.03, 0.25, 0.03), METAL(), x, 1.05, 0.32));
    part(g, BX(0.5, 1.2, 0.01), STD('#bcd4e0', {metalness:0.6, roughness:0.08}), 0.3, 1.2, 0.305);
    return g;
  },
  desk(){
    const g = new THREE.Group();
    part(g, BX(1.1, 0.05, 0.55), WOOD2(), 0, 0.74, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => part(g, BX(0.05, 0.72, 0.05), WOOD(), sx * 0.5, 0.36, sz * 0.22));
    part(g, BX(0.4, 0.15, 0.5), WOOD(), 0.3, 0.63, 0);
    return g;
  },
  table(w, d, color){
    const g = new THREE.Group();
    part(g, BX(w, 0.05, d), STD(color || '#a0703f', {roughness:0.65}), 0, 0.74, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => part(g, BX(0.05, 0.72, 0.05), STD(color || '#7a4f2c'), sx * (w / 2 - 0.06), 0.36, sz * (d / 2 - 0.06)));
    return g;
  },
  chair(color){
    const g = new THREE.Group(), m = STD(color || '#7a4f2c', {roughness:0.6});
    part(g, BX(0.45, 0.05, 0.45), m, 0, 0.45, 0);
    part(g, BX(0.45, 0.5, 0.05), m, 0, 0.72, -0.2);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => part(g, BX(0.04, 0.45, 0.04), m, sx * 0.19, 0.22, sz * 0.19));
    return g;
  },
  sofa(seats, color){
    const g = new THREE.Group(), w = seats * 0.75 + 0.3, m = STD(color || '#5d4037', {roughness:0.95});
    part(g, BX(w, 0.42, 0.9), m, 0, 0.21, 0);
    part(g, BX(w, 0.5, 0.22), m, 0, 0.67, -0.34);
    [-1, 1].forEach(s => part(g, BX(0.18, 0.62, 0.9), m, s * (w / 2 - 0.09), 0.31, 0));
    for (let i = 0; i < seats; i++) part(g, BX(0.7, 0.12, 0.62), STD('#8d6e63', {roughness:0.95}), -w / 2 + 0.15 + 0.375 + i * 0.75, 0.48, 0.08);
    return g;
  },
  tv(){
    const g = new THREE.Group();
    part(g, BX(1.2, 0.5, 0.4), WOOD(), 0, 0.25, 0);
    part(g, BX(0.06, 0.25, 0.06), BLACK(), 0, 0.62, -0.05);
    const scr = new THREE.MeshStandardMaterial({color:LIN('#0d0f12'), emissive:new THREE.Color(0x6aa6ff), emissiveIntensity:0, roughness:0.2});
    part(g, BX(1.05, 0.62, 0.05), BLACK(), 0, 1.05, -0.05);
    g.userData.screen = part(g, BX(0.98, 0.56, 0.01), scr, 0, 1.05, -0.022);
    return g;
  },
  smallTv(){
    const g = new THREE.Group();
    part(g, BX(0.9, 0.05, 0.45), WOOD2(), 0, 0.62, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => part(g, BX(0.04, 0.6, 0.04), WOOD(), sx * 0.4, 0.3, sz * 0.18));
    const scr = new THREE.MeshStandardMaterial({color:LIN('#0d0f12'), emissive:new THREE.Color(0x6aa6ff), emissiveIntensity:0});
    part(g, BX(0.78, 0.48, 0.05), BLACK(), 0, 0.92, -0.05);
    g.userData.screen = part(g, BX(0.72, 0.42, 0.01), scr, 0, 0.92, -0.022);
    return g;
  },
  fridge(){
    const g = new THREE.Group();
    part(g, BX(0.62, 1.7, 0.62), STD('#d9dcde', {metalness:0.4, roughness:0.3}), 0, 0.85, 0);
    part(g, BX(0.6, 0.01, 0.01), BLACK(), 0, 1.15, 0.315);
    part(g, BX(0.03, 0.4, 0.03), METAL(), 0.24, 1.4, 0.33); part(g, BX(0.03, 0.3, 0.03), METAL(), 0.24, 0.85, 0.33);
    return g;
  },
  counter(w, stove){
    const g = new THREE.Group();
    part(g, BX(w, 0.86, 0.6), STD('#e8e2d6', {roughness:0.6}), 0, 0.43, 0);
    part(g, BX(w + 0.04, 0.05, 0.64), STD('#4a4a4a', {roughness:0.3}), 0, 0.885, 0);
    for (let i = 0; i < Math.floor(w / 0.6); i++) part(g, BX(0.55, 0.7, 0.01), STD('#d2c8b6'), -w / 2 + 0.3 + i * 0.6, 0.42, 0.305);
    part(g, BX(0.45, 0.06, 0.35), METAL(), w / 2 - 0.35, 0.92, 0);
    let flame = null;
    if (stove === 'gas'){
      part(g, BX(0.6, 0.06, 0.5), BLACK(), -w / 2 + 0.4, 0.94, 0);
      [[-0.13, -0.11], [0.13, -0.11], [-0.13, 0.11], [0.13, 0.11]].forEach(([x, z]) => part(g, CY(0.07, 0.07, 0.02, 12), METAL(), -w / 2 + 0.4 + x, 0.98, z));
      flame = part(g, CY(0.06, 0.04, 0.05, 10), new THREE.MeshBasicMaterial({color:0x3d7bff, transparent:true, opacity:0}), -w / 2 + 0.27, 1.01, -0.11);
      part(g, CY(0.14, 0.12, 0.14, 16), METAL(), -w / 2 + 0.27, 1.06, -0.11);
    } else {
      part(g, CY(0.14, 0.16, 0.18, 14), STD('#3b6ea8', {metalness:0.4, roughness:0.4}), -w / 2 + 0.35, 0.99, 0);
      flame = part(g, CY(0.09, 0.07, 0.05, 10), new THREE.MeshBasicMaterial({color:0xff9a3c, transparent:true, opacity:0}), -w / 2 + 0.35, 1.1, 0);
      part(g, CY(0.15, 0.13, 0.16, 16), STD('#555', {metalness:0.6}), -w / 2 + 0.35, 1.2, 0);
    }
    g.userData.flame = flame;
    return g;
  },
  fan(){
    const g = new THREE.Group();
    part(g, CY(0.2, 0.22, 0.04, 16), STD('#e9e9e6'), 0, 0.02, 0);
    part(g, CY(0.025, 0.025, 1.15, 8), METAL(), 0, 0.6, 0);
    part(g, CY(0.18, 0.18, 0.06, 18), STD('#e9e9e6'), 0, 1.25, 0.02, Math.PI / 2);
    const blades = new THREE.Group(); blades.position.set(0, 1.25, 0.07); g.add(blades);
    for (let i = 0; i < 3; i++){ const b = part(blades, BX(0.07, 0.3, 0.01), STD('#4aa3df', {roughness:0.4}), 0, 0, 0); b.geometry.translate(0, 0.15, 0); b.rotation.z = i * Math.PI * 2 / 3; }
    g.userData.spin = blades; return g;
  },
  ac(){ const g = new THREE.Group(); part(g, BX(0.95, 0.3, 0.22), WHITE(), 0, 0, 0); part(g, BX(0.85, 0.03, 0.01), STD('#c8c8c8'), 0, -0.1, 0.112); return g; },
  rug(w, d, color){ const g = new THREE.Group(); part(g, BX(w, 0.012, d), STD(color || '#9c2f2f', {roughness:1}), 0, 0.006, 0); part(g, BX(w - 0.25, 0.014, d - 0.25), STD('#e7c36a', {roughness:1}), 0, 0.007, 0); part(g, BX(w - 0.45, 0.016, d - 0.45), STD(color || '#9c2f2f', {roughness:1}), 0, 0.008, 0); return g; },
  plant(){ const g = new THREE.Group(); part(g, CY(0.17, 0.13, 0.32, 14), STD('#b3542d'), 0, 0.16, 0); [[0, 0.65, 0, 0.3], [0.12, 0.85, 0.05, 0.2], [-0.1, 0.8, -0.06, 0.22]].forEach(([x, y, z, r]) => part(g, new THREE.IcosahedronGeometry(r, 0), STD('#3f8a3a', {flatShading:true}), x, y, z)); part(g, CY(0.02, 0.02, 0.4, 6), STD('#4a3'), 0, 0.45, 0); return g; },
  shelf(){
    const g = new THREE.Group();
    part(g, BX(1.0, 1.8, 0.04), WOOD(), 0, 0.9, -0.15);
    [-0.48, 0.48].forEach(x => part(g, BX(0.04, 1.8, 0.35), WOOD(), x, 0.9, 0));
    for (let i = 0; i < 5; i++) part(g, BX(0.96, 0.03, 0.33), WOOD2(), 0, 0.05 + i * 0.43, 0);
    for (let i = 0; i < 4; i++){ let x = -0.43; while (x < 0.4){ const bw = 0.04 + Math.random() * 0.04, bh = 0.25 + Math.random() * 0.1; part(g, BX(bw, bh, 0.24), STD(pick(['#c0392b', '#2471a3', '#1e8449', '#b7950b', '#6c3483', '#ecf0f1'])), x + bw / 2, 0.07 + i * 0.43 + bh / 2, 0); x += bw + 0.01; } }
    return g;
  },
  art(k){ const g = new THREE.Group(); part(g, BX(0.9, 0.68, 0.04), STD('#2b2b2b'), 0, 0, 0); const c = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.58), new THREE.MeshStandardMaterial({map:ART_TEX[k % 4], roughness:0.8})); c.position.z = 0.022; g.add(c); return g; },
  window(w){
    const g = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, 1.05), new THREE.MeshBasicMaterial({color:LIN('#a9cfe8')}));
    glass.position.z = 0.01; g.add(glass);
    [[0, 0.55, w, 0.07], [0, -0.55, w, 0.07], [-w / 2, 0, 0.07, 1.15], [w / 2, 0, 0.07, 1.15], [0, 0, 0.05, 1.1]].forEach(([x, y, ww, hh]) => part(g, BX(ww, hh, 0.06), WHITE(), x, y, 0.02));
    for (let x = -w / 2 + 0.12; x < w / 2; x += 0.12) part(g, BX(0.02, 1.1, 0.02), BLACK(), x, 0, 0.06);
    return g;
  },
  curtains(w, color){ const g = new THREE.Group(); const m = STD(color || '#8e2d4a', {roughness:1}); [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) part(g, BX(0.09, 1.5, 0.05), m, s * (w / 2 + 0.05 - i * 0.07), -0.05, 0.08 + (i % 2) * 0.03); }); part(g, CY(0.015, 0.015, w + 0.6, 6), METAL(), 0, 0.72, 0.1, 0, 0, Math.PI / 2); return g; },
  toilet(){ const g = new THREE.Group(); part(g, CY(0.2, 0.16, 0.4, 16), WHITE(), 0, 0.2, 0.05); part(g, BX(0.42, 0.4, 0.18), WHITE(), 0, 0.45, -0.2); part(g, CY(0.21, 0.21, 0.03, 16), WHITE(), 0, 0.42, 0.05); return g; },
  shower(){ const g = new THREE.Group(); part(g, BX(0.85, 0.06, 0.85), WHITE(), 0, 0.03, 0); part(g, CY(0.02, 0.02, 2.0, 6), METAL(), 0, 1.0, -0.38); part(g, CY(0.09, 0.05, 0.06, 12), METAL(), 0, 1.95, -0.3); return g; },
  bucket(){ const g = new THREE.Group(); part(g, CY(0.17, 0.13, 0.32, 14), STD('#2d7dd2'), 0, 0.16, 0); part(g, CY(0.15, 0.15, 0.01, 14), STD('#9fd3f7', {roughness:0.1}), 0, 0.27, 0); return g; },
  generator(){ const g = new THREE.Group(); part(g, BX(0.75, 0.55, 0.5), STD('#c0392b', {roughness:0.5}), 0, 0.33, 0); part(g, BX(0.8, 0.05, 0.55), BLACK(), 0, 0.03, 0); part(g, BX(0.3, 0.12, 0.3), STD('#e3b12b'), 0.15, 0.66, 0); return g; },
  inverter(){ const g = new THREE.Group(); part(g, BX(0.45, 0.5, 0.25), STD('#3d3d3d'), 0, 0.25, 0); part(g, BX(0.12, 0.04, 0.01), new THREE.MeshBasicMaterial({color:0x2ecc71}), 0, 0.4, 0.13); [-0.55, 0.55].forEach(x => part(g, BX(0.3, 0.32, 0.2), STD('#1f3a5f'), x * 0.9, 0.16, 0)); return g; },
  laptop(){ const g = new THREE.Group(); part(g, BX(0.34, 0.02, 0.24), STD('#5a5f66', {metalness:0.6}), 0, 0, 0); const s = part(g, BX(0.34, 0.22, 0.01), STD('#5a5f66', {metalness:0.6}), 0, 0.11, -0.12, -0.25); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.19), new THREE.MeshBasicMaterial({color:0x2c6fbb})); scr.position.z = 0.006; s.add(scr); return g; },
  dining(){
    const g = new THREE.Group();
    g.add(FURN.table(1.2, 0.8, '#6d4527'));
    [[-0.85, 0, Math.PI / 2], [0.85, 0, -Math.PI / 2], [-0.28, 0.65, Math.PI], [0.28, -0.65, 0]].forEach(([x, z, r]) => { const c = FURN.chair('#5a3920'); c.position.set(x, 0, z); c.rotation.y = r; g.add(c); });
    part(g, CY(0.12, 0.1, 0.06, 14), WHITE(), 0, 0.8, 0);
    return g;
  },
  bench(len){
    const g = new THREE.Group();
    const seat = STD('#2f5d8a', {roughness:0.5});
    for (let x = -len / 2 + 0.28; x < len / 2; x += 0.56){ part(g, BX(0.5, 0.05, 0.45), seat, x, 0.45, 0); part(g, BX(0.5, 0.45, 0.04), seat, x, 0.72, -0.21); }
    part(g, BX(len, 0.05, 0.05), METAL(), 0, 0.4, 0);
    [-len / 2 + 0.1, len / 2 - 0.1].forEach(x => part(g, BX(0.05, 0.4, 0.4), METAL(), x, 0.2, 0));
    return g;
  },
  officeCounter(w){
    const g = new THREE.Group();
    part(g, BX(w, 1.05, 0.7), STD('#e8e4dc', {roughness:0.6}), 0, 0.525, 0);
    part(g, BX(w + 0.05, 0.05, 0.8), STD('#3c4a3c', {roughness:0.35}), 0, 1.075, 0);
    part(g, BX(w, 0.06, 0.06), STD('#0a7d3b'), 0, 0.9, 0.36);
    const glass = new THREE.Mesh(BX(w, 0.85, 0.02), new THREE.MeshStandardMaterial({color:LIN('#cfe8f0'), transparent:true, opacity:0.25, roughness:0.05}));
    glass.position.set(0, 1.55, 0.1); g.add(glass);
    for (let x = -w / 2; x <= w / 2 + 0.01; x += w / 3) part(g, BX(0.05, 0.9, 0.05), METAL(), x, 1.55, 0.1);
    return g;
  },
  officeDesk(){ const g = FURN.desk(); const pc = new THREE.Group(); part(pc, BX(0.45, 0.3, 0.03), BLACK(), 0, 0.2, 0); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({color:0x3a7bd5})); s.position.set(0, 0.2, 0.016); pc.add(s); part(pc, BX(0.06, 0.08, 0.06), BLACK(), 0, 0.04, -0.02); pc.position.set(-0.15, 0.77, -0.1); g.add(pc); return g; },
  ticketMachine(){ const g = new THREE.Group(); part(g, BX(0.5, 1.45, 0.4), STD('#0a7d3b', {roughness:0.4}), 0, 0.72, 0); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.26), new THREE.MeshBasicMaterial({color:0x8fe3b0})); s.position.set(0, 1.15, 0.205); g.add(s); part(g, BX(0.2, 0.03, 0.03), BLACK(), 0, 0.85, 0.21); return g; },
  cameraRig(){
    const g = new THREE.Group();
    [0, 2.1, 4.2].forEach(a => part(g, CY(0.012, 0.012, 1.4, 5), BLACK(), Math.sin(a) * 0.2, 0.68, Math.cos(a) * 0.2, Math.cos(a) * 0.28, 0, -Math.sin(a) * 0.28));
    part(g, BX(0.18, 0.13, 0.12), BLACK(), 0, 1.42, 0);
    part(g, CY(0.045, 0.05, 0.1, 12), BLACK(), 0, 1.42, 0.1, Math.PI / 2);
    const fl = new THREE.MeshStandardMaterial({color:LIN('#ffffff'), emissive:new THREE.Color(0xffffff), emissiveIntensity:0});
    g.userData.flash = part(g, BX(0.4, 0.4, 0.02), fl, 0.45, 1.7, 0.05);
    part(g, CY(0.012, 0.012, 1.7, 5), BLACK(), 0.45, 0.85, -0.02);
    return g;
  },
  scanner(){ const g = FURN.table(0.7, 0.5, '#d9d9d9'); const glow = new THREE.MeshStandardMaterial({color:LIN('#1b1b1b'), emissive:new THREE.Color(0x33ff88), emissiveIntensity:0}); part(g, BX(0.25, 0.06, 0.18), STD('#2b2b2b'), -0.12, 0.79, 0.05); g.userData.glow = part(g, BX(0.18, 0.01, 0.12), glow, -0.12, 0.825, 0.05); part(g, BX(0.18, 0.02, 0.24), STD('#444'), 0.18, 0.78, 0.05); return g; },
  backdrop(){ const g = new THREE.Group(); part(g, BX(1.3, 1.9, 0.04), STD('#f7f7f7'), 0, 1.05, 0); part(g, BX(0.06, 0.2, 0.3), BLACK(), -0.6, 0.1, 0); part(g, BX(0.06, 0.2, 0.3), BLACK(), 0.6, 0.1, 0); return g; },
  stool(){ const g = new THREE.Group(); part(g, CY(0.18, 0.18, 0.05, 16), BLACK(), 0, 0.47, 0); part(g, CY(0.03, 0.03, 0.45, 8), METAL(), 0, 0.23, 0); part(g, CY(0.2, 0.2, 0.03, 16), METAL(), 0, 0.015, 0); return g; },
  dispenser(){ const g = new THREE.Group(); part(g, BX(0.35, 1.0, 0.35), WHITE(), 0, 0.5, 0); part(g, CY(0.15, 0.15, 0.45, 14), STD('#7fc8f8', {transparent:true, opacity:0.7}), 0, 1.22, 0); return g; },
  sign(text, w, h, bg, fg){ const g = new THREE.Group(); const t = signTex(text, bg || '#0a7d3b', fg || '#fff', 512, Math.round(512 * h / w)); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map:t, roughness:0.6})); g.add(m); return g; },
  closedDoor(){ const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.1), new THREE.MeshStandardMaterial({map:TEX.door, roughness:0.6})); m.position.y = 1.05; g.add(m); part(g, BX(1.08, 0.08, 0.04), WHITE(), 0, 2.13, 0); return g; },
  shelfDisplay(){ const g = new THREE.Group(); part(g, BX(1.6, 0.3, 0.8), STD('#ddd'), 0, 0.15, 0); return g; }
};

/* ---------- interior instance builder ---------- */
function newInterior(id, slot, name){
  const ox = IOX - slot * ISLOT, oz = IOZ;
  const inst = {id, slot, name, ox, oz, group:new THREE.Group(), walls:[], solids:[], stations:[], staff:[], rooms:[], anim:[], visit:{}};
  scene.add(inst.group);
  const vf = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), STD('#161616', {roughness:1}));
  vf.rotation.x = -Math.PI / 2; vf.position.set(ox + 6, -0.02, oz + 4); vf.receiveShadow = GFX === 'high'; inst.group.add(vf);
  return inst;
}
function addRooms(inst, rooms, openings, wallColor){
  const wm = STD(wallColor || '#efe6d2', {roughness:0.9});
  const skirt = STD('#5a4636', {roughness:0.7});
  rooms.forEach(r => {
    inst.rooms.push(r);
    const ft = floorTexture(r.floor || 'tile').clone(); ft.needsUpdate = true; ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(r.w / 1.6, r.d / 1.6);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), new THREE.MeshStandardMaterial({map:ft, roughness:r.floor === 'tile' ? 0.35 : 0.85}));
    fl.rotation.x = -Math.PI / 2; fl.position.set(inst.ox + r.x + r.w / 2, 0.004, inst.oz + r.z + r.d / 2); fl.receiveShadow = GFX === 'high'; inst.group.add(fl);
    const sides = [
      {s:'n', along:'x', line:r.z, pos:r.z + WALL_T / 2, a:r.x, b:r.x + r.w, nx:0, nz:-1},
      {s:'s', along:'x', line:r.z + r.d, pos:r.z + r.d - WALL_T / 2, a:r.x, b:r.x + r.w, nx:0, nz:1},
      {s:'w', along:'z', line:r.x, pos:r.x + WALL_T / 2, a:r.z, b:r.z + r.d, nx:-1, nz:0},
      {s:'e', along:'z', line:r.x + r.w, pos:r.x + r.w - WALL_T / 2, a:r.z, b:r.z + r.d, nx:1, nz:0}
    ];
    sides.forEach(sd => {
      const gaps = openings.filter(o => sd.along === 'x' ? (o.axis === 'x' && Math.abs(o.z - sd.line) < 0.02 && o.x > sd.a && o.x < sd.b) : (o.axis === 'z' && Math.abs(o.x - sd.line) < 0.02 && o.z > sd.a && o.z < sd.b))
        .map(o => { const c = sd.along === 'x' ? o.x : o.z; return [c - o.w / 2, c + o.w / 2]; }).sort((p, q) => p[0] - q[0]);
      let cur = sd.a; const segs = [];
      gaps.forEach(([g0, g1]) => { if (g0 > cur) segs.push([cur, g0]); cur = Math.max(cur, g1); });
      if (cur < sd.b) segs.push([cur, sd.b]);
      segs.forEach(([a, b]) => { if (b - a > 0.02) addWall(inst, sd, a, b, 0, WALL_H, wm, skirt, true); });
      gaps.forEach(([a, b]) => addWall(inst, sd, a, b, 2.15, WALL_H - 2.15, wm, null, false));
    });
  });
}
function addWall(inst, sd, a, b, y0, h, mat, skirt, solid){
  const len = b - a, c = (a + b) / 2;
  const geo = sd.along === 'x' ? BX(len, h, WALL_T) : BX(WALL_T, h, len);
  const m = new THREE.Mesh(geo, mat);
  const wx = inst.ox + (sd.along === 'x' ? c : sd.pos), wz = inst.oz + (sd.along === 'x' ? sd.pos : c);
  m.position.set(wx, y0 + h / 2, wz);
  if (GFX === 'high'){ m.castShadow = true; m.receiveShadow = true; }
  inst.group.add(m);
  if (skirt){ const sk = new THREE.Mesh(sd.along === 'x' ? BX(len, 0.12, WALL_T + 0.02) : BX(WALL_T + 0.02, 0.12, len), skirt); sk.position.set(wx, 0.06, wz); inst.group.add(sk); }
  const w = {mesh:m, nx:sd.nx, nz:sd.nz, cx:wx, cz:wz, h, y0, along:sd.along, a:a, b:b, line:sd.pos, cut:false};
  inst.walls.push(w);
  if (solid){
    const hx = sd.along === 'x' ? len / 2 : WALL_T / 2, hz = sd.along === 'x' ? WALL_T / 2 : len / 2;
    inst.solids.push({x0:wx - hx, x1:wx + hx, z0:wz - hz, z1:wz + hz});
  }
  return w;
}
/* place an object at local (x, z) with rotation r; solid = adds a collision box */
function put(inst, obj, x, z, r, solid, y){
  obj.position.set(inst.ox + x, y || 0, inst.oz + z); obj.rotation.y = r || 0;
  inst.group.add(obj);
  if (solid !== false){
    obj.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(obj);
    inst.solids.push({x0:bb.min.x, x1:bb.max.x, z0:bb.min.z, z1:bb.max.z});
  }
  return obj;
}
/* mount an object on the nearest wall (it hides with the wall when the wall is cut away) */
function onWall(inst, obj, x, y, z){
  const wx = inst.ox + x, wz = inst.oz + z;
  let best = null, bd = 1e9;
  inst.walls.forEach(w => {
    if (w.y0 > 0) return;
    const along = w.along === 'x' ? wx : wz, perp = w.along === 'x' ? Math.abs(wz - w.cz) : Math.abs(wx - w.cx);
    const a = (w.along === 'x' ? w.cx : w.cz) - (w.b - w.a) / 2, b = a + (w.b - w.a);
    if (along < a - 0.05 || along > b + 0.05) return;
    if (perp < bd){ bd = perp; best = w; }
  });
  if (!best){ obj.position.set(wx, y, wz); inst.group.add(obj); return obj; }
  const inward = best.along === 'x' ? -best.nz : -best.nx;
  const off = WALL_T / 2 + 0.03;
  if (best.along === 'x'){ obj.position.set(wx - best.cx, y - (best.y0 + best.h / 2), inward * off); obj.rotation.y = inward > 0 ? 0 : Math.PI; }
  else { obj.position.set(inward * off, y - (best.y0 + best.h / 2), wz - best.cz); obj.rotation.y = inward > 0 ? Math.PI / 2 : -Math.PI / 2; }
  best.mesh.add(obj);
  return obj;
}
function station(inst, id, x, z, label, act, o){
  o = o || {};
  const s = Object.assign({id, x:inst.ox + x, z:inst.oz + z, label, act, r:1.15}, o);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 28), new THREE.MeshBasicMaterial({color:0x7dffa8, transparent:true, opacity:0.55, depthWrite:false, toneMapped:false}));
  ring.rotation.x = -Math.PI / 2; ring.position.set(s.x, 0.02, s.z); inst.group.add(ring);
  s.ring = ring;
  s.sprite = makeLabel(label.replace(/^[^A-Za-z]*/, ''), 0.26, 'rgba(10,22,15,.82)'); s.sprite.position.set(s.x, 2.05, s.z); inst.group.add(s.sprite);
  inst.stations.push(s);
  return s;
}
function staffMember(inst, x, z, face, look, o){
  o = o || {};
  const p = makePerson(look);
  inst.group.add(p.g);
  const st = {p, x:inst.ox + x, z:inst.oz + z, face, pose:o.sit ? 'sit' : null, name:o.name || '', ph:Math.random() * 6, talk:o.talk};
  p.g.position.set(st.x, 0, st.z); p.g.rotation.y = face;
  if (o.name){ const l = makeLabel(o.name, 0.24, 'rgba(10,60,30,.88)'); l.position.set(0, o.sit ? 1.75 : 2.15, 0); p.g.add(l); }
  if (!o.sit) inst.solids.push({x0:st.x - 0.25, x1:st.x + 0.25, z0:st.z - 0.25, z1:st.z + 0.25});
  inst.staff.push(st);
  return st;
}
const UNIFORM = {
  nimc: (g) => ({gender:g, skin:pick(SKINS), top:'#0a7d3b', bottom:'#1c2833', hair:'#121212', longSleeve:true}),
  guard: () => ({gender:'m', skin:pick(SKINS), top:'#1c2a4a', bottom:'#1c2a4a', cap:'#0d0d0d', longSleeve:true}),
  sales: (g) => ({gender:g, skin:pick(SKINS), top:'#8a5a2b', bottom:'#1c2833', hair:'#121212'})
};

/* =========================================================
   HOME
   ========================================================= */
const HOME_LAYOUTS = [
  { // 0: face-me-I-face-you
    floor:'cement', spawn:[1.2, 9.3],
    rooms:[{x:0, z:0, w:2.4, d:10, floor:'cement'}, {x:2.4, z:3, w:4, d:4, floor:'cement'}, {x:0, z:-2.2, w:2.4, d:2.2, floor:'tile'}],
    open:[{x:1.2, z:10, axis:'x', w:1.1}, {x:2.4, z:6.2, axis:'z', w:1.0}, {x:1.2, z:0, axis:'x', w:0.9}],
    entrance:{x:1.2, z:10},
    bed:[5.4, 4.25, 0], desk:[3.75, 3.45, 0], chair:[3.75, 4.05, Math.PI], fan:[2.95, 3.55, 2.4], wardrobe:[5.95, 6.2, -Math.PI / 2],
    tv:[4.3, 6.65, Math.PI], small:true, fridge:[2.85, 4.9, Math.PI / 2], rug:[4.2, 5.1, 1.6, 1.2], plant:[2.85, 4.25], art:[5.0, 1.7, 6.84],
    window:[3.6, 3], ac:[5.4, 3], kitchen:[2.05, 8.6, -Math.PI / 2, 1.2], toilet:[0.5, -1.6, Math.PI / 2], shower:[1.85, -1.65], bucket:[1.0, -0.6],
    gen:[3.3, 10.9], inverter:[0.35, 9.3, Math.PI / 2],
    st:{bed:[4.35, 4.3], desk:[3.75, 4.25], tv:[4.3, 5.85], wardrobe:[5.25, 6.2], fridge:[3.45, 4.9], kitchen:[1.35, 8.6], bath:[1.2, -0.75], exit:[1.2, 9.65]},
    neighbours:[[0, 2, 'w'], [0, 5, 'w'], [0, 8, 'w'], [2.4, 1.5, 'e'], [2.4, 8.5, 'e']], neighbour:[0.45, 6.6]
  },
  { // 1: self-contain
    spawn:[1.6, 4.0],
    rooms:[{x:0, z:0, w:5.5, d:4.5, floor:'terrazzo'}, {x:5.5, z:0, w:2, d:2.2, floor:'tile'}, {x:5.5, z:2.2, w:2, d:2.3, floor:'tile'}],
    open:[{x:1.6, z:4.5, axis:'x', w:1.1}, {x:5.5, z:1.6, axis:'z', w:0.9}, {x:5.5, z:3.4, axis:'z', w:0.9}],
    entrance:{x:1.6, z:4.5},
    bed:[1.0, 1.25, 0], desk:[3.6, 0.45, 0], chair:[3.6, 1.05, Math.PI], fan:[4.8, 0.5, 2.6], wardrobe:[4.4, 4.05, Math.PI],
    tv:[3.0, 4.15, Math.PI], sofa:[0.6, 3.2, Math.PI / 2, 2], rug:[2.9, 2.5, 1.8, 1.3], plant:[2.4, 0.4], art:[5.33, 1.7, 2.55],
    window:[3.0, 0], ac:[1.0, 0], kitchen:[7.05, 3.3, -Math.PI / 2, 1.6], fridge:[6.35, 2.65, 0], toilet:[7.05, 0.55, -Math.PI / 2], shower:[6.1, 0.55], bucket:[7.1, 1.7],
    gen:[3.8, 5.2], inverter:[6.0, 4.15, 0],
    st:{bed:[2.15, 1.4], desk:[3.6, 1.2], tv:[3.0, 3.45], sofa:[1.4, 3.2], wardrobe:[4.4, 3.4], kitchen:[6.35, 3.5], bath:[6.3, 1.4], exit:[1.6, 4.15]}
  },
  { // 2: mini flat
    spawn:[1.2, 4.3],
    rooms:[{x:0, z:0, w:6, d:4.8, floor:'tile'}, {x:0, z:-4.4, w:4.2, d:4.4, floor:'wood'}, {x:6, z:1.6, w:2.4, d:3.2, floor:'tile'}, {x:4.2, z:-2.4, w:2.2, d:2.4, floor:'tile'}],
    open:[{x:1.2, z:4.8, axis:'x', w:1.1}, {x:1.2, z:0, axis:'x', w:1.0}, {x:5.3, z:0, axis:'x', w:0.9}, {x:6, z:3.8, axis:'z', w:0.95}],
    entrance:{x:1.2, z:4.8},
    bed:[3.2, -3.25, 0], desk:[0.45, -2.6, Math.PI / 2], chair:[1.05, -2.6, -Math.PI / 2], fan:[0.5, -3.95, 2.4], wardrobe:[3.75, -0.95, -Math.PI / 2],
    tv:[5.6, 2.4, -Math.PI / 2], sofa:[0.6, 2.6, Math.PI / 2, 3], rug:[3.0, 2.6, 2.2, 1.6], rug2:[2.0, -1.9, 1.6, 1.2], dining:[3.2, 1.0], shelf:[3.6, 4.45, Math.PI],
    plant:[5.55, 4.45], plant2:[0.45, -0.55], art:[0.17, 1.75, 2.6], art2:[0.17, 1.75, -1.2],
    window:[2.3, 4.8], window2:[1.9, -4.4], ac:[3.2, -4.4], kitchen:[8.05, 3.1, -Math.PI / 2, 1.8], fridge:[6.55, 2.1, 0],
    toilet:[6.0, -1.85, -Math.PI / 2], shower:[4.75, -1.85], bucket:[6.0, -0.6], gen:[4.3, 5.4], inverter:[6.4, 4.45, 0],
    st:{bed:[2.0, -3.2], desk:[1.4, -2.6], wardrobe:[3.1, -0.95], tv:[1.55, 2.6], dining:[3.2, 1.95], shelf:[3.6, 3.8], kitchen:[7.1, 3.3], bath:[5.3, -1.0], exit:[1.2, 4.45]}
  },
  { // 3: 2-bedroom flat
    spawn:[1.3, 4.5],
    rooms:[{x:0, z:0, w:7, d:5, floor:'tile'}, {x:0, z:-4.6, w:4, d:4.6, floor:'wood'}, {x:4, z:-4.6, w:3.6, d:4.6, floor:'carpet'}, {x:7, z:1.6, w:2.6, d:3.4, floor:'tile'}, {x:7.6, z:-2.4, w:2, d:2.4, floor:'tile'}],
    open:[{x:1.3, z:5, axis:'x', w:1.1}, {x:1.2, z:0, axis:'x', w:1.0}, {x:5.0, z:0, axis:'x', w:1.0}, {x:7, z:4.0, axis:'z', w:0.95}, {x:7.6, z:-1.2, axis:'z', w:0.9}],
    entrance:{x:1.3, z:5},
    bed:[3.0, -3.45, 0], desk:[0.45, -2.7, Math.PI / 2], chair:[1.05, -2.7, -Math.PI / 2], fan:[0.5, -4.1, 2.4], wardrobe:[3.55, -0.95, -Math.PI / 2],
    tv:[6.6, 2.4, -Math.PI / 2], sofa:[0.6, 2.6, Math.PI / 2, 3], rug:[3.3, 2.6, 2.4, 1.7], rug2:[1.9, -2.0, 1.6, 1.2], dining:[3.3, 1.0], shelf:[4.6, 4.65, Math.PI],
    plant:[6.55, 4.6], plant2:[0.45, -0.55], art:[0.17, 1.75, 2.6], art2:[0.17, 1.75, -1.25],
    window:[3.0, 5], window2:[1.7, -4.6], ac:[3.0, -4.6], kitchen:[9.25, 3.2, -Math.PI / 2, 1.8], fridge:[7.6, 2.1, 0],
    toilet:[9.2, -1.9, -Math.PI / 2], shower:[8.4, -1.95], bucket:[9.2, -0.5], gen:[5.0, 5.6], inverter:[7.55, 4.65, 0],
    guest:[6.95, -3.5],
    st:{bed:[1.9, -3.4], desk:[1.35, -2.7], wardrobe:[2.9, -0.95], tv:[1.55, 2.6], dining:[3.3, 1.95], shelf:[4.6, 4.0], kitchen:[8.2, 3.3], bath:[8.6, -0.8], guest:[5.8, -3.5], exit:[1.3, 4.65]}
  }
];
const hasItem = id => !!(state.home && state.home.items[id]);
function homeComfort(){
  const keys = ['rug', 'curtains', 'art', 'plant', 'sofa', 'tv', 'wardrobe', 'shelf', 'dining', 'ac', 'bed2'];
  return Math.min(10, keys.filter(hasItem).length + (state.home.paint && state.home.paint !== 'cream' ? 1 : 0));
}
function sleepGain(){ return HOUSING[state.housing].sleep + (hasItem('bed2') ? 10 : 0) + (hasItem('fan') ? 5 : 0) + (hasItem('ac') ? 15 : 0); }
function buildHome(inst){
  const L = HOME_LAYOUTS[state.housing], tier = state.housing;
  const paint = (PAINTS.find(p => p.id === state.home.paint) || PAINTS[0]).c;
  addRooms(inst, L.rooms, L.open, paint);
  inst.layout = L; inst.spawn = L.spawn; inst.entrance = L.entrance;
  const P2 = (a) => [a[0], a[1]];
  // bed
  const bk = hasItem('bed2') ? 'double' : 'mattress';
  const bed = put(inst, FURN.bed(bk), L.bed[0], L.bed[1], L.bed[2]);
  inst.bedPos = {x:inst.ox + L.bed[0], z:inst.oz + L.bed[1] + 0.85, y:bed.userData.lieY};
  // windows, AC, curtains
  onWall(inst, FURN.window(1.3), L.window[0], 1.55, L.window[1]);
  if (L.window2) onWall(inst, FURN.window(1.3), L.window2[0], 1.55, L.window2[1]);
  if (hasItem('curtains')){ onWall(inst, FURN.curtains(1.3), L.window[0], 1.55, L.window[1]); if (L.window2) onWall(inst, FURN.curtains(1.3, '#2e4a7d'), L.window2[0], 1.55, L.window2[1]); }
  if (hasItem('ac')) onWall(inst, FURN.ac(), L.ac[0], 2.35, L.ac[1]);
  // study corner
  if (hasItem('desk')){ put(inst, FURN.desk(), L.desk[0], L.desk[1], L.desk[2]); put(inst, FURN.chair(), L.chair[0], L.chair[1], L.chair[2]); }
  else { put(inst, FURN.table(0.8, 0.5, '#9c7a54'), L.desk[0], L.desk[1], L.desk[2]); put(inst, FURN.chair('#e9e9e6'), L.chair[0], L.chair[1], L.chair[2]); }
  if (hasItem('laptop')){ const lp = FURN.laptop(); put(inst, lp, L.desk[0], L.desk[1], L.desk[2], false, 0.77); }
  if (hasItem('fan')){ const f = put(inst, FURN.fan(), L.fan[0], L.fan[1], L.fan[2]); inst.anim.push(dt => { f.userData.spin.rotation.z += dt * 14; }); }
  if (hasItem('wardrobe')) put(inst, FURN.wardrobe(), L.wardrobe[0], L.wardrobe[1], L.wardrobe[2]);
  if (hasItem('tv')){ const t = put(inst, L.small ? FURN.smallTv() : FURN.tv(), L.tv[0], L.tv[1], L.tv[2]); inst.tvScreen = t.userData.screen; }
  if (hasItem('sofa') && L.sofa){ const s = put(inst, FURN.sofa(L.sofa[3]), L.sofa[0], L.sofa[1], L.sofa[2]); inst.sofaSeat = {x:inst.ox + L.sofa[0] + 0.1, z:inst.oz + L.sofa[1], face:Math.PI / 2}; }
  if (hasItem('rug')){ put(inst, FURN.rug(L.rug[2], L.rug[3]), L.rug[0], L.rug[1], 0, false); if (L.rug2) put(inst, FURN.rug(L.rug2[2], L.rug2[3], '#2e4a7d'), L.rug2[0], L.rug2[1], 0, false); }
  if (hasItem('dining') && L.dining) put(inst, FURN.dining(), L.dining[0], L.dining[1], 0);
  if (hasItem('shelf') && L.shelf) put(inst, FURN.shelf(), L.shelf[0], L.shelf[1], L.shelf[2]);
  if (hasItem('plant')){ put(inst, FURN.plant(), L.plant[0], L.plant[1], 0); if (L.plant2) put(inst, FURN.plant(), L.plant2[0], L.plant2[1], 0); }
  if (hasItem('art')){ onWall(inst, FURN.art(1), L.art[0], L.art[1], L.art[2]); if (L.art2) onWall(inst, FURN.art(2), L.art2[0], L.art2[1], L.art2[2]); }
  if (hasItem('fridge')) put(inst, FURN.fridge(), L.fridge[0], L.fridge[1], L.fridge[2]);
  // kitchen, bathroom, power
  const k = put(inst, FURN.counter(L.kitchen[3], hasItem('cooker') ? 'gas' : 'kerosene'), L.kitchen[0], L.kitchen[1], L.kitchen[2]);
  inst.flame = k.userData.flame;
  put(inst, FURN.toilet(), L.toilet[0], L.toilet[1], L.toilet[2]);
  put(inst, FURN.shower(), L.shower[0], L.shower[1], 0, false);
  put(inst, FURN.bucket(), L.bucket[0], L.bucket[1], 0);
  if (hasItem('generator')) put(inst, FURN.generator(), L.gen[0], L.gen[1], 0);
  if (hasItem('inverter')) put(inst, FURN.inverter(), L.inverter[0], L.inverter[1], L.inverter[2]);
  if (L.guest){ put(inst, FURN.bed('single'), L.guest[0], L.guest[1], 0); }
  // neighbours (face-me-I-face-you)
  if (L.neighbours){
    L.neighbours.forEach(([x, z, side]) => onWall(inst, FURN.closedDoor(), side === 'w' ? x + 0.2 : x - 0.2, 1.4, z));
    put(inst, FURN.bench(1.1), L.neighbour[0], L.neighbour[1], Math.PI / 2);
    const nb = staffMember(inst, L.neighbour[0], L.neighbour[1], Math.PI / 2, outfit(Math.random() < 0.5 ? 'm' : 'f'), {sit:true, name:'Neighbour'});
    station(inst, 'neighbour', L.neighbour[0] + 0.9, L.neighbour[1], '💬 Talk to neighbour', () => speak(nb, pick(['Your turn to sweep the compound this week o!', 'NEPA don take light again. This country!', 'Who finish the water for the drum?', 'Landlord say rent go increase. Hmm.', 'Good morning neighbour! How work?'])));
  }
  // stations
  const S_ = L.st;
  station(inst, 'bed', S_.bed[0], S_.bed[1], '🛏️ Bed', () => openPanel('bed'));
  station(inst, 'desk', S_.desk[0], S_.desk[1], hasItem('laptop') ? '💻 Desk' : '📖 Study table', () => openPanel('desk'));
  if (hasItem('tv') || hasItem('sofa')) station(inst, 'lounge', (S_.sofa || S_.tv)[0], (S_.sofa || S_.tv)[1], hasItem('tv') ? '📺 TV' : '🛋️ Sofa', () => openPanel('lounge'));
  if (hasItem('wardrobe')) station(inst, 'wardrobe', S_.wardrobe[0], S_.wardrobe[1], '👔 Wardrobe', () => openPanel('wardrobe'));
  if (hasItem('dining') && S_.dining) station(inst, 'dining', S_.dining[0], S_.dining[1], '🍽️ Dining table', () => { if (!state.daily.dined){ state.daily.dined = true; gain('happy', 2); } openPanel('inventory'); });
  if (hasItem('shelf') && S_.shelf) station(inst, 'shelf', S_.shelf[0], S_.shelf[1], '📚 Bookshelf', () => openPanel('desk'));
  station(inst, 'kitchen', S_.kitchen[0], S_.kitchen[1], '🍳 Kitchen', () => openPanel('kitchen'));
  if (S_.fridge && hasItem('fridge')) station(inst, 'fridge', S_.fridge[0], S_.fridge[1], '🧊 Fridge', () => openPanel('kitchen'));
  station(inst, 'bath', S_.bath[0], S_.bath[1], '🚿 Bathroom', () => openPanel('bath'));
  if (S_.guest) station(inst, 'guest', S_.guest[0], S_.guest[1], '🛏️ Guest room', () => toast(KIDS().length ? 'The children\'s room. 🧸' : 'Your guest room. Family visitors and, later, your children will sleep here.', 'info'));
  station(inst, 'exit', S_.exit[0], S_.exit[1], '🚪 Go outside', () => exitBuilding(), {r:0.9});
  if (typeof homeFamily === 'function') homeFamily(inst);
}

/* =========================================================
   NIMC ENROLMENT CENTRE
   ========================================================= */
const TOWN_STATE = {Abeokuta:'Ogun', Osogbo:'Osun', Ogbomoso:'Oyo', Ilesa:'Osun', Nsukka:'Enugu', Awka:'Anambra', Onitsha:'Anambra', Abakaliki:'Ebonyi', Owerri:'Imo', Bori:'Rivers', Yenagoa:'Bayelsa', Uyo:'Akwa Ibom', Katsina:'Katsina', Zaria:'Kaduna', Dutse:'Jigawa', Kaduna:'Kaduna', Jos:'Plateau', Lokoja:'Kogi', Keffi:'Nasarawa', Minna:'Niger'};
function buildNimc(inst){
  addRooms(inst, [{x:0, z:0, w:13, d:9, floor:'terrazzo'}], [{x:6.5, z:9, axis:'x', w:1.6}], '#eef2ee');
  inst.spawn = [6.5, 8.3]; inst.entrance = {x:6.5, z:9};
  put(inst, FURN.officeCounter(9), 6.5, 2.2, 0);
  [3.5, 6.5, 9.5].forEach((x, i) => {
    put(inst, FURN.chair('#1c2833'), x, 1.35, 0);
    onWall(inst, FURN.sign(`COUNTER ${i + 1}`, 1.1, 0.3, '#0a7d3b'), x, 2.45, 0);
  });
  onWall(inst, FURN.sign('NIMC · National Identity Management Commission', 6, 0.6, '#0a7d3b'), 6.5, 2.35, 0.2);
  onWall(inst, FURN.sign('Enrolment is FREE. Do not pay anybody!', 2.6, 0.6, '#ffffff', '#0a7d3b'), 0.1, 1.7, 4.0);
  onWall(inst, FURN.sign('No NIN: no SIM, no JAMB, no bank account', 2.6, 0.6, '#c0392b'), 12.9, 1.7, 7.4);
  onWall(inst, FURN.window(1.4), 0, 1.6, 6.8); onWall(inst, FURN.window(1.4), 13, 1.6, 2.2);
  onWall(inst, FURN.ac(), 2.0, 2.4, 0.1); onWall(inst, FURN.ac(), 11.0, 2.4, 0.1);
  const tm = put(inst, FURN.ticketMachine(), 9.7, 7.9, -Math.PI / 2);
  [4.6, 5.8, 7.0].forEach(z => put(inst, FURN.bench(4.4), 3.6, z, Math.PI));
  put(inst, FURN.dispenser(), 0.6, 7.9, Math.PI / 2);
  put(inst, FURN.plant(), 12.4, 8.4); put(inst, FURN.plant(), 0.6, 0.6);
  // capture booth
  put(inst, FURN.backdrop(), 12.6, 5.0, -Math.PI / 2);
  put(inst, FURN.stool(), 11.7, 5.0, 0);
  const rig = put(inst, FURN.cameraRig(), 10.2, 5.0, Math.PI / 2);
  const sc = put(inst, FURN.scanner(), 11.0, 3.75, 0);
  onWall(inst, FURN.sign('CAPTURE BOOTH', 1.6, 0.35, '#0a7d3b'), 12.95, 2.45, 5.0);
  inst.flash = rig.userData.flash; inst.scanGlow = sc.userData.glow;
  // people
  const off = [];
  [3.5, 6.5, 9.5].forEach((x, i) => off.push(staffMember(inst, x, 1.35, 0, UNIFORM.nimc(i === 1 ? 'f' : 'm'), {sit:true, name:`Officer ${['Bello', 'Ngozi', 'Tunji'][i]}`})));
  inst.officer = off[1];
  inst.capOfficer = staffMember(inst, 10.0, 4.0, Math.PI / 2 + 0.4, UNIFORM.nimc('m'), {name:'Capture officer'});
  inst.guard = staffMember(inst, 7.7, 8.3, -Math.PI / 2, UNIFORM.guard(), {name:'Security'});
  [[2.2, 4.6], [4.4, 5.8], [3.3, 7.0], [5.0, 4.6]].forEach(([x, z]) => staffMember(inst, x, z, Math.PI, outfit(Math.random() < 0.5 ? 'm' : 'f'), {sit:true}));
  staffMember(inst, 3.5, 3.0, Math.PI, outfit('f'), {});
  inst.seat = {x:inst.ox + 5.6, z:inst.oz + 5.8, face:Math.PI};
  // stations
  station(inst, 'ticket', 9.0, 7.9, '🎫 Ticket machine', () => nimcTicket(inst));
  station(inst, 'wait', 5.6, 6.45, '🪑 Sit and wait', () => nimcWait(inst));
  station(inst, 'counter', 6.5, 3.05, '🧑🏾‍💼 Counter 2', () => nimcCounter(inst));
  station(inst, 'capture', 11.2, 5.9, '📸 Capture booth', () => nimcCapture(inst));
  station(inst, 'guard', 7.7, 7.6, '💬 Talk to security', () => speak(inst.guard, state.nin ? 'Oga, you don get NIN already. Safe journey.' : 'Welcome! Take a ticket from the machine, then sit and wait for your number.'), {r:0.8});
  station(inst, 'exit', 6.5, 8.75, '🚪 Exit', () => exitBuilding(), {r:0.8});
}
function nimcTicket(inst){
  const v = inst.visit;
  if (state.nin || state.ninReadyDay){ speak(inst.guard, state.nin ? 'You already have your NIN.' : 'Your enrolment is processing. Wait for the SMS.'); return; }
  if (v.ticket){ toast(`You already have ticket ${v.ticket}. Sit and wait.`, 'info'); return; }
  v.ticket = 'A0' + rint(42, 69); v.serving = parseInt(v.ticket.slice(1)) - rint(4, 7);
  runScene([{face:Math.PI / 2}, {say:['player', 'Press... print ticket.'], ms:900}, {sound:'ding'}, {say:['Machine', `🎫 Ticket ${v.ticket}. Now serving A0${v.serving}. Please wait.`], who:null, ms:2200}]);
}
function nimcWait(inst){
  const v = inst.visit;
  if (!v.ticket){ speak(inst.guard, 'Take a ticket first, abeg.'); return; }
  if (v.called){ toast('Your number has been called. Go to Counter 2.', 'info'); return; }
  const w = rint(40, 75);
  runScene([
    {to:inst.seat, pose:'sit', y:0},
    {say:['player', 'Hmm, this queue long o...'], ms:1500},
    {fade:`⏳ ${w} minutes later...`, fx:() => { advanceTime(w); gain('energy', -4); }},
    {say:[inst.officer, `${v.ticket}! ${v.ticket}, Counter 2!`], ms:2000},
    {pose:null, to:{x:inst.seat.x, z:inst.seat.z + 0.7, face:Math.PI}},
    {fx:() => { v.called = true; }}
  ]);
}
function nimcCounter(inst){
  const v = inst.visit;
  if (state.nin){ speak(inst.officer, `Good day. Your NIN is active. Keep your slip safe, ${state.name}.`); return; }
  if (state.ninReadyDay){ speak(inst.officer, 'Your enrolment is processing. You will get your NIN by SMS within 24 hours.'); return; }
  if (!v.called){ speak(inst.officer, v.ticket ? 'Please sit down. We will call your number.' : 'Take a ticket from the machine first.'); return; }
  if (v.form){ speak(inst.officer, 'Go to the capture booth for your photo and fingerprints.'); return; }
  runScene([{face:Math.PI}, {say:[inst.officer, 'Good morning. Fill this enrolment form, please.'], ms:1800}, {fx:() => openPanel('nimcForm')}]);
}
function nimcCapture(inst){
  const v = inst.visit;
  if (state.nin || state.ninReadyDay){ speak(inst.capOfficer, 'Your capture is already done.'); return; }
  if (!v.form){ speak(inst.capOfficer, v.called ? 'Fill your form at Counter 2 first.' : 'Take a ticket and wait to be called first.'); return; }
  const flash = on => { if (inst.flash) inst.flash.material.emissiveIntensity = on ? 3 : 0; };
  const glow = on => { if (inst.scanGlow) inst.scanGlow.material.emissiveIntensity = on ? 2.5 : 0; };
  runScene([
    {to:{x:inst.ox + 11.7, z:inst.oz + 5.0, face:-Math.PI / 2}, pose:'sit', y:0},
    {say:[inst.capOfficer, 'Sit straight. Look at the camera. No smiling.'], ms:2000},
    {fx:() => flash(true), flashScreen:true, wait:250}, {fx:() => flash(false), wait:500},
    {say:[inst.capOfficer, 'Good. Now place your four fingers, left hand, on the scanner.'], ms:2000},
    {fx:() => glow(true), wait:700}, {fx:() => glow(false), wait:300}, {fx:() => glow(true), wait:700}, {fx:() => glow(false)},
    {say:[inst.capOfficer, 'Right hand... and now both thumbs.'], ms:1600},
    {fx:() => glow(true), wait:900}, {fx:() => glow(false)},
    {say:[inst.capOfficer, 'Sign on the pad here.'], ms:1500},
    {say:['player', '✍🏾 (signs)'], ms:900},
    {fx:() => {
      advanceTime(60); state.ninReadyDay = state.day + GOV.nin.waitDays; gain('rep', 3);
      addHistory('Enrolled for NIN at NIMC (photo, fingerprints, signature)', '🖐🏾'); v.done = true;
    }},
    {say:[inst.capOfficer, `All done! Your NIN will be sent to your phone by SMS within 24 hours.`], ms:2300},
    {pose:null, to:{x:inst.ox + 11.0, z:inst.oz + 5.9, face:Math.PI}}
  ]);
}

/* =========================================================
   HOMESTYLE FURNITURE SHOWROOM
   ========================================================= */
function buildFurnitureShop(inst){
  addRooms(inst, [{x:0, z:0, w:11, d:8, floor:'wood'}], [{x:5.5, z:8, axis:'x', w:1.6}], '#f5ede0');
  inst.spawn = [5.5, 7.3]; inst.entrance = {x:5.5, z:8};
  onWall(inst, FURN.sign('HomeStyle Furniture · Make your house a home', 5, 0.55, '#8a5a2b'), 5.5, 2.35, 0.2);
  put(inst, FURN.sofa(3, '#33415c'), 2.0, 1.2, 0); put(inst, FURN.rug(2.4, 1.6), 2.0, 2.9, 0, false); put(inst, FURN.tv(), 2.0, 4.3, Math.PI);
  put(inst, FURN.bed('double'), 8.8, 1.6, 0); put(inst, FURN.wardrobe(), 10.5, 3.6, -Math.PI / 2);
  put(inst, FURN.dining(), 5.5, 1.5, 0); put(inst, FURN.fridge(), 0.5, 6.6, Math.PI / 2); put(inst, FURN.counter(1.6, 'gas'), 0.45, 5.0, Math.PI / 2);
  put(inst, FURN.shelf(), 10.5, 6.0, -Math.PI / 2); put(inst, FURN.plant(), 4.0, 6.0); put(inst, FURN.plant(), 7.0, 6.0);
  const f = put(inst, FURN.fan(), 7.6, 3.0, 0); inst.anim.push(dt => { f.userData.spin.rotation.z += dt * 12; });
  put(inst, FURN.generator(), 9.0, 7.2); put(inst, FURN.inverter(), 10.2, 7.3, Math.PI);
  onWall(inst, FURN.art(0), 0.1, 1.7, 2.5); onWall(inst, FURN.art(3), 10.9, 1.7, 1.5);
  put(inst, FURN.officeCounter(2.2), 5.5, 4.4, 0);
  const sp = staffMember(inst, 5.5, 3.7, 0, UNIFORM.sales('f'), {name:'Sales rep'});
  station(inst, 'sales', 5.5, 5.15, '🛒 Buy furniture', () => { speak(sp, 'Welcome to HomeStyle! Everything is delivered to your house the same day.'); setTimeout(() => openPanel('furniture'), 900); });
  station(inst, 'exit', 5.5, 7.75, '🚪 Exit', () => exitBuilding(), {r:0.8});
}

/* =========================================================
   REGISTRY
   ========================================================= */
const INTERIOR_DEFS = {
  home:      {slot:2, name:'Your Home', always:true, rebuild:true, build:buildHome,
    hint:() => {
      if (state.hunger < 35 && (state.inv.foodstuff || 0) > 0) return 'kitchen';
      if (state.energy < 25 || hour() >= 21 || hour() < 5) return 'bed';
      const t = navTargetId(); return t && t !== 'home' ? 'exit' : null;
    }},
  nimc:      {slot:0, name:'NIMC Enrolment Centre', hours:GOV.nin.open, build:buildNimc,
    hint:inst => { const v = inst.visit; if (state.nin || state.ninReadyDay) return 'exit'; return !v.ticket ? 'ticket' : !v.called ? 'wait' : !v.form ? 'counter' : 'capture'; }},
  furniture: {slot:1, name:'HomeStyle Furniture', hours:[8, 20], build:buildFurnitureShop, hint:() => 'sales'}
};
const hasInterior = id => !!INTERIOR_DEFS[id];

/* =========================================================
   ENTER / EXIT
   ========================================================= */
const fadeEl = () => $('fadeScreen');
function fadeTo(on, text){
  return new Promise(res => {
    const f = fadeEl(); f.querySelector('span').textContent = text || '';
    f.classList.toggle('on', on);
    setTimeout(res, 420);
  });
}
async function enterBuilding(id){
  const def = INTERIOR_DEFS[id], b = B[id];
  if (def.hours && !inHours(def.hours[0], def.hours[1])){ toast(`${b.name} is closed. Opening hours: ${fmtH(def.hours[0])} to ${fmtH(def.hours[1])}.`, 'bad'); return; }
  paused = true; keys.clear(); resetJoy();
  await fadeTo(true, b.name);
  let inst = intCache[id];
  if (def.rebuild && inst){ scene.remove(inst.group); inst.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); inst = null; }
  if (!inst){ inst = newInterior(id, def.slot, def.name); def.build(inst); intCache[id] = inst; }
  inst.def = def; inst.visit = {};
  Object.values(intCache).forEach(x => x.group.visible = x === inst);
  if (state.riding){ state.riding = false; toast('You parked your okada outside.', 'info'); }
  inside = inst;
  player.x = (inst.ox + inst.spawn[0]) / S; player.y = (inst.oz + inst.spawn[1]) / S; player.face = Math.PI; player.pose = null;
  camS.yaw = 0; camS.dist = 7.5; camS.pitch = 0.85;
  camera.position.set(player.x * S, 6, player.y * S + 5);
  PATH = []; pathTimer = 0; lastTarget = '#';
  if (state.nav === id) state.nav = null;
  await new Promise(r => setTimeout(r, 120));
  await fadeTo(false);
  paused = false;
  if (def.onEnter) def.onEnter(inst);
}
async function exitBuilding(){
  if (!inside) return;
  const id = inside.id, b = B[id];
  paused = true; keys.clear(); resetJoy();
  await fadeTo(true, '');
  inside.group.visible = false; inside = null; player.pose = null;
  const out = b.door === 's' ? 1 : -1;
  player.x = b.frontX; player.y = b.frontY + out * 6; player.face = out > 0 ? 0 : Math.PI;
  camS.yaw = player.face + Math.PI; camS.dist = 9.5; camS.pitch = 0.32;
  camera.position.set(player.x * S + Math.sin(camS.yaw) * 9, 4, player.y * S + Math.cos(camS.yaw) * 9);
  PATH = []; pathTimer = 0; lastTarget = '#';
  await new Promise(r => setTimeout(r, 120));
  await fadeTo(false);
  paused = !!panelState;
}
function intFree(px, py){
  if (!inside) return true;
  const x = px * S, z = py * S, r = 0.24;
  for (const s of inside.solids) if (x + r > s.x0 && x - r < s.x1 && z + r > s.z0 && z - r < s.z1) return false;
  return true;
}

/* =========================================================
   PER-FRAME (inside)
   ========================================================= */
function intTick(dt){
  const x = player.x * S, z = player.y * S, e = inside.entrance;
  if (e && z > inside.oz + e.z + 0.45){ exitBuilding(); return; }
  let best = null, bd = 1e9;
  inside.stations.forEach(s => { if (s.cond && !s.cond()) return; const d = Math.hypot(x - s.x, z - s.z); if (d < s.r && d < bd){ bd = d; best = s; } });
  target = best ? {type:'s', s:best} : null;
  const label = best ? best.label : '';
  if (label !== lastTarget){
    lastTarget = label;
    if (label){ hintEl.textContent = isTouch ? `Tap the button: ${label}` : `Press E: ${label}`; hintEl.style.display = 'block'; hintEl.classList.remove('warn'); }
    else hintEl.style.display = 'none';
    actBtn.textContent = best ? (best.id === 'exit' ? 'EXIT' : 'USE') : '•';
    actBtn.classList.toggle('dim', !best);
  }
  pathTimer -= dt;
  if (pathTimer <= 0){
    pathTimer = 0.25;
    const hid = inside.def.hint ? inside.def.hint(inside) : null;
    const hs = hid && inside.stations.find(s => s.id === hid);
    inside.hintStation = hs || null;
    PATH = [];
    if (hs && state.guide){
      const n = Math.max(1, Math.floor(Math.hypot(hs.x - x, hs.z - z) / 0.55));
      for (let i = 0; i <= n; i++){ const t = i / n; PATH.push({x:lerp(x, hs.x, t) / S, y:lerp(z, hs.z, t) / S}); }
    }
  }
}
function intRender(dt, now){
  inside.stations.forEach(s => {
    const d = Math.hypot(player.x * S - s.x, player.y * S - s.z);
    s.sprite.visible = d < 5.5;
    const hot = (target && target.s === s) || inside.hintStation === s;
    s.ring.material.opacity = hot ? 0.75 + Math.sin(now / 200) * 0.2 : 0.3;
    s.ring.material.color.set(hot ? 0xffd23f : 0x7dffa8);
  });
  inside.staff.forEach(st => { st.ph += dt * 1.5; animPerson(st.p, false, st.ph, false, 0, st.pose); });
  inside.anim.forEach(f => f(dt));
  // cut away walls between the camera and the player
  const cx = camera.position.x - player.x * S, cz = camera.position.z - player.y * S, cl = Math.hypot(cx, cz) || 1;
  const dx = cx / cl, dz = cz / cl, px = player.x * S, pz = player.y * S;
  inside.walls.forEach(w => {
    const facing = Math.abs(w.nx * dx + w.nz * dz) > 0.3;
    const ahead = (w.cx - px) * dx + (w.cz - pz) * dz > 0.25;
    const cut = facing && ahead;
    if (cut !== w.cut){ w.cut = cut; w.mesh.scale.y = cut ? (w.y0 > 0 ? 0.001 : 0.1) : 1; w.mesh.position.y = cut ? w.y0 + w.h * 0.05 : w.y0 + w.h / 2; }
  });
}
function drawMiniInterior(){
  const mini = $('mini'), m = mini.getContext('2d'), W = mini.width, H = mini.height;
  const R = inside.rooms;
  const x0 = Math.min(...R.map(r => r.x)) - 1, x1 = Math.max(...R.map(r => r.x + r.w)) + 1, z0 = Math.min(...R.map(r => r.z)) - 1, z1 = Math.max(...R.map(r => r.z + r.d)) + 1;
  const sc = Math.min(W / (x1 - x0), H / (z1 - z0)), ox = (W - (x1 - x0) * sc) / 2, oz = (H - (z1 - z0) * sc) / 2;
  const tx = x => ox + (x - inside.ox - x0) * sc, tz = z => oz + (z - inside.oz - z0) * sc;
  m.fillStyle = '#1b1b1b'; m.fillRect(0, 0, W, H);
  R.forEach(r => { m.fillStyle = '#d8cdb8'; m.fillRect(ox + (r.x - x0) * sc, oz + (r.z - z0) * sc, r.w * sc, r.d * sc); m.strokeStyle = '#555'; m.lineWidth = 2; m.strokeRect(ox + (r.x - x0) * sc, oz + (r.z - z0) * sc, r.w * sc, r.d * sc); });
  inside.stations.forEach(s => { m.fillStyle = inside.hintStation === s ? '#ffd23f' : '#0b8a4a'; m.beginPath(); m.arc(tx(s.x), tz(s.z), 4, 0, Math.PI * 2); m.fill(); });
  const mx = tx(player.x * S), my = tz(player.y * S);
  m.fillStyle = '#fff'; m.beginPath(); m.arc(mx, my, 6, 0, Math.PI * 2); m.fill();
  m.fillStyle = '#c0392b'; m.beginPath(); m.arc(mx, my, 4, 0, Math.PI * 2); m.fill();
}

/* =========================================================
   SCENES: short cinematic sequences + speech bubbles
   ========================================================= */
let speech = null;
const wait = ms => new Promise(r => setTimeout(r, ms));
function showSpeech(who, text){
  const el = $('speech');
  const name = who === 'player' ? state.name : who && who.name !== undefined ? who.name : (typeof who === 'string' ? who : '');
  el.querySelector('b').textContent = name || '';
  el.querySelector('span').textContent = text;
  el.style.display = 'block';
  speech = {who};
}
function hideSpeech(){ $('speech').style.display = 'none'; speech = null; }
function speak(who, text){ showSpeech(who, text); clearTimeout(speak.t); speak.t = setTimeout(hideSpeech, 2800); }
function updateSpeech(){
  if (!speech) return;
  const el = $('speech'), v = new THREE.Vector3();
  if (speech.who === 'player') v.set(player.x * S, 2.15 + (player.pose === 'lie' ? -1 : 0), player.y * S);
  else if (speech.who && speech.who.p) v.set(speech.who.x, speech.who.pose === 'sit' ? 1.8 : 2.2, speech.who.z);
  else { el.style.left = '50%'; el.style.top = '22%'; return; }
  v.project(camera);
  el.style.left = clamp((v.x * 0.5 + 0.5) * vw, 120, vw - 120) + 'px';
  el.style.top = clamp((-v.y * 0.5 + 0.5) * vh, 70, vh - 60) + 'px';
}
function flashScreen(){ const f = $('flash'); f.style.transition = 'none'; f.style.opacity = '0.95'; requestAnimationFrame(() => { f.style.transition = 'opacity .5s'; f.style.opacity = '0'; }); }
async function runScene(steps){
  if (sceneBusy) return;
  sceneBusy = true; paused = true; keys.clear(); resetJoy();
  if (inside){ camS.dist = Math.min(camS.dist, 7); camS.pitch = clamp(camS.pitch, 0.55, 0.9); }
  document.body.classList.add('cine'); hintEl.style.display = 'none'; lastTarget = '#';
  try {
    for (const s of steps){
      if (s.to){ player.x = s.to.x / S; player.y = s.to.z / S; if (s.to.face !== undefined) player.face = s.to.face; }
      if (s.face !== undefined) player.face = s.face;
      if (s.pose !== undefined){ player.pose = s.pose; player.poseY = s.y || 0; }
      if (s.sound) sfx(s.sound);
      if (s.say){ showSpeech(s.say[0], s.say[1]); await wait(s.ms || 1800); hideSpeech(); }
      if (s.flashScreen) flashScreen();
      if (s.fade){ await fadeTo(true, s.fade); if (s.fx) s.fx(); await wait(s.ms || 1300); await fadeTo(false); }
      else if (s.fx) s.fx();
      if (s.wait) await wait(s.wait);
      if (panelState) break;
    }
  } catch (e){ console.error(e); }
  sceneBusy = false; document.body.classList.remove('cine'); hideSpeech();
  paused = !!panelState;
  updateHUD(); saveGame(true);
}

/* Home scenes */
function sleepScene(night){
  const bp = inside && inside.bedPos;
  if (!bp){ toast('Go to your bed to sleep.', 'bad'); return; }
  const gainE = night ? sleepGain() : 25;
  runScene([
    {to:{x:bp.x, z:bp.z, face:0}, pose:'lie', y:bp.y},
    {wait:500},
    {fade:night ? '😴 Zzz... Good night.' : '😴 A quick nap...', ms:1600, fx:() => {
      const hr = hour();
      chargePhone(night ? 100 : PH().battery + 35);
      if (night){ advanceTime(hr >= 18 ? (1440 - state.minutes) + 360 : 360 - state.minutes); gain('energy', gainE); gain('health', 10); gain('hunger', -15); gain('happy', Math.round(homeComfort() / 2)); }
      else { state.daily.naps = (state.daily.naps || 0) + 1; advanceTime(120); gain('energy', 25); gain('hunger', -5); }
    }},
    {pose:null, to:(() => { const bs = inside.stations.find(s => s.id === 'bed'); return {x:bs.x, z:bs.z, face:Math.PI / 2}; })()},
    {say:['player', night ? (hasItem('ac') ? 'Ahh, that AC sleep was sweet! 😌' : 'Morning! Time to hustle. 💪🏾') : 'I feel better now.'], ms:1600}
  ]);
}
function cookScene(){
  const k = inside.stations.find(s => s.id === 'kitchen');
  const mins = hasItem('cooker') ? 30 : 60, food = 45 + (hasItem('fridge') ? 10 : 0);
  runScene([
    {to:{x:k.x, z:k.z, face:inside.layout.kitchen[2] + Math.PI}},
    {fx:() => { if (inside.flame) inside.flame.material.opacity = 0.9; }},
    {say:['player', pick(['Jollof rice loading... 🍛', 'Small stew and rice 🍲', 'Indomie with egg and pepper 🍜', 'Beans and plantain 🥘'])], ms:1600},
    {fade:`🍳 Cooking (${mins} mins)...`, fx:() => { state.inv.foodstuff--; advanceTime(mins); gain('hunger', food); gain('happy', 2); gain('energy', 3); if (inside.flame) inside.flame.material.opacity = 0; }},
    {say:['player', 'E sweet! I go cook more often. 😋'], ms:1400}
  ]);
}
function loungeScene(kind){
  const seat = inside.sofaSeat;
  const tv = inside.tvScreen;
  const st = inside.stations.find(s => s.id === 'lounge');
  const lines = {movie:['📺 Nollywood: "Mama, I don marry!" 😂', 'Watching a Nollywood movie...'], ball:['⚽ GOAL! Super Eagles! 🦅', 'Watching football...'], news:['📰 Tonight\'s headlines...', 'Watching the news...'], relax:['Ahh, this sofa is soft 😌', 'Relaxing...']}[kind];
  runScene([
    seat ? {to:{x:seat.x, z:seat.z, face:seat.face}, pose:'sit', y:0} : {to:{x:st.x, z:st.z}},
    {fx:() => { if (tv && kind !== 'relax') tv.material.emissiveIntensity = 1.2; }},
    {say:['player', lines[0]], ms:1600},
    {fade:lines[1], fx:() => {
      if (kind === 'movie'){ advanceTime(90); gain('happy', 7); }
      else if (kind === 'ball'){ advanceTime(120); gain('happy', 6); gain('energy', 3); }
      else if (kind === 'news'){ advanceTime(30); state.daily.paper = true; gain('happy', 1); }
      else { state.daily.relaxed = true; advanceTime(60); gain('energy', 8); gain('happy', 2); }
      if (tv) tv.material.emissiveIntensity = 0;
    }},
    {pose:null, to:st ? {x:st.x, z:st.z} : null}
  ].filter(Boolean)).then(() => { if (kind === 'news') result('Tonight\'s news 📰', `<ul>${state.news.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`); });
}
