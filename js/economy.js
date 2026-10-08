'use strict';
/* =========================================================
   ECONOMY AND INFRASTRUCTURE (V6.2)
   Inflation, fuel price swings, prepaid electricity (NEPA),
   solar, and public transport (keke, danfo, ride-hailing).
   ========================================================= */
FURNITURE.push({id:'solar', cat:'Power', name:'Solar panels + lithium battery', price:1800000, fits:0, fx:'Light all day and night, no NEPA bills for most of your use'});
const TARIFF = () => Math.round(225 * (state.cpi || 1));
function powerUse(){
  const it = id => state.home && state.home.items[id];
  let kwh = 1.5 + (it('fridge') ? 2 : 0) + (it('tv') ? 0.8 : 0) + (it('ac') ? 6 : 0) + (it('fan') ? 0.5 : 0) + (it('laptop') ? 0.4 : 0) + ((state.kids || []).length ? 1 : 0);
  if (it('solar')) kwh *= 0.2;
  return Math.round(kwh * 10) / 10;
}
const POWER = () => state.power || (state.power = {units:30, warned:0});

function economyDaily(){
  // inflation: prices creep up every day; the news can make it jump
  const step = 0.0008 + Math.random() * 0.0025;
  state.cpi = Math.round((state.cpi || 1) * (1 + step) * 10000) / 10000;
  if (Math.random() < 0.05){ state.cpi = Math.round(state.cpi * 1.03 * 10000) / 10000; state.news.unshift('Inflation hits a new high. Market women say prices "don go up again". 📈'); }
  if (Math.random() < 0.06 && state.day >= (state.fuelShockUntil || 0)){ state.fuelShockUntil = state.day + rint(2, 4); state.news.unshift('Fuel scarcity: long queues at filling stations across the city ⛽'); toast(`⛽ Fuel scarcity! Petrol is now ${fmt(fuelPrice())} per litre.`, 'bad'); }
  // prepaid electricity
  const P = POWER(), use = powerUse();
  P.units = Math.max(0, Math.round((P.units - use) * 10) / 10);
  if (P.units <= 0){
    if (hasItem('solar')){ /* the sun has you covered */ }
    else if (state.genFuel >= 4){ state.genFuel -= 4; toast('⚡ Your prepaid units finished. The generator ran all night (-4 L fuel).', 'info'); }
    else if (hasItem('inverter')){ gain('happy', -1); toast('⚡ Your prepaid units finished. The inverter kept small light on. Buy units in the Power app.', 'bad'); }
    else { gain('happy', -4); gain('energy', -6); toast('⚡ No light at home! Your prepaid meter is empty. Buy units in the Power app on your phone.', 'bad'); }
  } else if (P.units < use * 2 && P.warned !== state.day){ P.warned = state.day; if (typeof smsAdd === 'function') smsAdd('IKEDC Prepaid', `Your meter balance is low: ${P.units} kWh left (about ${Math.max(1, Math.floor(P.units / use))} day). Recharge to avoid disconnection.`); }
}
/* inflation reaches every price, and slowly into salaries */
const _shiftPay = shiftPay;
shiftPay = () => Math.round(_shiftPay() * (1 + ((state.cpi || 1) - 1) * 0.6) / 100) * 100;
/* outages: use generator fuel if you have it */
const _outage = EVENT.outage;
if (_outage){
  const base = _outage.options;
  _outage.options = c => {
    const o = base(c);
    if (state.home && state.home.items.solar) o.unshift(opt('Your solar keeps the light on ☀️', 'Free', () => { gain('happy', 2); return 'Solar power! You did not even notice NEPA took light.'; }, null, 'cur'));
    else if (state.genFuel >= 4) o.unshift(opt('Run your generator with your jerrycan fuel ⛽', `${state.genFuel} L in stock`, () => { state.genFuel -= 4; gain('energy', 4); return 'Gen don start. You can rest well.'; }, null, 'cur'));
    return o;
  };
}

/* ---------- public transport ---------- */
const RIDES = {
  keke:{name:'Keke Napep 🛺', per:9, min:400, speed:1.0, note:'Cheap and quick on short trips'},
  danfo:{name:'Danfo bus 🚐', per:5, min:300, speed:0.7, note:'Cheapest. Hot, packed and slow'},
  bolt:{name:'Ride-hailing car 🚕', per:28, min:2000, speed:1.5, note:'Air-conditioned, fastest, costly'}
};
function rideFare(b, k){ const d = Math.hypot(b.frontX - player.x, b.frontY - player.y) / T; return Math.round(Math.max(RIDES[k].min, d * RIDES[k].per * 10) * (state.cpi || 1) * fuelMod() / 50) * 50; }
function rideMins(b, k){ const d = Math.hypot(b.frontX - player.x, b.frontY - player.y) / T; return Math.max(8, Math.round(d * 1.2 / RIDES[k].speed)) + (k === 'danfo' ? rint(5, 20) : 0); }
async function takeRide(b, k){
  const fare = rideFare(b, k);
  if (!spendAny(fare)) return;
  closePanel(); paused = true;
  const R = RIDES[k], line = k === 'danfo' ? pick(['Conductor: "Oya enter! Ojuelegba, Ojuelegba!" 🚐', 'Conductor: "Change dey o, just wait." (He never gave you your change) 😤', 'Someone is preaching on the bus. 🙏🏾']) : k === 'keke' ? pick(['Keke man: "Hold the bar well o!" 🛺', 'The keke squeezed between two trucks 😬']) : pick(['Driver: "Is the AC okay, ma/sir?" 🚕', 'Smooth ride, gospel music on the radio 🎶']);
  await fadeTo(true, `${R.name.split(' ').slice(0, -1).join(' ')} to ${b.name}...`);
  toast(line, 'info');
  advanceTime(rideMins(b, k));
  if (k === 'danfo'){ gain('energy', -4); gain('happy', -1); } else if (k === 'bolt') gain('happy', 1);
  player.x = b.frontX; player.y = b.frontY + (b.door === 's' ? 14 : -14); player.face = b.door === 's' ? Math.PI : 0;
  camS.yaw = player.face + Math.PI; camS.snap = true; PATH = []; pathTimer = 0; lastTarget = '#';
  if (state.nav === b.id) state.nav = null;
  await new Promise(r => setTimeout(r, 450));
  await fadeTo(false);
  paused = !!panelState;
  updateHUD(); saveGame(true);
}
PANELS.travel = (b) => {
  const opts = [
    opt('Walk there 🚶🏾', 'Follow the yellow dots. Free.', () => { state.nav = b.id; toast(`Navigating to ${b.name}. Follow the yellow dots!`, 'info'); closePanel(); return false; }, null, 'cur'),
    ...(state.car && !state.car.wrecked ? [opt('Drive there 🚗', 'Go to your car and follow the dots', () => { state.nav = b.id; closePanel(); toast(`Navigating to ${b.name}. Get in your car and drive!`, 'info'); return false; })] : []),
    ...Object.keys(RIDES).map(k => opt(RIDES[k].name, `${fmt(rideFare(b, k))} · about ${rideMins(b, k)} mins · ${RIDES[k].note}`, () => { takeRide(b, k); return false; }, inside ? 'Go outside first.' : driving ? 'Get out of your car first.' : null)),
    opt('Back', '', () => { openPanel('directory'); return false; })
  ];
  return {title:`Go to ${b.name}`, sub:`📍 ${addressOf(b)}`, body:'', options:opts};
};
PANELS.directory = () => ({
  title:'Directory and directions 🗺️', sub:`${AREA.name}, ${AREA.city}. Walk, drive, or take a keke, danfo or ride.`,
  body:state.nav ? `<div class="note">Currently navigating to <b>${B[state.nav].name}</b>.</div>` : '',
  options:[
    ...(state.nav ? [opt('Stop navigation ✖', 'Go back to following your goal', () => { state.nav = null; toast('Navigation stopped. Following your goal.', 'info'); }, null, 'danger')] : []),
    ...BUILDINGS.map(b => opt(b.name, `📍 ${addressOf(b)}`, () => { openPanel('travel', b); return false; }, null, state.nav === b.id ? 'cur' : ''))
  ]
});

/* ---------- phone: Power app + prices in News ---------- */
APPS.splice(8, 0, {id:'power', name:'Power', icon:'⚡', bg:'#f39c12', badge:() => state.power && state.power.units < powerUse() * 2 ? 1 : 0});
VIEWS.power = () => {
  const P = POWER(), use = powerUse(), t = TARIFF(), days = use ? Math.floor(P.units / use) : 99;
  return hdr('IKEDC Prepaid ⚡') + `<div class="ph-pad"><div class="ph-card"><b style="font-size:1.6em">${P.units} kWh</b><br><small>About ${days} day${days === 1 ? '' : 's'} left · you use ${use} kWh a day</small></div>
    <small class="dim">Tariff: ${fmt(t)} per kWh. ${hasItem('solar') ? 'Solar covers most of your use ☀️' : 'Fridge, TV, fan and especially AC use more power. Solar panels are at HomeStyle Furniture.'}</small></div>
    <div class="ph-list">${[5000, 10000, 20000, 50000].map(a => `<div class="ph-row" ${A(() => { const amt = Math.round(a * (state.cpi || 1) / 100) * 100; if (state.bank < amt){ phToast('Not enough money in your bank account.'); return; } state.bank -= amt; const kwh = Math.round(amt / t * 10) / 10; P.units = Math.round((P.units + kwh) * 10) / 10; if (typeof addTx === 'function') addTx('IKEDC prepaid units', -amt); smsAdd('IKEDC Prepaid', `Token: ${String(rint(1e15, 9e15)).replace(/(\d{4})(?=\d)/g, '$1-')}. ${kwh} kWh loaded.`); phToast(`⚡ ${kwh} kWh loaded!`); })}><div class="ph-av" style="background:#f39c12">⚡</div><div class="ph-grow"><b>Buy ${fmt(Math.round(a * (state.cpi || 1) / 100) * 100)} units</b><small>${Math.round(a * (state.cpi || 1) / t * 10) / 10} kWh · from your bank</small></div><span>›</span></div>`).join('')}</div>`;
};
const _newsV = VIEWS.news;
VIEWS.news = (arg, v) => {
  const html = _newsV(arg, v);
  const box = `<div class="ph-pad"><div class="ph-card"><b>📊 Economy today</b><br><small>Inflation since you arrived: +${Math.round(((state.cpi || 1) - 1) * 1000) / 10}% · Petrol ${fmt(fuelPrice())}/L · Power ${fmt(TARIFF())}/kWh · Food price index ${Math.round(state.priceMod * 100)}%</small></div></div>`;
  return html.replace(/(<div class="ph-hdr[^>]*>[\s\S]*?<\/div>)/, '$1' + box);
};
