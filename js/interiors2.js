'use strict';
/* =========================================================
   INTERIORS 2: every remaining building gets a walk-in
   interior with staff, customers, furniture and stations.
   Panel actions that take time play a short scene inside
   (sit for the lecture, lie in the ward bed, eat at the table).
   ========================================================= */

/* ---------- extra furniture ---------- */
let pitchTex = null;
function PITCH_TEX(){
  if (pitchTex) return pitchTex;
  return pitchTex = ctex(256, 144, (g, w, h) => {
    for (let i = 0; i < 8; i++){ g.fillStyle = i % 2 ? '#2e8b3a' : '#34a043'; g.fillRect(i * w / 8, 0, w / 8, h); }
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.strokeRect(10, 10, w - 20, h - 20);
    g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w / 2, h - 10); g.stroke(); g.beginPath(); g.arc(w / 2, h / 2, 18, 0, Math.PI * 2); g.stroke();
    g.strokeRect(10, h / 2 - 28, 30, 56); g.strokeRect(w - 40, h / 2 - 28, 30, 56);
    [[90, 60, '#f1c40f'], [120, 80, '#f1c40f'], [150, 50, '#e74c3c'], [170, 95, '#e74c3c'], [70, 100, '#f1c40f']].forEach(([x, y, c]) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#fff'; g.beginPath(); g.arc(130, 70, 2, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(8, 6, 92, 16); g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.fillText('NGA 1 - 0 GHA  67\'', 12, 18);
  });
}
Object.assign(FURN, {
  pew(len){
    const g = new THREE.Group(), m = STD('#6b4226', {roughness:0.6});
    part(g, BX(len, 0.06, 0.45), m, 0, 0.45, 0);
    part(g, BX(len, 0.5, 0.05), m, 0, 0.75, -0.22);
    [-len / 2 + 0.04, len / 2 - 0.04].forEach(x => part(g, BX(0.06, 0.95, 0.5), m, x, 0.47, -0.02));
    part(g, BX(len, 0.04, 0.12), m, 0, 0.9, -0.3);
    return g;
  },
  cross(){ const g = new THREE.Group(), m = STD('#c9a227', {metalness:0.6, roughness:0.35}); part(g, BX(0.14, 1.6, 0.06), m, 0, 0, 0); part(g, BX(0.9, 0.14, 0.06), m, 0, 0.3, 0); return g; },
  pulpit(){ const g = new THREE.Group(); part(g, BX(0.7, 1.05, 0.5), STD('#5a3920', {roughness:0.55}), 0, 0.52, 0); part(g, BX(0.78, 0.05, 0.6), STD('#7a4f2c'), 0, 1.08, -0.02, -0.25); part(g, BX(0.5, 0.4, 0.01), STD('#c9a227', {metalness:0.5}), 0, 0.6, 0.255); return g; },
  barberChair(){
    const g = new THREE.Group(), red = STD('#7b1d1d', {roughness:0.45});
    part(g, CY(0.25, 0.3, 0.06, 16), METAL(), 0, 0.03, 0);
    part(g, CY(0.06, 0.06, 0.4, 10), METAL(), 0, 0.25, 0);
    part(g, BX(0.55, 0.12, 0.55), red, 0, 0.48, 0);
    part(g, BX(0.55, 0.65, 0.1), red, 0, 0.85, -0.25);
    part(g, BX(0.3, 0.18, 0.08), red, 0, 1.25, -0.25);
    [-1, 1].forEach(s => part(g, BX(0.07, 0.06, 0.45), METAL(), s * 0.3, 0.66, 0));
    part(g, BX(0.4, 0.04, 0.2), METAL(), 0, 0.15, 0.4);
    return g;
  },
  mirror(w, h){ const g = new THREE.Group(); part(g, BX(w + 0.08, h + 0.08, 0.03), BLACK(), 0, 0, 0); part(g, BX(w, h, 0.01), STD('#cfdde6', {metalness:0.95, roughness:0.06}), 0, 0, 0.02); return g; },
  pots(){
    const g = FURN.table(2.4, 0.7, '#6d4c2f');
    [[-0.85, '#8e8e8e'], [-0.3, '#b03a2e'], [0.25, '#8e8e8e'], [0.8, '#2e86c1']].forEach(([x, c]) => {
      part(g, CY(0.22, 0.2, 0.32, 16), STD(c, {metalness:0.5, roughness:0.4}), x, 0.93, 0);
      part(g, CY(0.23, 0.23, 0.03, 16), STD('#7f8c8d', {metalness:0.6}), x, 1.1, 0);
    });
    part(g, BX(0.5, 0.35, 0.35), STD('#e74c3c'), 0.9, 0.95, -0.15);
    return g;
  },
  plasticSet(color){
    const g = new THREE.Group(), m = STD(color || '#c0392b', {roughness:0.35});
    part(g, CY(0.45, 0.45, 0.03, 20), m, 0, 0.72, 0);
    part(g, CY(0.05, 0.12, 0.7, 10), m, 0, 0.35, 0);
    [[0.62, 0, -Math.PI / 2], [-0.62, 0, Math.PI / 2], [0, 0.62, Math.PI], [0, -0.62, 0]].forEach(([x, z, r]) => { const c = FURN.chair(color || '#c0392b'); c.position.set(x, 0, z); c.rotation.y = r; g.add(c); });
    return g;
  },
  printer(){ const g = new THREE.Group(); part(g, BX(0.45, 0.22, 0.38), STD('#ddd'), 0, 0.11, 0); part(g, BX(0.3, 0.01, 0.2), WHITE(), 0, 0.23, 0.05); return g; },
  cellBars(len){
    const g = new THREE.Group(), m = STD('#4a4f55', {metalness:0.8, roughness:0.4});
    for (let x = -len / 2 + 0.07; x < len / 2; x += 0.14) part(g, CY(0.015, 0.015, 2.6, 6), m, x, 1.3, 0);
    [0.08, 1.2, 2.55].forEach(y => part(g, BX(len, 0.05, 0.05), m, 0, y, 0));
    return g;
  },
  bigTV(w){
    const g = new THREE.Group(), h = w * 0.56;
    part(g, BX(w + 0.08, h + 0.08, 0.06), BLACK(), 0, 0, 0);
    const scr = new THREE.MeshStandardMaterial({color:LIN('#111111'), map:PITCH_TEX(), emissive:new THREE.Color(0xffffff), emissiveMap:PITCH_TEX(), emissiveIntensity:0.9, roughness:0.2});
    g.userData.screen = part(g, BX(w, h, 0.01), scr, 0, 0, 0.032);
    return g;
  },
  barShelf(w){
    const g = new THREE.Group();
    part(g, BX(w, 1.8, 0.05), STD('#2b1d14'), 0, 1.3, -0.12);
    [0.75, 1.25, 1.75].forEach(y => {
      part(g, BX(w, 0.04, 0.28), STD('#5a3920'), 0, y, 0);
      for (let x = -w / 2 + 0.12; x < w / 2 - 0.05; x += 0.16) part(g, CY(0.035, 0.04, 0.28, 8), STD(pick(['#1e5631', '#6b3e1e', '#d4a017', '#8b1a1a', '#e8e8e8']), {roughness:0.15, metalness:0.2}), x, y + 0.16, 0);
    });
    return g;
  },
  barCounter(w){ const g = new THREE.Group(); part(g, BX(w, 1.05, 0.6), STD('#3a2618', {roughness:0.5}), 0, 0.52, 0); part(g, BX(w + 0.1, 0.06, 0.7), STD('#c9a227', {metalness:0.4, roughness:0.3}), 0, 1.08, 0); return g; },
  poolTable(){
    const g = new THREE.Group();
    part(g, BX(2.4, 0.18, 1.3), STD('#5a3920'), 0, 0.72, 0);
    part(g, BX(2.2, 0.02, 1.1), STD('#1e7a3a', {roughness:0.95}), 0, 0.82, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => part(g, BX(0.14, 0.65, 0.14), STD('#3a2618'), sx * 1.05, 0.32, sz * 0.5));
    for (let i = 0; i < 9; i++) part(g, new THREE.SphereGeometry(0.03, 10, 8), STD(i ? pick(['#e74c3c', '#f1c40f', '#2e86c1', '#8e44ad', '#111']) : '#fff', {roughness:0.2}), -0.6 + Math.random() * 1.2, 0.86, -0.4 + Math.random() * 0.8);
    return g;
  },
  hospitalBed(){
    const g = new THREE.Group(), m = METAL();
    part(g, BX(0.95, 0.08, 2.05), m, 0, 0.55, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => part(g, CY(0.025, 0.025, 0.55, 6), m, sx * 0.42, 0.27, sz * 0.95));
    part(g, BX(0.9, 0.16, 1.95), STD('#dfe9f2', {roughness:0.9}), 0, 0.67, 0);
    part(g, BX(0.88, 0.03, 1.2), STD('#7fb3d5', {roughness:0.9}), 0, 0.76, 0.35);
    part(g, BX(0.5, 0.1, 0.3), WHITE(), 0, 0.8, -0.75);
    part(g, BX(1.0, 0.75, 0.05), WHITE(), 0, 0.9, -1.02);
    [-1, 1].forEach(s => part(g, BX(0.03, 0.2, 0.9), m, s * 0.47, 0.85, 0.2));
    g.userData.lieY = 0.78; return g;
  },
  ivStand(){ const g = new THREE.Group(); part(g, CY(0.015, 0.015, 1.9, 6), METAL(), 0, 0.95, 0); part(g, CY(0.2, 0.2, 0.03, 10), METAL(), 0, 0.02, 0); part(g, BX(0.12, 0.2, 0.05), STD('#d6eaf8', {transparent:true, opacity:0.8}), 0.06, 1.8, 0); return g; },
  board(text, w, h){ const g = new THREE.Group(); part(g, BX(w + 0.1, h + 0.1, 0.04), STD('#7a4f2c'), 0, 0, 0); const b = FURN.sign(text, w, h, '#1f4d36', '#e8f5e9'); b.position.z = 0.025; g.add(b); return g; },
  podium(){ const g = new THREE.Group(); part(g, BX(0.6, 1.1, 0.45), STD('#5a3920', {roughness:0.55}), 0, 0.55, 0); part(g, BX(0.7, 0.05, 0.55), STD('#7a4f2c'), 0, 1.12, -0.02, -0.2); return g; },
  flag(){
    const g = new THREE.Group();
    part(g, CY(0.025, 0.03, 2.5, 8), METAL(), 0, 1.25, 0);
    part(g, CY(0.2, 0.25, 0.08, 12), STD('#333'), 0, 0.04, 0);
    [['#008751', -0.3], ['#ffffff', 0], ['#008751', 0.3]].forEach(([c, x]) => part(g, BX(0.3, 0.6, 0.01), STD(c, {roughness:0.9}), 0.17 + x + 0.3, 2.15, 0));
    return g;
  },
  atm(){
    const g = new THREE.Group();
    part(g, BX(0.7, 1.6, 0.5), STD('#0b3d91', {roughness:0.4}), 0, 0.8, 0);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshBasicMaterial({color:0x5fd3ff})); s.position.set(0, 1.25, 0.255); g.add(s);
    part(g, BX(0.36, 0.04, 0.18), STD('#cfd3d6'), 0, 0.98, 0.3);
    part(g, BX(0.25, 0.03, 0.03), BLACK(), 0.12, 1.06, 0.256);
    const sg = FURN.sign('ATM', 0.5, 0.16, '#f1c40f', '#0b3d91'); sg.position.set(0, 1.5, 0.256); g.add(sg);
    return g;
  },
  stall(){
    const g = FURN.table(1.8, 0.9, '#8a6a45');
    const piles = [['#e74c3c', '#c0392b'], ['#f39c12', '#e67e22'], ['#27ae60', '#1e8449'], ['#f1c40f', '#d4ac0d']];
    [-0.6, -0.2, 0.2, 0.6].forEach((x, i) => { for (let k = 0; k < 6; k++) part(g, new THREE.SphereGeometry(0.06 + Math.random() * 0.03, 8, 6), STD(pick(piles[i]), {roughness:0.7}), x + (Math.random() - 0.5) * 0.25, 0.83 + (k > 3 ? 0.08 : 0), (Math.random() - 0.5) * 0.4); });
    const cm = STD(pick(['#c0392b', '#1e8449', '#2471a3', '#d35400']), {roughness:0.8});
    part(g, BX(2.2, 0.04, 1.4), cm, 0, 2.25, 0, 0.12);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => part(g, CY(0.02, 0.02, 2.25, 6), STD('#6b4a2a'), sx * 1.0, 1.12, sz * 0.6));
    return g;
  },
  sacks(){ const g = new THREE.Group(); [[0, 0, 0], [0.5, 0, 0.1], [0.25, 0.42, 0.05]].forEach(([x, y, z]) => part(g, CY(0.24, 0.26, 0.45, 10), STD('#c9b07a', {roughness:1}), x, y + 0.22, z)); return g; },
  waterPacks(){ const g = new THREE.Group(); for (let y = 0; y < 3; y++) for (let i = 0; i < 3 - y; i++) part(g, BX(0.4, 0.18, 0.3), STD('#cfe9f7', {transparent:true, opacity:0.85, roughness:0.2}), i * 0.42 + y * 0.21, 0.09 + y * 0.18, 0); return g; },
  posStand(){ const g = FURN.table(0.8, 0.6, '#1f618d'); part(g, BX(0.12, 0.04, 0.2), STD('#222'), 0, 0.79, 0); part(g, CY(0.01, 0.01, 2.0, 6), METAL(), 0.35, 1.0, -0.25); part(g, new THREE.ConeGeometry(0.9, 0.35, 12), STD('#f1c40f', {roughness:0.8}), 0.35, 2.1, -0.25); return g; },
  tapRow(){ const g = new THREE.Group(); part(g, BX(2.0, 0.12, 0.4), STD('#d0d3d4'), 0, 0.45, 0); for (let x = -0.75; x <= 0.75; x += 0.5){ part(g, CY(0.02, 0.02, 0.25, 6), METAL(), x, 0.85, -0.12); part(g, BX(0.03, 0.03, 0.12), METAL(), x, 0.96, -0.06); part(g, BX(0.25, 0.3, 0.04), STD('#d0d3d4'), x, 0.3, 0.1); } return g; },
  shoeRack(){ const g = new THREE.Group(); part(g, BX(1.4, 0.6, 0.35), STD('#7a4f2c'), 0, 0.3, 0); for (let i = 0; i < 6; i++) part(g, BX(0.1, 0.06, 0.25), STD(pick(['#222', '#6b3e1e', '#c0392b', '#eee'])), -0.55 + i * 0.22, 0.63, 0); return g; },
  mihrab(){ const g = new THREE.Group(); part(g, BX(1.5, 2.4, 0.06), STD('#1e8a5a', {roughness:0.5}), 0, 0, 0); part(g, BX(1.1, 2.0, 0.07), STD('#f0e6c8'), 0, -0.15, 0.01); part(g, new THREE.SphereGeometry(0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), STD('#1e8a5a'), 0, 0.85, 0, Math.PI / 2); return g; },
  minbar(){ const g = new THREE.Group(), m = STD('#6b4226', {roughness:0.55}); for (let i = 0; i < 4; i++) part(g, BX(0.8, 0.25 * (i + 1), 0.45), m, 0, 0.125 * (i + 1), 0.45 * (1.5 - i)); part(g, BX(0.06, 1.6, 1.8), m, -0.4, 0.8, 0); part(g, BX(0.06, 1.6, 1.8), m, 0.4, 0.8, 0); return g; },
  drums(){ const g = new THREE.Group(); [[-0.3, 0.35, '#c0392b'], [0.25, 0.3, '#2c3e50'], [0, 0.5, '#7f8c8d']].forEach(([x, r, c], i) => part(g, CY(r * 0.6, r * 0.6, 0.45 + i * 0.1, 16), STD(c, {metalness:0.3}), x, 0.25, i === 2 ? -0.35 : 0)); return g; },
  platform(w, d, color){ const g = new THREE.Group(); part(g, BX(w, 0.3, d), STD(color || '#7a2e3a', {roughness:0.95}), 0, 0.15, 0); return g; },
  offeringBox(){ const g = new THREE.Group(); part(g, BX(0.5, 0.8, 0.4), STD('#5a3920'), 0, 0.4, 0); part(g, BX(0.25, 0.02, 0.04), BLACK(), 0, 0.81, 0); return g; }
});

/* ---------- helpers ---------- */
const PI = Math.PI;
const UNI2 = {
  bank: g => ({gender:g, skin:pick(SKINS), top:'#f5f7fa', bottom:'#1b2a4a', hair:'#121212', longSleeve:true}),
  doctor: g => ({gender:g, skin:pick(SKINS), top:'#f4f4f4', bottom:'#f4f4f4', long:'top', longSleeve:true, hair:'#121212'}),
  nurse: () => ({gender:'f', skin:pick(SKINS), top:'#7fb3d5', bottom:'#7fb3d5', hair:'#121212', cap:'#ffffff'}),
  police: () => ({gender:'m', skin:pick(SKINS), top:'#1a1a1a', bottom:'#1a1a1a', cap:'#1a1a1a', longSleeve:true}),
  suit: g => ({gender:g, skin:pick(SKINS), top:'#2c3e50', bottom:'#1c2833', hair:'#121212', longSleeve:true}),
  pastor: () => ({gender:'m', skin:pick(SKINS), top:'#111111', bottom:'#111111', longSleeve:true}),
  imam: () => ({gender:'m', skin:pick(SKINS), top:'#f5f5f0', bottom:'#f5f5f0', long:'top', longSleeve:true, cap:'#f5f5f0'}),
  corper: g => ({gender:g, skin:pick(SKINS), top:'#b8a46a', bottom:'#b8a46a', cap:'#b8a46a', longSleeve:true}),
  nysc: g => ({gender:g, skin:pick(SKINS), top:'#2e7d32', bottom:'#1c2833', hair:'#121212'}),
  apron: g => ({gender:g, skin:pick(SKINS), top:'#ecf0f1', bottom:'#1c2833', hair:'#121212'})
};
const rg = () => Math.random() < 0.5 ? 'm' : 'f';
function patron(inst, x, z, face, sit, y){ const st = staffMember(inst, x, z, face, outfit(rg()), {sit}); if (y) st.p.g.position.y = y; return st; }
function worker(inst, x, z, face, look, name, o){ const st = staffMember(inst, x, z, face, look, Object.assign({name}, o || {})); st.work = true; return st; }
function lyingPerson(inst, x, z, y, look){ const p = makePerson(look || outfit(rg())); p.g.position.set(inst.ox + x, y, inst.oz + z); p.g.rotation.x = -PI / 2; inst.group.add(p.g); return p; }
function seatWithChair(inst, x, z, face, color){ put(inst, FURN.chair(color), x, z, face); }
function hall(inst, w, d, o){
  o = o || {};
  const rooms = [{x:0, z:0, w, d, floor:o.floor || 'terrazzo'}].concat(o.rooms || []);
  const ex = o.doorX !== undefined ? o.doorX : w / 2;
  addRooms(inst, rooms, [{x:ex, z:d, axis:'x', w:o.door || 1.6}].concat(o.open || []), o.wall || '#eee8dc');
  inst.spawn = [ex, d - 0.7]; inst.entrance = {x:ex, z:d};
  if (o.windows !== false){ onWall(inst, FURN.window(1.3), 0, 1.6, d * 0.3); onWall(inst, FURN.window(1.3), w, 1.6, d * 0.3); }
  if (o.ac){ onWall(inst, FURN.ac(), 0.9, 2.45, 0.1); onWall(inst, FURN.ac(), w - 0.9, 2.45, 0.1); }
  station(inst, 'exit', ex, d - 0.25, '🚪 Exit', () => exitBuilding(), {r:0.8});
}
function faceToward(x, z){ player.face = Math.atan2(x - player.x * S, z - player.y * S); }
/* staff greets you, then the building's menu opens */
function serve(inst, st, line, kind, data){
  if (st && st.p && st.p.g.visible !== false){ faceToward(st.x, st.z); speak(st, typeof line === 'function' ? line() : line); }
  setTimeout(() => { if (inside === inst && !sceneBusy && !panelState && !phoneOpen) openPanel(kind, data); }, st ? 900 : 0);
}
const closedLine = (a, b, open, closed) => () => inHours(a, b) ? (typeof open === 'function' ? open() : open) : closed;
function durTxt(m){ return m >= 60 ? `${Math.round(m / 6) / 10} hrs` : `${m} mins`; }

/* =========================================================
   BUILDERS
   ========================================================= */
function buildBank(inst){
  hall(inst, 14, 10, {floor:'tile', wall:'#e9eef5', ac:true});
  put(inst, FURN.officeCounter(8), 7, 2.2, 0);
  inst.tellers = [4.5, 7, 9.5].map((x, i) => { put(inst, FURN.chair('#1b2a4a'), x, 1.35, 0); onWall(inst, FURN.sign(`TELLER ${i + 1}`, 1.0, 0.25, '#0b3d91'), x, 1.85, 0); return worker(inst, x, 1.35, 0, UNI2.bank(i === 1 ? 'f' : rg()), i === 1 ? 'Teller Adaeze' : '', {sit:true}); });
  onWall(inst, FURN.sign('Naija Trust Bank · Your money, our priority', 6, 0.45, '#0b3d91'), 7, 2.5, 0);
  onWall(inst, FURN.sign('Never share your PIN, OTP or BVN with anyone!', 2.6, 0.5, '#c0392b'), 0, 1.7, 7.6);
  put(inst, FURN.atm(), 13.6, 5.0, -PI / 2); put(inst, FURN.atm(), 13.6, 6.4, -PI / 2);
  put(inst, FURN.officeDesk(), 1.3, 5.5, -PI / 2); put(inst, FURN.chair('#1b2a4a'), 0.6, 5.5, PI / 2); put(inst, FURN.chair('#1b2a4a'), 2.05, 5.5, -PI / 2);
  inst.cs = worker(inst, 0.6, 5.5, PI / 2, UNI2.bank('m'), 'Customer Service', {sit:true});
  onWall(inst, FURN.sign('CUSTOMER SERVICE', 1.6, 0.3, '#0b3d91'), 0, 2.2, 5.5);
  put(inst, FURN.bench(3), 4, 6.4, PI); put(inst, FURN.bench(3), 9.6, 6.4, PI);
  patron(inst, 3.4, 6.4, PI, true); patron(inst, 10.2, 6.4, PI, true);
  patron(inst, 4.5, 3.05, PI); patron(inst, 4.5, 3.85, PI);
  inst.guard = staffMember(inst, 8.5, 9.1, -PI / 2, UNIFORM.guard(), {name:'Security'});
  put(inst, FURN.plant(), 0.6, 9.3); put(inst, FURN.plant(), 13.3, 9.3); put(inst, FURN.dispenser(), 13.4, 8.2, -PI / 2);
  const t = inst.tellers[1];
  station(inst, 'teller', 7, 3.05, '🏦 Teller: deposit / withdraw', () => serve(inst, t, closedLine(8, 16, () => state.nin ? `Good day ${state.name}. Deposit or withdrawal?` : 'Sorry, you need an NIN to operate an account.', ''), 'bank'));
  station(inst, 'atm', 12.7, 5.7, '🏧 ATM', () => { faceToward(inst.ox + 13.6, inst.oz + 5.7); sfx('ding'); openPanel('atm'); });
  station(inst, 'cs', 2.75, 5.5, '💁🏾 Customer service', () => speak(inst.cs, !inHours(8, 16) ? 'We are closed. Use the ATM or NaijaBank app.' : state.nin ? `Your savings balance is ${fmt(state.bank)}. For transfers, use the NaijaBank app on your phone.` : 'To open an account you need your NIN. Enrol at the NIMC centre first.'));
  station(inst, 'guard', 8.5, 8.4, '💬 Talk to security', () => speak(inst.guard, pick(['Drop your phone and keys in the tray, then pass.', 'Banking hall closes 4pm. ATM dey work 24 hours.', 'Oga, no snapping inside the banking hall o.'])), {r:0.8});
}

function buildUni(inst){
  hall(inst, 16, 12, {floor:'terrazzo', wall:'#f1eed8'});
  const D = state.uni ? DEPTS[state.uni.dept] : null;
  onWall(inst, FURN.board(D ? `${D.name.toUpperCase()} · ${state.uni.level}L LECTURE` : 'WELCOME TO UNITY UNIVERSITY', 5, 1.3), 8, 1.6, 0);
  put(inst, FURN.podium(), 5.8, 1.3, 0);
  inst.lecturer = worker(inst, 8, 1.0, 0, UNI2.suit('m'), 'Dr. Okafor');
  inst.seats = [];
  [4.0, 5.4, 6.8, 8.2].forEach(z => [3.2, 4.6, 6.0, 10.0, 11.4, 12.8].forEach(x => {
    put(inst, FURN.table(1.0, 0.5, '#9c7a54'), x, z, 0); put(inst, FURN.chair('#3a3a3a'), x, z + 0.5, PI);
    const mine = (x === 6.0 && z === 5.4) || (x === 10.0 && z === 6.8);
    if (!mine && Math.random() < 0.5) patron(inst, x, z + 0.5, PI, true);
  }));
  put(inst, FURN.officeDesk(), 1.1, 10.2, -PI / 2); put(inst, FURN.chair(), 0.55, 10.2, PI / 2);
  inst.admit = worker(inst, 0.55, 10.2, PI / 2, UNI2.suit('f'), 'Admissions', {sit:true});
  onWall(inst, FURN.sign('ADMISSIONS & RECORDS', 2.0, 0.35, '#2e5e1e'), 0, 2.1, 10.2);
  put(inst, FURN.officeDesk(), 14.9, 10.2, PI / 2); put(inst, FURN.chair(), 15.45, 10.2, -PI / 2);
  inst.bursar = worker(inst, 15.45, 10.2, -PI / 2, UNI2.suit('m'), 'Bursary', {sit:true});
  onWall(inst, FURN.sign('BURSARY · School fees', 2.0, 0.35, '#2e5e1e'), 16, 2.1, 10.2);
  onWall(inst, FURN.sign('Unity University · Faculty Lecture Theatre', 4.2, 0.45, '#2e5e1e'), 3.6, 2.35, 12);
  const f1 = put(inst, FURN.fan(), 15.3, 1.0, -2.4); const f2 = put(inst, FURN.fan(), 0.7, 1.0, 2.4);
  inst.anim.push(dt => { f1.userData.spin.rotation.z += dt * 13; f2.userData.spin.rotation.z += dt * 13; });
  station(inst, 'admit', 2.1, 10.2, '📝 Admissions (JAMB, departments)', () => serve(inst, inst.admit, closedLine(8, 16, () => state.degree ? 'Welcome back, alumnus! The alumni office is this way.' : !state.jamb ? 'JAMB UTME holds here. Have you registered your NIN?' : !state.uni ? 'Congratulations on your JAMB score! Choose your department.' : 'How may I help you?', 'Office closed. Come back by 8am.'), 'uni'));
  station(inst, 'bursary', 13.9, 10.2, '💳 Bursary (school fees)', () => serve(inst, inst.bursar, closedLine(8, 16, 'Pay your fees here. No cash, only bank transfer.', 'Bursary is closed.'), 'uni'));
  station(inst, 'lecture', 8, 6.0, '📚 Lecture hall (lectures, exams)', () => serve(inst, inst.lecturer, closedLine(8, 16, () => state.uni ? pick(['Sit down, the lecture is starting.', 'Exams are coming. Read your notes!', 'Who is making noise at the back?']) : 'You are not a student here yet. Go to admissions.', ''), 'uni'));
}

function buildJobs(inst){
  hall(inst, 11, 10, {floor:'tile', wall:'#e8ecef', windows:false,
    rooms:[{x:11, z:0, w:5, d:4.5, floor:'wood'}, {x:11, z:4.5, w:5, d:5.5, floor:'carpet'}],
    open:[{x:11, z:3.0, axis:'z', w:0.95}, {x:11, z:7.5, axis:'z', w:0.95}]});
  onWall(inst, FURN.window(1.3), 0, 1.6, 3); onWall(inst, FURN.window(1.3), 16, 1.6, 2.2); onWall(inst, FURN.window(1.3), 16, 1.6, 7.2);
  onWall(inst, FURN.ac(), 0.9, 2.45, 0.1); onWall(inst, FURN.ac(), 13.5, 2.45, 0.1);
  onWall(inst, FURN.sign(`${B.jobs.name} · Careers that work`, 5, 0.45, '#222'), 5.5, 2.45, 0);
  put(inst, FURN.officeCounter(2.4), 5.5, 7.4, 0);
  inst.recep = worker(inst, 5.5, 6.7, 0, UNI2.suit('f'), 'Reception');
  [1.4, 3.8].forEach(z => [1.5, 3.5, 5.5, 7.5, 9.5].forEach(x => {
    put(inst, FURN.officeDesk(), x, z, 0); put(inst, FURN.chair('#222'), x, z + 0.6, PI);
    if (!(x === 9.5 && z === 3.8) && Math.random() < 0.7) patron(inst, x, z + 0.6, PI, true);
  }));
  // interview room
  put(inst, FURN.table(1.8, 0.8, '#5a3920'), 13.5, 1.9, 0);
  put(inst, FURN.chair('#222'), 12.9, 1.25, 0); put(inst, FURN.chair('#222'), 14.1, 1.25, 0); put(inst, FURN.chair('#222'), 13.5, 2.6, PI);
  inst.panel1 = worker(inst, 12.9, 1.25, 0, UNI2.suit('m'), 'Mr. Adebayo (HR)', {sit:true});
  worker(inst, 14.1, 1.25, 0, UNI2.suit('f'), '', {sit:true});
  onWall(inst, FURN.sign('INTERVIEW ROOM', 1.6, 0.3, '#222'), 10.9, 1.9, 1.5);
  // HR office
  put(inst, FURN.officeDesk(), 13.5, 6.2, PI); put(inst, FURN.chair('#222'), 13.5, 5.6, 0); put(inst, FURN.chair('#222'), 13.5, 6.9, PI);
  inst.hr = worker(inst, 13.5, 5.6, 0, UNI2.suit('f'), 'HR / SIWES', {sit:true});
  onWall(inst, FURN.sign('HR · SIWES · PLACEMENTS', 1.8, 0.3, '#222'), 10.9, 1.9, 6.2);
  put(inst, FURN.dispenser(), 0.6, 9.3, PI / 2); put(inst, FURN.plant(), 10.4, 9.4); put(inst, FURN.plant(), 0.6, 5.6);
  station(inst, 'reception', 5.5, 8.3, '💁🏾 Reception (jobs and shifts)', () => serve(inst, inst.recep, () => state.job ? `Good morning ${state.name}! Your desk is ready.` : 'Welcome! Here are our current openings.', 'jobs'));
  station(inst, 'desk', 8.6, 5.3, '💼 Your work desk', () => serve(inst, null, '', 'jobs'), {cond:() => !!state.job});
  station(inst, 'interview', 12.4, 3.6, '🤝 Interview room', () => serve(inst, inst.panel1, () => inHours(8, 16) ? 'Interviews hold here. Apply for a position first.' : 'Interviews hold 8am to 4pm.', 'jobs'));
  station(inst, 'hr', 13.5, 7.8, '📋 HR (SIWES and placements)', () => serve(inst, inst.hr, () => state.uni && state.uni.needSiwes ? 'Welcome, IT student. Your logbook, please.' : 'HR handles SIWES placements and staff matters.', 'jobs'));
}

function buildHospital(inst){
  hall(inst, 12, 9, {floor:'tile', wall:'#eef4f6', windows:false, rooms:[{x:12, z:0, w:6, d:9, floor:'tile'}], open:[{x:12, z:4.5, axis:'z', w:1.2}]});
  onWall(inst, FURN.window(1.3), 0, 1.6, 2.8); onWall(inst, FURN.window(1.3), 18, 1.6, 4.5); onWall(inst, FURN.window(1.3), 18, 1.6, 7.6);
  onWall(inst, FURN.sign('General Hospital · Health is wealth', 3.6, 0.4, '#c0392b'), 6, 2.45, 0);
  onWall(inst, FURN.sign('✚', 0.5, 0.5, '#ffffff', '#c0392b'), 6, 1.8, 0);
  // consulting
  put(inst, FURN.officeDesk(), 2.5, 1.4, PI); put(inst, FURN.chair('#1c2833'), 2.5, 0.8, 0); put(inst, FURN.chair('#1c2833'), 2.5, 2.1, PI);
  inst.doctor = worker(inst, 2.5, 0.8, 0, UNI2.doctor('m'), 'Dr. Bello', {sit:true});
  onWall(inst, FURN.sign('CONSULTING ROOM', 1.6, 0.3, '#2471a3'), 2.5, 2.3, 0);
  // pharmacy
  put(inst, FURN.shelf(), 9.5, 0.4, 0); put(inst, FURN.officeCounter(2.6), 9.5, 1.6, 0);
  inst.pharm = worker(inst, 9.5, 0.95, 0, UNI2.doctor('f'), 'Pharmacist');
  onWall(inst, FURN.sign('PHARMACY', 1.2, 0.3, '#1e8449'), 11.2, 2.3, 0);
  // reception and waiting
  put(inst, FURN.officeCounter(2.2), 6, 5.0, 0);
  inst.nurse0 = worker(inst, 6, 4.3, 0, UNI2.nurse(), 'Records');
  put(inst, FURN.bench(3), 1.0, 5.8, PI / 2); patron(inst, 1.0, 5.0, PI / 2, true); patron(inst, 1.0, 6.6, PI / 2, true);
  put(inst, FURN.dispenser(), 11.4, 8.4, -PI / 2); put(inst, FURN.plant(), 0.6, 8.4);
  // ward
  inst.beds = [13.5, 15.2, 16.9].map(x => put(inst, FURN.hospitalBed(), x, 1.25, 0));
  put(inst, FURN.ivStand(), 14.25, 0.6, 0, false); put(inst, FURN.ivStand(), 15.95, 0.6, 0, false);
  lyingPerson(inst, 15.2, 2.1, 0.78); lyingPerson(inst, 16.9, 2.1, 0.78);
  inst.nurse = staffMember(inst, 15.6, 3.6, PI, UNI2.nurse(), {name:'Nurse Amaka'});
  onWall(inst, FURN.sign('MALE / FEMALE WARD', 1.8, 0.3, '#2471a3'), 12.1, 2.3, 7.2);
  station(inst, 'reception', 6, 5.95, '📝 Records (hospital card)', () => serve(inst, inst.nurse0, 'Card number? No card? Okay, we will open one. See the doctor.', 'hospital'));
  station(inst, 'doctor', 2.5, 2.95, '🩺 See the doctor', () => serve(inst, inst.doctor, () => state.health < 60 ? 'Ah, you don\'t look well at all. Sit down, let me check you.' : 'How are you feeling today?', 'hospital'));
  station(inst, 'pharmacy', 9.5, 2.5, '💊 Pharmacy', () => serve(inst, inst.pharm, 'Show me your prescription. We have drugs in stock.', 'hospital'));
  station(inst, 'ward', 13.5, 3.1, '🛏️ Ward', () => serve(inst, inst.nurse, 'Full treatment means you stay on admission for some hours.', 'hospital'));
}

function buildMamaput(inst){
  hall(inst, 9, 7, {floor:'cement', wall:'#f3d9a4', door:1.4});
  put(inst, FURN.pots(), 4.5, 1.1, 0);
  inst.mama = worker(inst, 4.5, 0.48, 0, outfit('f', null, 0.1), 'Mama Nkechi');
  put(inst, FURN.fridge(), 0.5, 1.0, PI / 2);
  const fan = put(inst, FURN.fan(), 8.4, 1.0, -2.4); inst.anim.push(dt => { fan.userData.spin.rotation.z += dt * 13; });
  onWall(inst, FURN.sign("Mama Nkechi's Buka · Food is ready! 🍛", 4, 0.45, '#c0392b'), 4.5, 2.35, 0);
  onWall(inst, FURN.sign('No credit today, come tomorrow', 2.2, 0.4, '#ffffff', '#c0392b'), 0, 1.7, 4.5);
  [[1.9, 3.6, '#c0392b'], [7.1, 3.6, '#2471a3'], [1.9, 5.4, '#f1f1f1'], [7.1, 5.4, '#c0392b']].forEach(([x, z, c]) => put(inst, FURN.plasticSet(c), x, z, 0));
  patron(inst, 1.28, 3.6, PI / 2, true); patron(inst, 7.72, 3.6, -PI / 2, true); patron(inst, 1.9, 6.02, PI, true);
  station(inst, 'order', 4.5, 2.1, '🍛 Order food', () => serve(inst, inst.mama, closedLine(7, 21, () => pick(['My customer! Wetin you go chop today?', 'Jollof dey, amala dey, eba dey. Choose!', 'Sit down, I go serve you sharp sharp.']), 'We don close o! Come back tomorrow.'), 'mamaput'));
}

function buildMarket(inst){
  hall(inst, 14, 10, {floor:'cement', wall:'#d9a86c', door:2});
  const names = ['Iya Bose', 'Mama Pepper', 'Emeka Gadgets', '', ''];
  const traders = [[3, 2.4], [7, 2.4], [11, 2.4], [3, 6.2], [11, 6.2]].map(([x, z], i) => {
    put(inst, FURN.stall(), x, z, 0);
    return staffMember(inst, x, z - 0.85, 0, i === 2 ? outfit('m') : outfit('f', null, 0.1), {name:names[i]});
  });
  put(inst, FURN.sacks(), 0.8, 8.6, 0); put(inst, FURN.sacks(), 0.8, 7.4, 0); put(inst, FURN.waterPacks(), 12.6, 8.8, 0);
  patron(inst, 5.0, 4.6, 0.6); patron(inst, 9.2, 5.0, -0.8); patron(inst, 7.0, 7.4, PI);
  onWall(inst, FURN.sign(`${AREA.market} · Buy and sell`, 4, 0.45, '#1e6b3a'), 7, 2.45, 0);
  const sell = (t, lines) => () => serve(inst, t, closedLine(6, 20, () => pick(lines), 'Market don close. Come back 6am.'), 'market');
  station(inst, 'provisions', 3, 3.5, '🥬 Foodstuff and provisions', sell(traders[0], ['Fine customer! Rice, beans, garri, everything dey.', 'Buy foodstuff, go cook for house. E cheaper!']));
  station(inst, 'fruits', 7, 3.5, '🍅 Pepper, tomato and snacks', sell(traders[1], ['Fresh tomato! I go add you small extra.', 'Buy pepper, buy onions, my dear!']));
  station(inst, 'gifts', 11, 3.5, '🎁 Gifts and phones', sell(traders[2], ['Original phone, no be China! Gifts dey too.', 'You wan buy gift for your babe? I get am.']));
}

function buildBarber(inst){
  hall(inst, 7, 6, {floor:'tile', wall:'#bfe6f0', door:1.2, windows:false});
  onWall(inst, FURN.mirror(1.1, 0.9), 2, 1.55, 0); onWall(inst, FURN.mirror(1.1, 0.9), 5, 1.55, 0);
  put(inst, FURN.barberChair(), 2, 1.0, PI); put(inst, FURN.barberChair(), 5, 1.0, PI);
  patron(inst, 2, 1.0, PI, true);
  inst.barber1 = worker(inst, 2.6, 1.6, -3 * PI / 4, outfit('m'), 'Tunde');
  inst.barber2 = worker(inst, 5.65, 1.75, -2.4, state.gender === 'f' ? outfit('f', null, 0.6) : outfit('m'), state.gender === 'f' ? 'Stylist Joy' : 'Barber Kola');
  put(inst, FURN.bench(2.2), 0.5, 3.8, PI / 2); patron(inst, 0.5, 3.4, PI / 2, true);
  const tv = FURN.bigTV(0.9); onWall(inst, tv, 7, 1.9, 3.5);
  onWall(inst, FURN.sign('KUTZ · Low cut · Fade · Styling', 2.6, 0.4, '#1a1a1a'), 3.5, 2.45, 0);
  put(inst, FURN.plant(), 6.5, 5.4);
  station(inst, 'chair', 5, 2.05, '💈 Barber chair', () => serve(inst, inst.barber2, () => state.daily.groomed ? 'You still dey fresh from today!' : 'Oya sit down. How you want am?', 'barber'));
}

function buildCyber(inst){
  hall(inst, 9, 7, {floor:'tile', wall:'#2b303b', door:1.2, windows:false});
  [0.6, 3.3].forEach(z => [1.3, 3.1, 4.9, 6.7].forEach(x => { put(inst, FURN.officeDesk(), x, z, 0); put(inst, FURN.chair('#111'), x, z + 0.6, PI); }));
  patron(inst, 1.3, 1.2, PI, true); patron(inst, 4.9, 1.2, PI, true); patron(inst, 3.1, 3.9, PI, true);
  put(inst, FURN.officeCounter(1.6), 7.9, 5.6, -PI / 2); put(inst, FURN.printer(), 7.9, 5.9, 0, false, 1.1);
  inst.att = worker(inst, 8.5, 5.6, -PI / 2, outfit('m'), 'Attendant');
  onWall(inst, FURN.sign('CYBER CAFE · Browsing · Printing · Scanning', 4.6, 0.4, '#00b894'), 4.5, 2.45, 0);
  onWall(inst, FURN.sign('NO YAHOO YAHOO IN THIS CAFE!', 2.2, 0.45, '#c0392b'), 0, 1.7, 5.2);
  const glow = new THREE.PointLight(0x00e0b0, 0.6, 7, 2); glow.position.set(inst.ox + 4.5, 2.4, inst.oz + 1.5); inst.group.add(glow);
  station(inst, 'counter', 6.9, 5.6, '🖨️ Attendant (printing)', () => serve(inst, inst.att, () => (hour() >= 8 || hour() < 2) ? 'Wetin you wan print? Browsing na ₦500 per hour.' : 'We don close.', 'cyber'));
  station(inst, 'pc', 4.0, 2.25, '💻 Computers', () => serve(inst, null, '', 'cyber'));
}

function buildPolice(inst){
  hall(inst, 14, 8, {floor:'terrazzo', wall:'#d8dee9'});
  put(inst, FURN.cellBars(4.85), 10, 2.575, PI / 2); put(inst, FURN.cellBars(3.85), 11.925, 5.0, 0);
  put(inst, FURN.bench(2), 13.4, 2.5, -PI / 2); patron(inst, 13.4, 1.9, -PI / 2, true);
  onWall(inst, FURN.sign('CELL', 0.8, 0.3, '#111'), 13.85, 2.4, 4.0);
  put(inst, FURN.officeCounter(3), 4.5, 2.0, 0);
  inst.sgt = staffMember(inst, 4.5, 1.3, 0, UNI2.police(), {name:'Sgt. Musa'});
  inst.cpl = staffMember(inst, 9.3, 5.9, -PI / 2, UNI2.police(), {name:'Cpl. Eze'});
  onWall(inst, FURN.sign('NIGERIA POLICE FORCE · Police is your friend', 5, 0.45, '#111'), 4.5, 2.45, 0);
  onWall(inst, FURN.sign('BAIL IS FREE', 1.6, 0.45, '#c0392b'), 0, 1.7, 6.0);
  onWall(inst, FURN.sign('WANTED · Report suspicious persons', 1.8, 0.8, '#b08850', '#111'), 0, 1.6, 4.2);
  put(inst, FURN.bench(2.4), 2.2, 6.4, PI); patron(inst, 2.0, 6.4, PI, true);
  put(inst, FURN.table(1.0, 0.6, '#6d4c2f'), 7.5, 1.0, 0); put(inst, FURN.chair('#333'), 7.5, 0.5, 0);
  worker(inst, 7.5, 0.5, 0, UNI2.police(), '', {sit:true});
  station(inst, 'desk', 4.5, 2.9, '👮🏾 Front desk', () => serve(inst, inst.sgt, () => state.heat > 30 ? 'Hmm. I know your face from somewhere...' : pick(['Yes? Wetin happen?', 'You come report case or you come bail person?', 'Write your statement here.']), 'police'));
}

function buildChurch(inst){
  hall(inst, 10, 14, {floor:'wood', wall:'#f6f2e8', door:1.8, windows:false});
  [4.6, 9.8].forEach(z => { onWall(inst, FURN.window(1.2), 0, 1.7, z); onWall(inst, FURN.window(1.2), 10, 1.7, z); });
  put(inst, FURN.platform(9.7, 2.3), 5, 1.3, 0);
  put(inst, FURN.pulpit(), 5, 1.9, 0, true, 0.3);
  put(inst, FURN.drums(), 8.3, 1.0, 0, false, 0.3);
  onWall(inst, FURN.cross(), 5, 1.85, 0);
  inst.pastor = staffMember(inst, 5, 1.2, 0, UNI2.pastor(), {name:'Pastor Femi'}); inst.pastor.p.g.position.y = 0.3;
  [4.0, 5.3, 6.6, 7.9, 9.2, 10.5].forEach(z => [2.55, 7.45].forEach(x => {
    put(inst, FURN.pew(3.6), x, z, PI);
    [-1.2, -0.4, 0.4, 1.2].forEach(dx => { if (!(z === 6.6 && x === 7.45) && Math.random() < 0.35) patron(inst, x + dx, z, PI, true); });
  }));
  put(inst, FURN.offeringBox(), 5, 3.1, 0);
  onWall(inst, FURN.sign('GRACE ASSEMBLY · Jesus is Lord', 3, 0.45, '#6c4ab0'), 2.2, 2.3, 14);
  const f1 = put(inst, FURN.fan(), 0.7, 12.5, 2.4); const f2 = put(inst, FURN.fan(), 9.3, 12.5, -2.4);
  inst.anim.push(dt => { f1.userData.spin.rotation.z += dt * 12; f2.userData.spin.rotation.z += dt * 12; });
  station(inst, 'pray', 5, 6.6, '🙏 Sit and pray', () => serve(inst, inst.pastor, () => pick(['Welcome to the house of God!', 'Come in, come in. God has a word for you today.', 'Find a seat, the service is on.']), 'church'));
  station(inst, 'offering', 5, 3.75, '💝 Offering box', () => serve(inst, null, '', 'church'));
}

function buildMosque(inst){
  hall(inst, 12, 10, {floor:'carpet', wall:'#f0f7f2'});
  onWall(inst, FURN.mihrab(), 6, 1.3, 0);
  put(inst, FURN.minbar(), 8.4, 1.1, 0);
  inst.imam = staffMember(inst, 6, 1.6, PI, UNI2.imam(), {sit:true, name:'Imam'}); inst.imam.p.g.position.y = -0.3;
  [3.2, 4.2].forEach(z => { for (let x = 3; x <= 9.01; x += 0.8){ if (!(z === 4.2 && Math.abs(x - 6.2) < 0.1) && Math.random() < 0.55){ const w = staffMember(inst, x, z, PI, UNI2.imam(), {sit:true}); w.p.g.position.y = -0.3; } } });
  put(inst, FURN.shoeRack(), 1.4, 9.4, PI);
  put(inst, FURN.tapRow(), 11.6, 7.4, -PI / 2);
  onWall(inst, FURN.sign('CENTRAL MOSQUE · Remove your shoes', 3.2, 0.45, '#1e8a5a'), 9.4, 2.3, 10);
  station(inst, 'wudu', 10.6, 7.4, '💧 Ablution (wudu)', () => {
    if (inst.visit.wudu){ toast('You have already performed your ablution.', 'info'); return; }
    runScene([{to:{x:inst.ox + 10.9, z:inst.oz + 7.4, face:PI / 2}}, {say:['player', 'Bismillah...'], ms:1200}, {fade:'💧 Performing wudu...', ms:1000, fx:() => { inst.visit.wudu = true; advanceTime(5); }}]);
  });
  station(inst, 'pray', 6, 6.2, '🤲 Join the prayer', () => {
    if (!inst.visit.wudu){ speak(inst.imam, 'Perform your ablution first, at the taps.'); return; }
    serve(inst, inst.imam, 'Assalamu alaikum. Join the row.', 'mosque');
  });
}

function buildJoint(inst){
  hall(inst, 12, 8, {floor:'wood', wall:'#3b2f4a', windows:false});
  put(inst, FURN.barShelf(3.6), 6, 0.35, 0);
  put(inst, FURN.barCounter(4), 6, 1.4, 0);
  inst.barman = worker(inst, 6, 0.8, 0, outfit('m'), 'Barman Sly');
  [4.6, 5.6, 7.4].forEach(x => put(inst, FURN.stool(), x, 2.1, 0));
  patron(inst, 4.6, 2.1, PI, true); patron(inst, 7.4, 2.1, PI, true);
  const tv = FURN.bigTV(2.2); onWall(inst, tv, 12, 1.6, 4.2); inst.tv = tv.userData.screen; inst.tv.material.emissiveIntensity = 0.4;
  put(inst, FURN.sofa(3, '#6c3483'), 8.6, 4.2, PI / 2);
  patron(inst, 8.65, 3.45, PI / 2, true); patron(inst, 8.65, 4.95, PI / 2, true);
  put(inst, FURN.poolTable(), 3.2, 5.0, 0);
  patron(inst, 1.6, 5.0, PI / 2); patron(inst, 4.7, 4.3, -PI / 2);
  put(inst, FURN.plasticSet('#e0559b'), 10.3, 1.6, 0);
  onWall(inst, FURN.sign('CHILL SPOT 🍻 Pepper soup · Football · Vibes', 4.2, 0.45, '#e0559b'), 6, 2.48, 0);
  const pink = new THREE.PointLight(0xff4fa3, 0.9, 9, 2); pink.position.set(inst.ox + 3, 2.5, inst.oz + 3); inst.group.add(pink);
  const open = () => hour() >= 12 || hour() < 2;
  station(inst, 'bar', 6, 2.75, '🍻 Bar', () => serve(inst, inst.barman, () => open() ? pick(['Wetin I go give you? Cold one?', 'Pepper soup dey hot today!', 'Big man! Welcome.']) : 'We never open. Come back 12.', 'joint'));
  station(inst, 'tv', 10.0, 5.9, '⚽ Big screen', () => serve(inst, null, '', 'joint'));
  station(inst, 'pool', 3.2, 6.45, '🎱 Pool table', () => {
    if (!open()){ toast('Chill Spot is closed.', 'bad'); return; }
    if (state.daily.pool){ toast('You already played pool today.', 'info'); return; }
    if (!spend(500)) return;
    runScene([{to:{x:inst.ox + 3.2, z:inst.oz + 5.9, face:PI}}, {say:['player', 'Rack them up! Who wan lose ₦500? 🎱'], ms:1500}, {fade:'🎱 Playing pool (30 mins)...', fx:() => { state.daily.pool = true; advanceTime(30); gain('happy', 4); gain('rep', 1); }}, {say:['player', Math.random() < 0.5 ? 'Black ball, corner pocket. I win! 😎' : 'Ah, I scratch the black ball. Next time! 😅'], ms:1500}]);
  });
}

function buildEstate(inst){
  hall(inst, 10, 7, {floor:'tile', wall:'#e9e0f2', windows:false, ac:true});
  put(inst, FURN.officeDesk(), 5, 2.0, PI); put(inst, FURN.chair('#5b3a7a'), 5, 1.4, 0); put(inst, FURN.chair('#5b3a7a'), 5, 2.65, PI);
  inst.agent = worker(inst, 5, 1.4, 0, UNI2.suit('m'), 'Agent Chidi', {sit:true});
  onWall(inst, FURN.board('TO LET: Self-contain · Mini flat · 2-Bedroom flat', 3.4, 0.55), 5, 2.25, 0);
  onWall(inst, FURN.art(0), 0, 1.6, 2.2); onWall(inst, FURN.art(1), 0, 1.6, 4.4); onWall(inst, FURN.art(2), 10, 1.6, 2.8);
  put(inst, FURN.sofa(2, '#5b3a7a'), 9.3, 5.0, -PI / 2); put(inst, FURN.plant(), 0.6, 6.4); put(inst, FURN.dispenser(), 0.6, 0.6, PI / 2);
  station(inst, 'agent', 5, 3.5, '🏠 Talk to the agent', () => serve(inst, inst.agent, () => pick(['I get correct house for you! Agreement and agency fee sha.', 'Landlord no dey take pets o. Which one you want?', 'This one get constant water and light. Mostly.']), 'estate'));
}

function buildMotors(inst){
  hall(inst, 16, 10, {floor:'tile', wall:'#ececec', ac:true});
  inst.bikes = [3.6, 5.6].map(z => put(inst, makeOkada(), 2.8, z, PI / 2));
  put(inst, makeCar('car', '#b33a3a').g, 11.2, 3.6, 0);
  put(inst, makeCar('car', '#1f2a36').g, 11.2, 6.8, 0);
  put(inst, FURN.officeDesk(), 5.5, 1.4, PI); put(inst, FURN.chair('#222'), 5.5, 0.8, 0);
  inst.sales = worker(inst, 5.5, 0.8, 0, UNI2.suit('m'), 'Oga Kunle', {sit:true});
  inst.sales2 = worker(inst, 7.4, 5.4, PI / 2, UNI2.suit('m'), 'Sales');
  onWall(inst, FURN.sign('OGA MOTORS · Okada · Keke · Cars', 4.4, 0.45, '#b33a3a'), 11, 2.45, 0);
  put(inst, FURN.plant(), 15.3, 9.3); put(inst, FURN.plant(), 0.7, 9.3);
  station(inst, 'okada', 4.2, 4.6, '🏍️ Okada display', () => serve(inst, inst.sales2, () => state.hasOkada ? 'How your okada dey? Ride carefully o!' : 'Bajaj Boxer, brand new! E dey move like breeze.', 'motors'));
  station(inst, 'desk', 5.5, 2.35, '🧾 Sales desk', () => serve(inst, inst.sales, 'Welcome to Oga Motors! Cash or transfer?', 'motors'));
}

function buildLg(inst){
  hall(inst, 14, 10, {floor:'terrazzo', wall:'#efe9d8'});
  put(inst, FURN.podium(), 7, 1.5, 0); put(inst, FURN.flag(), 9.3, 0.7, 0);
  inst.chair = worker(inst, 7, 0.9, 0, outfit('m', null, 0.1), 'Council Chairman');
  onWall(inst, FURN.sign('LOCAL GOVERNMENT COUNCIL · Town Hall', 4.6, 0.45, '#0b6e3a'), 7, 2.45, 0);
  [3.6, 4.6, 5.6].forEach(z => { for (let x = 4.0; x <= 10.01; x += 0.9){ put(inst, FURN.chair('#0b6e3a'), x, z, PI); if (!(z === 4.6 && Math.abs(x - 7.6) < 0.1) && Math.random() < 0.45) patron(inst, x, z, PI, true); } });
  put(inst, FURN.officeDesk(), 1.1, 8, -PI / 2); put(inst, FURN.chair(), 0.55, 8, PI / 2);
  inst.rev = worker(inst, 0.55, 8, PI / 2, UNI2.suit('f'), 'Revenue Officer', {sit:true});
  onWall(inst, FURN.sign('REVENUE OFFICE · Development levy', 2.2, 0.35, '#0b6e3a'), 0, 2.1, 8);
  put(inst, FURN.plant(), 13.3, 9.3); put(inst, FURN.dispenser(), 13.4, 7.5, -PI / 2);
  station(inst, 'levy', 2.1, 8, '🏛️ Revenue office (levy)', () => serve(inst, inst.rev, closedLine(8, 16, 'Development levy is ₦10,000 per week. Collect your receipt.', 'Office closed.'), 'lg'));
  station(inst, 'townhall', 7, 6.7, '🗣️ Town hall meeting', () => serve(inst, inst.chair, closedLine(10, 16, 'Welcome, citizen. Take a seat, the meeting is on.', 'The meeting holds 10am to 4pm.'), 'lg'));
}

function buildNysc(inst){
  hall(inst, 12, 8, {floor:'tile', wall:'#f3f0e0'});
  put(inst, FURN.officeCounter(4), 6, 2.0, 0);
  inst.off = worker(inst, 5, 1.3, 0, UNI2.nysc('f'), 'Desk Officer'); worker(inst, 7.2, 1.3, 0, UNI2.nysc('m'), '');
  onWall(inst, FURN.sign('NYSC · Service and Humility', 4, 0.45, '#2e7d32'), 6, 2.48, 0);
  onWall(inst, FURN.sign('PPA POSTINGS · CDS SCHEDULE', 1.8, 0.8, '#b08850', '#111'), 0, 1.6, 4.5);
  put(inst, FURN.flag(), 10.8, 0.8, 0);
  put(inst, FURN.bench(3), 3, 5.8, PI); [2.4, 3.6].forEach(x => { const c = staffMember(inst, x, 5.8, PI, UNI2.corper(rg()), {sit:true}); });
  staffMember(inst, 8.6, 3.4, -2.6, UNI2.corper('m'), {}); staffMember(inst, 9.4, 3.9, 2.2, UNI2.corper('f'), {});
  station(inst, 'desk', 6, 2.9, '🇳🇬 Registration desk', () => serve(inst, inst.off, closedLine(8, 16, () => state.nysc >= 3 ? 'Ex-corper! Come for CDS anytime.' : state.degree ? 'Corper wee! Bring your call-up letter.' : 'You need a degree before you can serve.', 'Secretariat closed.'), 'nysc'));
}

function buildHustle(inst){
  hall(inst, 14, 8, {floor:'cement', wall:'#f0c08a'});
  onWall(inst, FURN.board('HUSTLE BOARD: Pure water · POS · Phone repair · Design · Tutoring · Coding', 4.6, 0.9), 7, 1.75, 0);
  put(inst, FURN.table(1.4, 0.6, '#7a3e12'), 7, 1.2, 0);
  inst.coord = worker(inst, 7, 0.6, 0, outfit('f', null, 0.1), 'Coordinator Bisi');
  put(inst, FURN.waterPacks(), 0.8, 1.0, 0); put(inst, FURN.waterPacks(), 0.8, 1.6, 0);
  put(inst, FURN.posStand(), 3.3, 1.6, 0); put(inst, FURN.stool(), 3.3, 2.3, 0);
  put(inst, FURN.table(1.6, 0.7, '#555'), 10.5, 1.0, 0); put(inst, FURN.stool(), 10.5, 1.6, 0); patron(inst, 11.2, 1.6, PI, true);
  [3.5, 5.3].forEach(z => { put(inst, FURN.officeDesk(), 13.3, z, -PI / 2); put(inst, FURN.chair('#222'), 12.7, z, PI / 2); });
  patron(inst, 12.7, 5.3, PI / 2, true);
  onWall(inst, FURN.board('x² + 5x + 6 = 0', 1.6, 0.9), 0, 1.5, 5);
  put(inst, FURN.table(2, 0.9, '#9c7a54'), 7, 4.6, 0); [6.4, 7.6].forEach(x => { put(inst, FURN.chair(), x, 5.25, PI); }); patron(inst, 6.4, 5.25, PI, true);
  put(inst, FURN.chair(), 7, 3.95, 0);
  worker(inst, 7, 3.95, 0, UNI2.apron('m'), 'Trainer', {sit:true});
  station(inst, 'board', 7, 2.6, '🔥 Hustle board', () => serve(inst, inst.coord, () => pick(['Hustle no dey kill person! Pick one.', 'Learn skill, make money. Na so e dey go.', 'POS business dey move well this season.']), 'hustle'));
}

/* =========================================================
   ACTION SPOTS (where the scene plays for each action)
   ========================================================= */
const S_ = (re, x, z, face, o) => Object.assign({re, x, z, face}, o || {});
const SPOTS = {
  uni:[S_(/lecture/i, 6.0, 5.9, PI, {pose:'sit', who:'lecturer', say:['Today we treat the fundamentals. Take your notes!', 'Who can answer this question? You at the back!', 'This one go come out for exam o!']}),
       S_(/alumni/i, 2.1, 10.2, -PI / 2, {who:'admit', say:['Our alumni are everywhere. Network well!']})],
  jobs:[S_(/shift/i, 9.5, 4.4, PI, {pose:'sit', say:['Let me face this work. 💼', 'Emails, reports, meetings... Monday no dey finish!']}),
        S_(/SIWES/i, 9.5, 4.4, PI, {pose:'sit', who:'hr', say:['Make sure you fill your logbook every day.']})],
  hospital:[S_(/Full treatment/i, 13.5, 2.1, 0, {pose:'lie', y:0.78, who:'nurse', say:['Lie down. We will set up a drip for you.']}),
            S_(/check-up/i, 2.5, 2.1, PI, {pose:'sit', who:'doctor', say:['Open your mouth, say ahh... Your BP is fine.', 'Take this medicine and rest well.']})],
  mamaput:[S_(/./, 6.48, 5.4, PI / 2, {pose:'sit', say:['This food sweet die! 😋', 'Mama, you no add meat at all o! 😂', 'Hmm, the pepper dey reason me. 🌶️']})],
  barber:[S_(/./, 5, 1.0, PI, {pose:'sit', who:'barber2', say:['Sit well. Make I line your edges.', 'Hold your head steady, abeg.', 'You go look like a star after this!']})],
  cyber:[S_(/CV/i, 6.9, 5.6, PI / 2, {who:'att', say:['Printing... ₦1,000 abeg.']}),
         S_(/Browse/i, 6.7, 1.2, PI, {pose:'sit', say:['Let me check what is trending... 📲']}),
         S_(/Yahoo/i, 1.3, 3.9, PI, {pose:'sit', say:['"Hello dear, how was your night?" 😏', 'This client go fall today...']})],
  police:[S_(/Volunteer/i, 6.5, 6.5, 0, {who:'sgt', say:['Wear this reflective vest. Go and control traffic.']})],
  church:[S_(/Pray/i, 6.25, 6.6, PI, {pose:'sit', who:'pastor', say:['Somebody shout Hallelujah! 🙌🏾', 'Your season of lifting has come!', 'Lift up your hands and worship Him!']})],
  mosque:[S_(/Pray/i, 6.2, 4.2, PI, {pose:'sit', y:-0.3, who:'imam', say:['Allahu Akbar...']})],
  joint:[S_(/football/i, 8.65, 4.2, PI / 2, {pose:'sit', tv:true, say:['GOOOAL! 🙌🏾', 'Referee, are you blind?! 😤', 'Oya na, shoot am!']}),
         S_(/Pepper soup/i, 9.68, 1.6, PI / 2, {pose:'sit', say:['This pepper soup hot o! 🥵', 'Barman, bring cold water!']}),
         S_(/drinks/i, 6, 2.75, PI, {say:['Barman! Give everybody one round! 🍻']})],
  lg:[S_(/town hall/i, 7.6, 4.6, PI, {pose:'sit', who:'chair', say:['This administration will fix every road before December! 👏🏾', 'We have heard your complaints about drainage.']})],
  nysc:[S_(/camp/i, 6, 2.9, PI, {who:'off', say:['Corper wee! Report to camp.']}),
        S_(/PPA/i, 3.0, 5.8, PI, {pose:'sit', say:['Another day at my PPA... 🏫']}),
        S_(/CDS/i, 6, 2.9, PI, {who:'off', say:['CDS group, clean-up exercise today!']})],
  hustle:[S_(/Learn/i, 7.6, 5.25, PI, {pose:'sit', say:['Teach me well, oga. I wan sabi this work.']}),
          S_(/water/i, 1.8, 1.3, -PI / 2, {say:['Pure water! Ice cold pure water! 💧']}),
          S_(/POS/i, 3.3, 2.3, PI, {pose:'sit', say:['Transfer, withdrawal, airtime! Come!']}),
          S_(/Phone repair/i, 10.5, 1.6, PI, {pose:'sit', say:['Screen don crack? I go fix am.']}),
          S_(/design|coding/i, 12.7, 3.5, PI / 2, {pose:'sit', say:['Client wants the logo bigger... and smaller. 🙄', 'Let me push this code. 💻']}),
          S_(/tutor/i, 0.9, 5.0, PI / 2, {say:['Today we treat quadratic equations...']})]
};

function actionScene(label, mins){
  if (!inside || inside.id === 'home' || sceneBusy) return;
  const inst = inside, sp = (SPOTS[inst.id] || []).find(s => s.re.test(label));
  const back = inst.lastStation, face0 = player.face;
  const clean = label.replace(/[^\p{L}\p{N}\s',&:/.()-]/gu, '').trim();
  closePanel();
  const steps = [];
  if (sp){
    steps.push({to:{x:inst.ox + sp.x, z:inst.oz + sp.z, face:sp.face}, pose:sp.pose || null, y:sp.y || 0});
    if (sp.tv && inst.tv) steps.push({fx:() => { inst.tv.material.emissiveIntensity = 1.4; }});
    if (sp.say) steps.push({say:[sp.who ? inst[sp.who] : 'player', pick(sp.say)], ms:1700});
  }
  steps.push({fade:`⏳ ${clean} · ${durTxt(mins)}`, ms:1100, fx:() => { if (sp && sp.tv && inst.tv) inst.tv.material.emissiveIntensity = 0.4; }});
  steps.push({pose:null, to:back ? {x:back.x, z:back.z, face:face0} : null});
  runScene(steps).then(() => setTimeout(flushQueue, 300));
}

/* quiz seats: exams and interviews happen sitting down */
function quizSeatFor(inst, cfg){
  if (inst.id === 'uni') return {x:inst.ox + 10.0, z:inst.oz + 7.3, face:PI, say:[inst.lecturer, /JAMB/.test(cfg.title) ? 'JAMB candidates: no phones, no talking. You have 3 hours. Start now!' : 'No giraffing! Eyes on your own paper. Start!']};
  if (inst.id === 'jobs' && /Interview/.test(cfg.title)) return {x:inst.ox + 13.5, z:inst.oz + 2.6, face:PI, say:[inst.panel1, `Good day ${state.name}. Please, have a seat. Tell us about yourself.`]};
  return null;
}

/* =========================================================
   POLICE CELL AND HOSPITAL WARD (used by arrests and accidents)
   ========================================================= */
function putInside(id, lx, lz, face){
  const def = INTERIOR_DEFS[id];
  let inst = intCache[id];
  if (!inst){ inst = newInterior(id, def.slot, def.name); def.build(inst); intCache[id] = inst; }
  if (inside !== inst) inst.visit = {};
  inst.def = def;
  Object.values(intCache).forEach(x => x.group.visible = x === inst);
  inside = inst; state.riding = false;
  hintEl.style.display = 'none';
  player.x = (inst.ox + lx) / S; player.y = (inst.oz + lz) / S; player.face = face; player.pose = null; player.poseY = 0;
  camS.yaw = 0; camS.dist = 7; camS.pitch = 0.8;
  camera.position.set(player.x * S, 6, player.y * S + 5);
  PATH = []; pathTimer = 0; lastTarget = '#';
  if (def.onEnter) def.onEnter(inst);
  return inst;
}
function jailPlayer(){
  const inst = putInside('police', 11.4, 2.5, PI / 2);
  setTimeout(() => speak(inst.cpl, 'Oya enter cell! You go explain yourself to Oga.'), 200);
}
function releaseCell(){
  if (!inside || inside.id !== 'police') return;
  player.x = (inside.ox + 6.5) / S; player.y = (inside.oz + 4.2) / S; player.face = 0; player.pose = null;
}
function toHospital(){
  const inst = putInside('hospital', 13.5, 3.1, PI);
  setTimeout(() => speak(inst.nurse, 'Ah, you are awake! Take it easy. You were brought in unconscious.'), 300);
}

/* =========================================================
   ATM PANEL
   ========================================================= */
const ATM_PANEL = () => {
  const why = !state.nin ? 'You need a bank account. That requires an NIN.' : null;
  return {
    title:'ATM 🏧', sub:'Naija Trust Bank · Open 24 hours · ₦35 per withdrawal',
    body:`<div class="kv"><b>Savings</b><span>${fmt(state.bank)}</span><b>Cash in hand</b><span>${fmt(state.money)}</span></div>`,
    options:[5000, 10000, 20000, 40000].map(a => opt(`Withdraw ${fmt(a)}`, 'Fee ₦35', () => {
      if (state.bank < a + 35){ toast('Insufficient funds.', 'bad'); return; }
      state.bank -= a + 35; state.money += a; sfx('ding');
      if (typeof addTx === 'function') addTx(`ATM withdrawal`, -(a + 35));
      toast(`Please take your cash: ${fmt(a)}.`, 'good');
    }, why)).concat([opt('Done', '', () => { closePanel(); return false; })])
  };
};

/* =========================================================
   REGISTRY
   ========================================================= */
function intHint(main){
  return inst => { const t = navTargetId(); if (t && t !== inst.id) return 'exit'; return typeof main === 'function' ? main(inst) : main; };
}
function staffShift(a, b){ return inst => { const on = inHours(a, b); inst.staff.forEach(s => { if (s.work) s.p.g.visible = on; }); }; }
Object.assign(INTERIOR_DEFS, {
  bank:     {slot:3,  name:'Naija Trust Bank', build:buildBank, onEnter:staffShift(8, 16), hint:intHint(() => inHours(8, 16) ? 'teller' : 'atm')},
  uni:      {slot:4,  name:'Unity University', build:buildUni, onEnter:staffShift(8, 16), quizSeat:quizSeatFor,
             hint:intHint(() => { const U = state.uni; if (U && !U.needSiwes && !U.paid) return 'bursary'; if (U) return 'lecture'; return 'admit'; })},
  jobs:     {slot:5,  name:'Lagos Business Hub', hours:[6, 20], build:buildJobs, onEnter:staffShift(6, 20), quizSeat:quizSeatFor,
             hint:intHint(() => state.uni && state.uni.needSiwes ? 'hr' : state.job ? 'desk' : 'reception')},
  hospital: {slot:6,  name:'General Hospital', build:buildHospital, hint:intHint(() => state.health < 100 ? 'doctor' : 'pharmacy')},
  mamaput:  {slot:7,  name:"Mama Nkechi's Buka", hours:[7, 21], build:buildMamaput, hint:intHint('order')},
  market:   {slot:8,  name:'Market', hours:[6, 20], build:buildMarket, hint:intHint('provisions')},
  barber:   {slot:9,  name:'Kutz Barbing Salon', hours:[8, 21], build:buildBarber, hint:intHint('chair')},
  cyber:    {slot:10, name:'Cyber Cafe', hours:[8, 2], build:buildCyber, hint:intHint(() => state.cv ? 'pc' : 'counter')},
  police:   {slot:11, name:'Police Station', build:buildPolice, hint:intHint('desk')},
  church:   {slot:12, name:'Grace Assembly', build:buildChurch, hint:intHint('pray')},
  mosque:   {slot:13, name:'Central Mosque', build:buildMosque, hint:intHint(inst => inst.visit.wudu ? 'pray' : 'wudu')},
  joint:    {slot:14, name:'Chill Spot', hours:[12, 2], build:buildJoint, hint:intHint('bar')},
  estate:   {slot:15, name:'Shelter Real Estate', hours:[8, 18], build:buildEstate, hint:intHint('agent')},
  motors:   {slot:16, name:'Oga Motors', hours:[8, 18], build:buildMotors, hint:intHint('okada')},
  lg:       {slot:17, name:'Local Govt Secretariat', build:buildLg, onEnter:staffShift(8, 16), hint:intHint('levy')},
  nysc:     {slot:18, name:'NYSC Secretariat', build:buildNysc, onEnter:staffShift(8, 16), hint:intHint('desk')},
  hustle:   {slot:19, name:'Hustle Hub', build:buildHustle, hint:intHint('board')}
});
