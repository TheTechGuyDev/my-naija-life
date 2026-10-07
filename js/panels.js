'use strict';
/* =========================================================
   V4 PANELS: setup, phone, people, family, events, life profile
   ========================================================= */
const bar = (v, col) => `<span class="mbar"><i style="width:${clamp(v, 0, 100)}%;background:${col}"></i></span>`;
const relWord = { christian:'Christian', muslim:'Muslim', none:'Not specified' };
function backToNpc(n, line){ openPanel('npc', n); panelState.line = line; renderPanel(); }
function relResult(n, title, line, extra){
  result(title, `<div class="qtext">"${esc(line)}"</div>${extra || ''}`, [
    opt(`Back to ${n.name}`, '', () => { backToNpc(n, line); return false; }),
    opt('Done', '', () => { closePanel(); return false; })
  ]);
}
function sibList(sibs){
  const grp = g => sibs.filter(s => s.g === g).map(s => s.first);
  const join = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0];
  const out = [];
  const b = grp('m'), s = grp('f');
  if (b.length) out.push(`your brother${b.length > 1 ? 's' : ''} ${join(b)}`);
  if (s.length) out.push(`your sister${s.length > 1 ? 's' : ''} ${join(s)}`);
  return out.join(' and ');
}
function fmtClock(h){ return `${String(Math.floor(h / 60) % 24).padStart(2, '0')}:${String(h % 60).padStart(2, '0')}`; }
function personBody(n, live){
  const p = P(n.id), st = stageOf(n.id);
  const known = p.known.map(t => `<span class="tag">${TRAITS[t].icon} ${TRAITS[t].label}</span>`).join('') || '<span style="opacity:.7">Get closer to learn their personality.</span>';
  const likes = p.likesKnown.map(t => `<span class="tag">❤️ ${TOPICS[t]}</span>`).join('') + (p.dislikeKnown ? `<span class="tag">👎🏾 ${TOPICS[p.dislikeKnown]}</span>` : '');
  return `${live ? `<div class="qtext">"${esc(live)}"</div>` : ''}
    <div class="kv" style="margin-top:8px">
      <b>Status</b><span>${STAGE_LABEL[st]}</span>
      <b>Age / work</b><span>${npcAge(n)} · ${n.role}${n.taken ? ' · Married' : ''}</span>
      <b>Friendship</b><span>${Math.round(p.rel)}/100 ${bar(p.rel, '#5ab4ff')}</span>
      ${ROMANTIC.includes(st) ? `<b>Romance</b><span>${Math.round(p.rom)}/100 ${bar(p.rom, '#ff5a8a')}</span>` : ''}
      <b>Phone</b><span>${p.num ? 'Saved 📱' : 'No number yet'}</span>
    </div>
    <div style="margin-top:8px"><b style="opacity:.7">Personality:</b> ${known}</div>
    ${likes ? `<div style="margin-top:4px"><b style="opacity:.7">Topics:</b> ${likes}</div>` : ''}`;
}

Object.assign(PANELS, {
  atm: ATM_PANEL,
  setup: () => ({
    title: 'My Naija Life 🇳🇬',
    sub: 'Create your character and choose where you will live. You start at age 18.',
    body: `<div class="sec">Your name</div><input type="text" id="nameIn" maxlength="18" placeholder="e.g. Temidayo" value="${esc(setupData.name)}">
      <div class="sec">Gender, faith and area (tap to choose)</div>`,
    options: [
      opt('👨🏾 Male', 'Your character', () => { setupData.gender = 'm'; }, null, setupData.gender === 'm' ? 'sel' : ''),
      opt('👩🏾 Female', 'Your character', () => { setupData.gender = 'f'; }, null, setupData.gender === 'f' ? 'sel' : ''),
      opt('✝️ Christian', 'Optional', () => { setupData.religion = 'christian'; }, null, setupData.religion === 'christian' ? 'sel' : ''),
      opt('☪️ Muslim', 'Optional', () => { setupData.religion = 'muslim'; }, null, setupData.religion === 'muslim' ? 'sel' : ''),
      opt('🌐 Prefer not to say', 'Optional', () => { setupData.religion = 'none'; }, null, setupData.religion === 'none' ? 'sel' : ''),
      ...AREAS.map(a => opt(`${a.name}, ${a.city}`, `${a.streets[0]} · Cost of living ${a.cost >= 1.4 ? 'high 💸' : a.cost >= 1.05 ? 'medium' : a.cost >= 0.95 ? 'normal' : 'low'}`, () => { setupData.area = a.id; }, null, setupData.area === a.id ? 'sel' : '')),
      opt('Start my life ▶', `${setupData.name ? esc(setupData.name) + ' · ' : ''}${AREAS.find(a => a.id === setupData.area).name}`, () => {
        const nm = (setupData.name || '').trim();
        if (!nm){ toast('Please type your name first.', 'bad'); return; }
        startNewLife({name:nm, gender:setupData.gender, area:setupData.area, religion:setupData.religion});
        return false;
      }, null, 'go')
    ]
  }),

  intro: () => {
    const F = state.family, sibs = F.members.filter(m => m.key.startsWith('sib'));
    return {
      title: `Welcome to ${AREA.name}, ${state.name}! 🇳🇬`,
      sub: `${AREA.greet}! You are 18, living at ${addressOf(B.home)}, ${AREA.name}, ${AREA.city}. You have ₦2,000,000 and your whole life ahead of you.`,
      body: `<p>Your family, the <b>${F.surname}s</b>, live in ${F.town}: your father ${fam('dad').first}, your mother ${fam('mum').first}${sibs.length ? ', and ' + sibList(sibs) : ''}. They will call you on your 📱 phone.</p>
      <ul>
      <li><b>There is no single correct life.</b> Study, learn a trade, hustle, build relationships, start a family. Your choices have consequences.</li>
      <li><b>Move:</b> WASD / arrow keys, or drag the left side of the screen. <b>Look around:</b> drag the right side (or the mouse). <b>Zoom:</b> pinch, wheel or ＋/－.</li>
      <li><b>People:</b> walk up to anyone and press <b>E</b> to talk. Introduce yourself, gist, swap numbers, hang out. Friendships can become romance.</li>
      <li><b>📱 Phone:</b> calls, chats, family, notifications, your Life Profile and Life History.</li>
      <li><b>🏠 Go inside:</b> homes and offices have real rooms. Walk to the glowing rings (bed, kitchen, counters, booths) and press <b>E</b> to use them.</li>
      <li><b>🍛 Eating:</b> Mama Nkechi's Buka, or buy food at ${AREA.market} and eat from your Bag (${BAG}). <b>😊 Happiness</b> matters too.</li>
      <li><b>🚦 Road safety:</b> cross at zebra crossings. <b>🧭 Directions:</b> follow the yellow dots to the suggested next step.</li>
    </ul>`,
      options: [opt("Let's go! 🚀", 'Start your new life', () => { closePanel(); return false; }, null, 'go')]
    };
  },

  nimc: () => {
    const open = inHours(GOV.nin.open[0], GOV.nin.open[1]);
    const status = state.nin ? 'Issued ✅' : state.ninReadyDay ? `Processing (ready Day ${state.ninReadyDay})` : 'Not enrolled ❌';
    return {
      title: 'NIMC Enrolment Centre 🪪', sub: open ? 'National Identity Management Commission · Open 8am to 4pm' : 'Closed. Opens 8am.',
      body: `<div class="kv"><b>Your NIN</b><span>${status}</span><b>Enrolment fee</b><span>${GOV.nin.fee ? fmt(GOV.nin.fee) : 'Free (first enrolment)'}</span></div>
        <div class="note">Bring yourself for biometrics: photo, fingerprints and signature. Your NIN is sent by SMS after processing. You need it for JAMB, banking and NYSC.</div>`,
      options: [
        opt('Enrol for NIN 🖐🏾', `Biometric capture · ${GOV.nin.mins / 60} hours`, () => {
          advanceTime(GOV.nin.mins); state.ninReadyDay = state.day + GOV.nin.waitDays; gain('rep', 3);
          addHistory('Enrolled for NIN at NIMC', '🖐🏾');
          toast('Enrolment done! Your NIN will arrive by SMS tomorrow.', 'good');
        }, !open ? 'The centre is closed.' : state.nin ? 'You already have an NIN.' : state.ninReadyDay ? 'Your enrolment is already processing.' : null, state.nin || state.ninReadyDay ? '' : 'cur')
      ]
    };
  },

  lg: () => {
    const open = inHours(8, 16), levyDue = state.day - state.levyDay >= 7;
    return {
      title: 'Local Government Secretariat 🏛️', sub: open ? 'Civic centre open 8am to 4pm.' : 'Office is closed. Opens 8am.',
      body: `<div class="kv"><b>Development levy</b><span>${levyDue ? 'Due' : 'Paid this week ✅'}</span></div><p style="margin-top:6px;opacity:.8">NIN enrolment is done at the NIMC Enrolment Centre.</p>`,
      options: [
        opt('Pay development levy 🏛️', `${fmt(10000)} · Weekly · +3 rep`, () => { if (!spend(10000)) return; state.levyDay = state.day; gain('rep', 3); toast('Levy paid. Good citizen!', 'good'); }, !open ? 'The office is closed.' : !levyDue ? 'Already paid this week.' : null),
        opt('Attend town hall meeting 🗣️', '2 hours · -10 energy · +2 rep', () => { state.daily.townhall = true; advanceTime(120); gain('energy', -10); gain('rep', 2); toast('You spoke at the town hall. People are noticing you.', 'good'); }, !inHours(10, 16) ? 'Town hall holds 10am to 4pm.' : state.daily.townhall ? 'Only one meeting per day.' : null),
        opt('Navigate to NIMC 🧭', 'For NIN enrolment', () => { state.nav = 'nimc'; closePanel(); return false; })
      ]
    };
  },

  market: () => {
    const open = inHours(6, 20), closed = open ? null : 'The market is closed.';
    const food = MARKET_ITEMS.map(k => {
      const it = ITEMS[k], c = price(it.price);
      return opt(`Buy ${it.name}`, `${fmt(c)} · ${it.ingredient ? 'Cook it at home' : `+${it.food} food`} · You have ${state.inv[k] || 0}`, () => {
        if (!spend(c)) return; state.inv[k] = (state.inv[k] || 0) + 1; advanceTime(5); toast(`Bought ${it.name}. To eat it, ${BAG}.`, 'good');
      }, closed);
    });
    const gifts = GIFT_ITEMS.map(k => {
      const it = ITEMS[k], c = price(it.price);
      return opt(`Buy ${it.name} 🎁`, `${fmt(c)} · A gift for someone · You have ${state.inv[k] || 0}`, () => {
        if (!spend(c)) return; state.inv[k] = (state.inv[k] || 0) + 1; advanceTime(5); toast(`Bought ${it.name}. Give it to someone by talking to them.`, 'good');
      }, closed, 'hint');
    });
    const phone = state.noPhone ? [opt('Buy a new phone 📱', fmt(price(PHONE_PRICE)), () => { if (!spend(price(PHONE_PRICE))) return; state.noPhone = false; toast('New phone! Your contacts have been restored.', 'good'); }, closed, 'cur')] : [];
    return {title:`${AREA.market} 🛒`, sub: open ? `Open 6am to 8pm. Food goes into your Bag (${BAG}). Gifts can be given to people.` : 'Market has closed. Opens 6am.', body:'', options:[...phone, ...food, ...gifts]};
  },

  inventory: () => {
    const keys = Object.keys(state.inv).filter(k => state.inv[k] > 0 && ITEMS[k]);
    const usable = keys.filter(k => !ITEMS[k].gift && !ITEMS[k].ingredient), gifts = keys.filter(k => ITEMS[k].gift);
    return {
      title: 'Your Bag 🎒', sub: keys.length ? 'Tap food or medicine to use it.' : `Your bag is empty. Buy food at ${AREA.market} or medicine at the hospital.`,
      body: `<div class="kv"><b>🍛 Hunger</b><span>${Math.round(state.hunger)}/100</span><b>⚡ Energy</b><span>${Math.round(state.energy)}/100</span><b>❤️ Health</b><span>${Math.round(state.health)}/100</span><b>😊 Happiness</b><span>${Math.round(state.happy)}/100</span></div>
        ${state.inv.foodstuff ? `<div class="note">🥘 Foodstuff ×${state.inv.foodstuff}: cook it in your kitchen at home.</div>` : ''}
        ${gifts.length ? `<div class="note">🎁 Gifts: ${gifts.map(k => `${ITEMS[k].name} ×${state.inv[k]}`).join(', ')}. Talk to someone to give a gift.</div>` : ''}`,
      options: usable.map(k => {
        const it = ITEMS[k];
        const fx = [it.food ? `+${it.food} food` : '', it.energy ? `+${it.energy} energy` : '', it.health ? `+${it.health} health` : ''].filter(Boolean).join(' · ');
        return opt(`${it.food ? 'Eat' : 'Use'} ${it.name} ×${state.inv[k]}`, fx, () => {
          state.inv[k]--; gain('hunger', it.food || 0); gain('energy', it.energy || 0); gain('health', it.health || 0); if (it.food) gain('happy', 1);
          toast(`${it.food ? 'Ate' : 'Used'} ${it.name}.`, 'good');
        });
      })
    };
  },

  /* ---------- Talking to people in the street ---------- */
  npc: (n) => {
    if (n.police){
      if (!panelState.line) panelState.line = pick(POLICE_LINES);
      return {title:n.name, sub:'Police officer', body:`<div class="qtext">"${esc(panelState.line)}"</div>`, options:[
        opt('Greet 👋', '+1 rep', () => { mark(n.id || n.name, 'greet'); gain('rep', 1); panelState.line = pick(['Good. Move along.', 'Stay safe, citizen.']); }, did(n.id || n.name, 'greet') ? 'Already greeted today.' : null),
        opt('Ask for directions 🧭', 'Where should I go next?', () => { const g = goal(); panelState.line = g.to ? `Go to ${B[g.to].name}, ${addressOf(B[g.to])}.` : 'Just mind your business and stay safe.'; }),
        opt('Bye 👋', '', () => { closePanel(); return false; })
      ]};
    }
    const p = P(n.id), st = stageOf(n.id), rom = isRomantic(n.id);
    if (!panelState.line) panelState.line = greetLine(n);
    const opts = [];
    if (st === 'stranger'){
      opts.push(opt('Introduce yourself 👋', 'Start a new friendship', () => { panelState.line = actIntro(n); }, null, 'cur'));
    } else {
      opts.push(opt('Greet 👋', 'Small friendship boost, once a day', () => { panelState.line = actGreet(n); }, did(n.id, 'greet') ? 'Already greeted today.' : null));
      opts.push(opt('Gist about... 💬', '30 mins · Find topics they like', () => { openPanel('gist', n); return false; }, did(n.id, 'gist') ? 'You already gisted today. Come back tomorrow.' : null, 'cur'));
      if (!p.num) opts.push(opt('Exchange numbers 📱', 'Chat and call anytime', () => { panelState.line = actNumber(n); }, state.noPhone ? 'You don\'t have a phone.' : did(n.id, 'num') ? 'Try again tomorrow.' : p.rel < 20 ? `Get to know them first (friendship ${Math.round(p.rel)}/20).` : null));
      opts.push(opt(rom ? 'Go on a date 🌹' : 'Hang out 🍻', 'Choose where to go', () => { openPanel('outing', n); return false; }, did(n.id, 'out') ? 'You already went out today.' : (!rom && p.rel < 25) ? `Become closer first (friendship ${Math.round(p.rel)}/25).` : null));
      const gifts = GIFT_ITEMS.filter(k => state.inv[k] > 0);
      opts.push(opt('Give a gift 🎁', gifts.length ? `${gifts.length} type(s) in your bag` : 'Buy gifts at the market', () => { openPanel('giftPick', n); return false; }, !gifts.length ? `Buy a gift at ${AREA.market} first.` : did(n.id, 'gift') ? 'One gift per day.' : null));
      if (!rom && st !== 'ex' && n.g !== state.gender) opts.push(opt('Show romantic interest 😍', 'Could become something more', () => { const r = actInterest(n); relResult(n, r.ok ? 'They like you too! 💬' : 'Not this time 😅', r.line, r.ok ? '<p>You are now in the <b>talking stage</b>. Chat, flirt and go on dates.</p>' : ''); return false; }, interestBlock(n)));
      if (p.stage === 'talking') opts.push(opt(`Ask ${n.g === 'f' ? 'her' : 'him'} to be your ${n.g === 'f' ? 'girlfriend' : 'boyfriend'} ❤️`, 'Make it official', () => { const r = actAskOut(n); relResult(n, r.ok ? 'You are now dating! ❤️' : 'Not yet...', r.line); return false; },
        state.partner && state.partner !== n.id ? `You're already dating ${NPC[state.partner].name}.` : p.cool > state.day ? 'Give it a couple of days.' : p.rom < 40 ? `Build more romance first (${Math.round(p.rom)}/40).` : null, 'cur'));
      if (p.stage === 'dating') opts.push(opt('Make it serious 💑', 'A committed relationship', () => { relResult(n, 'Serious relationship 💑', actSerious(n)); return false; }, p.rom < 70 ? `Romance needs to be 70+ (${Math.round(p.rom)}).` : state.day - p.since < 4 ? `Date for at least 4 days first (${state.day - p.since}/4).` : null, 'cur'));
      if (typeof marriageOpts === 'function') opts.push(...marriageOpts(n));
      if (rom) opts.push(opt(p.stage === 'talking' ? 'Stop talking 🚪' : p.stage === 'married' ? 'Divorce ⚖️' : 'Break up 💔', p.stage === 'married' ? 'End the marriage' : 'End the relationship', () => { openPanel('confirmBreak', n); return false; }, null, 'danger'));
      opts.push(opt('Ask for advice 💡', 'Get a life tip', () => { panelState.line = pick(TIPS); }));
      opts.push(opt('Ask for directions 🧭', 'Where should I go next?', () => { const g = goal(); panelState.line = g.to ? `Your next stop? ${B[g.to].name}, at ${addressOf(B[g.to])}.` : 'Just enjoy your day!'; }));
    }
    opts.push(opt('Bye 👋', 'Continue your day', () => { closePanel(); return false; }));
    return {title:npcDisplay(n) === n.name ? n.name : n.role, sub:st === 'stranger' ? `${n.role} · Stranger` : `${n.role} · ${STAGE_LABEL[st]}`, body:st === 'stranger' ? `<div class="qtext">${esc(panelState.line)}</div>` : personBody(n, panelState.line), options:opts};
  },

  gist: (n) => ({
    title:`Gist with ${n.name} 💬`, sub:'Pick a topic. People enjoy topics that match their interests.',
    body:'',
    options:[...Object.keys(TOPICS).map(t => opt(TOPICS[t], P(n.id).likesKnown.includes(t) ? '❤️ They like this' : P(n.id).dislikeKnown === t ? '👎🏾 They dislike this' : '', () => { backToNpc(n, actGist(n, t)); return false; })),
      opt('Back', '', () => { backToNpc(n); return false; })]
  }),

  outing: (n) => {
    const rom = isRomantic(n.id);
    return {
      title: rom ? `Date with ${n.name} 🌹` : `Hang out with ${n.name} 🍻`, sub:'Different people enjoy different places. You pay.',
      body: P(n.id).known.length ? `<p>What you know: ${P(n.id).known.map(t => TRAITS[t].icon + ' ' + TRAITS[t].label).join(', ')}.</p>` : '',
      options:[...OUTINGS.map(o => opt(o.name, `${outingCost(o) ? fmt(outingCost(o)) : 'Free'} · ${Math.round(o.mins / 60 * 10) / 10} hrs`, () => {
        const r = actOuting(n, o); if (!r) return;
        if (!r.ok){ relResult(n, `${n.name} can't make it`, r.line); return false; }
        const fx = rom ? `Romance ${r.score >= 0 ? '+' : ''}${r.score}` : `Friendship ${r.score >= 0 ? '+' : ''}${r.score}`;
        relResult(n, r.score >= 12 ? 'Amazing time! 🥰' : r.score >= 4 ? 'Good time 😊' : 'Meh... 😐', r.line, `<p style="margin-top:6px">${fx}</p>`); return false;
      }, outingBlock(n, o))), opt('Back', '', () => { backToNpc(n); return false; })]
    };
  },

  giftPick: (n) => ({
    title:`Give ${n.name} a gift 🎁`, sub:'Some people love expensive gifts. Others think it is a waste.',
    body:'',
    options:[...GIFT_ITEMS.filter(k => state.inv[k] > 0).map(k => opt(`${ITEMS[k].name} ×${state.inv[k]}`, '', () => { relResult(n, 'Gift given 🎁', actGift(n, k)); return false; })), opt('Back', '', () => { backToNpc(n); return false; })]
  }),

  confirmBreak: (n) => ({
    title:`End things with ${n.name}?`, sub:'This will hurt both of you.', body:'',
    options:[
      opt('Yes, end it', '', () => { breakUp(n.id, false); relResult(n, 'It is over 💔', pick(["Wow. Okay. Bye.", "I can't believe this...", "Fine. Goodbye."])); return false; }, null, 'danger'),
      opt('No, go back', '', () => { backToNpc(n); return false; })
    ]
  }),

  /* ---------- Phone ---------- */
  phone: () => {
    if (state.noPhone) return {title:'📵 No phone', sub:'Your phone was stolen.', body:`<p>Buy a new phone at ${AREA.market} to use NaijaChat, get calls from family and receive notifications.</p>`, options:[
      opt('Navigate to the market 🧭', '', () => { state.nav = 'market'; closePanel(); return false; }),
      opt('Life Profile 🪪', 'Still available', () => { openPanel('profile'); return false; })
    ]};
    const unread = Object.values(state.unread).reduce((a, b) => a + b, 0);
    return {title:'📱 Your Phone', sub:`${WEEKDAYS[(state.day - 1) % 7]} · Day ${state.day} · ${fmtClock(Math.floor(state.minutes))}`, body:'', options:[
      opt(`Notifications 🔔${state.pending.length ? ` (${state.pending.length})` : ''}`, 'Calls, SMS and requests waiting for you', () => { openPanel('notifs'); return false; }, null, state.pending.length ? 'cur' : ''),
      opt(`NaijaChat 💬${unread ? ` (${unread})` : ''}`, 'Chat with friends and your partner', () => { openPanel('chats'); return false; }, null, unread ? 'cur' : ''),
      opt('Family 👪', `The ${state.family.surname} family`, () => { openPanel('family'); return false; }),
      opt('People 👥', 'Everyone you know', () => { openPanel('people'); return false; }),
      opt('Life Profile 🪪', 'Your life at a glance', () => { openPanel('profile'); return false; }),
      opt('Life History 📜', 'Your story so far', () => { openPanel('history'); return false; }),
      opt('Maps 🗺️', 'Navigate anywhere', () => { openPanel('directory'); return false; })
    ]};
  },

  notifs: () => ({
    title:'Notifications 🔔', sub:state.pending.length ? 'Respond before they expire (2 days).' : 'Nothing waiting for you.', body:'',
    options:[...state.pending.slice().reverse().map(inst => opt(evTitle(inst), `Day ${inst.day}`, () => { openPanel('event', inst); return false; }, null, 'cur')),
      opt('Back', '', () => { openPanel('phone'); return false; })]
  }),

  event: (inst) => {
    const e = EVENT[inst.id];
    return {title:evTitle(inst), sub:'', body:`<div class="qtext">${esc(e.body(inst.ctx))}</div>`, options:e.options(inst.ctx).map((o, i) => opt(o.label, o.note, () => {
      const msg = resolveEvent(inst, i);
      if (msg === false) return;
      panelState = null; result(evTitle(inst), `<p>${esc(msg)}</p>`); return false;
    }, o.why, o.cls))};
  },

  chats: () => {
    const ids = Object.keys(state.people).filter(id => state.people[id].num && NPC[id]);
    ids.sort((a, b) => { const la = (state.chats[a] || []).slice(-1)[0], lb = (state.chats[b] || []).slice(-1)[0]; return ((lb ? lb.d * 1440 + lb.h : 0) - (la ? la.d * 1440 + la.h : 0)); });
    return {title:'NaijaChat 💬', sub:ids.length ? 'Your chats' : 'No contacts yet. Exchange numbers with people you meet.', body:'',
      options:[...ids.map(id => { const last = (state.chats[id] || []).slice(-1)[0], u = state.unread[id] || 0; return opt(`${NPC[id].name}${u ? ` (${u})` : ''}`, `${STAGE_LABEL[stageOf(id)]}${last ? ' · ' + esc(last.t).slice(0, 34) : ''}`, () => { openPanel('chat', NPC[id]); return false; }, null, u ? 'cur' : ''); }),
        opt('Back', '', () => { openPanel('phone'); return false; })]};
  },

  chat: (n) => {
    const p = P(n.id), rom = isRomantic(n.id);
    state.unread[n.id] = 0;
    const msgs = (state.chats[n.id] || []).slice(-14).map(m => `<div class="bub ${m.m ? 'me' : 'them'}">${esc(m.t)}<small>Day ${m.d} · ${fmtClock(m.h)}</small></div>`).join('') || '<p style="opacity:.7">No messages yet. Say hi!</p>';
    return {title:`${n.name} 💬`, sub:`${STAGE_LABEL[stageOf(n.id)]} · Friendship ${Math.round(p.rel)}${rom ? ` · Romance ${Math.round(p.rom)}` : ''}`, body:`<div class="bubbles" id="bubbles">${msgs}</div>`, options:[
      opt('Check up on them 👋🏾', 'Once a day', () => { chatCheck(n); }, did(n.id, 'chat') ? 'Already chatted today.' : null),
      ...(rom ? [opt('Flirt 😉', 'Once a day', () => { chatFlirt(n); }, did(n.id, 'flirt') ? 'Already flirted today.' : null)] : []),
      opt('Call 📞', '20 mins · once a day', () => { const l = chatCall(n); result(`Call with ${n.name} 📞`, `<div class="qtext">"${esc(l)}"</div>`, [opt('Back to chat', '', () => { openPanel('chat', n); return false; })]); return false; }, did(n.id, 'call') ? 'Already called today.' : null),
      opt(rom ? 'Invite on a date 🌹' : 'Invite to hang out 🍻', 'Meet up somewhere', () => { openPanel('outing', n); return false; }, did(n.id, 'out') ? 'You already went out today.' : (!rom && p.rel < 25) ? `Become closer first (${Math.round(p.rel)}/25).` : null),
      opt(`Send ${fmt(5000)} 💸`, 'Transfer', () => { chatSend(n, 5000); }, did(n.id, 'send') ? 'One transfer per day.' : null),
      opt(`Send ${fmt(20000)} 💸`, 'Transfer', () => { chatSend(n, 20000); }, did(n.id, 'send') ? 'One transfer per day.' : null),
      opt('Back', '', () => { openPanel('chats'); return false; })
    ]};
  },

  people: () => {
    const ids = Object.keys(state.people).filter(id => NPC[id] && state.people[id].met);
    ids.sort((a, b) => (state.people[b].rel + state.people[b].rom) - (state.people[a].rel + state.people[a].rom));
    return {title:'People you know 👥', sub:ids.length ? `${ids.length} people · ${friendIds(30).length} friends` : 'You have not met anyone yet. Walk up to people and press E to talk.', body:'',
      options:[...ids.map(id => opt(`${NPC[id].name} · ${STAGE_LABEL[stageOf(id)]}`, `${NPC[id].role} · Friendship ${Math.round(state.people[id].rel)}${isRomantic(id) ? ` · Romance ${Math.round(state.people[id].rom)}` : ''}`, () => { openPanel('person', NPC[id]); return false; }, null, isRomantic(id) ? 'cur' : '')),
        opt('Back', '', () => { openPanel('phone'); return false; })]};
  },

  person: (n) => ({
    title:n.name, sub:`${n.role} · ${STAGE_LABEL[stageOf(n.id)]}`, body:personBody(n),
    options:[
      ...(P(n.id).num && !state.noPhone ? [opt('Open chat 💬', '', () => { openPanel('chat', n); return false; })] : []),
      opt('Back', '', () => { openPanel('people'); return false; })
    ]
  }),

  family: () => {
    const F = state.family;
    const opts = [];
    F.members.forEach(m => {
      opts.push(opt(`Call ${m.key === 'dad' ? 'Dad' : m.key === 'mum' ? 'Mum' : m.first} 📞`, `${m.role} · ${famStatus(m)} · Bond ${Math.round(m.rel)}`, () => { const l = famCall(m); result(`Call with ${m.first} 📞`, `<div class="qtext">${esc(l)}</div>`, [opt('Back to family', '', () => { openPanel('family'); return false; })]); return false; }, m.called === state.day ? 'Already called today.' : null));
      opts.push(opt(`Send ${m.first} ${fmt(m.key.startsWith('sib') ? 10000 : 50000)} 💸`, 'Family support', () => { if (famSend(m, m.key.startsWith('sib') ? 10000 : 50000)) toast(`Sent! ${m.first} is grateful 🙏🏾`, 'good'); }, m.sent === state.day ? 'Already sent today.' : null));
    });
    opts.push(opt(`Visit home in ${F.town} 🏡`, `${fmt(famVisitCost())} return trip · 1 day · Big family boost`, () => { if (famVisit()) result(`Home in ${F.town} 🏡`, '<p>Mama cooked your favourite soup, Papa gave you advice, and your siblings would not leave you alone. You feel refreshed.</p>'); else return; return false; }, state.day - (F.lastVisit || 0) < 5 && F.lastVisit ? 'You visited recently.' : null, 'cur'));
    opts.push(opt('Back', '', () => { openPanel('phone'); return false; }));
    return {title:`The ${F.surname} Family 👪`, sub:`Hometown: ${F.town}`, body:`<div class="kv">${F.members.map(m => `<b>${m.role}</b><span>${m.first} ${F.surname} · ${famAge(m)} yrs · ${bar(m.rel, '#7dffa8')}</span>`).join('')}</div>`, options:opts};
  },

  profile: () => {
    const j = state.job ? JOB[state.job] : null, U = state.uni, d = state.degree, F = state.family;
    const pn = state.partner ? NPC[state.partner] : null;
    const talking = Object.keys(state.people).filter(id => state.people[id].stage === 'talking').map(id => NPC[id].name);
    const relTxt = pn ? `${{serious:'Serious relationship with', engaged:'Engaged to', married:'Married to'}[P(pn.id).stage] || 'Dating'} ${pn.name}` : talking.length ? `Talking to ${talking.join(', ')}` : 'Single';
    const worth = state.money + state.bank + (state.hasOkada ? 600000 : 0);
    const sibs = F.members.filter(m => m.key.startsWith('sib')).length;
    return {
      title: `${state.name.toUpperCase()} 🪪`, sub: `Life Profile · Day ${state.day}`,
      body: `<div class="kv">
        <b>Age</b><span>${ageNow()}</span>
        <b>Location</b><span>${AREA.name}, ${AREA.city}</span>
        <b>Address</b><span>${addressOf(B.home)}</span>
        <b>Occupation</b><span>${j ? j.name : U ? `Student (${DEPTS[U.dept].name}, ${U.level}L)` : state.nysc === 2 ? 'Corps member' : 'Unemployed'}</span>
        <b>Income</b><span>${j ? `${fmt(j.pay)} per shift (about ${fmt(j.pay * 22)}/month)` : 'None'}</span>
        <b>Net worth</b><span>${fmt(worth)}</span>
        <b>Education</b><span>${d ? `B.Sc. ${DEPTS[d.dept].name} (${d.cls})` : U ? `${U.level}L${U.carry ? ' (carryover)' : ''}` : state.jamb ? `JAMB ${state.jamb}` : 'SSCE'}${state.nysc >= 3 ? ' · NYSC ✅' : ''}</span>
        <b>NIN</b><span>${state.nin ? 'Issued ✅' : 'Not yet'}</span>
        <b>Relationship</b><span>${relTxt}</span>
        <b>Children</b><span>${(state.kids || []).length ? state.kids.map(k => `${esc(k.name)} (${Math.floor((state.day - k.born) / YEAR_DAYS)})`).join(', ') : 'None'}${state.preg ? ` · Baby due Day ${state.preg.due}` : ''}</span>
        <b>Friends</b><span>${friendIds(30).length}</span>
        <b>Family</b><span>Parents + ${sibs} sibling${sibs !== 1 ? 's' : ''} in ${F.town} · Bond ${Math.round(famAvg())}</span>
        <b>Faith</b><span>${relWord[state.religion]}</span>
        <b>Reputation</b><span>${Math.round(state.rep)}/100 ${bar(state.rep, '#5ab4ff')}</span>
        <b>Health</b><span>${Math.round(state.health)}/100 ${bar(state.health, '#ff5a5a')}</span>
        <b>Happiness</b><span>${Math.round(state.happy)}/100 ${bar(state.happy, '#c38bff')}</span>
        <b>House</b><span>${HOUSING[state.housing].name} · Comfort ${homeComfort()}/10</span>
        <b>Vehicles</b><span>${state.hasOkada ? 'Okada (Bajaj Boxer)' : 'None'}</span>
        <b>Police record</b><span>${state.arrests ? `${state.arrests} arrest(s)` : 'Clean ✅'}</span>
        <b>Road accidents</b><span>${state.accidents}</span>
      </div>`,
      options: [
        opt('Life History 📜', `${state.history.length} moments`, () => { openPanel('history'); return false; }),
        opt('Family 👪', '', () => { openPanel('family'); return false; }),
        opt('People 👥', '', () => { openPanel('people'); return false; }),
        opt('Close', '', () => { closePanel(); return false; })
      ]
    };
  },

  history: () => ({
    title:'Life History 📜', sub:`${state.name}'s story · ${state.history.length} moments`,
    body:`<ul class="hist">${state.history.slice().reverse().map(h => `<li><b>Day ${h.d}</b>${h.i} ${esc(h.t)}</li>`).join('')}</ul>`,
    options:[opt('Back to profile', '', () => { openPanel('profile'); return false; })]
  }),

  menu: () => ({
    title: 'Menu', sub: `${state.name} · Age ${ageNow()} · Day ${state.day} · ${AREA.name}, ${AREA.city}`,
    body: '',
    options: [
      opt('Phone 📱', 'Calls, chats, NaijaGram, bank, camera', () => { closePanel(); openPhone(); return false; }),
      opt('Life Profile 🪪', 'Your life at a glance', () => { openPanel('profile'); return false; }),
      opt('Life Guide 🧭', 'Tips, eating and road safety', () => { openPanel('guide'); return false; }),
      opt('Directory 🗺️', 'Navigate to any place', () => { openPanel('directory'); return false; }),
      opt('Bag 🎒', 'Eat food and use medicine', () => { openPanel('inventory'); return false; }),
      opt(state.riding ? 'Get off okada 🚶' : 'Ride okada 🏍️', state.hasOkada ? 'Switch movement mode' : 'Buy one at Oga Motors', () => { state.riding = !state.riding; toast(state.riding ? 'You are riding your okada.' : 'You are walking.', 'info'); }, state.hasOkada ? null : 'You do not own an okada yet.'),
      opt(`Suggestions: ${state.guide ? 'ON' : 'OFF'} 🎯`, 'Show the suggested next step and directions', () => { state.guide = !state.guide; }),
      opt(`Game speed: ${state.speed > 1 ? 'FAST' : 'NORMAL'} ⏩`, 'Fast makes the clock run twice as quickly', () => { state.speed = state.speed > 1 ? 1 : 2; }),
      opt(`Auto camera: ${state.autoCam ? 'ON' : 'OFF'} 🎥`, 'Camera swings behind you as you walk', () => { state.autoCam = !state.autoCam; }),
      opt(`Graphics: ${GFX === 'high' ? 'HIGH' : 'LOW'} ⚙️`, 'Switch if your phone is slow (reloads)', () => { try { localStorage.setItem(GFX_KEY, GFX === 'high' ? 'low' : 'high'); } catch (e) {} saveGame(true); location.reload(); return false; }),
      opt('Save game 💾', 'Also saves automatically', () => { saveGame(); }),
      opt('Full screen ⛶', 'Better on mobile', () => { goFullscreen(); }),
      opt('How to play ❓', 'Controls and tips', () => { openPanel('intro'); return false; }),
      opt('Start new life 🔄', 'Erases your current save', () => { openPanel('confirmReset'); return false; }, null, 'danger')
    ]
  }),

  confirmReset: () => ({
    title: 'Start a new life?', sub: 'This deletes your current progress. You will choose a new name and area.',
    body: '',
    options: [
      opt('Yes, start over', 'Choose a new area', () => { try { localStorage.removeItem(SAVE_KEY); OLD_SAVE_KEYS.forEach(k => localStorage.removeItem(k)); } catch (e) {} location.reload(); return false; }, null, 'danger'),
      opt('No, go back', '', () => { openPanel('menu'); return false; })
    ]
  })
});

/* =========================================================
   V5 PANELS: home stations, furniture store, NIMC form
   ========================================================= */
Object.assign(PANELS, {
  bed: () => {
    const h = HOUSING[state.housing], hr = hour(), night = hr >= 18 || hr < 5, sl = sleepGain();
    return {title:'Your bed 🛏️', sub:`${h.name} · Rent ${fmt(rentOf(state.housing))}/week · Next rent: Day ${state.rentDueDay}`,
      body:`<div class="kv"><b>Sleep quality</b><span>+${sl} energy${hasItem('ac') ? ' (AC ❄️)' : hasItem('fan') ? ' (fan 🌀)' : ''}</span><b>Home comfort</b><span>${homeComfort()}/10 ${bar(homeComfort() * 10, '#c38bff')}</span></div>
        <div class="note">Buy furniture and decor at HomeStyle Furniture to sleep better and feel happier at home.</div>`,
      options:[
        opt('Sleep till morning 🌙', `Wake at 6:00 · +${sl} energy`, () => { closePanel(); sleepScene(true); return false; }, night ? null : 'You can only sleep for the night after 6pm.', 'cur'),
        opt('Take a nap 😴', '2 hours · +25 energy', () => { closePanel(); sleepScene(false); return false; }, (state.daily.naps || 0) >= 2 ? 'You have napped enough today.' : null),
        opt('Navigate to HomeStyle Furniture 🧭', 'Upgrade your home', () => { state.nav = 'furniture'; closePanel(); return false; })
      ]};
  },
  desk: () => {
    const U = state.uni;
    const online = HUSTLES.filter(hh => ['design', 'code', 'tutor'].includes(hh.id));
    return {title:hasItem('laptop') ? 'Your desk 💻' : 'Study table 📖', sub:hasItem('desk') ? 'A proper desk helps you focus.' : 'Buy a desk and laptop at HomeStyle Furniture.',
      body:U ? `<div class="kv"><b>Course</b><span>${DEPTS[U.dept].name}, ${U.level}L</span><b>Extra exam hints</b><span>${U.study || 0}/2 from studying</span></div>` : '',
      options:[
        opt('Study 📚', `${hasItem('desk') ? '1 hour' : '1.5 hours'} · ${U ? '+1 exam hint' : '+reputation'}`, () => {
          closePanel();
          runScene([{say:['player', U ? `Let me read my ${DEPTS[U.dept].name} notes...` : 'Let me read something useful...'], ms:1300}, {fade:'📚 Studying...', fx:() => {
            state.daily.studied = true; advanceTime(hasItem('desk') ? 60 : 90); gain('energy', -8);
            if (U) U.study = Math.min(2, (U.study || 0) + 1); else gain('rep', 1);
            if (hasItem('shelf')) gain('happy', 2);
          }}]); return false;
        }, state.daily.studied ? 'You already studied today.' : state.energy < 12 ? 'Too tired to study.' : null, 'cur'),
        ...online.map(hh => opt(`Work online: ${hh.name}`, `${fmt(hh.min)} to ${fmt(hh.max)} · ${hh.hours} hrs`, () => {
          closePanel();
          runScene([{say:['player', 'Time to make some money online 💻'], ms:1200}, {fade:'💻 Working...', fx:() => {
            state.daily.hustle = true; gain('energy', -hh.energy); gain('hunger', -10); advanceTime(hh.hours * 60);
            const amt = Math.round(rint(hh.min, hh.max) / 100) * 100; state.money += amt; state.hustleEarned += amt; toast(`${hh.name}: you made ${fmt(amt)} from home.`, 'good');
          }}]); return false;
        }, !hasItem('laptop') ? 'You need a laptop.' : hustleBlock(hh)))
      ]};
  },
  lounge: () => ({
    title:hasItem('tv') ? 'Living room 📺' : 'Sofa 🛋️', sub:'Relax and unwind at home.', body:'',
    options:[
      opt('Watch a Nollywood movie 🎬', '1.5 hours · +7 happiness', () => { closePanel(); loungeScene('movie'); return false; }, hasItem('tv') ? null : 'You need a TV.'),
      opt('Watch football ⚽', '2 hours · +6 happiness', () => { closePanel(); loungeScene('ball'); return false; }, hasItem('tv') ? null : 'You need a TV.'),
      opt('Watch the news 📰', '30 mins · Free headlines', () => { closePanel(); loungeScene('news'); return false; }, hasItem('tv') ? null : 'You need a TV.'),
      opt('Relax on the sofa 😌', '1 hour · +8 energy', () => { closePanel(); loungeScene('relax'); return false; }, hasItem('sofa') ? (state.daily.relaxed ? 'You already relaxed today.' : null) : 'You need a sofa.')
    ]
  }),
  kitchen: () => ({
    title:'Kitchen 🍳', sub:`${hasItem('cooker') ? 'Gas cooker' : 'Kerosene stove'}${hasItem('fridge') ? ' · Fridge' : ''} · Foodstuff: ${state.inv.foodstuff || 0}`,
    body:(state.inv.foodstuff || 0) ? '' : `<div class="note">No foodstuff. Buy "Foodstuff (1 home meal)" at ${AREA.market}. Cooking at home is cheaper than buying food.</div>`,
    options:[
      opt('Cook a meal 🍲', `${hasItem('cooker') ? '30' : '60'} mins · +${45 + (hasItem('fridge') ? 10 : 0)} food · uses 1 foodstuff`, () => { closePanel(); cookScene(); return false; }, (state.inv.foodstuff || 0) < 1 ? 'You have no foodstuff.' : null, 'cur'),
      opt('Get a cold drink 🥤', '+6 energy · once a day', () => { state.daily.drink = true; gain('energy', 6); gain('happy', 1); toast('Ahh, cold malt! 🥤', 'good'); }, !hasItem('fridge') ? 'You need a fridge.' : state.daily.drink ? 'Already had one today.' : null),
      opt('Eat from your bag 🎒', 'Open inventory', () => { openPanel('inventory'); return false; })
    ]
  }),
  bath: () => ({
    title:'Bathroom 🚿', sub:'Freshen up.', body:'',
    options:[opt('Take a bath 🛁', '20 mins · +6 energy · +2 happiness', () => { closePanel(); runScene([{fade:'🚿 Splash splash...', fx:() => { state.daily.bathed = true; advanceTime(20); gain('energy', 6); gain('happy', 2); }}]); return false; }, state.daily.bathed ? 'You already had your bath today.' : null, 'cur')]
  }),
  wardrobe: () => ({
    title:'Wardrobe 👔', sub:'Look good, feel good.', body:'',
    options:[opt('Iron and wear your best outfit 👔', '15 mins · +1 rep · interview bonus today', () => { closePanel(); runScene([{say:['player', 'Let me check myself in the mirror... 😎'], ms:1300}, {fade:'👔 Getting dressed...', fx:() => { state.daily.dressed = true; advanceTime(15); gain('rep', 1); gain('happy', 1); }}]); return false; }, state.daily.dressed ? 'You are already dressed sharp today.' : null, 'cur')]
  }),
  furniture: () => {
    const tierName = HOUSING[state.housing].name;
    const opts = FURNITURE.map(f => {
      const owned = hasItem(f.id), fits = state.housing >= f.fits;
      return opt(`${owned ? '✅ ' : ''}${f.name}`, `${f.cat} · ${fmt(f.price)} · ${f.fx}${fits ? '' : ` · Won't fit your ${tierName} yet`}`, () => {
        if (!spendAny(f.price)) return;
        state.home.items[f.id] = true;
        if (f.price >= 150000) addHistory(`Bought ${f.name.toLowerCase()} for the house`, '🛋️');
        gain('happy', 3); sfx('ding');
        toast(fits ? `${f.name} delivered to your home 🚚` : `${f.name} bought. It goes in storage until you move to a bigger place.`, 'good');
      }, owned ? 'You already own this.' : null, owned ? 'cur' : '');
    });
    const paints = PAINTS.map(pt => opt(`${state.home.paint === pt.id ? '✅ ' : ''}Paint: ${pt.name} 🎨`, `${fmt(PAINT_PRICE)} · Repaint your walls`, () => {
      if (!spendAny(PAINT_PRICE)) return; state.home.paint = pt.id; gain('happy', 2); toast(`Your walls are now ${pt.name.toLowerCase()}. 🎨`, 'good');
    }, state.home.paint === pt.id ? 'Your walls are already this colour.' : null));
    return {title:'HomeStyle Furniture 🛋️', sub:`Delivered the same day. Your home: ${tierName} · Comfort ${homeComfort()}/10`, body:'', options:[...opts, ...paints]};
  },
  nimcForm: () => {
    if (!state.dob) state.dob = `${String(rint(1, 28)).padStart(2, '0')}/${String(rint(1, 12)).padStart(2, '0')}/${2026 - ageNow()}`;
    if (!state.phoneNo) state.phoneNo = '080' + rint(10000000, 99999999);
    const F = state.family;
    return {title:'NIN Enrolment Form 📝', sub:'National Identity Management Commission', body:`<div class="kv">
      <b>Surname</b><span>${esc(F.surname)}</span><b>First name</b><span>${esc(state.name)}</span>
      <b>Sex</b><span>${state.gender === 'f' ? 'Female' : 'Male'}</span><b>Date of birth</b><span>${state.dob}</span>
      <b>State of origin</b><span>${TOWN_STATE[F.town] || AREA.city}</span><b>Residential address</b><span>${addressOf(B.home)}, ${AREA.name}, ${AREA.city}</span>
      <b>Phone number</b><span>${state.phoneNo}</span></div><div class="note">Check your details carefully. Wrong details cost money to correct later.</div>`,
      options:[
        opt('Submit form ✍🏾', 'Then go to the capture booth', () => {
          inside.visit.form = true; advanceTime(20); closePanel();
          speak(inside.officer, 'Thank you. Now go to the capture booth on your right for photo and fingerprints.'); return false;
        }, null, 'go')
      ]};
  }
});
