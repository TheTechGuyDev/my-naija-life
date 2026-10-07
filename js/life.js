'use strict';
/* =========================================================
   STATE, SAVE AND MIGRATION
   ========================================================= */
function newState(setup){
  const area = AREAS.find(a => a.id === setup.area) || AREAS[0];
  return {
    v:5, name:setup.name, gender:setup.gender, area:setup.area, religion:setup.religion || 'none', age0:18,
    money:2000000, bank:0, health:100, energy:100, hunger:75, happy:70, rep:50,
    day:1, minutes:7 * 60,
    nin:false, ninReadyDay:0,
    jamb:0, uni:null, degree:null, nysc:0, ppa:0, cv:false,
    job:null, skills:{}, kits:{},
    housing:0, maxHousing:0, rentDueDay:8, rentStrikes:0, levyDay:-99, rentMod:1,
    inv:{bread:1, water:1}, hasOkada:false, riding:false, noPhone:false,
    heat:0, arrests:0, yahooHits:0, lastStop:-9999, accidents:0,
    daily:{}, news:[], priceMod:1, heatNews:false, fuelShockUntil:0,
    nav:null, autoCam:true, guide:true, speed:1,
    px:B.home.frontX, py:B.home.frontY,
    earned:0, shifts:0, hustleEarned:0, lastWorship:-99,
    people:{}, partner:null, cheat:0, chats:{}, unread:{},
    family:genFamily(area), pending:[], evCool:{}, nextEventMin:600, loans:[], invest:[],
    history:[{d:1, t:`Started life in ${area.name}, ${area.city} with ₦2,000,000`, i:'🌱'}],
    flags:{}, home:{items:{}, paint:'cream'}
  };
}
let state = null;
const player = {x:B.home.frontX, y:B.home.frontY, face:Math.PI, anim:0, moving:false, y3:0};

function migrate(d){
  if (!d.v || d.v < 4){
    const area = AREAS.find(a => a.id === d.area) || AREAS[0];
    d.age0 = 18; d.happy = 70; d.religion = d.religion || 'none';
    d.family = genFamily(area);
    d.history = [{d:1, t:`Started life in ${area.name}, ${area.city}`, i:'🌱'}];
    if (d.jamb) d.history.push({d:d.day, t:`Passed JAMB (${d.jamb}/400)`, i:'✍️'});
    if (d.degree) d.history.push({d:d.day, t:`Graduated with ${d.degree.cls}`, i:'🎓'});
    if (d.nysc >= 3) d.history.push({d:d.day, t:'Completed NYSC', i:'🇳🇬'});
    if (d.job) d.history.push({d:d.day, t:`Working as ${JOB[d.job] ? JOB[d.job].name : 'staff'}`, i:'💼'});
    d.history.push({d:d.day || 1, t:'Upgraded to My Naija Life V4', i:'⬆️'});
    d.v = 4;
  }
  if (d.v < 5){ d.home = d.home || {items:{}, paint:'cream'}; d.v = 5; }
  return d;
}
function genNews(){
  const pool = NEWS.slice(), out = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  state.news = out.map(n => n.h);
  state.heatNews = out.some(n => n.heat);
  state.priceMod = clamp(out.reduce((a, n) => a * n.mod, 1), 0.85, 1.35);
}
const fuelMod = () => state.day < (state.fuelShockUntil || 0) ? 1.12 : 1;
const price = base => Math.max(10, Math.round(base * state.priceMod * AREA.cost * fuelMod() / 10) * 10);
const rentOf = i => Math.round(HOUSING[i].rent * AREA.cost * (state.rentMod || 1) / 1000) * 1000;
const hour = () => Math.floor(state.minutes / 60) % 24;
const inHours = (a, b) => hour() >= a && hour() < b;
const absMin = () => (state.day - 1) * 1440 + state.minutes;
const yearsPassed = () => Math.floor((state.day - 1) / YEAR_DAYS);
const ageNow = () => state.age0 + yearsPassed();

function saveGame(silent){
  if (!state) return;
  state.px = player.x; state.py = player.y;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); if (!silent) toast('Game saved.', 'info'); }
  catch (e) { if (!silent) toast('Could not save on this browser.', 'bad'); }
}
function loadGame(){
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) for (const k of OLD_SAVE_KEYS){ raw = localStorage.getItem(k); if (raw) break; }
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d.area) return false;
    AREA = AREAS.find(a => a.id === d.area) || AREAS[0];
    migrate(d);
    state = Object.assign(newState({name:d.name, gender:d.gender, area:d.area, religion:d.religion}), d);
    player.x = state.px; player.y = state.py;
    state.nextEventMin = Math.max(state.nextEventMin || 0, absMin() + 180);
    return true;
  } catch (e) { console.error(e); return false; }
}
function addHistory(t, i){
  state.history.push({d:state.day, t, i:i || '•'});
  if (state.history.length > 400) state.history.shift();
}

/* =========================================================
   CORE SYSTEMS
   ========================================================= */
function gain(stat, v){ state[stat] = clamp(state[stat] + v, 0, 100); }
function spend(c){
  if (state.money < c){ toast(`Not enough cash. You need ${fmt(c)}. Withdraw from the bank or hustle.`, 'bad'); return false; }
  state.money -= c; return true;
}
function payBill(c){
  const w = Math.min(state.money, c); state.money -= w;
  const b = Math.min(state.bank, c - w); state.bank -= b;
  return w + b;
}
function advanceTime(mins){
  state.minutes += mins;
  while (state.minutes >= 1440){ state.minutes -= 1440; newDay(); }
}
function newDay(){
  state.day++;
  state.daily = {};
  if (state.bank > 0) state.bank += state.bank * 0.0003;
  state.heat = clamp(state.heat - 5, 0, 100);
  genNews();
  if (state.day >= state.rentDueDay){
    const rent = rentOf(state.housing);
    if (state.money >= rent){ state.money -= rent; paidRent(rent); }
    else if (state.money + state.bank >= rent){ state.bank -= rent - state.money; state.money = 0; paidRent(rent); }
    else {
      state.rentStrikes++;
      gain('rep', -8);
      if (state.rentStrikes >= 3 && state.housing > 0){
        state.housing = 0; state.rentStrikes = 0; state.rentDueDay = state.day + 7;
        toast('Landlord don pack your load! You were moved back to a face-me-I-face-you room.', 'bad');
      } else {
        state.rentDueDay = state.day + 1;
        toast(`Landlord is on your case! Rent of ${fmt(rent)} is unpaid. Strike ${state.rentStrikes}/3.`, 'bad');
      }
    }
  }
  dailyLife();
  toast(`${WEEKDAYS[(state.day - 1) % 7]}, Day ${state.day} begins.`, 'info');
}
function paidRent(rent){ state.rentStrikes = 0; state.rentDueDay = state.day + 7; toast(`Weekly rent paid: ${fmt(rent)}`, 'info'); }
function faint(){
  payBill(20000);
  state.health = 45; state.energy = 40; state.hunger = Math.max(state.hunger, 40); gain('rep', -3);
  player.x = B.hospital.frontX; player.y = B.hospital.frontY; state.riding = false;
  advanceTime(360);
  addHistory('Collapsed and woke up in hospital', '🏥');
  toast('You collapsed! You woke up at General Hospital. Bill: ₦20,000. Eat and rest to avoid this.', 'bad');
  saveGame(true);
}
function accident(car){
  state.accidents++; gain('happy', -8); addHistory('Hit by a car on the road', '🚑');
  const loss = Math.round(30 + car.v / 4);
  state.health = clamp(state.health - loss, 5, 100);
  const bill = 35000 + (state.riding ? 50000 : 0);
  const paid = payBill(bill);
  const wasRiding = state.riding; state.riding = false;
  player.x = B.hospital.frontX; player.y = B.hospital.frontY;
  advanceTime(360);
  sfx('crash');
  const fl = $('flash'); fl.style.transition = 'none'; fl.style.opacity = '0.9'; requestAnimationFrame(() => { fl.style.transition = 'opacity 1.2s'; fl.style.opacity = '0'; });
  result('🚑 Road accident!', `<p>A ${car.type === 'danfo' ? 'danfo bus' : 'car'} hit you while you were on the road. Passers-by rushed you to <b>General Hospital</b>.</p>
    <div class="kv"><b>Health lost</b><span>-${loss}</span><b>Hospital bill</b><span>${fmt(paid)}${wasRiding ? ' (incl. okada repair)' : ''}</span><b>Time lost</b><span>6 hours</span></div>
    <div class="note">Stay safe: cross only at <b>zebra crossings</b> (white stripes). Cars stop for you there. Check both sides before you step on the road.</div>`);
}

/* =========================================================
   QUIZ ENGINE
   ========================================================= */
let quiz = null;
function draw(bank, n){
  return shuffle(bank).slice(0, n).map(([q, o]) => {
    const order = shuffle(o.map((_, i) => i));
    return {q, opts:order.map(i => o[i]), ans:order.indexOf(0)};
  });
}
function startQuiz(cfg){ quiz = {cfg, i:0, score:0, hints:cfg.hints || 0, removed:[]}; openPanel('quiz'); }
function answerQuiz(k){
  const Q = quiz.cfg.questions[quiz.i];
  if (k === Q.ans){ quiz.score++; toast('Correct ✅', 'good'); }
  else toast(`Wrong ❌ Answer: ${Q.opts[Q.ans]}`, 'bad');
  quiz.i++; quiz.removed = [];
  if (quiz.i >= quiz.cfg.questions.length){ finishQuiz(); return false; }
}
function finishQuiz(){
  const q = quiz; quiz = null;
  q.cfg.onDone(q.score, q.cfg.questions.length);
  if (panelState && panelState.kind === 'quiz') closePanel();
}
function result(title, body, options){
  openPanel('result', {title, body, options: options || [opt('Continue ▶', '', () => { closePanel(); return false; })]});
}

/* =========================================================
   EDUCATION, NYSC, JOBS, CRIME
   ========================================================= */
function examResult(s, n){
  const U = state.uni, pct = Math.round(s / n * 100);
  advanceTime(180); gain('energy', -15); gain('hunger', -10);
  if (pct >= 50){
    addHistory(`Passed ${U.level}L ${U.carry ? 'carryover' : 'exam'} (${pct}%)`, '📝'); gain('happy', 5);
    U.scores.push(pct); U.carry = false; U.lectures = 0; U.study = 0;
    if (U.level === 400){ graduate(); return; }
    if (U.level === 300){ U.needSiwes = true; U.siwes = 0; }
    U.level += 100; U.paid = false; gain('rep', 2);
    result('You passed! ✅', `<p>Score: <b>${pct}%</b>.</p><p>${U.needSiwes ? 'Next: do your SIWES/IT at the Business Hub, then pay your 400L fees.' : `You are now in <b>${U.level}L</b>. Pay your school fees to continue.`}</p>`);
  } else if (!U.carry){
    U.carry = true; U.lectures = 0; gain('rep', -1); gain('happy', -6); addHistory(`Got a carryover in ${U.level}L`, '😓');
    result('Carryover ❌', `<p>Score: <b>${pct}%</b>. Pass mark is 50%.</p><p>You have a <b>carryover</b>. Attend at least 1 lecture, then rewrite it for ₦20,000. Fail it again and you repeat the level.</p>`);
  } else {
    U.carry = false; U.paid = false; U.lectures = 0; gain('rep', -3); gain('happy', -10); addHistory(`Had to repeat ${U.level}L`, '😩');
    result('Repeat level 😓', `<p>Score: <b>${pct}%</b>. You failed your carryover.</p><p>You must <b>repeat ${U.level}L</b> and pay the school fees again.</p>`);
  }
}
function graduate(){
  const U = state.uni, avg = Math.round(U.scores.reduce((a, b) => a + b, 0) / U.scores.length);
  const cls = avg >= 85 ? 'First Class' : avg >= 70 ? 'Second Class Upper' : avg >= 60 ? 'Second Class Lower' : 'Third Class';
  state.degree = {dept:U.dept, cls, avg};
  state.uni = null; gain('rep', 10); gain('happy', 15);
  addHistory(`Graduated: B.Sc. ${DEPTS[U.dept].name}, ${cls}`, '🎓');
  familyCheer('Mum: "My graduate! I am so proud of you!" 🎓');
  result('🎓 Congratulations, graduate!', `<p>You earned a <b>B.Sc. ${DEPTS[U.dept].name}</b> with <b>${cls}</b> (average ${avg}%).</p><p>Next step: register for <b>NYSC</b> at the NYSC Secretariat.</p>`);
}
function jobBlock(j){
  if (state.job === j.id) return 'This is your current job.';
  if (j.needsOkada && !state.hasOkada) return 'Requires your own okada (Oga Motors).';
  if ((j.degree || j.dept) && !state.degree) return 'Requires a university degree.';
  if (j.dept && state.degree.dept !== j.dept) return `Requires a ${DEPTS[j.dept].name} degree.`;
  if (j.nysc && state.nysc < 3) return 'Requires your NYSC discharge certificate.';
  if (j.cv && !state.cv) return 'Print your CV at the Cyber Cafe first.';
  if (j.interview && state.daily['iv_' + j.id]) return 'You already interviewed for this today. Try again tomorrow.';
  if (j.interview && !inHours(8, 16)) return 'Interviews hold 8am to 4pm.';
  return null;
}
function startInterview(j){
  const qs = j.dept ? draw(Q_INTERVIEW, 2).concat(draw(DEPTS[j.dept].bank, 2)) : draw(Q_INTERVIEW, j.degree ? 4 : 3);
  startQuiz({title:`Interview: ${j.name}`, questions:qs, hints:0, onDone:(s, n) => {
    advanceTime(120); state.daily['iv_' + j.id] = true;
    let bonus = 0; const notes = [];
    if (state.daily.groomed){ bonus += 0.5; notes.push('fresh haircut (+0.5)'); }
    if (state.daily.dressed){ bonus += 0.25; notes.push('sharp outfit (+0.25)'); }
    if (state.happy < 25){ bonus -= 0.5; notes.push('low mood (-0.5)'); }
    if (state.rep >= 70){ bonus += 0.5; notes.push('good reputation (+0.5)'); }
    if (state.degree && state.degree.cls === 'First Class'){ bonus += 1; notes.push('First Class (+1)'); }
    else if (state.degree && state.degree.cls === 'Second Class Upper'){ bonus += 0.5; notes.push('2:1 (+0.5)'); }
    const need = Math.ceil(n * 0.7), total = s + bonus;
    if (total >= need){
      state.job = j.id; gain('rep', 2); sfx('ding'); gain('happy', 12); addHistory(`Hired as ${j.name}`, '💼'); familyCheer(`Dad: "A ${j.name}! Well done, my child!" 💼`);
      result('You got the job! 🎉', `<p>HR: "Congratulations ${state.name}! You resume immediately as our <b>${j.name}</b>."</p><p>Interview score: ${s}/${n}${notes.length ? ` + ${notes.join(', ')}` : ''}.</p><p>Come to the Business Hub every day (6am to 6pm) to work your shift and earn <b>${fmt(j.pay)}</b>.</p>`);
    } else {
      gain('happy', -4);
      result('Application declined 😞', `<p>HR: "We regret to inform you that you were not successful at this time."</p><p>Interview score: ${s}/${n}${notes.length ? ` + ${notes.join(', ')}` : ''}. You needed ${need}.</p><div class="note">Tips: get a haircut at Kutz before interviews, build your reputation, and try again tomorrow. Keep your side hustle going meanwhile.</div>`);
    }
  }});
}
function hustleBlock(h){
  if (state.daily.hustle) return 'You already did a side hustle today.';
  if (!inHours(7, 21)) return 'Hustling hours are 7am to 9pm.';
  if (state.energy < h.energy) return `Too tired. You need ${h.energy} energy.`;
  if (h.kit && !state.kits[h.kit]) return `You need a ${h.kitName} first.`;
  if (h.skill && !state.skills[h.skill]) return `Complete ${h.skillName} first.`;
  if (h.req === 'student' && !(state.uni || state.degree)) return 'Only university students or graduates can tutor.';
  if (h.req === 'cs' && !((state.degree && state.degree.dept === 'cs') || (state.uni && state.uni.dept === 'cs' && state.uni.level >= 300))) return 'Requires Computer Science 300L+ or a CS degree.';
  return null;
}
function arrest(reason){
  state.arrests++; addHistory('Arrested by the police', '🚔'); gain('happy', -10);
  player.x = B.police.frontX; player.y = B.police.frontY; state.riding = false;
  let seized = 0;
  if (state.heat >= 60){ seized = Math.round(state.money * 0.4); state.money -= seized; }
  openPanel('arrest', {reason, seized, bribeTried:false});
}
function detain(){
  advanceTime(3 * 1440);
  state.health = clamp(state.health - 25, 10, 100); state.energy = 25; state.hunger = 20;
  gain('rep', -15); gain('happy', -10); addHistory('Spent 3 days in police detention', '⛓️'); state.heat = clamp(state.heat - 40, 0, 100);
  let lost = '';
  if (state.job){ lost = ' Your employer sacked you for being absent.'; state.job = null; }
  result('Released after 3 days ⛓️', `<p>Cell life no easy at all. You are weak, hungry and your reputation took a hit.${lost}</p>`);
}
function checkpointComply(){
  if (state.heat >= 35 && Math.random() < 0.75){ arrest('Police searched your phone and found suspicious chats and transfers.'); return; }
  gain('rep', 1);
  result('You are free to go 👮🏾', '<p>"Oya waka. Next time carry your ID card."</p>');
}


/* =========================================================
   MONEY HELPERS
   ========================================================= */
function spendAny(c){
  c = Math.round(c);
  if (state.money + state.bank < c){ toast(`Not enough money. You need ${fmt(c)} (cash + bank).`, 'bad'); return false; }
  payBill(c); return true;
}

/* =========================================================
   SUGGESTED NEXT STEP (optional guide)
   ========================================================= */
function goal(o){
  const place = o && o.placeOnly;
  const fullBag = Object.keys(state.inv).some(k => state.inv[k] > 0 && ITEMS[k] && ITEMS[k].food);
  if (state.hunger < 30){
    if ((state.inv.foodstuff || 0) > 0 && !(inHours(7, 21) && state.money > 5000 && !place)) return {text:'You\'re hungry! Go home and cook with your foodstuff.', to:'home'};
    if (fullBag) return {text:`You're hungry! ${BAG} and eat, or go to Mama Nkechi's Buka.`, to:'mamaput'};
    return inHours(7, 21) ? {text:"You're hungry! Go and eat at Mama Nkechi's Buka.", to:'mamaput'} : {text:"You're hungry! The buka is closed. Try pepper soup at the Chill Spot, or the market from 6am.", to:hour() >= 12 || hour() < 2 ? 'joint' : 'market'};
  }
  if (state.energy < 18) return {text:'You are exhausted. Go home and sleep (after 6pm) or take a nap.', to:'home'};
  if (state.health < 30) return {text:'Your health is low. Go to General Hospital.', to:'hospital'};
  if (state.pending.length && !place) return {text:`📱 You have ${state.pending.length} notification${state.pending.length > 1 ? 's' : ''}. Tap 📱 to respond.`, to:null};
  if (state.happy < 25) return {text:'You are feeling down. Hang out with friends, call your family, or relax at the Chill Spot.', to:'joint'};
  if (!state.nin){
    if (!state.ninReadyDay) return {text:'Enrol for your NIN at the NIMC Enrolment Centre (8am to 4pm). JAMB, the bank and NYSC all need it.', to:'nimc'};
    return {text:'Your NIN is processing and arrives tomorrow. Meanwhile, meet people (press E near someone) or make money at Hustle Hub.', to:'hustle'};
  }
  if (!state.degree){
    if (!state.jamb) return {text:'Write JAMB at Unity University to gain admission (score 200+).', to:'uni'};
    const U = state.uni;
    if (!U) return {text:'Choose your department at Unity University.', to:'uni'};
    if (U.needSiwes) return {text:`Do your SIWES/IT at the Business Hub (${U.siwes || 0}/3 days).`, to:'jobs'};
    if (!U.paid) return {text:`Pay your ${U.level}L school fees at Unity University.`, to:'uni'};
    if (U.carry) return {text:U.lectures < 1 ? 'Attend 1 lecture, then rewrite your carryover exam.' : 'Rewrite your carryover exam at Unity University.', to:'uni'};
    return {text:U.lectures < 2 ? `Attend lectures at Unity University (${U.lectures}/2 before exam).` : `Write your ${U.level}L exam at Unity University.`, to:'uni'};
  }
  if (state.nysc === 0) return {text:'Register for NYSC at the NYSC Secretariat.', to:'nysc'};
  if (state.nysc === 1) return {text:'Go to NYSC orientation camp (NYSC Secretariat).', to:'nysc'};
  if (state.nysc === 2) return {text:state.ppa < 4 ? `Serve at your PPA (${state.ppa}/4 days) at the NYSC Secretariat.` : 'Collect your NYSC discharge certificate.', to:'nysc'};
  if (!state.cv) return {text:'Print your CV at the Cyber Cafe.', to:'cyber'};
  if (!state.job) return state.daily.groomed ? {text:'Apply for jobs at the Business Hub and pass the interview.', to:'jobs'} : {text:'Get a fresh haircut at Kutz before your interview, then go to the Business Hub.', to:'barber'};
  if (!state.daily.worked) return {text:'Go to work: the Business Hub (6am to 6pm).', to:'jobs'};
  if (!friendIds(30).length) return {text:'Make friends: walk up to people around town and talk to them. The Chill Spot is a good place to meet people.', to:'joint'};
  if (!state.daily.hustle) return {text:'Grow your side hustle at Hustle Hub.', to:'hustle'};
  return {text:'Good day! Spend time with people you care about, or go home and rest.', to:'home'};
}
function navTargetId(){ return state.nav || (state.guide ? goal({placeOnly:true}).to : null); }

/* =========================================================
   PEOPLE AND RELATIONSHIPS
   ========================================================= */
const NPC = {}; NPCS.forEach(n => NPC[n.id] = n);
const ROMANTIC = ['talking','dating','serious'];
function P(id){
  if (!state.people[id]) state.people[id] = {rel:0, rom:0, stage:null, met:false, num:false, known:[], likesKnown:[], dislikeKnown:null, mem:[], days:{}, lastContact:0, since:0, cool:0};
  return state.people[id];
}
function stageOf(id){
  const p = state.people[id];
  if (!p || !p.met) return 'stranger';
  if (p.stage) return p.stage;
  return p.rel >= 60 ? 'close' : p.rel >= 30 ? 'friend' : 'acquaintance';
}
const isRomantic = id => ROMANTIC.includes(stageOf(id));
const did = (id, k) => P(id).days[k] === state.day;
const mark = (id, k) => { P(id).days[k] = state.day; };
const npcAge = n => n.age + yearsPassed();
const canDate = n => n.g !== state.gender && !n.taken;
const npcDisplay = n => (n.police || stageOf(n.id) !== 'stranger') ? n.name : `the ${n.role.toLowerCase()}`;
function friendIds(min, needNum){ return Object.keys(state.people).filter(id => NPC[id] && state.people[id].rel >= (min || 30) && (!needNum || (state.people[id].num && !state.noPhone))); }

function compat(n){
  let c = 0;
  const t = n.traits, worth = state.money + state.bank;
  const busy = !!state.job || !!state.uni || state.hustleEarned > 50000;
  if (t.includes('ambitious')) c += busy ? 6 : -6;
  if (t.includes('educated')) c += state.degree ? 7 : state.uni ? 4 : -4;
  if (t.includes('materialistic')) c += worth > 1500000 ? 6 : worth > 500000 ? 2 : -7;
  if (t.includes('frugal')) c += state.bank > 300000 ? 5 : -1;
  if (t.includes('religious')){ c += state.religion === n.rel ? 8 : state.religion === 'none' ? -4 : -2; if (state.day - state.lastWorship <= 7) c += 3; }
  if (t.includes('family')) c += famAvg() >= 60 ? 4 : -2;
  if (t.includes('jealous') && state.partner && state.partner !== n.id) c -= 4;
  c += (state.rep - 50) / 10;
  if (state.heat > 40) c -= 5;
  if (state.happy < 25) c -= 2;
  return Math.round(clamp(c, -20, 25));
}
function bond(id, amt){
  const n = NPC[id], p = P(id);
  if (amt > 0){ if (n.traits.includes('introvert')) amt *= 0.7; if (n.traits.includes('social')) amt *= 1.2; }
  const before = p.rel;
  p.rel = clamp(p.rel + amt, 0, 100);
  p.met = true; p.lastContact = state.day;
  if (p.stage === 'ex' && p.rel >= 45) p.stage = null;
  [12, 35, 55].forEach((th, i) => {
    const tr = n.traits[i];
    if (tr && before < th && p.rel >= th && !p.known.includes(tr)){ p.known.push(tr); toast(`${TRAITS[tr].icon} You noticed ${n.name} is ${TRAITS[tr].label.toLowerCase()}.`, 'info'); }
  });
  if (!p.stage){
    if (before < 30 && p.rel >= 30){ addHistory(`Became friends with ${n.name}`, '🤝'); toast(`🤝 You and ${n.name} are now friends!`, 'good'); }
    if (before < 60 && p.rel >= 60) addHistory(`${n.name} became a close friend`, '💛');
  }
  refreshLabel(id);
}
function woo(id, amt){
  const n = NPC[id], p = P(id);
  if (amt > 0 && n.traits.includes('loyal')) amt *= 1.1;
  p.rom = clamp(p.rom + amt, 0, 100); p.lastContact = state.day;
}
function remember(id, tag){ const p = P(id); p.mem.push({tag, d:state.day}); if (p.mem.length > 8) p.mem.shift(); }
function lastMem(id, within){ const p = P(id), m = p.mem[p.mem.length - 1]; return m && state.day - m.d <= (within || 3) ? m.tag : null; }
function greetLine(n){
  const st = stageOf(n.id);
  if (st === 'stranger') return '(You have never spoken to this person.)';
  const map = {gift:'Thank you for that gift again! 😊', date:'I really enjoyed our time together 🥰', hangout:'That hangout was fun! We should do it again.', loan:'Thanks for helping me with that money. I no go forget.', refused:'Hmm. You dey hold your money tight o.', argument:"I'm still a bit upset with you.", breakup:'What do you want?', meh:'Hey.'};
  const m = lastMem(n.id, 4);
  if (m && map[m]) return map[m];
  if (st === 'dating' || st === 'serious') return pick(['Hey love ❤️ I missed you!', 'My baby! How your day dey go? 🥰', 'There you are! 😊']);
  if (st === 'talking') return pick(['Hey you 😊', 'Look who it is! 🙈', 'I was just thinking about you 😄']);
  if (st === 'ex') return pick(['Oh. Hi.', 'Hmm. Hello.']);
  return `${AREA.greet}! ` + pick(LINES);
}

function actIntro(n){
  const p = P(n.id);
  p.met = true; bond(n.id, 5 + Math.max(0, compat(n)) / 5); mark(n.id, 'greet');
  return `${AREA.greet}! I'm ${n.name}. I'm a ${n.role.toLowerCase()} around here. Nice to meet you, ${state.name}!`;
}
function actGreet(n){
  mark(n.id, 'greet'); bond(n.id, 2 + Math.max(0, compat(n)) / 10); gain('happy', 1);
  if (isRomantic(n.id)) woo(n.id, 2);
  return pick(['Ehen! Good to see you.', 'You too! How market?', 'I dey, thank God.', 'Always nice to see you.']);
}
function actGist(n, topic){
  mark(n.id, 'gist'); advanceTime(30);
  const p = P(n.id);
  let amt, line;
  if (n.likes.includes(topic)){ amt = 6; line = pick(['Ah! You sabi this thing o! 😄', 'Now you are talking! I love this topic.', 'We fit talk this one till tomorrow 😂']); if (!p.likesKnown.includes(topic)) p.likesKnown.push(topic); }
  else if (n.dislikes === topic){ amt = -4; line = pick(['Abeg, I no too like that topic.', 'Can we talk about something else?', 'Hmm. That one no concern me.']); p.dislikeKnown = topic; }
  else { amt = 2; line = pick(['Hmm, interesting.', 'Okay o, I hear you.', 'True talk.']); }
  amt += compat(n) / 8;
  bond(n.id, amt); if (isRomantic(n.id)) woo(n.id, amt / 2);
  gain('happy', amt > 0 ? 2 : -1);
  return line;
}
function actNumber(n){
  const p = P(n.id); mark(n.id, 'num');
  if (p.rel + compat(n) >= 22){ p.num = true; const l = pick(CHAT.agreeNum); chatAdd(n.id, 0, `Hi ${state.name}, it's ${n.name} 😊`); state.unread[n.id] = 0; return l; }
  bond(n.id, -1); return pick(CHAT.refuseNum);
}
const outingCost = o => Math.round(o.cost * AREA.cost / 100) * 100;
function outingBlock(n, o){
  if (did(n.id, 'out')) return `You already went out with ${n.name} today.`;
  if (o.id === 'worship' && (state.religion === 'none' || n.rel !== state.religion)) return 'Only if you share the same faith.';
  if (state.energy < 15) return 'You are too tired to go out.';
  if (hour() >= 23 || hour() < 7) return 'It is too late to go out now.';
  return null;
}
function actOuting(n, o){
  const p = P(n.id), romantic = isRomantic(n.id);
  const willing = romantic ? p.rom + compat(n) + 30 : p.rel + compat(n);
  if (willing < 25 || Math.random() < 0.1){ mark(n.id, 'out'); return {ok:false, line:pick(CHAT.declineOut)}; }
  const cost = outingCost(o);
  if (cost && !spendAny(cost)) return null;
  mark(n.id, 'out'); advanceTime(o.mins); gain('energy', -8);
  if (o.food) gain('hunger', o.food);
  if (o.id === 'worship') state.lastWorship = state.day;
  let score = 6 + rint(-3, 6) + compat(n) / 4;
  n.traits.forEach(t => { const pr = VIBE_PREF[t]; if (pr && pr[o.vibe]) score += pr[o.vibe]; });
  score = Math.round(score);
  bond(n.id, romantic ? score * 0.5 : score); if (romantic) woo(n.id, score);
  gain('happy', clamp(4 + score / 2, 0, 12));
  remember(n.id, score >= 4 ? (romantic ? 'date' : 'hangout') : 'meh');
  const line = score >= 12 ? pick(["This was the best time I've had in a while! 🥰", "I enjoyed every moment! Let's do this again ❤️"]) : score >= 4 ? pick(['That was nice 😊', 'I enjoyed myself, thank you!']) : pick(['Hmm, it was okay.', 'Not really my kind of place, but thanks.']);
  return {ok:true, score, line};
}
function actGift(n, k){
  const it = ITEMS[k]; state.inv[k]--; mark(n.id, 'gift');
  let v = it.gift;
  if (n.traits.includes('materialistic')) v *= 1.5;
  if (n.traits.includes('frugal') && it.price > 25000) v *= 0.6;
  v = Math.round(v + compat(n) / 6);
  bond(n.id, v); if (isRomantic(n.id)) woo(n.id, v);
  remember(n.id, 'gift'); gain('happy', 2);
  return v >= 15 ? 'Wow! This is so thoughtful! Thank you! 😍' : v >= 7 ? 'Aww, thank you! 😊' : 'Oh, thanks.';
}
function interestBlock(n){
  const p = P(n.id);
  if (n.taken) return `${n.name} is married.`;
  if (n.g === state.gender) return 'Friendship only.';
  if (p.cool > state.day) return `Give ${n.name} some time before trying again.`;
  if (p.rel < 35) return `Get closer first (friendship ${Math.round(p.rel)}/35).`;
  return null;
}
function cheatCheck(otherId){
  if (!state.partner || state.partner === otherId) return;
  const pn = NPC[state.partner];
  let ch = 0.25; if (pn.traits.includes('jealous')) ch += 0.3; if (pn.traits.includes('loyal')) ch -= 0.08;
  state.cheat++;
  if (Math.random() < ch) queueNow({id:'caught', ctx:{partner:state.partner, other:otherId}});
}
function actInterest(n){
  const p = P(n.id);
  const chance = clamp((p.rel + compat(n) * 1.5 + (state.rep - 50) / 3 - 25) / 55, 0.08, 0.9);
  cheatCheck(n.id);
  if (Math.random() < chance){
    p.stage = 'talking'; p.rom = 25; p.since = state.day; p.lastContact = state.day;
    addHistory(`Started talking with ${n.name}`, '💬'); gain('happy', 6); remember(n.id, 'flirt'); refreshLabel(n.id);
    return {ok:true, line:pick(["Hehe 🙈 I've been waiting for you to say something!", 'Really? I like you too 😊', 'Ehen! So you noticed me 😄'])};
  }
  p.cool = state.day + 3; bond(n.id, -5); gain('happy', -4);
  return {ok:false, line:pick(['I see you as a friend, abeg.', "Ehn... I'm not looking for that right now.", "Let's just be friends 🙏🏾"])};
}
function actAskOut(n){
  const p = P(n.id);
  const chance = clamp((p.rom + compat(n) - 15) / 55, 0.1, 0.95);
  if (Math.random() < chance){
    p.stage = 'dating'; p.since = state.day; state.partner = n.id; woo(n.id, 8);
    addHistory(`Started dating ${n.name}`, '❤️'); gain('happy', 12); refreshLabel(n.id); sfx('ding');
    return {ok:true, line:"Yes! I thought you'd never ask ❤️"};
  }
  p.cool = state.day + 2; woo(n.id, -6);
  return {ok:false, line:"I'm not ready yet. Let's keep talking first."};
}
function actSerious(n){
  const p = P(n.id); p.stage = 'serious'; woo(n.id, 5); refreshLabel(n.id); sfx('ding');
  addHistory(`Entered a serious relationship with ${n.name}`, '💑'); gain('happy', 10);
  familyCheer(`Mum: "I heard about ${n.name}! When are you bringing ${n.g === 'f' ? 'her' : 'him'} home?" 😄`);
  return 'Me and you, for real now ❤️';
}
function breakUp(id, byThem){
  const n = NPC[id], p = P(id);
  const wasTalking = p.stage === 'talking';
  p.stage = 'ex'; p.rom = 0; p.rel = Math.max(0, p.rel - 30);
  if (state.partner === id) state.partner = null;
  remember(id, 'breakup'); gain('happy', byThem ? -18 : -8);
  addHistory(wasTalking ? `Stopped talking with ${n.name}` : byThem ? `${n.name} broke up with you` : `Broke up with ${n.name}`, '💔');
  refreshLabel(id);
}

/* Phone chats */
function chatAdd(id, mine, text){
  const c = state.chats[id] || (state.chats[id] = []);
  c.push({m:mine ? 1 : 0, t:text, d:state.day, h:Math.floor(state.minutes)});
  if (c.length > 40) c.shift();
  if (!mine) state.unread[id] = (state.unread[id] || 0) + 1;
}
function chatCheck(n){
  mark(n.id, 'chat'); const p = P(n.id);
  chatAdd(n.id, 1, pick(CHAT.checkMe));
  const warm = p.rel >= 25 || isRomantic(n.id);
  chatAdd(n.id, 0, pick(warm ? CHAT.checkWarm : CHAT.checkCold)); state.unread[n.id] = 0;
  bond(n.id, warm ? 2 : 0.5); if (isRomantic(n.id)) woo(n.id, 2);
}
function chatFlirt(n){
  mark(n.id, 'flirt'); const p = P(n.id);
  chatAdd(n.id, 1, pick(CHAT.flirtMe));
  const good = p.rom + compat(n) >= 30 || Math.random() < 0.6;
  chatAdd(n.id, 0, pick(good ? CHAT.flirtWarm : CHAT.flirtCold)); state.unread[n.id] = 0;
  woo(n.id, good ? rint(3, 6) : -2); gain('happy', good ? 2 : 0);
  cheatCheck(n.id);
}
function chatCall(n){
  mark(n.id, 'call'); advanceTime(20);
  bond(n.id, 3); if (isRomantic(n.id)) woo(n.id, 3); gain('happy', 2);
  return pick(CHAT.callWarm);
}
function chatSend(n, amt){
  if (!spendAny(amt)) return false;
  mark(n.id, 'send');
  let v = amt >= 20000 ? 6 : 3; if (n.traits.includes('materialistic')) v *= 1.6;
  bond(n.id, v); if (isRomantic(n.id)) woo(n.id, v);
  chatAdd(n.id, 1, `Sent you ${fmt(amt)} 💸`); chatAdd(n.id, 0, pick(CHAT.money)); state.unread[n.id] = 0;
  return true;
}

/* =========================================================
   FAMILY
   ========================================================= */
function genFamily(area){
  const R = REGIONS[area.region] || REGIONS.sw;
  const used = new Set(), uniq = arr => { const a = shuffle(arr).find(x => !used.has(x)) || arr[0]; used.add(a); return a; };
  const members = [
    {key:'dad', role:'Father', first:uniq(R.male), g:'m', age:rint(50, 60), rel:70},
    {key:'mum', role:'Mother', first:uniq(R.female), g:'f', age:rint(46, 56), rel:75}
  ];
  const n = rint(1, 3);
  for (let i = 0; i < n; i++){ const g = Math.random() < 0.5 ? 'm' : 'f'; members.push({key:'sib' + i, role:g === 'm' ? 'Brother' : 'Sister', first:uniq(g === 'm' ? R.kidsM : R.kidsF), g, age:rint(12, 27), rel:rint(55, 75)}); }
  return {surname:pick(R.surnames), town:pick(R.towns), travel:R.travel, members, lastVisit:0};
}
const fam = key => state.family.members.find(m => m.key === key);
const famAge = m => m.age + yearsPassed();
function famAvg(){ const m = state.family.members; return m.reduce((a, x) => a + x.rel, 0) / m.length; }
function famRel(key, v){ const m = fam(key); if (m) m.rel = clamp(m.rel + v, 0, 100); }
function famStatus(m){
  if (m.key === 'dad' || m.key === 'mum') return `Lives in ${state.family.town}`;
  const a = famAge(m);
  return a < 18 ? 'In secondary school' : a < 23 ? 'University student' : 'Working';
}
function familyCheer(text){ famRel('mum', 5); famRel('dad', 3); gain('happy', 5); if (!state.noPhone) toast('📱 ' + text, 'good'); }
function famCall(m){
  m.called = state.day; advanceTime(15); famRel(m.key, 4); gain('happy', 2);
  const lines = {dad:['"My son/daughter! Stay focused and serve God."', '"How is work? Make sure you save money."'], mum:['"Are you eating well? Don\'t starve yourself o!"', '"I pray for you every day, my child."']};
  return (lines[m.key] ? pick(lines[m.key]) : pick(['"I miss you! When are you coming home?"', '"Abeg send me data 😂"', '"School is stressing me but I\'m trying."'])).replace('son/daughter', state.gender === 'f' ? 'daughter' : 'son');
}
function famSend(m, amt){
  if (!spendAny(amt)) return false;
  m.sent = state.day; famRel(m.key, amt >= 50000 ? 10 : 5); gain('happy', 1);
  if (amt >= 50000) addHistory(`Sent ${fmt(amt)} to ${m.role.toLowerCase()} ${m.first}`, '💸');
  return true;
}
function famVisitCost(){ return Math.round(state.family.travel * AREA.cost / 500) * 500 * 2; }
function famVisit(){
  if (!spendAny(famVisitCost())) return false;
  advanceTime(1440);
  state.family.members.forEach(m => famRel(m.key, 10));
  state.family.lastVisit = state.day;
  gain('happy', 15); state.hunger = 100; gain('energy', 20);
  addHistory(`Visited family in ${state.family.town}`, '🏡');
  return true;
}

/* =========================================================
   LIFE EVENTS ENGINE
   ========================================================= */
const EVENT = {}; EVENTS.forEach(e => EVENT[e.id] = e);
const nowQueue = [];
function maybeEvent(){
  const m = absMin();
  if (m < state.nextEventMin) return;
  state.nextEventMin = m + rint(240, 560);
  if (state.day < 2) return;
  const cands = EVENTS.filter(e => e.w && (state.evCool[e.id] || 0) <= state.day && (!e.cond || e.cond()));
  if (!cands.length) return;
  let r = Math.random() * cands.reduce((a, e) => a + e.w, 0);
  const e = cands.find(x => (r -= x.w) <= 0) || cands[0];
  fireEvent(e.id, e.ctx ? e.ctx() : {});
}
function fireEvent(id, ctx){
  const e = EVENT[id]; if (!e) return;
  state.evCool[id] = state.day + (e.cool || 5);
  const inst = {id, ctx:ctx || {}, day:state.day, key:Date.now() + '_' + Math.random()};
  if (e.phone && !state.noPhone){ state.pending.push(inst); toast(`📱 ${evTitle(inst)}`, 'info'); sfx('ring'); }
  else queueNow(inst);
}
function queueNow(inst){
  if (inst.day === undefined) inst.day = state.day;
  if (!inst.key) inst.key = Date.now() + '_' + Math.random();
  if (!inst.ctx) inst.ctx = {};
  nowQueue.push(inst);
  flushQueue();
}
function flushQueue(){ if (state && !panelState && nowQueue.length) openPanel('event', nowQueue.shift()); }
const evTitle = inst => EVENT[inst.id].title(inst.ctx);
function resolveEvent(inst, idx, silent){
  const e = EVENT[inst.id], o = e.options(inst.ctx)[idx];
  const msg = o.action();
  if (msg === false) return false;
  state.pending = state.pending.filter(x => x.key !== inst.key);
  if (silent) toast(`⏰ No response: ${evTitle(inst)} ${msg || ''}`, 'bad');
  return msg || '';
}

/* =========================================================
   DAILY LIFE (runs at the start of every new day)
   ========================================================= */
function dailyLife(){
  if (!state.nin && state.ninReadyDay && state.day >= state.ninReadyDay){
    state.nin = true; addHistory('NIN issued by NIMC', '🪪');
    toast('📱 SMS from NIMC: Your NIN has been generated. You can now write JAMB, bank and serve NYSC.', 'good');
  }
  if (state.day > 1 && (state.day - 1) % YEAR_DAYS === 0){
    const a = ageNow();
    addHistory(`Turned ${a}`, '🎂'); gain('happy', 8); famRel('mum', 2);
    toast(`🎂 Happy birthday, ${state.name}! You are now ${a}.`, 'good');
    if (!state.noPhone) friendIds(30, true).forEach(id => chatAdd(id, 0, pick(CHAT.birthday)));
  }
  Object.keys(state.people).forEach(id => {
    const p = state.people[id], n = NPC[id]; if (!n) return;
    const gap = state.day - (p.lastContact || 0);
    if (ROMANTIC.includes(p.stage)){
      let decay = p.stage === 'talking' ? 3 : 2;
      if (n.traits.includes('loyal')) decay -= 1;
      if (n.traits.includes('jealous') || n.traits.includes('family')) decay += 1;
      if (gap >= 2) p.rom = clamp(p.rom - decay * (gap >= 4 ? 2 : 1), 0, 100);
      if (p.rom <= 10){
        if (p.stage === 'talking'){ breakUp(id, true); toast(`💬 ${n.name} stopped replying. The talking stage is over.`, 'bad'); }
        else queueNow({id:'dumped', ctx:{who:id}});
      } else {
        if (p.num && !state.noPhone && p.stage !== 'talking' && Math.random() < 0.7) chatAdd(id, 0, pick(CHAT.morningPartner));
        if (p.stage !== 'talking' && p.rom >= 60) gain('happy', 2);
      }
    } else if (p.rel > 20 && gap > 5) p.rel = Math.max(20, p.rel - 0.7);
    if (p.num && !state.noPhone && !ROMANTIC.includes(p.stage) && p.rel >= 35 && gap > 3 && Math.random() < 0.15) chatAdd(id, 0, pick(CHAT.friendPing));
  });
  state.family.members.forEach(m => { if (state.day - Math.max(m.called || 0, m.sent || 0, state.family.lastVisit || 0) > 6) m.rel = clamp(m.rel - 1, 0, 100); });
  state.loans = state.loans.filter(l => {
    if (state.day < l.due) return true;
    const n = NPC[l.who];
    if (l.repay){ state.bank += l.amt; toast(`💸 ${n.name} paid back ${fmt(l.amt)}. Correct person!`, 'good'); bond(l.who, 4); }
    else { toast(`😒 ${n.name} has not paid back your ${fmt(l.amt)}. The money don go.`, 'bad'); P(l.who).rel = Math.max(0, P(l.who).rel - 5); gain('happy', -3); }
    return false;
  });
  state.invest = state.invest.filter(v => {
    if (state.day < v.due) return true;
    const n = NPC[v.who];
    if (v.win){ const back = Math.round(v.amt * 1.8); state.bank += back; toast(`📈 ${n.name}'s business worked! You got back ${fmt(back)}.`, 'good'); addHistory(`Investment with ${n.name} paid off`, '📈'); bond(v.who, 5); }
    else { toast(`📉 ${n.name}'s business failed. Your ${fmt(v.amt)} is gone.`, 'bad'); gain('happy', -5); }
    return false;
  });
  let dh = 0;
  if (!state.job && !state.uni && state.nysc !== 2 && state.day > 10) dh -= 2;
  if (state.job || state.uni) dh += 1;
  const fr = friendIds(30).length;
  if (fr === 0 && state.day > 6) dh -= 1; else dh += Math.min(2, fr * 0.5);
  if (state.housing >= 2) dh += 1;
  if (state.money + state.bank < 20000) dh -= 3;
  if (state.heat > 50) dh -= 1;
  if (famAvg() < 40) dh -= 1;
  gain('happy', dh);
  const expired = state.pending.filter(x => state.day - x.day >= 2);
  expired.forEach(x => resolveEvent(x, EVENT[x.id].ignore, true));
}
