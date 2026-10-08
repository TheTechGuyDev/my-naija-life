'use strict';
/* =========================================================
   MY NAIJA LIFE · ADMIN DASHBOARD
   Reads every player's profile, save summary and activity
   from Supabase. Only accounts with profiles.is_admin = true
   can see other players (enforced by Row Level Security).
   ========================================================= */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const naira = n => '₦' + Math.round(+n || 0).toLocaleString('en-NG');
const DAY = 864e5;
let sb = null, me = null;
let PROFILES = [], SAVES = {}, EVENTS = [], ANNS = [];

function toast(t, ms){ const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, ms || 2600); }
function ago(ts){
  if (!ts) return 'never';
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' hr ago'; if (s < 86400 * 30) return Math.floor(s / 86400) + ' days ago';
  return new Date(ts).toLocaleDateString();
}
const online = p => p.last_seen && Date.now() - new Date(p.last_seen) < 3 * 60000;
const today = p => p.last_seen && Date.now() - new Date(p.last_seen) < DAY;
const nameOf = id => { const p = PROFILES.find(x => x.id === id); return p ? (p.username || p.email || 'player') : 'player'; };

/* ---------- auth ---------- */
async function boot(){
  if (!CLOUD_CONFIG.url || !CLOUD_CONFIG.key || !window.supabase){ $('lgMsg').textContent = 'Supabase is not configured yet (js/config.js).'; return; }
  sb = window.supabase.createClient(CLOUD_CONFIG.url, CLOUD_CONFIG.key, {auth:{persistSession:true, autoRefreshToken:true, storageKey:'mnl-admin'}});
  const {data:{session}} = await sb.auth.getSession();
  if (session) await enter(session.user);
}
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!sb){ return; }
  $('lgBtn').disabled = true; $('lgMsg').textContent = '';
  const {data, error} = await sb.auth.signInWithPassword({email:$('lgEmail').value.trim(), password:$('lgPass').value});
  $('lgBtn').disabled = false;
  if (error){ $('lgMsg').textContent = error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message; return; }
  await enter(data.user);
});
async function enter(user){
  const {data:prof} = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (!prof || !prof.is_admin){ $('lgMsg').textContent = 'This account is not an admin.'; await sb.auth.signOut(); return; }
  me = prof;
  $('login').hidden = true; $('app').hidden = false;
  await loadAll();
  setInterval(() => { if (!document.hidden) loadAll(true); }, 60000);
}
$('outBtn').onclick = async () => { await sb.auth.signOut(); location.reload(); };
$('refreshBtn').onclick = () => loadAll();

/* ---------- data ---------- */
async function loadAll(quiet){
  document.body.classList.add('busy');
  const cols = 'user_id,char_name,gender,area,game_day,age,money,job,education,relationship,children,housing,version,updated_at';
  const [p, s, e, a] = await Promise.all([
    sb.from('profiles').select('*').order('created_at', {ascending:false}).limit(5000),
    sb.from('saves').select(cols).limit(5000),
    sb.from('events').select('*').order('created_at', {ascending:false}).limit(300),
    sb.from('announcements').select('*').order('id', {ascending:false}).limit(50)
  ]);
  document.body.classList.remove('busy');
  const err = p.error || s.error || e.error || a.error;
  if (err){ toast('Could not load data: ' + err.message, 5000); return; }
  PROFILES = p.data; SAVES = {}; s.data.forEach(r => SAVES[r.user_id] = r); EVENTS = e.data; ANNS = a.data;
  $('updated').textContent = 'Updated ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  renderOverview(); renderPlayers(); renderFeed(); renderAnns();
  if (!quiet) toast('Data loaded');
}

/* ---------- tabs ---------- */
$('tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  [...$('tabs').children].forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.tab').forEach(t => t.hidden = t.id !== 'tab-' + b.dataset.tab);
});

/* ---------- overview ---------- */
function renderOverview(){
  const total = PROFILES.length, on = PROFILES.filter(online).length, act = PROFILES.filter(today).length;
  const week = PROFILES.filter(p => Date.now() - new Date(p.created_at) < 7 * DAY).length;
  const hrs = Math.round(PROFILES.reduce((s, p) => s + (p.play_minutes || 0), 0) / 60);
  const sv = Object.values(SAVES), avgDay = sv.length ? Math.round(sv.reduce((s, r) => s + (r.game_day || 0), 0) / sv.length) : 0;
  const married = sv.filter(r => /Married/.test(r.relationship || '')).length;
  const tile = (k, v, s, dot) => `<div class="tile"><div class="k">${dot ? `<span class="dot" style="background:${dot}"></span>` : ''}${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  $('tiles').innerHTML = [
    tile('Players', total.toLocaleString(), `${sv.length} with a character`),
    tile('Online now', on, 'Active in the last 3 min', 'var(--good)'),
    tile('Active today', act, `${total ? Math.round(act / total * 100) : 0}% of players`),
    tile('New this week', week, 'Sign-ups in 7 days'),
    tile('Hours played', hrs.toLocaleString(), 'All players, total'),
    tile('Average game day', avgDay, `${married} married character${married === 1 ? '' : 's'}`)
  ].join('');

  // sign-ups per day (14 days)
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 13 + i); return d; });
  const counts = days.map(d => PROFILES.filter(p => { const c = new Date(p.created_at); return c >= d && c < new Date(d.getTime() + DAY); }).length);
  const mx = Math.max(1, ...counts);
  $('chSignups').innerHTML = counts.some(Boolean) ? counts.map((c, i) => {
    const d = days[i], lab = d.toLocaleDateString([], {day:'numeric', month:'short'});
    return `<div class="col" data-tip="${esc(lab)}: ${c} new player${c === 1 ? '' : 's'}">${c && (i === 13 || c === mx) ? `<span class="val">${c}</span>` : ''}<div class="bar" style="height:${c / mx * 82}%"></div>${i % 2 === 1 ? `<span class="lab">${lab}</span>` : ''}</div>`;
  }).join('') : '<div class="empty" style="width:100%">No sign-ups in the last 14 days.</div>';

  // players by area
  const byArea = {}; sv.forEach(r => { const k = r.area || 'Unknown'; byArea[k] = (byArea[k] || 0) + 1; });
  const areas = Object.entries(byArea).sort((a, b) => b[1] - a[1]), am = Math.max(1, ...areas.map(x => x[1]));
  $('chAreas').innerHTML = areas.length ? areas.map(([k, v]) => `<div class="hrow" data-tip="${esc(k)}: ${v} player${v === 1 ? '' : 's'}"><span class="t">${esc(k)}</span><div class="track"><div class="fill" style="width:${v / am * 100}%"></div></div><span class="num">${v}</span></div>`).join('') : '<div class="empty">No characters yet.</div>';

  // richest
  const rich = sv.slice().sort((a, b) => (b.money || 0) - (a.money || 0)).slice(0, 6);
  $('topRich').innerHTML = rich.length ? rich.map((r, i) => `<div class="rank" data-uid="${r.user_id}" style="cursor:pointer"><span class="muted">${i + 1}</span><span><b>${esc(r.char_name)}</b> <span class="muted small">@${esc(nameOf(r.user_id))} · ${esc(r.job || '')}</span></span><span class="num">${naira(r.money)}</span></div>`).join('') : '<div class="empty">No characters yet.</div>';
  $('miniFeed').innerHTML = feedHTML(EVENTS.filter(e => e.type === 'life').slice(0, 25));
}

/* ---------- players ---------- */
function statusChips(p){
  const out = [];
  if (p.banned) out.push('<span class="chip bad">● Banned</span>');
  else if (online(p)) out.push('<span class="chip good">● Online</span>');
  else if (today(p)) out.push('<span class="chip warn">● Today</span>');
  else out.push('<span class="chip">● Away</span>');
  if (p.is_admin) out.push('<span class="chip admin">Admin</span>');
  return out.join(' ');
}
function renderPlayers(){
  const q = $('q').value.trim().toLowerCase(), sort = $('sort').value, f = $('filter').value;
  let rows = PROFILES.map(p => ({p, s:SAVES[p.id]}));
  if (q) rows = rows.filter(({p, s}) => [p.username, p.email, s && s.char_name, s && s.area, s && s.job].some(v => (v || '').toLowerCase().includes(q)));
  if (f === 'online') rows = rows.filter(r => online(r.p)); else if (f === 'today') rows = rows.filter(r => today(r.p));
  else if (f === 'nosave') rows = rows.filter(r => !r.s); else if (f === 'banned') rows = rows.filter(r => r.p.banned); else if (f === 'admin') rows = rows.filter(r => r.p.is_admin);
  const key = r => sort === 'money' ? (r.s ? r.s.money : -1) : sort === 'game_day' ? (r.s ? r.s.game_day : -1) : sort === 'play_minutes' ? r.p.play_minutes || 0 : new Date(r.p[sort] || 0).getTime();
  rows.sort((a, b) => key(b) - key(a));
  $('pCount').textContent = `${rows.length} player${rows.length === 1 ? '' : 's'}`;
  $('pRows').innerHTML = rows.map(({p, s}) => `<tr data-uid="${p.id}">
    <td><b>${esc(p.username || '(no username)')}</b><div class="sub">${esc(p.email || '')}</div></td>
    <td>${s ? `<b>${esc(s.char_name)}</b> ${s.gender === 'f' ? '♀' : '♂'}<div class="sub">${esc(s.area)}</div>` : '<span class="muted">No character yet</span>'}</td>
    <td>${s ? `Day ${s.game_day}<div class="sub">Age ${s.age}</div>` : ''}</td>
    <td class="num">${s ? naira(s.money) : ''}</td>
    <td>${s ? esc(s.job) + `<div class="sub">${esc(s.education)}</div>` : ''}</td>
    <td>${s ? esc(s.relationship) + (s.children ? `<div class="sub">${s.children} child${s.children > 1 ? 'ren' : ''}</div>` : '') : ''}</td>
    <td>${ago(p.last_seen)}<div class="sub">${Math.round((p.play_minutes || 0) / 6) / 10} hrs played</div></td>
    <td>${statusChips(p)}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">No players match.</td></tr>';
}
['q', 'sort', 'filter'].forEach(id => $(id).addEventListener('input', renderPlayers));
document.addEventListener('click', e => { const r = e.target.closest('[data-uid]'); if (r && !e.target.closest('.drawer')) openPlayer(r.dataset.uid); });

/* ---------- player drawer ---------- */
async function openPlayer(uid){
  const p = PROFILES.find(x => x.id === uid); if (!p) return;
  $('drawer').hidden = false;
  $('dBody').innerHTML = '<p class="muted">Loading…</p>';
  const [sv, ev, ac] = await Promise.all([
    sb.from('saves').select('data,updated_at,version').eq('user_id', uid).maybeSingle(),
    sb.from('events').select('*').eq('user_id', uid).order('created_at', {ascending:false}).limit(60),
    sb.from('admin_actions').select('*').eq('user_id', uid).order('id', {ascending:false}).limit(10)
  ]);
  const d = sv.data && sv.data.data, s = SAVES[uid];
  const meter = (k, v) => `<div class="stat"><div class="k">${k}</div><div class="v">${Math.round(v || 0)}</div><div class="meter"><i style="width:${Math.max(0, Math.min(100, v || 0))}%"></i></div></div>`;
  const fam = d && d.family ? `${d.family.surname} family, ${d.family.town}` : '';
  const kids = d && d.kids && d.kids.length ? d.kids.map(k => esc(k.name)).join(', ') : 'None';
  $('dBody').innerHTML = `
    <h2>${esc(p.username || p.email)}</h2>
    <div class="muted">${esc(p.email || '')}</div>
    <div style="margin-top:8px">${statusChips(p)}</div>
    <div class="kv">
      <b>Joined</b><span>${new Date(p.created_at).toLocaleString()}</span>
      <b>Last seen</b><span>${ago(p.last_seen)} · ${esc(p.device || '')}</span>
      <b>Sessions</b><span>${p.sessions || 0} · ${Math.round((p.play_minutes || 0) / 6) / 10} hrs played</span>
      ${p.banned && p.ban_reason ? `<b>Ban reason</b><span>${esc(p.ban_reason)}</span>` : ''}
    </div>
    ${d ? `
    <div class="sec">Character</div>
    <div class="kv">
      <b>Name</b><span>${esc(d.name)} (${d.gender === 'f' ? 'female' : 'male'}, ${esc(d.religion || '')})</span>
      <b>Location</b><span>${esc(s ? s.area : d.area)}</span>
      <b>Game day · Age</b><span>Day ${d.day} · Age ${s ? s.age : ''}</span>
      <b>Cash · Bank</b><span>${naira(d.money)} · ${naira(d.bank)}</span>
      <b>Occupation</b><span>${esc(s ? s.job : '')}</span>
      <b>Education</b><span>${esc(s ? s.education : '')}</span>
      <b>Home</b><span>${esc(s ? s.housing : '')}</span>
      <b>Relationship</b><span>${esc(s ? s.relationship : '')}</span>
      <b>Children</b><span>${kids}</span>
      <b>Family</b><span>${esc(fam)}</span>
      <b>Police record</b><span>${d.arrests || 0} arrest(s) · heat ${Math.round(d.heat || 0)}</span>
      <b>Game version</b><span>${esc(sv.data.version || '')} · saved ${ago(sv.data.updated_at)}</span>
    </div>
    <div class="stats">${meter('Health', d.health)}${meter('Energy', d.energy)}${meter('Food', d.hunger)}${meter('Happiness', d.happy)}</div>` : '<div class="sec">Character</div><p class="muted">This player has not created a character yet.</p>'}

    <div class="sec">Support actions</div>
    <div class="acts">
      <div class="act"><h4>💸 Credit money</h4><input id="aAmt" type="number" min="1000" step="1000" placeholder="Amount in ₦"><input id="aNote" placeholder="Note (optional)"><button class="btn primary" id="aMoney">Credit bank account</button></div>
      <div class="act"><h4>📩 Send a message</h4><textarea id="aMsg" rows="3" maxlength="300" placeholder="Arrives as an SMS in their game"></textarea><button class="btn" id="aSend">Send message</button></div>
      <div class="act"><h4>✨ Restore character</h4><p class="muted small" style="margin:0">Sets health, energy and food to 100.</p><button class="btn" id="aHeal">Restore</button></div>
      <div class="act"><h4>🚫 Access</h4>${p.banned ? '<button class="btn" id="aUnban">Unban player</button>' : '<input id="aReason" placeholder="Reason (shown to the player)"><button class="btn danger" id="aBan">Ban player</button>'}
        <button class="btn ghost" id="aAdmin">${p.is_admin ? 'Remove admin rights' : 'Make admin'}</button></div>
      <div class="act"><h4>♻️ Reset save</h4><p class="muted small" style="margin:0">Deletes their character. They start a new life.</p><button class="btn danger" id="aReset" ${d ? '' : 'disabled'}>Reset character</button></div>
      <div class="act"><h4>⬇️ Export</h4><p class="muted small" style="margin:0">Download the full save as JSON.</p><button class="btn" id="aExport" ${d ? '' : 'disabled'}>Download save</button></div>
    </div>
    ${(ac.data || []).length ? `<div class="sec">Recent support actions</div><div class="feed">${ac.data.map(a => `<div class="ev"><span class="who">${esc(a.kind)}</span><span>${esc(a.payload.amount ? naira(a.payload.amount) : a.payload.text || '')}</span><span class="when">${a.applied ? 'Delivered' : 'Pending'} · ${ago(a.created_at)}</span></div>`).join('')}</div>` : ''}
    <div class="sec">Life timeline</div>
    <div class="feed big">${feedHTML(ev.data || [], true)}</div>`;

  const act = (kind, payload, okMsg) => sb.from('admin_actions').insert({user_id:uid, kind, payload, created_by:me.id}).then(({error}) => { toast(error ? 'Failed: ' + error.message : okMsg); if (!error) openPlayer(uid); });
  const bind = (id, fn) => { const b = $(id); if (b) b.onclick = fn; };
  bind('aMoney', () => { const amt = Math.round(+$('aAmt').value); if (!(amt > 0)) return toast('Enter an amount.'); act('money', {amount:amt, note:$('aNote').value.trim()}, `${naira(amt)} will be credited next time they play.`); });
  bind('aSend', () => { const t = $('aMsg').value.trim(); if (!t) return toast('Type a message.'); act('message', {text:t}, 'Message queued.'); });
  bind('aHeal', () => act('heal', {}, 'Restore queued.'));
  bind('aBan', async () => { if (!confirm(`Ban ${p.username || p.email}?`)) return; const {error} = await sb.from('profiles').update({banned:true, ban_reason:$('aReason').value.trim() || null}).eq('id', uid); toast(error ? error.message : 'Player banned.'); await loadAll(true); openPlayer(uid); });
  bind('aUnban', async () => { const {error} = await sb.from('profiles').update({banned:false, ban_reason:null}).eq('id', uid); toast(error ? error.message : 'Player unbanned.'); await loadAll(true); openPlayer(uid); });
  bind('aAdmin', async () => { if (uid === me.id && p.is_admin) return toast('You cannot remove your own admin rights.'); if (!confirm(p.is_admin ? 'Remove admin rights?' : 'Give this player full admin access?')) return; const {error} = await sb.from('profiles').update({is_admin:!p.is_admin}).eq('id', uid); toast(error ? error.message : 'Updated.'); await loadAll(true); openPlayer(uid); });
  bind('aReset', async () => { if (!confirm('Delete this character permanently?')) return; await sb.from('admin_actions').insert({user_id:uid, kind:'reset', payload:{}, created_by:me.id}); const {error} = await sb.from('saves').delete().eq('user_id', uid); toast(error ? error.message : 'Character reset.'); await loadAll(true); openPlayer(uid); });
  bind('aExport', () => { const blob = new Blob([JSON.stringify(d, null, 2)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `save-${p.username || uid}.json`; a.click(); });
}
document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => $('drawer').hidden = true));
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('drawer').hidden = true; });

/* ---------- activity ---------- */
function feedHTML(list, own){
  if (!list.length) return '<div class="empty">No activity yet.</div>';
  const label = e => e.type === 'signup' ? '✨ Created an account' : e.type === 'login' ? `🔐 Signed in (${esc(e.detail)})` : esc(e.detail);
  return list.map(e => `<div class="ev" ${own ? '' : `data-uid="${e.user_id}" style="cursor:pointer"`}><span class="who">${own ? (e.game_day ? 'Day ' + e.game_day : '') : esc(nameOf(e.user_id))}</span><span>${label(e)}</span><span class="when">${ago(e.created_at)}</span></div>`).join('');
}
function renderFeed(){ const t = $('evType').value; $('feed').innerHTML = feedHTML(EVENTS.filter(e => !t || e.type === t)); }
$('evType').addEventListener('input', renderFeed);

/* ---------- announcements ---------- */
function renderAnns(){
  $('annList').innerHTML = ANNS.length ? ANNS.map(a => `<div class="ann"><div><b>${esc(a.title)}</b> ${a.active ? '<span class="chip good">Live</span>' : '<span class="chip">Off</span>'}<div class="muted small">${esc(a.body)}</div><div class="muted small">${ago(a.created_at)}</div></div><div style="display:flex;gap:6px"><button class="btn ghost" data-ann="${a.id}" data-on="${a.active ? 0 : 1}">${a.active ? 'Turn off' : 'Turn on'}</button><button class="btn danger" data-del="${a.id}">Delete</button></div></div>`).join('') : '<div class="empty">No announcements yet.</div>';
}
$('annForm').addEventListener('submit', async e => {
  e.preventDefault();
  const {error} = await sb.from('announcements').insert({title:$('annTitle').value.trim(), body:$('annBody').value.trim()});
  if (error) return toast(error.message);
  $('annTitle').value = ''; $('annBody').value = ''; toast('Announcement sent.'); loadAll(true);
});
$('annList').addEventListener('click', async e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.ann){ await sb.from('announcements').update({active:t.dataset.on === '1'}).eq('id', t.dataset.ann); }
  else if (t.dataset.del && confirm('Delete this announcement?')){ await sb.from('announcements').delete().eq('id', t.dataset.del); }
  loadAll(true);
});

/* ---------- chart tooltips ---------- */
document.addEventListener('mousemove', e => {
  const t = e.target.closest('[data-tip]'), tip = $('tip');
  if (!t){ tip.hidden = true; return; }
  tip.textContent = t.dataset.tip; tip.hidden = false;
  tip.style.left = Math.min(innerWidth - tip.offsetWidth - 8, e.clientX + 12) + 'px'; tip.style.top = (e.clientY - 36) + 'px';
});

boot();
