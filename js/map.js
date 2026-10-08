'use strict';
/* =========================================================
   MAP DATA
   ========================================================= */
const ROAD_ROWS = [9, 20, 31], ROAD_COLS = [14, 30, 46];
// style: res | shop | office | glass. door: 's' faces south road, 'n' faces north road
const BUILDINGS = [
  {id:'home',     name:'Your Home',              x:2,  y:4,  w:6, h:4, color:'#e9d8b4', roof:'#8a3b22', ht:6.4, rt:'hip',  style:'res',    door:'s', tanks:1},
  {id:'mamaput',  name:"Mama Nkechi's Buka",     x:17, y:5,  w:5, h:3, color:'#f2c14e', roof:'#6b4a2a', ht:3.6, rt:'hip',  style:'shop',   door:'s', sign:'#c0392b'},
  {id:'market',   name:'Market',                 x:23, y:4,  w:6, h:4, color:'#d98b4c', roof:'#7a4a24', ht:4.2, rt:'flat', style:'shop',   door:'s', sign:'#1e6b3a'},
  {id:'bank',     name:'Naija Trust Bank',       x:33, y:3,  w:7, h:5, color:'#2f5d9a', roof:'#1b3354', ht:13,  rt:'flat', style:'glass',  door:'s', sign:'#0b3d91', tanks:2},
  {id:'hospital', name:'General Hospital',       x:49, y:3,  w:8, h:5, color:'#eef2f4', roof:'#b3392b', ht:9.6, rt:'flat', style:'office', door:'s', extra:'cross', sign:'#c0392b', tanks:2},
  {id:'uni',      name:'Unity University',       x:2,  y:13, w:9, h:6, color:'#d7d9a8', roof:'#55702e', ht:9.6, rt:'flat', style:'office', door:'s', sign:'#2e5e1e', tanks:2},
  {id:'jobs',     name:'Lagos Business Hub',     x:17, y:14, w:7, h:5, color:'#7f93a8', roof:'#39424c', ht:19,  rt:'flat', style:'glass',  door:'s', sign:'#222'},
  {id:'news',     name:'Newsstand',              x:26, y:16, w:3, h:3, color:'#f2d16b', roof:'#2d7a3f', ht:3.2, rt:'flat', style:'shop',   door:'s', sign:'#2d7a3f'},
  {id:'lg',       name:'Local Govt Secretariat', x:33, y:13, w:9, h:6, color:'#efe9d8', roof:'#0b6e3a', ht:9.6, rt:'flat', style:'office', door:'s', sign:'#0b6e3a', tanks:2},
  {id:'church',   name:'Grace Assembly',         x:49, y:14, w:5, h:5, color:'#f6f2e8', roof:'#6c4ab0', ht:8,   rt:'flat', style:'office', door:'s', extra:'spire', sign:'#6c4ab0'},
  {id:'mosque',   name:'Central Mosque',         x:55, y:14, w:5, h:5, color:'#f0f7f2', roof:'#1e8a5a', ht:7,   rt:'flat', style:'office', door:'s', extra:'dome', sign:'#1e8a5a'},
  {id:'estate',   name:'Shelter Real Estate',    x:2,  y:24, w:7, h:6, color:'#d9c6e6', roof:'#5b3a7a', ht:12.8,rt:'flat', style:'res',    door:'s', sign:'#5b3a7a', tanks:2},
  {id:'barber',   name:'Kutz Barbing Salon',     x:17, y:26, w:5, h:4, color:'#7cc6da', roof:'#2a5e6b', ht:3.6, rt:'hip',  style:'shop',   door:'s', sign:'#1a1a1a'},
  {id:'motors',   name:'Oga Motors',             x:33, y:24, w:9, h:6, color:'#e6e6e6', roof:'#b33a3a', ht:6,   rt:'flat', style:'glass',  door:'s', sign:'#b33a3a'},
  {id:'joint',    name:'Chill Spot',             x:49, y:25, w:8, h:5, color:'#5a4a6c', roof:'#e0559b', ht:4.5, rt:'flat', style:'shop',   door:'s', sign:'#e0559b'},
  {id:'police',   name:'Police Station',         x:2,  y:34, w:7, h:4, color:'#33558f', roof:'#1b2a45', ht:6.4, rt:'flat', style:'office', door:'n', sign:'#111', tanks:1},
  {id:'cyber',    name:'Cyber Cafe',             x:17, y:34, w:5, h:4, color:'#3a3f4a', roof:'#00b894', ht:3.6, rt:'flat', style:'shop',   door:'n', sign:'#00b894'},
  {id:'nysc',     name:'NYSC Secretariat',       x:23, y:34, w:6, h:4, color:'#f3f0e0', roof:'#2e7d32', ht:6.4, rt:'flat', style:'office', door:'n', sign:'#2e7d32', tanks:1},
  {id:'hustle',   name:'Hustle Hub',             x:33, y:34, w:7, h:4, color:'#f0a35e', roof:'#7a3e12', ht:3.6, rt:'flat', style:'shop',   door:'n', sign:'#7a3e12'},
  {id:'nimc',     name:'NIMC Enrolment Centre',  x:40, y:34, w:4, h:4, color:'#e9eef0', roof:'#0a7d3b', ht:6.4, rt:'flat', style:'office', door:'n', sign:'#0a7d3b', tanks:1},
  {id:'fuel',     name:'NNPC Filling Station',   x:9,  y:4,  w:3, h:4, color:'#f4f4f4', roof:'#0b6e3a', ht:4.6, rt:'flat', style:'shop',   door:'s', sign:'#0b6e3a'},
  {id:'furniture', name:'HomeStyle Furniture',    x:49, y:34, w:4, h:4, color:'#f3e6d0', roof:'#8a5a2b', ht:4.5, rt:'flat', style:'shop',   door:'n', sign:'#8a5a2b'}
];
const DECOR = [
  {x:55, y:34, w:4, h:4, ht:6.4, color:'#c9dbe6', roof:'#8a3b22'},
  {x:43, y:24, w:2, h:6, ht:3.6, color:'#d8c8a8', roof:'#5d4a3a', tanks:0}
].map(d => Object.assign({tanks:1}, d, {name:'', door:d.y > 30 ? 'n' : 's', rt:'hip', style:'res'}));

const B = {};
[...BUILDINGS, ...DECOR].forEach(b => {
  b.doorC = b.x + Math.floor(b.w / 2);
  b.frontX = (b.doorC + 0.5) * T;
  b.frontY = b.door === 's' ? (b.y + b.h + 0.5) * T : (b.y - 0.5) * T;
});
BUILDINGS.forEach(b => B[b.id] = b);
const ALLB = [...BUILDINGS, ...DECOR];
const SOLIDS = ALLB.map(b => ({x:b.x*T, y:b.y*T, w:b.w*T, h:b.h*T}));

function isRoad(c, r){ return ROAD_ROWS.some(y => r === y || r === y + 1) || ROAD_COLS.some(x => c === x || c === x + 1); }
function nearRoad(c, r){
  if (isRoad(c, r)) return false;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (isRoad(c + dx, r + dy)) return true;
  return false;
}
const isSidewalk = (c, r) => !isRoad(c, r) && nearRoad(c, r);
function inSolidTile(c, r, m){ return ALLB.some(b => c >= b.x - m && c < b.x + b.w + m && r >= b.y - m && r < b.y + b.h + m); }
const HSIDE = new Set(); ROAD_ROWS.forEach(R => { HSIDE.add(R - 1); HSIDE.add(R + 2); });

/* Crosswalks (zebra crossings) beside every junction */
const CROSS = [];
ROAD_ROWS.forEach((R, ri) => ROAD_COLS.forEach((C, ci) => {
  CROSS.push({axis:'h', road:ri, x0:(C - 1) * T, x1:C * T, y0:R * T, y1:(R + 2) * T});
  CROSS.push({axis:'h', road:ri, x0:(C + 2) * T, x1:(C + 3) * T, y0:R * T, y1:(R + 2) * T});
  CROSS.push({axis:'v', road:ci, x0:C * T, x1:(C + 2) * T, y0:(R - 1) * T, y1:R * T});
  CROSS.push({axis:'v', road:ci, x0:C * T, x1:(C + 2) * T, y0:(R + 2) * T, y1:(R + 3) * T});
}));
const inRect = (x, y, r, m) => x > r.x0 - m && x < r.x1 + m && y > r.y0 - m && y < r.y1 + m;
const onCross = (x, y) => CROSS.some(c => inRect(x, y, c, 0));
function tileCross(c, r){ const x = (c + 0.5) * T, y = (r + 0.5) * T; return onCross(x, y); }

function streetIndexOf(b){
  if (b.door === 's'){ const ri = ROAD_ROWS.indexOf(b.y + b.h + 1); return ri; }
  return ROAD_ROWS.findIndex(R => R + 2 === b.y - 1);
}
function addressOf(b){
  const ri = streetIndexOf(b);
  const num = b.door === 's' ? b.doorC * 2 + 1 : b.doorC * 2 + 2;
  return `${num} ${AREA.streets[ri]}`;
}
function streetAt(x, y){
  let best = '', bd = Infinity;
  ROAD_ROWS.forEach((R, i) => { const d = Math.abs(y - (R + 1) * T); if (d < bd){ bd = d; best = AREA.streets[i]; } });
  ROAD_COLS.forEach((C, i) => { const d = Math.abs(x - (C + 1) * T); if (d < bd){ bd = d; best = AREA.streets[3 + i]; } });
  return best;
}

/* =========================================================
   WALKING + NPC LOGIC (2D on the ground plane, in pixels)
   ========================================================= */
function free(x, y, rad){
  const r = rad || 6;
  if (x - r < 0 || y - r < 0 || x + r > WW || y + r > WH) return false;
  for (const s of SOLIDS){
    const cx = clamp(x, s.x, s.x + s.w), cy = clamp(y, s.y, s.y + s.h);
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return false;
  }
  return true;
}
const walkable = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && !inSolidTile(c, r, 0) && (isSidewalk(c, r) || tileCross(c, r));
function randomSidewalk(){
  for (let i = 0; i < 200; i++){
    const c = Math.floor(Math.random() * COLS), r = Math.floor(Math.random() * ROWS);
    if (walkable(c, r) && !isRoad(c, r)) return {x:(c + 0.5) * T, y:(r + 0.5) * T};
  }
  return {x:B.home.frontX, y:B.home.frontY};
}
function npcPick(n){
  const c = Math.floor(n.x / T), r = Math.floor(n.y / T);
  const dirs = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]);
  if (n.home && B[n.home]){ const hx = B[n.home].frontX / T - c, hy = B[n.home].frontY / T - r; if (Math.hypot(hx, hy) > 9 && Math.random() < 0.75) dirs.sort((a, b) => (b[0] * hx + b[1] * hy) - (a[0] * hx + a[1] * hy)); }
  for (const [dx, dy] of dirs){
    const steps = rint(3, 10);
    let k = 0;
    for (let s = 1; s <= steps; s++){ if (walkable(c + dx * s, r + dy * s)) k = s; else break; }
    if (k >= 2){ n.tx = (c + dx * k + 0.5) * T + (Math.random() - 0.5) * 10; n.ty = (r + dy * k + 0.5) * T + (Math.random() - 0.5) * 10; return; }
  }
  const p = randomSidewalk(); n.x = p.x; n.y = p.y; n.tx = p.x; n.ty = p.y;
}

function nearSidewalk(b){
  const c0 = Math.floor(b.frontX / T), r0 = Math.floor(b.frontY / T);
  for (let i = 0; i < 80; i++){ const c = c0 + rint(-6, 6), r = r0 + rint(-3, 3); if (walkable(c, r) && !isRoad(c, r)) return {x:(c + 0.5) * T, y:(r + 0.5) * T}; }
  return randomSidewalk();
}
/* =========================================================
   NAVIGATION (Dijkstra over tiles, prefers sidewalks + zebras)
   ========================================================= */
const TILE_COST = new Float32Array(COLS * ROWS);
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
  let cost;
  if (inSolidTile(c, r, 0)) cost = Infinity;
  else if (tileCross(c, r)) cost = 1;
  else if (isRoad(c, r)) cost = 14;
  else if (isSidewalk(c, r)) cost = 1;
  else cost = 2.2;
  TILE_COST[r * COLS + c] = cost;
}
function findPath(sx, sy, tx, ty){
  const N = COLS * ROWS, dist = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1);
  const start = sy * COLS + sx, goalI = ty * COLS + tx;
  if (start < 0 || start >= N || goalI < 0 || goalI >= N) return [];
  const heap = [[0, start]]; dist[start] = 0;
  const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0){ const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length){ heap[0] = last; let k = 0; for (;;){ const l = 2 * k + 1, rr = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const D8 = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  while (heap.length){
    const [d, i] = pop();
    if (d > dist[i]) continue;
    if (i === goalI) break;
    const x = i % COLS, y = (i / COLS) | 0;
    for (const [dx, dy, w] of D8){
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const ni = ny * COLS + nx, tc = TILE_COST[ni];
      if (tc === Infinity) continue;
      if (dx && dy && (TILE_COST[y * COLS + nx] === Infinity || TILE_COST[ny * COLS + x] === Infinity)) continue;
      const nd = d + w * (tc + TILE_COST[i]) / 2;
      if (nd < dist[ni]){ dist[ni] = nd; prev[ni] = i; push(nd, ni); }
    }
  }
  if (prev[goalI] === -1 && goalI !== start) return [];
  const path = []; let k = goalI;
  while (k !== -1){ path.push(k); k = prev[k]; }
  return path.reverse().map(i => ({x:(i % COLS + 0.5) * T, y:(((i / COLS) | 0) + 0.5) * T}));
}

