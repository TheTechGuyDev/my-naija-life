'use strict';
/* =========================================================
   BUSINESS OWNERSHIP (V6.1)
   Register with CAC, open a business, hire staff, buy stock,
   set prices, advertise, supervise, and live with daily
   profit or loss, theft, task force and big orders.
   ========================================================= */
const BIZ_TYPES = {
  pos:{name:'POS Kiosk', icon:'🏧', cost:350000, rent:1500, stockless:true, base:[14000, 32000], staffMax:2, role:'POS attendant', wage:[2500, 4000], desc:'Cash withdrawals and transfers. Cheap to start, steady small income.'},
  provisions:{name:'Provisions Store', icon:'🛒', cost:900000, rent:3000, base:[80000, 180000], markup:0.35, staffMax:2, role:'Sales attendant', wage:[3000, 5000], desc:'Sell drinks, noodles, toiletries. Needs stock.'},
  restaurant:{name:'Buka Restaurant', icon:'🍲', cost:2500000, rent:6000, base:[250000, 500000], markup:0.6, staffMax:4, role:'Cook / server', wage:[4000, 7000], diesel:4000, desc:'High sales, high costs. Needs foodstuff stock and good cooks.'},
  logistics:{name:'Dispatch Logistics', icon:'🛵', cost:4000000, rent:5000, stockless:true, perRider:[35000, 60000], bikes:2, staffMax:6, role:'Dispatch rider', wage:[5000, 8000], desc:'Riders deliver for online shops. Each rider needs a bike (2 included).'}
};
const PRICE = {low:{name:'Low prices', demand:1.25, markup:0.6}, normal:{name:'Normal prices', demand:1, markup:1}, premium:{name:'Premium prices', demand:0.8, markup:1.4}};
const BIZ = () => state.biz || (state.biz = []);
const bizType = b => BIZ_TYPES[b.type];
function bizWorth(){ return BIZ().reduce((s, b) => s + Math.round(bizType(b).cost * 0.6 * (1 + b.level * 0.5) + (b.stock || 0) + Math.max(0, b.cash)), 0); }
function bizStaffMax(b){ return bizType(b).staffMax + b.level; }
function staffName(){ const R = REGIONS[pick(Object.keys(REGIONS))]; const g = Math.random() < 0.5; return `${pick(g ? R.kidsM.concat(R.male) : R.kidsF.concat(R.female))} ${pick(R.surnames)}`; }
function candidates(b){
  if (b.cands && b.cands.day === state.day) return b.cands.list;
  const T = bizType(b);
  const list = [0, 1, 2].map(() => {
    const skill = rint(1, 5), trait = pick(['hardworking', 'honest', 'lazy', 'friendly', 'sharp']);
    return {name:staffName(), skill, trait, wage:Math.round((T.wage[0] + (T.wage[1] - T.wage[0]) * (skill - 1) / 4) / 100) * 100, morale:70};
  });
  b.cands = {day:state.day, list};
  return list;
}

/* ---------- daily simulation ---------- */
function simBiz(b){
  const T = bizType(b), P = PRICE[b.price || 'normal'], weekend = (state.day - 2) % 7 >= 5;
  const visited = b.visitDay >= state.day - 1;
  const staff = b.staff.length, skill = staff ? b.staff.reduce((s, x) => s + x.skill, 0) / staff : 0;
  const log = {d:state.day - 1, rev:0, cogs:0, cost:0, note:''};
  if (!staff && !visited){ log.note = 'Closed: no staff and you did not open the shop.'; b.rep = clamp(b.rep - 2, 0, 100); }
  else {
    const f = (0.8 + b.rep / 250) * P.demand * (weekend ? 1.2 : 1) * (visited ? 1.15 : 1) * (1 + b.level * 0.25) * Math.min(1.1, 0.55 + 0.2 * staff + 0.08 * skill) * state.priceMod;
    if (T.perRider){ const riders = Math.min(staff, T.bikes + b.level); for (let i = 0; i < riders; i++) log.rev += rint(T.perRider[0], T.perRider[1]) * f; if (staff > riders) log.note = `${staff - riders} rider(s) had no bike. `; }
    else log.rev = rint(T.base[0], T.base[1]) * f;
    if (!T.stockless){
      const mk = T.markup * P.markup, need = log.rev / (1 + mk);
      if ((b.stock || 0) < need){ log.rev = (b.stock || 0) * (1 + mk); log.note += 'Ran out of stock! '; b.rep = clamp(b.rep - 3, 0, 100); }
      else b.rep = clamp(b.rep + 0.6, 0, 100);
      log.cogs = log.rev / (1 + mk); b.stock = Math.max(0, (b.stock || 0) - log.cogs);
    } else b.rep = clamp(b.rep + 0.4, 0, 100);
    const lastVisit = state.day - (b.visitDay || 0), honest = b.staff.filter(x => x.trait === 'honest').length;
    if (staff && lastVisit > 3 && Math.random() < 0.12 - honest * 0.04){ const lost = log.rev * (0.15 + Math.random() * 0.25); log.rev -= lost; log.note += `About ${fmt(lost)} went missing. 👀 `; }
  }
  const wages = b.staff.reduce((s, x) => s + x.wage, 0);
  log.cost = wages + T.rent * AREA.cost + (T.diesel ? T.diesel * (Math.random() < 0.6 ? 1 : 0.3) : 0);
  log.rev = Math.round(log.rev); log.cogs = Math.round(log.cogs); log.cost = Math.round(log.cost);
  b.cash += log.rev - log.cost;
  if (b.cash < 0 && wages){ b.staff.forEach(x => x.morale -= 15); log.note += 'Staff were not paid in full! '; }
  else b.staff.forEach(x => x.morale = clamp(x.morale + (x.trait === 'friendly' ? 2 : 1), 0, 100));
  const quit = b.staff.filter(x => x.morale < 25 && Math.random() < 0.5);
  quit.forEach(x => { log.note += `${x.name} resigned. `; });
  b.staff = b.staff.filter(x => !quit.includes(x));
  b.staff.forEach(x => { if (x.trait === 'hardworking' && Math.random() < 0.1) x.skill = Math.min(5, x.skill + 1); });
  log.profit = log.rev - log.cogs - log.cost;
  b.total = (b.total || 0) + log.profit;
  b.log.push(log); if (b.log.length > 14) b.log.shift();
  return log;
}
function bizDaily(){
  if (!BIZ().length) return;
  let sum = 0; const notes = [];
  BIZ().forEach(b => { const l = simBiz(b); sum += l.profit; if (l.note) notes.push(`${b.name}: ${l.note.trim()}`); });
  const msg = `Yesterday's business result: ${sum >= 0 ? 'profit' : 'loss'} of ${fmt(Math.abs(sum))}.${notes.length ? ' ' + notes.join(' ') : ''}`;
  if (typeof smsAdd === 'function') smsAdd('My Business', msg);
  toast(`🏪 ${msg.slice(0, 120)}`, sum >= 0 ? 'good' : 'bad');
  if (sum > 0) gain('happy', 1);
}

/* ---------- actions ---------- */
function startBiz(type){
  const T = BIZ_TYPES[type];
  if (!spendAny(T.cost)) return;
  const b = {id:'b' + Date.now(), type, name:`${state.name}'s ${T.name}`, opened:state.day, level:0, cash:0, stock:0, staff:[], price:'normal', rep:40, log:[], visitDay:state.day, total:0};
  BIZ().push(b);
  addHistory(`Opened a business: ${b.name}`, T.icon); gain('rep', 3); gain('happy', 8);
  familyCheer(`Mum: "My child is now a business owner! God will bless the work of your hands." ${T.icon}`);
  result(`${T.icon} ${b.name} is open!`, `<p>Next steps:</p><ul><li>Hire staff (or supervise it yourself each day).</li>${T.stockless ? '' : '<li>Buy stock, or you will sell nothing.</li>'}<li>Check your results every morning in Messages or <b>Menu → My businesses</b>.</li></ul>`, [opt('Manage it now ▶', '', () => { openPanel('bizOne', BIZ().length - 1); return false; })]);
  return false;
}
function sellBiz(i){
  const b = BIZ()[i], T = bizType(b), val = Math.round(T.cost * 0.6 * (1 + b.level * 0.5) + (b.stock || 0) * 0.8 + Math.max(0, b.cash));
  state.bank += val; BIZ().splice(i, 1);
  addHistory(`Sold ${b.name} for ${fmt(val)}`, '🤝');
  result('Business sold 🤝', `<p>You sold <b>${esc(b.name)}</b> for <b>${fmt(val)}</b> (paid into your bank).</p>`);
  return false;
}

/* ---------- events ---------- */
[
  {id:'bizTaskforce', w:1.3, cool:9, ignore:2,
    cond:() => BIZ().length > 0,
    ctx:() => ({i:rint(0, BIZ().length - 1), amt:amtA(rint(3, 8) * 5000)}),
    title:() => 'LG task force at your shop 🚨',
    body:c => `Officials from the Local Government came to ${BIZ()[c.i] ? BIZ()[c.i].name : 'your business'}: "Your signage and environmental levy are not paid. Pay ${fmt(c.amt)} now or we lock this shop."`,
    options:c => [
      opt('Pay the levy (get receipt) 🧾', fmt(c.amt), () => { if (!spendAny(c.amt)) return false; gain('rep', 1); return 'You paid and collected an official receipt.'; }, null, 'cur'),
      opt('"Settle" them with half 💵', fmt(c.amt / 2), () => { if (!spendAny(c.amt / 2)) return false; if (Math.random() < 0.35){ gain('rep', -3); return 'Another team came the next day asking for the full levy. You paid twice. 🤦🏾'; } return 'They collected the money and left. No receipt.'; }),
      opt('Argue and refuse ✋🏾', 'They may lock the shop', () => { const b = BIZ()[c.i]; if (Math.random() < 0.5){ if (b) b.closedUntil = state.day + 2; return 'They sealed the shop for 2 days. No sales!'; } return 'You showed your CAC papers. They left you alone this time.'; }, null, 'danger')
    ]},
  {id:'bizBigOrder', w:1.1, cool:10, ignore:1,
    cond:() => BIZ().some(b => !bizType(b).stockless),
    ctx:() => { const i = BIZ().findIndex(b => !bizType(b).stockless); const b = BIZ()[i]; const need = Math.round(bizType(b).cost * 0.12 / 1000) * 1000; return {i, need, pay:Math.round(need * 1.7 / 1000) * 1000}; },
    title:() => 'Big order! 📦',
    body:c => `A church is holding a thanksgiving and wants to order from ${BIZ()[c.i].name}. It will use ${fmt(c.need)} of stock and pay ${fmt(c.pay)}.`,
    options:c => [
      opt('Accept the order ✅', `Needs ${fmt(c.need)} stock`, () => { const b = BIZ()[c.i]; if (!b || b.stock < c.need) return 'You did not have enough stock. They went elsewhere. 😩'; b.stock -= c.need; b.cash += c.pay; b.rep = clamp(b.rep + 6, 0, 100); return `Order delivered! ${fmt(c.pay)} added to the business till.`; }, null, 'cur'),
      opt('Decline', '', () => 'You declined the order.')
    ]}
].forEach(e => { EVENTS.push(e); EVENT[e.id] = e; });
const _simBiz = simBiz;
simBiz = function(b){ if (b.closedUntil && state.day <= b.closedUntil){ const l = {d:state.day - 1, rev:0, cogs:0, cost:Math.round(b.staff.reduce((s, x) => s + x.wage, 0)), profit:0, note:'Sealed by the task force.'}; l.profit = -l.cost; b.cash -= l.cost; b.log.push(l); if (b.log.length > 14) b.log.shift(); return l; } return _simBiz(b); };

/* ---------- panels ---------- */
Object.assign(PANELS, {
  biz: () => {
    const opts = BIZ().map((b, i) => { const l = b.log[b.log.length - 1]; return opt(`${bizType(b).icon} ${b.name}`, `Till ${fmt(b.cash)} · Staff ${b.staff.length} · ${l ? `Last day ${l.profit >= 0 ? '+' : '−'}${fmt(Math.abs(l.profit))}` : 'Opened today'}`, () => { openPanel('bizOne', i); return false; }, null, 'cur'); });
    if (BIZ().length < 2) opts.push(opt('Start a new business ➕', state.cac ? 'Choose a business type' : 'Register with CAC at the Local Govt Secretariat first', () => { openPanel('bizNew'); return false; }, state.cac ? null : 'Register your business name (CAC) at the Local Govt Secretariat first.'));
    if (!state.cac) opts.push(opt('Navigate to the Local Govt Secretariat 🧭', 'Register with CAC there', () => { state.nav = 'lg'; closePanel(); return false; }));
    opts.push(opt('Close', '', () => { closePanel(); return false; }));
    return {title:'My businesses 🏪', sub:BIZ().length ? `Total value about ${fmt(bizWorth())}` : 'Be your own boss. You can own up to 2 businesses.', body:BIZ().length ? '' : '<p>Owning a business means daily profit or loss, staff to manage, stock to buy and task force wahala. Some people get rich; others lose everything.</p>', options:opts};
  },
  bizNew: () => ({title:'Start a business 🏪', sub:'Setup cost includes shop rent deposit and equipment.', body:'',
    options:Object.keys(BIZ_TYPES).map(k => { const T = BIZ_TYPES[k]; return opt(`${T.icon} ${T.name}`, `${fmt(T.cost)} · ${T.desc}`, () => startBiz(k), BIZ().some(b => b.type === k) ? 'You already own one of these.' : null); }).concat([opt('Back', '', () => { openPanel('biz'); return false; })])}),
  bizOne: (i) => {
    const b = BIZ()[i]; if (!b) return PANELS.biz();
    const T = bizType(b), last7 = b.log.slice(-7), week = last7.reduce((s, l) => s + l.profit, 0);
    const rows = last7.slice().reverse().map(l => `<b>Day ${l.d}</b><span>${l.profit >= 0 ? '🟢 +' : '🔴 −'}${fmt(Math.abs(l.profit))} <small style="opacity:.7">(sales ${fmt(l.rev)}, costs ${fmt(l.cogs + l.cost)})</small>${l.note ? `<br><small style="opacity:.75">${esc(l.note)}</small>` : ''}</span>`).join('');
    const body = `<div class="kv"><b>Business</b><span>${T.icon} ${esc(T.name)}${b.level ? ` · Level ${b.level + 1}` : ''} · open since Day ${b.opened}</span><b>Till (cash)</b><span>${fmt(b.cash)}</span>${T.stockless ? '' : `<b>Stock</b><span>${fmt(b.stock)}</span>`}<b>Reputation</b><span>${Math.round(b.rep)}/100</span><b>Prices</b><span>${PRICE[b.price].name}</span><b>Staff</b><span>${b.staff.length}/${bizStaffMax(b)}${b.staff.length ? ': ' + b.staff.map(x => `${esc(x.name)} (${'★'.repeat(x.skill)}, ${x.trait}, ${fmt(x.wage)}/day)`).join('; ') : ' (nobody: open it yourself or hire)'}</span><b>Last 7 days</b><span>${week >= 0 ? '+' : '−'}${fmt(Math.abs(week))} · all time ${fmt(b.total || 0)}</span></div>${rows ? `<div class="sec">Daily results</div><div class="kv">${rows}</div>` : ''}`;
    const opts = [
      opt('Collect cash from the till 💰', fmt(Math.max(0, b.cash)), () => { const c = Math.max(0, b.cash); b.cash -= c; state.bank += c; toast(`${fmt(c)} moved to your bank.`, 'good'); }, b.cash <= 0 ? 'Nothing to collect.' : null, 'cur'),
      ...(T.stockless ? [] : [100000, 300000, 1000000].map(a => opt(`Buy stock ${fmt(a)} 📦`, 'Paid from your money', () => { if (!spendAny(a)) return; b.stock += a; toast(`Stock delivered to ${b.name}.`, 'good'); }))),
      opt('Supervise today 👀', '2 hrs · +15% sales tomorrow · less theft', () => { b.visitDay = state.day; advanceTime(120); gain('energy', -8); toast('You checked the books and sat with the staff.', 'good'); }, b.visitDay === state.day ? 'You already supervised today.' : null),
      opt('Hire staff 👥', `${b.staff.length}/${bizStaffMax(b)} · ${T.role}`, () => { openPanel('bizHire', i); return false; }, b.staff.length >= bizStaffMax(b) ? 'Staff is full. Upgrade the business for more.' : null),
      ...b.staff.map((x, k) => opt(`Sack ${x.name}`, `${fmt(x.wage)}/day`, () => { b.staff.splice(k, 1); toast(`${x.name} has been let go.`, 'info'); }, null, 'danger')),
      opt(`Change prices (now: ${PRICE[b.price].name})`, 'Low: more customers. Premium: bigger margin.', () => { b.price = b.price === 'normal' ? 'premium' : b.price === 'premium' ? 'low' : 'normal'; }),
      opt('Advertise on radio and flyers 📣', `${fmt(price(50000))} · +reputation`, () => { if (!spendAny(price(50000))) return; b.rep = clamp(b.rep + 10, 0, 100); b.adDay = state.day; toast('Jingles on the radio, flyers everywhere! 📣', 'good'); }, b.adDay === state.day ? 'Already advertised today.' : null),
      opt('Put money into the till 💵', fmt(100000), () => { if (!spendAny(100000)) return; b.cash += 100000; }),
      opt(`Upgrade the business ⬆️`, `${fmt(Math.round(T.cost * 0.8 * (b.level + 1)))} · +25% demand, +1 staff${T.perRider ? ', +1 bike' : ''}`, () => { const c = Math.round(T.cost * 0.8 * (b.level + 1)); if (!spendAny(c)) return; b.level++; addHistory(`Upgraded ${b.name} to level ${b.level + 1}`, '⬆️'); toast('Business upgraded! ⬆️', 'good'); }, b.level >= 3 ? 'Maximum size reached.' : null),
      opt('Sell this business 🤝', 'Get about 60% of what you put in', () => { if (!confirm(`Sell ${b.name}?`)) return; return sellBiz(i); }, null, 'danger'),
      opt('Back', '', () => { openPanel('biz'); return false; })
    ];
    return {title:`${T.icon} ${b.name}`, sub:T.desc, body, options:opts};
  },
  bizHire: (i) => {
    const b = BIZ()[i], T = bizType(b);
    return {title:`Hire a ${T.role.toLowerCase()} 👥`, sub:'New applicants every day. Skill raises sales; honest staff steal less.', body:'',
      options:candidates(b).map((c, k) => opt(`${c.name} ${'★'.repeat(c.skill)}${'☆'.repeat(5 - c.skill)}`, `${c.trait} · ${fmt(c.wage)} per day`, () => { b.staff.push(Object.assign({}, c)); candidates(b).splice(k, 1); toast(`${c.name} resumes tomorrow. 🤝`, 'good'); openPanel('bizOne', i); return false; }, b.staff.length >= bizStaffMax(b) ? 'Staff is full.' : null)).concat([opt('Back', '', () => { openPanel('bizOne', i); return false; })])};
  }
});
/* CAC registration at the Local Government Secretariat */
const _lgP = PANELS.lg;
PANELS.lg = () => {
  const r = _lgP();
  r.options.unshift(opt('Register a business name (CAC) 📝', `${fmt(25000)} · 2 hrs · Needed to open a business`, () => { if (!spend(25000)) return; state.cac = true; advanceTime(120); addHistory('Registered a business name with CAC', '📝'); toast('CAC certificate collected! Open a business from Menu → My businesses.', 'good'); }, state.cac ? 'Your business name is already registered.' : null, state.cac ? '' : 'cur'));
  return r;
};
if (typeof SPOTS !== 'undefined') SPOTS.lg.push(S_(/CAC/i, 2.1, 8, -Math.PI / 2, {who:'rev', say:['Fill this form, attach your passport photograph and NIN. Next!']}));
const _menuB = PANELS.menu;
PANELS.menu = () => {
  const r = _menuB();
  r.options.splice(2, 0, opt('My businesses 🏪', BIZ().length ? `${BIZ().length} business${BIZ().length > 1 ? 'es' : ''} · ${fmt(bizWorth())}` : 'Start your own business', () => { openPanel('biz'); return false; }));
  return r;
};
/* phone app */
APPS.splice(7, 0, {id:'bizapp', name:'Business', icon:'🏪', bg:'#e67e22'});
VIEWS.bizapp = () => hdr('My Business 🏪') + (BIZ().length ? `<div class="ph-list">${BIZ().map((b, i) => { const l = b.log[b.log.length - 1]; return `<div class="ph-row" ${A(() => { closePhone(); openPanel('bizOne', i); return false; })}><div class="ph-av" style="background:#e67e22">${bizType(b).icon}</div><div class="ph-grow"><b>${esc(b.name)}</b><small>Till ${fmt(b.cash)} · ${l ? `Yesterday ${l.profit >= 0 ? '+' : '−'}${fmt(Math.abs(l.profit))}` : 'Opened today'}</small></div><span>›</span></div>`; }).join('')}</div>` : '<div class="ph-pad dim">You do not own a business yet.</div>') + `<div class="ph-pad"><button class="ph-btn" ${A(() => { closePhone(); openPanel('biz'); return false; })}>Open business manager</button></div>`;
