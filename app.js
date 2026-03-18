// ============================================================
//  Footy Brain — app.js  v3
//  Hearts · Game attempts · Pro system · Pack opening
//  Requires data.js to be loaded first.
// ============================================================

'use strict';

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const STATE_VERSION   = 3;
const MAX_HEARTS      = 5;
const HEART_REGEN_MS  = 30 * 60 * 1000; // 30 minutes
const GAME_TARGET     = 3;   // score needed to win a prize
const PITY_THRESHOLD  = 20;  // guaranteed rare after this many attempts without one

// Pro pricing (cosmetic — real billing via app stores)
const PRO_PRICE_ANNUAL  = '£24.99';
const PRO_PRICE_MONTHLY = '£3.99';
const FREEZE_PRICE_1    = '£0.99';
const FREEZE_PRICE_3    = '£1.99';
const ATTEMPTS_PRICE    = '£0.99'; // 3 extra attempts

// ─────────────────────────────────────────────
//  FREEMIUM — what's always free
// ─────────────────────────────────────────────
// All chapters are FREE — Pro just gives XP bonuses, cosmetics, extra attempts
const FREE_CHAPTERS = null; // null = all free
const FREE_GAMES    = ['penalty', 'offside']; // free players get daily attempt on these

// ─────────────────────────────────────────────
//  DEFAULT STATE
// ─────────────────────────────────────────────
const DEFAULT_STATE = {
  version:   STATE_VERSION,
  name:      '',
  position:  '',
  xp:        0,
  streak:    0,
  lastLogin: '',

  // Progress
  completedChapters:  [],
  masteredChapters:   [],
  quizScores:         {},
  quizAttempts:       {},
  gameHighScores:     {},
  fastAnswers:        0,

  // Daily
  dailyChallengesCompleted: 0,
  lastDailyDate:            '',

  // Hearts
  hearts:          MAX_HEARTS,
  heartRegenStart: null, // timestamp when regen started

  // Game attempts: { gameKey: lastAttemptDate }
  gameAttempts:    {},
  // Extra attempts purchased today: { gameKey: count }
  extraAttempts:   {},

  // Prize / pack system
  badges:          [],
  collection:      [], // earned items: [{id, type, rarity, earnedAt}]
  activeTitle:     null,
  activeAvatar:    null,
  activeFrame:     null,
  powerUps:        {}, // { powerUpId: count }
  totalAttempts:   0,  // total game attempts ever (for pity timer)
  sinceLastRare:   0,  // attempts since last rare+ prize (pity timer)

  // Streaks & freeze
  freezesAvailable: 0,
  lastFreezeUsed:   '',

  // Pro
  isPro:            false,
  proExpiresAt:     null,  // timestamp — null = permanent, date = temporary
  proSource:        null,  // 'purchase' | 'reward_24h' | 'reward_7d' | 'code'

  // Question history (spaced repetition)
  questionHistory:  {},

  // Drills
  completedDrills:  [],

  settings: {
    darkMode:       true,
    sound:          true,
    reducedMotion:  false,
    parentPin:      null,
    monthlySpendCap: null,
    monthlySpent:    0,
    spendMonth:      '',
  },
};

let S = { ...DEFAULT_STATE };

// ─────────────────────────────────────────────
//  PERSISTENCE
// ─────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem('footybrain_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      S = { ...DEFAULT_STATE, ...parsed };
      // Migrate older saves
      if (!S.version || S.version < STATE_VERSION) {
        S.version = STATE_VERSION;
      }
    }
  } catch (e) { console.warn('State load failed'); }
}

function saveState() {
  try { localStorage.setItem('footybrain_v3', JSON.stringify(S)); }
  catch (e) { console.warn('State save failed'); }
}

function resetState() {
  const keep = { name: S.name, position: S.position, settings: { ...S.settings } };
  S = { ...DEFAULT_STATE, ...keep };
  saveState();
}

// ─────────────────────────────────────────────
//  SOUND
// ─────────────────────────────────────────────
let _audioCtx = null;
function getAudio() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
  }
  return _audioCtx;
}
function tone(freq, dur, type='sine', vol=0.13) {
  if (!S.settings.sound) return;
  const ctx = getAudio(); if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + dur);
  } catch(e) {}
}
function sfxCorrect()  { tone(523,.1); setTimeout(()=>tone(659,.14),90); }
function sfxWrong()    { tone(220,.25,'sawtooth',.09); }
function sfxLevelUp()  { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.18),i*110)); }
function sfxGoal()     { [784,880,1047].forEach((f,i)=>setTimeout(()=>tone(f,.16),i*75)); }
function sfxPack()     { [440,554,659,880].forEach((f,i)=>setTimeout(()=>tone(f,.2,'triangle',.12),i*120)); }

// ─────────────────────────────────────────────
//  CSS ANIMATIONS (injected once)
// ─────────────────────────────────────────────
(function injectAnims() {
  if (document.getElementById('fb-anims')) return;
  const s = document.createElement('style');
  s.id = 'fb-anims';
  s.textContent = `
    @keyframes floatXP {
      0%  {opacity:1;transform:translateY(0) scale(1)}
      70% {opacity:1;transform:translateY(-55px) scale(1.1)}
      100%{opacity:0;transform:translateY(-75px) scale(.9)}
    }
    @keyframes fbSlideUp {
      from{opacity:0;transform:translateY(18px)}
      to  {opacity:1;transform:translateY(0)}
    }
    @keyframes fbPop {
      0%  {transform:scale(.8);opacity:0}
      70% {transform:scale(1.04)}
      100%{transform:scale(1);opacity:1}
    }
    @keyframes fbShake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-6px)}
      40%{transform:translateX(6px)}
      60%{transform:translateX(-4px)}
      80%{transform:translateX(4px)}
    }
    @keyframes fbPackShake {
      0%,100%{transform:rotate(0) scale(1)}
      15%{transform:rotate(-4deg) scale(1.05)}
      30%{transform:rotate(4deg) scale(1.08)}
      45%{transform:rotate(-3deg) scale(1.06)}
      60%{transform:rotate(3deg) scale(1.04)}
      75%{transform:rotate(-1deg) scale(1.02)}
    }
    .fb-slide-up {animation:fbSlideUp .32s ease both}
    .fb-pop      {animation:fbPop .4s cubic-bezier(.34,1.56,.64,1) both}
    .fb-shake    {animation:fbShake .35s ease}
  `;
  document.head.appendChild(s);
})();

// ─────────────────────────────────────────────
//  HEARTS SYSTEM
// ─────────────────────────────────────────────
function getHearts() {
  // Check if regen has completed
  if (S.hearts < MAX_HEARTS && S.heartRegenStart) {
    const elapsed = Date.now() - S.heartRegenStart;
    const regained = Math.floor(elapsed / HEART_REGEN_MS);
    if (regained > 0) {
      S.hearts = Math.min(MAX_HEARTS, S.hearts + regained);
      if (S.hearts === MAX_HEARTS) S.heartRegenStart = null;
      else S.heartRegenStart += regained * HEART_REGEN_MS;
      saveState();
    }
  }
  return S.hearts;
}

function loseHeart() {
  if (hasPro()) return false; // Pro = unlimited hearts
  const h = getHearts();
  if (h <= 0) { showModal('hearts-modal'); startHeartTimer(); return true; }
  S.hearts = h - 1;
  if (S.hearts < MAX_HEARTS && !S.heartRegenStart) {
    S.heartRegenStart = Date.now();
  }
  saveState();
  updateHeartsDisplay();
  if (S.hearts === 0) { setTimeout(() => { showModal('hearts-modal'); startHeartTimer(); }, 600); }
  return false;
}

function restoreHearts(count = MAX_HEARTS) {
  S.hearts = Math.min(MAX_HEARTS, S.hearts + count);
  if (S.hearts >= MAX_HEARTS) S.heartRegenStart = null;
  saveState();
  updateHeartsDisplay();
  showToast(`❤️ Hearts restored!`);
}

function updateHeartsDisplay() {
  const h = getHearts();
  ['heartsDisplay','quizHeartsDisplay'].forEach(id => {
    const el_ = el(id);
    if (!el_) return;
    el_.querySelectorAll('.heart').forEach((heart, i) => {
      heart.classList.toggle('empty', i >= h);
    });
  });
}

let _heartTimerInterval = null;
function startHeartTimer() {
  clearInterval(_heartTimerInterval);
  function update() {
    const el_ = el('hearts-timer');
    if (!el_) return;
    if (!S.heartRegenStart) { el_.textContent = 'Full!'; return; }
    const next = S.heartRegenStart + HEART_REGEN_MS;
    const rem  = Math.max(0, next - Date.now());
    const m    = Math.floor(rem / 60000);
    const s_   = Math.floor((rem % 60000) / 1000);
    el_.textContent = `${m}:${s_.toString().padStart(2,'0')}`;
    if (rem <= 0) { getHearts(); updateHeartsDisplay(); }
  }
  update();
  _heartTimerInterval = setInterval(update, 1000);
}

// ─────────────────────────────────────────────
//  PRO SYSTEM
// ─────────────────────────────────────────────
function hasPro() {
  if (!S.isPro) return false;
  if (!S.proExpiresAt) return true; // permanent
  if (Date.now() < S.proExpiresAt) return true;
  // Expired
  S.isPro = false; S.proExpiresAt = null; S.proSource = null;
  saveState();
  return false;
}

function grantPro(durationMs, source = 'reward') {
  S.isPro = true;
  if (durationMs === null) {
    S.proExpiresAt = null; // permanent
  } else {
    const existing = (S.proExpiresAt && S.proExpiresAt > Date.now()) ? S.proExpiresAt : Date.now();
    S.proExpiresAt = existing + durationMs;
  }
  S.proSource = source;
  saveState();
  showToast(durationMs === null ? '⭐ Footy Brain Pro activated!' :
    `⭐ Pro unlocked for ${formatDuration(durationMs)}!`);
  updateXPBar();
}

function formatDuration(ms) {
  const h = ms / 3600000;
  if (h < 2) return '1 hour';
  if (h <= 25) return '24 hours';
  if (h <= 170) return '7 days';
  return 'lifetime';
}

function getProMultiplier() {
  if (hasPro()) return 2;
  if (S.streak >= 7) return 1.5;
  if (S.streak >= 3) return 1.25;
  return 1;
}

// ─────────────────────────────────────────────
//  GAME ATTEMPTS
// ─────────────────────────────────────────────
function canPlayGame(gameKey) {
  const today = new Date().toDateString();
  const lastPlayed = S.gameAttempts[gameKey];
  if (lastPlayed !== today) return true;
  // Check extra attempts
  const extras = (S.extraAttempts[gameKey] || 0);
  return extras > 0;
}

function useGameAttempt(gameKey) {
  const today = new Date().toDateString();
  const lastPlayed = S.gameAttempts[gameKey];
  if (lastPlayed === today) {
    // Use extra attempt
    if ((S.extraAttempts[gameKey] || 0) > 0) {
      S.extraAttempts[gameKey]--;
      saveState();
      return true;
    }
    return false;
  }
  S.gameAttempts[gameKey] = today;
  saveState();
  return true;
}

function getGameTimeUntilReset(gameKey) {
  const lastPlayed = S.gameAttempts[gameKey];
  const today = new Date().toDateString();
  if (lastPlayed !== today) return null;
  // Calculate time until midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24,0,0,0);
  const rem = midnight - now;
  const h = Math.floor(rem / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  return `${h}h ${m}m`;
}

// ─────────────────────────────────────────────
//  XP & LEVELS
// ─────────────────────────────────────────────
function addXP(amount) {
  const mult   = getProMultiplier();
  const actual = Math.round(amount * mult);
  if (actual <= 0) return;
  const lvBefore = getLevelFromXP(S.xp);
  S.xp += actual;
  const lvAfter = getLevelFromXP(S.xp);
  saveState();
  updateXPBar();
  spawnFloatingXP(actual, mult > 1);
  if (lvAfter > lvBefore) {
    sfxLevelUp();
    setTimeout(() => showLevelUpModal(lvAfter), 700);
  }
  checkBadges();
}

function updateXPBar() {
  const xp = S.xp;
  setEl('levelDisplay',  getLevelFromXP(xp));
  setEl('levelTitle',    getLevelTitle(xp));
  setEl('levelTitle2',   getLevelTitle(xp));
  setEl('xpDisplay',     xp.toLocaleString());
  setEl('xpToNext',      getXPToNext(xp).toLocaleString());
  setEl('streakDisplay', S.streak);
  setEl('statStreak',    S.streak);
  setEl('statChapters',  S.completedChapters.length);
  setEl('statQuizzes',   Object.keys(S.quizScores).length);
  const fill = el('xpFill');
  if (fill) fill.style.width = getLevelProgress(xp) + '%';
  // Ring
  const ring = el('xpRingCircle');
  if (ring) {
    const pct = getLevelProgress(xp) / 100;
    const circ = 131.9;
    ring.style.strokeDashoffset = circ - (pct * circ);
  }
  // Position badge
  const badge = el('positionBadge');
  if (badge) {
    const map = {
      Striker:'pill-amber', Midfielder:'pill-sky', Winger:'pill-accent',
      'Full-Back':'pill-purple', Defender:'pill-purple',
      Goalkeeper:'pill-accent', 'All-Rounder':'pill-accent'
    };
    badge.className = `pill ${map[S.position] || 'pill-accent'}`;
    badge.textContent = (hasPro() ? '⭐ ' : '') + S.position;
  }
  updateHeartsDisplay();
}

function spawnFloatingXP(amount, boosted = false) {
  const div = document.createElement('div');
  div.className = 'float-xp';
  div.textContent = `+${amount} XP${boosted ? ' ⚡' : ''}`;
  div.style.cssText += `;right:1.25rem;bottom:100px;`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1200);
}

function showLevelUpModal(level) {
  setEl('levelup-num',   `Level ${level}`);
  setEl('levelup-title', getLevelTitle(S.xp));
  showModal('levelup-modal');
  confetti({ particleCount:120, spread:70, origin:{y:.5} });
}

// ─────────────────────────────────────────────
//  STREAK
// ─────────────────────────────────────────────
function checkStreak() {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const grace     = new Date(Date.now() - 26*3600000).toDateString();

  if (S.lastLogin === today) return;

  const wasYesterday = S.lastLogin === yesterday || S.lastLogin === grace;

  if (wasYesterday) {
    S.streak++;
  } else if (!S.lastLogin) {
    S.streak = 1;
  } else {
    // Broken — check freeze
    if (S.freezesAvailable > 0) {
      S.freezesAvailable--;
      showToast('🧊 Streak freeze used! Streak saved!');
    } else {
      S.streak = 1;
    }
  }
  S.lastLogin = today;
  saveState();
  updateXPBar();
}

// ─────────────────────────────────────────────
//  BADGES
// ─────────────────────────────────────────────
function checkBadges() {
  let newEarned = false;
  getEarnedBadges(S).forEach(b => {
    if (!S.badges.includes(b.id)) {
      S.badges.push(b.id);
      newEarned = true;
      setTimeout(() => showToast(`🏅 Badge: ${b.name}!`), 500);
    }
  });
  if (newEarned) saveState();
}

// ─────────────────────────────────────────────
//  ROUTING
// ─────────────────────────────────────────────
const ALL_SCREENS = [
  'name-screen','position-screen','home-screen',
  'quiz-screen','game-screen','daily-screen',
  'prizes-screen','leaderboard-screen',
  'profile-screen','pro-screen','settings-screen',
];

let _currentScreen = '';

function showScreen(id) {
  if (_currentScreen === id) return;
  ALL_SCREENS.forEach(sid => {
    const el_ = el(sid);
    if (el_) el_.classList.toggle('hidden', sid !== id);
  });
  _currentScreen = id;

  const navScreens = ['home-screen','leaderboard-screen','profile-screen',
                      'prizes-screen','pro-screen','daily-screen'];
  el('main-nav')?.classList.toggle('hidden', !navScreens.includes(id));

  if (id === 'leaderboard-screen') renderLeaderboard();
  if (id === 'profile-screen')     renderProfile();
  if (id === 'settings-screen')    renderSettings();
  if (id === 'daily-screen')       renderDailyChallenge();
  if (id === 'prizes-screen')      renderPrizesScreen();
  if (id === 'pro-screen')         renderProScreen();
}

function setActiveNav(btnId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  el(btnId)?.classList.add('active');
}

function backToHome() {
  showScreen('home-screen');
  setActiveNav('nav-home');
  renderChapters();
  renderDailyBanner();
  renderGameGrid();
}

function showPrizesScreen()  { showScreen('prizes-screen'); }
function showProScreen()     { showScreen('pro-screen'); }

// ─────────────────────────────────────────────
//  MODALS
// ─────────────────────────────────────────────
function showModal(id)  {
  const m = el(id);
  if (m) { m.classList.add('show'); }
}
function closeModal(id) {
  const m = el(id);
  if (m) m.classList.remove('show');
}

// ─────────────────────────────────────────────
//  ONBOARDING
// ─────────────────────────────────────────────
function saveNameAndShowPosition() {
  const input = el('player-name');
  const name  = (input?.value || '').trim();
  if (!name) { showToast('Enter your name to continue ⚽'); return; }
  S.name = name; saveState();
  showScreen('position-screen');
}

function selectPosition(pos) {
  S.position = pos; saveState();
  checkStreak();
  initHomeScreen();
  showScreen('home-screen');
  setActiveNav('nav-home');
  showToast(`Welcome, ${S.name}! Train your football brain 🧠⚽`);
}

// ─────────────────────────────────────────────
//  HOME SCREEN
// ─────────────────────────────────────────────
function initHomeScreen() {
  setEl('playerNameHeader', S.name);
  updateXPBar();
  renderDailyBanner();
  renderGameGrid();
  renderChapters();
}

// ─────────────────────────────────────────────
//  DAILY BANNER
// ─────────────────────────────────────────────
function renderDailyBanner() {
  const banner = el('daily-banner');
  if (!banner) return;
  const done = S.lastDailyDate === new Date().toDateString();
  if (done) {
    banner.classList.add('done');
    banner.onclick = null;
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:.75rem;">
        <div style="font-size:1.8rem;">📅</div>
        <div style="flex:1;">
          <div style="font-weight:800;font-size:.88rem;margin-bottom:.1rem;">
            Daily Challenge Complete!
          </div>
          <div style="font-size:.7rem;color:var(--text2);">Come back tomorrow</div>
        </div>
        <span style="font-size:1.1rem;">✅</span>
      </div>`;
  } else {
    banner.classList.remove('done');
    banner.onclick = () => { showScreen('daily-screen'); setActiveNav('nav-daily'); };
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:.75rem;">
        <div style="font-size:1.8rem;animation:pulse 2s ease-in-out infinite;">🔥</div>
        <div style="flex:1;">
          <div style="font-weight:800;font-size:.88rem;margin-bottom:.1rem;">
            Daily Challenge Ready
          </div>
          <div style="font-size:.7rem;color:var(--text2);">
            5 questions · Builds your streak · Bonus XP
          </div>
        </div>
        <div style="background:var(--accent);color:#000;font-weight:900;
            font-size:.68rem;padding:.28rem .65rem;border-radius:99px;
            white-space:nowrap;flex-shrink:0;">GO →</div>
      </div>`;
  }
}

// ─────────────────────────────────────────────
//  GAME GRID
// ─────────────────────────────────────────────
function renderGameGrid() {
  const grid = el('gameGrid');
  if (!grid) return;

  const games = Object.entries(GAME_META);
  grid.innerHTML = games.map(([key, g]) => {
    const today      = new Date().toDateString();
    const used       = S.gameAttempts[key] === today;
    const extras     = S.extraAttempts[key] || 0;
    const canPlay    = !used || extras > 0 || hasPro();
    const hi         = S.gameHighScores[key] || 0;
    const timeLeft   = used ? getGameTimeUntilReset(key) : null;
    const isProGame  = !FREE_GAMES.includes(key) && !hasPro();

    let statusHtml = '', cardClass = 'game-card', onClick = '';

    if (hasPro()) {
      statusHtml = `<span class="game-status status-free">∞ PRO</span>`;
      onClick    = `onclick="showGame('${key}')"`;
    } else if (isProGame) {
      statusHtml = `<span class="game-status status-pro">⭐ PRO</span>`;
      cardClass  += ' pro-locked';
      onClick    = `onclick="showProScreen();setActiveNav('nav-pro')"`;
    } else if (used && extras === 0) {
      statusHtml = `<span class="game-status status-timer">↻ ${timeLeft}</span>`;
      cardClass  += ' used';
      onClick    = `onclick="showToast('Come back at midnight for your next attempt! ⏰')"`;
    } else {
      statusHtml = `<span class="game-status status-free">FREE TRY</span>`;
      onClick    = `onclick="showGame('${key}')"`;
    }

    return `
      <div class="${cardClass}" ${onClick}>
        ${statusHtml}
        <span class="game-emoji">${g.emoji}</span>
        <div style="font-weight:700;font-size:.82rem;">${g.name}</div>
        <div style="font-size:.67rem;color:var(--text2);">
          ${used && !hasPro() ? `Best: ${hi}/${g.max}` : `Score ${GAME_TARGET}+ to win`}
        </div>
        ${extras > 0 ? `<div style="font-size:.62rem;color:var(--accent);">${extras} extra left</div>` : ''}
      </div>`;
  }).join('');
}

// ─────────────────────────────────────────────
//  CHAPTER LIST
// ─────────────────────────────────────────────
function renderChapters() {
  const list = el('chapterList');
  if (!list) return;

  const chapters = getChaptersForPosition(S.position);
  const cats     = getCategoriesForPosition(S.position);
  list.innerHTML  = '';

  cats.forEach(cat => {
    const catChs = chapters.filter(c => c.cat === cat);
    const wrap   = document.createElement('div');
    wrap.style.marginBottom = '1.25rem';
    wrap.innerHTML = `<div class="label" style="margin-bottom:.4rem;padding-left:.1rem;">${cat}</div>`;

    catChs.forEach((ch, i) => {
      const done     = S.completedChapters.includes(ch.id);
      const mastered = (S.masteredChapters || []).includes(ch.id);
      const locked   = i > 0 && !S.completedChapters.includes(catChs[i-1].id) && !done;
      const best     = S.quizScores[ch.id];
      const pct      = best !== undefined ? Math.round(best / ch.questions.length * 100) : null;
      const attempts = S.quizAttempts[ch.id] || 0;

      const card = document.createElement('div');
      card.className = `ch-card${locked?' locked':''}${done?' done':''}`;
      card.style.cssText = `margin-bottom:.45rem;animation:fbSlideUp .3s ease ${i*.05}s both;`;

      const rightIcon = mastered ? '💯' : done ? '✅' :
        locked ? `<span style="opacity:.35;font-size:.85rem;">🔒</span>` :
        `<span style="font-size:.75rem;color:var(--accent);font-weight:800;">GO→</span>`;

      // Progress bar colour
      const barColor = pct === 100 ? 'var(--accent)' :
        pct >= 60 ? 'var(--sky)' : 'var(--amber)';

      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:.8rem;">
          <div style="font-size:1.9rem;min-width:2.1rem;text-align:center;">${ch.emoji}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:.9rem;white-space:nowrap;
                overflow:hidden;text-overflow:ellipsis;margin-bottom:.12rem;">
              ${ch.title}
            </div>
            <div style="font-size:.7rem;color:var(--text2);">
              ${ch.questions.length} questions · ${ch.xp} XP
              ${attempts > 0 ? ` · ${attempts} attempt${attempts>1?'s':''}` : ''}
            </div>
            ${pct !== null ? `
              <div style="margin-top:.35rem;">
                <div class="xp-track" style="height:3px;">
                  <div style="height:100%;width:${pct}%;border-radius:99px;
                    background:${barColor};transition:width .5s ease;"></div>
                </div>
                <div style="font-size:.67rem;margin-top:.15rem;color:${pct===100?'var(--accent)':'var(--text2)'};">
                  Best: ${best}/${ch.questions.length} (${pct}%)
                </div>
              </div>` : ''}
          </div>
          <div style="min-width:1.75rem;text-align:right;">${rightIcon}</div>
        </div>`;

      if (!locked) card.addEventListener('click', () => startQuiz(ch.id));
      wrap.appendChild(card);
    });
    list.appendChild(wrap);
  });
}

// ─────────────────────────────────────────────
//  QUIZ ENGINE
// ─────────────────────────────────────────────
let QZ = {
  chapter:null, questions:[], index:0, score:0,
  startTime:0, sessionFast:0, isDaily:false,
};

function startQuiz(chapterId) {
  // Check hearts
  if (getHearts() <= 0 && !hasPro()) {
    showModal('hearts-modal'); startHeartTimer(); return;
  }

  const ch = getChapterById(chapterId);
  if (!ch) return;

  const hist    = S.questionHistory || {};
  const ordered = [...ch.questions].sort((a, b) => {
    const ki = `${chapterId}_${ch.questions.indexOf(a)}`;
    const kj = `${chapterId}_${ch.questions.indexOf(b)}`;
    const hi = hist[ki], hj = hist[kj];
    const si = hi ? hi.correct / (hi.correct + hi.incorrect) : -1;
    const sj = hj ? hj.correct / (hj.correct + hj.incorrect) : -1;
    return si - sj;
  });
  const shuffled = ordered.map(q => shuffleQuestion(q));

  QZ = { chapter:ch, questions:shuffled, index:0, score:0,
         startTime:0, sessionFast:0, isDaily:false };

  setEl('quizChapterTitle', `${ch.emoji} ${ch.title}`);
  setEl('qTotal', ch.questions.length);
  updateHeartsDisplay();
  showScreen('quiz-screen');
  renderQuestion();
}

function startDailyQuiz() {
  const qs = getDailyQuestions(5);
  QZ = { chapter:null, questions:qs, index:0, score:0,
         startTime:0, sessionFast:0, isDaily:true };
  setEl('quizChapterTitle', '📅 Daily Challenge');
  setEl('qTotal', qs.length);
  showScreen('quiz-screen');
  renderQuestion();
}

function renderQuestion() {
  const { questions, index } = QZ;
  const q = questions[index];
  if (!q) { finishQuiz(); return; }

  QZ.startTime = Date.now();
  const total = questions.length;

  setEl('qNum', index + 1);
  const prog = el('quizProgress');
  if (prog) prog.style.width = Math.round(index / total * 100) + '%';
  setEl('qXPEarn', QZ.isDaily ? '50' : (QZ.chapter?.xp || 10));

  const diffLabels = ['','🟢 Beginner','🔵 Developing','🟠 Pro','🔴 Elite'];
  const diff = q.difficulty ? (diffLabels[q.difficulty] || '') : '';

  const area = el('quiz-area');
  if (!area) return;

  area.innerHTML = `
    ${diff ? `<div style="margin-bottom:.55rem;">
      <span class="pill ${
        q.difficulty===1?'pill-accent':q.difficulty===2?'pill-sky':
        q.difficulty===3?'pill-amber':'pill-rose'}">${diff}</span>
    </div>` : ''}
    <div class="glass fb-slide-up" style="padding:1.15rem;margin-bottom:.85rem;">
      <div style="font-size:1rem;font-weight:700;line-height:1.5;
          letter-spacing:-.01em;">${q.q}</div>
    </div>
    <div id="q-opts" style="display:flex;flex-direction:column;gap:.48rem;">
      ${q.opts.map((opt, i) => `
        <button class="q-opt" id="qo-${i}" onclick="selectAnswer(${i})">
          <span class="q-letter">${String.fromCharCode(65+i)}</span>
          ${opt}
        </button>`).join('')}
    </div>
    <div id="q-feedback" style="margin-top:.8rem;"></div>
    <div id="q-next"     style="margin-top:.6rem;"></div>`;
}

function selectAnswer(idx) {
  const { questions, index, chapter } = QZ;
  const q = questions[index];
  if (!q) return;

  document.querySelectorAll('.q-opt').forEach(b => b.disabled = true);

  const correct = idx === q.a;
  const elapsed = (Date.now() - QZ.startTime) / 1000;
  const fast    = elapsed < 4 && correct;

  el(`qo-${idx}`)?.classList.add(correct ? 'correct' : 'wrong');
  if (!correct) {
    el(`qo-${q.a}`)?.classList.add('correct');
    loseHeart();
  }

  correct ? sfxCorrect() : sfxWrong();
  if (correct) QZ.score++;
  if (fast)    QZ.sessionFast++;

  // Spaced repetition
  if (chapter) {
    const key = `${chapter.id}_${questions.indexOf(q)}`;
    if (!S.questionHistory) S.questionHistory = {};
    if (!S.questionHistory[key]) S.questionHistory[key] = { correct:0, incorrect:0 };
    S.questionHistory[key][correct ? 'correct' : 'incorrect']++;
  }

  const fb = el('q-feedback');
  if (fb) fb.innerHTML = `
    <div class="fb-slide-up" style="padding:.9rem;
        background:${correct?'rgba(184,255,87,.07)':'rgba(255,94,138,.07)'};
        border:1px solid ${correct?'rgba(184,255,87,.2)':'rgba(255,94,138,.2)'};
        border-radius:var(--r-sm);">
      <div style="font-weight:700;font-size:.82rem;margin-bottom:.25rem;
          color:${correct?'var(--accent)':'var(--rose)'};">
        ${correct ? '✅ Correct!' : '❌ Not quite...'}
        ${fast ? '<span style="color:var(--amber);margin-left:.3rem;">⚡ Fast!</span>' : ''}
      </div>
      <div style="font-size:.82rem;color:var(--text2);line-height:1.5;">${q.exp}</div>
    </div>`;

  const isLast = index >= questions.length - 1;
  const nextEl = el('q-next');
  if (nextEl) nextEl.innerHTML = `
    <button class="btn btn-accent fb-slide-up" style="width:100%;"
      onclick="${isLast ? 'finishQuiz()' : 'nextQuestion()'}">
      ${isLast ? 'See Results 🏆' : 'Next →'}
    </button>`;
}

function nextQuestion() {
  // Check hearts before continuing
  if (getHearts() <= 0 && !hasPro()) {
    showModal('hearts-modal'); startHeartTimer(); return;
  }
  QZ.index++;
  renderQuestion();
}

function finishQuiz() {
  const { chapter, questions, score, sessionFast, isDaily } = QZ;
  const total = questions.length;
  const pct   = Math.round(score / total * 100);

  if (isDaily) {
    S.dailyChallengesCompleted = (S.dailyChallengesCompleted || 0) + 1;
    S.lastDailyDate = new Date().toDateString();
  } else if (chapter) {
    const prev = S.quizScores[chapter.id] || 0;
    if (score > prev) S.quizScores[chapter.id] = score;
    S.quizAttempts[chapter.id] = (S.quizAttempts[chapter.id] || 0) + 1;
    if (pct >= 60  && !S.completedChapters.includes(chapter.id))
      S.completedChapters.push(chapter.id);
    if (pct === 100) {
      if (!S.masteredChapters) S.masteredChapters = [];
      if (!S.masteredChapters.includes(chapter.id))
        S.masteredChapters.push(chapter.id);
    }
  }
  S.fastAnswers = (S.fastAnswers || 0) + sessionFast;
  saveState(); checkBadges();

  const baseXP   = isDaily ? 50 : (chapter?.xp || 20);
  const earnedXP = Math.round(baseXP * (score / total));
  const bonusXP  = pct === 100 ? Math.round(baseXP * 0.5) : 0;
  addXP(earnedXP + bonusXP);

  if (pct === 100) { confetti({particleCount:160,spread:85,origin:{y:.55}}); sfxGoal(); }

  const prog = el('quizProgress');
  if (prog) prog.style.width = '100%';
  setEl('qNum', total);

  const emoji = pct===100?'🏆':pct>=80?'⭐':pct>=60?'👍':'💪';
  const msg   = pct===100?'PERFECT!':pct>=80?'GREAT WORK!':pct>=60?'PASSED!':'KEEP GOING!';
  const mult  = getProMultiplier();
  const area  = el('quiz-area');
  if (!area) return;

  area.innerHTML = `
    <div style="text-align:center;padding:1rem 0;" class="fb-slide-up">
      <div style="font-size:4.5rem;margin-bottom:.5rem;">${emoji}</div>
      <h2 class="display" style="font-size:2.8rem;line-height:1;
          color:${pct>=60?'var(--accent)':'var(--amber)'};">${score}/${total}</h2>
      <div class="display" style="font-size:1.3rem;color:var(--text2);
          margin-bottom:.85rem;">${msg}</div>

      <div style="display:flex;gap:.5rem;justify-content:center;
          flex-wrap:wrap;margin-bottom:1.25rem;">
        <div class="glass-bright" style="padding:.5rem .9rem;text-align:center;border-radius:var(--r-sm);">
          <div style="font-weight:900;color:var(--accent);font-size:1rem;">
            +${earnedXP + bonusXP} XP
          </div>
          <div class="label">Earned</div>
        </div>
        ${mult > 1 ? `<div class="glass-bright" style="padding:.5rem .9rem;text-align:center;border-radius:var(--r-sm);">
          <div style="font-weight:900;color:var(--amber);font-size:1rem;">${mult}×</div>
          <div class="label">${hasPro()?'Pro boost':'Streak'}</div>
        </div>` : ''}
        ${bonusXP > 0 ? `<div class="glass-bright" style="padding:.5rem .9rem;text-align:center;border-radius:var(--r-sm);">
          <div style="font-weight:900;color:var(--purple);font-size:1rem;">+${bonusXP}</div>
          <div class="label">Perfect</div>
        </div>` : ''}
      </div>

      ${pct < 60 ? `<p style="color:var(--amber);font-size:.82rem;margin-bottom:1rem;">
        Score 60%+ to unlock the next chapter!</p>` : ''}

      <div style="display:flex;flex-direction:column;gap:.55rem;">
        ${chapter ? `<button class="btn btn-accent" style="width:100%;"
          onclick="startQuiz('${chapter.id}')">
          ${pct===100?'Replay 🔁':'Retry 💪'}
        </button>` : ''}
        <button class="btn btn-ghost" style="width:100%;" onclick="backToHome()">
          Back to Academy 🏠
        </button>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
//  DAILY CHALLENGE SCREEN
// ─────────────────────────────────────────────
function renderDailyChallenge() {
  const today = new Date().toDateString();
  const done  = S.lastDailyDate === today;
  const cont  = el('daily-content');
  if (!cont) return;

  if (done) {
    cont.innerHTML = `
      <div style="text-align:center;padding:2rem 1rem;">
        <div style="font-size:3.5rem;margin-bottom:.6rem;">✅</div>
        <h2 class="display" style="font-size:2rem;color:var(--accent);">All Done!</h2>
        <p style="color:var(--text2);margin:.5rem 0 1.5rem;font-size:.85rem;">
          You've completed today's challenge.<br>Come back tomorrow!
        </p>
        <div class="glass-bright" style="padding:1rem;margin-bottom:1.5rem;text-align:center;">
          <div class="label" style="margin-bottom:.2rem;">Current streak</div>
          <div class="display" style="font-size:2.5rem;color:var(--amber);">
            ${S.streak} 🔥
          </div>
        </div>
        <button class="btn btn-ghost" style="width:100%;" onclick="backToHome()">
          Back to Academy
        </button>
      </div>`;
    return;
  }

  const mult = getProMultiplier();
  cont.innerHTML = `
    <div style="text-align:center;padding:.5rem 0 1.5rem;">
      <div style="font-size:3rem;margin-bottom:.4rem;
          animation:pulse 1.5s ease-in-out infinite;">🔥</div>
      <h2 class="display" style="font-size:2rem;color:var(--accent);margin-bottom:.3rem;">
        DAILY CHALLENGE
      </h2>
      <p style="color:var(--text2);font-size:.82rem;line-height:1.55;margin:.3rem 0 1.1rem;">
        5 questions from across the curriculum<br>
        <strong style="color:var(--text);">Streak multiplier active!</strong>
      </p>
      <div style="display:flex;gap:.55rem;justify-content:center;margin-bottom:1.25rem;
          flex-wrap:wrap;">
        <div class="glass" style="padding:.55rem 1rem;text-align:center;border-radius:var(--r-sm);">
          <div style="font-weight:900;color:var(--accent);">50 XP</div>
          <div class="label">Base</div>
        </div>
        <div class="glass" style="padding:.55rem 1rem;text-align:center;border-radius:var(--r-sm);">
          <div style="font-weight:900;color:var(--amber);">${S.streak} 🔥</div>
          <div class="label">Streak</div>
        </div>
        <div class="glass" style="padding:.55rem 1rem;text-align:center;border-radius:var(--r-sm);">
          <div style="font-weight:900;color:var(--purple);">${mult}×</div>
          <div class="label">Multiplier</div>
        </div>
      </div>
      <button class="btn btn-accent" style="width:100%;font-size:1rem;padding:.95rem;"
        onclick="startDailyQuiz()">Start Challenge →</button>
      <br><br>
      <button class="btn btn-ghost" style="width:100%;" onclick="backToHome()">
        Maybe Later
      </button>
    </div>`;
}

// ─────────────────────────────────────────────
//  LEADERBOARD
// ─────────────────────────────────────────────
function renderLeaderboard() {
  const cont = el('lbContent');
  if (!cont) return;

  cont.innerHTML = `
    <div class="glass fb-slide-up" style="padding:1.25rem;margin-bottom:.85rem;
        text-align:center;">
      <div class="display" style="font-size:2.2rem;color:var(--accent);line-height:1;">
        Level ${getLevelFromXP(S.xp)}
      </div>
      <div style="color:var(--text2);font-size:.82rem;margin-bottom:.65rem;">
        ${getLevelTitle(S.xp)}
      </div>
      <div class="xp-track">
        <div class="xp-fill" style="width:${getLevelProgress(S.xp)}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;
          font-size:.65rem;color:var(--text3);margin-top:.28rem;">
        <span>${S.xp.toLocaleString()} XP</span>
        <span>${getXPToNext(S.xp).toLocaleString()} to next</span>
      </div>
    </div>

    <div class="label" style="margin-bottom:.5rem;">🎮 GAME HIGH SCORES</div>
    <div style="margin-bottom:1.1rem;">
      ${Object.entries(GAME_META).map(([key, g]) => {
        const hi  = S.gameHighScores[key] || 0;
        const pct = Math.round(hi / g.max * 100);
        return `
          <div style="display:flex;align-items:center;gap:.7rem;padding:.65rem .8rem;
              background:var(--surface);border:1px solid var(--border);
              border-radius:var(--r-sm);margin-bottom:.4rem;">
            <div style="font-size:1.3rem;">${g.emoji}</div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:.82rem;margin-bottom:.28rem;">
                ${g.name}
              </div>
              <div class="xp-track" style="height:3px;">
                <div style="height:100%;width:${pct}%;border-radius:99px;
                  background:${pct===100?'var(--accent)':pct>=60?'var(--sky)':'var(--amber)'};
                  transition:width .5s;"></div>
              </div>
            </div>
            <div style="font-weight:900;font-size:.85rem;
                color:${hi>=g.max?'var(--accent)':'var(--text)'};">
              ${hi}/${g.max}
            </div>
          </div>`;
      }).join('')}
    </div>

    <div class="label" style="margin-bottom:.5rem;">📚 QUIZ SCORES</div>
    ${Object.keys(S.quizScores).length === 0
      ? `<p style="color:var(--text2);font-size:.82rem;">
           Complete quizzes to see your scores here!</p>`
      : getChaptersForPosition(S.position)
          .filter(ch => S.quizScores[ch.id] !== undefined)
          .map(ch => {
            const sc  = S.quizScores[ch.id];
            const pct = Math.round(sc / ch.questions.length * 100);
            return `
              <div style="display:flex;align-items:center;gap:.65rem;
                  padding:.6rem .8rem;background:var(--surface);
                  border:1px solid var(--border);border-radius:var(--r-sm);
                  margin-bottom:.38rem;">
                <div style="font-size:1.15rem;">${ch.emoji}</div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:.82rem;margin-bottom:.25rem;">
                    ${ch.title}
                  </div>
                  <div class="xp-track" style="height:2px;">
                    <div style="height:100%;width:${pct}%;border-radius:99px;
                      background:${pct===100?'var(--accent)':'var(--sky)'};"></div>
                  </div>
                </div>
                <div style="font-size:.8rem;font-weight:700;
                    color:${pct===100?'var(--accent)':'var(--text)'};">
                  ${sc}/${ch.questions.length}
                </div>
              </div>`;
          }).join('')
    }`;
}

// ─────────────────────────────────────────────
//  PROFILE
// ─────────────────────────────────────────────
function renderProfile() {
  const cont = el('profileContent');
  if (!cont) return;

  const posEmojis = {
    Striker:'⚡', Midfielder:'🎯', Winger:'💨', 'Full-Back':'🏃',
    Defender:'🛡️', Goalkeeper:'🧤', 'All-Rounder':'⚽',
  };
  const earned = getEarnedBadges(S);
  const activeTitle = S.activeTitle || null;

  cont.innerHTML = `
    <div class="glass fb-slide-up" style="padding:1.5rem;margin-bottom:.85rem;
        text-align:center;">
      <div style="font-size:4.5rem;margin-bottom:.4rem;">${posEmojis[S.position]||'⚽'}</div>
      <h2 class="display" style="font-size:1.9rem;line-height:1;">${S.name}</h2>
      ${activeTitle ? `<div style="font-size:.78rem;color:var(--purple);margin:.2rem 0;">"${activeTitle}"</div>` : ''}
      <div style="margin:.3rem 0 .6rem;">
        <span class="pill pill-amber">${S.position}</span>
        ${hasPro() ? `<span class="pill pill-legendary" style="margin-left:.35rem;">⭐ Pro</span>` : ''}
      </div>
      <div class="display" style="font-size:1.5rem;color:var(--accent);margin-bottom:.2rem;">
        Level ${getLevelFromXP(S.xp)} — ${getLevelTitle(S.xp)}
      </div>
      <div class="xp-track" style="margin-top:.65rem;">
        <div class="xp-fill" style="width:${getLevelProgress(S.xp)}%"></div>
      </div>
      <div style="font-size:.68rem;color:var(--text3);margin-top:.28rem;">
        ${S.xp.toLocaleString()} XP · ${getXPToNext(S.xp).toLocaleString()} to Level ${getLevelFromXP(S.xp)+1}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;
        margin-bottom:.85rem;">
      ${[
        ['🔥',S.streak,'Streak'],
        ['📚',S.completedChapters.length,'Chapters'],
        ['📝',Object.keys(S.quizScores).length,'Quizzes'],
        ['💯',(S.masteredChapters||[]).length,'Mastered'],
        ['📅',S.dailyChallengesCompleted||0,'Dailies'],
        ['⚡',S.fastAnswers||0,'Fast Ans.'],
      ].map(([e,v,l])=>`
        <div class="stat-card" style="padding:.65rem .4rem;">
          <div style="font-size:1.15rem;">${e}</div>
          <div class="display" style="font-size:1.5rem;color:var(--accent);">${v}</div>
          <div class="label" style="margin-top:.1rem;">${l}</div>
        </div>`).join('')}
    </div>

    <div class="label" style="margin-bottom:.5rem;">
      🏅 BADGES (${earned.length}/${BADGES.length})
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.4rem;
        margin-bottom:.85rem;">
      ${BADGES.map(b => {
        const got = earned.some(e => e.id === b.id);
        return `
          <div style="display:flex;align-items:center;gap:.55rem;padding:.65rem;
              background:var(--surface);border:1px solid var(--border);
              border-radius:var(--r-sm);opacity:${got?1:.3};transition:opacity .3s;">
            <span style="font-size:1.35rem;${got?'':'filter:grayscale(1)'}">${b.emoji}</span>
            <div>
              <div style="font-weight:700;font-size:.77rem;">${b.name}</div>
              <div style="font-size:.67rem;color:var(--text2);">${b.desc}</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

// ─────────────────────────────────────────────
//  PRIZES / COLLECTION SCREEN
// ─────────────────────────────────────────────
function renderPrizesScreen() {
  const cont = el('prizes-content');
  if (!cont || typeof PACK_SYSTEM === 'undefined') return;

  const collection = S.collection || [];
  const byType = {};
  collection.forEach(item => {
    if (!byType[item.type]) byType[item.type] = [];
    byType[item.type].push(item);
  });

  cont.innerHTML = `
    <div class="glass fb-slide-up" style="padding:1rem;margin-bottom:.85rem;
        text-align:center;">
      <div class="display" style="font-size:1.5rem;color:var(--legendary);">
        ${collection.length} Items Collected
      </div>
      <div style="font-size:.75rem;color:var(--text2);margin-top:.2rem;">
        Win more by scoring ${GAME_TARGET}+ in daily games
      </div>
    </div>

    ${collection.length === 0 ? `
      <div style="text-align:center;padding:2rem 1rem;">
        <div style="font-size:3rem;margin-bottom:.75rem;">📦</div>
        <div style="font-weight:700;margin-bottom:.35rem;">No items yet!</div>
        <div style="color:var(--text2);font-size:.82rem;margin-bottom:1.25rem;">
          Score ${GAME_TARGET}+ in a daily game to win your first pack
        </div>
        <button class="btn btn-accent" style="width:100%;"
          onclick="backToHome()">Play Games →</button>
      </div>` :

      Object.entries(byType).map(([type, items]) => `
        <div class="label" style="margin-bottom:.5rem;">
          ${type.toUpperCase()} (${items.length})
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);
            gap:.55rem;margin-bottom:1rem;">
          ${items.map(item => {
            const def = getItemDef(item.id);
            const rarityClass = `pill-${item.rarity || 'common'}`;
            return `
              <div class="pack pack-${item.rarity||'common'}"
                style="padding:.9rem;border-radius:var(--r);">
                <div style="font-size:2rem;margin-bottom:.3rem;">${def?.emoji||'📦'}</div>
                <div style="font-weight:700;font-size:.78rem;margin-bottom:.2rem;">
                  ${def?.name||item.id}
                </div>
                <span class="pill ${rarityClass}" style="font-size:.6rem;">
                  ${item.rarity||'common'}
                </span>
              </div>`;
          }).join('')}
        </div>`
      ).join('')
    }`;
}

// ─────────────────────────────────────────────
//  PRO SCREEN
// ─────────────────────────────────────────────
function renderProScreen() {
  const cont = el('proContent');
  if (!cont) return;

  if (hasPro()) {
    const expiry = S.proExpiresAt;
    cont.innerHTML = `
      <div style="text-align:center;padding:1.5rem 0;">
        <div style="font-size:4rem;margin-bottom:.5rem;">⭐</div>
        <h2 class="display" style="font-size:2.5rem;
            background:linear-gradient(135deg,var(--legendary),var(--amber));
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;
            background-clip:text;margin-bottom:.3rem;">
          PRO ACTIVE!
        </h2>
        <p style="color:var(--text2);font-size:.85rem;margin-bottom:1rem;">
          ${expiry ? `Expires ${new Date(expiry).toLocaleDateString('en-GB')}` : 'Lifetime access'}
        </p>
        <div style="display:flex;flex-direction:column;gap:.5rem;">
          ${[
            ['⚡','Double XP on everything','Active'],
            ['🧊','Weekly streak freeze','Active'],
            ['♾️','Unlimited game rounds','Active'],
            ['🏆','Pro leaderboard','Active'],
            ['🎨','Exclusive avatars','Active'],
          ].map(([e,n,s])=>`
            <div style="display:flex;align-items:center;gap:.65rem;padding:.7rem .9rem;
                background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.2);
                border-radius:var(--r-sm);">
              <span>${e}</span>
              <span style="font-weight:700;font-size:.85rem;flex:1;">${n}</span>
              <span class="pill pill-accent" style="font-size:.65rem;">${s}</span>
            </div>`).join('')}
        </div>
      </div>`;
    return;
  }

  cont.innerHTML = `
    <div style="text-align:center;padding:.5rem 0 1.5rem;">
      <div style="font-size:3.5rem;margin-bottom:.5rem;">🏆</div>
      <h2 class="display" style="font-size:2.5rem;
          background:linear-gradient(135deg,var(--legendary),var(--amber));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;margin-bottom:.25rem;">
        UPGRADE YOUR GAME
      </h2>
      <p style="color:var(--text2);font-size:.82rem;line-height:1.55;margin-bottom:1.25rem;">
        Everything stays free — Pro is the upgrade.<br>
        <strong style="color:var(--text);">Lock in sparkle, not learning.</strong>
      </p>
    </div>

    <!-- Pricing -->
    <div style="display:flex;background:var(--surface2);border:1px solid var(--border2);
        border-radius:var(--r-sm);padding:.28rem;gap:.28rem;margin-bottom:.85rem;">
      <button id="btn-annual" class="btn btn-accent" style="flex:1;font-size:.78rem;
          padding:.55rem;" onclick="switchProPricing('annual')">
        Annual — Save 44%
      </button>
      <button id="btn-monthly" class="btn btn-ghost" style="flex:1;font-size:.78rem;
          padding:.55rem;" onclick="switchProPricing('monthly')">
        Monthly
      </button>
    </div>

    <div class="glass-bright" style="padding:1.35rem;text-align:center;
        margin-bottom:.85rem;border-color:rgba(251,191,36,.3);">
      <div class="display" style="font-size:3.5rem;
          background:linear-gradient(135deg,var(--legendary),var(--amber));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;line-height:1;" id="pro-price">${PRO_PRICE_ANNUAL}</div>
      <div style="color:var(--text2);font-size:.78rem;margin:.2rem 0 .5rem;"
        id="pro-period">per year · just 48p a week</div>
      <div class="pill pill-accent" id="pro-save">💰 Save £17.89 vs monthly</div>
      <div style="font-size:.72rem;color:var(--text2);margin-top:.5rem;">
        🎁 7-day free trial · Cancel any time
      </div>
    </div>

    <!-- Features -->
    <div style="margin-bottom:.85rem;">
      ${[
        ['🧊','Weekly Streak Freeze','Miss a day? Streak automatically saved.','MOST POPULAR'],
        ['⚡','Double XP — Always','2× XP on every quiz, game and drill.','LEVEL UP FASTER'],
        ['♾️','Unlimited Game Rounds','Free = 1 attempt. Pro = play all day.','PLAY MORE'],
        ['🏆','Pro Leaderboard','Compete on the Pro-only global board.','COMPETE'],
        ['🎨','Exclusive Avatars','Animated Pro-only characters and frames.','STAND OUT'],
        ['📊','Parent Dashboard','Weekly email showing your progress.','FOR PARENTS'],
        ['🎯','3× Daily Game Attempts','Free gets 1. Pro gets 3 per game per day.','MORE PRIZES'],
      ].map(([e,n,d,tag])=>`
        <div style="display:flex;align-items:flex-start;gap:.65rem;padding:.7rem .85rem;
            background:var(--surface);border:1px solid var(--border);
            border-radius:var(--r-sm);margin-bottom:.4rem;
            transition:background .15s;"
          onmouseover="this.style.background='var(--surface2)'"
          onmouseout="this.style.background='var(--surface)'">
          <span style="font-size:1.5rem;margin-top:.05rem;">${e}</span>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:.85rem;margin-bottom:.12rem;">${n}</div>
            <div style="font-size:.75rem;color:var(--text2);">${d}</div>
          </div>
          <span class="pill pill-amber" style="font-size:.6rem;flex-shrink:0;
              margin-top:.1rem;">${tag}</span>
        </div>`).join('')}
    </div>

    <!-- CTA -->
    <button class="btn btn-accent" style="width:100%;font-size:.98rem;padding:1rem;
        margin-bottom:.55rem;position:relative;overflow:hidden;"
      onclick="showToast('Trial starting! (Connect to payment provider to activate) ⭐')">
      Start Free 7-Day Trial →
      <span style="position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);
          animation:shimmer 2.5s linear infinite;pointer-events:none;"></span>
    </button>
    <button class="btn btn-ghost" style="width:100%;font-size:.82rem;"
      onclick="backToHome()">Keep Free Account</button>
    <div style="text-align:center;margin-top:.75rem;font-size:.68rem;color:var(--text3);
        line-height:1.6;">
      🔒 Cancel any time · Billed via Apple / Google<br>
      Prices in GBP · Parental consent required for under-13
    </div>

    <!-- Streak freeze standalone -->
    <div style="margin-top:1.5rem;">
      <div class="label" style="margin-bottom:.55rem;">🧊 STREAK FREEZES</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.55rem;">
        <div class="glass" style="padding:.9rem;text-align:center;cursor:pointer;"
          onclick="showToast('1 Freeze: ${FREEZE_PRICE_1} — connect to payment provider')">
          <div style="font-size:1.5rem;margin-bottom:.3rem;">🧊</div>
          <div style="font-weight:700;font-size:.85rem;">1 Freeze</div>
          <div style="color:var(--text2);font-size:.72rem;margin:.1rem 0 .45rem;">
            Save your streak once
          </div>
          <div class="display" style="font-size:1.3rem;color:var(--amber);">
            ${FREEZE_PRICE_1}
          </div>
        </div>
        <div class="glass-bright" style="padding:.9rem;text-align:center;cursor:pointer;
            border-color:rgba(255,182,39,.3);position:relative;"
          onclick="showToast('3 Freezes: ${FREEZE_PRICE_3} — connect to payment provider')">
          <div style="position:absolute;top:-8px;right:8px;background:var(--amber);
              color:#000;font-size:.6rem;font-weight:900;padding:.15rem .45rem;
              border-radius:99px;">BEST VALUE</div>
          <div style="font-size:1.5rem;margin-bottom:.3rem;">🧊🧊🧊</div>
          <div style="font-weight:700;font-size:.85rem;">3 Freezes</div>
          <div style="color:var(--text2);font-size:.72rem;margin:.1rem 0 .45rem;">
            Save it three times
          </div>
          <div class="display" style="font-size:1.3rem;color:var(--amber);">
            ${FREEZE_PRICE_3}
          </div>
        </div>
      </div>
    </div>

    <!-- Extra attempts -->
    <div style="margin-top:1rem;">
      <div class="label" style="margin-bottom:.55rem;">🎮 EXTRA GAME ATTEMPTS</div>
      <div class="glass" style="padding:.9rem;display:flex;align-items:center;gap:.75rem;
          cursor:pointer;"
        onclick="showToast('3 Extra Attempts: ${ATTEMPTS_PRICE} — connect to payment provider')">
        <div style="font-size:1.8rem;">🎮</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:.88rem;">3 More Attempts Today</div>
          <div style="font-size:.73rem;color:var(--text2);">More goes = more prize spins</div>
        </div>
        <div class="display" style="font-size:1.4rem;color:var(--amber);">
          ${ATTEMPTS_PRICE}
        </div>
      </div>
    </div>

    <div style="height:1rem;"></div>`;
}

let _proAnnual = true;
function switchProPricing(type) {
  _proAnnual = type === 'annual';
  const annual = el('btn-annual'), monthly = el('btn-monthly');
  const price  = el('pro-price'), period = el('pro-period'), save = el('pro-save');
  if (_proAnnual) {
    annual?.classList.replace('btn-ghost','btn-accent');
    monthly?.classList.replace('btn-accent','btn-ghost');
    if (price)  price.textContent  = PRO_PRICE_ANNUAL;
    if (period) period.textContent = 'per year · just 48p a week';
    if (save)   { save.textContent = '💰 Save £17.89 vs monthly'; save.style.display='inline-flex'; }
  } else {
    monthly?.classList.replace('btn-ghost','btn-accent');
    annual?.classList.replace('btn-accent','btn-ghost');
    if (price)  price.textContent  = PRO_PRICE_MONTHLY;
    if (period) period.textContent = 'per month';
    if (save)   save.style.display = 'none';
  }
}

// ─────────────────────────────────────────────
//  SETTINGS
// ─────────────────────────────────────────────
function renderSettings() {
  const cont = el('settingsContent');
  if (!cont) return;

  cont.innerHTML = `
    <div class="glass" style="padding:1rem;margin-bottom:.65rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-weight:700;font-size:.9rem;">Light Mode</div>
          <div style="font-size:.75rem;color:var(--text2);">Switch to light theme</div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${!S.settings.darkMode?'checked':''}
            onchange="toggleTheme(this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="glass" style="padding:1rem;margin-bottom:.65rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-weight:700;font-size:.9rem;">Sound Effects</div>
          <div style="font-size:.75rem;color:var(--text2);">Tones on correct/wrong</div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${S.settings.sound?'checked':''}
            onchange="toggleSound(this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="glass" style="padding:1rem;margin-bottom:.65rem;">
      <div style="font-weight:700;font-size:.9rem;margin-bottom:.55rem;">
        Change Position
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;">
        ${['Striker','Midfielder','Winger','Full-Back','Defender','Goalkeeper','All-Rounder'].map(p=>`
          <button class="btn ${p===S.position?'btn-accent':'btn-ghost'}"
            style="font-size:.78rem;padding:.5rem;"
            onclick="changePosition('${p}')">${p}</button>`).join('')}
      </div>
    </div>

    <div class="glass" style="padding:1rem;margin-bottom:.65rem;">
      <div style="font-weight:700;font-size:.9rem;margin-bottom:.45rem;">Your Academy</div>
      <div style="font-size:.82rem;color:var(--text2);line-height:1.9;">
        <div>Name: <strong style="color:var(--text);">${S.name}</strong></div>
        <div>Level: <strong style="color:var(--accent);">
          ${getLevelFromXP(S.xp)} — ${getLevelTitle(S.xp)}</strong></div>
        <div>XP: <strong style="color:var(--accent);">${S.xp.toLocaleString()}</strong></div>
        <div>Streak: <strong style="color:var(--amber);">${S.streak} days 🔥</strong></div>
        <div>Badges: <strong style="color:var(--purple);">${S.badges.length}/${BADGES.length}</strong></div>
        <div>Pro: <strong style="color:${hasPro()?'var(--legendary)':'var(--text2)'};">
          ${hasPro()?'✅ Active':'Not active'}</strong></div>
      </div>
    </div>

    <div class="glass" style="padding:1rem;border:1px solid rgba(255,94,138,.2);">
      <div style="font-weight:700;color:var(--rose);margin-bottom:.3rem;font-size:.9rem;">
        ⚠️ Reset Progress
      </div>
      <div style="font-size:.75rem;color:var(--text2);margin-bottom:.65rem;">
        Erases all XP, chapters, scores and badges.
      </div>
      <button class="btn btn-rose" style="width:100%;" onclick="confirmReset()">
        Reset Everything
      </button>
    </div>
    <div style="height:.5rem;"></div>`;
}

function toggleTheme(lightMode) {
  S.settings.darkMode = !lightMode;
  document.documentElement.setAttribute('data-theme', lightMode ? 'light' : 'dark');
  saveState();
}
function toggleSound(on) { S.settings.sound = on; saveState(); }
function changePosition(pos) {
  S.position = pos; saveState();
  renderChapters(); renderSettings(); updateXPBar();
  showToast(`Position: ${pos} ✅`);
}
function confirmReset() {
  if (!confirm('Reset all progress? This cannot be undone!')) return;
  resetState(); updateXPBar(); renderChapters(); renderSettings();
  showToast('Progress reset. Fresh start! 💪');
}

// ─────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, dur = 2600) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), dur);
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function el(id)         { return id ? document.getElementById(id) : null; }
function setEl(id, val) { const e = el(id); if (e) e.textContent = val; }

// Stub for packs.js getItemDef (overridden by packs.js)
function getItemDef(id) { return { name: id, emoji: '📦' }; }

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
(function init() {
  loadState();

  // Inject shimmer keyframe for pro button
  const s = document.createElement('style');
  s.textContent = `@keyframes shimmer{from{transform:translateX(-100%)}to{transform:translateX(300%)}}`;
  document.head.appendChild(s);

  // Theme
  document.documentElement.setAttribute('data-theme',
    S.settings.darkMode ? 'dark' : 'light');

  if (S.name && S.position) {
    checkStreak();
    initHomeScreen();
    showScreen('home-screen');
    setActiveNav('nav-home');
  } else if (S.name) {
    showScreen('position-screen');
  } else {
    showScreen('name-screen');
  }

  // Name input enter key
  el('player-name')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveNameAndShowPosition();
  });

  // Heart regen background tick
  setInterval(() => { getHearts(); updateHeartsDisplay(); }, 60000);
})();
