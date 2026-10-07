'use strict';
/* =========================================================
   PHONE SIMULATOR (NaijaOS)
   Lock screen, home screen and apps: Phone, Messages, NaijaChat,
   NaijaGram, Camera, Gallery, NaijaBank, MyTel, Maps, News, My Life,
   Alerts and Settings. Everything is simulated inside the game.
   ========================================================= */
let phoneOpen = false, camMode = false;
const ph = {stack:[], acts:[], call:null, ringT:null, ringLoop:null, timerT:null, typing:null, pin:'', dial:''};
const WALLS = ['linear-gradient(160deg,#0b6e3a,#073b22 60%,#021a0f)', 'linear-gradient(160deg,#ff7e5f,#feb47b)', 'linear-gradient(160deg,#2c3e50,#4ca1af)', 'linear-gradient(160deg,#8e2de2,#4a00e0)', 'linear-gradient(160deg,#141e30,#243b55)'];

function defaultPhone(){
  return {battery:100, airtime:500, data:1024, wall:0, ring:true, photos:[], tx:[], calls:[], netDownUntil:0, lowWarned:false,
    number:'080' + rint(10000000, 99999999),
    sms:[{from:'NaijaTel', text:'Welcome to NaijaTel! 🎉 You have ₦500 airtime and 1GB data. Dial *310# to check your balance.', d:1, h:420, read:false}],
    gram:{handle:'', followers:12, following:8, posts:[], postsToday:0, lastPost:0}, feed:[]};
}
function PH(){
  if (!state.phone) state.phone = defaultPhone();
  const p = state.phone;
  if (!p.gram.handle) p.gram.handle = state.name.toLowerCase().replace(/[^a-z0-9]/g, '') + rint(10, 99);
  return p;
}
const phoneReady = () => !state.noPhone && PH().battery > 0;
const netUp = () => absMin() >= (PH().netDownUntil || 0);
function useData(mb){
  const p = PH();
  if (!netUp()){ phToast('📶 No network. NaijaTel is down in your area. Try again later.'); return false; }
  if (p.data < mb){ phToast('📵 You have exhausted your data bundle. Buy data in MyTel.'); return false; }
  p.data = Math.max(0, p.data - mb); p.battery = Math.max(0, p.battery - mb / 40);
  return true;
}
const clockStr = () => { const m = Math.floor(state.minutes); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const dataStr = mb => mb >= 1024 ? (mb / 1024).toFixed(mb >= 10240 ? 0 : 1) + 'GB' : Math.round(mb) + 'MB';
const AVC = ['#e74c3c', '#3498db', '#9b59b6', '#16a085', '#e67e22', '#2c3e50', '#d35400', '#27ae60', '#c0392b', '#8e44ad'];
function avatar(name, key, big){ let h = 0; for (const ch of String(key || name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return `<div class="ph-av${big ? ' big' : ''}" style="background:${AVC[h % AVC.length]}">${esc(String(name).replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase() || '?')}</div>`; }
function phToast(t){ const el = $('phToast'); el.textContent = t; el.classList.add('on'); clearTimeout(phToast.t); phToast.t = setTimeout(() => el.classList.remove('on'), 2600); }
const reg = fn => { ph.acts.push(fn); return ph.acts.length - 1; };
const A = fn => `data-a="${reg(fn)}"`;

/* ---------- contacts ---------- */
function famLabel(m){ return m.key === 'mum' ? 'Mum' : m.key === 'dad' ? 'Dad' : m.first; }
function contacts(){
  const out = state.family.members.map(m => ({key:'fam:' + m.key, name:famLabel(m) + (m.key === 'mum' ? ' ❤️' : ''), sub:`${m.role} · ${state.family.town}`, kind:'fam', m}));
  Object.keys(state.people).filter(id => NPC[id] && state.people[id].num).forEach(id => out.push({key:'npc:' + id, name:NPC[id].name, sub:`${NPC[id].role} · ${STAGE_LABEL[stageOf(id)]}`, kind:'npc', n:NPC[id]}));
  out.push({key:'svc:landlord', name:'Landlord', sub:'Your landlord', kind:'svc', id:'landlord'});
  out.push({key:'svc:buka', name:"Mama Nkechi's Buka", sub:'Food delivery 🛵', kind:'svc', id:'buka'});
  return out;
}
const contactByKey = k => contacts().find(c => c.key === k);
function numberOf(c){ const r = seeded(c.key); return '0' + ['803', '806', '813', '816', '703', '706', '810', '902'][Math.floor(r() * 8)] + String(Math.floor(r() * 9e6 + 1e6)); }

/* ---------- open / close ---------- */
function openPhone(app, arg){
  if (!state) return;
  if (state.noPhone){ openPanel('phone'); return; }
  if (PH().battery <= 0){ toast('🪫 Your phone battery is dead. Sleep at home (or nap) to charge it.', 'bad'); return; }
  if (panelState) closePanel();
  phoneOpen = true; paused = true; keys.clear(); resetJoy();
  $('phoneSim').classList.add('show');
  ph.stack = app ? [{app:'home'}, {app, arg}] : [{app:'lock'}];
  phRender();
}
function closePhone(){
  if (ph.call && ph.call.mode === 'incoming') declineCall(true);
  endCallTimers(); ph.call = null;
  phoneOpen = false; $('phoneSim').classList.remove('show');
  paused = !!panelState || sceneBusy;
  saveGame(true); setTimeout(flushQueue, 300);
}
function phGo(app, arg){ ph.stack.push({app, arg}); phRender(); return false; }
function phBack(){
  if (ph.call){ if (ph.call.mode === 'incoming') return; endCall(); return; }
  if (ph.stack.length > 1){ ph.stack.pop(); phRender(); } else closePhone();
}
function phHome(){ if (ph.call) return; ph.stack = [{app:'home'}]; phRender(); }
function phRender(){
  ph.acts = [];
  const v = ph.stack[ph.stack.length - 1];
  const P_ = PH();
  const bars = !netUp() ? '✖' : '▂▄▆█'.slice(0, AREA.cost > 1.3 ? 4 : 3);
  $('phStatus').innerHTML = `<span>${clockStr()}</span><span>${bars}${netUp() && P_.data > 0 ? ' 4G' : ''} ${Math.round(P_.battery)}%${P_.battery < 15 ? '🪫' : '🔋'}</span>`;
  let html = '';
  try { html = (VIEWS[v.app] || VIEWS.home)(v.arg || {}, v); } catch (e){ console.error(e); html = `<div class="ph-pad">App crashed 😅<br>${esc(e.message)}</div>`; }
  const app = $('phApp');
  app.innerHTML = html; app.className = 'ph-app app-' + v.app;
  app.style.background = (v.app === 'home' || v.app === 'lock') ? WALLS[P_.wall || 0] : '';
  const sc = app.querySelector('.ph-bottom'); if (sc) sc.scrollTop = sc.scrollHeight;
  const inp = app.querySelector('input'); if (inp){ inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter'){ const b = app.querySelector('[data-send]'); if (b) b.click(); } }); }
  updateHUD();
}
$('phApp').addEventListener('click', e => {
  const t = e.target.closest('[data-a]'); if (!t) return;
  const fn = ph.acts[+t.dataset.a]; if (!fn) return;
  const r = fn(t);
  if (r !== false && phoneOpen) phRender();
});
$('phNav').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.nav === 'back') phBack(); else if (b.dataset.nav === 'home') phHome(); else closePhone();
});

/* ---------- daily + per-minute phone life ---------- */
function phoneTick(gm){
  if (!state || state.noPhone) return;
  const p = PH();
  if (p.battery > 0){
    p.battery = Math.max(0, p.battery - gm / 28);
    if (p.battery < 15 && !p.lowWarned){ p.lowWarned = true; toast('🪫 Phone battery low (15%). Charge it at home.', 'bad'); }
    if (p.battery <= 0){ toast('📵 Your phone battery is dead. Calls and messages will be missed until you charge it.', 'bad'); if (phoneOpen) closePhone(); }
  }
}
function chargePhone(to){ const p = PH(); p.battery = Math.min(100, Math.max(p.battery, to)); if (p.battery > 15) p.lowWarned = false; }
function smsAdd(from, text, ev){
  const p = PH();
  p.sms.push({from, text, d:state.day, h:Math.floor(state.minutes), read:false, ev:ev || null});
  if (p.sms.length > 60) p.sms.shift();
  if (phoneReady()) toast(`✉️ ${from}: ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}`, 'info');
}
function addTx(desc, amt){ const p = PH(); p.tx.push({d:state.day, h:Math.floor(state.minutes), desc, amt}); if (p.tx.length > 40) p.tx.shift(); }
function logCall(who, name, dir, ev){ const p = PH(); p.calls.push({who, name, dir, d:state.day, h:Math.floor(state.minutes), ev:ev || null}); if (p.calls.length > 40) p.calls.shift(); }
const GRAM_POSTS = {
  chinedu:[['📱', 'New stock just landed! Phones, chargers, everything. Come to my shop 🔥'], ['⚽', 'Arsenal again?! My heart 💔']],
  aisha:[['📚', 'Library till 10pm. Exams no be joke 😩'], ['🌙', 'Jumat Mubarak 🤲🏾']],
  tunde:[['🏍️', 'Okada life. Na hustle 💪🏾'], ['⚽', 'Who else watched the match yesterday?!']],
  ngozi:[['🎓', 'Proud of my students today 👩🏾‍🏫'], ['☕', 'Monday mood: coffee and lecture notes']],
  emeka:[['💼', 'Banking hall was full today. Use your apps o!'], ['👨‍👩‍👧', 'Family time 🥰']],
  bisi:[['👗', 'New Ankara collection dropping Friday ✨'], ['💃🏾', 'Owambe ready!']],
  musa:[['🔧', 'Fixed this Corolla in 2 hours. Correct mechanic 😎'], ['🕌', 'Alhamdulillah for today']],
  funke:[['🩺', 'Night shift done. Nurses deserve more 🙏🏾'], ['🍲', 'Sunday rice with my family']],
  ifeanyi:[['💻', 'Just shipped a new app feature 🚀'], ['🎧', 'Coding with Afrobeats on repeat']],
  zainab:[['💇🏾‍♀️', 'Braids for my client today. Book now! 📲'], ['💅🏾', 'Self care Saturday']],
  segun:[['🇳🇬', 'Corper wee wee! Camp stories loading 😂'], ['🗳️', 'Young people, get your PVC!']],
  amaka:[['🍛', 'Small chops and jollof for an event today. Orders open!'], ['🎂', 'Birthday cake delivered 🎉']],
  kemi:[['🤳🏾', 'New skit drops tonight! 😂😂'], ['🛍️', 'Haul from the market 😍'], ['✈️', 'Dubai someday 🙏🏾']],
  yusuf:[['📄', 'Civil service life: one file at a time 😅'], ['🕌', 'Friday prayers. Peace to everyone 🤲🏾']],
  chioma:[['💊', "Please don't self-medicate. See a pharmacist! 💊"], ['🥰', 'Anniversary with my husband ❤️']],
  dayo:[['📷', 'Shot a wedding this weekend 📸'], ['🌅', 'This sunset hits different']]
};
function phoneDaily(){
  if (!state) return;
  const p = PH();
  p.gram.postsToday = 0;
  const ids = shuffle(Object.keys(GRAM_POSTS)).slice(0, rint(3, 5));
  ids.forEach(id => { const [emo, cap] = pick(GRAM_POSTS[id]); p.feed.push({id:'f' + state.day + id, who:id, emo, cap, likes:rint(15, 900) * (id === 'kemi' ? 8 : 1), d:state.day, liked:false, cmt:false}); });
  while (p.feed.length > 24) p.feed.shift();
  p.gram.followers += rint(0, 3) + Math.round(state.rep / 50) + Math.round(friendIds(30).length / 2);
  if (!state.noPhone){
    const mum = fam('mum'), dad = fam('dad');
    if (Math.random() < 0.6) chatAdd('fam', 0, `${mum.first}: ` + pick(['Good morning my children. God will bless the works of our hands today 🙏🏾', 'Have you people eaten? Don\'t starve yourselves o!', 'Remember to pray before you go out. Love you all ❤️', 'Mama Ngozi\'s daughter just got married o. When is my turn to dance? 😄']));
    if (Math.random() < 0.3) chatAdd('fam', 0, `${dad.first}: ` + pick(['Forwarded: "Drinking hot water every morning cures 10 diseases" 🙄', 'Stay focused. Hard work pays.', 'Forwarded as received: Watch out for fake bank SMS!', 'Who used my data last weekend? 😂']));
    const sib = state.family.members.find(m => m.key.startsWith('sib') && Math.random() < 0.25);
    if (sib) chatAdd('fam', 0, `${sib.first}: ` + pick(['Abeg who get extra data? 😩', 'Mummy, I passed my test! 🎉', 'Brother/Sister, buy me shoe when you hammer o 😂', 'Who dey watch the match tonight?']).replace('Brother/Sister', state.gender === 'f' ? 'Sister' : 'Brother'));
    if (p.data < 100 && p.data > 0) smsAdd('NaijaTel', `Your data balance is low: ${dataStr(p.data)}. Dial *312# or use MyTel to buy more.`);
  }
}
/* event delivery: calls ring, SMS land in Messages, requests from people land in NaijaChat */
const EV_VIA = {
  mumSick:['call', () => 'fam:mum'], sibFees:['call', c => 'fam:' + c.key], dadCall:['call', () => 'fam:dad'],
  familyGift:['sms', () => 'NaijaTrust Bank'], rentHike:['call', () => 'svc:landlord'], bonus:['sms', () => 'Payroll'],
  scam:['sms', () => 'NAIJATEL-PROMO'], brandDeal:['sms', () => 'NaijaGram Business'],
  friendLoan:['chat', c => c.who], friendInvest:['chat', c => c.who], wedding:['chat', c => c.who],
  partnerMoney:['chat', c => c.who], partnerMiss:['chat', c => c.who], partnerFuture:['chat', c => c.who]
};
const stripQuote = t => String(t).replace(/^[^":]{1,40}:\s*/, '').replace(/^"|"$/g, '');
function phoneIncoming(inst){
  const v = EV_VIA[inst.id] || ['sms', () => 'Notification'];
  inst.via = v[0]; inst.from = v[1](inst.ctx);
  const body = EVENT[inst.id].body(inst.ctx);
  if (inst.via === 'chat'){
    P(inst.from).num = true;
    chatAdd(inst.from, 0, stripQuote(body));
    const c = state.chats[inst.from]; c[c.length - 1].ev = inst.key;
    if (phoneReady()){ toast(`💬 ${NPC[inst.from].name}: ${stripQuote(body).slice(0, 55)}…`, 'info'); sfx('ding'); }
  } else if (inst.via === 'sms'){
    smsAdd(inst.from, stripQuote(body), inst.key); sfx('ding');
  } else {
    const c = contactByKey(inst.from), name = c ? c.name.replace(' ❤️', '') : 'Unknown';
    if (phoneReady() && !panelState && !sceneBusy && !phoneOpen && !camMode){
      phoneOpen = true; paused = true; keys.clear(); resetJoy(); $('phoneSim').classList.add('show');
      ph.stack = [{app:'home'}];
      ph.call = {mode:'incoming', key:inst.from, name, inst, lines:[], start:0};
      ph.stack.push({app:'call'});
      startRinging(); phRender();
    } else {
      logCall(inst.from, name, 'missed', inst.key);
      if (phoneReady()) toast(`📞 Missed call from ${name}`, 'bad');
    }
  }
}

/* ---------- calls ---------- */
function startRinging(){
  const ring = () => { if (PH().ring) sfx('ring'); };
  ring(); ph.ringLoop = setInterval(ring, 1400);
  ph.ringT = setTimeout(() => { if (ph.call && ph.call.mode === 'incoming') declineCall(false); }, 15000);
}
function endCallTimers(){ clearInterval(ph.ringLoop); clearTimeout(ph.ringT); clearInterval(ph.timerT); ph.ringLoop = ph.ringT = ph.timerT = null; }
function declineCall(silent){
  const c = ph.call; if (!c) return;
  endCallTimers();
  logCall(c.key, c.name, 'missed', c.inst ? c.inst.key : null);
  if (!silent) toast(`📞 Missed call from ${c.name}`, 'bad');
  ph.call = null;
  if (phoneOpen){ ph.stack = [{app:'home'}]; phRender(); }
}
function acceptCall(){
  const c = ph.call; endCallTimers();
  c.mode = 'active'; c.start = Date.now();
  logCall(c.key, c.name, 'in', null);
  c.lines.push({them:stripQuote(EVENT[c.inst.id].body(c.inst.ctx))});
  startCallTimer();
}
function startCallTimer(){ clearInterval(ph.timerT); ph.timerT = setInterval(() => { const el = $('phTimer'); if (el && ph.call){ const s = Math.floor((Date.now() - ph.call.start) / 1000); el.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; } }, 500); }
function endCall(){
  const c = ph.call; endCallTimers();
  if (c && c.mode === 'active'){ const mins = Math.max(1, Math.round((Date.now() - c.start) / 20000)); advanceTime(mins * 5); PH().battery = Math.max(0, PH().battery - 1); }
  ph.call = null;
  if (ph.stack.length && ph.stack[ph.stack.length - 1].app === 'call') ph.stack.pop();
  if (!ph.stack.length) ph.stack = [{app:'home'}];
  phRender();
}
function callContact(key, ev){
  const c = contactByKey(key);
  if (!c) return;
  const pending = ev ? state.pending.find(x => x.key === ev) : state.pending.find(x => x.via === 'call' && x.from === key);
  if (!pending){
    if (PH().airtime < 50){ phToast('🤖 "You do not have sufficient credit to make this call. Please recharge."'); return false; }
    PH().airtime -= 50;
  }
  ph.call = {mode:'outgoing', key, name:c.name.replace(' ❤️', ''), c, inst:pending || null, lines:[], start:0};
  ph.stack.push({app:'call'}); phRender();
  setTimeout(() => {
    if (!ph.call || ph.call.mode !== 'outgoing') return;
    if (!pending && c.kind === 'npc' && Math.random() < 0.15){ ph.call.lines.push({sys:'🤖 "The number you are calling is not reachable at the moment. Please try again later."'}); ph.call.mode = 'failed'; logCall(key, ph.call.name, 'out'); phRender(); return; }
    ph.call.mode = 'active'; ph.call.start = Date.now(); logCall(key, ph.call.name, 'out');
    if (pending) ph.call.lines.push({them:stripQuote(EVENT[pending.id].body(pending.ctx))});
    else ph.call.lines.push({them:c.kind === 'fam' ? pick(['Hello? My child! 😄', 'Ehen! How you dey?', 'Hello? I was just thinking about you!']) : c.kind === 'svc' ? (c.id === 'landlord' ? 'Hello, who is this? Oh, my tenant.' : "Mama Nkechi's Buka, hello! Wetin you go like chop?") : pick(['Hello? 😊', 'How far!', 'Heyyy! How you dey?'])});
    startCallTimer(); phRender();
  }, 1500);
  return false;
}
function callOptions(c){
  const out = [];
  if (c.inst){
    if (!state.pending.some(x => x.key === c.inst.key)) return out;
    EVENT[c.inst.id].options(c.inst.ctx).forEach((o, i) => out.push({label:o.label, note:o.note, fn:() => { const msg = resolveEvent(c.inst, i); if (msg === false) return; c.lines.push({me:o.label}); c.lines.push({them:stripQuote(msg)}); c.done = true; }}));
    return out;
  }
  if (c.done) return out;
  const k = c.c;
  if (k.kind === 'fam'){
    const m = k.m;
    out.push({label:'Just checking on you ❤️', fn:() => { if (m.called === state.day){ c.lines.push({them:'You called me already today o 😄. I dey fine.'}); return; } c.lines.push({me:'Just checking on you.'}); c.lines.push({them:famCall(m).replace(/^"|"$/g, '')}); }});
    out.push({label:'Ask for financial help 🙏🏾', fn:() => {
      c.lines.push({me:'Things are hard here. Can you help me small?'});
      if ((m.key === 'dad' || m.key === 'mum') && !state.flags['famHelp' + Math.floor(state.day / 7)] && m.rel >= 55){ state.flags['famHelp' + Math.floor(state.day / 7)] = true; const amt = rint(1, 3) * 10000; state.bank += amt; addTx(`Transfer from ${famLabel(m)}`, amt); c.lines.push({them:`Okay, I've sent ${fmt(amt)}. Spend it wisely.`}); smsAdd('NaijaTrust Bank', `Credit alert: ${fmt(amt)} from ${m.first} ${state.family.surname}.`); }
      else { famRel(m.key, -2); c.lines.push({them:m.key.startsWith('sib') ? 'Me?! I\'m the one who needs help 😂' : 'Things are tight here too, my child. Manage for now.'}); }
      c.done = true;
    }});
  } else if (k.kind === 'npc'){
    const n = k.n;
    out.push({label:'Just checking on you 👋🏾', fn:() => { if (did(n.id, 'call')){ c.lines.push({them:'Haha we just talked today 😄'}); return; } c.lines.push({me:'How far, just checking on you.'}); c.lines.push({them:chatCall(n)}); }});
    out.push({label:isRomantic(n.id) ? "Let's go on a date 🌹" : "Let's hang out 🍻", fn:() => { c.picking = true; }});
    if (c.picking) return OUTINGS.map(o => ({label:o.name, note:outingCost(o) ? fmt(outingCost(o)) : 'Free', fn:() => {
      c.picking = false; const why = outingBlock(n, o); if (why){ c.lines.push({sys:why}); return; }
      c.lines.push({me:`Let's do: ${o.name}`});
      const r = actOuting(n, o); if (!r){ c.lines.push({sys:'Not enough money.'}); return; }
      c.lines.push({them:r.ok ? `(after the outing) ${r.line}` : r.line}); c.done = true;
    }}));
  } else if (k.id === 'landlord'){
    out.push({label:'Ask about rent', fn:() => { c.lines.push({me:'Good afternoon sir/ma. When is my rent due?'}); c.lines.push({them:`Your rent of ${fmt(rentOf(state.housing))} is due on Day ${state.rentDueDay}. Don't owe me o!`}); }});
    out.push({label:'Beg for more time 🙏🏾', fn:() => {
      c.lines.push({me:'Please give me a few more days for the rent.'});
      if (state.rentStrikes > 0 && state.rep >= 55 && !state.flags.rentBeg){ state.flags.rentBeg = true; state.rentDueDay += 2; state.rentStrikes = Math.max(0, state.rentStrikes - 1); c.lines.push({them:'Okay. Two more days. Just this once.'}); }
      else c.lines.push({them:state.rentStrikes ? 'I don hear this story before. Pay my money!' : 'Your rent is not even due yet. Why are you begging? 😂'});
      c.done = true;
    }});
  } else if (k.id === 'buka'){
    const cost = price(3500) + 1000;
    out.push({label:`Order jollof delivery 🛵 (${fmt(cost)})`, fn:() => {
      c.lines.push({me:'Abeg send me jollof rice and chicken.'});
      if (!inside || inside.id !== 'home'){ c.lines.push({them:'We only deliver to houses o. Call us when you reach home.'}); return; }
      if (!inHours(8, 21)){ c.lines.push({them:'Sorry, delivery is closed for today.'}); return; }
      if (!spendAny(cost)){ c.lines.push({sys:'Not enough money.'}); return; }
      advanceTime(40); gain('hunger', 55); gain('happy', 3); addTx("Mama Nkechi's delivery", -cost);
      c.lines.push({them:'Your food don reach! Enjoy 😋'}); c.done = true;
    }});
  }
  return out;
}

/* ---------- NaijaChat helpers ---------- */
function npcReplyTo(n, text){
  const t = text.toLowerCase(), rom = isRomantic(n.id);
  if (/(love|miss|babe|baby|dear|cute|beautiful|handsome)/.test(t)) return rom ? pick(['I miss you too ❤️', ...CHAT.flirtWarm]) : pick(['Lol 😅', 'Hmm, okay o 😂', 'Calm down 😂']);
  if (/(^|\s)(hi|hello|hey|how far|morning|good morning|wassup|sup|how you dey)/.test(t)) return pick(['Hey! 😊', 'How far! I dey o', 'Morning o! How you dey?', 'Hiii 👋🏾']);
  if (/(money|send|borrow|loan|cash|naira|₦)/.test(t)) return pick(['Money matter? 😅 Things are tight for me too.', 'Hmm, let me see what I can do.', 'Abeg no talk money now 😂']);
  if (/(meet|hang|see you|link|chill|date|come over|outing)/.test(t)) return pick(['Sure! When?', 'I dey free this weekend o.', 'Make we see later.']);
  if (/(sorry|apolog)/.test(t)) return pick(['It\'s okay 🙏🏾', 'No wahala.', 'Hmm. Okay.']);
  if (/\?\s*$/.test(t)) return pick(['Good question 🤔', 'I no sure o.', 'Yes o!', 'No o 😂']);
  return pick(['😂😂', 'True talk.', 'Okay o.', 'Lol 😄', 'Hmm 🤔', 'Na so!', '👍🏾']);
}
function famReply(){ const m = pick(state.family.members); return `${m.first}: ` + pick(['Amen! 🙏🏾', 'Hahaha 😂', 'Well done!', 'Love you too ❤️', 'We are proud of you!', 'Okay o.']); }

/* ---------- photos ---------- */
function snapshot(){
  renderer.render(scene, camera);
  const src = renderer.domElement, c = document.createElement('canvas');
  c.width = 320; c.height = Math.round(320 * src.height / src.width);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.68);
}
const postImgCache = {};
function postImage(post){
  if (postImgCache[post.id]) return postImgCache[post.id];
  const c = document.createElement('canvas'); c.width = 240; c.height = 240; const g = c.getContext('2d');
  const r = seeded(post.id), hue = Math.floor(r() * 360);
  const gr = g.createLinearGradient(0, 0, 240, 240); gr.addColorStop(0, `hsl(${hue},70%,62%)`); gr.addColorStop(1, `hsl(${(hue + 60) % 360},70%,42%)`);
  g.fillStyle = gr; g.fillRect(0, 0, 240, 240);
  for (let i = 0; i < 6; i++){ g.fillStyle = `rgba(255,255,255,${0.06 + r() * 0.1})`; g.beginPath(); g.arc(r() * 240, r() * 240, 20 + r() * 60, 0, Math.PI * 2); g.fill(); }
  g.font = '110px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(post.emo, 120, 125);
  return postImgCache[post.id] = c.toDataURL('image/jpeg', 0.7);
}
function postToGram(photo, caption){
  const p = PH(), G = p.gram;
  if (G.postsToday >= 2){ phToast('You have posted twice today. Don\'t spam your followers 😅'); return false; }
  if (!useData(30)) return false;
  G.postsToday++; G.lastPost = state.day;
  const quality = 0.6 + Math.random() * 0.8;
  let likes = Math.round((G.followers * (0.08 + Math.random() * 0.17) + state.rep / 4 + friendIds(20).length * 2) * quality);
  let gainF = Math.round(likes * (0.05 + Math.random() * 0.15)) + rint(0, 4);
  let viral = Math.random() < 0.03 + (G.followers > 1000 ? 0.02 : 0) + (state.happy > 75 ? 0.01 : 0);
  if (viral){ likes = likes * rint(25, 60) + rint(2000, 15000); gainF += rint(2000, 20000); }
  G.followers += gainF;
  const comments = shuffle(friendIds(20)).slice(0, 3).map(id => ({who:NPC[id].name, t:pick(['🔥🔥🔥', 'Looking good!', 'Na you biko 😍', 'Congrats!', 'Where be this? 😮', 'Correct! 👏🏾'])}));
  G.posts.unshift({id:'p' + Date.now(), img:photo.img, cap:caption, likes, comments, d:state.day});
  if (G.posts.length > 12) G.posts.pop();
  gain('happy', viral ? 10 : 3); if (viral){ gain('rep', 3); addHistory(`Went viral on NaijaGram (+${gainF.toLocaleString()} followers)`, '🚀'); }
  setTimeout(() => toast(viral ? `🚀 Your post is going VIRAL! ${likes.toLocaleString()} likes, +${gainF.toLocaleString()} followers!` : `📸 Your post got ${likes} likes and +${gainF} followers.`, 'good'), 900);
  return true;
}
function enterCamera(){
  camMode = true; phoneOpen = false; $('phoneSim').classList.remove('show'); $('camUI').classList.add('show'); document.body.classList.add('cam'); $('camCount').textContent = `${PH().photos.length}/12 photos`;
  paused = false;
}
function exitCamera(toGallery){
  camMode = false; $('camUI').classList.remove('show'); document.body.classList.remove('cam');
  openPhone(toGallery ? 'gallery' : null);
  if (toGallery) return;
}
$('camShot').addEventListener('click', () => {
  if (PH().photos.length >= 12){ toast('Gallery full (12 photos). Delete some in Gallery.', 'bad'); return; }
  const img = snapshot();
  PH().photos.unshift({id:'ph' + Date.now(), img, d:state.day, where:inside ? inside.name : streetAt(player.x, player.y)});
  flashScreen(); sfx('ding'); PH().battery = Math.max(0, PH().battery - 0.5);
  $('camCount').textContent = `${PH().photos.length} photo${PH().photos.length > 1 ? 's' : ''}`;
});
$('camSelfie').addEventListener('click', () => { camS.yaw = player.face; camS.pitch = 0.15; camS.dist = 3.6; camS.lastDrag = performance.now(); });
$('camDone').addEventListener('click', () => exitCamera(true));

/* =========================================================
   VIEWS
   ========================================================= */
const APPS = [
  {id:'dialer', name:'Phone', icon:'📞', bg:'#2ecc71', badge:() => PH().calls.filter(c => c.dir === 'missed' && c.ev && state.pending.some(x => x.key === c.ev)).length},
  {id:'messages', name:'Messages', icon:'✉️', bg:'#3498db', badge:() => PH().sms.filter(s => !s.read).length},
  {id:'chats', name:'NaijaChat', icon:'💬', bg:'#25d366', badge:() => Object.values(state.unread).reduce((a, b) => a + b, 0)},
  {id:'gram', name:'NaijaGram', icon:'📸', bg:'linear-gradient(45deg,#f58529,#dd2a7b,#8134af)'},
  {id:'camera', name:'Camera', icon:'📷', bg:'#4a4a4a'},
  {id:'gallery', name:'Gallery', icon:'🖼️', bg:'#f39c12'},
  {id:'bank', name:'NaijaBank', icon:'🏦', bg:'#0b3d91'},
  {id:'mytel', name:'MyTel', icon:'📶', bg:'#f1c40f'},
  {id:'maps', name:'Maps', icon:'🗺️', bg:'#16a085'},
  {id:'news', name:'News', icon:'📰', bg:'#c0392b'},
  {id:'life', name:'My Life', icon:'🪪', bg:'#8e44ad'},
  {id:'notifs', name:'Alerts', icon:'🔔', bg:'#e67e22', badge:() => state.pending.length},
  {id:'settings', name:'Settings', icon:'⚙️', bg:'#7f8c8d'}
];
const hdr = (title, extra) => `<div class="ph-hdr"><span>${title}</span>${extra || ''}</div>`;
const VIEWS = {
  lock: () => {
    const unread = Object.values(state.unread).reduce((a, b) => a + b, 0), sms = PH().sms.filter(s => !s.read).length;
    const missed = PH().calls.filter(c => c.dir === 'missed' && c.ev && state.pending.some(x => x.key === c.ev));
    const cards = [];
    missed.slice(-2).forEach(c => cards.push(`<div class="ph-card">📞 Missed call from <b>${esc(c.name)}</b></div>`));
    if (unread) cards.push(`<div class="ph-card">💬 ${unread} new NaijaChat message${unread > 1 ? 's' : ''}</div>`);
    if (sms) cards.push(`<div class="ph-card">✉️ ${sms} new SMS</div>`);
    return `<div class="ph-lock"><div class="ph-clock">${clockStr()}</div><div class="ph-date">${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][(state.day - 1) % 7]}, Day ${state.day}</div>
      <div class="ph-cards">${cards.join('') || '<div class="ph-card dim">No new notifications</div>'}</div>
      <button class="ph-unlock" ${A(() => { ph.stack = [{app:'home'}]; })}>🔓 Tap to unlock</button></div>`;
  },
  home: () => `<div class="ph-grid">${APPS.map(a => { const b = a.badge ? a.badge() : 0; return `<div class="ph-appic" ${A(() => a.id === 'camera' ? (enterCamera(), false) : phGo(a.id))}><div class="ph-ic" style="background:${a.bg}">${a.icon}${b ? `<i>${b}</i>` : ''}</div><span>${a.name}</span></div>`; }).join('')}</div>`,

  dialer: (arg) => {
    const tab = arg.tab || 'contacts';
    const tabs = `<div class="ph-tabs">${['contacts', 'recents', 'keypad'].map(t => `<button class="${t === tab ? 'on' : ''}" ${A(() => { ph.stack[ph.stack.length - 1].arg = {tab:t}; })}>${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>`;
    let body = '';
    if (tab === 'contacts') body = contacts().map(c => `<div class="ph-row">${avatar(c.name, c.key)}<div class="ph-grow"><b>${esc(c.name)}</b><small>${esc(c.sub)} · ${numberOf(c)}</small></div><button class="ph-round green" ${A(() => callContact(c.key))}>📞</button>${c.kind === 'npc' ? `<button class="ph-round blue" ${A(() => phGo('thread', {id:c.n.id}))}>💬</button>` : ''}</div>`).join('');
    else if (tab === 'recents') body = PH().calls.slice().reverse().map(c => { const live = c.ev && state.pending.some(x => x.key === c.ev); return `<div class="ph-row" ${A(() => callContact(c.who, live ? c.ev : null))}>${avatar(c.name, c.who)}<div class="ph-grow"><b class="${c.dir === 'missed' ? 'red' : ''}">${esc(c.name)}</b><small>${c.dir === 'missed' ? '↙ Missed' : c.dir === 'in' ? '↙ Incoming' : '↗ Outgoing'} · Day ${c.d}, ${fmtClock(c.h)}${live ? ' · tap to call back' : ''}</small></div><span>📞</span></div>`; }).join('') || '<div class="ph-pad dim">No recent calls.</div>';
    else body = `<div class="ph-pad center"><div class="ph-dial">${esc(ph.dial) || '&nbsp;'}</div><div class="ph-keys">${['1','2','3','4','5','6','7','8','9','*','0','#'].map(d => `<button ${A(() => { if (ph.dial.length < 14) ph.dial += d; })}>${d}</button>`).join('')}</div>
      <button class="ph-btn grey" ${A(() => { ph.dial = ph.dial.slice(0, -1); })}>⌫</button>
      <button class="ph-btn green" ${A(() => {
        const d = ph.dial; ph.dial = '';
        if (d === '*310#' || d === '*556#'){ phToast(`Airtime: ${fmt(PH().airtime)} · Data: ${dataStr(PH().data)}`); return; }
        if (d === '*312#'){ phGo('mytel'); return false; }
        const c = contacts().find(x => numberOf(x) === d);
        if (c) return callContact(c.key);
        phToast(d ? '🤖 "The number you have dialled does not exist. Please check the number and try again."' : 'Enter a number. Tip: *310# checks your balance.');
      })}>📞 Call</button></div>`;
    return hdr('Phone') + tabs + body;
  },

  call: () => {
    const c = ph.call;
    if (!c) return VIEWS.home();
    const lines = c.lines.map(l => l.them ? `<div class="ph-say them">${esc(l.them)}</div>` : l.me ? `<div class="ph-say me">${esc(l.me)}</div>` : `<div class="ph-say sys">${esc(l.sys)}</div>`).join('');
    let ctrl = '';
    if (c.mode === 'incoming') ctrl = `<div class="ph-callbtns"><button class="ph-round big red" ${A(() => declineCall(false))}>✆</button><button class="ph-round big green" ${A(() => acceptCall())}>✆</button></div>`;
    else if (c.mode === 'outgoing') ctrl = `<div class="ph-callbtns"><button class="ph-round big red" ${A(() => endCall())}>✆</button></div>`;
    else {
      const ops = c.mode === 'active' ? callOptions(c) : [];
      ctrl = `<div class="ph-ops">${ops.map(o => `<button class="ph-op" ${A(() => { o.fn(); })}>${esc(o.label)}${o.note ? `<small>${esc(o.note)}</small>` : ''}</button>`).join('')}</div><div class="ph-callbtns"><button class="ph-round big red" ${A(() => endCall())}>✆</button></div>`;
    }
    return `<div class="ph-callscr">${avatar(c.name, c.key, true)}<div class="ph-cname">${esc(c.name)}</div>
      <div class="ph-cstat">${c.mode === 'incoming' ? 'Incoming call...' : c.mode === 'outgoing' ? 'Calling...' : c.mode === 'failed' ? 'Call failed' : `<span id="phTimer">00:00</span>`}</div>
      <div class="ph-lines ph-bottom">${lines}</div>${ctrl}</div>`;
  },

  messages: () => {
    const p = PH(), by = {};
    p.sms.forEach(s => { (by[s.from] = by[s.from] || []).push(s); });
    const rows = Object.keys(by).sort((a, b) => { const x = by[a][by[a].length - 1], y = by[b][by[b].length - 1]; return (y.d * 1440 + y.h) - (x.d * 1440 + x.h); });
    return hdr('Messages') + (rows.map(f => { const l = by[f][by[f].length - 1], u = by[f].filter(s => !s.read).length; return `<div class="ph-row" ${A(() => phGo('sms', {from:f}))}>${avatar(f, f)}<div class="ph-grow"><b>${esc(f)}</b><small>${esc(l.text.slice(0, 48))}</small></div>${u ? `<span class="ph-badge">${u}</span>` : `<small>Day ${l.d}</small>`}</div>`; }).join('') || '<div class="ph-pad dim">No messages.</div>');
  },
  sms: (arg) => {
    const list = PH().sms.filter(s => s.from === arg.from);
    list.forEach(s => s.read = true);
    const body = list.map(s => {
      const live = s.ev && state.pending.find(x => x.key === s.ev);
      const acts = live ? `<div class="ph-chips">${EVENT[live.id].options(live.ctx).map((o, i) => `<button ${A(() => { const msg = resolveEvent(live, i); if (msg === false) return; PH().sms.push({from:arg.from, text:'✔ ' + o.label + (msg ? ` · ${msg}` : ''), d:state.day, h:Math.floor(state.minutes), read:true, me:true}); })}>${esc(o.label)}</button>`).join('')}</div>` : '';
      return `<div class="ph-bub ${s.me ? 'me' : 'them'}">${esc(s.text)}<small>Day ${s.d} · ${fmtClock(s.h)}</small></div>${acts}`;
    }).join('');
    return hdr(`‹ ${esc(arg.from)}`) + `<div class="ph-thread ph-bottom sms">${body}</div>`;
  },

  chats: () => {
    if (!state.chats.fam) chatAdd('fam', 0, `${fam('mum').first}: Welcome to the family group my children ❤️`);
    const ids = ['fam', ...Object.keys(state.people).filter(id => NPC[id] && state.people[id].num)];
    ids.sort((a, b) => { const x = (state.chats[a] || []).slice(-1)[0], y = (state.chats[b] || []).slice(-1)[0]; return ((y ? y.d * 1440 + y.h : 0) - (x ? x.d * 1440 + x.h : 0)); });
    return hdr('NaijaChat', `<small class="ph-sub">${netUp() && PH().data > 0 ? 'Connected' : 'Waiting for network…'}</small>`) + ids.map(id => {
      const l = (state.chats[id] || []).slice(-1)[0], u = state.unread[id] || 0, nm = id === 'fam' ? `The ${state.family.surname}s 👪` : NPC[id].name;
      return `<div class="ph-row" ${A(() => phGo('thread', {id}))}>${avatar(nm, id)}<div class="ph-grow"><b>${esc(nm)}</b><small>${l ? esc((l.m ? 'You: ' : '') + l.t).slice(0, 44) : 'Say hi 👋🏾'}</small></div>${u ? `<span class="ph-badge green">${u}</span>` : l ? `<small>${fmtClock(l.h)}</small>` : ''}</div>`;
    }).join('') + (ids.length === 1 ? '<div class="ph-pad dim">Exchange numbers with people you meet to chat with them here.</div>' : '');
  },
  thread: (arg) => {
    const id = arg.id, isFam = id === 'fam', n = NPC[id];
    state.unread[id] = 0;
    const msgs = (state.chats[id] || []).slice(-30).map(m => {
      const live = m.ev && state.pending.find(x => x.key === m.ev);
      const acts = live ? `<div class="ph-chips">${EVENT[live.id].options(live.ctx).map((o, i) => `<button ${A(() => { const msg = resolveEvent(live, i); if (msg === false) return; chatAdd(id, 1, o.label); state.unread[id] = 0; if (msg) setTimeout(() => { chatAdd(id, 0, stripQuote(msg)); if (phoneOpen) phRender(); }, 900); })}>${esc(o.label)}</button>`).join('')}</div>` : '';
      return `<div class="ph-bub ${m.m ? 'me' : 'them'}">${esc(m.t)}<small>${fmtClock(m.h)}${m.m ? ' ✓✓' : ''}</small></div>${acts}`;
    }).join('');
    const typing = ph.typing === id ? '<div class="ph-bub them typing">typing<span>.</span><span>.</span><span>.</span></div>' : '';
    const rom = n && isRomantic(id);
    const chips = isFam ? '' : `<div class="ph-chips quick">
      <button ${A(() => { if (did(id, 'chat')) return phToast('You checked on them already today.'); if (!useData(1)) return; chatCheck(n); })}>👋🏾 Check up</button>
      ${rom ? `<button ${A(() => { if (did(id, 'flirt')) return phToast('You flirted already today 😅'); if (!useData(1)) return; chatFlirt(n); })}>😉 Flirt</button>` : ''}
      <button ${A(() => callContact('npc:' + id))}>📞 Call</button>
      <button ${A(() => { ph.picking = id; })}>${rom ? '🌹 Date' : '🍻 Hang out'}</button>
      <button ${A(() => { if (did(id, 'send')) return phToast('One transfer per day.'); if (!useData(2)) return; if (chatSend(n, 5000)) addTx(`Transfer to ${n.name}`, -5000); })}>💸 ₦5k</button>
      <button ${A(() => { if (did(id, 'send')) return phToast('One transfer per day.'); if (!useData(2)) return; if (chatSend(n, 20000)) addTx(`Transfer to ${n.name}`, -20000); })}>💸 ₦20k</button></div>`;
    const pickO = ph.picking === id && n ? `<div class="ph-chips">${OUTINGS.map(o => `<button ${A(() => {
      ph.picking = null; const why = outingBlock(n, o); if (why){ phToast(why); return; }
      chatAdd(id, 1, `Let's do this: ${o.name}`);
      const r = actOuting(n, o); if (!r) return;
      setTimeout(() => { chatAdd(id, 0, r.ok ? r.line : pick(CHAT.declineOut)); if (phoneOpen) phRender(); }, 900);
    })}>${esc(o.name)} · ${outingCost(o) ? fmt(outingCost(o)) : 'Free'}</button>`).join('')}<button ${A(() => { ph.picking = null; })}>✖ Cancel</button></div>` : '';
    const nm = isFam ? `The ${state.family.surname}s 👪` : n.name;
    const status = isFam ? state.family.members.map(m => famLabel(m)).join(', ') + ', You' : `${STAGE_LABEL[stageOf(id)]} · ${Math.random() < 0.5 ? 'online' : 'last seen today'}`;
    return `<div class="ph-hdr chat">${avatar(nm, id)}<div class="ph-grow"><b>${esc(nm)}</b><small>${esc(status)}</small></div></div>
      <div class="ph-thread ph-bottom">${msgs}${typing}</div>${pickO}${chips}
      <div class="ph-input"><input id="phMsg" type="text" maxlength="120" placeholder="Type a message"><button data-send ${A(() => {
        const inp = $('phMsg'), t = (inp && inp.value || '').trim(); if (!t) return;
        if (!useData(1)) return;
        chatAdd(id, 1, t); state.unread[id] = 0;
        if (!isFam && !did(id, 'text')){ mark(id, 'text'); bond(id, 1); if (isRomantic(id)) woo(id, 1); }
        ph.typing = id;
        setTimeout(() => { ph.typing = null; chatAdd(id, 0, isFam ? famReply() : npcReplyTo(n, t)); if (phoneOpen) phRender(); }, 1200 + Math.random() * 900);
      })}>➤</button></div>`;
  },

  gram: (arg) => {
    const G = PH().gram, tab = arg.tab || 'feed';
    const tabs = `<div class="ph-tabs">${[['feed', '🏠 Feed'], ['me', '👤 Profile']].map(([t, l]) => `<button class="${t === tab ? 'on' : ''}" ${A(() => { ph.stack[ph.stack.length - 1].arg = {tab:t}; })}>${l}</button>`).join('')}</div>`;
    const logo = `<div class="ph-hdr gram"><span>NaijaGram</span><small>${G.followers.toLocaleString()} followers</small></div>`;
    if (tab === 'feed'){
      if (!arg.loaded){ if (!useData(8)) return logo + tabs + '<div class="ph-pad dim">Could not load the feed.</div>'; arg.loaded = true; }
      const feed = PH().feed.slice().reverse();
      return logo + tabs + (feed.map(f => `<div class="ph-post"><div class="ph-row flat">${avatar(NPC[f.who].name, f.who)}<div class="ph-grow"><b>${NPC[f.who].name.toLowerCase()}${f.who === 'kemi' ? ' ✔️' : ''}</b><small>Day ${f.d}</small></div></div>
        <img src="${postImage(f)}" alt=""><div class="ph-pact"><button ${A(() => { if (f.liked) return; f.liked = true; f.likes++; if (state.people[f.who] && state.people[f.who].met) bond(f.who, 0.5); })}>${f.liked ? '❤️' : '🤍'} ${f.likes.toLocaleString()}</button>
        <button ${A(() => { if (f.cmt) return; f.cmt = true; if (state.people[f.who] && state.people[f.who].met) bond(f.who, 1); phToast('Comment posted: "🔥🔥 Nice one!"'); })}>💬 ${f.cmt ? 'Commented' : 'Comment'}</button></div>
        <div class="ph-cap"><b>${NPC[f.who].name.toLowerCase()}</b> ${esc(f.cap)}</div></div>`).join('') || '<div class="ph-pad dim">Your feed is empty. Check back tomorrow.</div>');
    }
    return logo + tabs + `<div class="ph-prof">${avatar(state.name, 'me', true)}<div><b>@${esc(G.handle)}</b><div class="ph-stats"><span><b>${G.posts.length}</b> posts</span><span><b>${G.followers.toLocaleString()}</b> followers</span><span><b>${G.following}</b> following</span></div><small>${esc(state.name)} · ${AREA.name}, ${AREA.city} 🇳🇬</small></div></div>
      <div class="ph-pad"><button class="ph-btn" ${A(() => PH().photos.length ? phGo('gallery', {pick:true}) : phToast('Take a photo with the Camera app first 📷'))}>➕ New post</button>${G.followers >= 3000 ? '<small class="dim"> Brands may contact you for sponsored posts 💼</small>' : ''}</div>
      <div class="ph-gridimg">${G.posts.map(p => `<div ${A(() => phGo('mypost', {id:p.id}))}><img src="${p.img}" alt=""><span>❤️ ${p.likes.toLocaleString()}</span></div>`).join('') || '<div class="ph-pad dim">No posts yet.</div>'}</div>`;
  },
  mypost: (arg) => {
    const p = PH().gram.posts.find(x => x.id === arg.id); if (!p) return VIEWS.gram({tab:'me'});
    return hdr('Post') + `<div class="ph-post"><img src="${p.img}" alt=""><div class="ph-pact"><span>❤️ ${p.likes.toLocaleString()} likes</span></div><div class="ph-cap"><b>@${esc(PH().gram.handle)}</b> ${esc(p.cap)}</div>${p.comments.map(c => `<div class="ph-cap"><b>${esc(c.who.toLowerCase())}</b> ${esc(c.t)}</div>`).join('')}<div class="ph-cap dim">Day ${p.d}</div></div>`;
  },
  gallery: (arg) => {
    const ph_ = PH().photos;
    return hdr(arg.pick ? 'Choose a photo' : 'Gallery', `<button class="ph-btn small" ${A(() => { enterCamera(); return false; })}>📷</button>`) + `<div class="ph-gridimg">${ph_.map(x => `<div ${A(() => phGo(arg.pick ? 'compose' : 'photo', {id:x.id}))}><img src="${x.img}" alt=""></div>`).join('') || '<div class="ph-pad dim">No photos yet. Open the Camera app, frame your shot and tap the shutter.</div>'}</div>`;
  },
  photo: (arg) => {
    const x = PH().photos.find(p => p.id === arg.id); if (!x) return VIEWS.gallery({});
    return hdr('Photo') + `<div class="ph-pad center"><img class="ph-big" src="${x.img}" alt=""><small class="dim">Day ${x.d} · ${esc(x.where || '')}</small><br>
      <button class="ph-btn" ${A(() => phGo('compose', {id:x.id}))}>📸 Post to NaijaGram</button>
      <button class="ph-btn red" ${A(() => { PH().photos = PH().photos.filter(p => p.id !== x.id); ph.stack.pop(); })}>🗑 Delete</button></div>`;
  },
  compose: (arg) => {
    const x = PH().photos.find(p => p.id === arg.id); if (!x) return VIEWS.gallery({});
    const caps = ['Living my best life 😎', 'Another day, another hustle 💪🏾', 'Home sweet home 🏠', `${AREA.name} vibes 🇳🇬`, 'God did! 🙏🏾', 'Soft life loading... ✨'];
    return hdr('New post') + `<div class="ph-pad center"><img class="ph-big" src="${x.img}" alt="">
      <div class="ph-input inline"><input id="phCap" type="text" maxlength="100" placeholder="Write a caption..."></div>
      <div class="ph-chips">${caps.map(cp => `<button ${A(() => { const i = $('phCap'); if (i) i.value = cp; return false; })}>${esc(cp)}</button>`).join('')}</div>
      <button class="ph-btn" data-send ${A(() => { const cap = ($('phCap') && $('phCap').value.trim()) || pick(caps); if (postToGram(x, cap) !== false){ ph.stack = [{app:'home'}, {app:'gram', arg:{tab:'me'}}]; } })}>Share 🚀</button></div>`;
  },

  bank: (arg) => {
    if (!state.nin) return hdr('NaijaBank') + '<div class="ph-pad">🏦 You need a bank account. Get your NIN at NIMC, then visit Naija Trust Bank.</div>';
    if (!arg.unlocked){
      return hdr('NaijaBank') + `<div class="ph-pad center"><div class="ph-banklogo">🏦</div><b>Enter your 4-digit PIN</b><div class="ph-dial">${'•'.repeat(ph.pin.length) || '&nbsp;'}</div><div class="ph-keys">${['1','2','3','4','5','6','7','8','9','','0','⌫'].map(d => d ? `<button ${A(() => {
        if (d === '⌫'){ ph.pin = ph.pin.slice(0, -1); return; }
        ph.pin += d; if (ph.pin.length === 4){ ph.pin = ''; if (!useData(2)) return; ph.stack[ph.stack.length - 1].arg = {unlocked:true}; }
      })}>${d}</button>` : '<span></span>').join('')}</div></div>`;
    }
    const p = PH();
    return hdr('NaijaBank', '<small class="ph-sub">Savings account</small>') + `<div class="ph-bankcard"><small>Available balance</small><div>${fmt(state.bank)}</div><small>Cash in hand: ${fmt(state.money)} · Acct: ${p.number.slice(1)}</small></div>
      <div class="ph-tiles"><button ${A(() => phGo('transfer', {}))}>💸<span>Transfer</span></button><button ${A(() => phGo('mytel', {}))}>📶<span>Airtime & data</span></button><button ${A(() => phToast('Deposits and withdrawals: visit the bank or an ATM.'))}>🏧<span>Cash</span></button></div>
      <div class="ph-sec">Recent transactions</div>${p.tx.slice().reverse().map(t => `<div class="ph-row flat"><div class="ph-grow"><b>${esc(t.desc)}</b><small>Day ${t.d} · ${fmtClock(t.h)}</small></div><b class="${t.amt < 0 ? 'red' : 'grn'}">${t.amt < 0 ? '-' : '+'}${fmt(Math.abs(t.amt))}</b></div>`).join('') || '<div class="ph-pad dim">No transactions yet.</div>'}`;
  },
  transfer: (arg) => {
    if (!arg.to){
      const list = contacts().filter(c => c.kind !== 'svc');
      return hdr('Transfer to') + list.map(c => `<div class="ph-row" ${A(() => { ph.stack[ph.stack.length - 1].arg = {to:c.key}; })}>${avatar(c.name, c.key)}<div class="ph-grow"><b>${esc(c.name)}</b><small>${numberOf(c).slice(1)} · NaijaTrust Bank</small></div></div>`).join('');
    }
    const c = contactByKey(arg.to);
    return hdr(`Send to ${esc(c.name)}`) + `<div class="ph-pad"><small>Balance: ${fmt(state.bank)}</small><div class="ph-chips">${[2000, 5000, 10000, 20000, 50000, 100000].map(a => `<button ${A(() => {
      if (state.bank < a){ phToast('Insufficient balance. Deposit cash at the bank.'); return; }
      if (!useData(2)) return;
      if (Math.random() < 0.08){ phToast('❌ Transaction failed: network error. ₦0 deducted. Please try again.'); return; }
      state.bank -= a; addTx(`Transfer to ${c.name.replace(' ❤️', '')}`, -a);
      if (c.kind === 'fam'){ c.m.sent = state.day; famRel(c.m.key, a >= 50000 ? 10 : a >= 10000 ? 5 : 2); gain('happy', 1); }
      else { const n = c.n; let v = a >= 20000 ? 6 : a >= 5000 ? 3 : 1; if (n.traits.includes('materialistic')) v *= 1.6; bond(n.id, v); if (isRomantic(n.id)) woo(n.id, v); chatAdd(n.id, 1, `Sent you ${fmt(a)} 💸`); chatAdd(n.id, 0, pick(CHAT.money)); state.unread[n.id] = 0; }
      if (a >= 50000) addHistory(`Transferred ${fmt(a)} to ${c.name.replace(' ❤️', '')}`, '💸');
      phToast(`✅ Transfer successful: ${fmt(a)} sent to ${c.name.replace(' ❤️', '')}.`); ph.stack.pop();
    })}>${fmt(a)}</button>`).join('')}</div></div>`;
  },
  mytel: () => {
    const p = PH();
    const buyA = a => { if (!spendAny(a)) return; p.airtime += a; addTx('Airtime recharge', -a); phToast(`✅ Recharge successful. Airtime: ${fmt(p.airtime)}`); };
    const buyD = (mb, a) => { if (!spendAny(a)) return; p.data += mb; addTx(`Data bundle ${dataStr(mb)}`, -a); phToast(`✅ You have bought ${dataStr(mb)}. Data balance: ${dataStr(p.data)}`); };
    return hdr('MyTel', '<small class="ph-sub">NaijaTel</small>') + `<div class="ph-bankcard yel"><small>Airtime</small><div>${fmt(p.airtime)}</div><small>Data: ${dataStr(p.data)} · ${netUp() ? 'Network OK' : 'Network down in your area'}</small></div>
      <div class="ph-sec">Buy airtime</div><div class="ph-chips">${[100, 200, 500, 1000].map(a => `<button ${A(() => buyA(a))}>${fmt(a)}</button>`).join('')}</div>
      <div class="ph-sec">Data plans</div>${[[500, 500], [1536, 1200], [3072, 2000], [10240, 5000]].map(([mb, a]) => `<div class="ph-row" ${A(() => buyD(mb, a))}><div class="ph-grow"><b>${dataStr(mb)}</b><small>Valid until used</small></div><b>${fmt(a)}</b></div>`).join('')}`;
  },
  maps: () => {
    let img = '';
    try { img = $('mini').toDataURL(); } catch (e) {}
    return hdr('Maps', `<small class="ph-sub">${AREA.name}</small>`) + (img ? `<img class="ph-map" src="${img}" alt="">` : '') + BUILDINGS.map(b => { const d = Math.round(Math.hypot(b.frontX - player.x, b.frontY - player.y) * S); return `<div class="ph-row" ${A(() => { state.nav = b.id; closePhone(); if (inside && inside.id !== b.id) toast(`Navigating to ${b.name}. Go outside and follow the yellow dots.`, 'info'); else toast(`Navigating to ${b.name}. Follow the yellow dots!`, 'info'); return false; })}><div class="ph-grow"><b>${esc(b.name)}</b><small>${addressOf(b)}${inside ? '' : ` · ${d} m`}</small></div><span>🧭</span></div>`; }).join('');
  },
  news: (arg) => {
    if (!arg.loaded){ if (!useData(5)) return hdr('News') + '<div class="ph-pad dim">Could not load the news.</div>'; arg.loaded = true; state.daily.paper = true; }
    return hdr('News', '<small class="ph-sub">Naija Daily</small>') + state.news.map((n, i) => `<div class="ph-news">${i === 0 ? '<span class="tag">TOP STORY</span>' : ''}<b>${esc(n)}</b><small>${AREA.city} · Day ${state.day}</small></div>`).join('') + `<div class="ph-news"><b>Market watch</b><small>Food price index today: ${Math.round(state.priceMod * 100)}%${fuelMod() > 1 ? ' · Fuel scarcity: prices +12%' : ''}</small></div>`;
  },
  life: (arg) => {
    const sec = arg.sec || 'profile';
    const tabs = `<div class="ph-tabs">${[['profile', 'Profile'], ['history', 'History'], ['people', 'People'], ['family', 'Family']].map(([t, l]) => `<button class="${t === sec ? 'on' : ''}" ${A(() => { ph.stack[ph.stack.length - 1].arg = {sec:t}; })}>${l}</button>`).join('')}</div>`;
    let body = '';
    if (sec === 'profile') body = `<div class="ph-pad lifep">${PANELS.profile().body}</div>`;
    else if (sec === 'history') body = `<div class="ph-pad lifep">${PANELS.history().body}</div>`;
    else if (sec === 'people') body = Object.keys(state.people).filter(id => NPC[id] && state.people[id].met).map(id => `<div class="ph-row" ${A(() => phGo('person', {id}))}>${avatar(NPC[id].name, id)}<div class="ph-grow"><b>${NPC[id].name}</b><small>${STAGE_LABEL[stageOf(id)]} · Friendship ${Math.round(state.people[id].rel)}${isRomantic(id) ? ` · Romance ${Math.round(state.people[id].rom)}` : ''}</small></div></div>`).join('') || '<div class="ph-pad dim">You have not met anyone yet.</div>';
    else body = state.family.members.map(m => `<div class="ph-row">${avatar(famLabel(m), 'fam:' + m.key)}<div class="ph-grow"><b>${m.first} ${state.family.surname}</b><small>${m.role} · ${famAge(m)} yrs · ${famStatus(m)} · Bond ${Math.round(m.rel)}</small></div><button class="ph-round green" ${A(() => callContact('fam:' + m.key))}>📞</button></div>`).join('') + `<div class="ph-pad"><button class="ph-btn" ${A(() => { closePhone(); openPanel('family'); return false; })}>🏡 Visit home / send money</button></div>`;
    return hdr('My Life') + tabs + body;
  },
  person: (arg) => { const n = NPC[arg.id]; return hdr(n.name) + `<div class="ph-pad lifep">${personBody(n)}</div>` + (state.people[arg.id].num ? `<div class="ph-pad"><button class="ph-btn" ${A(() => phGo('thread', {id:arg.id}))}>💬 Chat</button><button class="ph-btn green" ${A(() => callContact('npc:' + arg.id))}>📞 Call</button></div>` : ''); },
  notifs: () => {
    const rows = state.pending.slice().reverse().map(inst => {
      const via = inst.via || 'sms', ic = via === 'call' ? '📞' : via === 'chat' ? '💬' : '✉️';
      return `<div class="ph-row" ${A(() => {
        if (via === 'call') return callContact(inst.from, inst.key);
        if (via === 'chat') return phGo('thread', {id:inst.from});
        if (via === 'sms') return phGo('sms', {from:inst.from});
        closePhone(); openPanel('event', inst); return false;
      })}><div class="ph-av" style="background:#e67e22">${ic}</div><div class="ph-grow"><b>${esc(evTitle(inst))}</b><small>Day ${inst.day} · expires in ${Math.max(0, 2 - (state.day - inst.day))} day(s)</small></div></div>`;
    }).join('');
    return hdr('Alerts') + (rows || '<div class="ph-pad dim">You are all caught up ✅</div>');
  },
  settings: () => {
    const p = PH();
    return hdr('Settings') + `<div class="ph-sec">Wallpaper</div><div class="ph-walls">${WALLS.map((w, i) => `<div class="${p.wall === i ? 'on' : ''}" style="background:${w}" ${A(() => { p.wall = i; })}></div>`).join('')}</div>
      <div class="ph-row" ${A(() => { p.ring = !p.ring; })}><div class="ph-grow"><b>Ringtone</b><small>${p.ring ? 'On 🔔' : 'Silent 🔕'}</small></div></div>
      <div class="ph-row flat"><div class="ph-grow"><b>About phone</b><small>NaijaOS ${VERSION} · ${p.number} · Battery ${Math.round(p.battery)}%</small></div></div>`;
  }
};
