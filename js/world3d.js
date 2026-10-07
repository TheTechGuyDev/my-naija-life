'use strict';
/* =========================================================
   3D ENGINE SETUP
   ========================================================= */
const renderer = new THREE.WebGLRenderer({canvas, antialias:GFX === 'high', powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, GFX === 'high' ? 1.6 : 1));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = GFX === 'high';
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.25, 900);
function resize(){
  vw = window.innerWidth; vh = window.innerHeight;
  renderer.setSize(vw, vh, false);
  camera.aspect = vw / vh; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

const LIN = hex => new THREE.Color(hex).convertSRGBToLinear();
const matCache = {};
function STD(hex, o){
  const key = hex + JSON.stringify(o || {});
  if (!matCache[key]) matCache[key] = new THREE.MeshStandardMaterial(Object.assign({color:LIN(hex), roughness:0.85, metalness:0}, o || {}));
  return matCache[key];
}
function ctex(w, h, drawFn, o){
  o = o || {};
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  drawFn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (o.srgb !== false) t.encoding = THREE.sRGBEncoding;
  if (o.repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
function speckle(g, w, h, n, colors, size){
  for (let i = 0; i < n; i++){ g.fillStyle = colors[i % colors.length]; const s = size * (0.5 + Math.random()); g.fillRect(Math.random() * w, Math.random() * h, s, s); }
}

/* Sky dome */
const skyU = {top:{value:new THREE.Color('#4f8fd6')}, hor:{value:new THREE.Color('#cfe6f5')}, bot:{value:new THREE.Color('#6f7f68')}, sunDir:{value:new THREE.Vector3(0, 1, 0)}, sunCol:{value:new THREE.Color('#fff4d6')}};
const skyMat = new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vD; void main(){ float h = vD.y; vec3 c = h > 0.0 ? mix(hor, top, pow(clamp(h,0.0,1.0), 0.55)) : mix(hor, bot, pow(clamp(-h,0.0,1.0), 0.4)); float s = max(dot(normalize(vD), normalize(sunDir)), 0.0); c += sunCol * (pow(s, 600.0) * 2.0 + pow(s, 12.0) * 0.18); gl_FragColor = vec4(c, 1.0); }'
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), skyMat);
sky.renderOrder = -1; sky.frustumCulled = false;
scene.add(sky);

scene.fog = new THREE.Fog(new THREE.Color('#cfe6f5'), 90, 300);

const hemi = new THREE.HemisphereLight(0xdfefff, 0x5a5a48, 0.75); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
sun.castShadow = GFX === 'high';
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left:-55, right:55, top:55, bottom:-55, near:1, far:260});
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);

/* =========================================================
   PROCEDURAL TEXTURES
   ========================================================= */
const TEX = {};
TEX.grass = ctex(512, 512, (g, w, h) => {
  g.fillStyle = '#4c8a34'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++){ const x = Math.random() * w, y = Math.random() * h, r = 10 + Math.random() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, pick(['rgba(110,150,60,.35)','rgba(60,110,40,.35)','rgba(140,120,70,.25)'])); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let i = 0; i < 9000; i++){ g.strokeStyle = pick(['#3f7a2c','#5b9a3c','#6aa848','#386b26','#7fb055']); g.lineWidth = 1; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y - 3 - Math.random() * 4); g.stroke(); }
  speckle(g, w, h, 400, ['#8a6a42','#7a5a36'], 2);
}, {repeat:true});
TEX.asphalt = ctex(512, 512, (g, w, h) => {
  g.fillStyle = '#3c3d40'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 14000, ['#333437','#46474a','#2c2d30','#505154'], 2);
  for (let i = 0; i < 6; i++){ g.fillStyle = 'rgba(20,20,22,.35)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 10 + Math.random() * 20, Math.random() * 3, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = 'rgba(20,20,20,.5)'; g.lineWidth = 1.5;
  for (let i = 0; i < 5; i++){ let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++){ x += (Math.random() - 0.5) * 40; y += (Math.random() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
  // edge lines and dashed yellow centre line (texture is 6.4m x 6.4m, road along x)
  g.fillStyle = 'rgba(235,235,225,.75)'; g.fillRect(0, 14, w, 6); g.fillRect(0, h - 20, w, 6);
  g.fillStyle = '#e9b93a'; g.fillRect(0, h / 2 - 5, w * 0.5, 10);
}, {repeat:true});
TEX.asphaltPlain = ctex(256, 256, (g, w, h) => { g.fillStyle = '#3c3d40'; g.fillRect(0, 0, w, h); speckle(g, w, h, 4000, ['#333437','#46474a','#2c2d30'], 2); }, {repeat:true});
TEX.paving = ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#8f8a80'; g.fillRect(0, 0, w, h);
  const bw = 32, bh = 16;
  for (let y = 0; y < h; y += bh) for (let x = -(y / bh % 2) * bw / 2; x < w; x += bw){
    g.fillStyle = pick(['#a29b8e','#9a9386','#b0a898','#8e8678','#a8705a','#9c6450']);
    g.fillRect(x + 1, y + 1, bw - 2, bh - 2);
  }
  speckle(g, w, h, 1500, ['rgba(0,0,0,.08)','rgba(255,255,255,.06)'], 2);
}, {repeat:true});
TEX.curb = ctex(64, 64, (g, w, h) => { g.fillStyle = '#b7b2a7'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16){ g.fillStyle = (x / 16) % 2 ? '#d9d4c8' : '#2b2b2b'; g.fillRect(x, 0, 16, h); } }, {repeat:true});
function zebraTex(vertical){
  return ctex(128, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(245,245,240,.92)';
    for (let y = 10; y < h; y += 40) g.fillRect(8, y, w - 16, 20);
  }, {repeat:false});
}
TEX.zebra = zebraTex();
TEX.roof = ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16){ const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#bdbdbd'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#9a9a9a'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); }
  speckle(g, w, h, 300, ['rgba(120,60,30,.25)','rgba(0,0,0,.1)'], 3);
}, {repeat:true});
TEX.concrete = ctex(256, 256, (g, w, h) => { g.fillStyle = '#d6d2c8'; g.fillRect(0, 0, w, h); speckle(g, w, h, 5000, ['rgba(0,0,0,.05)','rgba(255,255,255,.08)','rgba(80,60,40,.06)'], 3); }, {repeat:true});
TEX.door = ctex(128, 256, (g, w, h) => {
  g.fillStyle = '#5a3418'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++){ g.strokeStyle = 'rgba(30,15,5,.3)'; g.beginPath(); const x = Math.random() * w; g.moveTo(x, 0); g.bezierCurveTo(x + 6, h / 3, x - 6, h * 2 / 3, x + 3, h); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 4; g.strokeRect(14, 14, w - 28, h / 2 - 20); g.strokeRect(14, h / 2 + 6, w - 28, h / 2 - 20);
  g.fillStyle = '#d4af37'; g.beginPath(); g.arc(w - 22, h / 2, 6, 0, Math.PI * 2); g.fill();
});
TEX.glassDoor = ctex(128, 256, (g, w, h) => {
  g.fillStyle = '#9aa3a8'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1f3a4a'); gr.addColorStop(1, '#5d8095');
  g.fillStyle = gr; g.fillRect(8, 8, w / 2 - 12, h - 16); g.fillRect(w / 2 + 4, 8, w / 2 - 12, h - 16);
  g.fillStyle = '#ccc'; g.fillRect(w / 2 - 10, h / 2 - 20, 4, 40); g.fillRect(w / 2 + 6, h / 2 - 20, 4, 40);
});
TEX.ankara = [0, 1, 2, 3].map(k => ctex(128, 128, (g, w, h) => {
  const pal = [['#f39c12','#1a5276','#c0392b','#f7dc6f'], ['#16a085','#8e44ad','#f1c40f','#e74c3c'], ['#d35400','#27ae60','#2c3e50','#ecf0f1'], ['#e91e63','#ffc107','#3f51b5','#00bcd4']][k];
  g.fillStyle = pal[0]; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32){
    g.fillStyle = pal[1]; g.beginPath(); g.arc(x + 16, y + 16, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = pal[2]; g.beginPath(); g.arc(x + 16, y + 16, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = pal[3]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6, y); g.lineTo(x, y + 6); g.fill();
  }
}, {repeat:true}));
TEX.frond = ctex(64, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = '#4a6a1e'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 0); g.stroke();
  for (let y = 6; y < h - 6; y += 5){ const len = (w / 2 - 2) * Math.sin(y / h * Math.PI); g.strokeStyle = pick(['#3f7d22','#4f8f2a','#356b1c']); g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, y + 4); g.lineTo(w / 2 - len, y); g.moveTo(w / 2, y + 4); g.lineTo(w / 2 + len, y); g.stroke(); }
}, {repeat:false});
TEX.glow = ctex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,214,140,.9)'); gr.addColorStop(0.5, 'rgba(255,190,110,.35)'); gr.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, {srgb:false});
TEX.beam = ctex(16, 128, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,215,64,.9)'); gr.addColorStop(1, 'rgba(255,215,64,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, {srgb:false});

/* Facade textures: one cell = 3.2 m wide x 3.2 m tall (one window per floor per tile) */
function facadeTextures(style, color, seed){
  const r = mulberry(seed);
  const curtains = ['#b03a2e','#d4ac0d','#1f618d','#7d3c98','#e8daef','#f5cba7'];
  const draw = (g, mode) => {
    const W = 256, H = 256;
    if (mode === 'color'){
      g.fillStyle = color; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 2600; i++){ g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.04)'; g.fillRect(r() * W, r() * H, 3, 3); }
      g.fillStyle = 'rgba(0,0,0,.10)'; g.fillRect(0, H - 8, W, 8);
      g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, H - 40, W, 32);
    } else { g.fillStyle = mode === 'rough' ? '#e6e6e6' : '#000'; g.fillRect(0, 0, W, H); }
    let wx, wy, ww, wh;
    if (style === 'res'){ wx = 70; wy = 64; ww = 116; wh = 112; }
    else if (style === 'shop'){ wx = 40; wy = 60; ww = 176; wh = 118; }
    else if (style === 'office'){ wx = 22; wy = 70; ww = 212; wh = 110; }
    else { wx = 0; wy = 46; ww = 256; wh = 210; }
    if (mode === 'color'){
      const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh);
      gr.addColorStop(0, style === 'glass' ? '#2e5a6e' : '#2a3e4c'); gr.addColorStop(0.55, style === 'glass' ? '#4f7f93' : '#5a7486'); gr.addColorStop(1, style === 'glass' ? '#25485a' : '#22323d');
      g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
      if (style === 'res' || style === 'shop'){
        const cc = curtains[Math.floor(r() * curtains.length)];
        g.fillStyle = cc; g.globalAlpha = 0.85; g.fillRect(wx + 6, wy + 6, ww * 0.22, wh - 12); g.fillRect(wx + ww - 6 - ww * 0.22, wy + 6, ww * 0.22, wh - 12); g.globalAlpha = 1;
      }
      // frame
      g.strokeStyle = style === 'glass' ? '#9aa7ad' : style === 'office' ? '#b9c0c4' : '#f4f4f0'; g.lineWidth = style === 'glass' ? 6 : 8;
      g.strokeRect(wx + 4, wy + 4, ww - 8, wh - 8);
      g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
      if (style === 'office' || style === 'glass'){ g.beginPath(); g.moveTo(wx + ww / 4, wy); g.lineTo(wx + ww / 4, wy + wh); g.moveTo(wx + ww * 3 / 4, wy); g.lineTo(wx + ww * 3 / 4, wy + wh); g.stroke(); }
      if (style === 'res' || style === 'shop'){
        // burglar-proof bars
        g.strokeStyle = '#2b2b2b'; g.lineWidth = 3;
        for (let x = wx + 14; x < wx + ww - 6; x += 14){ g.beginPath(); g.moveTo(x, wy + 4); g.lineTo(x, wy + wh - 4); g.stroke(); }
        g.beginPath(); g.moveTo(wx + 4, wy + wh / 2); g.lineTo(wx + ww - 4, wy + wh / 2); g.stroke();
        // sill
        g.fillStyle = '#e8e4da'; g.fillRect(wx - 8, wy + wh, ww + 16, 8);
      }
      if (style === 'glass'){ g.fillStyle = 'rgba(30,40,45,.85)'; g.fillRect(0, 0, W, 46); }
    } else if (mode === 'rough'){
      g.fillStyle = '#1e1e1e'; g.fillRect(wx + 6, wy + 6, ww - 12, wh - 12);
      if (style === 'res' || style === 'shop'){ g.fillStyle = '#e6e6e6'; g.fillRect(wx + 6, wy + 6, ww * 0.22, wh - 12); g.fillRect(wx + ww - 6 - ww * 0.22, wy + 6, ww * 0.22, wh - 12); }
    } else {
      g.fillStyle = style === 'glass' || style === 'office' ? '#ffe7b0' : '#ffc870';
      g.fillRect(wx + 6, wy + 6, ww - 12, wh - 12);
      if (style === 'res' || style === 'shop'){ g.fillStyle = 'rgba(120,50,10,.7)'; g.fillRect(wx + 6, wy + 6, ww * 0.22, wh - 12); g.fillRect(wx + ww - 6 - ww * 0.22, wy + 6, ww * 0.22, wh - 12); }
    }
  };
  return {
    map: ctex(256, 256, (g) => draw(g, 'color'), {repeat:true}),
    rough: ctex(256, 256, (g) => draw(g, 'rough'), {repeat:true, srgb:false}),
    lit: ctex(256, 256, (g) => draw(g, 'lit'), {repeat:true})
  };
}
const WALL_MATS = [];
function facadeMat(set, rx, ry){
  const cl = t => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); c.wrapS = c.wrapT = THREE.RepeatWrapping; return c; };
  const m = new THREE.MeshStandardMaterial({map:cl(set.map), roughnessMap:cl(set.rough), roughness:1, metalness:0, emissive:new THREE.Color(0xffffff), emissiveMap:cl(set.lit), emissiveIntensity:0, envMapIntensity:1.0});
  WALL_MATS.push(m);
  return m;
}
function signTex(text, bg, fg, w, h){
  return ctex(w || 512, h || 128, (g, W, H) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 6; g.strokeRect(6, 6, W - 12, H - 12);
    let fs = Math.floor(H * 0.5); g.font = `800 ${fs}px system-ui,sans-serif`;
    while (g.measureText(text).width > W - 40 && fs > 10){ fs--; g.font = `800 ${fs}px system-ui,sans-serif`; }
    g.fillStyle = fg || '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + 2);
  });
}
function makeLabel(text, h, bg){
  const fs = 44, c = document.createElement('canvas'), g = c.getContext('2d');
  g.font = `800 ${fs}px system-ui,sans-serif`;
  const tw = Math.ceil(g.measureText(text).width);
  c.width = tw + 36; c.height = fs + 26;
  g.font = `800 ${fs}px system-ui,sans-serif`;
  g.fillStyle = bg || 'rgba(10,22,15,.82)';
  if (g.roundRect){ g.beginPath(); g.roundRect(0, 0, c.width, c.height, 18); g.fill(); } else g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, toneMapped:false, fog:false}));
  sp.scale.set(h * c.width / c.height, h, 1);
  return sp;
}
function mergeGeos(geos){
  const parts = geos.map(g => g.index ? g.toNonIndexed() : g);
  const out = new THREE.BufferGeometry();
  ['position','normal','uv'].forEach(name => {
    if (!parts.every(p => p.attributes[name])) return;
    const size = parts[0].attributes[name].itemSize;
    const total = parts.reduce((a, p) => a + p.attributes[name].array.length, 0);
    const arr = new Float32Array(total); let off = 0;
    parts.forEach(p => { arr.set(p.attributes[name].array, off); off += p.attributes[name].array.length; });
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  });
  return out;
}
const shadowy = m => { if (GFX === 'high'){ m.castShadow = true; m.receiveShadow = true; } return m; };

/* =========================================================
   WORLD BUILD (runs after the area is chosen)
   ========================================================= */
const OCC = [], LABELS = [], TRAFFIC_MATS = {};
let lampPools = null, bulbMat = null, headMat = null, tailMat = null;

function buildWorld(){
  B.market.name = AREA.market;
  B.jobs.name = AREA.city === 'Lagos' ? 'Lagos Business Hub' : `${AREA.city} Business Hub`;

  // Ground
  const gt = TEX.grass; gt.repeat.set(WW * S / 8, WH * S / 8);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WW * S + 400, WH * S + 400), new THREE.MeshStandardMaterial({map:gt, roughness:1}));
  gt.repeat.set((WW * S + 400) / 8, (WH * S + 400) / 8);
  ground.rotation.x = -Math.PI / 2; ground.position.set(WW * S / 2, 0, WH * S / 2);
  ground.receiveShadow = GFX === 'high'; scene.add(ground);

  // Roads
  const roadW = 2 * T * S;
  ROAD_ROWS.forEach(R => {
    const t = TEX.asphalt.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(WW * S / roadW, 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(WW * S, roadW), new THREE.MeshStandardMaterial({map:t, roughness:0.92}));
    m.rotation.x = -Math.PI / 2; m.position.set(WW * S / 2, 0.02, (R + 1) * T * S); m.receiveShadow = GFX === 'high'; scene.add(m);
  });
  ROAD_COLS.forEach(C => {
    const t = TEX.asphalt.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(WH * S / roadW, 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(WH * S, roadW), new THREE.MeshStandardMaterial({map:t, roughness:0.92}));
    m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI / 2; m.position.set((C + 1) * T * S, 0.021, WH * S / 2); m.receiveShadow = GFX === 'high'; scene.add(m);
  });
  const junctionMat = new THREE.MeshStandardMaterial({map:TEX.asphaltPlain, roughness:0.92});
  ROAD_ROWS.forEach(R => ROAD_COLS.forEach(C => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(roadW, roadW), junctionMat);
    m.rotation.x = -Math.PI / 2; m.position.set((C + 1) * T * S, 0.03, (R + 1) * T * S); m.receiveShadow = GFX === 'high'; scene.add(m);
  }));
  // Zebra crossings + stop lines
  const zebraMat = new THREE.MeshStandardMaterial({map:TEX.zebra, transparent:true, roughness:0.7, depthWrite:false});
  const stopMat = new THREE.MeshBasicMaterial({color:LIN('#eeeeee')});
  CROSS.forEach(cw => {
    const w = (cw.x1 - cw.x0) * S, d = (cw.y1 - cw.y0) * S;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(cw.axis === 'h' ? w : d, cw.axis === 'h' ? d : w), zebraMat);
    m.rotation.x = -Math.PI / 2; if (cw.axis === 'v') m.rotation.z = Math.PI / 2;
    m.position.set((cw.x0 + cw.x1) / 2 * S, 0.035, (cw.y0 + cw.y1) / 2 * S); scene.add(m);
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(cw.axis === 'h' ? 0.3 : w, cw.axis === 'h' ? d : 0.3), stopMat);
    sl.rotation.x = -Math.PI / 2;
    if (cw.axis === 'h'){ const isWest = ROAD_COLS.some(C => cw.x1 === C * T); sl.position.set((isWest ? cw.x0 * S - 0.6 : cw.x1 * S + 0.6), 0.034, (cw.y0 + cw.y1) / 2 * S); }
    else { const isNorth = ROAD_ROWS.some(R => cw.y1 === R * T); sl.position.set((cw.x0 + cw.x1) / 2 * S, 0.034, isNorth ? cw.y0 * S - 0.6 : cw.y1 * S + 0.6); }
    scene.add(sl);
  });
  // Raised sidewalks with paving and painted curbs
  const pav = TEX.paving;
  const sideTop = new THREE.MeshStandardMaterial({map:pav, roughness:0.9});
  const curbMat = new THREE.MeshStandardMaterial({map:TEX.curb, roughness:0.8});
  const addStrip = (x0, x1, y0, y1) => {
    const w = (x1 - x0) * S, d = (y1 - y0) * S;
    const geo = new THREE.BoxGeometry(w, 0.14, d);
    const uv = geo.attributes.uv; // scale UVs to world metres / 3.2 so paving keeps its size
    for (let i = 0; i < uv.count; i++){ const face = Math.floor(i / 4); const sx = face === 0 || face === 1 ? d : w, sy = face === 2 || face === 3 ? d : 0.14; uv.setXY(i, uv.getX(i) * sx / 3.2, uv.getY(i) * sy / 3.2); }
    const m = new THREE.Mesh(geo, [curbMat, curbMat, sideTop, sideTop, curbMat, curbMat]);
    m.position.set((x0 + x1) / 2 * S, 0.07, (y0 + y1) / 2 * S); m.receiveShadow = GFX === 'high'; scene.add(m);
  };
  pav.wrapS = pav.wrapT = THREE.RepeatWrapping;
  HSIDE.forEach(r => { let s = -1; for (let c = 0; c <= COLS; c++){ const ok = c < COLS && !isRoad(c, r); if (ok && s < 0) s = c; if (!ok && s >= 0){ addStrip(s * T, c * T, r * T, (r + 1) * T); s = -1; } } });
  ROAD_COLS.forEach(C => [C - 1, C + 2].forEach(c => { let s = -1; for (let r = 0; r <= ROWS; r++){ const ok = r < ROWS && !isRoad(c, r) && !HSIDE.has(r); if (ok && s < 0) s = r; if (!ok && s >= 0){ addStrip(c * T, (c + 1) * T, s * T, r * T); s = -1; } } }));
  // Door paths
  const pathMat = new THREE.MeshStandardMaterial({map:TEX.concrete, roughness:0.9});
  ALLB.forEach(b => { const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 1.4), pathMat); m.position.set(b.frontX * S, 0.075, (b.door === 's' ? (b.y + b.h) * T * S + 0.5 : b.y * T * S - 0.5)); scene.add(m); });

  ALLB.forEach(addBuilding);
  addTrees(); addStreetFurniture(); addMarketStalls();
}

function addBuilding(b, idx){
  const w = b.w * T * S, d = b.h * T * S, h = b.ht;
  const cx = (b.x + b.w / 2) * T * S, cz = (b.y + b.h / 2) * T * S;
  const floors = Math.max(1, Math.round(h / 3.2));
  const grp = new THREE.Group(); scene.add(grp);
  const set = facadeTextures(b.style, b.color, 1000 + idx * 37);
  const fb = facadeMat(set, b.w, h / 3.2), lr = facadeMat(set, b.h, h / 3.2);
  const roofTopMat = new THREE.MeshStandardMaterial({map:TEX.concrete, color:LIN('#bdb8ad'), roughness:0.95});
  const body = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [lr, lr, roofTopMat, roofTopMat, fb, fb]));
  body.position.set(cx, h / 2, cz); grp.add(body);
  // plinth
  const pl = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, 0.45, d + 0.16), STD('#6f6a62', {roughness:0.95})));
  pl.position.set(cx, 0.225, cz); grp.add(pl);
  // floor bands
  if (floors > 1 && b.style !== 'glass'){
    for (let f = 1; f < floors; f++){
      const band = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w + 0.24, 0.18, d + 0.24), STD('#e9e5dc', {roughness:0.8})));
      band.position.set(cx, f * (h / floors), cz); grp.add(band);
    }
  }
  let roofTop = h;
  if (b.rt === 'hip'){
    const rh = Math.min(w, d) * 0.32;
    const rt = TEX.roof.clone(); rt.needsUpdate = true; rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(12, 1);
    const roof = shadowy(new THREE.Mesh(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1), new THREE.MeshStandardMaterial({map:rt, color:LIN(b.roof), roughness:0.45, metalness:0.55})));
    roof.rotation.y = Math.PI / 4; roof.scale.set(w * 1.14, rh, d * 1.14);
    roof.position.set(cx, h + rh / 2, cz); grp.add(roof);
    const fascia = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w * 1.14 * Math.SQRT1_2 * Math.SQRT2 + 0.05, 0.22, d * 1.14 + 0.05), STD('#f2efe8')));
    fascia.position.set(cx, h + 0.05, cz); grp.add(fascia);
    roofTop = h + rh;
  } else {
    const par = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.7, d + 0.3), STD(b.roof, {roughness:0.8})));
    par.position.set(cx, h + 0.15, cz); grp.add(par);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.1, d - 0.3), roofTopMat); inner.position.set(cx, h + 0.52, cz); grp.add(inner);
    roofTop = h + 0.5;
    // AC condensers
    for (let i = 0; i < Math.min(3, b.w - 2); i++){
      const ac = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.4), STD('#e9e9e6', {roughness:0.5})));
      ac.position.set(cx - w / 2 + 1.4 + i * 1.5, h + 0.9, cz - d / 2 + 1); grp.add(ac);
    }
    if (h > 6 && idx % 2 === 0){
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 3), STD('#dcdcdc', {side:THREE.DoubleSide, roughness:0.4, metalness:0.3}));
      dish.rotation.x = -1.1; dish.position.set(cx + w / 2 - 1.2, h + 1.3, cz + d / 2 - 1.2); grp.add(dish);
    }
  }
  // water tanks (GeneralPolytank style)
  for (let i = 0; i < (b.tanks || 0); i++){
    const tx = cx + w / 2 - 1.3 - i * 1.6, tz = cz - d / 2 + 1.3;
    const baseY = b.rt === 'hip' ? 0 : h + 0.5;
    const standH = b.rt === 'hip' ? h + 0.4 : 0.8;
    const stand = shadowy(new THREE.Mesh(new THREE.BoxGeometry(1.3, standH, 1.3), STD('#8e8a82', {roughness:0.9})));
    const sx = b.rt === 'hip' ? cx + w / 2 + 1.2 : tx, sz = b.rt === 'hip' ? cz - d / 2 + 1 + i * 1.7 : tz;
    stand.position.set(sx, baseY + standH / 2, sz); grp.add(stand);
    const tank = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.62, 1.4, 18), STD('#1b1b1b', {roughness:0.55})));
    tank.position.set(sx, baseY + standH + 0.7, sz); grp.add(tank);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12), STD('#1b1b1b', {roughness:0.5})); lid.position.set(sx, baseY + standH + 1.46, sz); grp.add(lid);
  }
  if (b.extra === 'spire'){
    const tower = shadowy(new THREE.Mesh(new THREE.BoxGeometry(2.4, 5, 2.4), STD(b.color))); tower.position.set(cx, h + 2.5, cz + d / 4); grp.add(tower);
    const sp = shadowy(new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.5, 4), STD(b.roof, {roughness:0.5, metalness:0.4}))); sp.position.set(cx, h + 7.25, cz + d / 4); sp.rotation.y = Math.PI / 4; grp.add(sp);
    const cr1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.4, 0.18), STD('#d4af37', {metalness:0.8, roughness:0.3})); cr1.position.set(cx, h + 10.2, cz + d / 4); grp.add(cr1);
    const cr2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.18), STD('#d4af37', {metalness:0.8, roughness:0.3})); cr2.position.set(cx, h + 10.4, cz + d / 4); grp.add(cr2);
    roofTop = h + 11;
  }
  if (b.extra === 'dome'){
    const dome = shadowy(new THREE.Mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.33, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), STD(b.roof, {roughness:0.35, metalness:0.5})));
    dome.position.set(cx, h + 0.5, cz); grp.add(dome);
    const min = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, h + 8, 12), STD(b.color))); min.position.set(cx + w / 2 - 0.9, (h + 8) / 2, cz - d / 2 + 0.9); grp.add(min);
    const bal = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.3, 12), STD(b.roof)); bal.position.set(cx + w / 2 - 0.9, h + 6, cz - d / 2 + 0.9); grp.add(bal);
    const mt = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2, 12), STD(b.roof, {metalness:0.5, roughness:0.35})); mt.position.set(cx + w / 2 - 0.9, h + 9, cz - d / 2 + 0.9); grp.add(mt);
    roofTop = h + Math.min(w, d) * 0.33 + 0.5;
  }
  // door, frame, steps, canopy, signboard
  const dx = (b.doorC + 0.5) * T * S, sign = b.door === 's' ? 1 : -1, faceZ = cz + sign * d / 2;
  const glassDoor = b.style === 'glass' || b.style === 'office';
  const door = new THREE.Mesh(new THREE.BoxGeometry(glassDoor ? 1.9 : 1.1, 2.3, 0.08), new THREE.MeshStandardMaterial({map:glassDoor ? TEX.glassDoor : TEX.door, roughness:glassDoor ? 0.15 : 0.6, metalness:glassDoor ? 0.3 : 0}));
  door.position.set(dx, 1.15 + 0.3, faceZ + sign * 0.05); if (sign < 0) door.rotation.y = Math.PI; grp.add(door);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(glassDoor ? 2.1 : 1.3, 2.45, 0.06), STD('#f2efe8')); frame.position.set(dx, 1.2 + 0.3, faceZ + sign * 0.02); grp.add(frame);
  const step = shadowy(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.8), STD('#a8a398', {roughness:0.9}))); step.position.set(dx, 0.15, faceZ + sign * 0.4); grp.add(step);
  const canopy = shadowy(new THREE.Mesh(new THREE.BoxGeometry(3, 0.12, 1.4), STD(b.roof, {roughness:0.6}))); canopy.position.set(dx, 3.0, faceZ + sign * 0.7); grp.add(canopy);
  if (b.name){
    const sw = Math.min(w - 0.6, Math.max(3.5, b.name.length * 0.32));
    const sg = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.85, 0.08), [STD('#222'), STD('#222'), STD('#222'), STD('#222'), (() => { const st = signTex(b.name, b.sign || '#1e6b3a'); return new THREE.MeshStandardMaterial({map:st, roughness:0.6, emissive:new THREE.Color(0xffffff), emissiveMap:st, emissiveIntensity:0}); })(), STD('#222')]);
    sg.position.set(dx, Math.min(h - 0.6, 3.75), faceZ + sign * 0.08); if (sign < 0) sg.rotation.y = Math.PI; grp.add(sg);
    WALL_MATS.push(sg.material[4]);
    const lab = makeLabel(b.name, 1.7);
    lab.position.set(cx, roofTop + 2.2, cz); scene.add(lab); LABELS.push(lab);
  }
  if (b.extra === 'cross'){
    const c = ctex(64, 64, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#d62828'; g.fillRect(24, 8, 16, 48); g.fillRect(8, 24, 48, 16); });
    const crs = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshStandardMaterial({map:c, emissive:new THREE.Color(0xffffff), emissiveMap:c, emissiveIntensity:0.3}));
    crs.position.set(cx + w / 4, h - 1.8, faceZ + sign * 0.03); grp.add(crs);
  }
  // wall-mounted split AC units on the sides
  if (b.style !== 'glass') for (let f = 0; f < floors; f++){
    const ac = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.8), STD('#f0f0ee', {roughness:0.5})));
    ac.position.set(cx + w / 2 + 0.18, f * 3.2 + 2.2, cz - d / 4); grp.add(ac);
  }
  // collect materials for see-through fading
  const mats = [];
  grp.traverse(o => {
    if (!o.isMesh) return;
    const conv = m => { if (WALL_MATS.includes(m)){ mats.push(m); return m; } const c = m.clone(); mats.push(c); return c; };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
  });
  OCC.push({grp, mats:[...new Set(mats)], x0:b.x * T * S - 0.3, x1:(b.x + b.w) * T * S + 0.3, z0:b.y * T * S - 0.3, z1:(b.y + b.h) * T * S + 0.3, top:roofTop, faded:false});
}

function addTrees(){
  const spots = [];
  for (let i = 0; i < 900 && spots.length < 120; i++){
    const c = Math.floor(srand() * COLS), r = Math.floor(srand() * ROWS);
    if (isRoad(c, r) || nearRoad(c, r) || inSolidTile(c, r, 1)) continue;
    spots.push({x:(c + 0.5) * T + (srand() - 0.5) * 18, y:(r + 0.5) * T + (srand() - 0.5) * 18, s:0.8 + srand() * 0.5, palm:srand() < 0.4, rot:srand() * 6});
  }
  // also palms along the outer sidewalks of the big roads
  ROAD_ROWS.forEach(R => { for (let c = 4; c < COLS; c += 9){ const r = R + 2; if (!isRoad(c, r) && !inSolidTile(c, r + 1, 0)) spots.push({x:(c + 0.5) * T, y:(r + 0.85) * T, s:0.9, palm:true, rot:srand() * 6}); } });
  const dummy = new THREE.Object3D();
  const palms = spots.filter(s => s.palm), broad = spots.filter(s => !s.palm);
  // broadleaf
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.32, 3.2, 8); trunkGeo.translate(0, 1.6, 0);
  const blobs = [[0, 4.2, 0, 2.0], [1.2, 3.8, 0.4, 1.4], [-1.1, 3.9, -0.3, 1.5], [0.3, 3.7, -1.2, 1.3], [-0.4, 3.6, 1.2, 1.3], [0, 5.2, 0, 1.3]];
  const canopyGeo = mergeGeos(blobs.map(([x, y, z, r]) => { const g = new THREE.IcosahedronGeometry(r, 1); g.translate(x, y, z); return g; }));
  canopyGeo.computeVertexNormals();
  const trunks = new THREE.InstancedMesh(trunkGeo, STD('#5b4130', {roughness:0.95}), broad.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.9, flatShading:true}), broad.length);
  const leafCols = ['#3f7d2a','#4a8c30','#356f24','#5a9a38'];
  broad.forEach((t, i) => {
    dummy.position.set(t.x * S, 0, t.y * S); dummy.rotation.set(0, t.rot, 0); dummy.scale.setScalar(t.s); dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix); canopies.setMatrixAt(i, dummy.matrix);
    canopies.setColorAt(i, LIN(spick(leafCols)));
  });
  // palms
  const ptGeo = new THREE.CylinderGeometry(0.16, 0.26, 7, 8, 6); ptGeo.translate(0, 3.5, 0);
  const pos = ptGeo.attributes.position; for (let i = 0; i < pos.count; i++){ const y = pos.getY(i); pos.setX(i, pos.getX(i) + Math.pow(y / 7, 2) * 0.8); }
  ptGeo.computeVertexNormals();
  const fronds = [];
  for (let k = 0; k < 10; k++){
    const g = new THREE.PlaneGeometry(1.1, 3.6, 1, 4); g.translate(0, 1.8, 0);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++){ const y = p.getY(i); p.setZ(i, -Math.pow(y / 3.6, 2) * 1.6); }
    g.rotateX(-1.0 + (k % 2) * 0.35); g.rotateY(k / 10 * Math.PI * 2); g.translate(0.8, 7, 0);
    fronds.push(g);
  }
  const frondGeo = mergeGeos(fronds); frondGeo.computeVertexNormals();
  const ptrunks = new THREE.InstancedMesh(ptGeo, STD('#7a6650', {roughness:0.95}), palms.length);
  const pfronds = new THREE.InstancedMesh(frondGeo, new THREE.MeshStandardMaterial({map:TEX.frond, alphaTest:0.4, side:THREE.DoubleSide, roughness:0.85}), palms.length);
  palms.forEach((t, i) => { dummy.position.set(t.x * S, 0, t.y * S); dummy.rotation.set(0, t.rot, 0); dummy.scale.setScalar(t.s); dummy.updateMatrix(); ptrunks.setMatrixAt(i, dummy.matrix); pfronds.setMatrixAt(i, dummy.matrix); });
  [trunks, canopies, ptrunks, pfronds].forEach(m => { if (GFX === 'high'){ m.castShadow = true; } scene.add(m); });
}

function addMarketStalls(){
  const b = B.market, cols = ['#c0392b', '#f1c40f', '#27ae60', '#2980b9'];
  for (let i = 0; i < 4; i++){
    const x = (b.x + 0.7 + i * 1.5) * T * S, z = (b.y + b.h) * T * S + 1.6;
    if (Math.abs(x - b.frontX * S) < 2) continue;
    const table = shadowy(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1), STD('#7a5230'))); table.position.set(x, 0.59, z); scene.add(table);
    for (let k = 0; k < 6; k++){ const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), STD(pick(['#e74c3c','#f39c12','#27ae60','#f1c40f']))); f.position.set(x - 0.6 + (k % 3) * 0.6, 1.1, z - 0.2 + Math.floor(k / 3) * 0.4); scene.add(f); }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), STD('#888')); pole.position.set(x, 1.3, z); scene.add(pole);
    const umb = shadowy(new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.6, 8, 1, true), STD(cols[i], {side:THREE.DoubleSide}))); umb.position.set(x, 2.6, z); scene.add(umb);
  }
}

function addStreetFurniture(){
  const dummy = new THREE.Object3D();
  // street lamps on south sidewalks + vertical roads
  const lamps = [];
  const doorTiles = new Set(ALLB.map(b => b.doorC + ',' + Math.floor(b.frontY / T)));
  ROAD_ROWS.forEach(R => { for (let c = 2; c < COLS; c += 5){ const r = R + 2; if (!isRoad(c, r) && !inSolidTile(c, r, 0) && !doorTiles.has(c + ',' + r)) lamps.push({x:(c + 0.5) * T, y:(r + 0.15) * T, rot:0}); } });
  ROAD_COLS.forEach(C => { for (let r = 2; r < ROWS; r += 5){ const c = C + 2; if (!isRoad(c, r) && !HSIDE.has(r) && !inSolidTile(c, r, 0)) lamps.push({x:(c + 0.15) * T, y:(r + 0.5) * T, rot:Math.PI / 2}); } });
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.11, 6.5, 8); poleGeo.translate(0, 3.25, 0);
  const armGeo = new THREE.BoxGeometry(0.08, 0.08, 1.6); armGeo.translate(0, 6.4, -0.75);
  const headGeo = new THREE.BoxGeometry(0.35, 0.14, 0.7); headGeo.translate(0, 6.33, -1.45);
  bulbMat = new THREE.MeshStandardMaterial({color:LIN('#fff6d8'), emissive:new THREE.Color(0xffd890), emissiveIntensity:0});
  const poles = new THREE.InstancedMesh(poleGeo, STD('#4a4d50', {metalness:0.6, roughness:0.4}), lamps.length);
  const arms = new THREE.InstancedMesh(armGeo, STD('#4a4d50', {metalness:0.6, roughness:0.4}), lamps.length);
  const heads = new THREE.InstancedMesh(headGeo, bulbMat, lamps.length);
  const poolGeo = new THREE.PlaneGeometry(9, 9); poolGeo.rotateX(-Math.PI / 2);
  lampPools = new THREE.InstancedMesh(poolGeo, new THREE.MeshBasicMaterial({map:TEX.glow, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false}), lamps.length);
  lamps.forEach((l, i) => {
    dummy.position.set(l.x * S, 0, l.y * S); dummy.rotation.set(0, l.rot, 0); dummy.scale.setScalar(1); dummy.updateMatrix();
    poles.setMatrixAt(i, dummy.matrix); arms.setMatrixAt(i, dummy.matrix); heads.setMatrixAt(i, dummy.matrix);
    dummy.position.set(l.x * S - Math.sin(l.rot) * 1.45, 0.16, l.y * S - Math.cos(l.rot) * 1.45); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); lampPools.setMatrixAt(i, dummy.matrix);
  });
  if (GFX === 'high'){ poles.castShadow = true; }
  scene.add(poles); scene.add(arms); scene.add(heads); scene.add(lampPools);

  // wooden electricity (NEPA) poles with sagging wires on north sidewalks
  ROAD_ROWS.forEach(R => {
    const r = R - 1, pts = [];
    for (let c = 1; c < COLS; c += 4){ if (isRoad(c, r) || doorTiles.has(c + ',' + r)) continue; pts.push(new THREE.Vector3((c + 0.5) * T * S, 0, (r + 0.2) * T * S)); }
    pts.forEach(p => {
      const pole = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8, 7), STD('#5d4532', {roughness:1}))); pole.position.set(p.x, 4, p.z); scene.add(pole);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), STD('#5d4532')); cross.position.set(p.x, 7.6, p.z); scene.add(cross);
    });
    [-0.7, 0, 0.7].forEach(off => {
      const wpts = [];
      for (let i = 0; i < pts.length - 1; i++){
        const a = pts[i], b = pts[i + 1];
        for (let k = 0; k <= 8; k++){ const t = k / 8; wpts.push(new THREE.Vector3(lerp(a.x, b.x, t) + off, 7.7 - Math.sin(t * Math.PI) * 0.5, lerp(a.z, b.z, t))); }
      }
      const geo = new THREE.BufferGeometry().setFromPoints(wpts);
      scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({color:0x111111})));
    });
  });

  // street name signs + traffic lights at every junction
  ['red','amber','green'].forEach(k => ['h','v'].forEach(ax => { TRAFFIC_MATS[ax + k] = new THREE.MeshStandardMaterial({color:LIN(k === 'red' ? '#4a0d0d' : k === 'amber' ? '#4a3a0d' : '#0d3a14'), emissive:new THREE.Color(k === 'red' ? 0xff2a2a : k === 'amber' ? 0xffb020 : 0x2aff5a), emissiveIntensity:0}); }));
  ROAD_ROWS.forEach((R, ri) => ROAD_COLS.forEach((C, ci) => {
    // street sign on the NE corner
    const sx = ((C + 2) * T + 5) * S, sz = (R * T - 5) * S;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), STD('#777', {metalness:0.6, roughness:0.4})); post.position.set(sx, 1.6, sz); scene.add(post);
    const mk = (name, rotY, y) => {
      const tex = signTex(name, '#0b6e3a', '#fff', 512, 96);
      const face = new THREE.MeshStandardMaterial({map:tex, roughness:0.5});
      const bx = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.48, 0.04), [STD('#0b6e3a'), STD('#0b6e3a'), STD('#0b6e3a'), STD('#0b6e3a'), face, face]);
      bx.position.set(sx, y, sz); bx.rotation.y = rotY; scene.add(bx);
    };
    mk(AREA.streets[ri], 0, 3.05);
    mk(AREA.streets[3 + ci], Math.PI / 2, 2.5);
    // traffic lights: one for each axis
    const tl = (x, z, ax) => {
      const p = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 8), STD('#2b2b2b', {metalness:0.5, roughness:0.5}))); p.position.set(x, 1.8, z); scene.add(p);
      const box = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.05, 0.36), STD('#1a1a1a', {roughness:0.6}))); box.position.set(x, 3.95, z); scene.add(box);
      ['red','amber','green'].forEach((k, i) => {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), TRAFFIC_MATS[ax + k]);
        l.scale.set(1, 1, 1.9);
        l.position.set(x, 4.27 - i * 0.32, z); scene.add(l);
      });
    };
    tl(((C - 1) * T + 6) * S, ((R - 1) * T + 6) * S, 'h');
    tl(((C + 3) * T - 6) * S, ((R + 3) * T - 6) * S, 'h');
    tl(((C - 1) * T + 6) * S, ((R + 3) * T - 6) * S, 'v');
    tl(((C + 3) * T - 6) * S, ((R - 1) * T + 6) * S, 'v');
  }));

  // bus stops
  [[20, 11], [38, 22], [8, 33]].forEach(([c, r]) => {
    const x = (c + 0.5) * T * S, z = (r + 0.5) * T * S;
    const roof = shadowy(new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 1.6), STD('#f1c40f', {roughness:0.5}))); roof.position.set(x, 2.6, z); scene.add(roof);
    [-1.8, 1.8].forEach(o => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), STD('#333')); p.position.set(x + o, 1.3, z - 0.6); scene.add(p); });
    const bench = shadowy(new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.5), STD('#6b4a2a'))); bench.position.set(x, 0.55, z - 0.4); scene.add(bench);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), new THREE.MeshStandardMaterial({map:signTex('BUS STOP', '#111', '#f1c40f', 256, 80)})); sg.position.set(x, 2.95, z + 0.81); scene.add(sg);
  });
}

/* =========================================================
   VEHICLES
   ========================================================= */
function makeCar(type, color){
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({color:LIN(color), metalness:0.55, roughness:0.32, envMapIntensity:1.3});
  const glass = new THREE.MeshStandardMaterial({color:LIN('#1a2630'), metalness:0.2, roughness:0.05, envMapIntensity:1.6, side:THREE.DoubleSide});
  const black = STD('#151515', {roughness:0.7});
  let L, Wd, prof, win;
  if (type === 'danfo'){
    L = 4.8; Wd = 1.9;
    prof = [[-2.4, 0.38], [-2.4, 1.95], [-2.25, 2.08], [1.65, 2.08], [2.25, 1.35], [2.4, 0.95], [2.4, 0.38]];
    win = [[-2.1, 1.3], [-2.1, 1.85], [1.55, 1.85], [1.55, 1.3]];
  } else {
    L = 4.4; Wd = 1.76;
    prof = [[-2.2, 0.38], [-2.2, 0.85], [-1.95, 0.98], [-1.25, 1.02], [-0.85, 1.42], [0.55, 1.45], [1.15, 1.02], [2.05, 0.92], [2.2, 0.72], [2.2, 0.38]];
    win = [[-1.12, 1.06], [-0.8, 1.37], [0.52, 1.39], [1.02, 1.06]];
  }
  const shape = new THREE.Shape(); prof.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {depth:Wd - 0.1, bevelEnabled:true, bevelThickness:0.05, bevelSize:0.05, bevelSegments:2, steps:1}), paint);
  body.position.z = -(Wd - 0.1) / 2; g.add(shadowy(body));
  const wShape = new THREE.Shape(); win.forEach(([x, y], i) => i ? wShape.lineTo(x, y) : wShape.moveTo(x, y));
  [1, -1].forEach(sd => { const sw = new THREE.Mesh(new THREE.ShapeGeometry(wShape), glass); sw.position.z = sd * (Wd / 2 + 0.005); g.add(sw); });
  if (type !== 'danfo'){
    const ws = (a, b) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const m = new THREE.Object3D(); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.035, 0); m.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]); const pl = new THREE.Mesh(new THREE.PlaneGeometry(len * 0.95, Wd - 0.25), glass); pl.rotation.x = -Math.PI / 2; m.add(pl); g.add(m); };
    ws([1.15, 1.02], [0.55, 1.45]); ws([-0.85, 1.42], [-1.25, 1.02]);
  } else {
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.85, Wd - 0.3), glass); const fm = new THREE.Object3D(); fm.position.set(1.95, 1.72, 0); fm.rotation.z = Math.atan2(1.35 - 2.08, 2.25 - 1.65); front.rotation.x = -Math.PI / 2; fm.add(front); g.add(fm);
    [1, -1].forEach(sd => { const st = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 0.02), black); st.position.set(-0.05, 1.12, sd * (Wd / 2 + 0.01)); g.add(st); });
  }
  const tireGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 18); tireGeo.rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.26, 12); rimGeo.rotateX(Math.PI / 2);
  const ax = type === 'danfo' ? 1.55 : 1.35;
  [[ax, 1], [ax, -1], [-ax, 1], [-ax, -1]].forEach(([x, sd]) => {
    const t = shadowy(new THREE.Mesh(tireGeo, black)); t.position.set(x, 0.34, sd * (Wd / 2 - 0.1)); g.add(t);
    const r = new THREE.Mesh(rimGeo, STD('#b8bcc0', {metalness:0.9, roughness:0.3})); r.position.set(x, 0.34, sd * (Wd / 2 - 0.09)); g.add(r);
  });
  const hx = L / 2 + 0.01;
  [0.55, -0.55].forEach(z => { const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.34), headMat); hl.position.set(hx, 0.78, z); g.add(hl); const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.3), tailMat); tl.position.set(-hx, 0.8, z); g.add(tl); });
  const bump = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, Wd), black); bump.position.set(hx - 0.02, 0.45, 0); g.add(bump);
  const bump2 = bump.clone(); bump2.position.x = -hx + 0.02; g.add(bump2);
  scene.add(g);
  return {g, L, Wd};
}
const cars = [];
function spawnCars(){
  headMat = new THREE.MeshStandardMaterial({color:LIN('#fff7d0'), emissive:new THREE.Color(0xfff2c0), emissiveIntensity:0.2});
  tailMat = new THREE.MeshStandardMaterial({color:LIN('#7a0d0d'), emissive:new THREE.Color(0xff2020), emissiveIntensity:0.3});
  const colorsCar = ['#f1c40f','#c0392b','#ecf0f1','#1f2a36','#2e86c1','#7f8c8d','#0e6655','#e9e9e9'];
  const lanes = [];
  ROAD_ROWS.forEach((R, ri) => { lanes.push({axis:'h', road:ri, lane:(R + 0.5) * T, dir:-1}); lanes.push({axis:'h', road:ri, lane:(R + 1.5) * T, dir:1}); });
  ROAD_COLS.forEach((C, ci) => { lanes.push({axis:'v', road:ci, lane:(C + 0.5) * T, dir:1}); lanes.push({axis:'v', road:ci, lane:(C + 1.5) * T, dir:-1}); });
  lanes.forEach(ln => {
    const n = ln.axis === 'h' ? 3 : 2, len = ln.axis === 'h' ? WW : WH;
    for (let k = 0; k < n; k++){
      const type = Math.random() < 0.3 ? 'danfo' : 'car';
      const m = makeCar(type, type === 'danfo' ? '#f2c40f' : pick(colorsCar));
      const pos = (k + Math.random() * 0.6) * len / n;
      cars.push(Object.assign({}, ln, {type, mesh:m.g, lenPx:m.L / S, widPx:m.Wd / S, pos, v:0, maxV:(70 + Math.random() * 50)}));
    }
  });
  cars.forEach(c => { c.mesh.rotation.y = c.axis === 'h' ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? -Math.PI / 2 : Math.PI / 2); });
}
const carXY = c => c.axis === 'h' ? [c.pos, c.lane] : [c.lane, c.pos];

/* =========================================================
   PEOPLE (smooth, jointed humans)
   ========================================================= */
const geoCache = {};
function capsuleGeo(r, len){
  const key = 'c' + r + '_' + len; if (geoCache[key]) return geoCache[key];
  const pts = [], n = 6;
  for (let i = 0; i <= n; i++){ const a = -Math.PI / 2 + i / n * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(0.0005, Math.cos(a) * r), Math.sin(a) * r)); }
  for (let i = 0; i <= n; i++){ const a = i / n * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(0.0005, Math.cos(a) * r), len + Math.sin(a) * r)); }
  const g = new THREE.LatheGeometry(pts, 12); g.translate(0, -(len + r), 0);
  return geoCache[key] = g;
}
function latheGeo(key, prof, seg){
  if (geoCache[key]) return geoCache[key];
  return geoCache[key] = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(Math.max(0.0005, x), y)), seg || 16);
}
const SKINS = ['#5a3825','#6b4226','#7a4b2a','#4a2e1c','#8d5a36','#3e2616'];
const SHIRTS = ['#c0392b','#2e86c1','#8e44ad','#d68910','#17a589','#ecf0f1','#1c2833','#b9770e','#117864','#f4d03f','#e8e8e8','#5d6d7e'];
const PANTS = ['#1c2833','#2c3e50','#4d3b2a','#17202a','#5d6d7e','#283747'];
function clothMat(c){ if (typeof c === 'number') return new THREE.MeshStandardMaterial({map:TEX.ankara[c], roughness:0.85}); return STD(c, {roughness:0.85}); }
function makePerson(o){
  const g = new THREE.Group();
  const skin = STD(o.skin, {roughness:0.55}), top = clothMat(o.top), bot = clothMat(o.bottom), shoe = STD(o.shoe || '#1a1a1a', {roughness:0.5});
  const hairM = STD(o.hair || '#121212', {roughness:0.9});
  const add = (parent, geo, mat, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (sx) m.scale.set(sx, sy, sz); if (GFX === 'high') m.castShadow = true; parent.add(m); return m; };
  const f = o.gender === 'f';
  const hips = new THREE.Group(); hips.position.y = 0.95; g.add(hips);
  // pelvis + torso
  add(hips, latheGeo('pelvis' + f, f ? [[0, -0.14], [0.14, -0.14], [0.18, -0.06], [0.17, 0.02], [0, 0.03]] : [[0, -0.14], [0.13, -0.14], [0.16, -0.06], [0.155, 0.02], [0, 0.03]]), bot, 0, 0, 0, 1, 1, 0.72);
  const spine = new THREE.Group(); hips.add(spine);
  add(spine, latheGeo('torso' + f, f ? [[0, 0], [0.13, 0], [0.13, 0.1], [0.15, 0.22], [0.17, 0.32], [0.17, 0.4], [0.16, 0.47], [0.12, 0.52], [0.05, 0.55], [0, 0.555]] : [[0, 0], [0.15, 0], [0.155, 0.1], [0.155, 0.22], [0.175, 0.34], [0.19, 0.44], [0.18, 0.5], [0.13, 0.54], [0.05, 0.56], [0, 0.565]]), top, 0, 0, 0, 1, 1, 0.62);
  if (o.long){ add(hips, new THREE.CylinderGeometry(0.17, f ? 0.3 : 0.24, f ? 0.62 : 0.5, 18, 1, true), o.long === 'top' ? top : bot, 0, -0.2 - (f ? 0.31 : 0.25) + 0.2, 0, 1, 1, 0.75).material.side = THREE.DoubleSide; }
  add(spine, new THREE.CylinderGeometry(0.05, 0.055, 0.1, 10), skin, 0, 0.6, 0);
  const head = new THREE.Group(); head.position.y = 0.76; spine.add(head);
  add(head, new THREE.SphereGeometry(0.11, 20, 16), skin, 0, 0, 0, 0.95, 1.15, 1.02);
  add(head, new THREE.SphereGeometry(0.12, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hairM, 0, 0.012, -0.005, 0.97, 1.08, 1.04);
  [-1, 1].forEach(s => {
    add(head, new THREE.SphereGeometry(0.017, 10, 8), STD('#f4f1ea', {roughness:0.3}), s * 0.038, 0.015, 0.098);
    add(head, new THREE.SphereGeometry(0.009, 8, 6), STD('#1a0f08', {roughness:0.2}), s * 0.038, 0.015, 0.112);
    add(head, new THREE.SphereGeometry(0.024, 8, 8), skin, s * 0.104, 0, 0, 0.5, 1, 0.8);
  });
  add(head, new THREE.SphereGeometry(0.02, 8, 8), skin, 0, -0.02, 0.11, 1.2, 0.9, 1);
  add(head, new THREE.BoxGeometry(0.045, 0.008, 0.01), STD('#5a2a1e'), 0, -0.058, 0.104);
  if (o.gele){ add(head, new THREE.TorusGeometry(0.11, 0.045, 8, 18), clothMat(o.gele), 0, 0.08, -0.01, 1, 1, 1).rotation.x = Math.PI / 2 - 0.25; add(head, new THREE.ConeGeometry(0.13, 0.16, 10), clothMat(o.gele), 0, 0.17, -0.03); }
  else if (f) add(head, new THREE.SphereGeometry(0.065, 12, 10), hairM, 0, 0.09, -0.09);
  if (o.cap){ add(head, new THREE.CylinderGeometry(0.125, 0.125, 0.08, 16), STD(o.cap), 0, 0.1, 0); add(head, new THREE.BoxGeometry(0.2, 0.015, 0.12), STD(o.cap), 0, 0.065, 0.12); }
  // arms
  const arm = (s) => {
    const sh = new THREE.Group(); sh.position.set(s * (f ? 0.19 : 0.21), 0.5, 0); spine.add(sh);
    add(sh, capsuleGeo(0.05, 0.19), top, 0, 0, 0);
    const el = new THREE.Group(); el.position.y = -0.29; sh.add(el);
    add(el, capsuleGeo(0.04, 0.18), o.longSleeve ? top : skin, 0, 0, 0);
    add(el, new THREE.SphereGeometry(0.045, 10, 8), skin, 0, -0.27, 0.01, 0.75, 1.05, 0.55);
    return {sh, el};
  };
  const aL = arm(-1), aR = arm(1);
  // legs
  const leg = (s) => {
    const hp = new THREE.Group(); hp.position.set(s * 0.09, -0.06, 0); hips.add(hp);
    add(hp, capsuleGeo(0.07, 0.3), o.skirt ? skin : bot, 0, 0, 0);
    const kn = new THREE.Group(); kn.position.y = -0.44; hp.add(kn);
    add(kn, capsuleGeo(0.055, 0.32), o.skirt ? skin : bot, 0, 0, 0);
    add(kn, new THREE.SphereGeometry(0.065, 10, 8), shoe, 0, -0.43, 0.05, 1, 0.6, 2.0);
    return {hp, kn};
  };
  const lL = leg(-1), lR = leg(1);
  if (o.skirt){ add(hips, new THREE.CylinderGeometry(0.17, 0.28, 0.5, 18, 1, true), bot, 0, -0.23, 0, 1, 1, 0.78).material.side = THREE.DoubleSide; }
  scene.add(g);
  return {g, hips, spine, head, aL, aR, lL, lR};
}
function animPerson(p, moving, ph, riding, speed, pose){
  if (pose === 'sit'){
    p.hips.position.y = 0.5; p.hips.rotation.y = 0; p.spine.rotation.y = 0; p.spine.rotation.x = 0.04 + Math.sin(ph) * 0.015;
    p.lL.hp.rotation.x = p.lR.hp.rotation.x = -1.5; p.lL.kn.rotation.x = p.lR.kn.rotation.x = 1.5;
    p.aL.sh.rotation.x = p.aR.sh.rotation.x = -0.45; p.aL.el.rotation.x = p.aR.el.rotation.x = -0.7;
    p.aL.sh.rotation.z = -0.1; p.aR.sh.rotation.z = 0.1; return;
  }
  if (riding){
    p.lL.hp.rotation.x = p.lR.hp.rotation.x = -1.45; p.lL.kn.rotation.x = p.lR.kn.rotation.x = 1.45;
    p.aL.sh.rotation.x = p.aR.sh.rotation.x = -1.05; p.aL.el.rotation.x = p.aR.el.rotation.x = -0.35;
    p.aL.sh.rotation.z = -0.05; p.aR.sh.rotation.z = 0.05;
    p.hips.position.y = 0.95; p.spine.rotation.x = 0.12; return;
  }
  const a = moving ? Math.min(1, speed) : 0;
  const s = Math.sin(ph), c = Math.cos(ph);
  p.lL.hp.rotation.x = -s * 0.55 * a; p.lR.hp.rotation.x = s * 0.55 * a;
  p.lL.kn.rotation.x = (0.08 + Math.max(0, Math.sin(ph + 2.2)) * 0.95) * a + 0.02;
  p.lR.kn.rotation.x = (0.08 + Math.max(0, Math.sin(ph + 2.2 + Math.PI)) * 0.95) * a + 0.02;
  p.aL.sh.rotation.x = s * 0.45 * a; p.aR.sh.rotation.x = -s * 0.45 * a;
  p.aL.el.rotation.x = -0.18 - Math.max(0, -s) * 0.4 * a; p.aR.el.rotation.x = -0.18 - Math.max(0, s) * 0.4 * a;
  p.aL.sh.rotation.z = -0.07; p.aR.sh.rotation.z = 0.07;
  p.hips.position.y = 0.95 + Math.abs(c) * 0.035 * a - 0.015 * a;
  p.spine.rotation.x = 0.06 * a;
  p.hips.rotation.y = s * 0.08 * a; p.spine.rotation.y = -s * 0.12 * a;
  if (!moving){ const br = Math.sin(performance.now() / 700) * 0.01; p.spine.rotation.x = br; }
}
function turnTo(cur, target, k){ let d = target - cur; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return cur + d * k; }
function outfit(gender, rng, forceR){
  const R = rng || Math.random, pick = arr => arr[Math.floor(R() * arr.length)];
  const f = gender === 'f';
  const o = {gender, skin:pick(SKINS), hair:'#121212'};
  const r = forceR !== undefined ? forceR : R();
  if (f){
    if (r < 0.4){ o.top = pick([0, 1, 2, 3]); o.bottom = o.top; o.long = 'top'; o.gele = pick([0, 1, 2, 3]); }
    else if (r < 0.75){ o.top = pick(SHIRTS); o.bottom = pick([0, 1, 2, 3]); o.skirt = true; }
    else { o.top = pick(SHIRTS); o.bottom = pick(PANTS); }
  } else {
    if (r < 0.25){ o.top = pick(['#f5f5f0','#1f618d','#7d6608','#4a235a']); o.bottom = o.top; o.long = 'top'; o.longSleeve = true; o.cap = pick(['#7d3c98','#1a5276','#922b21']); }
    else { o.top = pick(SHIRTS); o.bottom = pick(PANTS); }
  }
  return o;
}

/* Okada */
function makeOkada(){
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({color:LIN('#b0221a'), metalness:0.5, roughness:0.35});
  const chrome = STD('#c8ccd0', {metalness:0.9, roughness:0.25}), blk = STD('#141414', {roughness:0.6});
  const tire = new THREE.TorusGeometry(0.3, 0.07, 10, 20);
  [0.68, -0.68].forEach(z => { const t = new THREE.Mesh(tire, blk); t.rotation.y = Math.PI / 2; t.position.set(0, 0.37, z); g.add(shadowy(t)); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 10), chrome); hub.rotation.z = Math.PI / 2; hub.position.set(0, 0.37, z); g.add(hub); });
  const tank = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), red); tank.scale.set(0.8, 0.65, 1.5); tank.position.set(0, 0.88, 0.25); g.add(shadowy(tank));
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.75), blk); seat.position.set(0, 0.9, -0.3); g.add(seat);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.2), red); frame.position.set(0, 0.62, 0); frame.rotation.x = 0.1; g.add(frame);
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.4), chrome); engine.position.set(0, 0.5, 0.05); g.add(engine);
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), chrome); fork.position.set(0, 0.72, 0.6); fork.rotation.x = -0.35; g.add(fork);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 6), chrome); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.1, 0.5); g.add(bar);
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), headMat); hl.position.set(0, 1.0, 0.72); g.add(hl);
  const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8), chrome); ex.rotation.x = Math.PI / 2; ex.position.set(0.18, 0.4, -0.35); g.add(ex);
  return g;
}

/* =========================================================
   GAME OBJECTS (created after world build)
   ========================================================= */
let playerRoot, playerP, bike, marker, beacon, crumbs, npcs = [];
const camS = {yaw:0, pitch:0.32, dist:9.5, lastDrag:-99};

function buildActors(){
  spawnCars();
  playerRoot = new THREE.Group(); scene.add(playerRoot);
  const po = outfit(state.gender, null, 0.9);
  if (state.gender === 'm'){ po.top = '#0b8a4a'; po.bottom = '#1c2833'; }
  else { po.top = '#0b8a4a'; po.bottom = 1; po.skirt = true; delete po.long; delete po.gele; }
  po.skin = '#6b4226';
  playerP = makePerson(po); scene.remove(playerP.g); playerRoot.add(playerP.g);
  bike = makeOkada(); playerRoot.add(bike);

  NPCS.forEach(d => npcs.push(Object.assign({}, d, {gender:d.g, police:false, o:outfit(d.g, seeded(d.id))})));
  POLICE_NAMES.forEach((name, i) => npcs.push({id:'cop' + i, name, role:'Police officer', police:true, gender:'m', o:{gender:'m', skin:pick(SKINS), top:'#1c2a4a', bottom:'#1c2a4a', cap:'#0d0d0d', longSleeve:true}}));
  npcs.forEach(n => {
    const p = n.home && B[n.home] ? nearSidewalk(B[n.home]) : randomSidewalk();
    Object.assign(n, {x:p.x, y:p.y, tx:p.x, ty:p.y, speed:18 + Math.random() * 8, wait:Math.random() * 3, face:0, ph:Math.random() * 6, moving:false, greetDay:0});
    npcPick(n);
    n.p = makePerson(n.o);
    refreshLabel(n.id, n);
  });

  marker = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4), new THREE.MeshStandardMaterial({color:LIN('#7dffa8'), emissive:new THREE.Color(0x2ecc71), emissiveIntensity:0.8}));
  marker.rotation.x = Math.PI; marker.visible = false; scene.add(marker);
  beacon = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 40, 20, 1, true), new THREE.MeshBasicMaterial({map:TEX.beam, transparent:true, opacity:0.55, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, toneMapped:false, fog:false}));
  beam.position.y = 20; beacon.add(beam);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 32), new THREE.MeshBasicMaterial({color:0xffd23f, transparent:true, opacity:0.9, side:THREE.DoubleSide, toneMapped:false}));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2; beacon.add(ring);
  scene.add(beacon);
  const dot = new THREE.CircleGeometry(0.22, 16); dot.rotateX(-Math.PI / 2);
  crumbs = new THREE.InstancedMesh(dot, new THREE.MeshBasicMaterial({color:0xffd23f, transparent:true, opacity:0.95, depthWrite:false, toneMapped:false}), 400);
  crumbs.count = 0; crumbs.frustumCulled = false; scene.add(crumbs);
}

function npcLabelText(n){
  if (n.police) return n.name;
  const st = stageOf(n.id);
  const ic = {talking:' 💬', dating:' ❤️', serious:' 💑', engaged:' 💍', married:' 💍', friend:' ⭐', close:' 💛', ex:' 💔'}[st] || '';
  return (st === 'stranger' ? n.role : n.name) + ic;
}
function refreshLabel(id, nn){
  const n = nn || npcs.find(x => x.id === id); if (!n || !n.p) return;
  const txt = npcLabelText(n);
  if (n.label && n.labelText === txt) return;
  if (n.label){ n.p.g.remove(n.label); n.label.material.map.dispose(); n.label.material.dispose(); }
  const st = n.police ? '' : stageOf(n.id);
  n.labelText = txt;
  n.label = makeLabel(txt, 0.32, n.police ? 'rgba(30,50,110,.9)' : ROMANTIC.includes(st) ? 'rgba(150,20,70,.9)' : 'rgba(10,22,15,.85)');
  n.label.position.set(0, 2.15, 0); n.p.g.add(n.label);
}

/* =========================================================
   RENDER
   ========================================================= */
function darkness(){
  const m = state.minutes / 60;
  if (m >= 6.5 && m < 18) return 0;
  if (m >= 18 && m < 19.7) return (m - 18) / 1.7;
  if (m >= 19.7 || m < 5) return 1;
  return 1 - (m - 5) / 1.5;
}
const SKY = {
  day:{top:new THREE.Color('#3f7fcf'), hor:new THREE.Color('#cfe4f2'), bot:new THREE.Color('#6d7a62')},
  dusk:{top:new THREE.Color('#3a4a86'), hor:new THREE.Color('#f2a06a'), bot:new THREE.Color('#4a3a32')},
  night:{top:new THREE.Color('#040814'), hor:new THREE.Color('#141c38'), bot:new THREE.Color('#0a0c10')}
};
let lastNight = -1;
function updateLighting(px, pz){
  const dk = darkness(), m = state.minutes / 60;
  const ang = clamp((m - 6) / 12.5, 0, 1) * Math.PI;
  const sd = new THREE.Vector3(Math.cos(ang) * 0.75, Math.max(0.05, Math.sin(ang)), 0.45).normalize();
  sun.position.set(px + sd.x * 80, sd.y * 80, pz + sd.z * 80);
  sun.target.position.set(px, 0, pz);
  const duskAmt = clamp(1 - Math.abs(m - 18.6) / 1.6, 0, 1) * (m > 12 ? 1 : 0) + clamp(1 - Math.abs(m - 6.1) / 1.0, 0, 1) * 0.7;
  sun.intensity = Math.max(0.0, 2.4 * (1 - dk) * (1 - duskAmt * 0.4));
  sun.color.setHSL(0.1, 0.6 * duskAmt + 0.15, 0.85 - duskAmt * 0.15);
  hemi.intensity = 0.75 * (1 - dk) + 0.12;
  ['top','hor','bot'].forEach(k => { const c = SKY.day[k].clone().lerp(SKY.dusk[k], duskAmt).lerp(SKY.night[k], dk); skyU[k].value.copy(c); });
  skyU.sunDir.value.copy(sd); skyU.sunCol.value.setRGB(1, 0.85 - duskAmt * 0.3, 0.6 - duskAmt * 0.3).multiplyScalar(1 - dk);
  scene.fog.color.copy(skyU.hor.value);
  renderer.toneMappingExposure = 1.0 + dk * 0.25;
  const winI = clamp((dk - 0.15) * 1.6, 0, 1);
  WALL_MATS.forEach(mt => mt.emissiveIntensity = winI * 1.1);
  if (bulbMat) bulbMat.emissiveIntensity = winI * 4;
  if (lampPools) lampPools.material.opacity = winI * 0.85;
  if (headMat) headMat.emissiveIntensity = 0.2 + winI * 3;
  if (tailMat) tailMat.emissiveIntensity = 0.3 + winI * 1.5;
  // traffic lights
  ['h','v'].forEach(ax => { const st = lightState(ax); ['red','amber','green'].forEach(k => TRAFFIC_MATS[ax + k].emissiveIntensity = st === k ? 3 : 0); });
  if (inside){
    sky.visible = false; scene.background = INDOOR_BG;
    scene.fog.color.copy(INDOOR_BG); scene.fog.near = 30; scene.fog.far = 90;
    hemi.intensity = 0.62 - dk * 0.2; sun.intensity *= 0.75;
    indoorLight.intensity = 0.9 + dk * 1.1; indoorLight.position.set(px, 2.7, pz);
    renderer.toneMappingExposure = 1.05;
  } else if (!sky.visible){
    sky.visible = true; scene.background = null; scene.fog.near = 90; scene.fog.far = 300; indoorLight.intensity = 0;
  }
}
function updateOcclusion(px, pz){
  const c = camera.position;
  OCC.forEach(o => {
    let hit = false;
    for (let i = 0; i <= 16 && !hit; i++){
      const t = i / 17, x = c.x + (px - c.x) * t, y = c.y + (1.5 - c.y) * t, z = c.z + (pz - c.z) * t;
      const m = i === 0 ? 1.5 : 0.4;
      if (x > o.x0 - m && x < o.x1 + m && z > o.z0 - m && z < o.z1 + m && y < o.top + 0.5) hit = true;
    }
    if (hit !== o.faded){
      o.faded = hit;
      o.mats.forEach(m => { m.transparent = hit; m.opacity = hit ? 0.18 : 1; m.depthWrite = !hit; m.needsUpdate = true; });
      o.grp.traverse(m => { if (m.isMesh && GFX === 'high') m.castShadow = !hit; });
    }
  });
}
const dummy = new THREE.Object3D();
function render(dt, now){
  const tileC = Math.floor(player.x / T), tileR = Math.floor(player.y / T);
  const targetY = inside ? 0 : isSidewalk(tileC, tileR) ? 0.14 : 0;
  player.y3 = lerp(player.y3, targetY, 1 - Math.exp(-dt * 20));
  const px = player.x * S, pz = player.y * S;
  playerRoot.position.set(px, player.y3, pz);
  playerRoot.rotation.y = player.face;
  bike.visible = state.riding;
  if (player.pose === 'lie'){ playerP.g.rotation.x = -Math.PI / 2; playerP.g.position.set(0, player.poseY || 0.5, 0); }
  else { playerP.g.rotation.x = 0; playerP.g.position.set(0, state.riding ? -0.05 : (player.poseY && player.pose === 'sit' ? player.poseY : 0), state.riding ? -0.28 : 0); }
  animPerson(playerP, player.moving, player.anim, state.riding, player.spd, player.pose === 'sit' ? 'sit' : null);

  npcs.forEach(n => {
    const nc = Math.floor(n.x / T), nr = Math.floor(n.y / T);
    n.p.g.position.set(n.x * S, isSidewalk(nc, nr) ? 0.14 : 0, n.y * S);
    n.p.g.rotation.y = n.face;
    animPerson(n.p, n.moving, n.ph, false, 0.6);
    n.label.visible = Math.hypot(player.x - n.x, player.y - n.y) < 90;
  });
  cars.forEach(c => { const [x, y] = carXY(c); c.mesh.position.set(x * S, 0, y * S); });

  if (target){
    const tx = target.type === 's' ? target.s.x / S : target.type === 'b' ? target.b.frontX : target.n.x, ty = target.type === 's' ? target.s.z / S : target.type === 'b' ? target.b.frontY : target.n.y;
    marker.visible = !sceneBusy;
    marker.position.set(tx * S, (target.type === 's' ? 2.45 : 2.6) + Math.sin(now / 200) * 0.15, ty * S);
    marker.rotation.y += dt * 2;
  } else marker.visible = false;

  // navigation visuals
  const tb = inside ? null : B[navTargetId()];
  if (tb){ beacon.visible = true; beacon.position.set(tb.frontX * S, 0, tb.frontY * S); beacon.children[1].scale.setScalar(1 + Math.sin(now / 300) * 0.15); }
  else beacon.visible = false;
  let n = 0;
  for (let i = 1; i < PATH.length && n < 398; i++){
    const a = PATH[i - 1], b = PATH[i];
    for (let k = 0; k < 2 && n < 398; k++){
      const t = k / 2, x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t);
      if (Math.hypot(x - player.x, y - player.y) < (inside ? 6 : 16)) continue;
      const pulse = 1 + 0.25 * Math.sin(now / 180 - n * 0.5);
      dummy.position.set(x * S, inside ? 0.03 : isSidewalk(Math.floor(x / T), Math.floor(y / T)) ? 0.16 : 0.05, y * S); dummy.scale.setScalar(pulse); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
      crumbs.setMatrixAt(n++, dummy.matrix);
    }
  }
  crumbs.count = n; crumbs.instanceMatrix.needsUpdate = true;

  // camera
  const cDist = inside ? Math.min(camS.dist, 11) : camS.dist, cPitch = inside ? Math.max(camS.pitch, 0.5) : camS.pitch;
  const hor = cDist * Math.cos(cPitch);
  const look = new THREE.Vector3(px, player.y3 + (player.pose === 'lie' ? 0.7 : player.pose === 'sit' ? 1.1 : 1.55), pz);
  const want = new THREE.Vector3(px + Math.sin(camS.yaw) * hor, look.y + cDist * Math.sin(cPitch), pz + Math.cos(camS.yaw) * hor);
  want.y = Math.max(want.y, 0.35);
  camera.position.lerp(want, 1 - Math.exp(-dt * 10));
  camera.lookAt(look);
  sky.position.copy(camera.position);
  if (inside) intRender(dt, now); else updateOcclusion(px, pz);
  updateLighting(px, pz);
  LABELS.forEach(l => { const d = Math.hypot(l.position.x - px, l.position.z - pz); l.visible = d < 110; });
  renderer.render(scene, camera);
  updateSpeech();
  if (inside) drawMiniInterior(); else drawMini();
}
function drawMini(){
  const mini = $('mini'), m = mini.getContext('2d'), W = mini.width, H = mini.height, sx = W / WW, sy = H / WH;
  m.fillStyle = '#3d7a33'; m.fillRect(0, 0, W, H);
  m.fillStyle = '#56585c';
  ROAD_ROWS.forEach(R => m.fillRect(0, R * T * sy, W, 2 * T * sy));
  ROAD_COLS.forEach(C => m.fillRect(C * T * sx, 0, 2 * T * sx, H));
  DECOR.forEach(b => { m.fillStyle = '#8a7a6a'; m.fillRect(b.x * T * sx, b.y * T * sy, b.w * T * sx, b.h * T * sy); });
  const tid = navTargetId();
  BUILDINGS.forEach(b => { m.fillStyle = b.id === tid ? '#ffd23f' : b.roof; m.fillRect(b.x * T * sx, b.y * T * sy, b.w * T * sx, b.h * T * sy); });
  if (PATH.length > 1){ m.strokeStyle = '#ffd23f'; m.lineWidth = 3; m.beginPath(); PATH.forEach((p, i) => i ? m.lineTo(p.x * sx, p.y * sy) : m.moveTo(p.x * sx, p.y * sy)); m.stroke(); }
  npcs.forEach(n => { m.fillStyle = n.police ? '#4d7cff' : '#f0f0f0'; m.fillRect(n.x * sx - 2, n.y * sy - 2, 4, 4); });
  const mx = player.x * sx, my = player.y * sy;
  m.save(); m.translate(mx, my); m.rotate(-camS.yaw);
  m.fillStyle = 'rgba(255,255,255,.25)'; m.beginPath(); m.moveTo(0, 0); m.arc(0, 0, 26, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); m.closePath(); m.fill();
  m.restore();
  m.fillStyle = '#fff'; m.beginPath(); m.arc(mx, my, 6, 0, Math.PI * 2); m.fill();
  m.fillStyle = '#0b8a4a'; m.beginPath(); m.arc(mx, my, 4, 0, Math.PI * 2); m.fill();
}

