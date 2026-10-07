'use strict';
/* =========================================================
   MARRIAGE AND CHILDREN (V5.3)
   Serious relationship → proposal → introduction → bride price
   → traditional wedding → church / nikkah / court wedding →
   spouse moves in → pregnancy → birth → naming → school fees.
   ========================================================= */
STAGE_LABEL.engaged = 'Engaged 💍'; STAGE_LABEL.married = 'Married 💍';
ROMANTIC.push('engaged', 'married');
ITEMS.ring = {name:'Engagement ring 💍', price:350000, ingredient:true};

const KIDS = () => state.kids || (state.kids = []);
const kidAge = k => Math.floor((state.day - k.born) / YEAR_DAYS);
const kidStage = k => { const a = kidAge(k); return a < 1 ? 'Baby' : a < 3 ? 'Toddler' : a < 6 ? 'Nursery school' : a < 12 ? 'Primary school' : a < 18 ? 'Secondary school' : 'Grown up'; };
const spouseN = () => state.spouse ? NPC[state.spouse] : null;
const hisHer = n => n.g === 'f' ? 'her' : 'his', himHer = n => n.g === 'f' ? 'her' : 'him';
const BRIDE_PRICE = {sw:300000, se:900000, ss:600000, nw:250000, nc:300000};
const TERM_DAYS = 7;

/* ---------- proposal ---------- */
function proposeBlock(n){
  const p = P(n.id);
  if (!(state.inv.ring > 0)) return `Buy an engagement ring at ${AREA.market} first.`;
  if (p.cool > state.day) return 'Give it some time before asking again.';
  if (p.rom < 75) return `Romance needs to be 75+ (${Math.round(p.rom)}).`;
  if (state.day - p.since < 8) return `You have only been together ${state.day - p.since} days. Wait at least 8.`;
  return null;
}
function propose(n){
  const p = P(n.id), worth = state.money + state.bank;
  let ch = (p.rom + compat(n) * 1.5 - 40) / 50;
  if (n.traits.includes('materialistic') && worth < 1000000) ch -= 0.2;
  if (n.traits.includes('family')) ch += 0.1;
  const yes = Math.random() < clamp(ch, 0.15, 0.95);
  closePanel();
  if (n.x !== undefined) player.face = Math.atan2(n.x - player.x, n.y - player.y);
  runScene([
    {pose:'sit', y:-0.3},
    {say:['player', `${n.name}... I love you. Will you marry me? 💍`], ms:2300},
    {say:[{name:n.name}, yes ? pick(['Yes! Yes! A thousand times yes! 😭❤️', 'Oh my God! YES! 💍😍']) : pick(['Ehn... I\'m not ready for marriage yet. 😔', 'Please stand up... Let\'s talk about this later.'])], ms:2300},
    {pose:null}
  ]).then(() => {
    if (yes){
      state.inv.ring--; p.stage = 'engaged'; woo(n.id, 10); refreshLabel(n.id); sfx('ding');
      const rk = pick(Object.keys(REGIONS)), R = REGIONS[rk];
      state.wed = {who:n.id, step:0, region:rk, surname:pick(R.surnames), town:pick(R.towns), dad:pick(R.male), mum:pick(R.female), introCool:0};
      addHistory(`Got engaged to ${n.name} 💍`, '💍'); gain('happy', 15); gain('rep', 2);
      familyCheer(`Mum: "My child is getting married?! Bring ${himHer(n)} home for introduction!" 😭🎉`);
      result('Engaged! 💍', `<p>${n.name} said <b>YES</b>!</p><p>Next: plan the wedding. Open <b>Menu → Wedding plans 💍</b> or talk to ${n.name}. Steps: introduction, bride price, traditional wedding, then a church, mosque or court wedding.</p>`, [opt('See wedding plans 💍', '', () => { openPanel('wedding'); return false; }), opt('Continue', '', () => { closePanel(); return false; })]);
    } else {
      p.cool = state.day + 4; woo(n.id, -8); gain('happy', -10); gain('rep', -1);
      addHistory(`${n.name} turned down your proposal`, '💔');
      result('Not yet... 💔', `<p>${n.name} said no, for now. You kept the ring. Build the relationship and try again in a few days.</p>`);
    }
  });
}

/* ---------- wedding steps ---------- */
function travelCost(){ const w = state.wed; return Math.round((REGIONS[w.region] || REGIONS.sw).travel * AREA.cost / 500) * 500 * 2; }
function introCost(){ return travelCost() + price(100000); }
function bridePrice(){ return Math.round((BRIDE_PRICE[state.wed.region] || 300000) * AREA.cost / 10000) * 10000; }
const tradCost = () => Math.round(1500000 * AREA.cost / 10000) * 10000;
const WED_TYPES = {
  church:{name:'Church wedding ⛪', venue:'church', cost:1200000, rel:'christian', line:'Do you take this person to be your lawfully wedded spouse, for better, for worse, till death do you part?'},
  nikkah:{name:'Nikkah 🕌', venue:'mosque', cost:500000, rel:'muslim', line:'The mahr has been agreed. Do you accept this marriage before Allah and these witnesses?'},
  court:{name:'Court registry wedding 🏛️', venue:'lg', cost:80000, rel:null, line:'Do you take this person as your lawful spouse under the Marriage Act?'}
};
const wedCost = t => Math.round(WED_TYPES[t].cost * AREA.cost / 10000) * 10000;
function wedTypeBlock(t, n){
  const T = WED_TYPES[t];
  if (T.rel && state.religion !== T.rel && n.rel !== T.rel) return `Neither of you is ${T.rel === 'christian' ? 'Christian' : 'Muslim'}.`;
  if (state.housing < 1) return 'Your in-laws will not let their child move into a face-me-I-face-you. Get at least a self-contain first.';
  return null;
}
function doIntro(){
  const w = state.wed, n = NPC[w.who];
  if (!spendAny(introCost())) return;
  closePanel();
  let score = state.rep + (state.job ? 15 : 0) + (state.degree ? 10 : 0) + (state.uni ? 5 : 0) + (state.arrests ? -10 : 0) + rint(-10, 10);
  if (state.gender === 'f') score += 25;
  if (n.traits.includes('religious') && state.religion !== n.rel) score -= 10;
  const ok = score >= 60;
  const myFam = state.gender === 'f';
  runScene([
    {fade:myFam ? `🏡 ${n.name}'s family visits the ${state.family.surname}s in ${state.family.town}...` : `🚌 Travelling to ${w.town} to meet the ${w.surname} family...`, ms:1800},
    {say:[{name:myFam ? `Mr. ${state.family.surname}` : `Mr. ${w.surname} (${w.dad})`}, myFam ? `So you are the young person asking for our daughter's hand. Sit down, let us talk.` : `Young ${state.gender === 'f' ? 'lady' : 'man'}, what do you do for a living? How will you take care of our ${n.g === 'f' ? 'daughter' : 'son'}?`], ms:2600},
    {say:['player', state.job ? `I work as ${JOB[state.job].name}, sir. I will take good care of ${himHer(n)}.` : state.uni ? 'I am still in school, sir, but I have plans.' : 'I am hustling, sir. Things will get better.'], ms:2300},
    {say:[{name:`Mrs. ${myFam ? state.family.surname : w.surname}`}, ok ? 'Hmm. We like you. You have our blessing! 🙏🏾' : 'Come back when you are more settled. Our child deserves better.'], ms:2400},
    {fx:() => { advanceTime(720); gain('energy', -15); }}
  ]).then(() => {
    if (ok){ w.step = 1; woo(n.id, 6); famRel('mum', 5); famRel('dad', 5); addHistory(`Introduction with the ${w.surname} family`, '🤝'); result('Introduction done 🤝', `<p>The ${w.surname} family gave their blessing.</p><p>Next: ${state.gender === 'm' ? `pay the bride price (${fmt(bridePrice())})` : 'your family receives the bride price'}.</p>`, [opt('Wedding plans 💍', '', () => { openPanel('wedding'); return false; })]); }
    else { w.introCool = state.day + 3; gain('happy', -6); result('Not yet 😔', '<p>The family wants to see you more settled: a job, a good name and stability. Try again in 3 days.</p>'); }
  });
}
function doBridePrice(){
  const w = state.wed, n = NPC[w.who];
  if (state.gender === 'm'){ if (!spendAny(bridePrice())) return; }
  else if (!spendAny(price(200000))) return;
  closePanel();
  runScene([
    {fade:state.gender === 'm' ? `📜 Presenting the bride price and list to the ${w.surname} family...` : `📜 The ${NPC[w.who].name} family brings the bride price to your father...`, ms:1800},
    {say:[{name:'Elder'}, state.gender === 'm' ? 'Yams, wine, cloth, and the money. Everything on the list is complete!' : `${state.family.members[0].first}, accept this from your in-laws.`], ms:2400},
    {fx:() => { w.step = 2; advanceTime(240); famRel('dad', 6); woo(n.id, 4); addHistory('Bride price settled', '📜'); }}
  ]).then(() => result('Bride price settled 📜', `<p>Both families are satisfied. Next: the <b>traditional wedding</b> (${fmt(tradCost())}).</p>`, [opt('Wedding plans 💍', '', () => { openPanel('wedding'); return false; })]));
}
function doTrad(){
  const w = state.wed, n = NPC[w.who];
  if (!spendAny(tradCost())) return;
  closePanel();
  runScene([
    {fade:`🥁 Traditional wedding in ${w.town}...`, ms:1800},
    {say:[{name:'MC'}, `Make una clear road! The couple is entering! ${state.name} and ${n.name}! 🎉`], ms:2300},
    {say:['player', pick(['Spray the money! 💸💃🏾', 'This our aso-ebi too clean! 😎'])], ms:1800},
    {fade:'💃🏾 Dancing, spraying money, jollof and small chops everywhere...', ms:1900, fx:() => { w.step = 3; w.trad = true; advanceTime(600); gain('happy', 15); gain('rep', 4); gain('energy', -25); famRel('mum', 8); famRel('dad', 8); woo(n.id, 8); addHistory(`Traditional wedding with ${n.name}`, '🥁'); }}
  ]).then(() => result('Traditional wedding done 🥁', `<p>You are now married traditionally! To complete it, hold a <b>church wedding</b>, <b>nikkah</b> or <b>court wedding</b>. ${n.name} moves in after that.</p>`, [opt('Wedding plans 💍', '', () => { openPanel('wedding'); return false; })]));
}
const WED_POS = {church:{a:[4.4, 3.8, PI], b:[5.6, 3.8, PI], off:'pastor'}, mosque:{a:[5.4, 2.6, PI], b:[6.6, 2.6, PI], off:'imam', y:-0.3}, lg:{a:[6.5, 2.4, PI], b:[7.5, 2.4, PI], off:'chair'}};
async function doWedding(t){
  const w = state.wed, n = NPC[w.who], T = WED_TYPES[t];
  if (!spendAny(wedCost(t))) return;
  closePanel();
  const pos = WED_POS[T.venue];
  paused = true;
  await fadeTo(true, T.name);
  const inst = putInside(T.venue, pos.a[0], pos.a[1], pos.a[2]);
  const look = outfit(n.g, seeded(n.id));
  if (t === 'church'){ if (n.g === 'f'){ look.top = '#ffffff'; look.bottom = '#ffffff'; look.long = 'top'; } else { look.top = '#1c1c1c'; look.bottom = '#1c1c1c'; look.longSleeve = true; } }
  const sp = staffMember(inst, pos.b[0], pos.b[1], pos.b[2], look, {sit:!!pos.y, name:n.name});
  if (pos.y){ sp.p.g.position.y = pos.y; }
  await new Promise(r => setTimeout(r, 150));
  await fadeTo(false);
  const off = inst[pos.off];
  await runScene([
    {pose:pos.y ? 'sit' : null, y:pos.y || 0},
    {say:[off, `Dearly beloved, we are gathered here today to join ${state.name} and ${n.name}.`], ms:2600},
    {say:[off, T.line], ms:3000},
    {say:['player', 'I do. 💍'], ms:1500},
    {say:[sp, 'I do! ❤️'], ms:1500},
    {say:[off, 'By the authority given to me, I now pronounce you married! 🎉'], ms:2400},
    {flashScreen:true, sound:'ding', fx:() => marryNow(n, t)},
    {fade:'🎉 Congratulations to the new couple! 🎉', ms:1600, fx:() => { inst.group.remove(sp.p.g); inst.staff = inst.staff.filter(s => s !== sp); inst.solids = inst.solids.filter(s => !(Math.abs((s.x0 + s.x1) / 2 - sp.x) < 0.01 && Math.abs((s.z0 + s.z1) / 2 - sp.z) < 0.01)); }},
    {pose:null}
  ]);
  result('Happily married! 💍', `<p>You and <b>${n.name}</b> are now married. ${n.name} has moved into your home. Talk to ${himHer(n)} at home in the evenings.</p><div class="note">Married life: spend time together, give housekeeping money weekly, and when you are ready, try for a baby.</div>`);
}
function marryNow(n, t){
  const p = P(n.id);
  p.stage = 'married'; p.rom = Math.max(p.rom, 85); p.lastContact = state.day;
  state.spouse = n.id; state.partner = n.id; state.wed.step = 4; state.wed.type = t; state.wed.day = state.day;
  state.upkeepDay = state.day;
  refreshLabel(n.id);
  addHistory(`Married ${n.name} (${WED_TYPES[t].name.replace(/ [^ ]+$/, '')})`, '💍');
  gain('happy', 20); gain('rep', 6); famRel('mum', 10); famRel('dad', 10);
  if (!state.noPhone) friendIds(30, true).forEach(id => { if (id !== n.id) chatAdd(id, 0, pick(['Congratulations on your wedding!!! 🎉💍', 'HML! Happy married life! 🥂', 'Ah, you don marry! God bless your home 🙏🏾'])); });
}

/* ---------- divorce ---------- */
const _breakUp = breakUp;
breakUp = function(id, byThem){
  const wasSpouse = state.spouse === id;
  if (state.wed && state.wed.who === id && !wasSpouse) state.wed = null;
  _breakUp(id, byThem);
  if (wasSpouse){
    state.spouse = null; state.wed = null; gain('happy', -15); gain('rep', -4);
    addHistory(`Divorced ${NPC[id].name}`, '⚖️');
    toast(`⚖️ You and ${NPC[id].name} are divorced. ${KIDS().length ? 'The children stay with you.' : ''}`, 'bad');
  }
};

/* ---------- pregnancy, birth, naming ---------- */
function tryBaby(){
  const n = spouseN();
  closePanel();
  runScene([{say:[{name:n.name}, pick(['Come here, my love... 😘', 'Lights off... 🌙'])], ms:1600}, {fade:'🌙 Goodnight...', ms:1300, fx:() => { state.daily.baby = true; advanceTime(30); gain('happy', 4); woo(n.id, 3); }}]).then(() => {
    const ch = 0.3 + (state.happy > 60 ? 0.1 : 0) + (state.health > 70 ? 0.05 : 0);
    if (Math.random() < ch){
      const mother = state.gender === 'f' ? 'me' : 'spouse';
      state.preg = {day:state.day + 1, due:state.day + 13, anc:0, mother};
      setTimeout(() => {
        sfx('ding');
        addHistory(mother === 'me' ? 'Found out you are pregnant 🤰🏾' : `${n.name} is pregnant 🤰🏾`, '🤰🏾');
        familyCheer('Mum: "A grandchild?! God has answered my prayers!" 😭🙏🏾');
        result('Positive! 🤰🏾', `<p>${mother === 'me' ? 'The pregnancy test is positive! You are expecting a baby.' : `${n.name} shows you the test: <b>positive</b>! You are going to be a ${state.gender === 'm' ? 'father' : 'mother'}!`}</p><p>The baby is due on <b>Day ${state.preg.due}</b>. Go for <b>antenatal care</b> at General Hospital to keep mother and baby safe.</p>`);
      }, 400);
    }
  });
}
function birthNames(g){ const R = REGIONS[(AREA.region in REGIONS) ? AREA.region : 'sw'] || REGIONS.sw; const pool = g === 'm' ? R.kidsM.concat(R.male) : R.kidsF.concat(R.female); return shuffle(pool).slice(0, 3); }
function deliverBaby(where){
  const n = spouseN(), pr = state.preg, g = Math.random() < 0.5 ? 'm' : 'f';
  const risky = where === 'tba' && Math.random() < (0.25 - pr.anc * 0.06);
  KIDS().push({name:'Baby', g, born:state.day, school:null, feesDay:0, bond:60, sent:false});
  state.preg = null;
  if (pr.mother === 'me'){ state.health = clamp(state.health - (risky ? 35 : 12), 5, 100); state.energy = 20; }
  gain('happy', 20); gain('rep', 3); famRel('mum', 12); famRel('dad', 10); if (n) woo(n.id, 10);
  addHistory(`Welcomed a baby ${g === 'm' ? 'boy' : 'girl'} 👶🏾`, '👶🏾');
  if (where === 'hospital' && typeof putInside === 'function'){
    const inst = putInside('hospital', 13.5, 3.1, PI);
    const baby = makePerson(outfit(g)); baby.g.scale.setScalar(0.28); baby.g.position.set(inst.ox + 13.5, 0.8, inst.oz + 1.6); baby.g.rotation.x = -PI / 2; inst.group.add(baby.g);
    setTimeout(() => inst.group.remove(baby.g), 60000);
    if (pr.mother === 'spouse' && n){ const m = makePerson(outfit(n.g, seeded(n.id))); m.g.position.set(inst.ox + 13.5, 0.78, inst.oz + 2.1); m.g.rotation.x = -PI / 2; inst.group.add(m.g); setTimeout(() => inst.group.remove(m.g), 60000); }
    setTimeout(() => speak(inst.nurse, `Congratulations! It's a ${g === 'm' ? 'boy' : 'girl'}! 👶🏾`), 300);
  }
  nowQueue.unshift({id:'naming', ctx:{i:KIDS().length - 1, names:birthNames(g)}, day:state.day, key:Date.now() + '_n'});
  return `${risky ? 'It was a difficult delivery, but ' : ''}Mother and baby are ${risky ? 'now ' : ''}fine. It's a ${g === 'm' ? 'boy' : 'girl'}! 👶🏾`;
}

/* ---------- events ---------- */
const famEvents = [
  {id:'labour', w:0, cool:0, ignore:0,
    title:() => state.preg ? 'Labour has started! 🤰🏾' : 'Welcome, baby! 👶🏾',
    body:() => state.preg && state.preg.mother === 'me' ? 'Your water has broken! The baby is coming. Where will you deliver?' : `${spouseN() ? spouseN().name : 'Your spouse'} is in labour: "The baby is coming! Hurry!"`,
    options:() => [
      opt('Rush to General Hospital 🏥', `${fmt(price(150000))} · Safest`, () => { payBill(price(150000)); advanceTime(240); return deliverBaby('hospital'); }, null, 'cur'),
      opt('Call a traditional birth attendant', `${fmt(price(30000))} · Cheaper, riskier`, () => { payBill(price(30000)); advanceTime(300); return deliverBaby('tba'); })
    ]},
  {id:'naming', w:0, cool:0, ignore:0,
    title:() => 'Naming ceremony 👶🏾',
    body:c => `On the eighth day, family and friends gather with prayers, honey, kola nut and water. What will you name your ${KIDS()[c.i].g === 'm' ? 'son' : 'daughter'}?`,
    options:c => c.names.map(nm => opt(nm, 'Choose this name', () => { const k = KIDS()[c.i]; k.name = nm; addHistory(`Named your ${k.g === 'm' ? 'son' : 'daughter'} ${nm}`, '🍯'); gain('happy', 6); return `Welcome to the world, ${nm}! 🍯🙏🏾`; }))},
  {id:'schoolChoice', w:0, cool:0, ignore:1,
    title:c => `${KIDS()[c.i].name} is ready for school 🎒`,
    body:c => `${KIDS()[c.i].name} is now ${kidAge(KIDS()[c.i])}. Which school will you choose? Fees are paid every term.`,
    options:c => [
      opt('Private school 🏫', `${fmt(price(250000))} per term · Better results`, () => { const k = KIDS()[c.i]; k.school = 'private'; k.feesDay = state.day; if (!spendAny(price(250000))) { k.sent = true; return `${k.name} was enrolled, but the first fees are unpaid.`; } addHistory(`Enrolled ${k.name} in private school`, '🎒'); return `${k.name} starts at Bright Stars Academy tomorrow! 🎒`; }),
      opt('Public school 🏫', `${fmt(price(30000))} per term`, () => { const k = KIDS()[c.i]; k.school = 'public'; k.feesDay = state.day; if (!spendAny(price(30000))) { k.sent = true; return 'Fees unpaid.'; } addHistory(`Enrolled ${k.name} in public school`, '🎒'); return `${k.name} starts at the local public school tomorrow! 🎒`; })
    ]},
  {id:'schoolFees', w:0, cool:0, ignore:1,
    title:c => `School fees for ${KIDS()[c.i].name} 🏫`,
    body:c => `A new term has started. ${KIDS()[c.i].name}'s ${KIDS()[c.i].school} school fees are ${fmt(c.amt)}.`,
    options:c => [
      opt('Pay the fees 💳', fmt(c.amt), () => { if (!spendAny(c.amt)) return false; const k = KIDS()[c.i]; k.sent = false; k.feesDay = state.day; k.bond = clamp(k.bond + 3, 0, 100); return `${k.name}'s fees are paid. 📚`; }, null, 'cur'),
      opt('Not now', 'They may send the child home', () => { const k = KIDS()[c.i]; k.sent = true; k.feesDay = state.day; k.bond = clamp(k.bond - 8, 0, 100); gain('happy', -6); return `${k.name} was sent home for unpaid fees. 😢`; }, null, 'danger')
    ]},
  {id:'kidSick', w:1.5, cool:12, ignore:1,
    cond:() => KIDS().length > 0,
    ctx:() => ({i:rint(0, KIDS().length - 1), amt:amtA(25000)}),
    title:c => `${KIDS()[c.i].name} has a fever 🤒`,
    body:c => `${KIDS()[c.i].name} is hot and crying all night. It looks like malaria.`,
    options:c => [
      opt('Take them to the hospital 🏥', fmt(c.amt), () => { if (!spendAny(c.amt)) return false; KIDS()[c.i].bond += 5; advanceTime(120); return `The doctor treated ${KIDS()[c.i].name}. They are smiling again. 😊`; }, null, 'cur'),
      opt('Use home remedies', 'Free · Risky', () => { if (Math.random() < 0.6) return 'The fever came down by morning. Thank God.'; gain('happy', -10); payBill(amtA(60000)); return `It got worse and you had to rush ${KIDS()[c.i].name} to the hospital anyway. Bigger bill. 😥`; }, null, 'danger')
    ]},
  {id:'kidPrize', w:1.2, cool:15, ignore:0,
    cond:() => KIDS().some(k => k.school && !k.sent),
    ctx:() => ({i:KIDS().findIndex(k => k.school && !k.sent)}),
    title:c => `${KIDS()[c.i].name} came first in class! 🏆`,
    body:c => `The teacher called: "${KIDS()[c.i].name} took first position this term. You should be proud!"`,
    options:c => [
      opt('Buy them a treat 🍦', fmt(price(5000)), () => { if (!spendAny(price(5000))) return false; KIDS()[c.i].bond += 8; gain('happy', 8); return `${KIDS()[c.i].name}: "Thank you Daddy/Mummy!" 🥰`.replace('Daddy/Mummy', state.gender === 'm' ? 'Daddy' : 'Mummy'); }),
      opt('Say well done', '', () => { KIDS()[c.i].bond += 3; gain('happy', 5); return 'Proud parent moment. 🏆'; })
    ]},
  {id:'inLaws', w:1.5, cool:12, phone:true, ignore:1,
    cond:() => !!state.spouse && !!state.wed,
    ctx:() => ({who:state.spouse, amt:amtA(50000)}),
    title:c => `${NPC[c.who].name}: family request 💬`,
    body:c => `${NPC[c.who].name}: "My mum called. Papa needs ${fmt(c.amt)} for his medication. Can we help them?"`,
    options:c => [
      opt('Send the money 💸', fmt(c.amt), () => { if (!spendAny(c.amt)) return false; woo(c.who, 8); gain('rep', 1); return `${NPC[c.who].name}: "Thank you, my love. My family will never forget this." ❤️`; }, null, 'cur'),
      opt('We can\'t afford it now', '', () => { woo(c.who, -8); return `${NPC[c.who].name}: "Hmm. Okay." (They are hurt.)`; }, null, 'danger')
    ]},
  {id:'spouseUpkeep', w:0, cool:0, ignore:0,
    title:() => 'Housekeeping money 🏠',
    body:c => `${NPC[c.who].name}: "Foodstuff is finished and the children need things. The weekly housekeeping money is ${fmt(c.amt)}."`,
    options:c => [
      opt('Give the money 💸', fmt(c.amt), () => { if (!spendAny(c.amt)) return false; state.upkeepDay = state.day; woo(c.who, 4); state.inv.foodstuff = (state.inv.foodstuff || 0) + 2; return `${NPC[c.who].name}: "Thank you, dear. I bought foodstuff too." (+2 foodstuff)`; }, null, 'cur'),
      opt('Not this week', '', () => { state.upkeepDay = state.day; woo(c.who, -10); gain('happy', -4); return `${NPC[c.who].name}: "So how will we eat? Hmm." 😒`; }, null, 'danger')
    ]}
];
famEvents.forEach(e => { EVENTS.push(e); EVENT[e.id] = e; });
EV_VIA.inLaws = ['chat', c => c.who];

/* daily family checks (called from dailyLife) */
function familyDaily(){
  const pr = state.preg;
  if (pr){
    if (state.day >= pr.due && !pr.labour){ pr.labour = true; queueNow({id:'labour'}); }
    else if (state.day === pr.due - 3 && !state.noPhone) toast(pr.mother === 'me' ? '🤰🏾 Your baby is due in 3 days. Keep money ready for the hospital.' : `🤰🏾 ${spouseN() ? spouseN().name : 'Your spouse'} is due in 3 days. Keep money ready for the hospital.`, 'info');
  }
  const n = spouseN();
  if (n){
    P(n.id).lastContact = Math.max(P(n.id).lastContact, state.day - 1);
    if (state.housing < 1){ woo(n.id, -3); gain('happy', -2); if (Math.random() < 0.4) chatAdd(n.id, 0, 'This face-me-I-face-you is too small for us o. When are we moving? 😩'); }
    if (state.day - (state.upkeepDay || 0) >= 7 && !nowQueue.some(x => x.id === 'spouseUpkeep')) queueNow({id:'spouseUpkeep', ctx:{who:n.id, amt:price(40000 + KIDS().length * 15000)}});
  }
  KIDS().forEach((k, i) => {
    const a = kidAge(k);
    if (a >= 3 && a < 18 && !k.school && !k.asked){ k.asked = true; queueNow({id:'schoolChoice', ctx:{i}}); }
    else if (k.school && a < 18 && state.day - k.feesDay >= TERM_DAYS){ k.feesDay = state.day; queueNow({id:'schoolFees', ctx:{i, amt:price(k.school === 'private' ? 250000 : 30000)}}); }
    if (k.sent) k.bond = clamp(k.bond - 1, 0, 100);
    if (a >= 1) gain('happy', 0.5);
  });
}

/* =========================================================
   HOME: spouse and children live with you
   ========================================================= */
const FAM_SPOTS = [
  {sp:[3.3, 5.6, PI / 2], kids:[[5.0, 6.0, PI], [3.4, 6.5, 0.6], [4.6, 5.6, -PI / 2]]},
  {sp:[2.2, 2.4, 0], kids:[[4.4, 2.4, -PI / 2], [3.8, 1.8, PI], [2.4, 3.4, PI / 2]]},
  {sp:[2.4, 3.3, PI / 2], kids:[[4.0, 3.6, -PI / 2], [4.6, 2.8, PI], [1.8, 3.9, 0]]},
  {sp:[2.6, 3.4, PI / 2], kids:[[4.4, 3.6, -PI / 2], [5.0, 2.9, PI], [1.9, 4.0, 0]]}
];
function spouseHome(){ const h = hour(); return h >= 17 || h < 8 || (state.day - 1) % 7 >= 5; }
function homeFamily(inst){
  const F = FAM_SPOTS[state.housing] || FAM_SPOTS[1];
  const n = spouseN();
  if (n && spouseHome()){
    const sp = F.sp;
    inst.spouse = staffMember(inst, sp[0], sp[1], sp[2], outfit(n.g, seeded(n.id)), {name:n.name});
    station(inst, 'spouse', sp[0] + Math.sin(sp[2]) * 0.8, sp[1] + Math.cos(sp[2]) * 0.8, `💞 ${n.name}`, () => { speak(inst.spouse, pick(state.preg ? ['The baby is kicking! 🤰🏾', 'I am craving suya and ice cream 😂'] : ['Welcome home, dear! ❤️', 'How was your day, my love?', 'Food is ready o! 🍲'])); setTimeout(() => { if (!sceneBusy && !panelState) openPanel('spouse'); }, 900); });
  }
  KIDS().slice(0, 3).forEach((k, i) => {
    const a = kidAge(k), s = F.kids[i];
    const look = outfit(k.g); look.top = pick(['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#1abc9c']);
    const st = staffMember(inst, s[0], s[1], s[2], look, {sit:a < 2, name:k.name});
    st.p.g.scale.setScalar(a < 1 ? 0.32 : clamp(0.42 + a * 0.035, 0.42, 0.95));
    if (a >= 2) inst.solids.pop();
    if (i === 0) inst.kid0 = st;
  });
  if (KIDS().length){ const s = F.kids[0]; station(inst, 'kids', s[0] + Math.sin(s[2]) * 0.8, s[1] + Math.cos(s[2]) * 0.8, '🧸 Children', () => { if (inst.kid0) speak(inst.kid0, pick(['Welcome! 🤗', 'Play with me! 🧸', `${state.gender === 'm' ? 'Daddy' : 'Mummy'}! 😄`])); setTimeout(() => { if (!sceneBusy && !panelState) openPanel('kids'); }, 800); }); }
}

/* =========================================================
   PANELS
   ========================================================= */
function marriageOpts(n){
  const p = P(n.id), out = [];
  if (p.stage === 'serious') out.push(opt('Propose marriage 💍', state.inv.ring > 0 ? 'You have the ring' : 'You need an engagement ring', () => { propose(n); return false; }, proposeBlock(n), 'cur'));
  if (p.stage === 'engaged') out.push(opt('Wedding plans 💍', 'Introduction, bride price, wedding', () => { openPanel('wedding'); return false; }, null, 'cur'));
  if (p.stage === 'married') out.push(opt('Married life 💞', 'Talk, housekeeping, children', () => { openPanel('spouse'); return false; }, null, 'cur'));
  return out;
}
const STEP_NAMES = ['Introduction 🤝', 'Bride price 📜', 'Traditional wedding 🥁', 'Church / Nikkah / Court wedding 💒', 'Married 💍'];
Object.assign(PANELS, {
  wedding: () => {
    const w = state.wed;
    if (!w) return {title:'Wedding plans 💍', sub:'', body:'<p>You are not engaged.</p>', options:[opt('Close', '', () => { closePanel(); return false; })]};
    const n = NPC[w.who];
    const list = STEP_NAMES.map((s, i) => `<b>${i < w.step ? '✅' : i === w.step ? '👉🏾' : '⬜'}</b><span>${s}</span>`).join('');
    const opts = [];
    if (w.step === 0) opts.push(opt(state.gender === 'm' ? `Introduction: visit the ${w.surname} family 🤝` : `Introduction: ${n.name}'s family visits yours 🤝`, `${fmt(introCost())} (travel + gifts) · 12 hrs`, doIntro, w.introCool > state.day ? `The family asked you to come back on Day ${w.introCool}.` : null, 'cur'));
    if (w.step === 1) opts.push(opt(state.gender === 'm' ? 'Pay the bride price and list 📜' : 'Receive the bride price 📜', state.gender === 'm' ? fmt(bridePrice()) : `${fmt(price(200000))} hosting`, doBridePrice, null, 'cur'));
    if (w.step === 2) opts.push(opt('Hold the traditional wedding 🥁', `${fmt(tradCost())} · Aso-ebi, canopy, food, DJ`, doTrad, null, 'cur'));
    if (w.step === 3) Object.keys(WED_TYPES).forEach(t => opts.push(opt(WED_TYPES[t].name, `${fmt(wedCost(t))} · At ${B[WED_TYPES[t].venue].name}`, () => { doWedding(t); return false; }, wedTypeBlock(t, n), 'cur')));
    opts.push(opt('Close', '', () => { closePanel(); return false; }));
    return {title:`Wedding: ${state.name} & ${n.name} 💍`, sub:`${n.name}'s family: the ${w.surname}s of ${w.town}`, body:`<div class="kv">${list}</div>`, options:opts};
  },
  spouse: () => {
    const n = spouseN();
    if (!n) return {title:'Married life', sub:'', body:'<p>You are not married.</p>', options:[opt('Close', '', () => { closePanel(); return false; })]};
    const p = P(n.id), pr = state.preg, night = hour() >= 20 || hour() < 5;
    const body = `<div class="kv"><b>Spouse</b><span>${n.name} (${n.role})</span><b>Romance</b><span>${Math.round(p.rom)}/100</span><b>Married since</b><span>Day ${state.wed ? state.wed.day : '?'}</span><b>Children</b><span>${KIDS().length ? KIDS().map(k => k.name).join(', ') : 'None yet'}</span>${pr ? `<b>Pregnancy</b><span>Due Day ${pr.due} · Antenatal ${pr.anc}/3</span>` : ''}<b>Housekeeping</b><span>Next due Day ${(state.upkeepDay || 0) + 7}</span></div>`;
    return {title:`${n.name} 💞`, sub:'Your spouse', body, options:[
      opt('Talk about your day 💬', '20 mins · +romance, +happiness', () => { state.daily.spouseTalk = true; advanceTime(20); woo(n.id, 4); gain('happy', 3); toast(`${n.name}: "${pick(['I\'m proud of you. 🥰', 'Make we plan for the future together.', 'You work too hard, rest small.', 'My boss stressed me today. 😩'])}"`, 'good'); }, state.daily.spouseTalk ? 'You already talked today.' : null),
      opt('Give housekeeping money 💸', fmt(price(40000 + KIDS().length * 15000)), () => { const a = price(40000 + KIDS().length * 15000); if (!spendAny(a)) return; state.upkeepDay = state.day; woo(n.id, 5); state.inv.foodstuff = (state.inv.foodstuff || 0) + 2; toast(`${n.name}: "Thank you dear! I bought foodstuff." (+2 foodstuff)`, 'good'); }, state.day - (state.upkeepDay || 0) < 4 ? 'You gave money recently.' : null),
      opt('Date night 🌹', 'Go out together', () => { openPanel('outing', n); return false; }, did(n.id, 'out') ? 'You already went out today.' : null),
      opt('Try for a baby 👶🏾', 'At night · once a day', () => { tryBaby(); return false; }, pr ? 'A baby is already on the way. 🤰🏾' : KIDS().length >= 5 ? 'Five children is enough o!' : !night ? 'Wait until night (8pm).' : state.daily.baby ? 'Tomorrow night.' : !inside || inside.id !== 'home' ? 'Only at home.' : null, 'cur'),
      ...(KIDS().length ? [opt('Children 🧸', '', () => { openPanel('kids'); return false; })] : []),
      opt('Close', '', () => { closePanel(); return false; })
    ]};
  },
  kids: () => {
    const ks = KIDS();
    const body = ks.map(k => `<div class="kv"><b>${k.g === 'm' ? '👦🏾' : '👧🏾'} ${esc(k.name)}</b><span>Age ${kidAge(k)} · ${kidStage(k)}${k.school ? ` · ${k.school} school${k.sent ? ' (sent home: fees!)' : ''}` : ''} · Bond ${Math.round(k.bond)}</span></div>`).join('') || '<p>No children yet.</p>';
    const opts = [];
    ks.forEach((k, i) => {
      opts.push(opt(`Play with ${k.name} 🧸`, '30 mins · +happiness', () => { k.played = state.day; advanceTime(30); k.bond = clamp(k.bond + 5, 0, 100); gain('happy', 5); toast(`${k.name} is laughing! 😄`, 'good'); }, k.played === state.day ? 'Already played today.' : null));
      if (k.school && kidAge(k) >= 6) opts.push(opt(`Help ${k.name} with homework 📚`, '45 mins · -5 energy', () => { k.hw = state.day; advanceTime(45); gain('energy', -5); k.bond = clamp(k.bond + 4, 0, 100); toast('Homework done! ✏️', 'good'); }, k.hw === state.day ? 'Already done today.' : null));
      if (k.sent) opts.push(opt(`Pay ${k.name}'s school fees 💳`, fmt(price(k.school === 'private' ? 250000 : 30000)), () => { if (!spendAny(price(k.school === 'private' ? 250000 : 30000))) return; k.sent = false; k.feesDay = state.day; toast(`${k.name} is back in school! 🎒`, 'good'); }, null, 'cur'));
    });
    opts.push(opt('Close', '', () => { closePanel(); return false; }));
    return {title:'Your children 🧸', sub:`${ks.length} child${ks.length !== 1 ? 'ren' : ''}`, body, options:opts};
  }
});

/* extend existing panels */
const _hosp = PANELS.hospital;
PANELS.hospital = () => {
  const r = _hosp(), pr = state.preg;
  if (pr) r.options.unshift(opt('Antenatal check-up 🤰🏾', `${fmt(price(15000))} · ${pr.anc}/3 done · Safer delivery`, () => { if (!spendAny(price(15000))) return; pr.anc++; state.daily.anc = true; advanceTime(90); gain('happy', 2); toast('Scan done: the baby is healthy and growing well. 💓', 'good'); }, pr.anc >= 3 ? 'All antenatal visits done.' : state.daily.anc ? 'One visit per day.' : null, 'cur'));
  return r;
};
SPOTS.hospital.unshift(S_(/Antenatal/i, 2.5, 2.1, PI, {pose:'sit', who:'doctor', say:['Lie down for the scan... There is the heartbeat! 💓']}));
const _market = PANELS.market;
PANELS.market = () => {
  const r = _market();
  if (state.partner && ['serious', 'engaged'].includes(P(state.partner).stage) || state.inv.ring > 0) r.options.unshift(opt('Buy an engagement ring 💍', `${fmt(price(ITEMS.ring.price))} · You have ${state.inv.ring || 0}`, () => { if (!spend(price(ITEMS.ring.price))) return; state.inv.ring = (state.inv.ring || 0) + 1; toast('You bought an engagement ring. 💍 Now find the right moment...', 'good'); }, !inHours(6, 20) ? 'The market is closed.' : null, 'cur'));
  return r;
};
const _menu = PANELS.menu;
PANELS.menu = () => {
  const r = _menu();
  if (state.wed && !state.spouse) r.options.splice(2, 0, opt('Wedding plans 💍', `With ${NPC[state.wed.who].name}`, () => { openPanel('wedding'); return false; }, null, 'cur'));
  if (state.spouse || KIDS().length) r.options.splice(2, 0, opt('Family life 💞', `${state.spouse ? NPC[state.spouse].name : ''}${KIDS().length ? ` · ${KIDS().length} child${KIDS().length > 1 ? 'ren' : ''}` : ''}`, () => { openPanel(state.spouse ? 'spouse' : 'kids'); return false; }));
  return r;
};
