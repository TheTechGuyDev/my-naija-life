'use strict';
/* =========================================================
   TOASTS + SOUND
   ========================================================= */
function toast(msg, type){
  const box = $('toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 3800);
}
let actx = null;
function audio(){ if (!actx){ try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return actx; }
function sfx(kind){
  const a = audio(); if (!a) return;
  const now = a.currentTime;
  if (kind === 'horn'){
    [370, 466].forEach(f => { const o = a.createOscillator(), g = a.createGain(); o.type = 'sawtooth'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.08, now + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45); o.connect(g).connect(a.destination); o.start(now); o.stop(now + 0.5); });
  } else if (kind === 'crash'){
    const len = a.sampleRate * 0.6, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = a.createBufferSource(), g = a.createGain(); g.gain.value = 0.35; s.buffer = buf; s.connect(g).connect(a.destination); s.start(now);
  } else if (kind === 'ring'){
    [0, 0.28].forEach(off => { const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = 1046; g.gain.setValueAtTime(0.0001, now + off); g.gain.exponentialRampToValueAtTime(0.07, now + off + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + off + 0.2); o.connect(g).connect(a.destination); o.start(now + off); o.stop(now + off + 0.22); });
  } else if (kind === 'ding'){
    const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4); o.connect(g).connect(a.destination); o.start(now); o.stop(now + 0.4);
  }
}
window.addEventListener('pointerdown', () => { const a = audio(); if (a && a.state === 'suspended') a.resume(); }, {once:false});

/* =========================================================
   PANELS
   ========================================================= */
let panelState = null, paused = true;
const opt = (label, note, action, why, cls) => ({label, note, action, why, cls:cls || ''});
const setupData = {name:'', gender:'m', area:'ikeja', religion:'none'};

const PANELS = {
  setup: () => ({
    title: 'My Naija Life 🇳🇬',
    sub: 'Create your character and choose where you will live.',
    body: `<div class="sec">Your name</div><input type="text" id="nameIn" maxlength="18" placeholder="e.g. Temidayo" value="${setupData.name.replace(/"/g, '')}">
      <div class="sec">Choose your area (where you will start)</div>`,
    options: [
      opt('👨🏾 Male', 'Your character', () => { setupData.gender = 'm'; }, null, setupData.gender === 'm' ? 'sel' : ''),
      opt('👩🏾 Female', 'Your character', () => { setupData.gender = 'f'; }, null, setupData.gender === 'f' ? 'sel' : ''),
      ...AREAS.map(a => opt(`${a.name}, ${a.city}`, `${a.streets[0]} · Cost of living ${a.cost >= 1.4 ? 'high 💸' : a.cost >= 1.05 ? 'medium' : a.cost >= 0.95 ? 'normal' : 'low'}`, () => { setupData.area = a.id; }, null, setupData.area === a.id ? 'sel' : '')),
      opt('Start my life ▶', `${setupData.name ? setupData.name + ' · ' : ''}${AREAS.find(a => a.id === setupData.area).name}`, () => {
        const nm = (setupData.name || '').trim();
        if (!nm){ toast('Please type your name first.', 'bad'); return; }
        startNewLife({name:nm, gender:setupData.gender, area:setupData.area});
        return false;
      }, null, 'go')
    ]
  }),

  intro: () => ({
    title: `Welcome to ${AREA.name}, ${state.name}! 🇳🇬`,
    sub: `${AREA.greet}! You live at ${addressOf(B.home)}, ${AREA.name}, ${AREA.city}. You have ₦2,000,000, an SSCE and big dreams.`,
    body: `<ul>
      <li><b>Move:</b> WASD / arrow keys on PC. On mobile, drag the left side of the screen.</li>
      <li><b>Look around:</b> drag with the mouse (or the right side of the screen on mobile) left/right to turn and up/down to tilt. Zoom with ＋/－, the mouse wheel or pinch.</li>
      <li><b>Directions:</b> follow the <b>yellow dots</b> on the ground and the arrow in the 🎯 box. Tap 🗺️ to navigate to any place.</li>
      <li><b>Enter / talk:</b> walk to a door or person and press <b>E</b>, or tap the green button.</li>
      <li><b>🍛 Eating:</b> when the hunger bar drops, go to <b>Mama Nkechi's Buka</b>, or buy food at <b>${AREA.market}</b> and eat it from your Bag (${BAG}).</li>
      <li><b>🚦 Road safety:</b> cross only at <b>zebra crossings</b>. Cars stop for you there. Jaywalk and a car can hit you, and you'll end up in hospital.</li>
      <li><b>Your path:</b> NIN → JAMB → department → exams → SIWES → graduate → NYSC → CV → interview → job.</li>
    </ul>`,
    options: [opt("Let's go! 🚀", 'Start your new life', () => { closePanel(); return false; }, null, 'go')]
  }),

  directory: () => ({
    title: 'Directory and directions 🗺️', sub: `${AREA.name}, ${AREA.city}. Pick a place and follow the yellow dots.`,
    body: state.nav ? `<div class="note">Currently navigating to <b>${B[state.nav].name}</b>.</div>` : '',
    options: [
      ...(state.nav ? [opt('Stop navigation ✖', 'Go back to following your goal', () => { state.nav = null; toast('Navigation stopped. Following your goal.', 'info'); }, null, 'danger')] : []),
      ...BUILDINGS.map(b => opt(`${b.name}`, `📍 ${addressOf(b)}`, () => { state.nav = b.id; toast(`Navigating to ${b.name}. Follow the yellow dots!`, 'info'); closePanel(); return false; }, null, state.nav === b.id ? 'cur' : ''))
    ]
  }),

  home: () => {
    const h = HOUSING[state.housing], hr = hour(), night = hr >= 18 || hr < 5;
    const napWhy = (state.daily.naps || 0) >= 2 ? 'You have napped enough today.' : null;
    return {
      title: 'Your Home 🏠', sub: `${h.name} · Rent ${fmt(rentOf(state.housing))}/week · Next rent: Day ${state.rentDueDay}`,
      body: '',
      options: [
        opt('Sleep till morning 🌙', `Wake at 6:00 · +${h.sleep} energy`, () => {
          advanceTime(hr >= 18 ? (1440 - state.minutes) + 360 : 360 - state.minutes);
          gain('energy', h.sleep); gain('health', 10); gain('hunger', -15);
          toast('You slept well. You wake up hungry, so eat breakfast!', 'good');
        }, night ? null : 'You can only sleep for the night after 6pm.'),
        opt('Take a nap 😴', '2 hours · +25 energy', () => {
          state.daily.naps = (state.daily.naps || 0) + 1;
          advanceTime(120); gain('energy', 25); gain('hunger', -5); toast('Short nap. You feel better.', 'good');
        }, napWhy),
        opt('Eat from your bag 🎒', 'Open inventory', () => { openPanel('inventory'); return false; })
      ]
    };
  },

  mamaput: () => {
    const open = inHours(7, 21);
    const meals = [['Akara & Pap', 1000, 25, 4], ['Jollof Rice & Chicken', 3500, 55, 8], ['Amala, Ewedu & Assorted', 2500, 45, 6], ['Rice, Beans & Plantain', 1800, 38, 5], ['Eba & Egusi Soup', 2200, 45, 6]];
    return {
      title: "Mama Nkechi's Buka 🍛", sub: open ? 'Open 7am to 9pm. Hot food dey!' : 'Closed. Mama don go house. Opens 7am.',
      body: `<div class="kv"><b>Your hunger</b><span>${Math.round(state.hunger)}/100 (higher is fuller)</span></div>${state.priceMod > 1.04 ? '<p><i>Mama says: "Na the news o, prices don go up small today."</i></p>' : ''}`,
      options: meals.map(([n, b, f, e]) => {
        const c = price(b);
        return opt(n, `${fmt(c)} · +${f} food · +${e} energy`, () => {
          if (!spend(c)) return;
          gain('hunger', f); gain('energy', e); gain('health', 2); gain('happy', 1); advanceTime(30);
          toast(`You ate ${n}. E sweet die!`, 'good');
        }, !open ? 'The buka is closed right now.' : state.hunger >= 98 ? 'You are already full.' : null);
      })
    };
  },

  market: () => {
    const open = inHours(6, 20);
    return {
      title: `${AREA.market} 🛒`, sub: open ? `Open 6am to 8pm. Food you buy goes into your Bag. To eat it: ${BAG}.` : 'Market has closed. Opens 6am.',
      body: '',
      options: MARKET_ITEMS.map(k => {
        const it = ITEMS[k], c = price(it.price);
        return opt(`Buy ${it.name}`, `${fmt(c)} · +${it.food} food · You have ${state.inv[k] || 0}`, () => {
          if (!spend(c)) return;
          state.inv[k] = (state.inv[k] || 0) + 1; advanceTime(5);
          toast(`Bought ${it.name}. To eat it, ${BAG}.`, 'good');
        }, open ? null : 'The market is closed.');
      })
    };
  },

  bank: () => {
    const open = inHours(8, 16);
    const why = !open ? 'Banking hall is open 8am to 4pm.' : !state.nin ? 'You need an NIN to bank. Register at the Local Govt Secretariat.' : null;
    const amounts = [10000, 50000, 200000, 1000000];
    const opts = [];
    amounts.forEach(a => opts.push(opt(`Deposit ${fmt(a)}`, 'Move cash to savings', () => {
      if (state.money < a){ toast('Not enough cash in your wallet.', 'bad'); return; }
      state.money -= a; state.bank += a; toast(`Deposited ${fmt(a)}.`, 'good');
    }, why)));
    opts.push(opt('Deposit ALL cash', fmt(state.money), () => { state.bank += state.money; state.money = 0; toast('All cash deposited.', 'good'); }, why || (state.money <= 0 ? 'No cash to deposit.' : null)));
    amounts.forEach(a => opts.push(opt(`Withdraw ${fmt(a)}`, 'Take cash out', () => {
      if (state.bank < a){ toast('Insufficient balance.', 'bad'); return; }
      state.bank -= a; state.money += a; toast(`Withdrew ${fmt(a)}.`, 'good');
    }, why)));
    opts.push(opt('Withdraw ALL', fmt(state.bank), () => { state.money += state.bank; state.bank = 0; toast('All savings withdrawn.', 'good'); }, why || (state.bank <= 0 ? 'Your account is empty.' : null)));
    return {
      title: 'Naija Trust Bank 🏦', sub: open ? 'Open 8am to 4pm · Savings earn about 11% per year' : 'Banking hall is closed. Opens 8am.',
      body: `<div class="kv"><b>Wallet</b><span>${fmt(state.money)}</span><b>Savings</b><span>${fmt(state.bank)}</span><b>NIN</b><span>${state.nin ? 'Verified ✅' : 'Not registered ❌'}</span></div>`,
      options: opts
    };
  },

  hospital: () => ({
    title: 'General Hospital 🏥', sub: 'Open 24 hours. Health is wealth.',
    body: `<div class="kv"><b>Your health</b><span>${Math.round(state.health)}/100</span><b>Road accidents</b><span>${state.accidents}</span></div>`,
    options: [
      opt('Basic check-up 🩺', `${fmt(5000)} · +20 health · 1 hour`, () => { if (!spend(5000)) return; gain('health', 20); advanceTime(60); toast('Doctor says you are fine. Rest well.', 'good'); }, state.health >= 100 ? 'You are already in perfect health.' : null),
      opt('Full treatment 🏥', `${fmt(25000)} · Health to 100 · 3 hours`, () => { if (!spend(25000)) return; state.health = 100; advanceTime(180); toast('Fully treated. You feel brand new!', 'good'); }, state.health >= 100 ? 'You are already in perfect health.' : null),
      ...PHARM_ITEMS.map(k => { const it = ITEMS[k]; return opt(`Buy ${it.name} 💊`, `${fmt(it.price)} · +${it.health} health when used`, () => { if (!spend(it.price)) return; state.inv[k] = (state.inv[k] || 0) + 1; toast(`Bought ${it.name}.`, 'good'); }); })
    ]
  }),

  uni: () => {
    const open = inHours(8, 16), closed = 'University offices and lectures run 8am to 4pm.';
    const opts = []; let body = '', sub = 'Education na key.';
    if (state.degree){
      const d = state.degree;
      body = `<div class="kv"><b>Degree</b><span>B.Sc. ${DEPTS[d.dept].name}</span><b>Class</b><span>${d.cls} (${d.avg}%)</span></div><p style="margin-top:8px">You are an alumnus of Unity University. Proceed to NYSC and job hunting.</p>`;
      opts.push(opt('Visit the alumni office 🎓', 'Network with old students · +1 rep', () => { state.daily.alumni = true; gain('rep', 1); advanceTime(60); toast('You connected with some alumni.', 'good'); }, state.daily.alumni ? 'Already visited today.' : null));
    } else if (!state.jamb){
      sub = 'Admission requires a JAMB UTME score of 200 or above.';
      body = '<p>Answer 8 questions on English, Maths and General Knowledge. Each correct answer is worth 50 marks.</p>';
      opts.push(opt('Write JAMB UTME ✍️', `${fmt(7700)} · 8 questions · 3 hours`, () => {
        if (!spend(7700)) return;
        state.daily.jamb = true;
        startQuiz({title:'JAMB UTME ✍️', questions:draw(Q_JAMB, 8), hints:0, onDone:(s, n) => {
          const score = Math.round(s / n * 400); advanceTime(180); gain('energy', -15); gain('hunger', -10);
          if (score >= 200){ state.jamb = score; gain('rep', 3); gain('happy', 8); addHistory(`Passed JAMB with ${score}/400`, '✍️'); sfx('ding'); result('Admission granted! 🎉', `<p>You scored <b>${score}/400</b>.</p><p>Now choose your department.</p>`, [opt('Choose department ▶', '', () => { openPanel('uni'); return false; })]); }
          else gain('happy', -5), result('JAMB result 📄', `<p>You scored <b>${score}/400</b>. You need 200 to gain admission.</p><p>Study well and try again tomorrow.</p>`);
        }});
        return false;
      }, !state.nin ? 'JAMB registration requires your NIN. Enrol at the NIMC Enrolment Centre first.' : !open ? closed : state.daily.jamb ? 'You can only write JAMB once per day.' : state.energy < 15 ? 'Too tired to write an exam (need 15 energy).' : null, 'cur'));
    } else if (!state.uni){
      sub = `JAMB score: ${state.jamb}/400. Choose your department. This decides your career!`;
      Object.keys(DEPTS).forEach(k => opts.push(opt(`Study ${DEPTS[k].name}`, `Acceptance + 100L fees ${fmt(200000)} · Career: ${DEPTS[k].job}`, () => {
        if (!spend(200000)) return;
        state.uni = {dept:k, level:100, paid:true, lectures:0, carry:false, scores:[], needSiwes:false, siwes:0};
        addHistory(`Admitted to study ${DEPTS[k].name} at Unity University`, '🏫'); gain('happy', 6);
        gain('rep', 3); toast(`Welcome to ${DEPTS[k].name}, 100L! Attend lectures, then write your exam.`, 'good');
      }, open ? null : closed)));
    } else {
      const U = state.uni, D = DEPTS[U.dept];
      sub = `${D.name} · ${U.level}L${U.carry ? ' · ⚠️ Carryover' : ''}`;
      const avg = U.scores.length ? Math.round(U.scores.reduce((a, b) => a + b, 0) / U.scores.length) + '%' : 'No results yet';
      body = `<div class="kv"><b>Level</b><span>${U.level}L</span><b>School fees</b><span>${U.needSiwes ? 'SIWES first' : U.paid ? 'Paid ✅' : 'Not paid ❌'}</span><b>Lectures this session</b><span>${U.lectures}/4</span><b>Carryover</b><span>${U.carry ? 'Yes ⚠️' : 'No'}</span><b>Average score</b><span>${avg}</span></div>
        <div class="note">Attend at least 2 lectures (1 for a carryover), then write a 6-question exam. Pass mark is 50%. Each lecture after the first gives you a hint that removes 2 wrong options.</div>`;
      if (U.needSiwes){
        opts.push(opt('SIWES / IT pending 🏭', 'Go to the Business Hub', () => {}, 'Complete your SIWES at the Business Hub first.'));
      } else if (!U.paid){
        opts.push(opt(`Pay ${U.level}L school fees 💳`, fmt(150000), () => { if (!spend(150000)) return; U.paid = true; U.lectures = 0; toast(`${U.level}L fees paid. Attend lectures!`, 'good'); }, open ? null : closed, 'cur'));
      } else {
        opts.push(opt('Attend lecture 📚', `${U.lectures}/4 attended · 4 hrs · -20 energy`, () => {
          state.daily.lecture = true; U.lectures++; gain('energy', -20); gain('hunger', -10); advanceTime(240);
          toast('Lecture attended. You understand the course better.', 'good');
        }, !open ? closed : state.daily.lecture ? 'Only one lecture per day. Come back tomorrow.' : U.lectures >= 4 ? 'You have attended all lectures. Write your exam.' : state.energy < 20 ? 'Too tired for lectures (need 20 energy).' : null));
        const need = U.carry ? 1 : 2, hints = Math.max(0, U.lectures - 1) + (U.study || 0);
        opts.push(opt(U.carry ? 'Rewrite carryover exam ♻️' : `Write ${U.level}L exam 📝`, `${U.carry ? fmt(20000) + ' · ' : ''}6 questions · Pass 50% · ${hints} hint(s)`, () => {
          if (U.carry && !spend(20000)) return;
          state.daily.exam = true;
          startQuiz({title:`${U.carry ? 'Carryover' : U.level + 'L'} Exam: ${D.name}`, questions:draw(D.bank, 6), hints, onDone:examResult});
          return false;
        }, !open ? closed : state.daily.exam ? 'Only one exam per day.' : U.lectures < need ? `Attend at least ${need} lecture(s) first.` : state.energy < 15 ? 'Too tired to write an exam (need 15 energy).' : null, 'cur'));
      }
    }
    return {title:'Unity University 🎓', sub, body, options:opts};
  },

  jobs: () => {
    const opts = [];
    const j = state.job ? JOB[state.job] : null;
    const U = state.uni;
    if (U && U.needSiwes){
      opts.push(opt('Do SIWES / IT day 🏭', `${U.siwes || 0}/3 days · 6 hrs · -25 energy · ${fmt(5000)} stipend`, () => {
        state.daily.siwes = true; U.siwes = (U.siwes || 0) + 1; gain('energy', -25); gain('hunger', -12); advanceTime(360); state.money += 5000;
        if (U.siwes >= 3){ U.needSiwes = false; gain('rep', 3); result('SIWES completed 🏭', '<p>Your logbook has been signed. You can now pay your 400L fees at Unity University.</p>'); return false; }
        toast(`SIWES day ${U.siwes}/3 done. Stipend: ₦5,000.`, 'good');
      }, state.daily.siwes ? 'One SIWES day per day.' : !inHours(8, 16) ? 'SIWES runs 8am to 4pm.' : state.energy < 25 ? 'Too tired (need 25 energy).' : null, 'cur'));
    }
    if (j){
      const why = state.daily.worked ? 'You already worked a shift today.' : !inHours(6, 18) ? 'Shifts start between 6am and 6pm.' : state.energy < j.energy ? `You are too tired. You need ${j.energy} energy.` : (j.needsOkada && !state.hasOkada) ? 'You need an okada for this job.' : null;
      opts.push(opt('Work a shift 💼', `${j.name} · ${fmt(j.pay)} · ${j.hours} hrs · -${j.energy} energy`, () => {
        state.daily.worked = true; gain('energy', -j.energy); gain('hunger', -15); advanceTime(j.hours * 60);
        const bonus = Math.round(j.pay * (state.rep - 50) / 500), pay = j.pay + bonus;
        state.money += pay; state.earned += pay; state.shifts++; gain('rep', 1);
        toast(`Shift done! You earned ${fmt(pay)}${bonus > 0 ? ' (incl. reputation bonus)' : ''}.`, 'good');
      }, why, 'cur'));
      opts.push(opt('Resign 🚪', 'Quit your current job', () => { state.job = null; toast('You resigned.', 'info'); }));
    }
    JOBS.forEach(job => {
      if (state.job === job.id) return;
      const reqs = [];
      if (job.dept) reqs.push(`${DEPTS[job.dept].name} degree`); else if (job.degree) reqs.push('Any degree');
      if (job.nysc) reqs.push('NYSC'); if (job.cv) reqs.push('CV');
      if (job.needsOkada) reqs.push('Own okada');
      opts.push(opt(`${job.interview ? 'Apply' : 'Take job'}: ${job.name}`, `${fmt(job.pay)}/shift · ${reqs.length ? reqs.join(', ') : 'No requirement'}${job.interview ? ' · Interview' : ''}`, () => {
        if (job.interview){ startInterview(job); return false; }
        state.job = job.id; gain('rep', 1); addHistory(`Started work as ${job.name}`, '💼'); toast(`You got the job: ${job.name}! Work your shift here daily.`, 'good');
      }, jobBlock(job)));
    });
    return {
      title: `${B.jobs.name} 💼`, sub: 'Job openings, interviews (8am to 4pm), daily shifts (6am to 6pm) and SIWES placements.',
      body: `<div class="kv"><b>Current job</b><span>${j ? j.name : 'Unemployed'}</span><b>Qualification</b><span>${state.degree ? `B.Sc. ${DEPTS[state.degree.dept].name} (${state.degree.cls})` : state.uni ? `Student, ${state.uni.level}L` : 'SSCE'}</span><b>NYSC</b><span>${state.nysc >= 3 ? 'Completed ✅' : 'Not completed'}</span><b>CV</b><span>${state.cv ? 'Printed ✅' : 'Not printed'}</span><b>Total earned</b><span>${fmt(state.earned)}</span></div>`,
      options: opts
    };
  },

  nysc: () => {
    const open = inHours(8, 16), closed = 'The secretariat is open 8am to 4pm.';
    const opts = [];
    let body = `<div class="kv"><b>Status</b><span>${['Not registered','Registered (camp pending)','Serving at PPA','Completed ✅'][state.nysc]}</span><b>PPA days</b><span>${state.ppa}/4</span></div>`;
    if (!state.degree) body += '<div class="warn">You need a university degree before you can serve.</div>';
    if (state.nysc === 0) opts.push(opt('Register for NYSC 📝', 'Free · Needs degree and NIN', () => { state.nysc = 1; advanceTime(60); toast('Registered! Your call-up letter is ready. Go to camp.', 'good'); }, !state.degree ? 'You need a degree first.' : !state.nin ? 'Register your NIN first.' : !open ? closed : null, 'cur'));
    if (state.nysc === 1) opts.push(opt('Go to orientation camp ⛺', '3 weeks (1 day in game) · -30 energy · +3 rep', () => {
      advanceTime(1440); state.nysc = 2; addHistory('Completed NYSC orientation camp', '⛺'); gain('energy', -30); gain('hunger', -20); gain('rep', 3);
      result('Camp completed ⛺', '<p>Parades, man-o-war drills and mammy market. You survived camp!</p><p>You have been posted to a PPA. Report here to serve your 4 PPA days. Allawee is ₦77,000 every 2 days served.</p>');
      return false;
    }, !open ? closed : null, 'cur'));
    if (state.nysc === 2){
      if (state.ppa < 4) opts.push(opt('Serve at PPA 🏫', `${state.ppa}/4 days · 8 hrs · -25 energy`, () => {
        state.daily.ppa = true; state.ppa++; gain('energy', -25); gain('hunger', -15); advanceTime(480); gain('rep', 1);
        if (state.ppa % 2 === 0){ state.money += 77000; toast('Allawee don land! +₦77,000', 'good'); }
        else toast(`PPA day ${state.ppa}/4 done.`, 'good');
      }, state.daily.ppa ? 'One PPA day per day.' : !open ? closed : state.energy < 25 ? 'Too tired (need 25 energy).' : null, 'cur'));
      else opts.push(opt('Collect discharge certificate 📜', 'Passing out parade', () => { state.nysc = 3; gain('rep', 5); addHistory('Completed NYSC service', '🇳🇬'); familyCheer('Mum: "My corper has finished service! Congratulations!" 🇳🇬'); sfx('ding'); result('Service completed 📜', '<p>You have received your <b>Certificate of National Service</b>. Print your CV at the Cyber Cafe and start applying for jobs!</p>'); return false; }, open ? null : closed, 'cur'));
    }
    if (state.nysc === 3) opts.push(opt('Attend CDS meeting 🤝', 'Community service · +2 rep', () => { state.daily.cds = true; gain('rep', 2); advanceTime(120); toast('You helped clean a local school. Respect!', 'good'); }, state.daily.cds ? 'Already attended today.' : !open ? closed : null));
    return {title:'NYSC Secretariat 🇳🇬', sub:'National Youth Service Corps. Serve your fatherland.', body, options:opts};
  },

  cyber: () => {
    const open = hour() >= 8 || hour() < 2;
    const yahooCount = state.daily.yahoo || 0;
    return {
      title: 'Cyber Cafe 💻', sub: open ? 'Open 8am to 2am. Fast browsing, printing and... other things.' : 'Closed. Opens 8am.',
      body: `<div class="kv"><b>CV</b><span>${state.cv ? 'Printed ✅' : 'Not printed'}</span>${state.heat > 0 ? `<b>Police heat</b><span style="color:#ff8a8a">${Math.round(state.heat)}/100</span>` : ''}</div>${state.heatNews ? '<div class="warn">📰 News today: police announced a crackdown on internet fraud. Raids are more likely.</div>' : ''}`,
      options: [
        opt('Print your CV 📄', `${fmt(1000)} · Needed for professional jobs`, () => { if (!spend(1000)) return; state.cv = true; advanceTime(30); toast('CV printed. You are ready for interviews!', 'good'); }, !open ? 'The cafe is closed.' : state.cv ? 'You already have a printed CV.' : null, state.cv ? '' : 'cur'),
        opt('Browse social media 📲', `${fmt(500)} · 1 hour · +5 energy`, () => { if (!spend(500)) return; advanceTime(60); gain('energy', 5); toast(pick(['You watched skits for one hour. You laughed tire.', 'X (Twitter) is on fire today!', 'You saw your classmate flexing in Dubai.']), 'good'); }, open ? null : 'The cafe is closed.'),
        opt('Do Yahoo Yahoo (fraud) ⚠️', 'Big money, big risk · 4 hrs · Raises police heat', () => {
          state.daily.yahoo = yahooCount + 1;
          advanceTime(240); gain('energy', -15); gain('hunger', -10);
          state.heat = clamp(state.heat + rint(18, 35) + (state.heatNews ? 10 : 0), 0, 100);
          if (Math.random() < 0.5){
            const amt = Math.round(rint(150000, 900000) / 1000) * 1000;
            state.money += amt; state.yahooHits++;
            toast(`Client don pay! You "made" ${fmt(amt)}. Police heat is rising 🚨`, 'good');
          } else toast('The mugu no fall for am. You wasted 4 hours.', 'bad');
          const raid = state.heat / 220 + (state.heatNews ? 0.12 : 0);
          if (Math.random() < raid){ arrest('Police raided the cyber cafe during your Yahoo operation!'); return false; }
        }, !open ? 'The cafe is closed.' : yahooCount >= 2 ? 'Even Yahoo boys rest. Max 2 per day.' : state.energy < 15 ? 'Too tired (need 15 energy).' : null, 'danger')
      ]
    };
  },

  hustle: () => {
    const opts = [];
    HUSTLES.forEach(h => {
      opts.push(opt(h.name, `${fmt(h.min)} to ${fmt(h.max)} · ${h.hours} hrs · -${h.energy} energy`, () => {
        state.daily.hustle = true; gain('energy', -h.energy); gain('hunger', -10); advanceTime(h.hours * 60);
        const amt = Math.round(rint(h.min, h.max) / 100) * 100;
        state.money += amt; state.hustleEarned += amt;
        toast(`${h.name}: you made ${fmt(amt)}.`, 'good');
      }, hustleBlock(h)));
      if (h.kit && !state.kits[h.kit]) opts.push(opt(`Buy ${h.kitName}`, fmt(h.kitCost), () => { if (!spend(h.kitCost)) return; state.kits[h.kit] = true; toast(`You bought a ${h.kitName}. You can now run that hustle.`, 'good'); }, null, 'hint'));
      if (h.skill && !state.skills[h.skill]) opts.push(opt(`Learn: ${h.skillName}`, `${fmt(h.skillCost)} · 6 hrs`, () => { if (!spend(h.skillCost)) return; state.skills[h.skill] = true; advanceTime(360); gain('energy', -15); toast(`Training complete! You can now do ${h.name}.`, 'good'); }, !inHours(8, 16) ? 'Training runs 8am to 4pm.' : null, 'hint'));
    });
    return {title:'Hustle Hub 🔥', sub:'Legit side hustles. One hustle per day, 7am to 9pm.', body:`<div class="kv"><b>Total hustle income</b><span>${fmt(state.hustleEarned)}</span></div>`, options:opts};
  },

  police: () => ({
    title: 'Police Station 👮🏾', sub: 'Police is your friend. (Abi?)',
    body: `<div class="kv"><b>Times arrested</b><span>${state.arrests}</span><b>Heat level</b><span>${Math.round(state.heat)}/100</span></div><p style="margin-top:8px">Heat rises when you do Yahoo and falls by 5 each day. High heat means more stop-and-search and raids.</p>`,
    options: [
      opt('Volunteer: community policing 🦺', '3 hrs · -15 energy · +2 rep', () => { state.daily.volunteer = true; advanceTime(180); gain('energy', -15); gain('rep', 2); toast('You helped direct traffic. The officers like you.', 'good'); }, state.daily.volunteer ? 'Already volunteered today.' : !inHours(8, 18) ? 'Volunteering runs 8am to 6pm.' : null),
      opt('Get a police report 📄', `${fmt(5000)} · Clean record bonus`, () => { if (!spend(5000)) return; state.daily.report = true; gain('rep', 1); toast('Police character certificate collected.', 'good'); }, state.heat > 20 ? 'They are looking at you suspiciously. Not today.' : state.daily.report ? 'Already collected today.' : null)
    ]
  }),

  arrest: (d) => {
    const bribe = 50000 + Math.round(state.heat) * 3000;
    return {
      title: '🚔 You have been arrested!', sub: d.reason,
      body: `<p>You are in a cell at the Police Station.${d.seized ? ` Officers seized <b>${fmt(d.seized)}</b> from your wallet as "exhibit".` : ''}</p><div class="kv"><b>Wallet</b><span>${fmt(state.money)}</span><b>Heat</b><span>${Math.round(state.heat)}/100</span></div>`,
      options: [
        opt('Bribe the officer 💸', `${fmt(bribe)} · May or may not work`, () => {
          if (!spend(bribe)) return;
          d.bribeTried = true;
          if (Math.random() < 0.6){ state.heat = clamp(state.heat - 15, 0, 100); gain('rep', -2); result('Released 😮‍💨', '<p>"Oya go, and make we no see you again." You walked out of the station.</p>'); return false; }
          toast('Oga collected the money and said e no reach! You are still in the cell.', 'bad');
        }, d.bribeTried ? 'The officer already "collected" from you.' : null),
        opt('Pay bail ⚖️', `${fmt(250000)} · Official bail`, () => { if (!spend(250000)) return; state.heat = clamp(state.heat - 25, 0, 100); gain('rep', -8); result('Out on bail ⚖️', '<p>You paid your bail and walked out. Your name is now in the police records.</p>'); return false; }),
        opt('Hire a lawyer 👨🏾‍⚖️', `${fmt(500000)} · Case dismissed`, () => { if (!spend(500000)) return; state.heat = 0; gain('rep', -2); result('Case dismissed 👨🏾‍⚖️', '<p>Your lawyer got the case thrown out for lack of evidence. Clean slate... for now.</p>'); return false; }),
        opt('Stay in the cell ⛓️', 'Detained 3 days · Lose your job', () => { detain(); return false; }, null, 'danger')
      ]
    };
  },

  checkpoint: () => {
    const settle = 10000 + Math.round(state.heat) * 300;
    return {
      title: '🚓 Police Stop and Search', sub: '"Oga, stop there! Bring your phone. Wetin you dey do for this area?"',
      body: state.heat >= 35 ? '<div class="warn">Your phone has Yahoo chats on it. If they search it, you are in trouble.</div>' : '<p>You have nothing to hide... hopefully.</p>',
      options: [
        opt('Comply and unlock your phone 📱', 'Let them search', () => { checkpointComply(); return false; }),
        opt('Settle them 💵', fmt(settle), () => { if (!spend(settle)) return; state.heat = clamp(state.heat - 5, 0, 100); result('Settled 💵', '<p>"Thank you sir. Enjoy your day."</p>'); return false; }),
        opt('Run! 🏃🏾', 'Risky. Depends on your energy', () => {
          if (Math.random() < 0.3 + state.energy / 400){ state.heat = clamp(state.heat + 10, 0, 100); gain('energy', -20); result('You escaped! 🏃🏾', '<p>You disappeared into a crowded bus stop. They will remember your face though. Heat increased.</p>'); }
          else arrest('You tried to run from a police checkpoint.');
          return false;
        }, null, 'danger')
      ]
    };
  },

  news: () => {
    const bought = state.daily.paper;
    return {
      title: 'Newsstand 📰', sub: 'Abeg buy paper, no be free reading!',
      body: bought ? `<b>Today's headlines (Day ${state.day})</b><ul>${state.news.map(n => `<li>${n}</li>`).join('')}</ul><div style="margin-top:6px;opacity:.8">Food price index today: <b>${Math.round(state.priceMod * 100)}%</b></div>` : '',
      options: [opt("Buy today's newspaper 📰", fmt(300), () => { if (!spend(300)) return; state.daily.paper = true; toast('You bought the paper.', 'good'); }, bought ? "You already have today's paper." : null)]
    };
  },

  lg: () => {
    const open = inHours(8, 16);
    const levyDue = state.day - state.levyDay >= 7;
    return {
      title: 'Local Government Secretariat 🏛️', sub: open ? 'Civic centre open 8am to 4pm.' : 'Office is closed. Opens 8am.',
      body: `<div class="kv"><b>NIN</b><span>${state.nin ? 'Registered ✅' : 'Not registered ❌'}</span><b>Development levy</b><span>${levyDue ? 'Due' : 'Paid this week ✅'}</span></div>`,
      options: [
        opt('Register NIN 🪪', 'Free · 2 hours · Needed for bank and NYSC', () => { state.nin = true; advanceTime(120); gain('rep', 5); sfx('ding'); toast('NIN registered! You can now bank and serve NYSC.', 'good'); }, !open ? 'The office is closed.' : state.nin ? 'You already have an NIN.' : null, state.nin ? '' : 'cur'),
        opt('Pay development levy 🏛️', `${fmt(10000)} · Weekly · +3 rep`, () => { if (!spend(10000)) return; state.levyDay = state.day; gain('rep', 3); toast('Levy paid. Good citizen!', 'good'); }, !open ? 'The office is closed.' : !levyDue ? 'Already paid this week.' : null),
        opt('Attend town hall meeting 🗣️', '2 hours · -10 energy · +2 rep', () => { state.daily.townhall = true; advanceTime(120); gain('energy', -10); gain('rep', 2); toast('You spoke at the town hall. People are noticing you.', 'good'); }, !inHours(10, 16) ? 'Town hall holds 10am to 4pm.' : state.daily.townhall ? 'Only one meeting per day.' : null)
      ]
    };
  },

  church: () => worship('church', 'Grace Assembly ⛪', 'Pray 🙏'),
  mosque: () => worship('mosque', 'Central Mosque 🕌', 'Pray 🤲'),

  estate: () => ({
    title: 'Shelter Real Estate 🏠', sub: `Move to a better place in ${AREA.name}. You pay first week rent + 10% agent fee.`,
    body: `<div class="kv"><b>Current home</b><span>${HOUSING[state.housing].name}</span><b>Next rent</b><span>Day ${state.rentDueDay}</span></div>`,
    options: HOUSING.map((h, i) => {
      const cost = Math.round(rentOf(i) * 1.1), cur = i === state.housing;
      return opt(`${cur ? '✅ ' : ''}${h.name}`, `${fmt(rentOf(i))}/week · Sleep +${h.sleep} energy${cur ? ' · Current' : ` · Move-in ${fmt(cost)}`}`, () => {
        if (!spend(cost)) return;
        state.housing = i; state.rentDueDay = state.day + 7; state.rentStrikes = 0; addHistory(`Moved into a ${h.name}`, '🏠'); gain('happy', 6);
        if (i > state.maxHousing){ gain('rep', h.rep); state.maxHousing = i; }
        toast(`You moved into a ${h.name}!`, 'good');
      }, cur ? 'You already live here.' : null, cur ? 'cur' : '');
    })
  }),

  barber: () => ({
    title: 'Kutz Barbing Salon 💈', sub: 'Fresh cut, fresh confidence. Look sharp for interviews!',
    body: state.daily.groomed ? '<p>You are looking sharp today. Interview panels will notice.</p>' : '',
    options: [
      opt(state.gender === 'f' ? 'Hair styling 💇🏾‍♀️' : 'Low cut ✂️', `${fmt(price(2500))} · +2 rep · Interview bonus today`, () => { if (!spend(price(2500))) return; state.daily.groomed = true; gain('rep', 2); advanceTime(30); toast('Sharp! You look clean.', 'good'); }, state.daily.groomed ? 'You already got groomed today.' : null, 'cur'),
      opt('Full grooming 💈', `${fmt(price(6000))} · +4 rep · Interview bonus today`, () => { if (!spend(price(6000))) return; state.daily.groomed = true; gain('rep', 4); advanceTime(60); toast('Correct! Everybody dey look you.', 'good'); }, state.daily.groomed ? 'You already got groomed today.' : null)
    ]
  }),

  motors: () => ({
    title: 'Oga Motors 🏍️', sub: 'Vehicles for every level of hustle.',
    body: state.hasOkada ? 'You own an okada. Use the menu (☰) to switch between riding and walking. Ride carefully!' : '',
    options: [
      opt('Okada (Bajaj Boxer) 🏍️', `${fmt(850000)} · Faster movement · Unlocks Okada Rider job`, () => {
        if (!spend(850000)) return;
        state.hasOkada = true; state.riding = true; addHistory('Bought an okada', '🏍️'); gain('happy', 5); gain('rep', 2); toast('You bought an okada! You are now riding. Watch out for cars!', 'good');
      }, state.hasOkada ? 'You already own an okada.' : null),
      opt('Keke Napep 🛺', fmt(2800000), () => {}, 'Keke and commercial transport arrive in a future update.'),
      opt('Toyota Corolla (2010) 🚗', fmt(9500000), () => {}, 'Cars arrive in a future update.')
    ]
  }),

  joint: () => {
    const open = hour() >= 12 || hour() < 2;
    return {
      title: 'Chill Spot 🍻', sub: open ? 'Pepper soup, football and good vibes. Open 12pm to 2am.' : 'Closed. Opens 12pm.',
      body: '',
      options: [
        opt('Watch football ⚽', `${fmt(1000)} · 2 hours · +10 energy`, () => { if (!spend(1000)) return; advanceTime(120); gain('energy', 10); gain('happy', 4); toast(pick(['GOAL!!! The whole place scatter!', 'Na draw. Everybody vex.', 'Your team won! You dey happy.']), 'good'); }, open ? null : 'Chill Spot is closed.'),
        opt('Pepper soup 🍲', `${fmt(price(3000))} · +35 food · +10 energy`, () => { if (!spend(price(3000))) return; advanceTime(30); gain('hunger', 35); gain('energy', 10); toast('That pepper soup clear your eye!', 'good'); }, open ? null : 'Chill Spot is closed.'),
        opt('Buy drinks for the boys 🍻', `${fmt(10000)} · +4 rep · -5 energy`, () => { if (!spend(10000)) return; state.daily.round = true; advanceTime(60); gain('rep', 4); gain('energy', -5); gain('happy', 4); toast('Big man! Everybody dey hail you.', 'good'); }, !open ? 'Chill Spot is closed.' : state.daily.round ? 'You already bought a round today.' : null)
      ]
    };
  },

  npc: (n) => {
    if (!panelState.line) panelState.line = pick(n.police ? POLICE_LINES : [`${AREA.greet}! ` + pick(LINES), ...LINES]);
    return {
      title: n.name, sub: n.role,
      body: `<div class="qtext">"${panelState.line}"</div>`,
      options: [
        opt('Greet 👋', '+1 rep (once per person, per day)', () => { n.greetDay = state.day; gain('rep', 1); panelState.line = pick(['Ehen! Good to see you.', 'Thank you, my person!', 'You too, safe journey.', 'God bless you.']); toast(`You greeted ${n.name}.`, 'good'); }, n.greetDay === state.day ? `You already greeted ${n.name} today.` : null),
        opt('Ask for advice 💡', 'Get a life tip', () => { panelState.line = pick(TIPS); }),
        opt('Ask for directions 🧭', 'Where should I go next?', () => { const g = goal(); panelState.line = `Your next stop? ${B[g.to].name}, at ${addressOf(B[g.to])}. Just follow the road.`; }),
        opt('Bye 👋', 'Continue your day', () => { closePanel(); return false; })
      ]
    };
  },

  quiz: () => {
    const Q = quiz.cfg.questions[quiz.i];
    const opts = [];
    Q.opts.forEach((o, k) => { if (!quiz.removed.includes(k)) opts.push(opt(o, '', () => answerQuiz(k))); });
    if (quiz.hints > 0 && !quiz.removed.length) opts.push(opt(`💡 Use hint (${quiz.hints} left)`, 'Removes 2 wrong answers', () => {
      quiz.hints--;
      quiz.removed = shuffle([0, 1, 2, 3].filter(k => k !== Q.ans)).slice(0, 2);
    }, null, 'hint'));
    return {title:quiz.cfg.title, sub:`Question ${quiz.i + 1} of ${quiz.cfg.questions.length} · Correct so far: ${quiz.score}`, body:`<div class="qtext">${Q.q}</div>`, options:opts};
  },

  result: (d) => ({title:d.title, sub:'', body:d.body, options:d.options}),

  inventory: () => {
    const keys = Object.keys(state.inv).filter(k => state.inv[k] > 0);
    return {
      title: 'Your Bag 🎒', sub: keys.length ? 'Tap an item to eat or use it.' : `Your bag is empty. Buy food at ${AREA.market} or medicine at the hospital.`,
      body: `<div class="kv"><b>🍛 Hunger</b><span>${Math.round(state.hunger)}/100</span><b>⚡ Energy</b><span>${Math.round(state.energy)}/100</span><b>❤️ Health</b><span>${Math.round(state.health)}/100</span></div>`,
      options: keys.map(k => {
        const it = ITEMS[k];
        const fx = [it.food ? `+${it.food} food` : '', it.energy ? `+${it.energy} energy` : '', it.health ? `+${it.health} health` : ''].filter(Boolean).join(' · ');
        return opt(`${it.food ? 'Eat' : 'Use'} ${it.name} ×${state.inv[k]}`, fx, () => {
          state.inv[k]--; gain('hunger', it.food || 0); gain('energy', it.energy || 0); gain('health', it.health || 0);
          toast(`${it.food ? 'Ate' : 'Used'} ${it.name}.`, 'good');
        });
      })
    };
  },

  guide: () => {
    const U = state.uni;
    const steps = [
      ['Enrol for NIN (NIMC Enrolment Centre)', state.nin],
      ['Pass JAMB with 200+ (Unity University)', !!state.jamb],
      ['Choose a department', !!(U || state.degree)],
      ['Pass 100L to 300L exams', !!(state.degree || (U && U.level >= 400))],
      ['Complete SIWES (Business Hub)', !!(state.degree || (U && U.level >= 400 && !U.needSiwes))],
      ['Pass 400L and graduate', !!state.degree],
      ['NYSC camp and PPA (NYSC Secretariat)', state.nysc >= 3],
      ['Print CV (Cyber Cafe)', state.cv],
      ['Pass an interview and get a job', !!state.job && !!JOB[state.job].interview]
    ];
    return {
      title: 'Life Guide 🧭', sub: 'Your path from JJC to big man/woman.',
      body: `<ol>${steps.map(([t, d]) => `<li>${d ? '✅' : '⬜'} ${t}</li>`).join('')}</ol>
        <div class="note"><b>🧭 Directions:</b> follow the yellow dots on the ground and the arrow beside your goal. Tap 🗺️ to navigate anywhere.</div>
        <div class="note"><b>🍛 How to eat:</b> Mama Nkechi's Buka (7am to 9pm) for hot food, or buy food at ${AREA.market} and eat it from your Bag. Sleeping makes you hungry, so eat breakfast.</div>
        <div class="note"><b>🚦 Road safety:</b> cross at zebra crossings. Cars stop for you there and at red traffic lights. Jaywalking can land you in hospital.</div>
        <div class="warn"><b>⚠️ Yahoo:</b> fast money at the Cyber Cafe, but it raises police heat. Expect stop-and-search, raids, arrests, bribes and bail.</div>`,
      options: [opt('Back', 'Return to menu', () => { openPanel('menu'); return false; })]
    };
  },

  menu: () => ({
    title: 'Menu', sub: `${state.name} · Day ${state.day} · ${AREA.name}, ${AREA.city}`,
    body: '',
    options: [
      opt('Life Guide 🧭', 'Your path, eating and road safety', () => { openPanel('guide'); return false; }),
      opt('Directory 🗺️', 'Navigate to any place', () => { openPanel('directory'); return false; }),
      opt('Profile 👤', 'Your life at a glance', () => { openPanel('profile'); return false; }),
      opt('Bag 🎒', 'Eat food and use medicine', () => { openPanel('inventory'); return false; }),
      opt(state.riding ? 'Get off okada 🚶' : 'Ride okada 🏍️', state.hasOkada ? 'Switch movement mode' : 'Buy one at Oga Motors', () => { state.riding = !state.riding; toast(state.riding ? 'You are riding your okada.' : 'You are walking.', 'info'); }, state.hasOkada ? null : 'You do not own an okada yet.'),
      opt(`Auto camera: ${state.autoCam ? 'ON' : 'OFF'} 🎥`, 'Camera swings behind you as you walk', () => { state.autoCam = !state.autoCam; }),
      opt(`Graphics: ${GFX === 'high' ? 'HIGH' : 'LOW'} ⚙️`, 'Switch if your phone is slow (reloads)', () => { try { localStorage.setItem(GFX_KEY, GFX === 'high' ? 'low' : 'high'); } catch (e) {} saveGame(true); location.reload(); return false; }),
      opt('Save game 💾', 'Also saves automatically', () => { saveGame(); }),
      opt('Full screen ⛶', 'Better on mobile', () => { goFullscreen(); }),
      opt('How to play ❓', 'Controls and tips', () => { openPanel('intro'); return false; }),
      opt('Start new life 🔄', 'Erases your current save', () => { openPanel('confirmReset'); return false; }, null, 'danger')
    ]
  }),

  profile: () => {
    const j = state.job ? JOB[state.job] : null, U = state.uni, d = state.degree;
    return {
      title: `${state.name} 👤`, sub: `${state.gender === 'f' ? 'Female' : 'Male'} · ${AREA.name}, ${AREA.city}`,
      body: `<div class="kv">
        <b>Home address</b><span>${addressOf(B.home)}, ${AREA.name}</span>
        <b>Wallet / Bank</b><span>${fmt(state.money)} / ${fmt(state.bank)}</span>
        <b>Health / Energy / Food</b><span>${Math.round(state.health)} / ${Math.round(state.energy)} / ${Math.round(state.hunger)}</span>
        <b>Reputation</b><span>${Math.round(state.rep)}/100</span>
        <b>Education</b><span>${d ? `B.Sc. ${DEPTS[d.dept].name} (${d.cls})` : U ? `${DEPTS[U.dept].name}, ${U.level}L${U.carry ? ' (carryover)' : ''}` : state.jamb ? `JAMB ${state.jamb}, no department yet` : 'SSCE'}</span>
        <b>NYSC</b><span>${['Not started','Registered','Serving','Completed'][state.nysc]}</span>
        <b>Job</b><span>${j ? j.name : 'Unemployed'}</span>
        <b>Home</b><span>${HOUSING[state.housing].name}</span>
        <b>Vehicle</b><span>${state.hasOkada ? 'Okada' : 'None'}</span>
        <b>Earned (jobs / hustles)</b><span>${fmt(state.earned)} / ${fmt(state.hustleEarned)}</span>
        <b>Arrests / Accidents</b><span>${state.arrests} / ${state.accidents}</span>
      </div>`,
      options: [opt('Back', 'Return to menu', () => { openPanel('menu'); return false; })]
    };
  },

  confirmReset: () => ({
    title: 'Start a new life?', sub: 'This deletes your current progress. You will choose a new name and area.',
    body: '',
    options: [
      opt('Yes, start over', 'Choose a new area', () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); return false; }, null, 'danger'),
      opt('No, go back', '', () => { openPanel('menu'); return false; })
    ]
  })
};

function worship(id, name, prayLabel){
  const key = 'pray_' + id, offKey = 'off_' + id;
  return {
    title: name, sub: 'A place of peace in the busy city.',
    body: '',
    options: [
      opt(prayLabel, '1 hour · +1 rep · +5 energy', () => { state.daily[key] = true; advanceTime(60); gain('rep', 1); gain('energy', 5); gain('happy', 3); state.lastWorship = state.day; toast('You feel at peace.', 'good'); }, state.daily[key] ? 'You already prayed here today.' : null),
      opt('Give an offering 💝', `${fmt(2000)} · +2 rep`, () => { if (!spend(2000)) return; state.daily[offKey] = true; gain('rep', 2); toast('God bless you!', 'good'); }, state.daily[offKey] ? 'You already gave today.' : null)
    ]
  };
}

const pTitle = $('pTitle'), pSub = $('pSub'), pBody = $('pBody'), pOpts = $('pOpts'), panelEl = $('panel');
function openPanel(kind, data){
  panelState = {kind, data};
  paused = true;
  keys.clear();
  resetJoy();
  renderPanel();
  panelEl.classList.add('show');
  panelEl.querySelector('.box').scrollTop = 0;
  $('pClose').style.display = kind === 'setup' ? 'none' : '';
}
function closePanel(){
  if (panelState){
    const k = panelState.kind;
    if (k === 'setup') return;
    if (k === 'quiz' && quiz){ finishQuiz(); return; }
    if (k === 'arrest'){ panelState = null; detain(); return; }
    if (k === 'checkpoint'){ panelState = null; checkpointComply(); return; }
    if (k === 'event'){
      const inst = panelState.data;
      if (!state.pending.some(x => x.key === inst.key)){
        panelEl.classList.remove('show'); panelState = null; paused = false;
        const msg = resolveEvent(inst, EVENT[inst.id].ignore);
        if (msg) toast(msg, 'info');
        saveGame(true); setTimeout(flushQueue, 350); return;
      }
    }
  }
  panelEl.classList.remove('show');
  panelState = null; paused = false;
  saveGame(true);
  setTimeout(flushQueue, 350);
}
function renderPanel(){
  if (!panelState) return;
  const p = PANELS[panelState.kind](panelState.data);
  pTitle.textContent = p.title;
  let sub = p.sub || '';
  if (B[panelState.kind]) sub = `📍 ${addressOf(B[panelState.kind])}, ${AREA.name}${sub ? ' · ' + sub : ''}`;
  pSub.textContent = sub;
  pBody.innerHTML = p.body || '';
  const bb = $('bubbles'); if (bb) bb.scrollTop = bb.scrollHeight;
  const ni = $('nameIn');
  if (ni){ ni.addEventListener('input', () => { setupData.name = ni.value; }); ni.addEventListener('keydown', e => e.stopPropagation()); }
  pOpts.innerHTML = '';
  p.options.forEach(o => {
    const b = document.createElement('button');
    b.className = 'opt' + (o.why ? ' dis' : '') + (o.cls ? ' ' + o.cls : '');
    b.innerHTML = `<b>${o.label}</b>${o.note ? `<span>${o.note}</span>` : ''}`;
    b.addEventListener('click', () => {
      if (o.why){ toast(o.why, 'bad'); return; }
      const r = o.action();
      if (state) updateHUD();
      if (r !== false && panelState) renderPanel();
      saveGame(true);
    });
    pOpts.appendChild(b);
  });
}
$('pClose').addEventListener('click', closePanel);
panelEl.addEventListener('click', e => { if (e.target === panelEl) closePanel(); });
$('menuBtn').addEventListener('click', () => { if (panelState) closePanel(); else openPanel('menu'); });
$('bagBtn').addEventListener('click', () => { if (panelState && panelState.kind === 'inventory') closePanel(); else if (!panelState) openPanel('inventory'); });
$('mapBtn').addEventListener('click', () => { if (panelState && panelState.kind === 'directory') closePanel(); else if (!panelState) openPanel('directory'); });

function goFullscreen(){
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req){
    Promise.resolve(req.call(el)).then(() => {
      try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
    }).catch(() => toast('Full screen is not available on this browser.', 'bad'));
  } else toast('Full screen is not available on this browser.', 'bad');
}

