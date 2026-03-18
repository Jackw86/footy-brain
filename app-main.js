// ============================================================
//  Footy Brain — app-main.js  v1.0
//  Wires HTML ↔ app-v3.js + path.js
//  Provides all missing render functions
//  Replaces the old inline bridge script in index.html
// ============================================================

'use strict';

// ══════════════════════════════════════════════════════════════
//  SCREEN ROUTER
//  HTML uses IDs: s-name, s-pos, s-path, s-quiz, s-daily,
//                 s-prizes, s-cards, s-profile, s-settings,
//                 s-pro, s-games, s-games-select
//  app-v3 calls showScreen('home-screen') etc — we remap
// ══════════════════════════════════════════════════════════════

const SCREEN_MAP = {
  // app-v3 name  →  HTML id
  'name-screen':     's-name',
  'position-screen': 's-pos',
  'home-screen':     's-path',
  'quiz-screen':     's-quiz',
  'daily-screen':    's-daily',
  'prizes-screen':   's-prizes',
  'cards-screen':    's-cards',
  'profile-screen':  's-profile',
  'settings-screen': 's-settings',
  'pro-screen':      's-pro',
  'game-screen':     's-games',
};

// Screens where the bottom nav is visible
const NAV_SCREENS = new Set(['s-path','s-prizes','s-cards','s-profile','s-games','s-drills']);

// Keep track of current screen
let _currentScreen = '';

window.showScreen = function(id) {
  // Resolve alias
  const htmlId = SCREEN_MAP[id] || id;
  if (_currentScreen === htmlId) return;

  // Hide all screens
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('on');
  });

  const target = document.getElementById(htmlId);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('on');
    // Slide-in animation
    target.style.animation = 'none';
    target.offsetHeight; // reflow
    target.style.animation = '';
  }

  _currentScreen = htmlId;

  // Nav visibility
  const nav = document.getElementById('main-nav');
  if (nav) nav.classList.toggle('hidden', !NAV_SCREENS.has(htmlId));

  // Trigger screen-specific renders
  if (htmlId === 's-path')     { _safecall(renderPath); _safecall(renderDailyBanner); _updateHeader(); }
  if (htmlId === 's-daily')    { _safecall(renderDailyChallenge); }
  if (htmlId === 's-prizes')   { _safecall(renderPrizesScreen); }
  if (htmlId === 's-cards')    { _safecall(renderCollection); }
  if (htmlId === 's-profile')  { _safecall(renderProfile); }
  if (htmlId === 's-settings') { _safecall(renderSettings); }
  if (htmlId === 's-games')    { _safecall(renderGamesScreen); }
  if (htmlId === 's-drills')   { _safecall(renderDrillsScreen); }
};

function _safecall(fn) {
  try { if (typeof fn === 'function') fn(); } catch(e) { console.warn('Screen render error:', e); }
}

// ──────────────────────────────────────────────────────────────
//  NAV
// ──────────────────────────────────────────────────────────────

window.setNav = function(id) {
  document.querySelectorAll('#main-nav .nb').forEach(b => b.classList.remove('on'));
  const el = document.getElementById(id);
  if (el) el.classList.add('on');
};
window.setActiveNav = window.setNav;

// ──────────────────────────────────────────────────────────────
//  goHome
// ──────────────────────────────────────────────────────────────

window.goHome = function() {
  showScreen('s-path');
  setNav('nb-path');
};

// ──────────────────────────────────────────────────────────────
//  ONBOARDING
// ──────────────────────────────────────────────────────────────

window.saveName = function() {
  const inp = document.getElementById('inp-name');
  const name = inp ? inp.value.trim() : '';
  if (!name) { showToast('Enter your name ⚽'); return; }
  S.name = name;
  saveState();
  _buildPositionGrid();
  showScreen('s-pos');
};

function _buildPositionGrid() {
  const grid = document.getElementById('pos-grid');
  if (!grid) return;
  const positions = [
    { id:'Striker',    emoji:'⚡', desc:'Goals & movement' },
    { id:'Midfielder', emoji:'🎯', desc:'Vision & passing' },
    { id:'Winger',     emoji:'💨', desc:'Speed & dribbling' },
    { id:'Full-Back',  emoji:'🛡️', desc:'Attack & defend' },
    { id:'Defender',   emoji:'🧱', desc:'Reading the game' },
    { id:'Goalkeeper', emoji:'🥅', desc:'Shot-stopping' },
  ];
  grid.innerHTML = positions.map(p => `
    <button onclick="selectPos('${p.id}')" style="
      background:var(--s1);border:1.5px solid var(--b2);
      border-radius:16px;padding:.85rem .7rem;
      display:flex;flex-direction:column;align-items:center;gap:.3rem;
      cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;
      -webkit-tap-highlight-color:transparent;"
      onmouseenter="this.style.borderColor='var(--lime)';this.style.background='rgba(184,255,87,.06)'"
      onmouseleave="this.style.borderColor='var(--b2)';this.style.background='var(--s1)'">
      <div style="font-size:1.85rem;">${p.emoji}</div>
      <div style="font-weight:800;font-size:.88rem;">${p.id}</div>
      <div style="font-size:.65rem;color:var(--t2);">${p.desc}</div>
    </button>`).join('');
}

window.selectPos = function(pos) {
  S.position = pos;
  saveState();
  if (typeof checkStreak === 'function') checkStreak();
  _updateHeader();
  if (typeof renderPath === 'function') renderPath();
  if (typeof renderDailyBanner === 'function') renderDailyBanner();
  showScreen('s-path');
  setNav('nb-path');
  showToast(`Welcome, ${S.name}! Let's build your football brain 🧠`);
};

// ──────────────────────────────────────────────────────────────
//  HEADER UPDATER
// ──────────────────────────────────────────────────────────────

function _updateHeader() {
  const nameEl = document.getElementById('hdr-name');
  if (nameEl) nameEl.textContent = S.name || '';

  const streakEl = document.getElementById('streak-disp');
  if (streakEl) streakEl.textContent = S.streak || 0;

  const posBadge = document.getElementById('pos-badge');
  if (posBadge) {
    posBadge.textContent = S.position || '';
    const colMap = {
      Striker:'pa', Midfielder:'pb', Winger:'pb',
      'Full-Back':'pc', Defender:'pc',
      Goalkeeper:'pd', 'All-Rounder':'pd',
    };
    posBadge.className = `pill ${colMap[S.position] || 'pd'}`;
  }

  _updateXPDisplay();
  _updateHeartsDisplay();
}

function _updateXPDisplay() {
  if (typeof getLevelFromXP !== 'function') return;
  const xp  = S.xp || 0;
  const lv  = getLevelFromXP(xp);
  const pct = typeof getLevelProgress === 'function' ? getLevelProgress(xp) : 0;
  const nxt = typeof getXPToNext     === 'function' ? getXPToNext(xp)      : 0;
  const ttl = typeof getLevelTitle   === 'function' ? getLevelTitle(xp)    : '';

  _setText('ring-lv',   lv);
  _setText('lv-title',  ttl);
  _setText('xp-disp',   xp.toLocaleString());
  _setText('xp-next',   nxt.toLocaleString());
  _setText('lv-title2', ttl);

  const fill = document.getElementById('xp-fill');
  if (fill) fill.style.width = pct + '%';

  const ring = document.getElementById('xp-ring');
  if (ring) ring.style.strokeDashoffset = (131.9 - (131.9 * pct / 100)).toFixed(1);

  // You-are-here pill
  const youHere = document.getElementById('you-here-txt');
  if (youHere && typeof ZONE_DEFS !== 'undefined') {
    const zone = ZONE_DEFS.filter(z => lv >= z.unlockAt).pop();
    youHere.textContent = `Level ${lv} · ${zone ? zone.name : 'Grassroots'} · ${S.position || ''}`;
  }
}

function _updateHeartsDisplay() {
  if (typeof getHearts !== 'function') return;
  const h = getHearts();
  const html = [1,2,3,4,5].map(i =>
    `<span class="heart${i > h ? ' empty' : ''}" style="${i > h ? 'opacity:.2;filter:grayscale(1);' : ''}" >❤️</span>`
  ).join('');
  ['hearts-hdr','quizHearts'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ══════════════════════════════════════════════════════════════
//  LEVEL INTRO SYSTEM
//  The HTML has native #lvl-intro (full screen) and
//  #lvl-card (slide-up). We populate and show them.
// ══════════════════════════════════════════════════════════════

let _introState = { chapterId: null, levelNum: null };

// Override app-v3's openLevelIntro to use the HTML elements
window.openLevelIntro = function(chapterId, levelNum) {
  if (typeof getHearts === 'function' && getHearts() <= 0) {
    _showHeartsModal();
    return;
  }
  const ch = typeof getChapterById === 'function' ? getChapterById(chapterId) : null;
  if (!ch) return;
  const lvDef = typeof CHAPTER_LEVELS !== 'undefined' ? CHAPTER_LEVELS[levelNum - 1] : null;
  if (!lvDef) return;

  _introState = { chapterId, levelNum };

  const firstTime = typeof hasSeenIntro === 'function' ? !hasSeenIntro(chapterId, levelNum) : false;
  if (firstTime) {
    _showFSI(ch, levelNum, lvDef);
  } else {
    _showCard(ch, levelNum, lvDef);
  }
};

// ── Full Screen Intro ──────────────────────────────────────────

function _showFSI(ch, levelNum, lvDef) {
  const el = document.getElementById('lvl-intro');
  if (!el) { startChapterLevel(ch.id, levelNum); return; }

  const quote  = (ch.levelQuotes  && ch.levelQuotes[levelNum])  || _defaultQuote(levelNum);
  const learns = (ch.levelIntros  && ch.levelIntros[levelNum])  || _defaultLearns(ch, levelNum, lvDef);

  _setText('fsi-emoji',      ch.emoji);
  _setText('fsi-chapter',    ch.title);
  _setText('fsi-level-name', `${lvDef.icon} Level ${lvDef.n} — ${lvDef.name}`);
  _setText('fsi-quote',      quote);
  _setText('fsi-cta-txt',    lvDef.cta);

  // Colour the level badge
  const glowEl = document.getElementById('fsi-glow');
  if (glowEl) glowEl.style.background = `radial-gradient(circle at 50% 0,${lvDef.color}22,transparent 60%)`;
  const lvBadge = document.querySelector('#lvl-intro .fsi-level');
  if (lvBadge) { lvBadge.textContent = `${lvDef.icon} Level ${lvDef.n} — ${lvDef.name}`; lvBadge.style.color = lvDef.color; }

  // Learns
  const learnsEl = document.getElementById('fsi-learns');
  if (learnsEl) {
    learnsEl.innerHTML = learns.map(l => `
      <div class="fsi-learn-item" style="border-color:${lvDef.border};background:${lvDef.bg};">
        <span style="color:${lvDef.color};">✓</span>
        <span>${l}</span>
      </div>`).join('');
  }

  // Meta pills
  const metaEl = document.getElementById('fsi-meta');
  if (metaEl) {
    const qpp = typeof QUESTIONS_PER_LEVEL !== 'undefined' ? QUESTIONS_PER_LEVEL : 6;
    metaEl.innerHTML = `
      <span class="pill" style="background:var(--s2);border:1px solid var(--b2);">📝 ${qpp} questions</span>
      <span class="pill" style="background:${lvDef.bg};border:1px solid ${lvDef.border};color:${lvDef.color};">✓ Pass: ${lvDef.pass}/${qpp}</span>
      <span class="pill" style="background:${lvDef.bg};border:1px solid ${lvDef.border};color:${lvDef.color};">+${lvDef.xp} XP</span>`;
  }

  // CTA button colour
  const ctaBtn = document.getElementById('fsi-cta');
  if (ctaBtn) ctaBtn.style.background = `linear-gradient(135deg,${lvDef.color},${lvDef.color}bb)`;

  el.classList.remove('hidden');
  el.style.display = 'flex';
}

window.closeFSI = function() {
  const el = document.getElementById('lvl-intro');
  if (el) { el.classList.add('hidden'); el.style.display = ''; }
};

window.startFromFSI = function() {
  closeFSI();
  const { chapterId, levelNum } = _introState;
  if (typeof markIntroSeen === 'function') markIntroSeen(chapterId, levelNum);
  startChapterLevel(chapterId, levelNum);
};

// ── Slide-up Card Intro ─────────────────────────────────────

function _showCard(ch, levelNum, lvDef) {
  const el = document.getElementById('lvl-card');
  if (!el) { startChapterLevel(ch.id, levelNum); return; }

  const quote  = (ch.levelQuotes && ch.levelQuotes[levelNum]) || _defaultQuote(levelNum);
  const learns = (ch.levelIntros && ch.levelIntros[levelNum]) || _defaultLearns(ch, levelNum, lvDef);
  const lvData = typeof getLevelData === 'function' ? getLevelData(ch.id, levelNum) : { bestScore:0, attempts:0 };
  const qpp    = typeof QUESTIONS_PER_LEVEL !== 'undefined' ? QUESTIONS_PER_LEVEL : 6;

  // Top section
  const topEl = document.getElementById('lc-top');
  if (topEl) {
    topEl.innerHTML = `
      <div style="width:58px;height:58px;border-radius:18px;flex-shrink:0;
           background:${lvDef.bg};border:1.5px solid ${lvDef.border};
           display:flex;align-items:center;justify-content:center;font-size:2.1rem;">
        ${ch.emoji}
      </div>
      <div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;line-height:1;">${ch.title}</div>
        <div style="display:inline-flex;align-items:center;gap:.26rem;margin-top:.25rem;
             padding:.17rem .6rem;border-radius:99px;
             background:${lvDef.bg};border:1px solid ${lvDef.border};
             color:${lvDef.color};font-size:.65rem;font-weight:800;">
          ${lvDef.icon} Level ${lvDef.n} — ${lvDef.name}
        </div>
        ${lvData.attempts > 0 ? `
        <div style="font-size:.72rem;color:var(--t2);margin-top:.22rem;">
          ✅ Best: ${lvData.bestScore}/${qpp} · ${lvData.attempts} attempt${lvData.attempts !== 1 ? 's' : ''}
        </div>` : ''}
      </div>`;
  }

  // Quote
  const quoteEl = document.getElementById('lc-quote');
  if (quoteEl) quoteEl.textContent = quote;

  // Learns (first 3)
  const learnsEl = document.getElementById('lc-learns');
  if (learnsEl) {
    learnsEl.innerHTML = learns.slice(0, 3).map(l => `
      <div style="display:flex;align-items:flex-start;gap:.5rem;font-size:.82rem;
           color:var(--t2);padding:.28rem 0;border-bottom:1px solid var(--b1);">
        <span style="color:${lvDef.color};flex-shrink:0;">✓</span><span>${l}</span>
      </div>`).join('');
  }

  // Meta
  const metaEl = document.getElementById('lc-meta');
  if (metaEl) {
    metaEl.innerHTML = `
      <span class="pill" style="background:var(--s2);border:1px solid var(--b2);">📝 ${qpp} questions</span>
      <span class="pill" style="background:${lvDef.bg};border:1px solid ${lvDef.border};color:${lvDef.color};">✓ ${lvDef.pass}/${qpp}</span>
      <span class="pill" style="background:${lvDef.bg};border:1px solid ${lvDef.border};color:${lvDef.color};">+${lvDef.xp} XP</span>`;
  }

  // Start button
  const startBtn = document.getElementById('lc-start');
  if (startBtn) {
    startBtn.textContent = lvDef.cta;
    startBtn.style.background = `linear-gradient(135deg,${lvDef.color},${lvDef.color}bb)`;
    startBtn.style.border = 'none';
    startBtn.style.color = '#000';
  }

  el.classList.remove('hidden');
  el.style.display = 'flex';
}

window.closeCard = function() {
  const el = document.getElementById('lvl-card');
  if (el) { el.classList.add('hidden'); el.style.display = ''; }
};

window.startFromCard = function() {
  closeCard();
  const { chapterId, levelNum } = _introState;
  if (typeof markIntroSeen === 'function') markIntroSeen(chapterId, levelNum);
  startChapterLevel(chapterId, levelNum);
};

window.handleCardBackdrop = function(e) {
  if (e.target === document.getElementById('lvl-card')) closeCard();
};

window.showAllLevels = function() {
  closeCard();
  if (_introState.chapterId && typeof openChapterLevels === 'function') {
    openChapterLevels(_introState.chapterId);
  }
};

// ── Default intro content ────────────────────────────────────

function _defaultQuote(levelNum) {
  return [
    'Every great player started with the basics. Master these and move up.',
    'Technique sharpens with practice. These questions will challenge you.',
    'This is where good players separate from average ones.',
    'Pro level knowledge. What coaches teach at academies.',
    'Only the best players reach Level 5. A perfect score is required.',
  ][levelNum - 1] || 'Keep pushing — every question makes you better.';
}

function _defaultLearns(ch, levelNum, lvDef) {
  return [
    `Core concepts at ${lvDef.name} level`,
    `${ch.cat} fundamentals for ${S.position || 'your position'}`,
    `${lvDef.desc}`,
    `Building toward Level ${Math.min(levelNum + 1, 5)} — ${typeof CHAPTER_LEVELS !== 'undefined' ? CHAPTER_LEVELS[Math.min(levelNum, 4)].name : 'next'}`,
  ];
}

// ══════════════════════════════════════════════════════════════
//  CHAPTER LEVELS OVERLAY (replaces app-v3's version)
// ══════════════════════════════════════════════════════════════

window.openChapterLevels = function(chapterId) {
  const ch = typeof getChapterById === 'function' ? getChapterById(chapterId) : null;
  if (!ch) return;

  const existing = document.getElementById('chapterLevelsOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'chapterLevelsOverlay';
  overlay.style.cssText = `position:fixed;inset:0;z-index:300;
    display:flex;align-items:flex-end;justify-content:center;
    padding:1rem;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  const qpp = typeof QUESTIONS_PER_LEVEL !== 'undefined' ? QUESTIONS_PER_LEVEL : 6;
  const levelsHtml = (typeof CHAPTER_LEVELS !== 'undefined' ? CHAPTER_LEVELS : []).map((lv, i) => {
    const lvNum    = i + 1;
    const lvData   = typeof getLevelData     === 'function' ? getLevelData(chapterId, lvNum)     : {};
    const unlocked = typeof isLevelUnlocked  === 'function' ? isLevelUnlocked(chapterId, lvNum)  : lvNum === 1;
    const isCurrent = !lvData.done && unlocked;
    return `
      <div onclick="${unlocked ? `document.getElementById('chapterLevelsOverlay').remove();openLevelIntro('${chapterId}',${lvNum})` : `showToast('Complete Level ${lvNum-1} first!')`}"
           style="display:flex;align-items:center;gap:.75rem;padding:.72rem .9rem;
                  border-radius:12px;cursor:${unlocked?'pointer':'not-allowed'};
                  border:1.5px solid ${lvData.done?'rgba(184,255,87,.25)':isCurrent?lv.color:'rgba(255,255,255,.08)'};
                  background:${lvData.done?'rgba(184,255,87,.05)':isCurrent?lv.bg:'rgba(255,255,255,.03)'};
                  opacity:${unlocked?1:.35};margin-bottom:.42rem;transition:all .14s;">
        <div style="width:38px;height:38px;border-radius:50%;flex-shrink:0;
             background:${lv.bg};display:flex;align-items:center;justify-content:center;font-size:1.1rem;">${lv.icon}</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:.88rem;">Level ${lvNum} — ${lv.name}</div>
          <div style="font-size:.7rem;color:rgba(240,244,255,.4);">${lv.desc}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:.72rem;font-weight:800;color:${lv.color};">+${lv.xp} XP</div>
          ${lvData.done
            ? `<div style="color:#b8ff57;font-size:.72rem;margin-top:.1rem;">✅ ${lvData.bestScore}/${qpp}</div>`
            : isCurrent
              ? `<div style="font-size:.7rem;color:${lv.color};font-weight:700;margin-top:.1rem;">▶ START</div>`
              : `<div style="font-size:.75rem;margin-top:.1rem;">${unlocked?'':'🔒'}</div>`}
        </div>
      </div>`;
  }).join('');

  overlay.innerHTML = `
    <div style="width:100%;max-width:420px;background:#0a1425;
         border:1px solid rgba(255,255,255,.13);border-radius:24px 24px 20px 20px;
         overflow:hidden;animation:sheetUp .38s cubic-bezier(.34,1.2,.64,1) both;
         max-height:84vh;overflow-y:auto;scrollbar-width:none;">
      <div style="width:40px;height:4px;border-radius:99px;background:rgba(255,255,255,.13);margin:1rem auto .85rem;"></div>
      <div style="padding:0 1.25rem .5rem;">
        <div style="font-size:2.2rem;text-align:center;margin-bottom:.3rem;">${ch.emoji}</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;text-align:center;
             background:linear-gradient(135deg,#b8ff57,#5edfff);
             -webkit-background-clip:text;-webkit-text-fill-color:transparent;
             background-clip:text;margin-bottom:1rem;">${ch.title}</div>
        ${levelsHtml}
      </div>
      <div style="padding:.25rem 1.25rem 1.5rem;">
        <button onclick="document.getElementById('chapterLevelsOverlay').remove()"
                style="width:100%;padding:.72rem;background:rgba(255,255,255,.05);
                       border:1px solid rgba(255,255,255,.1);color:rgba(240,244,255,.4);
                       font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;
                       border-radius:11px;cursor:pointer;">Close</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
};

// ══════════════════════════════════════════════════════════════
//  MODALS
// ══════════════════════════════════════════════════════════════

window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('on');
};

function _openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function _showHeartsModal() {
  // Update timer display
  const timerEl = document.getElementById('hearts-timer');
  if (timerEl && typeof getHeartRegenText === 'function') {
    timerEl.textContent = getHeartRegenText() || '30:00';
  }
  _openModal('m-hearts');
}

// Override app-v3's showNoHeartsModal to use the HTML modal
window.showNoHeartsModal = _showHeartsModal;

// Level up modal
window.showLevelUpModal = function(level) {
  _setText('lu-num',   `Level ${level}`);
  _setText('lu-title', typeof getLevelTitle === 'function' ? getLevelTitle(S.xp) : '');
  _openModal('m-levelup');
  if (typeof confetti === 'function') confetti({ particleCount: 130, spread: 75, origin: { y: 0.5 } });
};

// ══════════════════════════════════════════════════════════════
//  DAILY CHALLENGE SCREEN
// ══════════════════════════════════════════════════════════════

window.renderDailyChallenge = function() {
  const el = document.getElementById('daily-content');
  if (!el) return;

  const done = S.lastDailyDate === new Date().toDateString();

  if (done) {
    el.innerHTML = `
      <div style="text-align:center;padding:3rem 1.5rem;">
        <div style="font-size:4rem;margin-bottom:1rem;">✅</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2.2rem;color:var(--lime);margin-bottom:.5rem;">
          CHALLENGE DONE!</h2>
        <p style="color:var(--t2);font-size:.9rem;line-height:1.6;margin-bottom:1.5rem;">
          You completed today's challenge.<br>Come back tomorrow to keep your streak!
        </p>
        <div class="glass" style="padding:1rem;text-align:center;margin-bottom:1rem;">
          <div style="font-size:.75rem;color:var(--t2);margin-bottom:.3rem;">CURRENT STREAK</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:3rem;color:var(--amber);">
            ${S.streak || 0} 🔥
          </div>
        </div>
        <button onclick="goHome()" class="btn btg" style="width:100%;">← Back to Path</button>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div style="padding:1rem 0;">
      <div class="glass" style="padding:1.25rem;margin-bottom:1rem;text-align:center;">
        <div style="font-size:.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
             color:var(--t2);margin-bottom:.4rem;">CURRENT STREAK</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:3.2rem;color:var(--amber);line-height:1;">
          ${S.streak || 0} 🔥
        </div>
        <div style="font-size:.75rem;color:var(--t2);margin-top:.3rem;">days in a row</div>
      </div>

      <div class="glass" style="padding:1.25rem;margin-bottom:1.2rem;">
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;">
          <div style="font-size:2rem;">📅</div>
          <div>
            <div style="font-weight:800;font-size:.95rem;">Today's Challenge</div>
            <div style="font-size:.75rem;color:var(--t2);">5 mixed questions • Bonus XP</div>
          </div>
        </div>
        <div style="display:flex;gap:.42rem;margin-bottom:1rem;flex-wrap:wrap;">
          <span class="pill" style="background:var(--s2);border:1px solid var(--b2);">📝 5 questions</span>
          <span class="pill" style="background:rgba(255,182,39,.1);border:1px solid rgba(255,182,39,.2);color:var(--amber);">+50 XP base</span>
          <span class="pill" style="background:rgba(255,94,138,.1);border:1px solid rgba(255,94,138,.2);color:var(--rose);">🔥 Streak boost</span>
        </div>
        <button onclick="startDailyQuiz()" style="
          width:100%;padding:.95rem;border:none;border-radius:13px;
          background:linear-gradient(135deg,var(--amber),#d97706);
          color:#000;font-family:'DM Sans',sans-serif;font-weight:900;
          font-size:1rem;cursor:pointer;">
          Start Daily Challenge 🔥
        </button>
      </div>

      <div style="font-size:.72rem;color:var(--t2);text-align:center;line-height:1.5;">
        Complete a challenge every day to build your streak.<br>
        Longer streaks = bigger XP multipliers!
      </div>
    </div>`;
};

// ══════════════════════════════════════════════════════════════
//  PRIZES SCREEN
// ══════════════════════════════════════════════════════════════

window.renderPrizesScreen = function() {
  const el = document.getElementById('prizes-content');
  if (!el) return;

  const collection = S.collection || [];
  const totalAttempts = S.totalAttempts || 0;

  if (typeof typeof renderPacksScreen === 'function') {
    renderPacksScreen(el);
    return;
  }

  if (collection.length === 0) {
    el.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;">
        <div style="font-size:4rem;margin-bottom:1rem;">🎁</div>
        <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--amber);margin-bottom:.5rem;">
          WIN YOUR FIRST CARD</h3>
        <p style="color:var(--t2);font-size:.88rem;line-height:1.6;margin-bottom:1.5rem;">
          Score 3+ in the arcade games to win card packs.<br>
          Collect characters, tactics cards and more!
        </p>
        <button onclick="showScreen('s-path');setNav('nb-path')"
                class="btn btl" style="width:100%;">Play & Win Cards →</button>
      </div>`;
    return;
  }

  // Show cards
  const rarityColors = {
    common:'#94a3b8', uncommon:'#4ade80', rare:'#60a5fa',
    epic:'#c084fc', legendary:'#fbbf24'
  };
  el.innerHTML = `
    <div style="padding:.5rem 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
        <div style="font-size:.8rem;color:var(--t2);">${collection.length} card${collection.length !== 1 ? 's' : ''} collected</div>
        <div style="font-size:.8rem;color:var(--t2);">${totalAttempts} packs opened</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem;">
        ${collection.slice(0, 30).map(card => `
          <div style="background:var(--s1);border:1.5px solid rgba(${_rarityRGB(card.rarity)},.3);
               border-radius:12px;padding:.75rem .5rem;text-align:center;cursor:pointer;"
               onclick="showToast('${card.name} — ${card.rarity}')">
            <div style="font-size:1.8rem;margin-bottom:.3rem;">${card.emoji || '🎴'}</div>
            <div style="font-size:.68rem;font-weight:700;line-height:1.2;">${card.name || 'Card'}</div>
            <div style="font-size:.6rem;color:${rarityColors[card.rarity]||'#94a3b8'};margin-top:.2rem;text-transform:uppercase;letter-spacing:.06em;">${card.rarity || 'common'}</div>
          </div>`).join('')}
      </div>
    </div>`;
};

function _rarityRGB(rarity) {
  const map = { common:'148,163,184', uncommon:'74,222,128', rare:'96,165,250', epic:'192,132,252', legendary:'251,191,36' };
  return map[rarity] || '148,163,184';
}

// ══════════════════════════════════════════════════════════════
//  COLLECTION SCREEN
// ══════════════════════════════════════════════════════════════

window.renderCollection = function() {
  const el = document.getElementById('coll-content');
  if (!el) return;
  // Delegate to renderPrizesScreen logic
  window.renderPrizesScreen.call(null);
  // Also update count
  const countEl = document.getElementById('coll-count');
  if (countEl) countEl.textContent = `${(S.collection||[]).length} cards`;
};

// ══════════════════════════════════════════════════════════════
//  PROFILE SCREEN
// ══════════════════════════════════════════════════════════════

window.renderProfile = function() {
  const el = document.getElementById('profile-content');
  if (!el) return;

  const xp    = S.xp || 0;
  const lv    = typeof getLevelFromXP === 'function' ? getLevelFromXP(xp) : 1;
  const title = typeof getLevelTitle  === 'function' ? getLevelTitle(xp)  : '';
  const done  = (S.completedChapters  || []).length;
  const mast  = (S.masteredChapters   || []).length;
  const cards = (S.collection         || []).length;
  const pro   = typeof hasPro === 'function' && hasPro();

  // Update pro pill
  const proPill = document.getElementById('pro-pill');
  if (proPill) { proPill.style.display = pro ? 'inline-flex' : 'none'; }

  el.innerHTML = `
    <div style="padding:1rem 1.2rem 2rem;">

      <!-- Avatar & name -->
      <div style="text-align:center;padding:1.5rem 0 1rem;">
        <div style="width:80px;height:80px;border-radius:50%;margin:0 auto .75rem;
             background:linear-gradient(135deg,var(--lime),var(--sky));
             display:flex;align-items:center;justify-content:center;font-size:2.8rem;">
          ⚽
        </div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;line-height:1;">${S.name || 'Player'}</div>
        <div style="font-size:.82rem;color:var(--t2);margin-top:.25rem;">${S.position || 'All-Rounder'}</div>
        ${pro ? `<div class="pill pa" style="margin:.4rem auto 0;display:inline-block;">⭐ Pro Player</div>` : ''}
      </div>

      <!-- Stats grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin-bottom:1rem;">
        ${[
          { label:'Level',    value:lv,    emoji:'🏆' },
          { label:'XP',       value:xp.toLocaleString(), emoji:'⭐' },
          { label:'Streak',   value:`${S.streak||0} 🔥`, emoji:'🔥' },
          { label:'Chapters', value:done,  emoji:'📖' },
          { label:'Mastered', value:mast,  emoji:'💎' },
          { label:'Cards',    value:cards, emoji:'🎴' },
        ].map(s => `
          <div class="glass" style="padding:.85rem;text-align:center;">
            <div style="font-size:1.4rem;margin-bottom:.25rem;">${s.emoji}</div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--lime);line-height:1;">${s.value}</div>
            <div style="font-size:.68rem;color:var(--t2);text-transform:uppercase;letter-spacing:.07em;">${s.label}</div>
          </div>`).join('')}
      </div>

      <!-- Level badge -->
      <div class="glass" style="padding:1rem;text-align:center;margin-bottom:1rem;">
        <div style="font-size:.72rem;color:var(--t2);margin-bottom:.3rem;text-transform:uppercase;letter-spacing:.1em;">Current Rank</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;
             background:linear-gradient(135deg,var(--lime),var(--sky));
             -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
          ${title}
        </div>
      </div>

      <!-- Badges -->
      ${(S.badges||[]).length > 0 ? `
      <div class="glass" style="padding:1rem;margin-bottom:1rem;">
        <div style="font-size:.72rem;color:var(--t2);margin-bottom:.65rem;text-transform:uppercase;letter-spacing:.1em;">Badges Earned</div>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;">
          ${(S.badges||[]).map(bid => {
            const b = typeof BADGES !== 'undefined' ? BADGES.find(x=>x.id===bid) : null;
            return b ? `<span title="${b.name}" style="font-size:1.5rem;">${b.emoji}</span>` : '';
          }).join('')}
        </div>
      </div>` : ''}

      <!-- Pro upsell -->
      ${!pro ? `
      <button onclick="showScreen('s-pro')" style="
        width:100%;padding:1rem;border:none;border-radius:14px;
        background:linear-gradient(135deg,var(--gold),#d97706);
        color:#000;font-family:'DM Sans',sans-serif;font-weight:900;
        font-size:.95rem;cursor:pointer;margin-bottom:.75rem;">
        ⭐ Upgrade to Pro — 2× XP, Unlimited Hearts
      </button>` : ''}

      <!-- Reset -->
      <button onclick="_confirmReset()" style="
        width:100%;padding:.7rem;border:1px solid rgba(255,94,138,.2);border-radius:11px;
        background:transparent;color:var(--rose);font-family:'DM Sans',sans-serif;
        font-size:.8rem;font-weight:600;cursor:pointer;">
        Reset Progress
      </button>
    </div>`;
};

window._confirmReset = function() {
  if (confirm('Reset all progress? This cannot be undone.')) {
    if (typeof resetState === 'function') resetState();
    showScreen('s-name');
    showToast('Progress reset. Starting fresh! ⚽');
  }
};

// ══════════════════════════════════════════════════════════════
//  SETTINGS SCREEN
// ══════════════════════════════════════════════════════════════

window.renderSettings = function() {
  const el = document.getElementById('settings-content');
  if (!el) return;

  const st = S.settings || {};
  el.innerHTML = `
    <div style="padding:1rem 1.2rem 2rem;">

      ${_settingToggle('Sound effects', '🔊', st.sound !== false, 'toggleSetting("sound")')}
      ${_settingToggle('Dark mode', '🌙', st.darkMode !== false, 'toggleSetting("darkMode")')}
      ${_settingToggle('Reduced motion', '♿', !!st.reducedMotion, 'toggleSetting("reducedMotion")')}

      <div style="height:1px;background:var(--b1);margin:1.2rem 0;"></div>

      <div class="glass" style="padding:1rem;margin-bottom:1rem;">
        <div style="font-weight:700;margin-bottom:.5rem;">Change Position</div>
        <div style="font-size:.82rem;color:var(--t2);margin-bottom:.75rem;">
          Current: <strong style="color:var(--lime);">${S.position || 'None'}</strong>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.42rem;">
          ${['Striker','Midfielder','Winger','Full-Back','Defender','Goalkeeper','All-Rounder'].map(p =>
            `<button onclick="S.position='${p}';saveState();renderSettings();showToast('Position: ${p}');_updateHeader();"
                     style="padding:.35rem .75rem;border-radius:99px;font-size:.75rem;font-weight:700;cursor:pointer;
                            border:1px solid ${S.position===p?'var(--lime)':'var(--b2)'};
                            background:${S.position===p?'rgba(184,255,87,.1)':'var(--s1)'};
                            color:${S.position===p?'var(--lime)':'var(--t1)'};">
              ${p}
            </button>`
          ).join('')}
        </div>
      </div>

      <div style="font-size:.72rem;color:var(--t3);text-align:center;line-height:1.5;padding-top:.5rem;">
        Footy Brain v3.0 · Made with ⚽ &amp; 🧠
      </div>
    </div>`;
};

function _settingToggle(label, emoji, on, onclick) {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;
         padding:.9rem 0;border-bottom:1px solid var(--b1);">
      <div style="display:flex;align-items:center;gap:.65rem;">
        <span style="font-size:1.2rem;">${emoji}</span>
        <span style="font-weight:600;">${label}</span>
      </div>
      <div onclick="${onclick}" style="
        width:46px;height:26px;border-radius:13px;cursor:pointer;
        background:${on?'var(--lime)':'rgba(255,255,255,.12)'};
        position:relative;transition:background .2s;">
        <div style="position:absolute;top:3px;${on?'right:3px':'left:3px'};
             width:20px;height:20px;border-radius:50%;
             background:${on?'#000':'rgba(255,255,255,.6)'};
             transition:all .2s;"></div>
      </div>
    </div>`;
}

window.toggleSetting = function(key) {
  if (!S.settings) S.settings = {};
  S.settings[key] = !S.settings[key];
  if (typeof saveState === 'function') saveState();
  if (key === 'darkMode') {
    document.documentElement.setAttribute('data-theme', S.settings.darkMode ? 'dark' : 'light');
  }
  renderSettings();
};

// ══════════════════════════════════════════════════════════════
//  PRO SCREEN
// ══════════════════════════════════════════════════════════════

window.showProModal = function() {
  showScreen('s-pro');
  const el = document.getElementById('pro-content');
  if (!el) return;

  const pro = typeof hasPro === 'function' && hasPro();
  if (pro) {
    el.innerHTML = `
      <div style="text-align:center;padding:3rem 1.5rem;">
        <div style="font-size:4rem;margin-bottom:1rem;">⭐</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2.5rem;color:var(--gold);margin-bottom:.5rem;">
          YOU'RE PRO!</h2>
        <p style="color:var(--t2);font-size:.9rem;line-height:1.6;">
          Enjoy unlimited hearts, 2× XP and all Pro features!
        </p>
      </div>`;
    return;
  }

  const features = [
    { e:'❤️', t:'Unlimited Hearts', d:'Never run out — play as much as you want' },
    { e:'⚡', t:'2× XP Everywhere', d:'Level up twice as fast in all quizzes' },
    { e:'🔥', t:'Weekly Streak Freeze', d:'Protect your streak for one missed day' },
    { e:'🎴', t:'Better Card Drops', d:'3× higher chance of epic and legendary cards' },
    { e:'👑', t:'Pro Badge', d:'Exclusive badge on your profile' },
    { e:'📊', t:'Detailed Stats', d:'Full analytics on your football knowledge' },
  ];

  el.innerHTML = `
    <div style="padding:1rem 1.2rem 2rem;">
      <div style="text-align:center;padding:1.5rem 0 1rem;">
        <div style="font-size:3.5rem;margin-bottom:.75rem;">⭐</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2.2rem;
             background:linear-gradient(135deg,var(--gold),var(--amber));
             -webkit-background-clip:text;-webkit-text-fill-color:transparent;
             background-clip:text;margin-bottom:.3rem;">FOOTY BRAIN PRO</h2>
        <p style="color:var(--t2);font-size:.85rem;">Everything unlocked. No limits.</p>
      </div>

      ${features.map(f => `
        <div style="display:flex;align-items:center;gap:.85rem;padding:.72rem 0;
             border-bottom:1px solid var(--b1);">
          <div style="font-size:1.4rem;width:2rem;text-align:center;flex-shrink:0;">${f.e}</div>
          <div>
            <div style="font-weight:700;font-size:.88rem;">${f.t}</div>
            <div style="font-size:.74rem;color:var(--t2);">${f.d}</div>
          </div>
        </div>`).join('')}

      <div style="margin-top:1.5rem;display:flex;flex-direction:column;gap:.65rem;">
        <button onclick="_startProTrial()" style="
          width:100%;padding:1rem;border:none;border-radius:14px;
          background:linear-gradient(135deg,var(--gold),#d97706);
          color:#000;font-family:'DM Sans',sans-serif;font-weight:900;
          font-size:1rem;cursor:pointer;">
          ⭐ Try 7 Days Free Then £24.99/yr
        </button>
        <button onclick="_buyPro('monthly')" style="
          width:100%;padding:.9rem;border:1px solid rgba(251,191,36,.25);border-radius:14px;
          background:rgba(251,191,36,.07);color:var(--gold);
          font-family:'DM Sans',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;">
          Monthly Plan — £3.99/month
        </button>
        <div style="text-align:center;font-size:.72rem;color:var(--t3);">
          Cancel anytime · All prices include VAT
        </div>
      </div>
    </div>`;
};

window._startProTrial = function() {
  // In a real build this would connect to Apple/Google billing
  if (typeof grantPro === 'function') grantPro(7 * 24 * 60 * 60 * 1000);
  showToast('🎉 7-day Pro trial started!');
  renderProfile();
  showScreen('s-profile');
};

window._buyPro = function(plan) {
  const dur = plan === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;
  if (typeof grantPro === 'function') grantPro(dur);
  showToast('⭐ Pro activated!');
  renderProfile();
  showScreen('s-profile');
};


// ══════════════════════════════════════════════════════════════
//  GLOBAL HELPERS needed by games.js and packs.js
// ══════════════════════════════════════════════════════════════

// Global el() helper (games.js and packs.js both use this)
window.el = function(id) { return document.getElementById(id); };

// showModal / closeModal (packs.js calls showModal)  
window.showModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('on');
};

// ══════════════════════════════════════════════════════════════
//  TOAST (ensure it works even if app-v3 version failed)
// ══════════════════════════════════════════════════════════════

window.showToast = (function() {
  let _tt = null;
  return function(msg, dur = 2600) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(_tt);
    _tt = setTimeout(() => t.classList.remove('show'), dur);
  };
})();

// ══════════════════════════════════════════════════════════════
//  HEARTS REGEN TIMER (updates modal if open)
// ══════════════════════════════════════════════════════════════

setInterval(() => {
  const timerEl = document.getElementById('hearts-timer');
  if (timerEl && typeof getHeartRegenText === 'function') {
    const txt = getHeartRegenText();
    if (txt) timerEl.textContent = txt;
  }
  _updateHeartsDisplay();
}, 15000);

// ══════════════════════════════════════════════════════════════
//  INIT — runs once all scripts are loaded
// ══════════════════════════════════════════════════════════════

window.addEventListener('load', function() {
  // Ensure state is loaded (app-v3 does this, but belt-and-braces)
  if (typeof loadState === 'function') loadState();

  // Apply theme
  const darkMode = !S.settings || S.settings.darkMode !== false;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');

  // Decide starting screen
  if (S.name && S.position) {
    if (typeof checkStreak === 'function') checkStreak();
    _updateHeader();
    if (typeof renderPath === 'function') renderPath();
    if (typeof renderDailyBanner === 'function') renderDailyBanner();
    showScreen('s-path');
    setNav('nb-path');
  } else if (S.name) {
    _buildPositionGrid();
    showScreen('s-pos');
  } else {
    showScreen('s-name');
  }

  // Input bindings
  const inp = document.getElementById('inp-name');
  if (inp) {
    inp.addEventListener('focus', () => inp.style.borderColor = 'var(--lime)');
    inp.addEventListener('blur',  () => inp.style.borderColor = 'var(--b2)');
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });
  }

  // PWA install banner
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    const btn = document.createElement('button');
    btn.textContent = '📲 Install App';
    btn.style.cssText = `position:fixed;top:1rem;right:1rem;z-index:200;
      background:var(--amber);color:#000;border:none;font-weight:700;
      font-size:.78rem;padding:.45rem .9rem;border-radius:99px;
      cursor:pointer;font-family:'DM Sans',sans-serif;
      box-shadow:0 4px 16px rgba(255,182,39,.4);`;
    btn.onclick = async () => { e.prompt(); await e.userChoice; btn.remove(); };
    document.body.appendChild(btn);
  });

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
// ══════════════════════════════════════════════════════════════
//  GAMES SCREEN
// ══════════════════════════════════════════════════════════════

const GAME_LIST = [
  { id:'penalty',  name:'Penalty Shoot-Out', emoji:'⚽', desc:'Aim & fire past the keeper',  color:'var(--lime)' },
  { id:'offside',  name:'Offside Trap',      emoji:'🚩', desc:'Call it: on or offside?',      color:'var(--sky)'  },
  { id:'freekick', name:'Free Kick Master',  emoji:'🎯', desc:'Bend it over the wall',        color:'var(--amber)'},
  { id:'rondo',    name:'Rondo Quiz',        emoji:'🔄', desc:'Midfield knowledge test',      color:'var(--plum)' },
  { id:'scanning', name:'Scanning Game',     emoji:'👁️', desc:'Read the pitch in 5 seconds',  color:'var(--rose)' },
  { id:'header',   name:'Heading Challenge', emoji:'🏃', desc:'Time your jump perfectly',     color:'var(--gold)' },
];

window.renderGamesScreen = function() {
  const grid = document.getElementById('game-grid');
  if (!grid) return;

  grid.innerHTML = GAME_LIST.map(g => `
    <div onclick="startGame('${g.id}')" style="
      background:var(--s1);border:1.5px solid var(--b2);border-radius:16px;
      padding:1rem .75rem;cursor:pointer;text-align:center;
      transition:all .15s;-webkit-tap-highlight-color:transparent;"
      onmouseenter="this.style.borderColor='${g.color}';this.style.background='rgba(255,255,255,.07)'"
      onmouseleave="this.style.borderColor='var(--b2)';this.style.background='var(--s1)'">
      <div style="font-size:2rem;margin-bottom:.35rem;">${g.emoji}</div>
      <div style="font-weight:800;font-size:.82rem;line-height:1.2;">${g.name}</div>
      <div style="font-size:.68rem;color:var(--t2);margin-top:.2rem;">${g.desc}</div>
    </div>`).join('');

  // Show selector, hide active game
  const sel = document.getElementById('game-selector');
  const act = document.getElementById('game-active');
  if (sel) sel.style.display = '';
  if (act) act.style.display = 'none';
};

window.startGame = function(name) {
  const sel = document.getElementById('game-selector');
  const act = document.getElementById('game-active');
  if (sel) sel.style.display = 'none';
  if (act) act.style.display = '';
  if (typeof showGame === 'function') showGame(name);
};

window.closeGame = function() {
  const sel = document.getElementById('game-selector');
  const act = document.getElementById('game-active');
  if (sel) sel.style.display = '';
  if (act) { act.style.display = 'none'; }
  const container = document.getElementById('game-container');
  if (container) container.innerHTML = '';
};

// ══════════════════════════════════════════════════════════════
//  DRILLS SCREEN
// ══════════════════════════════════════════════════════════════

window.renderDrillsScreen = function() {
  const el = document.getElementById('drills-content');
  if (!el) return;

  const drill = typeof getTodaysDrill === 'function' ? getTodaysDrill() : null;
  const positionDrills = typeof getDrillsForPosition === 'function'
    ? getDrillsForPosition(S.position || 'All-Rounder').slice(0, 6)
    : [];

  if (!drill) {
    el.innerHTML = '<div style="text-align:center;padding:3rem 1rem;color:var(--t2);">Drills loading...</div>';
    return;
  }

  const diffColors = ['','var(--lime)','var(--sky)','var(--amber)','var(--rose)'];
  const diffLabels = ['','Beginner','Intermediate','Advanced','Elite'];

  el.innerHTML = `
    <!-- Today's Drill -->
    <div class="glass" style="padding:1.25rem;margin-bottom:1rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem;">
        <div style="font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--amber);">📅 Today's Drill</div>
        <span style="background:rgba(255,182,39,.1);border:1px solid rgba(255,182,39,.2);color:var(--amber);
               font-size:.65rem;font-weight:700;padding:.18rem .55rem;border-radius:99px;">
          ${diffLabels[drill.difficulty] || 'Intermediate'}
        </span>
      </div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;line-height:1;margin-bottom:.25rem;">${drill.title}</div>
      <div style="font-size:.75rem;color:var(--t2);margin-bottom:.85rem;font-style:italic;">"${drill.tagline || ''}"</div>
      <div style="font-size:.85rem;line-height:1.65;color:rgba(240,244,255,.7);margin-bottom:.85rem;">${drill.description || drill.desc || ''}</div>

      ${(drill.steps || []).length ? `
      <div style="font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--t2);margin-bottom:.5rem;">Steps</div>
      <div style="display:flex;flex-direction:column;gap:.38rem;margin-bottom:.85rem;">
        ${(drill.steps || []).map((s,i) => `
          <div style="display:flex;align-items:flex-start;gap:.65rem;padding:.6rem .8rem;background:var(--s1);border:1px solid var(--b1);border-radius:10px;">
            <span style="min-width:20px;height:20px;border-radius:50%;background:var(--lime);color:#000;font-size:.65rem;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</span>
            <span style="font-size:.82rem;line-height:1.45;">${s}</span>
          </div>`).join('')}
      </div>` : ''}

      ${drill.coaching_tip ? `
      <div style="background:rgba(94,223,255,.07);border:1px solid rgba(94,223,255,.15);border-radius:10px;padding:.75rem .9rem;">
        <div style="font-size:.65rem;font-weight:700;color:var(--sky);margin-bottom:.25rem;">💡 COACHING TIP</div>
        <div style="font-size:.8rem;line-height:1.5;color:rgba(240,244,255,.7);">${drill.coaching_tip}</div>
      </div>` : ''}

      <div style="display:flex;gap:.42rem;margin-top:.85rem;flex-wrap:wrap;">
        ${drill.duration ? `<span class="pill" style="background:var(--s2);border:1px solid var(--b2);">⏱ ${drill.duration}</span>` : ''}
        ${drill.equipment ? `<span class="pill" style="background:var(--s2);border:1px solid var(--b2);">🎽 ${drill.equipment}</span>` : ''}
        ${drill.category ? `<span class="pill" style="background:var(--s2);border:1px solid var(--b2);">${drill.category}</span>` : ''}
      </div>
    </div>

    <!-- Position drills -->
    ${positionDrills.length > 0 ? `
    <div style="font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--t2);margin-bottom:.6rem;">
      More drills for ${S.position || 'All Positions'}
    </div>
    <div style="display:flex;flex-direction:column;gap:.5rem;padding-bottom:1.5rem;">
      ${positionDrills.map(d => `
        <div onclick="expandDrill(this)" style="background:var(--s1);border:1px solid var(--b1);border-radius:12px;padding:.85rem;cursor:pointer;transition:all .14s;"
             onmouseenter="this.style.borderColor='var(--b2)'" onmouseleave="this.style.borderColor='var(--b1)'">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="font-weight:700;font-size:.88rem;">${d.title}</div>
            <span style="color:${diffColors[d.difficulty]||'var(--t2)'};font-size:.7rem;font-weight:700;">${diffLabels[d.difficulty]||''}</span>
          </div>
          <div style="font-size:.74rem;color:var(--t2);margin-top:.2rem;">${d.tagline || ''}</div>
          <div class="drill-expand" style="display:none;margin-top:.65rem;font-size:.82rem;line-height:1.6;color:rgba(240,244,255,.7);">${d.description || d.desc || ''}</div>
        </div>`).join('')}
    </div>` : ''}`;
};

window.expandDrill = function(el) {
  const exp = el.querySelector('.drill-expand');
  if (!exp) return;
  const open = exp.style.display !== 'none';
  exp.style.display = open ? 'none' : 'block';
  el.style.borderColor = open ? 'var(--b1)' : 'var(--lime)';
};

