'use strict';
/* =========================================================
   CAREERS (V6.1): job ladders, performance, promotions,
   overtime, workplace events, missed days and sackings.
   ========================================================= */
const LADDERS = {
  labourer:['Site Labourer', 'Mason Assistant', 'Site Foreman', 'Site Supervisor'],
  sales:['Shop Sales Rep', 'Senior Sales Rep', 'Shop Supervisor', 'Store Manager'],
  okada:['Okada Rider', 'Dispatch Rider', 'Fleet Captain', 'Logistics Coordinator'],
  teller:['Bank Teller', 'Customer Service Officer', 'Relationship Manager', 'Branch Manager', 'Regional Director'],
  dev:['Junior Developer', 'Software Developer', 'Senior Developer', 'Tech Lead', 'Engineering Manager', 'Chief Technology Officer'],
  accountant:['Audit Trainee', 'Accountant', 'Senior Accountant', 'Finance Manager', 'Chief Financial Officer'],
  journalist:['Reporter', 'TV Journalist', 'Senior Correspondent', 'News Editor', 'Head of News'],
  engineer:['Graduate Engineer', 'Mechanical Engineer', 'Senior Engineer', 'Project Manager', 'Engineering Director'],
  labsci:['Lab Assistant', 'Lab Scientist', 'Senior Lab Scientist', 'Chief Lab Scientist', 'Head of Laboratory']
};
const PAY_MULT = [1, 1.4, 1.9, 2.6, 3.6, 5];
const isWeekday = d => (d - 1) % 7 < 5;

function career(){
  if (!state.job) return null;
  if (!state.career || state.career.job !== state.job) state.career = {job:state.job, level:0, shifts:0, total:0, perf:55, lastWorked:state.day, missed:0, cool:0, since:state.day};
  return state.career;
}
function ladder(){ return LADDERS[state.job] || [JOB[state.job].name]; }
function jobTitle(){
  if (state.job){ const C = career(); return ladder()[Math.min(C.level, ladder().length - 1)]; }
  if (state.biz && state.biz.length) return 'Business owner';
  return state.uni ? `Student ${state.uni.level}L` : state.nysc === 2 ? 'Corps member' : 'Unemployed';
}
function shiftPay(){ const C = career(); return C ? Math.round(JOB[state.job].pay * PAY_MULT[C.level] / 100) * 100 : 0; }
function promoNeed(){
  const C = career();
  return {shifts:4 + C.level * 2, perf:55 + C.level * 5, rep:40 + C.level * 8, degree:C.level >= 2 && !state.degree};
}
function promoBlock(){
  const C = career(), L = ladder(), n = promoNeed();
  if (C.level >= L.length - 1) return 'You are at the top of this career ladder. 👑';
  if (C.cool > state.day) return `HR said to wait until Day ${C.cool}.`;
  if (C.shifts < n.shifts) return `Work ${n.shifts - C.shifts} more shift(s) at this level first.`;
  if (C.perf < n.perf) return `Performance needs to be ${n.perf}+ (now ${Math.round(C.perf)}).`;
  if (state.rep < n.rep) return `Reputation needs to be ${n.rep}+ (now ${Math.round(state.rep)}).`;
  if (n.degree) return 'This level requires a university degree.';
  return null;
}
function careerBody(){
  const C = career(), L = ladder(), n = promoNeed(), next = L[C.level + 1];
  const bar = (v, c) => `<span style="display:inline-block;width:90px;height:7px;border-radius:4px;background:rgba(255,255,255,.15);vertical-align:middle;margin-left:6px"><i style="display:block;height:100%;width:${Math.max(0, Math.min(100, v))}%;background:${c};border-radius:4px"></i></span>`;
  return `<div class="kv"><b>Position</b><span>${esc(jobTitle())} (level ${C.level + 1} of ${L.length})</span><b>Pay</b><span>${fmt(shiftPay())} per shift</span><b>Performance</b><span>${Math.round(C.perf)}/100 ${bar(C.perf, C.perf >= 60 ? '#2fbf71' : C.perf >= 35 ? '#ffd23f' : '#ff5a5a')}</span>${next ? `<b>Next role</b><span>${esc(next)} · ${Math.min(C.shifts, n.shifts)}/${n.shifts} shifts · perf ${n.perf}+ · rep ${n.rep}+${n.degree ? ' · degree' : ''}</span>` : '<b>Next role</b><span>Top of the ladder 👑</span>'}${C.missed ? `<b>Missed days</b><span style="color:#ff8a8a">${C.missed} in a row</span>` : ''}</div>`;
}
function doShift(over){
  const j = JOB[state.job], C = career();
  const hrs = over ? 3 : j.hours, en = over ? Math.round(j.energy * 0.6) : j.energy;
  if (over) state.daily.overtime = true; else state.daily.worked = true;
  gain('energy', -en); gain('hunger', over ? -8 : -15); advanceTime(hrs * 60);
  const base = over ? Math.round(shiftPay() * 0.6) : shiftPay();
  const bonus = over ? 0 : Math.round(base * (state.rep - 50) / 500), pay = base + Math.max(0, bonus);
  state.money += pay; state.earned += pay; gain('rep', 1);
  if (!over){ state.shifts++; C.shifts++; C.total++; C.lastWorked = state.day; C.missed = 0; }
  let dp = rint(1, 4) + (over ? 3 : 0);
  if (state.energy < 15) dp -= 3;
  if (state.happy < 25) dp -= 2;
  if (state.daily.dressed || state.daily.groomed) dp += 1;
  C.perf = clamp(C.perf + dp, 0, 100);
  toast(`${over ? 'Overtime' : 'Shift'} done! You earned ${fmt(pay)}. Performance ${dp >= 0 ? '+' : ''}${dp}.`, 'good');
  if (!over && Math.random() < 0.28) setTimeout(() => queueNow({id:pick(['workBoss', 'workCredit', 'workClient', 'workTraining'])}), 600);
  if (!promoBlock() && !C.offered){ C.offered = true; setTimeout(() => toast('📈 You qualify for a promotion review! Ask HR at the Business Hub.', 'good'), 1500); }
}
function askPromotion(){
  const C = career(), L = ladder();
  closePanel();
  const ch = clamp(0.45 + (C.perf - 60) / 80 + (state.rep - 50) / 200 + (state.daily.dressed || state.daily.groomed ? 0.1 : 0), 0.15, 0.95), ok = Math.random() < ch;
  const steps = [
    {say:['player', 'Good morning. I would like to discuss my career growth here.'], ms:2000},
    {say:[{name:'HR Manager'}, ok ? `Your results speak for themselves, ${state.name}. Congratulations, you are our new ${L[C.level + 1]}! 🎉` : 'You are doing well, but we need to see more consistency. Let us review again in a few days.'], ms:2800}
  ];
  if (inside && inside.id === 'jobs' && inside.hr) steps.unshift({to:{x:inside.ox + 13.5, z:inside.oz + 6.9, face:Math.PI}, pose:'sit', y:0}), steps[1].say[0] = 'player', steps[2].say[0] = inside.hr, steps.push({pose:null, to:{x:inside.ox + 13.5, z:inside.oz + 7.8, face:0}});
  runScene(steps).then(() => {
    if (ok){
      C.level++; C.shifts = 0; C.offered = false; C.perf = clamp(C.perf - 10, 40, 100);
      gain('rep', 4); gain('happy', 12); sfx('ding');
      addHistory(`Promoted to ${L[C.level]}`, '📈');
      familyCheer(`Dad: "${L[C.level]}?! My child is going places!" 📈`);
      result('Promoted! 📈', `<p>You are now <b>${L[C.level]}</b>.</p><p>New pay: <b>${fmt(shiftPay())}</b> per shift.</p>`);
    } else { C.cool = state.day + 3; C.perf = clamp(C.perf - 2, 0, 100); gain('happy', -4); result('Not yet 😐', '<p>HR wants to see more. Keep your performance up and try again in 3 days.</p>'); }
  });
}
function careerDaily(){
  const C = career(); if (!C) return;
  const y = state.day - 1;
  if (isWeekday(y) && C.lastWorked < y && state.day - C.since > 1){
    C.missed++; C.perf = clamp(C.perf - 6, 0, 100);
    if (C.missed === 2) toast(`📩 Email from your boss: "You were absent again yesterday. This is unacceptable."`, 'bad');
    if (C.missed >= 3 || C.perf <= 10){
      addHistory(`Sacked from ${jobTitle()} for absence`, '📦'); gain('happy', -12); gain('rep', -5);
      result('You have been sacked 📦', `<p>"Due to repeated absence and poor performance, your appointment as <b>${esc(jobTitle())}</b> is terminated with immediate effect."</p><p>Go back to the Business Hub to apply for jobs again.</p>`);
      state.job = null; state.career = null;
    }
  }
}

/* workplace events */
[
  {id:'workBoss', w:0, cool:0, ignore:1,
    title:() => 'Your boss needs a favour 💼',
    body:() => `"${state.name}, the client presentation is tomorrow and the team is behind. Can you stay back tonight and finish the report?"`,
    options:() => [
      opt('Stay late and deliver 💪🏾', '-20 energy · +performance', () => { gain('energy', -20); advanceTime(120); career().perf = clamp(career().perf + 8, 0, 100); return 'The boss was impressed: "This is why I trust you." (+8 performance)'; }, null, 'cur'),
      opt('Politely decline', 'Protect your rest', () => { career().perf = clamp(career().perf - 3, 0, 100); return 'Boss: "Hmm. Okay." (-3 performance)'; })
    ]},
  {id:'workCredit', w:0, cool:0, ignore:1,
    title:() => 'A colleague took credit 😤',
    body:() => 'In the meeting, your colleague presented your idea as theirs. The manager praised them.',
    options:() => [
      opt('Speak up calmly with proof 📎', 'Risky but fair', () => { if (Math.random() < 0.6){ career().perf = clamp(career().perf + 6, 0, 100); gain('rep', 2); return 'You showed your email trail. The manager corrected the record. (+6 performance)'; } career().perf = clamp(career().perf - 3, 0, 100); return 'It became an argument. The manager told you both to calm down. (-3 performance)'; }),
      opt('Let it slide', 'Keep the peace', () => { gain('happy', -5); return 'You let it go, but it stings.'; })
    ]},
  {id:'workClient', w:0, cool:0, ignore:0,
    title:() => 'An angry customer 😡',
    body:() => 'A customer is shouting at you over a mistake that was not yours.',
    options:() => [
      opt('Stay calm and solve it 🙏🏾', '+performance', () => { career().perf = clamp(career().perf + 5, 0, 100); gain('happy', -2); return 'You calmed them down and fixed it. Your supervisor noticed. (+5 performance)'; }, null, 'cur'),
      opt('Give them attitude', '', () => { career().perf = clamp(career().perf - 8, 0, 100); return 'They reported you to management. (-8 performance)'; }, null, 'danger')
    ]},
  {id:'workTraining', w:0, cool:0, ignore:1,
    title:() => 'Training opportunity 📚',
    body:() => `The company is sponsoring a weekend certification course. It costs you ${fmt(price(30000))} for materials.`,
    options:() => [
      opt('Enrol 🎓', fmt(price(30000)), () => { if (!spendAny(price(30000))) return false; career().perf = clamp(career().perf + 10, 0, 100); gain('energy', -10); addHistory('Earned a work certification', '🎓'); return 'You earned the certificate! (+10 performance)'; }, null, 'cur'),
      opt('Not now', '', () => 'Maybe next time.')
    ]}
].forEach(e => { EVENTS.push(e); EVENT[e.id] = e; });

/* jobs panel: real career view */
const _jobsP = PANELS.jobs;
PANELS.jobs = () => {
  const r = _jobsP();
  if (!state.job) return r;
  const j = JOB[state.job], C = career();
  const i = r.options.findIndex(o => /^Work a shift/.test(o.label));
  if (i >= 0){
    const why = r.options[i].why;
    r.options.splice(i, 1,
      opt('Work a shift 💼', `${jobTitle()} · ${fmt(shiftPay())} · ${j.hours} hrs · -${j.energy} energy`, () => { doShift(false); }, why, 'cur'),
      opt('Work overtime ⏰', `${fmt(Math.round(shiftPay() * 0.6))} · 3 hrs · +performance`, () => { doShift(true); }, !state.daily.worked ? 'Work your normal shift first.' : state.daily.overtime ? 'One overtime per day.' : state.energy < 20 ? 'Too tired for overtime.' : null),
      opt('Ask for a promotion review 📈', ladder()[C.level + 1] ? `Next: ${ladder()[C.level + 1]}` : 'Top of the ladder', () => { askPromotion(); return false; }, promoBlock(), promoBlock() ? '' : 'cur'));
  }
  r.body = careerBody() + r.body;
  return r;
};
if (typeof SPOTS !== 'undefined') SPOTS.jobs.push(S_(/overtime/i, 9.5, 4.4, Math.PI, {pose:'sit', say:['Let me finish this report before I go home... 😮‍💨']}));
