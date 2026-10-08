'use strict';
/* =========================================================
   VEHICLES (V6.2): buy a car at Oga Motors, get in, drive it
   with a real controller (chase or cockpit view), refuel at
   the filling station, crash, repair, park anywhere.
   Units: car position in map px (like the player), meshes in metres.
   ========================================================= */
const CAR_MODELS = {
  corolla:{name:'Toyota Corolla 2010', tag:'Tokunbo sedan · fabric seats', price:9500000, color:'#b8322a', body:'sedan', len:4.5, wid:1.76, ht:1.46, max:200, accel:80, tank:50, lpk:0.55, seat:'#cbb894', seatHi:'#a8956f', dash:'#2a2a2a', trim:'#3c3c3c', screen:false, ambient:null, wheelR:0.31, rim:'#9ea4a8'},
  accord:{name:'Honda Accord 2015', tag:'Executive sedan · leather, wood trim, screen', price:16000000, color:'#20262e', body:'sedan', len:4.85, wid:1.85, ht:1.47, max:235, accel:100, tank:65, lpk:0.6, seat:'#8d8882', seatHi:'#6f6b66', dash:'#1b1b1b', trim:'#6b4426', screen:true, ambient:null, wheelR:0.33, rim:'#c8ccd0'},
  lexus:{name:'Lexus RX 350 2018', tag:'Luxury SUV · black leather, ambient light', price:32000000, color:'#ececec', body:'suv', len:4.9, wid:1.9, ht:1.72, max:255, accel:115, tank:72, lpk:0.75, seat:'#231916', seatHi:'#4a2e22', dash:'#121212', trim:'#8f9296', screen:true, ambient:'#3d7bff', wheelR:0.37, rim:'#d9dde0'}
};
let driving = false;
const drv = {mesh:null, built:null, v:0, steer:0, cam:'chase', hitCD:0, pedCD:0};
const fuelPrice = () => Math.round(1150 * (state.cpi || 1) * fuelMod() / 10) * 10;
const carValue = () => { const C = state.car; if (!C) return 0; return Math.round(CAR_MODELS[C.model].price * 0.6 * (1 - Math.min(90, C.dmg) / 200) / 10000) * 10000; };

/* ---------- 3D car with a real interior ---------- */
function taperBox(w, h, l, topScale, shiftZ){
  const g = new THREE.BoxGeometry(w, h, l), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0){ p.setZ(i, p.getZ(i) * topScale + shiftZ); p.setX(i, p.getX(i) * 0.94); }
  g.computeVertexNormals(); return g;
}
function buildDriveCar(id){
  const M = CAR_MODELS[id], g = new THREE.Group(), L = M.len, W = M.wid, H = M.ht;
  const add = (geo, mat, x, y, z, rx, ry, rz, shadow) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); if (shadow !== false && GFX === 'high'){ m.castShadow = true; m.receiveShadow = true; } g.add(m); return m; };
  const paint = new THREE.MeshStandardMaterial({color:LIN(M.color), metalness:0.6, roughness:0.28});
  const black = STD('#121212', {roughness:0.7}), chrome = STD('#c8ccd0', {metalness:0.9, roughness:0.2});
  const glass = new THREE.MeshStandardMaterial({color:LIN('#2c4458'), metalness:0.3, roughness:0.05, transparent:true, opacity:0.42, side:THREE.DoubleSide, depthWrite:false});
  const suv = M.body === 'suv', clr = suv ? 0.3 : 0.2, belt = clr + (suv ? 0.72 : 0.6);
  const zF = L * (suv ? 0.2 : 0.16), zR = -L * (suv ? 0.47 : 0.33), cabL = zF - zR, cabC = (zF + zR) / 2;
  // lower body, bumpers, bonnet line
  add(new THREE.BoxGeometry(W, belt - clr, L), paint, 0, (belt + clr) / 2, 0);
  add(new THREE.BoxGeometry(W * 1.01, 0.16, 0.12), black, 0, clr + 0.12, L / 2 + 0.01);
  add(new THREE.BoxGeometry(W * 1.01, 0.16, 0.12), black, 0, clr + 0.12, -L / 2 - 0.01);
  add(new THREE.BoxGeometry(W * 0.5, 0.12, 0.03), chrome, 0, belt - 0.18, L / 2 + 0.02);
  // cabin: tinted glass shell (you can see inside) + roof
  add(taperBox(W * 0.98, H - belt, cabL, suv ? 0.9 : 0.72, suv ? -0.05 : -0.1), glass, 0, belt + (H - belt) / 2, cabC, 0, 0, 0, false);
  add(new THREE.BoxGeometry(W * 0.92, 0.06, cabL * (suv ? 0.9 : 0.72)), paint, 0, H + 0.02, cabC + (suv ? -0.05 : -0.1));
  [[1, zF - 0.05], [-1, zF - 0.05], [1, zR + 0.05], [-1, zR + 0.05]].forEach(([sx, z]) => add(new THREE.BoxGeometry(0.035, H - belt, 0.05), paint, sx * W * 0.46, belt + (H - belt) / 2, z + (z > 0 ? -(cabL * (suv ? 0.05 : 0.14)) * 0.5 : 0)));
  // lights
  const head = new THREE.MeshStandardMaterial({color:LIN('#fffbe8'), emissive:new THREE.Color(0xfff2c0), emissiveIntensity:0.3});
  const tail = new THREE.MeshStandardMaterial({color:LIN('#7a0d0d'), emissive:new THREE.Color(0xff2020), emissiveIntensity:0.4});
  [-1, 1].forEach(s => { add(new THREE.BoxGeometry(0.34, 0.12, 0.04), head, s * W * 0.34, belt - 0.12, L / 2 + 0.01); add(new THREE.BoxGeometry(0.3, 0.12, 0.04), tail, s * W * 0.36, belt - 0.12, -L / 2 - 0.01); });
  // wheels
  const wheels = [];
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
    const wg = new THREE.Group(); wg.position.set(sx * (W / 2 - 0.1), M.wheelR, sz * (L / 2 - (suv ? 0.85 : 0.8))); g.add(wg);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(M.wheelR, M.wheelR, 0.22, 20), black); t.rotation.z = Math.PI / 2; wg.add(t);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(M.wheelR * 0.6, M.wheelR * 0.6, 0.23, 10), STD(M.rim, {metalness:0.85, roughness:0.25})); r.rotation.z = Math.PI / 2; wg.add(r);
    wheels.push(wg);
  });
  // ---- interior ----
  const seatM = STD(M.seat, {roughness:0.8}), seatH = STD(M.seatHi, {roughness:0.8}), dashM = STD(M.dash, {roughness:0.6}), trimM = STD(M.trim, {roughness:0.4, metalness:M.trim === '#8f9296' ? 0.7 : 0.1});
  add(new THREE.BoxGeometry(W * 0.92, 0.04, cabL), STD('#1c1c1c', {roughness:1}), 0, belt - 0.32, cabC, 0, 0, 0, false);
  const seatZ = zF - (suv ? 1.05 : 0.95), seatTop = belt - 0.12, dX = W * 0.22;
  [dX, -dX].forEach(x => {
    add(new THREE.BoxGeometry(0.5, 0.14, 0.5), seatM, x, seatTop - 0.07, seatZ, 0, 0, 0, false);
    add(new THREE.BoxGeometry(0.5, 0.62, 0.11), seatM, x, seatTop + 0.3, seatZ - 0.27, -0.12, 0, 0, false);
    add(new THREE.BoxGeometry(0.26, 0.17, 0.09), seatH, x, seatTop + 0.7, seatZ - 0.31, -0.12, 0, 0, false);
  });
  add(new THREE.BoxGeometry(W * 0.84, 0.14, 0.5), seatM, 0, seatTop - 0.07, seatZ - (suv ? 1.05 : 0.95), 0, 0, 0, false);
  add(new THREE.BoxGeometry(W * 0.84, 0.55, 0.11), seatM, 0, seatTop + 0.27, seatZ - (suv ? 1.32 : 1.22), -0.1, 0, 0, false);
  add(new THREE.BoxGeometry(0.2, 0.18, 0.5), dashM, 0, seatTop + 0.02, seatZ + 0.05, 0, 0, 0, false); // centre console
  const seatZ0 = zF - (suv ? 1.05 : 0.95), dz = seatZ0 + 0.85; // dashboard face sits ~0.8 m in front of the driver
  add(new THREE.BoxGeometry(W * 0.92, 0.26, 0.5), dashM, 0, belt + 0.09, dz + 0.22, 0, 0, 0, false); // dashboard
  add(new THREE.BoxGeometry(W * 0.88, 0.035, 0.02), trimM, 0, belt + 0.07, dz - 0.035, 0, 0, 0, false);
  add(new THREE.BoxGeometry(0.4, 0.14, 0.12), dashM, dX, belt + 0.27, dz + 0.02, 0, 0, 0, false); // gauge hood
  add(new THREE.BoxGeometry(0.34, 0.11, 0.01), STD('#050505'), dX, belt + 0.27, dz - 0.045, 0, 0, 0, false);
  [-0.085, 0.085].forEach(o => add(new THREE.CircleGeometry(0.046, 20), new THREE.MeshBasicMaterial({color:0xdcefff}), dX + o, belt + 0.27, dz - 0.051, 0, Math.PI, 0, false));
  [-0.085, 0.085].forEach(o => add(new THREE.BoxGeometry(0.006, 0.04, 0.002), new THREE.MeshBasicMaterial({color:0xff3b30}), dX + o, belt + 0.285, dz - 0.054, 0, 0, o > 0 ? 0.6 : -0.4, false));
  if (M.screen) add(new THREE.PlaneGeometry(0.28, 0.17), new THREE.MeshBasicMaterial({color:0x2c7be5}), 0, belt + 0.27, dz - 0.04, -0.15, Math.PI, 0, false);
  else add(new THREE.BoxGeometry(0.2, 0.06, 0.01), STD('#0a0a0a'), 0, belt + 0.17, dz - 0.04, 0, 0, 0, false); // old radio
  if (M.ambient) add(new THREE.BoxGeometry(W * 0.84, 0.01, 0.01), new THREE.MeshBasicMaterial({color:new THREE.Color(M.ambient)}), 0, belt + 0.03, dz - 0.04, 0, 0, 0, false);
  const wheelG = new THREE.Group(); wheelG.position.set(dX, belt + 0.21, seatZ0 + 0.52); wheelG.rotation.x = -0.5; g.add(wheelG);
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 8, 24), STD('#151515', {roughness:0.5})); sw.rotation.y = Math.PI; wheelG.add(sw);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), trimM); hub.rotation.x = Math.PI / 2; wheelG.add(hub);
  [0, 2.1, 4.2].forEach(a => { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), STD('#151515')); sp.position.set(Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0); sp.rotation.z = a; wheelG.add(sp); });
  add(new THREE.BoxGeometry(0.03, 0.12, 0.03), chrome, 0, seatTop + 0.16, seatZ + 0.22, 0, 0, 0, false); // gear lever
  // driver
  const look = outfit(state.gender, seeded(state.name || 'me'), 0.9); look.top = '#0b8a4a';
  const driver = makePerson(look); scene.remove(driver.g); driver.g.position.set(dX, seatTop - 0.5, seatZ); g.add(driver.g);
  // headlight beam (night)
  const beam = new THREE.SpotLight(0xfff2d0, 0, 26, 0.5, 0.5, 1.2); beam.position.set(0, belt, L / 2); const bt = new THREE.Object3D(); bt.position.set(0, 0, L / 2 + 10); g.add(bt); beam.target = bt; g.add(beam);
  scene.add(g);
  return {g, M, wheels, wheelG, driver, beam, head, belt, seatZ, dX, seatTop};
}
function carMesh(){
  if (!state.car) return null;
  if (!drv.built || drv.built.id !== state.car.model){
    if (drv.built) scene.remove(drv.built.g);
    drv.built = buildDriveCar(state.car.model); drv.built.id = state.car.model;
  }
  return drv.built;
}

/* ---------- getting in and out ---------- */
function enterCar(){
  const C = state.car; if (!C || inside) return;
  carMesh();
  driving = true; drv.v = 0; drv.steer = 0; state.riding = false;
  player.x = C.x; player.y = C.y; player.face = C.h;
  camS.yaw = C.h + Math.PI; camS.dist = Math.max(camS.dist, 9.5); camS.pitch = 0.3; camS.lastDrag = -99;
  $('carHud').classList.add('show'); document.body.classList.add('driving');
  sfx('ding'); toast(isTouch ? '🚗 Push the stick up to drive, down to brake. 🎥 switches to the inside view.' : '🚗 W/S: gas and brake · A/D: steer · Space: handbrake · C: inside view · H: horn · E: get out', 'info');
}
function exitCar(force){
  if (!driving) return;
  if (!force && Math.abs(drv.v) > 15){ toast('Stop the car before you get out.', 'bad'); return; }
  const C = state.car; driving = false; drv.v = 0;
  const off = (CAR_MODELS[C.model].wid / 2) / S + 12;
  const tries = [[Math.cos(C.h), -Math.sin(C.h)], [-Math.cos(C.h), Math.sin(C.h)], [-Math.sin(C.h) * 3, -Math.cos(C.h) * 3]];
  let done = false;
  for (const [dx, dy] of tries){ const x = C.x + dx * off, y = C.y + dy * off; if (free(x, y)){ player.x = x; player.y = y; done = true; break; } }
  if (!done){ player.x = C.x; player.y = C.y; }
  player.face = C.h;
  $('carHud').classList.remove('show'); document.body.classList.remove('driving');
  camS.dist = 9.5; camS.pitch = 0.32;
  if (isRoad(Math.floor(C.x / T), Math.floor(C.y / T))) toast('⚠️ You parked on the road and traffic is stuck behind you. Move it soon or LASTMA will tow it.', 'bad');
  saveGame(true);
}
function carHit(c){
  if (drv.hitCD > 0) return; drv.hitCD = 1.5;
  const rel = Math.abs(drv.v) + c.v;
  c.v = 0; drv.v *= -0.3; sfx('crash'); flashScreen();
  state.car.dmg = clamp(state.car.dmg + Math.round(rel * 0.12), 0, 100);
  if (rel > 140){ state.health = clamp(state.health - Math.round(rel / 12), 5, 100); }
  toast(`💥 You crashed into a ${c.type === 'danfo' ? 'danfo' : 'car'}! Car damage ${state.car.dmg}%.`, 'bad');
  if (state.car.dmg >= 100) wreck();
}
function wreck(){
  exitCar(true); state.car.wrecked = true;
  addHistory('Wrecked your car in a crash', '💥');
  result('Your car is wrecked 💥', `<p>The car can no longer move. Pay a mechanic at <b>Oga Motors</b> to fix it (or sell it as scrap).</p>`);
}

/* ---------- the controller ---------- */
function driveUpdate(dt, mx, my){
  const C = state.car, M = CAR_MODELS[C.model];
  drv.hitCD -= dt; drv.pedCD -= dt;
  const thr = clamp(-my, -1, 1), st = clamp(mx, -1, 1);
  const maxV = M.max * (C.dmg > 60 ? 0.65 : 1) * (state.energy < 10 ? 0.8 : 1), hasFuel = C.fuel > 0 && !C.wrecked;
  if (thr > 0.05){
    if (drv.v < -3) drv.v = Math.min(0, drv.v + 300 * thr * dt);
    else if (hasFuel) drv.v = Math.min(maxV, drv.v + M.accel * thr * (1 - Math.max(0, drv.v) / maxV * 0.6) * dt);
  } else if (thr < -0.05){
    if (drv.v > 3) drv.v = Math.max(0, drv.v - 320 * -thr * dt);
    else if (hasFuel) drv.v = Math.max(-55, drv.v + 60 * thr * dt);
  } else { drv.v *= Math.exp(-dt * 0.7); if (Math.abs(drv.v) < 2) drv.v = 0; }
  if (keys.has(' ')) drv.v *= Math.exp(-dt * 3.5);
  if (!hasFuel && C.fuel <= 0 && Math.abs(drv.v) < 1 && !drv.fuelWarned){ drv.fuelWarned = true; toast('⛽ Out of fuel! Walk to the NNPC Filling Station, buy fuel there, and it goes into your tank.', 'bad'); }
  drv.steer = lerp(drv.steer, st, 1 - Math.exp(-dt * 8));
  const wb = (M.len * 0.62) / S, ang = drv.steer * 0.6 * (1 - Math.min(0.55, Math.abs(drv.v) / maxV * 0.55));
  C.h -= drv.v / wb * Math.tan(ang) * dt;
  const sx = Math.sin(C.h), sy = Math.cos(C.h), step = drv.v * dt;
  const nx = C.x + sx * step, ny = C.y + sy * step, half = (M.len / 2) / S * 0.85, r = (M.wid / 2) / S * 0.85;
  const ok = [-1, 0, 1].every(k => free(nx + sx * half * k, ny + sy * half * k, r));
  if (ok){ C.x = nx; C.y = ny; C.km = (C.km || 0) + Math.abs(step) * S / 1000; C.fuel = Math.max(0, C.fuel - Math.abs(step) * S / 1000 * M.lpk * 6); }
  else if (Math.abs(drv.v) > 8){
    if (Math.abs(drv.v) > 60 && drv.hitCD <= 0){ drv.hitCD = 1; C.dmg = clamp(C.dmg + Math.round(Math.abs(drv.v) * 0.07), 0, 100); sfx('crash'); toast(`💥 You hit a wall! Car damage ${C.dmg}%.`, 'bad'); if (C.dmg >= 100){ wreck(); return; } }
    drv.v *= -0.25;
  } else drv.v = 0;
  // pedestrians
  if (Math.abs(drv.v) > 30 && drv.pedCD <= 0){
    const fx = C.x + sx * half, fy = C.y + sy * half;
    const n = npcs.find(p => !p.police && Math.hypot(p.x - fx, p.y - fy) < r + 8);
    if (n){ drv.pedCD = 6; n.wait = 8; drv.v *= 0.2; sfx('crash'); queueNow({id:'hitPed', ctx:{who:n.id || null, name:n.name}}); }
  }
  // camera: chase view swings behind the car unless you are looking around
  if (performance.now() - camS.lastDrag > 1800) camS.yaw = turnTo(camS.yaw, C.h + Math.PI, 1 - Math.exp(-dt * (drv.cam === 'cockpit' ? 6 : 2.5)));
  player.x = C.x; player.y = C.y; player.face = C.h; player.moving = false;
  hudCar();
}
function hudCar(){
  const C = state.car, M = CAR_MODELS[C.model];
  $('cSpd').textContent = Math.round(Math.abs(drv.v) * S * 3.6 * 1.6);
  $('cFuel').style.width = Math.max(0, C.fuel / M.tank * 100) + '%';
  $('cFuel').style.background = C.fuel / M.tank < 0.15 ? '#ff5a5a' : '#2fbf71';
  $('cDmg').textContent = C.dmg ? `🔧 ${C.dmg}%` : '';
}

/* ---------- per-frame visuals ---------- */
function carFrame(dt){
  const b = state.car && !inside ? carMesh() : null;
  if (drv.built) drv.built.g.visible = !!b;
  if (!b) return;
  const C = state.car;
  b.g.position.set(C.x * S, isSidewalk(Math.floor(C.x / T), Math.floor(C.y / T)) ? 0.14 : 0, C.y * S);
  b.g.rotation.y = C.h;
  const spin = drv.v * S / b.M.wheelR * dt * (driving ? 1 : 0);
  b.wheels.forEach((w, i) => { w.children.forEach(c => c.rotation.x += spin); if (i < 2) w.rotation.y = driving ? drv.steer * 0.5 : 0; });
  b.wheelG.rotation.z = driving ? -drv.steer * 1.6 : 0;
  b.driver.g.visible = driving && drv.cam !== 'cockpit';
  if (driving) animPerson(b.driver, false, 0, false, 0, 'sit');
  const night = hour() >= 19 || hour() < 6;
  b.beam.intensity = driving && night ? 2.2 : 0; b.head.emissiveIntensity = driving && night ? 2 : 0.3;
  if (typeof playerRoot !== 'undefined' && playerRoot) playerRoot.visible = !driving;
}
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();
function driveCamera(){
  const want = driving && drv.cam === 'cockpit' ? 0.04 : 0.25;
  if (camera.near !== want){ camera.near = want; camera.updateProjectionMatrix(); }
  if (!driving || drv.cam !== 'cockpit' || !drv.built) return;
  const b = drv.built, C = state.car;
  const off = clamp(turnTo(0, camS.yaw - (C.h + Math.PI), 1), -1.3, 1.3);
  const eyeY = b.seatTop + 0.62;
  _v1.set(b.dX, eyeY, b.seatZ + 0.05); b.g.localToWorld(_v1);
  _v2.set(b.dX + Math.sin(-off) * 10, eyeY - 1.25 - (0.32 - camS.pitch) * 3, b.seatZ + Math.cos(off) * 10); b.g.localToWorld(_v2);
  camera.position.copy(_v1); camera.lookAt(_v2);
}

/* ---------- events, panels, purchase ---------- */
[
  {id:'hitPed', w:0, cool:0, ignore:0,
    title:() => 'You hit someone! 🚑',
    body:c => `Your car knocked down ${c.name || 'a pedestrian'}. A crowd is gathering and someone is calling the police.`,
    options:c => [
      opt('Rush them to the hospital 🏥', `${fmt(price(80000))} bills · the right thing`, () => { payBill(price(80000)); advanceTime(120); gain('rep', 2); if (c.who && NPC[c.who]) bond(c.who, 5); return 'You took them to General Hospital and paid the bills. They will be fine. The police let you go.'; }, null, 'cur'),
      opt('Settle the crowd and leave 💵', fmt(price(40000)), () => { if (!spendAny(price(40000))) return false; gain('rep', -6); state.heat = clamp(state.heat + 10, 0, 100); return 'You paid them off and drove away. People recorded your plate number.'; }),
      opt('Drive away 🏃🏾', 'Hit and run', () => { gain('rep', -15); state.heat = clamp(state.heat + 35, 0, 100); if (Math.random() < 0.45){ arrest('Hit and run: you knocked someone down and drove off.'); return false; } return 'You fled the scene. Police are looking for your car.'; }, null, 'danger')
    ]},
  {id:'towed', w:0, cool:0, ignore:0,
    title:() => 'LASTMA towed your car 🚛',
    body:() => `You left your car on the road. LASTMA towed it to their yard. Release fee: ${fmt(price(50000))}.`,
    options:() => [opt('Pay the release fee', fmt(price(50000)), () => { payBill(price(50000)); const b = B.motors; state.car.x = b.frontX + 50; state.car.y = b.frontY; state.car.h = Math.PI / 2; return 'Your car is waiting for you outside Oga Motors.'; })]}
].forEach(e => { EVENTS.push(e); EVENT[e.id] = e; });
function vehiclesDaily(){
  const C = state.car; if (!C || driving) return;
  if (isRoad(Math.floor(C.x / T), Math.floor(C.y / T)) && Math.random() < 0.6) queueNow({id:'towed'});
}
function buyCar(id){
  const M = CAR_MODELS[id], trade = carValue(), cost = M.price - trade;
  if (!spendAny(cost)) return;
  if (state.car) addHistory(`Traded in your ${CAR_MODELS[state.car.model].name}`, '🔁');
  const b = B.motors;
  state.car = {model:id, x:b.frontX + 55, y:b.frontY, h:Math.PI / 2, fuel:M.tank * 0.5, dmg:0, km:0};
  drv.built && scene.remove(drv.built.g); drv.built = null;
  addHistory(`Bought a ${M.name}`, '🚗'); gain('rep', id === 'lexus' ? 8 : id === 'accord' ? 5 : 3); gain('happy', 12);
  familyCheer(`Dad: "A ${M.name}?! My child has arrived!" 🚗`);
  result('Your new car! 🚗', `<p>Your <b>${M.name}</b> is parked outside Oga Motors with half a tank.</p><p>Walk up to it and press <b>${isTouch ? 'the button' : 'E'}</b> to get in. ${isTouch ? 'Use the stick to drive and 🎥 for the inside view.' : 'W/S gas and brake, A/D steer, C for the inside view, H horn.'}</p>`);
  return false;
}
const _motorsP = PANELS.motors;
PANELS.motors = () => {
  const r = _motorsP(), C = state.car;
  r.options = r.options.filter(o => !/Corolla|Cars arrive/.test(o.label + (o.why || '')));
  Object.keys(CAR_MODELS).forEach(id => { const M = CAR_MODELS[id]; const trade = C ? carValue() : 0; r.options.push(opt(`${M.name} 🚗`, `${fmt(M.price)}${trade ? ` · minus ${fmt(trade)} trade-in = ${fmt(M.price - trade)}` : ''} · ${M.tag}`, () => buyCar(id), C && C.model === id ? 'You already own this model.' : null, C ? '' : 'cur')); });
  if (C){
    const rep = Math.round(C.dmg * CAR_MODELS[C.model].price * 0.0012 / 1000) * 1000;
    r.options.unshift(opt('Repair your car 🔧', C.dmg ? `${fmt(rep)} · damage ${C.dmg}%` : 'No damage', () => { if (!spendAny(rep)) return; C.dmg = 0; C.wrecked = false; toast('Your car is as good as new! 🔧', 'good'); }, C.dmg ? null : 'Your car has no damage.', C.dmg ? 'cur' : ''));
    r.options.push(opt('Sell your car 💰', fmt(carValue()), () => { if (!confirm('Sell your car?')) return; state.bank += carValue(); addHistory(`Sold your ${CAR_MODELS[C.model].name}`, '💰'); state.car = null; if (drv.built){ scene.remove(drv.built.g); drv.built = null; } toast('Car sold. Money paid into your bank.', 'good'); }, null, 'danger'));
    r.body = `<div class="kv"><b>Your car</b><span>${CAR_MODELS[C.model].name} · ${Math.round(C.km || 0)} km · fuel ${Math.round(C.fuel)}/${CAR_MODELS[C.model].tank} L · damage ${C.dmg}%</span></div>` + r.body;
  }
  return r;
};
PANELS.fuel = () => {
  const C = state.car, fp = fuelPrice();
  const opts = [];
  if (C){
    const M = CAR_MODELS[C.model], room = Math.max(0, M.tank - C.fuel);
    [10, 25].forEach(l => opts.push(opt(`Buy ${l} litres ⛽`, fmt(l * fp), () => { const L = Math.min(l, room); if (!spendAny(Math.round(L * fp))) return; C.fuel += L; drv.fuelWarned = false; toast(`Filled ${Math.round(L)} L.`, 'good'); }, room < 1 ? 'Your tank is full.' : null)));
    opts.push(opt('Fill the tank ⛽', `${fmt(Math.round(room * fp))} · ${Math.round(room)} L`, () => { if (!spendAny(Math.round(room * fp))) return; C.fuel = M.tank; drv.fuelWarned = false; toast('Tank full! ⛽', 'good'); }, room < 1 ? 'Your tank is full.' : null, 'cur'));
  }
  opts.push(opt('Buy a jerrycan of fuel (generator) 🛢️', fmt(20 * fp), () => { if (!spendAny(20 * fp)) return; state.genFuel = (state.genFuel || 0) + 20; toast('20 L for your generator.', 'good'); }));
  opts.push(opt('Buy a drink and snacks 🥤', fmt(price(1500)), () => { if (!spend(price(1500))) return; gain('hunger', 10); gain('energy', 3); }));
  return {title:'NNPC Filling Station ⛽', sub:`Petrol today: ${fmt(fp)} per litre${state.day < (state.fuelShockUntil || 0) ? ' · ⚠️ fuel scarcity, prices are up' : ''}`,
    body:C ? `<div class="kv"><b>Your tank</b><span>${Math.round(C.fuel)} / ${CAR_MODELS[C.model].tank} L</span></div>` : '<p>You do not have a car yet. Buy one at Oga Motors.</p>', options:opts};
};

/* ---------- controls ---------- */
window.addEventListener('keydown', e => {
  if (!driving || panelState || phoneOpen) return;
  const k = e.key.toLowerCase();
  if (k === 'c') toggleCarCam();
  if (k === 'h') sfx('horn');
});
function toggleCarCam(){ drv.cam = drv.cam === 'chase' ? 'cockpit' : 'chase'; camS.lastDrag = -99; if (drv.cam === 'chase'){ camS.pitch = 0.3; camS.dist = Math.max(camS.dist, 9.5); } else camS.pitch = 0.32; }
$('cCam').addEventListener('click', toggleCarCam);
$('cHorn').addEventListener('click', () => sfx('horn'));
$('cExit').addEventListener('click', () => exitCar());
