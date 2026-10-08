'use strict';
/* =========================================================
   CLOUD: accounts, online saves, admin actions, announcements
   Uses Supabase (auth + Postgres). If js/config.js is empty or
   the network is down, the game runs offline exactly as before.
   ========================================================= */
let sb = null, cloudUser = null, cloudProfile = null, cloudLeaving = false;
function reloadGame(){ cloudLeaving = true; location.reload(); }
let cloudLastPush = 0, cloudPushTimer = null, cloudPushing = false, cloudLastOk = 0, cloudErr = '';
const authData = {email:'', password:'', username:'', msg:''};
const cloudOn = () => !!sb;

function cloudInit(){
  try {
    if (CLOUD_CONFIG.url && CLOUD_CONFIG.key && window.supabase && window.supabase.createClient)
      sb = window.supabase.createClient(CLOUD_CONFIG.url, CLOUD_CONFIG.key, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
  } catch (e){ console.error(e); sb = null; }
}
function localBoot(){ if (loadGame()) enterWorld(false); else openPanel('setup'); }
async function cloudBoot(){
  cloudInit();
  if (!sb){ localBoot(); return; }
  let session = null;
  try { session = (await sb.auth.getSession()).data.session; } catch (e){ console.error(e); }
  if (session && session.user) await afterLogin(session.user);
  else openPanel('auth', {mode:'start'});
}

/* ---------- local save helpers ---------- */
function readLocal(){
  try { const raw = localStorage.getItem(SAVE_KEY) || OLD_SAVE_KEYS.map(k => localStorage.getItem(k)).find(Boolean); return raw ? JSON.parse(raw) : null; } catch (e){ return null; }
}
function writeLocal(d){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e){} }
function saveSummary(d){
  const area = AREAS.find(a => a.id === d.area);
  return `${d.name} · ${area ? area.name : ''} · Day ${d.day} · ${fmt((d.money || 0) + (d.bank || 0))}`;
}

/* ---------- sign in / sign up ---------- */
async function doSignIn(){
  const email = authData.email.trim(), password = authData.password;
  if (!email || !password){ toast('Enter your email and password.', 'bad'); return; }
  authBusy(true);
  const {data, error} = await sb.auth.signInWithPassword({email, password});
  authBusy(false);
  if (error){ authData.msg = error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message; renderPanel(); return; }
  authData.password = '';
  await afterLogin(data.user);
}
async function doSignUp(){
  const email = authData.email.trim(), password = authData.password, username = authData.username.trim();
  if (!/^[A-Za-z0-9_]{3,18}$/.test(username)){ authData.msg = 'Username: 3 to 18 letters, numbers or _.'; renderPanel(); return; }
  if (!/^\S+@\S+\.\S+$/.test(email)){ authData.msg = 'Enter a valid email address.'; renderPanel(); return; }
  if (password.length < 6){ authData.msg = 'Password must be at least 6 characters.'; renderPanel(); return; }
  authBusy(true);
  const {data, error} = await sb.auth.signUp({email, password, options:{data:{username}, emailRedirectTo:location.origin + location.pathname}});
  authBusy(false);
  if (error){ authData.msg = error.message; renderPanel(); return; }
  authData.password = '';
  if (data.session && data.user){ await afterLogin(data.user, true); return; }
  authData.msg = `Account created! We sent a confirmation link to ${email}. Open it, then sign in here.`;
  openPanel('auth', {mode:'login'});
}
async function doForgot(){
  const email = authData.email.trim();
  if (!email){ authData.msg = 'Type your email first, then tap "Forgot password".'; renderPanel(); return; }
  const {error} = await sb.auth.resetPasswordForEmail(email, {redirectTo:location.origin + location.pathname});
  authData.msg = error ? error.message : `Password reset link sent to ${email}.`; renderPanel();
}
function authBusy(on){ document.body.classList.toggle('busy', on); }

async function afterLogin(user, isNew){
  cloudUser = user;
  try {
    const {data:prof} = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    cloudProfile = prof;
    if (!cloudProfile){
      // profile row missing (signed up before the database was set up): create it now
      const row = {id:user.id, email:user.email, username:(user.user_metadata || {}).username || null};
      let r = await sb.from('profiles').insert(row).select().maybeSingle();
      if (r.error && row.username){ row.username = row.username + '_' + user.id.slice(0, 4); r = await sb.from('profiles').insert(row).select().maybeSingle(); }
      cloudProfile = r.data || Object.assign(row, {sessions:0, play_minutes:0});
    }
    if (cloudProfile.banned){ openPanel('banned'); return; }
    sb.from('profiles').update({last_seen:new Date().toISOString(), sessions:(cloudProfile.sessions || 0) + 1, device:isTouch ? 'mobile' : 'desktop'}).eq('id', user.id).then(() => {});
    cloudLog(isNew ? 'signup' : 'login', isTouch ? 'mobile' : 'desktop');
    const {data:row} = await sb.from('saves').select('data,updated_at').eq('user_id', user.id).maybeSingle();
    const cloud = row && row.data ? row.data : null;
    if (cloud && !cloud.savedAt) cloud.savedAt = Date.parse(row.updated_at) || 0;
    const local = state ? JSON.parse(JSON.stringify(state)) : readLocal();
    const localMine = local && local.uid === user.id, localGuest = local && local.area && !local.uid;
    if (cloud && localMine){ useSave((local.savedAt || 0) >= (cloud.savedAt || 0) ? local : cloud); return; }
    if (cloud && localGuest && local.day > 1){ openPanel('chooseSave', {cloud, local}); return; }
    if (cloud){ useSave(cloud); return; }
    if (local && (localMine || localGuest)){ local.uid = user.id; useSave(local, true); return; }
    // brand new character
    if (state){ reloadGame(); return; }
    try { localStorage.removeItem(SAVE_KEY); } catch (e){}
    cloudStart();
    openPanel('setup');
    toast(`Welcome, ${cloudProfile.username || 'player'}! Create your character.`, 'good');
  } catch (e){
    console.error(e);
    toast('Could not reach the server. Playing offline on this device.', 'bad');
    if (!state) localBoot();
  }
}
function useSave(d, push){
  d.uid = cloudUser.id;
  if (state && state.savedAt === d.savedAt && state.name === d.name){
    state.uid = d.uid; cloudStart(); if (push) cloudPush(true);
    if (panelState) closePanel();
    toast('☁️ Signed in. Your life is now saved online.', 'good');
    return;
  }
  writeLocal(d);
  if (state){ reloadGame(); return; }
  panelState = null; panelEl.classList.remove('show');
  if (loadGame()){ enterWorld(false); cloudStart(); if (push) cloudPush(true); }
  else openPanel('setup');
}
async function signOut(){
  if (state && cloudUser){ saveGame(true); await cloudPush(true); }
  cloudLeaving = true;
  try { await sb.auth.signOut(); } catch (e){}
  try { localStorage.removeItem(SAVE_KEY); OLD_SAVE_KEYS.forEach(k => localStorage.removeItem(k)); } catch (e){}
  reloadGame();
}

/* ---------- online saving ---------- */
function cloudSaveSoon(){
  if (!sb || !cloudUser || !state) return;
  const wait = 20000 - (Date.now() - cloudLastPush);
  if (wait <= 0) cloudPush();
  else if (!cloudPushTimer) cloudPushTimer = setTimeout(() => { cloudPushTimer = null; cloudPush(); }, wait);
}
async function cloudPush(force){
  if (!sb || !cloudUser || !state || cloudLeaving || (cloudPushing && !force)) return;
  cloudPushing = true; cloudLastPush = Date.now();
  state.uid = cloudUser.id;
  const j = state.job ? JOB[state.job] : null, pn = state.partner ? NPC[state.partner] : null;
  const row = {
    user_id:cloudUser.id, data:state, version:VERSION, updated_at:new Date().toISOString(),
    char_name:state.name, gender:state.gender, area:AREA ? AREA.name : state.area, game_day:state.day, age:ageNow(),
    money:Math.round(state.money + state.bank + bizWorth()), job:j ? jobTitle() : state.uni ? `Student ${state.uni.level}L` : state.nysc === 2 ? 'Corps member' : 'Unemployed',
    education:state.degree ? `B.Sc. ${DEPTS[state.degree.dept].name} (${state.degree.cls})` : state.uni ? `${DEPTS[state.uni.dept].name} ${state.uni.level}L` : state.jamb ? 'JAMB passed' : 'SSCE',
    relationship:pn ? `${STAGE_LABEL[stageOf(pn.id)] || ''} · ${pn.name}` : 'Single', children:(state.kids || []).length, housing:HOUSING[state.housing].name
  };
  try {
    const {error} = await sb.from('saves').upsert(row);
    if (error) throw error;
    cloudLastOk = Date.now(); cloudErr = '';
  } catch (e){ cloudErr = e.message || 'offline'; console.warn('cloud save failed', e); }
  cloudPushing = false;
}
function cloudLog(type, detail){
  if (!sb || !cloudUser) return;
  sb.from('events').insert({user_id:cloudUser.id, type, detail:String(detail || '').slice(0, 300), game_day:state ? state.day : null}).then(() => {}, () => {});
}

/* ---------- heartbeat: presence, admin actions, announcements, bans ---------- */
let cloudBeat = null, beatN = 0;
function cloudStart(){
  if (cloudBeat || !sb || !cloudUser) return;
  cloudBeat = setInterval(cloudTick, 60000);
  setTimeout(cloudTick, 4000);
}
async function cloudTick(){
  if (!sb || !cloudUser || document.hidden) return;
  beatN++;
  try {
    const {data:prof} = await sb.from('profiles').select('banned,ban_reason,play_minutes,is_admin').eq('id', cloudUser.id).maybeSingle();
    if (prof) cloudProfile.is_admin = prof.is_admin;
    if (prof && prof.banned){ cloudProfile.banned = true; cloudProfile.ban_reason = prof.ban_reason; saveGame(true); openPanel('banned'); paused = true; return; }
    await sb.from('profiles').update({last_seen:new Date().toISOString(), play_minutes:((prof && prof.play_minutes) || 0) + 1}).eq('id', cloudUser.id);
    if (!state) return;
    await applyAdminActions();
    if (beatN === 1 || beatN % 5 === 0) await checkAnnouncements();
  } catch (e){ console.warn(e); }
}
async function applyAdminActions(){
  const {data} = await sb.from('admin_actions').select('*').eq('user_id', cloudUser.id).eq('applied', false).order('id');
  for (const a of data || []){
    const p = a.payload || {};
    if (a.kind === 'money'){ const amt = Math.round(+p.amount || 0); state.bank += amt; if (typeof addTx === 'function') addTx(p.note || 'My Naija Life support', amt); smsAdd('NaijaTrust Bank', `Credit alert: ${fmt(amt)}. ${p.note || 'From My Naija Life support.'}`); toast(`💸 ${fmt(amt)} credited to your bank account.`, 'good'); }
    else if (a.kind === 'heal'){ state.health = 100; state.energy = 100; state.hunger = 100; toast('✨ You feel completely refreshed!', 'good'); }
    else if (a.kind === 'message'){ smsAdd('My Naija Life', p.text || ''); toast(`📩 Message from My Naija Life: ${p.text || ''}`, 'info'); }
    await sb.from('admin_actions').update({applied:true, applied_at:new Date().toISOString()}).eq('id', a.id);
    if (a.kind === 'reset'){ cloudLeaving = true; try { localStorage.removeItem(SAVE_KEY); } catch (e){} toast('Your game was reset by support.', 'bad'); setTimeout(reloadGame, 1500); return; }
  }
  if ((data || []).length){ updateHUD(); saveGame(true); }
}
async function checkAnnouncements(){
  const {data} = await sb.from('announcements').select('id,title,body').eq('active', true).gt('id', state.annSeen || 0).order('id').limit(5);
  (data || []).forEach(a => { smsAdd('My Naija Life', `📢 ${a.title}: ${a.body}`); toast(`📢 ${a.title}`, 'info'); state.annSeen = Math.max(state.annSeen || 0, a.id); });
}

/* ---------- hooks into the game ---------- */
const _addHistory = addHistory;
addHistory = function(t, i){ _addHistory(t, i); cloudLog('life', `${i || ''} ${t}`.trim()); };
document.addEventListener('visibilitychange', () => { if (document.hidden && cloudUser && state){ saveGame(true); cloudPush(true); } });

/* ---------- panels ---------- */
function authInputs(fields){
  return fields.map(f => `<div class="sec">${f[1]}</div><input type="${f[2]}" class="authIn" data-k="${f[0]}" maxlength="${f[0] === 'username' ? 18 : 80}" autocomplete="${f[3]}" value="${esc(authData[f[0]])}" placeholder="${f[4] || ''}">`).join('');
}
Object.assign(PANELS, {
  auth: (d) => {
    const mode = (d && d.mode) || 'start', msg = authData.msg ? `<div class="note">${esc(authData.msg)}</div>` : '';
    const back = opt('Back', '', () => { authData.msg = ''; openPanel('auth', {mode:'start'}); return false; });
    if (mode === 'login') return {title:'Sign in 🔐', sub:'Continue your life on any device.', body:msg + authInputs([['email', 'Email', 'email', 'username', 'you@example.com'], ['password', 'Password', 'password', 'current-password']]),
      options:[opt('Sign in ▶', '', () => { doSignIn(); return false; }, null, 'go'), opt('Forgot password?', 'We email you a reset link', () => { doForgot(); return false; }), opt('Create an account instead', '', () => { authData.msg = ''; openPanel('auth', {mode:'signup'}); return false; }), back]};
    if (mode === 'signup') return {title:'Create your account ✨', sub:'Your life is saved online so you can continue on any phone or computer.', body:msg + authInputs([['username', 'Username', 'text', 'username', 'e.g. temi_dev'], ['email', 'Email', 'email', 'email', 'you@example.com'], ['password', 'Password (6+ characters)', 'password', 'new-password']]),
      options:[opt('Create account ▶', '', () => { doSignUp(); return false; }, null, 'go'), opt('I already have an account', '', () => { authData.msg = ''; openPanel('auth', {mode:'login'}); return false; }), back]};
    return {title:'My Naija Life 🇳🇬', sub:'Live your life in Naija. Study, hustle, love, marry and raise a family.', body:msg + '<p>Sign in to save your life online and continue on any device.</p>',
      options:[
        opt('Sign in 🔐', 'I have an account', () => { authData.msg = ''; openPanel('auth', {mode:'login'}); return false; }, null, 'go'),
        opt('Create account ✨', 'New here? Takes 30 seconds', () => { authData.msg = ''; openPanel('auth', {mode:'signup'}); return false; }, null, 'cur'),
        ...(state ? [opt('Back to the game', '', () => { closePanel(); return false; })] : [opt('Play as guest', 'Saved on this device only. You can create an account later.', () => { panelState = null; panelEl.classList.remove('show'); localBoot(); return false; })])
      ]};
  },
  chooseSave: (d) => ({
    title:'Which life do you want to continue? ☁️', sub:'This account already has an online save, and this device has a different one.',
    body:`<div class="kv"><b>☁️ Online</b><span>${esc(saveSummary(d.cloud))}</span><b>📱 This device</b><span>${esc(saveSummary(d.local))}</span></div><div class="note">The one you do not pick will be replaced.</div>`,
    options:[
      opt('Continue the online save ☁️', saveSummary(d.cloud), () => { useSave(d.cloud); return false; }, null, 'go'),
      opt('Keep this device\'s save 📱', 'It will be uploaded to your account', () => { d.local.savedAt = Date.now(); useSave(d.local, true); return false; })
    ]
  }),
  banned: () => ({
    title:'Account suspended 🚫', sub:'',
    body:`<p>This account has been suspended.${cloudProfile && cloudProfile.ban_reason ? ` Reason: <b>${esc(cloudProfile.ban_reason)}</b>.` : ''}</p><p>If you think this is a mistake, contact support.</p>`,
    options:[opt('Sign out', '', () => { signOut(); return false; }, null, 'danger')]
  }),
  account: () => {
    const synced = cloudLastOk ? `${Math.max(0, Math.round((Date.now() - cloudLastOk) / 60000))} min ago` : 'Not yet';
    if (!cloudUser) return {title:'Account ☁️', sub:'You are playing as a guest.', body:'<p>Your progress is saved on this device only. Create a free account to keep it safe and continue on any device. Your current life comes with you.</p>',
      options:[opt('Create account ✨', 'Keep this life', () => { openPanel('auth', {mode:'signup'}); return false; }, null, 'go'), opt('Sign in 🔐', '', () => { openPanel('auth', {mode:'login'}); return false; }), opt('Back', '', () => { openPanel('menu'); return false; })]};
    return {title:'Account ☁️', sub:cloudProfile && cloudProfile.username ? `@${cloudProfile.username}` : '',
      body:`<div class="kv"><b>Email</b><span>${esc(cloudUser.email || '')}</span><b>Online save</b><span>${cloudErr ? `⚠️ ${esc(cloudErr)}` : `✅ Last synced ${synced}`}</span></div>`,
      options:[
        opt('Sync now ☁️', 'Upload your progress', () => { saveGame(true); cloudPush(true).then(() => { toast(cloudErr ? 'Sync failed. Check your connection.' : 'Saved online ✅', cloudErr ? 'bad' : 'good'); if (panelState && panelState.kind === 'account') renderPanel(); }); return false; }, null, 'cur'),
        opt('Sign out', 'Your life stays saved online', () => { signOut(); return false; }, null, 'danger'),
        opt('Back', '', () => { openPanel('menu'); return false; })
      ]};
  }
});
const _menuC = PANELS.menu;
PANELS.menu = () => {
  const r = _menuC();
  if (cloudProfile && cloudProfile.is_admin) r.options.splice(1, 0, opt('Admin dashboard 🛠️', 'Opens in a new tab', () => { window.open('admin.html', '_blank'); return false; }, null, 'cur'));
  if (sb) r.options.splice(1, 0, opt(cloudUser ? 'Account ☁️' : 'Save online ☁️', cloudUser ? (cloudProfile && cloudProfile.username ? '@' + cloudProfile.username : cloudUser.email) : 'Create an account to keep your life', () => { openPanel('account'); return false; }, null, cloudUser ? '' : 'cur'));
  return r;
};
/* auth inputs: keep values between re-renders */
document.addEventListener('input', e => { if (e.target.classList && e.target.classList.contains('authIn')) authData[e.target.dataset.k] = e.target.value; });
document.addEventListener('keydown', e => {
  if (e.target.classList && e.target.classList.contains('authIn') && e.key === 'Enter' && panelState && panelState.kind === 'auth'){
    const m = panelState.data && panelState.data.mode; if (m === 'login') doSignIn(); else if (m === 'signup') doSignUp();
  }
});
