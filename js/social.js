'use strict';
/* =========================================================
   SOCIAL (V6): real players in your city, NaijaGram with
   real posts, likes, comments, follows, waves, leaderboards
   and a shareable life-story card. Needs an account (cloud).
   ========================================================= */
const GHOSTS = [];
const SOC = {feed:null, feedAt:0, feedBusy:false, likes:{}, myLikes:new Set(), cmtCount:{}, comments:{}, users:{}, userPosts:{}, ranks:{}, following:new Set(), followersReal:0};
let socialTimer = null, socialN = 0;
const socialOn = () => !!(sb && cloudUser && state);
const myName = () => (cloudProfile && cloudProfile.username) || (cloudUser && cloudUser.email.split('@')[0]) || state.name;
function agoTxt(ts){
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  return s < 60 ? 'now' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd';
}
function shareUrl(){ const base = location.origin + location.pathname.replace(/[^/]*$/, ''); return `${base}player.html?u=${encodeURIComponent(myName())}`; }
const GAME_URL = () => location.origin + location.pathname.replace(/[^/]*$/, '');

/* ---------- public card + presence ---------- */
function publicRow(){
  const j = state.job ? JOB[state.job] : null, pn = state.partner ? NPC[state.partner] : null;
  const pos = inside && B[inside.id] ? {x:B[inside.id].frontX, y:B[inside.id].frontY, inside:inside.id} : {x:player.x, y:player.y, inside:null};
  return {
    user_id:cloudUser.id, username:myName(), char_name:state.name, gender:state.gender, area_id:state.area, area:`${AREA.name}, ${AREA.city}`,
    game_day:state.day, age:ageNow(), net_worth:Math.round(state.money + state.bank + (state.hasOkada ? 600000 : 0)), rep:Math.round(state.rep),
    followers:PH().gram.followers, children:(state.kids || []).length,
    job:j ? j.name : state.uni ? `Student, ${state.uni.level}L` : state.nysc === 2 ? 'Corps member' : 'Unemployed',
    education:state.degree ? `B.Sc. ${DEPTS[state.degree.dept].name} (${state.degree.cls})` : state.uni ? `${DEPTS[state.uni.dept].name} student` : 'SSCE',
    relationship:pn ? `${STAGE_LABEL[stageOf(pn.id)] || ''} · ${pn.name}` : 'Single', housing:HOUSING[state.housing].name,
    story:state.history.slice(-8).map(h => ({d:h.d, t:h.t, i:h.i})),
    x:Math.round(pos.x), y:Math.round(pos.y), inside:pos.inside, online_at:new Date().toISOString(), updated_at:new Date().toISOString()
  };
}
function socialStart(){
  if (socialTimer || !sb || !cloudUser) return;
  socialTimer = setInterval(socialTick, 12000);
  setTimeout(socialTick, 1500);
  loadFollowing();
}
async function socialTick(){
  if (!socialOn() || document.hidden || cloudLeaving) return;
  socialN++;
  try {
    await sb.from('players_public').upsert(publicRow());
    await refreshGhosts();
    if (socialN % 2 === 1) await checkWaves();
  } catch (e){ console.warn('social', e); }
}
async function loadFollowing(){
  if (!sb || !cloudUser) return;
  const [a, b] = await Promise.all([sb.from('follows').select('followee').eq('follower', cloudUser.id), sb.from('follows').select('follower').eq('followee', cloudUser.id)]);
  SOC.following = new Set((a.data || []).map(r => r.followee));
  SOC.followersReal = (b.data || []).length;
}
async function checkWaves(){
  const {data} = await sb.from('waves').select('id,from_name').eq('to_user', cloudUser.id).eq('seen', false).limit(5);
  for (const w of data || []){ toast(`👋 @${w.from_name} waved at you!`, 'info'); sfx('ding'); await sb.from('waves').update({seen:true}).eq('id', w.id); }
}

/* ---------- other real players walking in your city ---------- */
async function refreshGhosts(){
  const since = new Date(Date.now() - 60000).toISOString();
  const {data} = await sb.from('players_public').select('*').eq('area_id', state.area).gt('online_at', since).limit(25);
  const rows = (data || []).filter(r => r.user_id !== cloudUser.id);
  const keep = new Set(rows.map(r => r.user_id));
  for (let i = GHOSTS.length - 1; i >= 0; i--) if (!keep.has(GHOSTS[i].uid)){ scene.remove(GHOSTS[i].p.g); GHOSTS.splice(i, 1); }
  rows.forEach(r => {
    let g = GHOSTS.find(x => x.uid === r.user_id);
    if (!g){
      const p = makePerson(outfit(r.gender === 'f' ? 'f' : 'm', seeded(r.user_id)));
      const label = makeLabel(`🌐 ${r.username}`, 0.32, 'rgba(150,30,140,.92)'); label.position.y = 2.25; p.g.add(label);
      g = {real:true, uid:r.user_id, name:'@' + r.username, role:'Player', police:false, x:r.x, y:r.y, tx:r.x, ty:r.y, face:0, moving:false, ph:0, p, label};
      GHOSTS.push(g);
    }
    g.data = r; g.name = '@' + r.username; g.tx = r.x; g.ty = r.y; g.away = !!r.inside;
    if (Math.hypot(g.tx - g.x, g.ty - g.y) > 400){ g.x = g.tx; g.y = g.ty; }
  });
}
function ghostFrame(dt){
  GHOSTS.forEach(g => {
    const dx = g.tx - g.x, dy = g.ty - g.y, d = Math.hypot(dx, dy);
    g.moving = d > 3;
    if (g.moving){ const st = Math.min(d, 60 * dt); g.x += dx / d * st; g.y += dy / d * st; g.face = turnTo(g.face, Math.atan2(dx, dy), 1 - Math.exp(-dt * 8)); g.ph += dt * 10; }
    g.p.g.visible = !g.away && !inside;
    const nc = Math.floor(g.x / T), nr = Math.floor(g.y / T);
    g.p.g.position.set(g.x * S, isSidewalk(nc, nr) ? 0.14 : 0, g.y * S); g.p.g.rotation.y = g.face;
    animPerson(g.p, g.moving, g.ph, false, 0.6);
    g.label.visible = Math.hypot(player.x - g.x, player.y - g.y) < 140;
  });
}

/* ---------- follows, waves ---------- */
async function toggleFollow(uid){
  if (!socialOn()) return;
  if (SOC.following.has(uid)){ SOC.following.delete(uid); await sb.from('follows').delete().eq('follower', cloudUser.id).eq('followee', uid); toast('Unfollowed.', 'info'); }
  else { SOC.following.add(uid); await sb.from('follows').insert({follower:cloudUser.id, followee:uid}); toast('Following ✅', 'good'); cloudLog('social', `Followed @${(SOC.users[uid] || {}).username || 'player'}`); }
  if (SOC.users[uid]) SOC.users[uid].fcount = null;
}
const wavedAt = {};
async function wave(uid, name){
  if (!socialOn()) return;
  if (wavedAt[uid] && Date.now() - wavedAt[uid] < 60000){ toast('You just waved. Give them a moment 😄', 'info'); return; }
  wavedAt[uid] = Date.now();
  await sb.from('waves').insert({from_user:cloudUser.id, to_user:uid, from_name:myName()});
  toast(`👋 You waved at ${name}.`, 'good');
}

/* ---------- NaijaGram: real posts ---------- */
async function cloudPost(img, caption){
  if (!socialOn()) return;
  const {error} = await sb.from('posts').insert({user_id:cloudUser.id, username:myName(), char_name:state.name, area:`${AREA.name}, ${AREA.city}`, caption:(caption || '').slice(0, 300), image:img});
  if (error) console.warn(error); else { SOC.feedAt = 0; SOC.userPosts[cloudUser.id] = null; }
}
const _postToGram = postToGram;
postToGram = function(photo, caption){ const r = _postToGram(photo, caption); if (r !== false) cloudPost(photo.img, caption); return r; };
async function loadFeed(){
  if (SOC.feedBusy || !socialOn()) return;
  SOC.feedBusy = true;
  try {
    const {data} = await sb.from('posts').select('id,user_id,username,char_name,area,caption,image,created_at').eq('hidden', false).order('created_at', {ascending:false}).limit(30);
    SOC.feed = data || []; SOC.feedAt = Date.now();
    await loadCounts(SOC.feed.map(p => p.id));
  } catch (e){ console.warn(e); }
  SOC.feedBusy = false;
}
async function loadCounts(ids){
  if (!ids.length) return;
  const [l, c] = await Promise.all([sb.from('post_likes').select('post_id,user_id').in('post_id', ids), sb.from('post_comments').select('post_id').in('post_id', ids)]);
  ids.forEach(id => { SOC.likes[id] = 0; SOC.cmtCount[id] = 0; });
  (l.data || []).forEach(r => { SOC.likes[r.post_id] = (SOC.likes[r.post_id] || 0) + 1; if (r.user_id === cloudUser.id) SOC.myLikes.add(r.post_id); });
  (c.data || []).forEach(r => { SOC.cmtCount[r.post_id] = (SOC.cmtCount[r.post_id] || 0) + 1; });
}
async function toggleLike(post){
  if (!socialOn()) return;
  const id = post.id;
  if (SOC.myLikes.has(id)){ SOC.myLikes.delete(id); SOC.likes[id] = Math.max(0, (SOC.likes[id] || 1) - 1); sb.from('post_likes').delete().eq('post_id', id).eq('user_id', cloudUser.id).then(() => {}); }
  else { SOC.myLikes.add(id); SOC.likes[id] = (SOC.likes[id] || 0) + 1; sb.from('post_likes').insert({post_id:id, user_id:cloudUser.id}).then(() => {}); }
}
async function loadComments(id){
  const {data} = await sb.from('post_comments').select('*').eq('post_id', id).order('created_at', {ascending:true}).limit(50);
  SOC.comments[id] = data || [];
}
async function addComment(id, body){
  body = (body || '').trim().slice(0, 200); if (!body || !socialOn()) return;
  const row = {post_id:id, user_id:cloudUser.id, username:myName(), body};
  (SOC.comments[id] = SOC.comments[id] || []).push(Object.assign({created_at:new Date().toISOString()}, row));
  SOC.cmtCount[id] = (SOC.cmtCount[id] || 0) + 1;
  await sb.from('post_comments').insert(row);
}
async function loadUser(uid){
  const [u, p, f] = await Promise.all([
    sb.from('players_public').select('*').eq('user_id', uid).maybeSingle(),
    sb.from('posts').select('id,user_id,username,caption,image,created_at').eq('user_id', uid).eq('hidden', false).order('created_at', {ascending:false}).limit(12),
    sb.from('follows').select('follower').eq('followee', uid)
  ]);
  SOC.users[uid] = Object.assign(u.data || {user_id:uid, username:'player'}, {fcount:(f.data || []).length});
  SOC.userPosts[uid] = p.data || [];
  await loadCounts(SOC.userPosts[uid].map(x => x.id));
}
async function loadRanks(cat){
  const col = RANK_CATS[cat].col;
  const {data} = await sb.from('players_public').select('user_id,username,char_name,area,game_day,age,net_worth,rep,followers,children,job').order(col, {ascending:false}).limit(20);
  const mine = data && data.find(r => r.user_id === cloudUser.id);
  let myRank = null;
  if (!mine){ const me = publicRow(); const {data:above} = await sb.from('players_public').select('user_id').gt(col, me[col]).limit(1000); myRank = (above || []).length + 1; }
  SOC.ranks[cat] = {rows:data || [], at:Date.now(), myRank};
}
/* re-render the phone when async data arrives and the same screen is still open */
function phRefresh(app){ const v = ph.stack[ph.stack.length - 1]; if (phoneOpen && v && v.app === app) phRender(); }

/* ---------- phone views ---------- */
const RANK_CATS = {
  rich:{col:'net_worth', name:'💰 Richest', fmt:r => fmt(r.net_worth)},
  rep:{col:'rep', name:'⭐ Respect', fmt:r => `${r.rep} rep`},
  followers:{col:'followers', name:'📸 Followers', fmt:r => `${(r.followers || 0).toLocaleString()}`},
  family:{col:'children', name:'👶🏾 Family', fmt:r => `${r.children} child${r.children === 1 ? '' : 'ren'}`},
  life:{col:'game_day', name:'⏳ Longest life', fmt:r => `Day ${r.game_day}`}
};
const signInNote = () => `<div class="ph-pad"><p>Sign in to see and play with real players across Naija 🇳🇬</p><button class="ph-btn" ${A(() => { closePhone(); openPanel('account'); return false; })}>Sign in / Create account</button></div>`;
function postCard(p){
  const liked = SOC.myLikes.has(p.id);
  return `<div class="ph-post"><div class="ph-row flat" ${A(() => phGo('ruser', {uid:p.user_id}))}>${avatar(p.username || 'P', p.user_id)}<div class="ph-grow"><b>${esc(p.username || 'player')} 🌐</b><small>${esc(p.char_name || '')}${p.area ? ' · ' + esc(p.area) : ''} · ${agoTxt(p.created_at)}</small></div></div>
    <img src="${esc(p.image)}" alt=""><div class="ph-pact"><button ${A(() => { toggleLike(p); })}>${liked ? '❤️' : '🤍'} ${(SOC.likes[p.id] || 0).toLocaleString()}</button>
    <button ${A(() => phGo('rpost', {id:p.id}))}>💬 ${SOC.cmtCount[p.id] || 0}</button></div>
    ${p.caption ? `<div class="ph-cap"><b>${esc(p.username || '')}</b> ${esc(p.caption)}</div>` : ''}</div>`;
}
const _gramView = VIEWS.gram;
VIEWS.gram = (arg, v) => {
  if (!arg.tab) arg.tab = cloudUser ? 'naija' : 'feed';
  const setTab = t => A(() => { ph.stack[ph.stack.length - 1].arg = {tab:t}; });
  const tabs = `<div class="ph-tabs"><button class="${arg.tab === 'naija' ? 'on' : ''}" ${setTab('naija')}>🌍 Naija</button><button class="${arg.tab === 'feed' ? 'on' : ''}" ${setTab('feed')}>🏠 Friends</button><button class="${arg.tab === 'me' ? 'on' : ''}" ${setTab('me')}>👤 Me</button></div>`;
  if (arg.tab !== 'naija') return _gramView(arg, v).replace(/<div class="ph-tabs">[\s\S]*?<\/div>/, tabs);
  const logo = `<div class="ph-hdr gram"><span>NaijaGram</span><small>Real players 🌐</small></div>`;
  if (!socialOn()) return logo + tabs + signInNote();
  if (!SOC.feedBusy && Date.now() - SOC.feedAt > 30000) loadFeed().then(() => phRefresh('gram'));
  if (!SOC.feed) return logo + tabs + '<div class="ph-pad dim">Loading posts from across Naija…</div>';
  return logo + tabs + (SOC.feed.map(postCard).join('') || '<div class="ph-pad dim">No posts yet. Be the first! Take a photo and share it from 👤 Me.</div>');
};
Object.assign(VIEWS, {
  rpost: (arg) => {
    const p = (SOC.feed || []).concat(...Object.values(SOC.userPosts).filter(Boolean)).find(x => x.id === arg.id);
    if (!p) return hdr('Post') + '<div class="ph-pad dim">Post not found.</div>';
    if (!SOC.comments[p.id] && !arg.loading){ arg.loading = true; loadComments(p.id).then(() => phRefresh('rpost')); }
    const cm = SOC.comments[p.id];
    return hdr('Post') + `<div class="ph-bottom">${postCard(p)}<div class="ph-pad">${cm ? (cm.map(c => `<div class="ph-cap"><b>${esc(c.username)}</b> ${esc(c.body)} <small class="dim">${agoTxt(c.created_at)}</small></div>`).join('') || '<small class="dim">No comments yet.</small>') : '<small class="dim">Loading comments…</small>'}</div></div>
      <div class="ph-input"><input id="phCmt" type="text" maxlength="200" placeholder="Add a comment…"><button data-send ${A(() => { const i = $('phCmt'); if (i && i.value.trim()){ addComment(p.id, i.value).then(() => phRefresh('rpost')); } })}>➤</button></div>`;
  },
  ruser: (arg) => {
    const u = SOC.users[arg.uid];
    if (!u && !arg.loading){ arg.loading = true; loadUser(arg.uid).then(() => phRefresh('ruser')); }
    if (!u) return hdr('Player') + '<div class="ph-pad dim">Loading…</div>';
    const mine = arg.uid === cloudUser.id, fol = SOC.following.has(arg.uid), posts = SOC.userPosts[arg.uid] || [];
    return hdr(`@${esc(u.username)}`) + `<div class="ph-prof">${avatar(u.username || 'P', u.user_id, true)}<div><b>${esc(u.char_name || '')}</b> <small>· Age ${u.age || '?'}</small><div class="ph-stats"><span><b>${posts.length}</b> posts</span><span><b>${(u.fcount || 0)}</b> players follow</span></div><small>${esc(u.job || '')} · ${esc(u.area || '')}</small><br><small>${esc(u.relationship || '')}${u.children ? ` · ${u.children} child${u.children > 1 ? 'ren' : ''}` : ''} · Day ${u.game_day || 1}</small></div></div>
      ${mine ? `<div class="ph-pad"><button class="ph-btn" ${A(() => { shareStory(); return false; })}>📤 Share my life story</button></div>` : `<div class="ph-pad" style="display:flex;gap:8px"><button class="ph-btn" ${A(() => { toggleFollow(arg.uid).then(() => { loadUser(arg.uid).then(() => phRefresh('ruser')); }); })}>${fol ? '✅ Following' : '➕ Follow'}</button><button class="ph-btn" ${A(() => { wave(arg.uid, '@' + u.username); })}>👋 Wave</button></div>`}
      <div class="ph-gridimg">${posts.map(p => `<div ${A(() => phGo('rpost', {id:p.id}))}><img src="${esc(p.image)}" alt=""><span>❤️ ${SOC.likes[p.id] || 0}</span></div>`).join('') || '<div class="ph-pad dim">No posts yet.</div>'}</div>`;
  },
  ranks: (arg) => {
    const cat = arg.cat || 'rich', C = RANK_CATS[cat];
    const tabs = `<div class="ph-tabs scroll">${Object.keys(RANK_CATS).map(k => `<button class="${k === cat ? 'on' : ''}" ${A(() => { ph.stack[ph.stack.length - 1].arg = {cat:k}; })}>${RANK_CATS[k].name}</button>`).join('')}</div>`;
    if (!socialOn()) return hdr('Rankings 🏆') + signInNote();
    const R = SOC.ranks[cat];
    if ((!R || Date.now() - R.at > 60000) && !arg.loading){ arg.loading = true; loadRanks(cat).then(() => { arg.loading = false; phRefresh('ranks'); }); }
    if (!R) return hdr('Rankings 🏆') + tabs + '<div class="ph-pad dim">Loading the rankings…</div>';
    const medal = i => ['🥇', '🥈', '🥉'][i] || `<b>${i + 1}</b>`;
    return hdr('Rankings 🏆', '<small>All players</small>') + tabs + `<div class="ph-list">${R.rows.map((r, i) => `<div class="ph-row${r.user_id === cloudUser.id ? ' me' : ''}" ${A(() => phGo('ruser', {uid:r.user_id}))}><span class="ph-rank">${medal(i)}</span>${avatar(r.username || 'P', r.user_id)}<div class="ph-grow"><b>${esc(r.username)}${r.user_id === cloudUser.id ? ' (you)' : ''}</b><small>${esc(r.char_name || '')} · ${esc(r.job || '')}</small></div><b>${C.fmt(r)}</b></div>`).join('') || '<div class="ph-pad dim">No players yet.</div>'}</div>
      ${R.myRank ? `<div class="ph-pad dim">You are #${R.myRank} in this ranking.</div>` : ''}
      <div class="ph-pad"><button class="ph-btn" ${A(() => { shareStory(); return false; })}>📤 Share my life story</button></div>`;
  }
});
APPS.splice(4, 0, {id:'ranks', name:'Rankings', icon:'🏆', bg:'linear-gradient(135deg,#f7c948,#d4a017)'});

/* ---------- real player panel (tap a 🌐 player in the street) ---------- */
PANELS.realPlayer = (g) => {
  const r = g.data || {}, fol = SOC.following.has(g.uid);
  return {title:`${g.name} 🌐`, sub:'A real player in your city',
    body:`<div class="kv"><b>Character</b><span>${esc(r.char_name || '')}, ${r.age || '?'}</span><b>Lives in</b><span>${esc(r.area || '')}</span><b>Occupation</b><span>${esc(r.job || '')}</span><b>Education</b><span>${esc(r.education || '')}</span><b>Relationship</b><span>${esc(r.relationship || '')}</span><b>Children</b><span>${r.children || 0}</span><b>Life</b><span>Day ${r.game_day || 1}</span></div>`,
    options:[
      opt('👋 Wave', 'They get a notification', () => { wave(g.uid, g.name); }),
      opt(fol ? '✅ Following (tap to unfollow)' : '➕ Follow', 'See their NaijaGram posts', () => { toggleFollow(g.uid).then(() => { if (panelState && panelState.kind === 'realPlayer') renderPanel(); }); return false; }, null, fol ? '' : 'cur'),
      opt('📸 View their NaijaGram', '', () => { closePanel(); openPhone('ruser', {uid:g.uid}); return false; }),
      opt('Bye 👋', '', () => { closePanel(); return false; })
    ]};
};

/* ---------- shareable life-story card ---------- */
function storyCanvas(){
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), r = publicRow();
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0b3d2a'); bg.addColorStop(1, '#06170f'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#008751'; g.fillRect(0, 0, 360, 18); g.fillStyle = '#ffffff'; g.fillRect(360, 0, 360, 18); g.fillStyle = '#008751'; g.fillRect(720, 0, 360, 18);
  g.textBaseline = 'top'; g.fillStyle = '#7dffa8'; g.font = '700 40px system-ui, sans-serif'; g.fillText('MY NAIJA LIFE 🇳🇬', 70, 70);
  g.fillStyle = '#fff'; g.font = '800 96px system-ui, sans-serif'; g.fillText(state.name, 70, 130);
  g.fillStyle = '#c9e8d6'; g.font = '500 40px system-ui, sans-serif'; g.fillText(`@${myName()} · Age ${r.age} · Day ${r.game_day}`, 70, 245);
  g.fillText(r.area, 70, 297);
  const rows = [['💼', r.job], ['🎓', r.education], ['💞', r.relationship + (r.children ? ` · ${r.children} child${r.children > 1 ? 'ren' : ''}` : '')], ['🏠', r.housing], ['💰', fmt(r.net_worth)], ['📸', `${(r.followers || 0).toLocaleString()} followers`]];
  g.font = '600 42px system-ui, sans-serif';
  rows.forEach(([i, t], k) => { const y = 390 + k * 72; g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(60, y - 12, W - 120, 62); g.fillStyle = '#fff'; g.fillText(`${i}  ${String(t).slice(0, 38)}`, 84, y); });
  const bars = [['Health', state.health, '#ff5a5a'], ['Happiness', state.happy, '#c38bff'], ['Respect', state.rep, '#5ab4ff']];
  bars.forEach(([k, v, col], i) => { const x = 70 + i * 320, y = 840; g.fillStyle = '#c9e8d6'; g.font = '600 30px system-ui, sans-serif'; g.fillText(`${k} ${Math.round(v)}`, x, y); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, y + 44, 280, 16); g.fillStyle = col; g.fillRect(x, y + 44, 280 * v / 100, 16); });
  g.fillStyle = '#7dffa8'; g.font = '700 34px system-ui, sans-serif'; g.fillText('LATEST IN MY LIFE', 70, 935);
  g.fillStyle = '#fff'; g.font = '500 32px system-ui, sans-serif';
  state.history.slice(-5).reverse().forEach((h, k) => g.fillText(`${h.i || '•'}  ${String(h.t).slice(0, 52)}`, 70, 990 + k * 50));
  g.fillStyle = '#ffd23f'; g.font = '800 40px system-ui, sans-serif'; g.fillText('Live your own Naija life, free:', 70, 1245);
  g.fillStyle = '#fff'; g.font = '600 34px system-ui, sans-serif'; g.fillText(GAME_URL().replace(/^https?:\/\//, ''), 70, 1293);
  return c;
}
async function shareStory(){
  const c = storyCanvas(), url = cloudUser ? shareUrl() : GAME_URL();
  const text = `My Naija Life 🇳🇬: ${state.name}, age ${ageNow()}, ${publicRow().job}. See my life and start yours:`;
  if (cloudUser){ try { await sb.from('players_public').upsert(publicRow()); } catch (e){} cloudLog('social', 'Shared life story'); }
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], 'my-naija-life.png', {type:'image/png'});
  try {
    if (navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], text:`${text} ${url}`}); return; }
    if (navigator.share){ await navigator.share({text, url}); return; }
  } catch (e){ if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-naija-life.png'; a.click();
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast('📤 Story card downloaded and link copied. Paste it on X or WhatsApp!', 'good'); } catch (e){ toast('📤 Story card downloaded!', 'good'); }
}

/* ---------- hooks ---------- */
const _cloudStartS = cloudStart;
cloudStart = function(){ _cloudStartS(); socialStart(); };
const _menuS = PANELS.menu;
PANELS.menu = () => {
  const r = _menuS();
  r.options.splice(2, 0, opt('Rankings 🏆', 'See the top players in Naija', () => { closePanel(); openPhone('ranks'); return false; }), opt('Share my life story 📤', 'Post your life card on X or WhatsApp', () => { shareStory(); return false; }));
  return r;
};
