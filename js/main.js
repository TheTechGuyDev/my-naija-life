'use strict';
/* =========================================================
   INPUT
   ========================================================= */
const keys = new Set();
window.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (phoneOpen){ if (e.key === 'Escape') phBack(); return; }
  if (camMode && e.key === 'Escape'){ exitCamera(true); return; }
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  if (!state) return;
  if (k === 'escape'){ if (panelState) closePanel(); else openPanel('menu'); return; }
  if (panelState) return;
  if (k === 'e' || k === 'enter' || k === ' ') { interact(); return; }
  if (k === 'm') { openPanel('menu'); return; }
  if (k === 'i') { openPanel('inventory'); return; }
  if (k === 'g') { openPanel('guide'); return; }
  if (k === 'n') { openPanel('directory'); return; }
  if (k === 'p') { openPhone(); return; }
  keys.add(k);
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
document.addEventListener('contextmenu', e => e.preventDefault());

const joy = {id:null, ox:0, oy:0, dx:0, dy:0, active:false};
const camPtrs = new Map(); let pinchD = 0;
const joyEl = $('joy'), knob = $('knob'), ghost = $('joyGhost'), camGhost = $('camGhost');
function resetJoy(){ joy.id = null; joy.active = false; joy.dx = joy.dy = 0; joyEl.style.display = 'none'; knob.style.transform = ''; camPtrs.clear(); if (isTouch && state){ ghost.style.display = 'flex'; } }
canvas.addEventListener('pointerdown', e => {
  if (paused) return;
  if (e.pointerType !== 'mouse' && e.clientX < vw * 0.42 && joy.id === null){
    joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.active = true; joy.dx = joy.dy = 0;
    joyEl.style.left = joy.ox + 'px'; joyEl.style.top = joy.oy + 'px'; joyEl.style.display = 'block'; ghost.style.display = 'none';
    return;
  }
  camPtrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (camPtrs.size === 2){ const [a, b] = [...camPtrs.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
  camGhost.style.display = 'none';
});
window.addEventListener('pointermove', e => {
  if (e.pointerId === joy.id){
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
    const d = Math.hypot(dx, dy), R = 50;
    if (d > R){ dx = dx / d * R; dy = dy / d * R; }
    joy.dx = dx / R; joy.dy = dy / R;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  } else if (camPtrs.has(e.pointerId)){
    const p = camPtrs.get(e.pointerId);
    if (camPtrs.size === 1){
      camS.yaw -= (e.clientX - p.x) * 0.0075;
      camS.pitch = clamp(camS.pitch + (e.clientY - p.y) * 0.005, 0.04, 1.42);
      camS.lastDrag = performance.now();
    }
    p.x = e.clientX; p.y = e.clientY;
    if (camPtrs.size === 2){ const [a, b] = [...camPtrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinchD) camS.dist = clamp(camS.dist * pinchD / d, 3.5, 45); pinchD = d; }
  }
});
['pointerup','pointercancel'].forEach(ev => window.addEventListener(ev, e => {
  if (e.pointerId === joy.id){ joy.id = null; joy.active = false; joy.dx = joy.dy = 0; joyEl.style.display = 'none'; knob.style.transform = ''; if (isTouch) ghost.style.display = 'flex'; }
  camPtrs.delete(e.pointerId); pinchD = 0;
}));
canvas.addEventListener('wheel', e => { e.preventDefault(); camS.dist = clamp(camS.dist * (1 + e.deltaY * 0.001), 3.5, 45); }, {passive:false});
$('zIn').addEventListener('click', () => camS.dist = clamp(camS.dist * 0.8, 3.5, 45));
$('zOut').addEventListener('click', () => camS.dist = clamp(camS.dist * 1.25, 3.5, 45));

const actBtn = $('actBtn'), hintEl = $('hint');
actBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); interact(); });

let target = null;
function findTarget(){
  let best = null, bd = Infinity;
  BUILDINGS.forEach(b => {
    const d = Math.hypot(player.x - b.frontX, player.y - b.frontY);
    if (d < T * 0.95 && d < bd){ bd = d; best = {type:'b', b}; }
  });
  npcs.forEach(n => {
    const d = Math.hypot(player.x - n.x, player.y - n.y);
    if (d < 28 && d < bd){ bd = d; best = {type:'n', n}; }
  });
  if (typeof GHOSTS !== 'undefined') GHOSTS.forEach(g => {
    if (g.away) return;
    const d = Math.hypot(player.x - g.x, player.y - g.y);
    if (d < 30 && d < bd){ bd = d; best = {type:'n', n:g}; }
  });
  return best;
}
function interact(){
  if (paused || !target || sceneBusy) return;
  if (target.type === 's'){ if (inside) inside.lastStation = target.s; target.s.act(target.s); return; }
  if (target.type === 'b'){ if (state.nav === target.b.id) state.nav = null; if (hasInterior(target.b.id)) enterBuilding(target.b.id); else openPanel(target.b.id); }
  else if (target.n.real) openPanel('realPlayer', target.n);
  else { target.n.wait = 6; openPanel('npc', target.n); }
}

const PHONE_PANELS = ['phone','notifs','chats','chat','family','people','person','profile','history'];
$('phoneBtn').addEventListener('click', () => { if (phoneOpen) closePhone(); else if (camMode) exitCamera(true); else if (panelState && PHONE_PANELS.includes(panelState.kind)) closePanel(); else if (!panelState && !sceneBusy) openPhone(); });

/* =========================================================
   TRAFFIC
   ========================================================= */
let tlClock = 0;
function lightState(axis){
  const t = tlClock % 24;
  if (axis === 'h') return t < 9.5 ? 'green' : t < 12 ? 'amber' : 'red';
  return t >= 12 && t < 21.5 ? 'green' : t >= 21.5 ? 'amber' : 'red';
}
function pedOnCross(cw){
  if (inRect(player.x, player.y, cw, 8)) return true;
  return npcs.some(n => inRect(n.x, n.y, cw, 6));
}
let hornCD = 0;
function updateCars(dt){
  const ls = {h:lightState('h'), v:lightState('v')};
  cars.forEach(c => {
    if (paused) return;
    const front = c.pos + c.dir * c.lenPx / 2;
    let desired = c.maxV;
    // car ahead in the same lane
    cars.forEach(o => {
      if (o === c || o.axis !== c.axis || o.lane !== c.lane) return;
      const gap = (o.pos - c.pos) * c.dir;
      if (gap > 0 && gap < 160){ const clear = gap - (c.lenPx + o.lenPx) / 2 - 14; desired = Math.min(desired, clear <= 0 ? 0 : Math.max(o.v, clear * 1.2)); }
    });
    // junctions: traffic lights + zebra crossings
    const crossLines = c.axis === 'h' ? ROAD_COLS.map(C => c.dir > 0 ? (C - 1) * T - 8 : (C + 3) * T + 8) : ROAD_ROWS.map(R => c.dir > 0 ? (R - 1) * T - 8 : (R + 3) * T + 8);
    crossLines.forEach((line, i) => {
      const dist = (line - front) * c.dir;
      if (dist < -4 || dist > 170) return;
      const st = ls[c.axis];
      let stop = st === 'red' || (st === 'amber' && dist > 40);
      const J = c.axis === 'h' ? ROAD_COLS[i] : ROAD_ROWS[i];
      const cw = CROSS.find(k => k.axis === c.axis && k.road === c.road && (c.axis === 'h' ? (c.dir > 0 ? k.x1 === J * T : k.x0 === (J + 2) * T) : (c.dir > 0 ? k.y1 === J * T : k.y0 === (J + 2) * T)));
      const cw2 = CROSS.find(k => k.axis === c.axis && k.road === c.road && (c.axis === 'h' ? (c.dir > 0 ? k.x0 === (J + 2) * T : k.x1 === J * T) : (c.dir > 0 ? k.y0 === (J + 2) * T : k.y1 === J * T)));
      if ((cw && pedOnCross(cw)) || (cw2 && pedOnCross(cw2))) stop = true;
      if (stop) desired = Math.min(desired, Math.max(0, (dist - 2) * 1.6));
    });
    // a person standing in the lane right ahead (drivers brake, but not instantly)
    const [cx, cy] = carXY(c);
    const lat = c.axis === 'h' ? Math.abs(player.y - cy) : Math.abs(player.x - cx);
    const ahead = ((c.axis === 'h' ? player.x : player.y) - c.pos) * c.dir;
    let pedBrake = false;
    if (lat < c.widPx / 2 + 10 && ahead > 0 && ahead < 80){ const want = Math.max(0, (ahead - c.lenPx / 2 - 10) * 1.2); if (want < desired){ desired = want; pedBrake = true; } }
    const acc = desired > c.v ? 60 : pedBrake ? 140 : 210;
    c.v = desired > c.v ? Math.min(desired, c.v + acc * dt) : Math.max(desired, c.v - acc * dt);
    c.pos += c.dir * c.v * dt;
    const lim = c.axis === 'h' ? WW : WH;
    if (c.pos > lim + 120) c.pos = -120; if (c.pos < -120) c.pos = lim + 120;
    // collision with player
    if (c.v > 22 && lat < c.widPx / 2 + 5 && Math.abs((c.axis === 'h' ? player.x : player.y) - c.pos) < c.lenPx / 2 + 5){ accident(c); }
    // horn when a pedestrian is jaywalking in front
    if (hornCD <= 0 && c.v > 30 && lat < c.widPx / 2 + 20 && ahead > 0 && ahead < 150 && isRoad(Math.floor(player.x / T), Math.floor(player.y / T)) && !onCross(player.x, player.y)){
      hornCD = 4; sfx('horn'); toast('🚗 Careful! Car coming. Cross at the zebra crossing!', 'bad');
    }
  });
}

/* =========================================================
   UPDATE
   ========================================================= */
let lastTarget = '', hungerWarn = 0, pathTimer = 0, PATH = [], pathTo = null, lastTile = -1, moveBasis = null, moveInAng = 0;
function update(dt){
  tlClock += dt;
  if (paused) return;
  hornCD -= dt;
  let mx = 0, my = 0;
  if (keys.has('arrowleft') || keys.has('a')) mx -= 1;
  if (keys.has('arrowright') || keys.has('d')) mx += 1;
  if (keys.has('arrowup') || keys.has('w')) my -= 1;
  if (keys.has('arrowdown') || keys.has('s')) my += 1;
  if (keys.has('q')) { camS.yaw += dt * 1.8; camS.lastDrag = performance.now(); }
  if (keys.has('r')) { camS.yaw -= dt * 1.8; camS.lastDrag = performance.now(); }
  if (keys.has('z')) camS.pitch = clamp(camS.pitch + dt, 0.04, 1.42);
  if (keys.has('x')) camS.pitch = clamp(camS.pitch - dt, 0.04, 1.42);
  if (joy.active){ mx += joy.dx; my += joy.dy; }
  const len = Math.hypot(mx, my);
  player.moving = false; player.spd = 0;
  if (len > 0.18){
    const n = len > 1 ? len : 1; mx /= n; my /= n;
    // Movement follows what you see: "up" always walks into the screen from the camera's current angle.
    // The basis is held while the input direction stays the same, so auto-camera swings never bend your path.
    const inAng = Math.atan2(mx, -my), now = performance.now();
    if (moveBasis === null || now - camS.lastDrag < 150 || Math.abs(turnTo(0, inAng - moveInAng, 1)) > 0.35){ moveBasis = camS.cy !== undefined ? camS.cy : camS.yaw; moveInAng = inAng; }
    const by = moveBasis;
    const fx = -Math.sin(by), fz = -Math.cos(by), rx = Math.cos(by), rz = -Math.sin(by);
    const wx = rx * mx + fx * -my, wz = rz * mx + fz * -my;
    const run = keys.has('shift') || Math.min(1, len) > 0.92;
    const sp = (state.riding ? 150 : run ? 62 : 38) * (inside ? 0.7 : 1) * (state.energy <= 5 || state.hunger <= 5 ? 0.55 : 1);
    const nx = player.x + wx * sp * dt, ny = player.y + wz * sp * dt;
    const canGo = inside ? intFree : free;
    if (canGo(nx, player.y)) player.x = nx;
    if (canGo(player.x, ny)) player.y = ny;
    player.moving = true; player.spd = sp / 62;
    player.anim += dt * (state.riding ? 0 : sp * 0.17);
    player.face = turnTo(player.face, Math.atan2(wx, wz), 1 - Math.exp(-dt * 12));
    if (state.autoCam && my < -0.5 && Math.abs(mx) < 0.2 && now - camS.lastDrag > 1500){
      camS.yaw = turnTo(camS.yaw, player.face + Math.PI, 1 - Math.exp(-dt * 1.2));
    }
  } else moveBasis = null;

  const gm = dt * TIME_SCALE * (state.speed || 1);
  advanceTime(gm);
  phoneTick(gm);
  state.energy = clamp(state.energy - gm * (0.03 + (player.moving ? (state.riding ? 0.025 : 0.065) : 0)) * (state.happy < 20 ? 1.3 : 1), 0, 100);
  state.hunger = clamp(state.hunger - gm * 0.06, 0, 100);
  if (state.energy <= 0) state.health = clamp(state.health - gm * 0.25, 0, 100);
  if (state.hunger <= 0) state.health = clamp(state.health - gm * 0.2, 0, 100);
  if (state.energy > 60 && state.hunger > 40) state.health = clamp(state.health + gm * 0.008, 0, 100);
  if (state.health <= 0){ faint(); return; }
  maybeEvent();
  if (paused) return;
  hungerWarn -= dt;
  if (state.hunger < 25 && hungerWarn <= 0){ hungerWarn = 30; toast(`🍛 You're hungry! Go to Mama Nkechi's Buka, or ${BAG} to eat.`, 'bad'); }
  if (inside){ intTick(dt); return; }

  npcs.forEach(n => {
    n.moving = false;
    if (n.wait > 0){ n.wait -= dt; return; }
    const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
    if (d < 3){ n.wait = 1 + Math.random() * 5; npcPick(n); return; }
    // wait at the kerb if a car is coming
    const nt = Math.floor((n.x + dx / d * 20) / T), nr = Math.floor((n.y + dy / d * 20) / T);
    if (isRoad(nt, nr) && !isRoad(Math.floor(n.x / T), Math.floor(n.y / T))){
      const danger = cars.some(c => { const [cx, cy] = carXY(c); return Math.hypot(cx - n.x, cy - n.y) < 90 && c.v > 20; });
      if (danger){ n.wait = 0.5; return; }
    }
    const step = n.speed * dt, nx = n.x + dx / d * step, ny = n.y + dy / d * step;
    if (free(nx, ny, 5)){ n.x = nx; n.y = ny; n.moving = true; n.ph += dt * n.speed * 0.2; n.face = turnTo(n.face, Math.atan2(dx, dy), 1 - Math.exp(-dt * 8)); }
    else npcPick(n);
  });

  updateCars(dt);
  if (paused) return;

  // police stop and search
  const now = absMin();
  if (now - state.lastStop > 240){
    for (const n of npcs){
      if (n.police && Math.hypot(player.x - n.x, player.y - n.y) < 45){
        state.lastStop = now;
        if (Math.random() < 0.08 + state.heat / 110){ n.wait = 8; openPanel('checkpoint'); return; }
        break;
      }
    }
  }

  // navigation path
  pathTimer -= dt;
  const tid = navTargetId();
  const tile = Math.floor(player.y / T) * COLS + Math.floor(player.x / T);
  if (pathTimer <= 0 || tid !== pathTo || tile !== lastTile){
    pathTimer = 1; pathTo = tid; lastTile = tile;
    const tb = B[tid];
    PATH = tb ? findPath(Math.floor(player.x / T), Math.floor(player.y / T), Math.floor(tb.frontX / T), Math.floor(tb.frontY / T)) : [];
    if (PATH.length) PATH[PATH.length - 1] = {x:tb.frontX, y:tb.frontY};
  }

  target = findTarget();
  const onRoadNow = isRoad(Math.floor(player.x / T), Math.floor(player.y / T)) && !onCross(player.x, player.y) && !state.riding;
  const label = target ? (target.type === 'b' ? `Enter ${target.b.name}` : `Talk to ${npcDisplay(target.n)}`) : onRoadNow ? '⚠️ You are on the road! Cross at the zebra crossing.' : '';
  if (label !== lastTarget){
    lastTarget = label;
    if (label){ hintEl.textContent = target ? (isTouch ? `Tap the button: ${label}` : `Press E: ${label}`) : label; hintEl.style.display = 'block'; hintEl.classList.toggle('warn', !target); }
    else hintEl.style.display = 'none';
    actBtn.textContent = target ? (target.type === 'b' ? 'ENTER' : 'TALK') : '•';
    actBtn.classList.toggle('dim', !target);
  }
}

/* =========================================================
   HUD
   ========================================================= */
const hud = {name:$('hName'), money:$('hMoney'), bank:$('hBank'), time:$('hTime'), day:$('hDay'), job:$('hJob'), heat:$('hHeat'), goal:$('goalText'), dist:$('navDist'), arrow:$('navArrow'), loc:$('locText'),
  bhp:$('bHappy'), nhp:$('nHappy'), badge:$('phoneBadge'), goalBox:$('goal'), bh:$('bHealth'), be:$('bEnergy'), bf:$('bFood'), br:$('bRep'), nh:$('nHealth'), ne:$('nEnergy'), nf:$('nFood'), nr:$('nRep')};
function updateHUD(){
  if (!state) return;
  hud.name.textContent = `${state.name} · Wallet`;
  hud.money.textContent = fmt(state.money);
  hud.bank.textContent = 'Bank: ' + fmt(state.bank);
  const mm0 = Math.floor(state.minutes), hh = Math.floor(mm0 / 60), mm = mm0 % 60;
  hud.time.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  hud.day.textContent = `${WEEKDAYS[(state.day - 1) % 7]} · Day ${state.day} · Age ${ageNow()}`;
  hud.job.textContent = state.job ? JOB[state.job].name : state.uni ? `Student ${state.uni.level}L` : state.nysc === 2 ? 'Corper' : 'Unemployed';
  hud.heat.style.display = state.heat > 0 ? 'block' : 'none';
  hud.heat.textContent = `🚨 Heat ${Math.round(state.heat)}`;
  hud.bh.style.width = state.health + '%'; hud.be.style.width = state.energy + '%'; hud.bf.style.width = state.hunger + '%'; hud.br.style.width = state.rep + '%';
  hud.nh.textContent = Math.round(state.health); hud.ne.textContent = Math.round(state.energy); hud.nf.textContent = Math.round(state.hunger); hud.nr.textContent = Math.round(state.rep);
  hud.bhp.style.width = state.happy + '%'; hud.nhp.textContent = Math.round(state.happy);
  const nb = state.pending.length + Object.values(state.unread).reduce((a, b) => a + b, 0) + (state.phone ? state.phone.sms.filter(x => !x.read && !x.ev).length : 0);
  hud.badge.textContent = nb; hud.badge.style.display = nb ? 'flex' : 'none';
  hud.goalBox.style.display = (state.guide || state.nav) ? '' : 'none';
  hud.be.style.background = state.energy < 20 ? '#ff8a3d' : '#ffd23f';
  hud.bf.style.background = state.hunger < 25 ? '#ff4d4d' : '#ff9f43';
  const g = goal();
  if (inside){
    hud.goal.textContent = g.text;
    const hs = inside.hintStation;
    hud.dist.textContent = hs ? `🧭 ${hs.label.replace(/^[^A-Za-z]*/, '')} · ${Math.max(0, Math.round(Math.hypot(hs.x - player.x * S, hs.z - player.y * S)))} m` : '';
    if (hs){ const dx = hs.x / S - player.x, dz = hs.z / S - player.y, fx = -Math.sin(camS.cy || 0), fz = -Math.cos(camS.cy || 0), rx = Math.cos(camS.cy || 0), rz = -Math.sin(camS.cy || 0); hud.arrow.style.transform = `rotate(${Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz) * 180 / Math.PI}deg)`; hud.arrow.style.opacity = '1'; } else hud.arrow.style.opacity = '0.4';
    hud.loc.textContent = `Inside ${inside.name} · ${inside.id === 'home' ? HOUSING[state.housing].name + ', ' : ''}${addressOf(B[inside.id])}, ${AREA.name}`;
    return;
  }
  const tb = B[navTargetId()];
  hud.goal.textContent = state.nav ? `Go to ${tb.name}` : g.text;
  if (tb && PATH.length > 1){
    const meters = Math.round((PATH.length - 1) * 3.2);
    hud.dist.textContent = `🧭 ${tb.name} · ${meters < 5 ? 'You are here' : meters + ' m'} · ${addressOf(tb)}`;
    const nxt = PATH[Math.min(2, PATH.length - 1)];
    const dx = nxt.x - player.x, dz = nxt.y - player.y;
    const fx = -Math.sin(camS.cy || 0), fz = -Math.cos(camS.cy || 0), rx = Math.cos(camS.cy || 0), rz = -Math.sin(camS.cy || 0);
    const ang = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz) * 180 / Math.PI;
    hud.arrow.style.transform = `rotate(${ang}deg)`; hud.arrow.style.opacity = '1';
  } else { hud.dist.textContent = tb ? `🧭 ${tb.name} · You are here` : ''; hud.arrow.style.opacity = '0.4'; }
  const onRoadNow = isRoad(Math.floor(player.x / T), Math.floor(player.y / T));
  hud.loc.textContent = `${onRoadNow ? 'On' : 'Along'} ${streetAt(player.x, player.y)}, ${AREA.name}, ${AREA.city}`;
}

/* =========================================================
   MAIN LOOP + BOOT
   ========================================================= */
let last = performance.now(), hudTimer = 0, saveTimer = 0, warnTimer = 0, running = false;
function loop(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt);
  if (state) render(dt, now);
  hudTimer += dt; saveTimer += dt; warnTimer += dt;
  if (hudTimer > 0.2){ hudTimer = 0; updateHUD(); }
  if (saveTimer > 30 && !paused){ saveTimer = 0; saveGame(true); }
  if (warnTimer > 25 && !paused){
    warnTimer = 0;
    if (state.energy < 15) toast('You are very tired. Go home to rest or take a nap.', 'bad');
    else if (state.health < 30) toast('Your health is low. Visit the hospital.', 'bad');
  }
  requestAnimationFrame(loop);
}
function enterWorld(fresh){
  AREA = AREAS.find(a => a.id === state.area) || AREAS[0];
  document.body.classList.remove('setup');
  buildWorld();
  buildActors();
  $('hudWrap').style.display = ''; $('topRight').style.display = '';
  if (isTouch){ actBtn.style.display = 'block'; ghost.style.display = 'flex'; camGhost.style.display = 'block'; }
  if (!state.news.length) genNews();
  if (!state.family) state.family = genFamily(AREA);
  camS.yaw = player.face + Math.PI; camS.snap = true;
  camera.position.set(player.x * S + Math.sin(camS.yaw) * 9, 4, player.y * S + Math.cos(camS.yaw) * 9);
  updateHUD();
  if (fresh) openPanel('intro');
  else { paused = false; toast(`Welcome back, ${state.name}! ${WEEKDAYS[(state.day - 1) % 7]}, Day ${state.day}.`, 'info'); }
  if (!running){ running = true; requestAnimationFrame(loop); }
}
function startNewLife(setup){
  state = newState(setup);
  player.x = state.px; player.y = state.py; player.face = Math.PI;
  if (!(player.x > 0 && player.y > 0)){ player.x = B.home.frontX; player.y = B.home.frontY + 6; }
  genNews();
  panelEl.classList.remove('show'); panelState = null;
  enterWorld(true);
  saveGame(true);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(true); });
if (typeof cloudBoot === 'function') cloudBoot();
else if (loadGame()) enterWorld(false);
else openPanel('setup');
