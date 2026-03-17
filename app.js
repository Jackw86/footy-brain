// ============================================================
//  Footy Brain — app.js  v2
//  State, routing, quiz engine, XP, streaks, daily challenge,
//  freemium gating, UI rendering. Requires data.js first.
// ============================================================

'use strict';

// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
const STATE_VERSION = 2;

// ─────────────────────────────────────────────
//  FREEMIUM CONFIG
//  FREE_CHAPTERS: chapter ids always free (no purchase needed)
//  Everything else requires isPremium = true
// ─────────────────────────────────────────────
const FREE_CHAPTERS = ['f1', 'f2', 'f3', 't1', 'r1'];  // 5 free chapters
const FREE_GAMES    = ['penalty', 'offside'];             // 2 free games
// Premium unlock price shown in UI (cosmetic — actual payment handled externally)
const PREMIUM_PRICE = '£2.99';

function isChapterFree(id)  { return FREE_CHAPTERS.includes(id); }
function isGameFree(name)   { return FREE_GAMES.includes(name); }
function hasPremium()       { return S.isPremium === true; }
function canAccessChapter(id)   { return hasPremium() || isChapterFree(id); }
function canAccessGame(name)    { return hasPremium() || isGameFree(name); }

const DEFAULT_STATE = {
  version: STATE_VERSION,
  name: '',
  position: '',
  xp: 0,
  streak: 0,
  lastLogin: '',
  completedChapters: [],
  masteredChapters: [],
  quizScores: {},
  quizAttempts: {},
  gameHighScores: {},
  fastAnswers: 0,
  dailyChallengesCompleted: 0,
  lastDailyDate: '',
  badges: [],
  questionHistory: {},
  isPremium: false,          // true after purchase / unlock code
  settings: {
    darkMode: true,
    sound: true,
    reducedMotion: false,
  },
};

let S = { ...DEFAULT_STATE };

// ─────────────────────────────────────────────
//  PERSISTENCE
// ─────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem('footybrain_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.version || parsed.version < STATE_VERSION) {
        S = { ...DEFAULT_STATE, ...parsed, version: STATE_VERSION };
      } else {
        S = { ...DEFAULT_STATE, ...parsed };
      }
    }
  } catch (e) {
    console.warn('State load failed, using defaults.');
  }
}

function saveState() {
  try { localStorage.setItem('footybrain_v2', JSON.stringify(S)); }
  catch (e) { console.warn('State save failed.'); }
}

function resetState() {
  const preserved = { name: S.name, position: S.position, settings: { ...S.settings } };
  S = { ...DEFAULT_STATE, ...preserved };
  saveState();
}

// ─────────────────────────────────────────────
//  SOUND  (Web Audio API — synthetic tones)
// ─────────────────────────────────────────────
let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return _audioCtx;
}

function playTone(freq, dur, type = 'sine', vol = 0.15) {
  if (!S.settings.sound) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

function playCorrect()  { playTone(523, 0.12); setTimeout(() => playTone(659, 0.15), 100); }
function playWrong()    { playTone(220, 0.25, 'sawtooth', 0.1); }
function playLevelUp()  { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f,0.2), i*120)); }
function playGoal()     { [784,880,1047].forEach((f,i)    => setTimeout(() => playTone(f,0.18), i*80)); }

// ─────────────────────────────────────────────
//  CSS ANIMATIONS  (injected once)
// ─────────────────────────────────────────────
(function injectAnims() {
  if (document.getElementById('pf-anim-style')) return;
  const s = document.createElement('style');
  s.id = 'pf-anim-style';
  s.textContent = `
    @keyframes floatUp {
      0%   { opacity:1; transform:translateY(0) scale(1); }
      80%  { opacity:1; transform:translateY(-60px) scale(1.1); }
      100% { opacity:0; transform:translateY(-80px) scale(.9); }
    }
    @keyframes slideIn {
      from { opacity:0; transform:translateY(20px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes popIn {
      0%  { transform:scale(.7); opacity:0; }
      70% { transform:scale(1.08); }
      100%{ transform:scale(1);   opacity:1; }
    }
    @keyframes shake {
      0%,100%{ transform:translateX(0); }
      20%    { transform:translateX(-6px); }
      40%    { transform:translateX(6px); }
      60%    { transform:translateX(-4px); }
      80%    { transform:translateX(4px); }
    }
    .anim-slide { animation:slideIn .32s ease both; }
    .anim-pop   { animation:popIn .4s cubic-bezier(.34,1.56,.64,1) both; }
    .anim-shake { animation:shake .4s ease; }
  `;
  document.head.appendChild(s);
})();

// ─────────────────────────────────────────────
//  XP & LEVELLING
// ─────────────────────────────────────────────
function addXP(amount, multiplier = 1) {
  const actual = Math.round(amount * multiplier);
  if (actual <= 0) return;
  const lvBefore = getLevelFromXP(S.xp);
  S.xp += actual;
  const lvAfter  = getLevelFromXP(S.xp);
  saveState();
  updateXPBar();
  spawnFloatingXP(actual);
  if (lvAfter > lvBefore) {
    playLevelUp();
    setTimeout(() => showLevelUpModal(lvAfter), 700);
  }
  checkBadges();
}

function getXPMultiplier() {
  if (S.streak >= 7)  return 1.5;
  if (S.streak >= 3)  return 1.25;
  return 1;
}

function updateXPBar() {
  const xp = S.xp;
  setEl('levelDisplay',  getLevelFromXP(xp));
  setEl('levelTitle',    getLevelTitle(xp));
  setEl('xpDisplay',     xp.toLocaleString());
  setEl('xpToNext',      getXPToNext(xp).toLocaleString());
  setEl('streakDisplay', S.streak);
  setEl('statStreak',    S.streak);
  setEl('statChapters',  S.completedChapters.length);
  setEl('statQuizzes',   Object.keys(S.quizScores).length);
  const fill = el('xpFill');
  if (fill) fill.style.width = getLevelProgress(xp) + '%';
}

function spawnFloatingXP(amount) {
  const div = document.createElement('div');
  div.textContent = `+${amount} XP`;
  div.style.cssText = `
    position:fixed;bottom:90px;right:20px;z-index:500;
    background:var(--green);color:#000;font-weight:900;
    font-family:'Bebas Neue',sans-serif;font-size:1.4rem;
    padding:.35rem .85rem;border-radius:99px;pointer-events:none;
    animation:floatUp 1.2s ease forwards;
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1300);
}

function showLevelUpModal(level) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:1000;
    display:flex;align-items:center;justify-content:center;padding:1.5rem;
  `;
  overlay.innerHTML = `
    <div class="anim-pop" style="background:var(--card);border-radius:24px;padding:2.5rem;
         text-align:center;max-width:340px;width:100%;">
      <div style="font-size:5rem;margin-bottom:.5rem;">🏆</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:3rem;color:var(--green);margin-bottom:.2rem;">
        LEVEL UP!
      </h2>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--orange);">
        Level ${level}
      </div>
      <div style="color:var(--text2);margin:.4rem 0 1.5rem;">${getLevelTitle(S.xp)}</div>
      <button onclick="this.closest('[style]').remove()"
        style="background:var(--green);color:#000;font-weight:900;font-size:1rem;
               padding:.9rem 2rem;border:none;border-radius:12px;cursor:pointer;width:100%;
               font-family:'Outfit',sans-serif;">
        Let's Go! 🔥
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  confetti({ particleCount: 130, spread: 75, origin: { y: 0.5 } });
}

// ─────────────────────────────────────────────
//  STREAK
// ─────────────────────────────────────────────
function checkStreak() {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const graceYest = new Date(Date.now() - (26 * 3600000)).toDateString();

  if (S.lastLogin === today) return;

  if (S.lastLogin === yesterday || S.lastLogin === graceYest) {
    S.streak += 1;
  } else if (!S.lastLogin) {
    S.streak = 1;
  } else {
    S.streak = 1;
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
      setTimeout(() => showToast(`🏅 Badge unlocked: ${b.name}!`), 600);
    }
  });
  if (newEarned) saveState();
}

// ─────────────────────────────────────────────
//  ROUTING
// ─────────────────────────────────────────────
let _currentScreen = '';

function showScreen(id) {
  if (_currentScreen === id) return;
  SCREENS.forEach(sid => {
    const el_ = el(sid);
    if (el_) el_.classList.toggle('hidden', sid !== id);
  });
  const next = el(id);
  if (next) {
    next.classList.add('anim-slide');
    setTimeout(() => next.classList.remove('anim-slide'), 400);
  }
  _currentScreen = id;

  const navScreens = ['home-screen', 'leaderboard-screen', 'profile-screen'];
  el('main-nav') && el('main-nav').classList.toggle('hidden', !navScreens.includes(id));

  if (id === 'leaderboard-screen') renderLeaderboard();
  if (id === 'profile-screen')     renderProfile();
  if (id === 'settings-screen')    renderSettings();
  if (id === 'daily-screen')       renderDailyChallenge();
}

const SCREENS = [
  'name-screen','position-screen','home-screen',
  'quiz-screen','game-screen','daily-screen',
  'leaderboard-screen','profile-screen','settings-screen',
];

function setActiveNav(btnId) {
  document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
  el(btnId) && el(btnId).classList.add('active');
}

function backToHome() {
  showScreen('home-screen');
  setActiveNav('nav-home');
  renderChapters();
  renderDailyBanner();
}

// ─────────────────────────────────────────────
//  ONBOARDING
// ─────────────────────────────────────────────
function saveNameAndShowPosition() {
  const input = el('player-name');
  const name  = (input ? input.value : '').trim();
  if (!name) { showToast('Enter your name to continue ⚽'); return; }
  S.name = name;
  saveState();
  showScreen('position-screen');
}

function selectPosition(pos) {
  S.position = pos;
  saveState();
  checkStreak();
  initHomeScreen();
  showScreen('home-screen');
  setActiveNav('nav-home');
  showToast(`Welcome, ${S.name}! Time to train your football brain 🧠⚽`);
}

// ─────────────────────────────────────────────
//  HOME
// ─────────────────────────────────────────────
function initHomeScreen() {
  setEl('playerNameHeader', S.name);

  const badge = el('positionBadge');
  if (badge) {
    const colMap = {
      Striker:'badge-orange', Midfielder:'badge-blue',
      Defender:'badge-purple', Goalkeeper:'badge-green', 'All-Rounder':'badge-green',
    };
    badge.className = `badge ${colMap[S.position] || 'badge-green'}`;
    badge.textContent = S.position;
  }
  updateXPBar();
  renderDailyBanner();
  renderChapters();
}

// ─────────────────────────────────────────────
//  DAILY BANNER
// ─────────────────────────────────────────────
function renderDailyBanner() {
  const banner = el('daily-banner');
  if (!banner) return;
  const done = S.lastDailyDate === new Date().toDateString();
  banner.innerHTML = done
    ? `<div style="display:flex;align-items:center;gap:.75rem;opacity:.55;">
         <span style="font-size:1.5rem;">📅</span>
         <div>
           <div style="font-weight:700;font-size:.875rem;">Daily Challenge Complete!</div>
           <div style="font-size:.75rem;color:var(--text2);">Come back tomorrow</div>
         </div>
         <span style="margin-left:auto;font-size:1.2rem;">✅</span>
       </div>`
    : `<div style="display:flex;align-items:center;gap:.75rem;cursor:pointer;"
            onclick="showScreen('daily-screen')">
         <span style="font-size:1.5rem;" class="flame">🔥</span>
         <div>
           <div style="font-weight:700;font-size:.875rem;">Daily Challenge Ready!</div>
           <div style="font-size:.75rem;color:var(--text2);">5 questions · Bonus XP · Streak</div>
         </div>
         <span style="margin-left:auto;background:var(--green);color:#000;font-weight:700;
                      font-size:.75rem;padding:.3rem .75rem;border-radius:99px;">GO →</span>
       </div>`;
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
    wrap.style.marginBottom = '1.5rem';
    wrap.innerHTML = `<div style="font-size:.72rem;font-weight:700;color:var(--text2);
      letter-spacing:.1em;text-transform:uppercase;margin-bottom:.5rem;">${cat}</div>`;

    catChs.forEach((ch, i) => {
      const done     = S.completedChapters.includes(ch.id);
      const mastered = (S.masteredChapters || []).includes(ch.id);
      const locked   = i > 0 && !S.completedChapters.includes(catChs[i-1].id) && !done;
      const paywalled = !canAccessChapter(ch.id);
      const best     = S.quizScores[ch.id];
      const pct      = best !== undefined ? Math.round(best / ch.questions.length * 100) : null;
      const attempts = S.quizAttempts[ch.id] || 0;

      const card = document.createElement('div');
      card.className = 'chapter-card' + (locked ? ' locked' : '');
      card.style.cssText = `margin-bottom:.5rem;animation:slideIn .3s ease ${i*.05}s both;`;

      const rightIcon = paywalled
        ? `<span style="font-size:.85rem;background:var(--orange);color:#000;
             font-weight:700;padding:.15rem .5rem;border-radius:99px;font-size:.68rem;">
             PRO</span>`
        : mastered ? '💯' : done ? '✅' : locked
        ? '<span style="opacity:.4">🔒</span>'
        : '<span style="font-size:.82rem;color:var(--green);font-weight:700;">GO→</span>';

      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:.75rem;">
          <div style="font-size:2rem;min-width:2.2rem;text-align:center;">${ch.emoji}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:.92rem;white-space:nowrap;
                        overflow:hidden;text-overflow:ellipsis;">${ch.title}</div>
            <div style="font-size:.74rem;color:var(--text2);margin-top:.12rem;">
              ${ch.questions.length} questions · ${ch.xp} XP
              ${attempts > 0 ? ` · ${attempts} attempt${attempts>1?'s':''}` : ''}
              ${paywalled ? ' · <span style="color:var(--orange);">🔓 Full Academy</span>' : ''}
            </div>
            ${pct !== null && !paywalled ? `
              <div style="margin-top:.3rem;">
                <div style="height:3px;border-radius:99px;background:#334155;">
                  <div style="height:100%;width:${pct}%;border-radius:99px;transition:width .5s;
                    background:${pct===100?'var(--green)':pct>=60?'var(--blue)':'var(--orange)'};">
                  </div>
                </div>
                <div style="font-size:.7rem;margin-top:.15rem;
                  color:${pct===100?'var(--green)':'var(--text2)'};">
                  Best: ${best}/${ch.questions.length} (${pct}%)
                </div>
              </div>` : ''}
          </div>
          <div style="min-width:2rem;text-align:right;">${rightIcon}</div>
        </div>
      `;

      if (paywalled) {
        card.style.opacity = '.7';
        card.addEventListener('click', () => showPremiumModal());
      } else if (!locked) {
        card.addEventListener('click', () => startQuiz(ch.id));
      }
      wrap.appendChild(card);
    });
    list.appendChild(wrap);
  });
}

// ─────────────────────────────────────────────
//  PREMIUM MODAL & UNLOCK
// ─────────────────────────────────────────────
function showPremiumModal() {
  const overlay = document.createElement('div');
  overlay.id = 'premium-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:500;
    display:flex;align-items:center;justify-content:center;padding:1.5rem;
  `;
  overlay.innerHTML = `
    <div class="anim-pop" style="background:var(--card);border-radius:24px;
         padding:1.75rem;max-width:340px;width:100%;text-align:center;
         border:1px solid var(--border);">
      <div style="font-size:3.5rem;margin-bottom:.5rem;">🔓</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2.2rem;
          color:var(--green);margin-bottom:.25rem;">FULL ACADEMY</h2>
      <p style="color:var(--text2);font-size:.875rem;line-height:1.6;margin-bottom:1.25rem;">
        Unlock everything in Footy Brain — all 16 chapters, all 6 mini-games,
        112 questions and every badge.
      </p>

      <!-- What's included -->
      <div style="text-align:left;margin-bottom:1.25rem;">
        ${[
          ['📚','16 chapters · 112 questions'],
          ['🎮','All 6 mini-games unlocked'],
          ['📅','Daily challenge access'],
          ['🏅','All 19 badges to earn'],
          ['♾️','Lifetime access — no subscription'],
        ].map(([e,t])=>`
          <div style="display:flex;align-items:center;gap:.6rem;padding:.4rem 0;
               border-bottom:1px solid var(--border);font-size:.85rem;">
            <span>${e}</span><span style="color:var(--text);">${t}</span>
            <span style="margin-left:auto;color:var(--green);">✓</span>
          </div>`).join('')}
      </div>

      <div style="font-family:'Bebas Neue',sans-serif;font-size:2.5rem;
           color:var(--orange);margin-bottom:1rem;">${PREMIUM_PRICE}</div>

      <button class="btn btn-green" style="width:100%;font-size:1rem;margin-bottom:.6rem;"
        onclick="unlockPremium()">Unlock Full Academy →</button>

      <div style="font-size:.72rem;color:var(--text2);margin-bottom:.75rem;">
        Enter unlock code from your purchase
      </div>
      <div style="display:flex;gap:.5rem;margin-bottom:.75rem;">
        <input id="unlock-code-input" type="text" placeholder="Enter code"
          style="flex:1;padding:.6rem .8rem;border-radius:10px;background:var(--card2);
                 border:1px solid var(--border);color:var(--text);font-family:'Outfit',sans-serif;
                 font-size:.875rem;outline:none;"/>
        <button class="btn btn-orange" style="padding:.6rem 1rem;font-size:.875rem;"
          onclick="redeemCode()">Redeem</button>
      </div>
      <div id="unlock-code-msg" style="font-size:.78rem;color:var(--red);min-height:1rem;
           margin-bottom:.5rem;"></div>

      <button class="btn btn-gray" style="width:100%;font-size:.875rem;"
        onclick="document.getElementById('premium-overlay').remove()">
        Maybe later
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
}

// In a real deployment, unlockPremium() would open the payment provider
// (Stripe, Apple IAP, Google Play Billing etc.)
// For now it opens the code redemption flow.
function unlockPremium() {
  // Point this URL at your actual payment page when ready
  const payUrl = 'https://footybrain.app/unlock'; // placeholder
  showToast('Opening payment... (configure your store URL)');
  // window.open(payUrl, '_blank');
}

// Redemption code check — replace FOOTYBRAIN2024 with real codes
// In production, validate against a server endpoint instead
const VALID_CODES = ['FOOTYBRAIN2024', 'FBPRO', 'COACHUNLOCK'];

function redeemCode() {
  const input = document.getElementById('unlock-code-input');
  const msg   = document.getElementById('unlock-code-msg');
  if (!input || !msg) return;
  const code = input.value.trim().toUpperCase();
  if (VALID_CODES.includes(code)) {
    S.isPremium = true;
    saveState();
    document.getElementById('premium-overlay')?.remove();
    renderChapters();
    renderDailyBanner();
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } });
    playLevelUp();
    showToast('🎉 Full Academy unlocked! Enjoy everything!');
  } else {
    msg.textContent = 'Invalid code — please check and try again.';
    input.style.borderColor = 'var(--red)';
    setTimeout(() => {
      msg.textContent = '';
      input.style.borderColor = 'var(--border)';
    }, 2500);
  }
}
let QZ = {
  chapter: null, questions: [], index: 0, score: 0,
  startTime: 0, sessionFast: 0, isDaily: false,
};

function startQuiz(chapterId) {
  const ch = getChapterById(chapterId);
  if (!ch) return;

  // Adaptive order: prioritise unseen / previously wrong questions
  const hist = S.questionHistory || {};
  const ordered = [...ch.questions].sort((a, b) => {
    const ki = `${chapterId}_${ch.questions.indexOf(a)}`;
    const kj = `${chapterId}_${ch.questions.indexOf(b)}`;
    const hi = hist[ki], hj = hist[kj];
    const si = hi ? hi.correct / (hi.correct + hi.incorrect) : -1;
    const sj = hj ? hj.correct / (hj.correct + hj.incorrect) : -1;
    return si - sj;
  });

  QZ = { chapter: ch, questions: ordered, index: 0, score: 0,
         startTime: 0, sessionFast: 0, isDaily: false };

  el('quizChapterTitle') && (el('quizChapterTitle').textContent = `${ch.emoji} ${ch.title}`);
  el('qTotal')           && (el('qTotal').textContent = ch.questions.length);
  showScreen('quiz-screen');
  renderQuestion();
}

function startDailyQuiz() {
  const qs = getDailyQuestions(5);
  QZ = { chapter: null, questions: qs, index: 0, score: 0,
         startTime: 0, sessionFast: 0, isDaily: true };

  el('quizChapterTitle') && (el('quizChapterTitle').textContent = '📅 Daily Challenge');
  el('qTotal')           && (el('qTotal').textContent = qs.length);
  showScreen('quiz-screen');
  renderQuestion();
}

function renderQuestion() {
  const { questions, index, chapter, isDaily } = QZ;
  const q = questions[index];
  if (!q) { finishQuiz(); return; }

  QZ.startTime = Date.now();
  const total  = questions.length;
  const progPc = Math.round(index / total * 100);

  el('qNum')         && (el('qNum').textContent = index + 1);
  el('quizProgress') && (el('quizProgress').style.width = progPc + '%');
  el('qXPEarn')      && (el('qXPEarn').textContent = isDaily ? '50' : (chapter ? chapter.xp : '10'));

  const diffLabels = ['','🟢 Beginner','🔵 Developing','🟠 Pro','🔴 Elite'];
  const diff = q.difficulty ? (diffLabels[q.difficulty] || '') : '';

  const area = el('quiz-area');
  if (!area) return;

  area.innerHTML = `
    <div class="card anim-slide" style="margin-bottom:1rem;">
      ${diff ? `<div style="font-size:.7rem;color:var(--text2);margin-bottom:.35rem;">${diff}</div>` : ''}
      <div style="font-size:1.08rem;font-weight:700;line-height:1.45;">${q.q}</div>
    </div>
    <div id="options" style="display:flex;flex-direction:column;gap:.5rem;">
      ${q.opts.map((opt, i) => `
        <button class="quiz-opt" id="opt-${i}" onclick="selectAnswer(${i})">
          <span style="font-weight:900;color:var(--green);margin-right:.3rem;">
            ${String.fromCharCode(65+i)}.
          </span>${opt}
        </button>`).join('')}
    </div>
    <div id="quiz-feedback" style="margin-top:.875rem;"></div>
    <div id="quiz-next"     style="margin-top:.625rem;"></div>
  `;
}

function selectAnswer(idx) {
  const { questions, index, chapter } = QZ;
  const q = questions[index];
  if (!q) return;

  document.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true);

  const correct = idx === q.a;
  const elapsed = (Date.now() - QZ.startTime) / 1000;
  const fast    = elapsed < 4 && correct;

  el(`opt-${idx}`) && el(`opt-${idx}`).classList.add(correct ? 'correct' : 'wrong');
  if (!correct) el(`opt-${q.a}`) && el(`opt-${q.a}`).classList.add('correct');
  if (!correct) el(`opt-${idx}`) && el(`opt-${idx}`).classList.add('anim-shake');

  correct ? playCorrect() : playWrong();

  if (correct) QZ.score++;
  if (fast)    QZ.sessionFast++;

  // Spaced repetition history
  if (chapter) {
    const key = `${chapter.id}_${questions.indexOf(q)}`;
    if (!S.questionHistory) S.questionHistory = {};
    if (!S.questionHistory[key]) S.questionHistory[key] = { correct: 0, incorrect: 0 };
    S.questionHistory[key][correct ? 'correct' : 'incorrect']++;
  }

  const fb = el('quiz-feedback');
  if (fb) fb.innerHTML = `
    <div class="card2 anim-slide" style="border-left:3px solid ${correct?'var(--green)':'var(--red)'};">
      <div style="font-weight:700;margin-bottom:.25rem;color:${correct?'var(--green)':'var(--red)'};">
        ${correct ? '✅ Correct!' : '❌ Not quite...'}
        ${fast ? '<span style="color:var(--orange);font-size:.78rem;margin-left:.4rem;">⚡ Fast!</span>' : ''}
      </div>
      <div style="font-size:.85rem;color:var(--text2);line-height:1.5;">${q.exp}</div>
    </div>`;

  const isLast = index >= questions.length - 1;
  const nextEl = el('quiz-next');
  if (nextEl) nextEl.innerHTML = `
    <button class="btn btn-green anim-slide" style="width:100%;"
      onclick="${isLast ? 'finishQuiz()' : 'nextQuestion()'}">
      ${isLast ? 'See Results 🏆' : 'Next →'}
    </button>`;
}

function nextQuestion() {
  QZ.index++;
  renderQuestion();
}

function finishQuiz() {
  const { chapter, questions, score, sessionFast, isDaily } = QZ;
  const total = questions.length;
  const pct   = Math.round(score / total * 100);

  // Persist results
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
      if (!S.masteredChapters.includes(chapter.id)) S.masteredChapters.push(chapter.id);
    }
  }
  S.fastAnswers = (S.fastAnswers || 0) + sessionFast;
  saveState();
  checkBadges();

  // XP
  const baseXP   = isDaily ? 50 : (chapter ? chapter.xp : 20);
  const earnedXP = Math.round(baseXP * (score / total));
  const mult     = getXPMultiplier();
  const bonusXP  = pct === 100 ? Math.round(baseXP * 0.5) : 0;
  const totalXP  = Math.round(earnedXP * mult) + bonusXP;

  addXP(totalXP);

  if (pct === 100) {
    confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 } });
    playGoal();
  }

  // Results UI
  el('quizProgress') && (el('quizProgress').style.width = '100%');
  el('qNum')         && (el('qNum').textContent = total);

  const emoji = pct===100?'🏆':pct>=80?'⭐':pct>=60?'👍':'💪';
  const msg   = pct===100?'PERFECT!':pct>=80?'GREAT WORK!':pct>=60?'PASSED!':'KEEP GOING!';
  const area  = el('quiz-area');
  if (!area) return;

  area.innerHTML = `
    <div style="text-align:center;padding:1rem 0;" class="anim-slide">
      <div style="font-size:5rem;margin-bottom:.5rem;">${emoji}</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2.8rem;
          color:${pct>=60?'var(--green)':'var(--orange)'};line-height:1;">
        ${score}/${total}
      </h2>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;
          color:var(--text2);margin-bottom:.75rem;">${msg}</div>

      <div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap;margin-bottom:1.25rem;">
        <div class="card2" style="padding:.55rem .9rem;text-align:center;">
          <div style="font-weight:900;color:var(--green);">+${totalXP} XP</div>
          <div style="font-size:.68rem;color:var(--text2);">Earned</div>
        </div>
        ${mult > 1 ? `<div class="card2" style="padding:.55rem .9rem;text-align:center;">
          <div style="font-weight:900;color:var(--orange);">${mult}×</div>
          <div style="font-size:.68rem;color:var(--text2);">Streak bonus</div>
        </div>` : ''}
        ${bonusXP > 0 ? `<div class="card2" style="padding:.55rem .9rem;text-align:center;">
          <div style="font-weight:900;color:var(--purple);">+${bonusXP}</div>
          <div style="font-size:.68rem;color:var(--text2);">Perfect bonus</div>
        </div>` : ''}
      </div>

      ${pct < 60 ? `<p style="color:var(--orange);font-size:.85rem;margin-bottom:1rem;">
        Score 60%+ to unlock the next chapter!</p>` : ''}

      <div style="display:flex;flex-direction:column;gap:.6rem;">
        ${chapter ? `<button class="btn btn-green" style="width:100%;"
          onclick="startQuiz('${chapter.id}')">
          ${pct===100?'Replay 🔁':'Retry 💪'}
        </button>` : ''}
        <button class="btn btn-gray" style="width:100%;" onclick="backToHome()">
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
        <div style="font-size:4rem;margin-bottom:.75rem;">✅</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--green);">All Done!</h2>
        <p style="color:var(--text2);margin:.5rem 0 1.5rem;">
          You've completed today's challenge.<br>Come back tomorrow!
        </p>
        <div class="card2" style="margin-bottom:1.5rem;padding:1rem;">
          <div style="font-size:.8rem;color:var(--text2);margin-bottom:.2rem;">Current streak</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:2.5rem;color:var(--orange);">
            ${S.streak} 🔥
          </div>
        </div>
        <button class="btn btn-gray" style="width:100%;" onclick="backToHome()">Back to Academy</button>
      </div>`;
    return;
  }

  cont.innerHTML = `
    <div style="text-align:center;padding:1rem 0 1.5rem;">
      <div style="font-size:3.5rem;margin-bottom:.5rem;" class="flame">🔥</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--green);">
        DAILY CHALLENGE
      </h2>
      <p style="color:var(--text2);font-size:.85rem;margin:.4rem 0 1rem;">
        5 questions from across the curriculum<br>
        <strong style="color:var(--orange);">Streak multiplier applies!</strong>
      </p>
      <div style="display:flex;gap:.65rem;justify-content:center;margin-bottom:1.25rem;">
        <div class="card2" style="padding:.55rem 1rem;text-align:center;">
          <div style="font-weight:900;color:var(--green);">50 XP</div>
          <div style="font-size:.68rem;color:var(--text2);">Base reward</div>
        </div>
        <div class="card2" style="padding:.55rem 1rem;text-align:center;">
          <div style="font-weight:900;color:var(--orange);">${S.streak} 🔥</div>
          <div style="font-size:.68rem;color:var(--text2);">Day streak</div>
        </div>
        <div class="card2" style="padding:.55rem 1rem;text-align:center;">
          <div style="font-weight:900;color:var(--purple);">${getXPMultiplier()}×</div>
          <div style="font-size:.68rem;color:var(--text2);">Multiplier</div>
        </div>
      </div>
      <button class="btn btn-green" style="width:100%;font-size:1.05rem;padding:.95rem;"
        onclick="startDailyQuiz()">Start Challenge →</button>
      <br><br>
      <button class="btn btn-gray" style="width:100%;" onclick="backToHome()">Maybe Later</button>
    </div>`;
}

// ─────────────────────────────────────────────
//  LEADERBOARD
// ─────────────────────────────────────────────
function renderLeaderboard() {
  const cont = el('lbContent');
  if (!cont) return;

  cont.innerHTML = `
    <div class="card anim-slide" style="margin-bottom:1rem;text-align:center;padding:1.5rem;">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:2.5rem;
          color:var(--green);line-height:1;">Level ${getLevelFromXP(S.xp)}</div>
      <div style="color:var(--text2);font-size:.875rem;margin-bottom:.75rem;">
        ${getLevelTitle(S.xp)}
      </div>
      <div class="xp-bar"><div class="xp-fill" style="width:${getLevelProgress(S.xp)}%"></div></div>
      <div style="display:flex;justify-content:space-between;
          font-size:.72rem;color:var(--text2);margin-top:.3rem;">
        <span>${S.xp.toLocaleString()} XP</span>
        <span>${getXPToNext(S.xp).toLocaleString()} to next</span>
      </div>
    </div>

    <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;margin-bottom:.65rem;">
      🎮 GAME HIGH SCORES
    </h3>
    <div style="margin-bottom:1.5rem;">
      ${Object.entries(GAME_META).map(([key, g]) => {
        const hi  = S.gameHighScores[key] || 0;
        const pct = Math.round(hi / g.max * 100);
        return `
          <div style="display:flex;align-items:center;gap:.75rem;padding:.7rem;
              background:var(--card2);border-radius:12px;margin-bottom:.45rem;">
            <div style="font-size:1.4rem;">${g.emoji}</div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:.875rem;">${g.name}</div>
              <div class="xp-bar" style="margin-top:.3rem;height:4px;">
                <div class="xp-fill" style="width:${pct}%;height:100%;
                  background:${pct===100?'var(--green)':pct>=60?'var(--blue)':'var(--orange)'};"></div>
              </div>
            </div>
            <div style="font-weight:900;font-size:.9rem;
                color:${hi>=g.max?'var(--green)':'var(--text)'};">${hi}/${g.max}</div>
          </div>`;
      }).join('')}
    </div>

    <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;margin-bottom:.65rem;">
      📚 QUIZ SCORES
    </h3>
    ${Object.keys(S.quizScores).length === 0
      ? `<p style="color:var(--text2);font-size:.85rem;">Complete some quizzes to see your scores!</p>`
      : getChaptersForPosition(S.position)
          .filter(ch => S.quizScores[ch.id] !== undefined)
          .map(ch => {
            const sc  = S.quizScores[ch.id];
            const pct = Math.round(sc / ch.questions.length * 100);
            return `
              <div style="display:flex;align-items:center;gap:.7rem;padding:.65rem;
                  background:var(--card2);border-radius:12px;margin-bottom:.4rem;">
                <div style="font-size:1.2rem;">${ch.emoji}</div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:.85rem;">${ch.title}</div>
                  <div class="xp-bar" style="margin-top:.28rem;height:3px;">
                    <div class="xp-fill" style="width:${pct}%;height:100%;
                      background:${pct===100?'var(--green)':'var(--blue)'};"></div>
                  </div>
                </div>
                <div style="font-size:.82rem;font-weight:700;
                    color:${pct===100?'var(--green)':'var(--text)'};">
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
    Striker:'⚡', Midfielder:'🎯', Defender:'🛡️',
    Goalkeeper:'🧤', 'All-Rounder':'⚽',
  };
  const earned = getEarnedBadges(S);

  cont.innerHTML = `
    <div class="card anim-slide" style="text-align:center;padding:1.75rem;margin-bottom:1rem;">
      <div style="font-size:5rem;margin-bottom:.4rem;">${posEmojis[S.position]||'⚽'}</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;line-height:1;">${S.name}</h2>
      <div style="margin:.3rem 0 .2rem;">
        <span class="badge badge-orange">${S.position}</span>
        <span class="badge badge-green" style="margin-left:.35rem;">Level ${getLevelFromXP(S.xp)}</span>
      </div>
      <div style="color:var(--text2);font-size:.82rem;margin:.2rem 0 .65rem;">${getLevelTitle(S.xp)}</div>
      <div class="xp-bar"><div class="xp-fill" style="width:${getLevelProgress(S.xp)}%"></div></div>
      <div style="font-size:.72rem;color:var(--text2);margin-top:.3rem;">
        ${S.xp.toLocaleString()} XP · ${getXPToNext(S.xp).toLocaleString()} to Level ${getLevelFromXP(S.xp)+1}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.55rem;margin-bottom:1rem;">
      ${[
        ['🔥',S.streak,'Streak'],
        ['📚',S.completedChapters.length,'Chapters'],
        ['📝',Object.keys(S.quizScores).length,'Quizzes'],
        ['💯',(S.masteredChapters||[]).length,'Mastered'],
        ['📅',S.dailyChallengesCompleted||0,'Dailies'],
        ['⚡',S.fastAnswers||0,'Fast Ans.'],
      ].map(([e,v,l]) => `
        <div class="card2" style="text-align:center;padding:.7rem .4rem;">
          <div style="font-size:1.2rem;">${e}</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--green);">${v}</div>
          <div style="font-size:.66rem;color:var(--text2);">${l}</div>
        </div>`).join('')}
    </div>

    <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;margin-bottom:.65rem;">
      🏅 BADGES (${earned.length}/${BADGES.length})
    </h3>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.45rem;">
      ${BADGES.map(b => {
        const got = earned.some(e => e.id === b.id);
        return `
          <div style="display:flex;align-items:center;gap:.55rem;padding:.65rem;
              background:var(--card2);border-radius:10px;
              opacity:${got?1:.3};transition:opacity .3s;">
            <span style="font-size:1.4rem;${got?'':'filter:grayscale(1);'}">${b.emoji}</span>
            <div>
              <div style="font-weight:700;font-size:.78rem;">${b.name}</div>
              <div style="font-size:.68rem;color:var(--text2);">${b.desc}</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

// ─────────────────────────────────────────────
//  SETTINGS
// ─────────────────────────────────────────────
function renderSettings() {
  const cont = el('settingsContent');
  if (!cont) return;

  cont.innerHTML = `
    <div class="card" style="margin-bottom:.7rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-weight:700;">Light Mode</div>
          <div style="font-size:.78rem;color:var(--text2);">Switch to light theme</div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${!S.settings.darkMode?'checked':''}
            onchange="toggleTheme(this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="card" style="margin-bottom:.7rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-weight:700;">Sound Effects</div>
          <div style="font-size:.78rem;color:var(--text2);">Tones on correct / wrong</div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${S.settings.sound?'checked':''}
            onchange="toggleSound(this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="card" style="margin-bottom:.7rem;">
      <div style="font-weight:700;margin-bottom:.5rem;">Change Position</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.45rem;">
        ${POSITIONS.map(p => `
          <button class="btn ${p.id===S.position?'btn-green':'btn-gray'}"
            style="font-size:.82rem;padding:.55rem;"
            onclick="changePosition('${p.id}')">
            ${p.emoji} ${p.id}
          </button>`).join('')}
      </div>
    </div>

    <div class="card" style="margin-bottom:.7rem;">
      <div style="font-weight:700;margin-bottom:.45rem;">Your Academy</div>
      <div style="font-size:.83rem;color:var(--text2);line-height:1.9;">
        <div>Name: <strong style="color:var(--text);">${S.name}</strong></div>
        <div>Level: <strong style="color:var(--green);">
          ${getLevelFromXP(S.xp)} — ${getLevelTitle(S.xp)}</strong></div>
        <div>XP: <strong style="color:var(--green);">${S.xp.toLocaleString()}</strong></div>
        <div>Streak: <strong style="color:var(--orange);">${S.streak} days 🔥</strong></div>
        <div>Badges: <strong style="color:var(--purple);">${S.badges.length}/${BADGES.length}</strong></div>
      </div>
    </div>

    <div class="card" style="border:1px solid var(--red);">
      <div style="font-weight:700;color:var(--red);margin-bottom:.3rem;">⚠️ Reset Progress</div>
      <div style="font-size:.78rem;color:var(--text2);margin-bottom:.65rem;">
        Erases all XP, chapters, scores and badges. Name & position are kept.
      </div>
      <button class="btn btn-red" style="width:100%;" onclick="confirmReset()">Reset Everything</button>
    </div>`;
}

function toggleTheme(lightMode) {
  S.settings.darkMode = !lightMode;
  document.documentElement.setAttribute('data-theme', lightMode ? 'light' : 'dark');
  saveState();
}

function toggleSound(on) {
  S.settings.sound = on;
  saveState();
}

function changePosition(pos) {
  S.position = pos;
  saveState();
  renderChapters();
  renderSettings();
  updateXPBar();
  showToast(`Position changed to ${pos}!`);
}

function confirmReset() {
  if (!confirm('Reset all progress? This cannot be undone!')) return;
  resetState();
  updateXPBar();
  renderChapters();
  renderSettings();
  showToast('Progress reset. Fresh start! 💪');
}

// ─────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────
let _toastTimer = null;

function showToast(msg, dur = 2600) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), dur);
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function el(id)        { return id ? document.getElementById(id) : null; }
function setEl(id, val){ const e = el(id); if (e) e.textContent = val; }

// ─────────────────────────────────────────────
//  PWA INSTALL
// ─────────────────────────────────────────────
let _deferredInstall = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredInstall = e;
  const btn = document.createElement('button');
  btn.id = 'install-btn';
  btn.textContent = '📲 Install App';
  btn.style.cssText = `position:fixed;top:1rem;right:1rem;z-index:200;
    background:var(--orange);color:#000;border:none;font-weight:700;
    font-size:.78rem;padding:.45rem .9rem;border-radius:99px;cursor:pointer;
    font-family:'Outfit',sans-serif;`;
  btn.onclick = async () => {
    _deferredInstall.prompt();
    await _deferredInstall.userChoice;
    btn.remove();
  };
  document.body.appendChild(btn);
});

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
(function init() {
  loadState();
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

  const nameInput = el('player-name');
  if (nameInput) nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveNameAndShowPosition();
  });
})();
