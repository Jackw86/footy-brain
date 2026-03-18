// ============================================================
//  Footy Brain — app-v3.js
//  Position-variant question architecture
//  5-level per chapter system
//  New quiz engine + progress model
//  Hybrid intro (full screen first / slide-up repeat)
// ============================================================

'use strict';

// ══════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════

const STATE_KEY     = 'footybrain_v3';
const STATE_VERSION = 3;

const POSITIONS = ['Striker','Midfielder','Winger','Full-Back','Defender','Goalkeeper','All-Rounder'];

// The 5 levels inside every chapter
const CHAPTER_LEVELS = [
  { n:1, name:'Kickabout',  icon:'🌱', color:'#4ade80', bg:'rgba(74,222,128,.13)',  border:'rgba(74,222,128,.25)',  pass:4, xp:15,  cta:"I'm Ready →",   difficulty:[1],   desc:'Difficulty 1 questions only' },
  { n:2, name:'Training',   icon:'⚽', color:'#5edfff', bg:'rgba(94,223,255,.12)',  border:'rgba(94,223,255,.25)',  pass:4, xp:25,  cta:'Let\'s Train →', difficulty:[1,2], desc:'Difficulty 1-2 questions' },
  { n:3, name:'Academy',    icon:'🏫', color:'#ffb627', bg:'rgba(255,182,39,.12)',  border:'rgba(255,182,39,.25)',  pass:5, xp:40,  cta:'Start Academy →',difficulty:[2,3], desc:'Difficulty 2-3 questions' },
  { n:4, name:'Pro',        icon:'🎖️', color:'#f87171', bg:'rgba(248,113,113,.12)', border:'rgba(248,113,113,.25)', pass:5, xp:60,  cta:'Go Pro →',       difficulty:[3,4], desc:'Difficulty 3-4 questions' },
  { n:5, name:'Elite',      icon:'👑', color:'#fbbf24', bg:'rgba(251,191,36,.13)',  border:'rgba(251,191,36,.3)',   pass:6, xp:100, cta:'Bring It On →',  difficulty:[4],   desc:'Perfect score required — 6/6' },
];

const QUESTIONS_PER_LEVEL = 6;

// Zone definitions — which chapters unlock at which player level
const ZONE_DEFS = [
  { id:'grassroots', name:'GRASSROOTS',  emoji:'🌱', color:'#4ade80', bg:'rgba(74,222,128,.07)',  border:'rgba(74,222,128,.14)', unlockAt:1,  desc:'Foundations every footballer needs' },
  { id:'sunday',     name:'SUNDAY LEAGUE',emoji:'⚽', color:'#5edfff', bg:'rgba(94,223,255,.06)',  border:'rgba(94,223,255,.12)', unlockAt:3,  desc:'Technique sharpens · Position unlocks' },
  { id:'academy',    name:'ACADEMY',     emoji:'🏫', color:'#ffb627', bg:'rgba(255,182,39,.06)',  border:'rgba(255,182,39,.12)', unlockAt:5,  desc:'Tactics begin · Questions get harder' },
  { id:'reserve',    name:'RESERVE TEAM',emoji:'🎖️', color:'#f87171', bg:'rgba(248,113,113,.06)', border:'rgba(248,113,113,.1)', unlockAt:6,  desc:'Mental game unlocks · Tactics deepen' },
  { id:'semipro',    name:'SEMI-PRO',    emoji:'💼', color:'#9b7fff', bg:'rgba(155,127,255,.06)', border:'rgba(155,127,255,.1)', unlockAt:7,  desc:'Advanced tactics · Fitness science' },
  { id:'pro',        name:'PROFESSIONAL',emoji:'🏆', color:'#fbbf24', bg:'rgba(251,191,36,.06)',  border:'rgba(251,191,36,.1)', unlockAt:8,  desc:'Analytics · Scouting · The deep end' },
];

// XP thresholds per player level (10 levels)
const XP_LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];
const LEVEL_TITLES = [
  '', 'Grassroots Hero', 'Sunday League Regular', 'Reserve Team Player',
  'Academy Graduate', 'Semi-Pro', 'Professional', 'International',
  'Elite', 'World Class', 'Living Legend',
];

// ══════════════════════════════════════════════════════════════
//  DEFAULT STATE
// ══════════════════════════════════════════════════════════════

const DEFAULT_STATE = {
  version: STATE_VERSION,
  name: '',
  position: '',
  xp: 0,
  streak: 0,
  lastLogin: '',

  // New 5-level chapter progress
  // { chapterId: { lvl1: {done,bestScore,attempts}, lvl2: {...}, ... } }
  chapterProgress: {},

  // Legacy (kept for migration)
  completedChapters: [],
  masteredChapters:  [],
  quizScores:        {},
  quizAttempts:      {},

  gameHighScores:          {},
  fastAnswers:             0,
  dailyChallengesCompleted:0,
  lastDailyDate:           '',
  badges:                  [],

  // Hearts
  hearts:          5,
  heartRegenStart: null,

  // Pack / prize system
  collection:      [],
  totalAttempts:   0,
  sinceLastRare:   0,
  powerUps:        {},

  // Pro
  isPro:      false,
  proExpires: null,

  // Seen level intros (for hybrid intro logic)
  // { 'f1_2': true } = chapter f1 level 2 has been seen
  seenIntros: {},

  // Spaced repetition
  questionHistory: {},

  settings: {
    darkMode:       true,
    sound:          true,
    reducedMotion:  false,
  },
};

let S = { ...DEFAULT_STATE };

// ══════════════════════════════════════════════════════════════
//  PERSISTENCE
// ══════════════════════════════════════════════════════════════

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);

    if (!parsed.version || parsed.version < STATE_VERSION) {
      // Migrate from v2: map quizScores → chapterProgress
      S = { ...DEFAULT_STATE, ...parsed, version: STATE_VERSION };
      migrateFromV2(parsed);
    } else {
      S = { ...DEFAULT_STATE, ...parsed };
    }
  } catch (e) {
    console.warn('State load failed, using defaults');
  }
}

function migrateFromV2(old) {
  // Convert old flat quizScores to new chapterProgress with lvl1 complete
  if (old.quizScores) {
    Object.entries(old.quizScores).forEach(([id, score]) => {
      if (!S.chapterProgress[id]) S.chapterProgress[id] = {};
      // If they had a passing score, mark lvl1 done
      if (score > 0) {
        S.chapterProgress[id].lvl1 = { done: true, bestScore: Math.min(score, 6), attempts: 1 };
      }
    });
  }
  saveState();
}

function saveState() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(S)); }
  catch (e) { console.warn('State save failed'); }
}

function resetState() {
  const kept = { name: S.name, position: S.position, settings: { ...S.settings } };
  S = { ...DEFAULT_STATE, ...kept };
  saveState();
}

// ══════════════════════════════════════════════════════════════
//  XP & LEVELLING
// ══════════════════════════════════════════════════════════════

function getLevelFromXP(xp) {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i]) return i + 1;
  }
  return 1;
}

function getLevelProgress(xp) {
  const lv = getLevelFromXP(xp);
  if (lv >= XP_LEVELS.length) return 100;
  const start = XP_LEVELS[lv - 1], end = XP_LEVELS[lv];
  return Math.round((xp - start) / (end - start) * 100);
}

function getXPToNext(xp) {
  const lv = getLevelFromXP(xp);
  if (lv >= XP_LEVELS.length) return 0;
  return XP_LEVELS[lv] - xp;
}

function getLevelTitle(xp) {
  return LEVEL_TITLES[getLevelFromXP(xp)] || 'Legend';
}

function getXPMultiplier() {
  if (S.streak >= 7)  return 1.5;
  if (S.streak >= 3)  return 1.25;
  if (hasPro())       return 2;
  return 1;
}

function addXP(amount) {
  const mult   = getXPMultiplier();
  const actual = Math.round(amount * mult);
  if (actual <= 0) return;
  const lvBefore = getLevelFromXP(S.xp);
  S.xp += actual;
  const lvAfter  = getLevelFromXP(S.xp);
  saveState();
  spawnFloatingXP(actual);
  if (lvAfter > lvBefore) {
    playLevelUp();
    setTimeout(() => showLevelUpModal(lvAfter), 700);
  }
  checkBadges();
  return actual;
}

// ══════════════════════════════════════════════════════════════
//  CHAPTER PROGRESS (5-LEVEL SYSTEM)
// ══════════════════════════════════════════════════════════════

function getChapterLevelProgress(chapterId) {
  return S.chapterProgress[chapterId] || {};
}

function getLevelData(chapterId, levelNum) {
  const prog = getChapterLevelProgress(chapterId);
  return prog[`lvl${levelNum}`] || { done: false, bestScore: 0, attempts: 0 };
}

function isLevelComplete(chapterId, levelNum) {
  return getLevelData(chapterId, levelNum).done === true;
}

function isLevelUnlocked(chapterId, levelNum) {
  if (levelNum === 1) return true;  // Level 1 always unlocked if chapter is
  return isLevelComplete(chapterId, levelNum - 1);
}

// How many levels are done in a chapter (0-5)
function levelsCompleted(chapterId) {
  let count = 0;
  for (let n = 1; n <= 5; n++) {
    if (isLevelComplete(chapterId, n)) count++;
  }
  return count;
}

// Chapter node state for path rendering
function chapterNodeState(chapterId) {
  const done = levelsCompleted(chapterId);
  if (done === 0) return 'idle';
  if (done === 5) return 'mastered';
  return 'active';  // in progress
}

// Mark a level as complete / update best score
function recordLevelResult(chapterId, levelNum, score) {
  if (!S.chapterProgress[chapterId]) S.chapterProgress[chapterId] = {};
  const key  = `lvl${levelNum}`;
  const prev = S.chapterProgress[chapterId][key] || { done: false, bestScore: 0, attempts: 0 };
  const def  = CHAPTER_LEVELS[levelNum - 1];
  const done = score >= def.pass;

  S.chapterProgress[chapterId][key] = {
    done:      done || prev.done,
    bestScore: Math.max(score, prev.bestScore),
    attempts:  prev.attempts + 1,
  };

  // Legacy compat
  if (done && !S.completedChapters.includes(chapterId)) {
    S.completedChapters.push(chapterId);
  }
  if (levelsCompleted(chapterId) === 5 && !S.masteredChapters.includes(chapterId)) {
    S.masteredChapters.push(chapterId);
  }

  saveState();
  return done;
}

// ══════════════════════════════════════════════════════════════
//  QUESTION POOL BUILDER
//
//  New chapter format:
//  chapter.questions can be:
//    A) LEGACY: flat array (all positions share same questions)
//    B) NEW: object with position keys:
//       { core: [...], Striker: [...], Midfielder: [...], ... }
//
//  Pool for a level is built as:
//    - 2 questions from core pool (filtered by level difficulty)
//    - 2 from player's position pool
//    - 2 from random other positions
//    Total: 6 questions per level
// ══════════════════════════════════════════════════════════════

function buildQuestionPool(chapter, position, levelNum) {
  const levelDef = CHAPTER_LEVELS[levelNum - 1];
  const diffs    = levelDef.difficulty;  // e.g. [1,2]

  const qs = chapter.questions;

  // Legacy flat array — treat all as core, filter by difficulty
  if (Array.isArray(qs)) {
    const filtered = qs.filter(q => {
      if (!q.difficulty) return true;  // untagged: include in all levels
      return diffs.includes(q.difficulty);
    });
    // Shuffle and take 6
    return shuffleArray(filtered).slice(0, QUESTIONS_PER_LEVEL).map(shuffleQuestion);
  }

  // New object format
  const core    = (qs.core    || []).filter(q => matchesDifficulty(q, diffs));
  const posPool = (qs[position] || []).filter(q => matchesDifficulty(q, diffs));

  // Other positions (sample randomly)
  const otherPositions = POSITIONS.filter(p => p !== position && p !== 'All-Rounder');
  const others = shuffleArray(
    otherPositions.flatMap(p => (qs[p] || []).filter(q => matchesDifficulty(q, diffs)))
  );

  // Build pool: 2 core + 2 position + 2 others (fill gaps from any available)
  let pool = [];
  pool.push(...shuffleArray(core).slice(0, 2));
  pool.push(...shuffleArray(posPool).slice(0, 2));
  pool.push(...others.slice(0, 2));

  // If we're short (e.g. legacy data), fill from whatever's available
  if (pool.length < QUESTIONS_PER_LEVEL) {
    const all = shuffleArray([...core, ...posPool, ...others]);
    const existing = new Set(pool.map(q => q.q));
    for (const q of all) {
      if (pool.length >= QUESTIONS_PER_LEVEL) break;
      if (!existing.has(q.q)) { pool.push(q); existing.add(q.q); }
    }
  }

  // If STILL short, allow repeats from core
  if (pool.length < QUESTIONS_PER_LEVEL && core.length > 0) {
    while (pool.length < QUESTIONS_PER_LEVEL) {
      pool.push(core[pool.length % core.length]);
    }
  }

  return pool.slice(0, QUESTIONS_PER_LEVEL).map(shuffleQuestion);
}

function matchesDifficulty(q, diffs) {
  if (!q.difficulty) return true;  // untagged: include everywhere
  return diffs.includes(q.difficulty);
}

// Shuffle answer options, keeping correct answer tracked by content
function shuffleQuestion(q) {
  const correctText = q.opts[q.a];
  const shuffled    = shuffleArray([...q.opts]);
  return {
    ...q,
    opts: shuffled,
    a:    shuffled.indexOf(correctText),
  };
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════
//  HEARTS SYSTEM
// ══════════════════════════════════════════════════════════════

const MAX_HEARTS    = 5;
const HEART_REGEN_MS = 30 * 60 * 1000;  // 30 minutes per heart

function getHearts() {
  if (hasPro()) return MAX_HEARTS;  // Pro = unlimited
  if (S.hearts >= MAX_HEARTS) return MAX_HEARTS;

  // Check regen
  if (S.heartRegenStart) {
    const elapsed = Date.now() - S.heartRegenStart;
    const regened = Math.floor(elapsed / HEART_REGEN_MS);
    if (regened > 0) {
      S.hearts = Math.min(MAX_HEARTS, S.hearts + regened);
      S.heartRegenStart = S.hearts < MAX_HEARTS
        ? S.heartRegenStart + (regened * HEART_REGEN_MS)
        : null;
      saveState();
    }
  }

  return S.hearts;
}

function loseHeart() {
  if (hasPro()) return;  // Pro = no heart loss
  S.hearts = Math.max(0, (S.hearts || MAX_HEARTS) - 1);
  if (!S.heartRegenStart) S.heartRegenStart = Date.now();
  saveState();

  if (S.hearts === 0) {
    showNoHeartsModal();
  }
}

function getHeartRegenText() {
  if (!S.heartRegenStart) return '';
  const elapsed   = Date.now() - S.heartRegenStart;
  const remaining = HEART_REGEN_MS - (elapsed % HEART_REGEN_MS);
  const mins = Math.ceil(remaining / 60000);
  return `Next heart in ${mins} min`;
}

function showNoHeartsModal() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:1000;
    display:flex;align-items:center;justify-content:center;padding:1.5rem;`;
  overlay.innerHTML = `
    <div style="background:#0a1020;border:1px solid rgba(255,94,138,.25);border-radius:24px;
         padding:2rem;text-align:center;max-width:340px;width:100%;">
      <div style="font-size:3.5rem;margin-bottom:.5rem;">💔</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#ff5e8a;margin-bottom:.4rem;">
        Out of Hearts!
      </h2>
      <p style="font-size:.88rem;color:rgba(240,244,255,.5);margin-bottom:.3rem;">
        ${getHeartRegenText()}
      </p>
      <p style="font-size:.82rem;color:rgba(240,244,255,.4);margin-bottom:1.25rem;">
        Hearts refill automatically. Pro players never run out.
      </p>
      <div style="display:flex;flex-direction:column;gap:.5rem;">
        <button onclick="this.closest('div[style]').remove()" style="
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
          color:#f0f4ff;font-family:'DM Sans',sans-serif;font-weight:700;
          font-size:.9rem;padding:.85rem;border-radius:12px;cursor:pointer;">
          Wait for Regen ⏱️
        </button>
        <button onclick="this.closest('div[style]').remove();showProModal()" style="
          background:linear-gradient(135deg,#fbbf24,#d97706);color:#000;
          border:none;font-family:'DM Sans',sans-serif;font-weight:900;
          font-size:.9rem;padding:.85rem;border-radius:12px;cursor:pointer;">
          ⭐ Go Pro — Never Lose Hearts
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

// ══════════════════════════════════════════════════════════════
//  PRO SYSTEM
// ══════════════════════════════════════════════════════════════

function hasPro() {
  if (!S.isPro) return false;
  if (!S.proExpires) return true;  // lifetime
  return Date.now() < S.proExpires;
}

function grantPro(durationMs) {
  S.isPro      = true;
  S.proExpires = durationMs ? Date.now() + durationMs : null;
  S.hearts     = MAX_HEARTS;
  saveState();
}

function showProModal() {
  showToast('Pro upgrade screen — coming in full build! ⭐');
}

// ══════════════════════════════════════════════════════════════
//  STREAK
// ══════════════════════════════════════════════════════════════

function checkStreak() {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const grace     = new Date(Date.now() - 26 * 3600000).toDateString();
  if (S.lastLogin === today) return;
  if (S.lastLogin === yesterday || S.lastLogin === grace) S.streak += 1;
  else if (!S.lastLogin) S.streak = 1;
  else S.streak = 1;
  S.lastLogin = today;
  saveState();
}

// ══════════════════════════════════════════════════════════════
//  SEEN INTROS (hybrid intro logic)
// ══════════════════════════════════════════════════════════════

function hasSeenIntro(chapterId, levelNum) {
  return !!(S.seenIntros && S.seenIntros[`${chapterId}_${levelNum}`]);
}

function markIntroSeen(chapterId, levelNum) {
  if (!S.seenIntros) S.seenIntros = {};
  S.seenIntros[`${chapterId}_${levelNum}`] = true;
  saveState();
}

// ══════════════════════════════════════════════════════════════
//  QUIZ ENGINE — STATE
// ══════════════════════════════════════════════════════════════

let QZ = {
  chapter:   null,
  levelNum:  1,
  questions: [],
  index:     0,
  score:     0,
  startTime: 0,
  fastCount: 0,
  isDaily:   false,
};

// ──────────────────────────────────────────────────────────────
//  Start a chapter level quiz
// ──────────────────────────────────────────────────────────────
function startChapterLevel(chapterId, levelNum) {
  const ch = getChapterById(chapterId);
  if (!ch) return;

  // Check hearts
  if (getHearts() <= 0) {
    showNoHeartsModal();
    return;
  }

  // Mark intro as seen
  markIntroSeen(chapterId, levelNum);

  const questions = buildQuestionPool(ch, S.position, levelNum);

  QZ = {
    chapter:   ch,
    levelNum,
    questions,
    index:     0,
    score:     0,
    startTime: 0,
    fastCount: 0,
    isDaily:   false,
  };

  showScreen('quiz-screen');
  renderQuizHeader();
  renderQuestion();
}

// ──────────────────────────────────────────────────────────────
//  Start daily challenge
// ──────────────────────────────────────────────────────────────
function startDailyQuiz() {
  const questions = getDailyQuestions(5);
  QZ = {
    chapter:   null,
    levelNum:  null,
    questions,
    index:     0,
    score:     0,
    startTime: 0,
    fastCount: 0,
    isDaily:   true,
  };
  showScreen('quiz-screen');
  renderQuizHeader();
  renderQuestion();
}

// ──────────────────────────────────────────────────────────────
//  Render quiz header
// ──────────────────────────────────────────────────────────────
function renderQuizHeader() {
  const { chapter, levelNum, isDaily, questions } = QZ;
  const lvDef = levelNum ? CHAPTER_LEVELS[levelNum - 1] : null;

  const titleEl = elId('quizChapterTitle');
  if (titleEl) {
    titleEl.textContent = isDaily
      ? '📅 Daily Challenge'
      : chapter
        ? `${chapter.emoji} ${chapter.title}${lvDef ? ` · ${lvDef.icon} ${lvDef.name}` : ''}`
        : '';
  }

  const totalEl = elId('qTotal');
  if (totalEl) totalEl.textContent = questions.length;
}

// ──────────────────────────────────────────────────────────────
//  Render a question
// ──────────────────────────────────────────────────────────────
function renderQuestion() {
  const { questions, index, levelNum, isDaily } = QZ;
  const q = questions[index];
  if (!q) { finishQuiz(); return; }

  QZ.startTime = Date.now();

  const total   = questions.length;
  const progPct = Math.round(index / total * 100);
  const lvDef   = levelNum ? CHAPTER_LEVELS[levelNum - 1] : null;

  elId('qNum')         && (elId('qNum').textContent = index + 1);
  elId('quizProgress') && (elId('quizProgress').style.width = progPct + '%');

  // Hearts display
  const heartsEl = elId('quizHearts');
  if (heartsEl) {
    const h = getHearts();
    heartsEl.innerHTML = [1,2,3,4,5].map(i =>
      `<span style="font-size:.8rem;${i > h ? 'opacity:.2;filter:grayscale(1);' : ''}">❤️</span>`
    ).join('');
  }

  const diffLabels = ['', '🟢', '🔵', '🟠', '🔴'];
  const diff = q.difficulty ? diffLabels[q.difficulty] || '' : '';

  const area = elId('quiz-area');
  if (!area) return;

  area.innerHTML = `
    <div class="glass anim-slide" style="padding:1.2rem;margin-bottom:.82rem;">
      ${diff ? `<div style="font-size:.7rem;color:var(--t2);margin-bottom:.35rem;">${diff} Difficulty ${q.difficulty}</div>` : ''}
      <div style="font-size:1.05rem;font-weight:700;line-height:1.5;">${q.q}</div>
    </div>
    <div id="options" style="display:flex;flex-direction:column;gap:.48rem;">
      ${q.opts.map((opt, i) => `
        <button class="qopt" id="opt-${i}" onclick="selectAnswer(${i})" style="
          width:100%;padding:.85rem .92rem;
          background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.08);
          border-radius:12px;color:#f0f4ff;
          font-family:'DM Sans',sans-serif;font-size:.875rem;font-weight:500;
          text-align:left;cursor:pointer;
          display:flex;align-items:center;gap:.65rem;
          transition:all .13s;-webkit-tap-highlight-color:transparent;">
          <span style="min-width:22px;height:22px;border-radius:7px;
            background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
            display:flex;align-items:center;justify-content:center;
            font-size:.68rem;font-weight:800;color:rgba(240,244,255,.5);flex-shrink:0;">
            ${String.fromCharCode(65 + i)}
          </span>
          <span>${opt}</span>
        </button>`).join('')}
    </div>
    <div id="quiz-feedback" style="margin-top:.88rem;"></div>
    <div id="quiz-next"     style="margin-top:.65rem;"></div>`;
}

// ──────────────────────────────────────────────────────────────
//  Select an answer
// ──────────────────────────────────────────────────────────────
function selectAnswer(idx) {
  const { questions, index, chapter, levelNum } = QZ;
  const q = questions[index];
  if (!q) return;

  // Disable all
  document.querySelectorAll('.qopt').forEach(b => {
    b.disabled = true;
    b.style.cursor = 'not-allowed';
  });

  const correct = idx === q.a;
  const elapsed = (Date.now() - QZ.startTime) / 1000;
  const fast    = elapsed < 4 && correct;

  // Visual feedback on buttons
  const optBtn = elId(`opt-${idx}`);
  const corBtn = elId(`opt-${q.a}`);

  if (optBtn) {
    if (correct) {
      optBtn.style.borderColor = '#b8ff57';
      optBtn.style.background  = 'rgba(184,255,87,.07)';
      optBtn.querySelector('span').style.background = '#b8ff57';
      optBtn.querySelector('span').style.color      = '#000';
    } else {
      optBtn.style.borderColor = '#ff5e8a';
      optBtn.style.background  = 'rgba(255,94,138,.07)';
      optBtn.style.animation   = 'shake .35s ease';
    }
  }
  if (!correct && corBtn) {
    corBtn.style.borderColor = '#b8ff57';
    corBtn.style.background  = 'rgba(184,255,87,.07)';
  }

  // Sound
  correct ? playCorrect() : playWrong();

  // Lose a heart on wrong
  if (!correct) loseHeart();

  // Track score
  if (correct) QZ.score++;
  if (fast)    QZ.fastCount++;

  // Spaced repetition
  if (chapter) {
    const key = `${chapter.id}_${questions.indexOf(q)}`;
    if (!S.questionHistory) S.questionHistory = {};
    if (!S.questionHistory[key]) S.questionHistory[key] = { correct: 0, incorrect: 0 };
    S.questionHistory[key][correct ? 'correct' : 'incorrect']++;
  }

  // Feedback card
  const fb = elId('quiz-feedback');
  if (fb) {
    fb.innerHTML = `
      <div class="anim-slide" style="padding:.88rem;border-radius:12px;
           background:${correct ? 'rgba(184,255,87,.07)' : 'rgba(255,94,138,.07)'};
           border:1px solid ${correct ? 'rgba(184,255,87,.2)' : 'rgba(255,94,138,.2)'};">
        <div style="font-weight:700;margin-bottom:.25rem;
             color:${correct ? '#b8ff57' : '#ff5e8a'};">
          ${correct ? '✅ Correct!' : '❌ Not quite...'}
          ${fast ? '<span style="color:#ffb627;font-size:.75rem;margin-left:.35rem;">⚡ Fast!</span>' : ''}
          ${!correct ? `<span style="font-size:.75rem;color:rgba(240,244,255,.4);margin-left:.35rem;">❤️ -1 heart</span>` : ''}
        </div>
        <div style="font-size:.84rem;color:rgba(240,244,255,.5);line-height:1.5;">${q.exp}</div>
      </div>`;
  }

  const isLast = index >= questions.length - 1;
  const nextEl = elId('quiz-next');
  if (nextEl) {
    nextEl.innerHTML = `
      <button class="anim-slide" onclick="${isLast ? 'finishQuiz()' : 'nextQuestion()'}" style="
        width:100%;padding:.88rem;border:none;border-radius:13px;
        background:${isLast ? 'var(--lime)' : 'rgba(255,255,255,.07)'};
        color:${isLast ? '#000' : '#f0f4ff'};
        font-family:'DM Sans',sans-serif;font-weight:900;font-size:.92rem;
        cursor:pointer;transition:all .14s;">
        ${isLast ? 'See Results 🏆' : 'Next →'}
      </button>`;
  }
}

function nextQuestion() {
  QZ.index++;
  renderQuestion();
}

// ──────────────────────────────────────────────────────────────
//  Finish quiz
// ──────────────────────────────────────────────────────────────
function finishQuiz() {
  const { chapter, levelNum, questions, score, fastCount, isDaily } = QZ;
  const total  = questions.length;
  const pct    = Math.round(score / total * 100);
  const lvDef  = levelNum ? CHAPTER_LEVELS[levelNum - 1] : null;

  // Record results
  let levelPassed = false;
  if (isDaily) {
    S.dailyChallengesCompleted = (S.dailyChallengesCompleted || 0) + 1;
    S.lastDailyDate = new Date().toDateString();
  } else if (chapter && levelNum) {
    levelPassed = recordLevelResult(chapter.id, levelNum, score);
  }

  S.fastAnswers = (S.fastAnswers || 0) + fastCount;
  saveState();
  checkBadges();

  // XP
  const baseXP  = isDaily ? 50 : (lvDef ? lvDef.xp : 20);
  const earnXP  = Math.round(baseXP * (score / total));
  const bonusXP = levelPassed ? Math.round(baseXP * 0.5) : 0;
  const totalXP = addXP(earnXP + bonusXP) || (earnXP + bonusXP);

  if (pct === 100) {
    confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 } });
    playGoal();
  }

  // Results UI
  elId('quizProgress') && (elId('quizProgress').style.width = '100%');
  elId('qNum')         && (elId('qNum').textContent = total);

  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= (lvDef ? lvDef.pass/6*100 : 60) ? '👍' : '💪';
  const msg   = pct === 100 ? 'PERFECT!'
    : levelPassed ? 'LEVEL COMPLETE!'
    : pct >= 80   ? 'GREAT WORK!'
    : 'KEEP GOING!';

  const area = elId('quiz-area');
  if (!area) return;

  // Determine next action
  const nextLevelNum   = levelNum && levelNum < 5 ? levelNum + 1 : null;
  const nextLevelUnlocked = nextLevelNum && chapter && isLevelUnlocked(chapter.id, nextLevelNum);

  area.innerHTML = `
    <div style="text-align:center;padding:1rem 0;" class="anim-slide">
      <div style="font-size:4.5rem;margin-bottom:.5rem;">${emoji}</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2.6rem;
          color:${levelPassed ? 'var(--lime)' : 'var(--amber)'};line-height:1;">
        ${score}/${total}
      </h2>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;
          color:rgba(240,244,255,.45);margin-bottom:.85rem;">${msg}</div>

      <!-- XP pills -->
      <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-bottom:1.25rem;">
        <div class="glass2" style="padding:.55rem .9rem;text-align:center;">
          <div style="font-weight:900;color:var(--lime);">+${earnXP} XP</div>
          <div style="font-size:.66rem;color:rgba(240,244,255,.4);">Earned</div>
        </div>
        ${bonusXP > 0 ? `
        <div class="glass2" style="padding:.55rem .9rem;text-align:center;">
          <div style="font-weight:900;color:var(--amber);">+${bonusXP}</div>
          <div style="font-size:.66rem;color:rgba(240,244,255,.4);">Level bonus</div>
        </div>` : ''}
      </div>

      <!-- Level complete badge -->
      ${levelPassed && lvDef ? `
      <div style="background:${lvDef.bg};border:1px solid ${lvDef.border};
           border-radius:99px;padding:.4rem 1rem;display:inline-flex;
           align-items:center;gap:.4rem;margin-bottom:1rem;
           font-size:.8rem;font-weight:700;color:${lvDef.color};">
        ${lvDef.icon} Level ${lvDef.n} — ${lvDef.name} Complete!
      </div>` : ''}

      <!-- Failed level note -->
      ${!levelPassed && levelNum ? `
      <p style="color:var(--amber);font-size:.82rem;margin-bottom:1rem;">
        Score ${lvDef ? lvDef.pass : 4}/${total} to complete this level
      </p>` : ''}

      <div style="display:flex;flex-direction:column;gap:.5rem;">
        <!-- Next level if unlocked -->
        ${nextLevelUnlocked && levelPassed ? `
        <button onclick="openLevelIntro('${chapter.id}', ${nextLevelNum})" style="
          width:100%;padding:.88rem;border:none;border-radius:13px;
          background:linear-gradient(135deg,${CHAPTER_LEVELS[nextLevelNum-1].color},${CHAPTER_LEVELS[nextLevelNum-1].color}bb);
          color:#000;font-family:'DM Sans',sans-serif;font-weight:900;font-size:.95rem;cursor:pointer;">
          ${CHAPTER_LEVELS[nextLevelNum-1].icon} Start Level ${nextLevelNum} — ${CHAPTER_LEVELS[nextLevelNum-1].name} →
        </button>` : ''}

        <!-- Retry -->
        ${chapter && levelNum ? `
        <button onclick="openLevelIntro('${chapter.id}', ${levelNum})" style="
          width:100%;padding:.88rem;border:1.5px solid rgba(255,255,255,.1);border-radius:13px;
          background:rgba(255,255,255,.05);color:#f0f4ff;
          font-family:'DM Sans',sans-serif;font-weight:700;font-size:.88rem;cursor:pointer;">
          ${levelPassed ? 'Replay 🔄' : 'Retry 💪'}
        </button>` : ''}

        <button onclick="goHome()" style="
          width:100%;padding:.88rem;border:1px solid rgba(255,255,255,.07);border-radius:13px;
          background:transparent;color:rgba(240,244,255,.4);
          font-family:'DM Sans',sans-serif;font-weight:600;font-size:.84rem;cursor:pointer;">
          ← Back to Path
        </button>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════
//  LEVEL INTRO (full screen first time / slide-up repeat)
// ══════════════════════════════════════════════════════════════

function openLevelIntro(chapterId, levelNum) {
  const ch    = getChapterById(chapterId);
  if (!ch) return;
  const lvDef = CHAPTER_LEVELS[levelNum - 1];

  // Check if chapter is unlocked at the player's current level
  // (basic check — full implementation in path renderer)
  if (getHearts() <= 0) {
    showNoHeartsModal();
    return;
  }

  const firstTime = !hasSeenIntro(chapterId, levelNum);

  if (firstTime) {
    showFullIntro(ch, levelNum, lvDef);
  } else {
    showSlideIntro(ch, levelNum, lvDef);
  }
}

// ── FULL SCREEN intro ──
function showFullIntro(ch, levelNum, lvDef) {
  const existing = document.getElementById('fullIntroOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'fullIntroOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:200;
    background:#05080f;
    display:flex;flex-direction:column;overflow:hidden;`;

  const learns = ch.levelIntros?.[levelNum] || getDefaultLearns(ch, levelNum, lvDef);
  const quote  = ch.levelQuotes?.[levelNum] || getDefaultQuote(ch, levelNum, lvDef);

  overlay.innerHTML = `
    <!-- Glow blob -->
    <div style="position:absolute;top:-100px;left:50%;transform:translateX(-50%);
         width:320px;height:320px;border-radius:50%;pointer-events:none;
         background:radial-gradient(circle,${lvDef.bg.replace('rgba(','').replace(/,.+\)/,',.4)')},transparent 70%);
         filter:blur(60px);"></div>

    <!-- Back button -->
    <button onclick="document.getElementById('fullIntroOverlay').remove()" style="
      position:absolute;top:1rem;left:1.1rem;z-index:10;
      background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
      color:rgba(240,244,255,.5);font-family:'DM Sans',sans-serif;
      font-size:.78rem;font-weight:600;padding:.38rem .82rem;
      border-radius:99px;cursor:pointer;">← Path</button>

    <!-- Scroll body -->
    <div style="flex:1;overflow-y:auto;scrollbar-width:none;position:relative;z-index:1;">

      <!-- Hero -->
      <div style="display:flex;flex-direction:column;align-items:center;
           text-align:center;padding:3rem 1.5rem 1.25rem;">

        <div style="display:inline-flex;align-items:center;gap:.32rem;
             padding:.26rem .78rem;border-radius:99px;
             background:${lvDef.bg};border:1px solid ${lvDef.border};
             color:${lvDef.color};font-size:.65rem;font-weight:800;
             letter-spacing:.08em;margin-bottom:.9rem;">
          ✨ First time here
        </div>

        <div style="font-size:5.5rem;line-height:1;margin-bottom:.8rem;
             animation:artbob 3s ease-in-out infinite;
             filter:drop-shadow(0 0 24px ${lvDef.color}55);">
          ${ch.emoji}
        </div>

        <div style="font-family:'Bebas Neue',sans-serif;font-size:2.4rem;line-height:1;
             margin-bottom:.22rem;
             background:linear-gradient(135deg,${lvDef.color},#f0f4ff);
             -webkit-background-clip:text;-webkit-text-fill-color:transparent;
             background-clip:text;">
          ${ch.title}
        </div>

        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.15rem;
             letter-spacing:.08em;color:${lvDef.color};margin-bottom:.85rem;">
          ${lvDef.icon} Level ${lvDef.n} — ${lvDef.name}
        </div>

        <div style="font-size:.88rem;line-height:1.65;color:rgba(240,244,255,.48);
             font-style:italic;max-width:320px;padding:.75rem 1rem;
             background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
             border-radius:14px;">
          ${quote}
        </div>
      </div>

      <!-- Body -->
      <div style="padding:0 1.25rem 2rem;">

        <div style="font-size:.63rem;font-weight:700;letter-spacing:.1em;
             text-transform:uppercase;color:rgba(240,244,255,.4);margin-bottom:.5rem;">
          What you'll cover
        </div>

        <div style="display:flex;flex-direction:column;gap:.38rem;margin-bottom:1rem;">
          ${learns.map(l => `
            <div style="display:flex;align-items:flex-start;gap:.6rem;
                 padding:.65rem .85rem;border-radius:12px;
                 background:${lvDef.bg};border:1px solid ${lvDef.border};
                 font-size:.84rem;line-height:1.45;">
              <span style="color:${lvDef.color};flex-shrink:0;margin-top:.05rem;">✓</span>
              <span style="color:rgba(240,244,255,.8);">${l}</span>
            </div>`).join('')}
        </div>

        <!-- Meta pills -->
        <div style="display:flex;gap:.42rem;margin-bottom:1.25rem;flex-wrap:wrap;">
          <div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
               padding:.28rem .72rem;border-radius:99px;font-size:.7rem;font-weight:700;">
            📝 ${QUESTIONS_PER_LEVEL} questions
          </div>
          <div style="background:${lvDef.bg};border:1px solid ${lvDef.border};
               padding:.28rem .72rem;border-radius:99px;font-size:.7rem;font-weight:700;color:${lvDef.color};">
            ✓ Pass: ${lvDef.pass}/${QUESTIONS_PER_LEVEL}
          </div>
          <div style="background:${lvDef.bg};border:1px solid ${lvDef.border};
               padding:.28rem .72rem;border-radius:99px;font-size:.7rem;font-weight:700;color:${lvDef.color};">
            +${lvDef.xp} XP
          </div>
        </div>

        <!-- CTA -->
        <button onclick="document.getElementById('fullIntroOverlay').remove();startChapterLevel('${ch.id}', ${lvDef.n})" style="
          width:100%;padding:1.05rem;border:none;border-radius:14px;
          background:linear-gradient(135deg,${lvDef.color},${lvDef.color}bb);
          color:#000;font-family:'DM Sans',sans-serif;font-weight:900;font-size:1rem;
          cursor:pointer;position:relative;overflow:hidden;transition:all .14s;">
          ${lvDef.cta}
          <span style="position:absolute;top:0;left:-100%;width:100%;height:100%;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);
            animation:sweep 2.5s ease-in-out infinite;"></span>
        </button>

      </div>
    </div>`;

  // Inject sweep keyframe
  if (!document.getElementById('sweep-style')) {
    const s = document.createElement('style');
    s.id = 'sweep-style';
    s.textContent = `
      @keyframes sweep{0%{left:-100%}60%,100%{left:100%}}
      @keyframes artbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`;
    document.head.appendChild(s);
  }

  document.body.appendChild(overlay);
}

// ── SLIDE-UP card intro (repeat visits) ──
function showSlideIntro(ch, levelNum, lvDef) {
  const existing = document.getElementById('slideIntroOverlay');
  if (existing) existing.remove();

  const learns = ch.levelIntros?.[levelNum] || getDefaultLearns(ch, levelNum, lvDef);
  const quote  = ch.levelQuotes?.[levelNum] || getDefaultQuote(ch, levelNum, lvDef);
  const lvData = getLevelData(ch.id, levelNum);

  const overlay = document.createElement('div');
  overlay.id = 'slideIntroOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:200;
    display:flex;align-items:flex-end;justify-content:center;
    padding:1rem;background:rgba(0,0,0,.6);
    backdrop-filter:blur(6px);`;

  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div style="width:100%;max-width:420px;
         background:#0a1425;border:1px solid rgba(255,255,255,.13);
         border-radius:24px 24px 20px 20px;overflow:hidden;
         animation:sheetUp .38s cubic-bezier(.34,1.2,.64,1) both;
         max-height:84vh;overflow-y:auto;scrollbar-width:none;">

      <div style="width:40px;height:4px;border-radius:99px;
           background:rgba(255,255,255,.13);margin:1rem auto .85rem;"></div>

      <!-- Top -->
      <div style="display:flex;align-items:center;gap:.88rem;padding:0 1.25rem .82rem;">
        <div style="width:58px;height:58px;border-radius:18px;flex-shrink:0;
             background:${lvDef.bg};border:1.5px solid ${lvDef.border};
             display:flex;align-items:center;justify-content:center;font-size:2.1rem;">
          ${ch.emoji}
        </div>
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.55rem;line-height:1;">
            ${ch.title}
          </div>
          <div style="display:inline-flex;align-items:center;gap:.26rem;
               padding:.17rem .58rem;border-radius:99px;margin-top:.22rem;
               background:${lvDef.bg};border:1px solid ${lvDef.border};
               color:${lvDef.color};font-size:.65rem;font-weight:800;letter-spacing:.05em;">
            ${lvDef.icon} Level ${lvDef.n} — ${lvDef.name}
          </div>
        </div>
      </div>

      <!-- Previous attempt note -->
      ${lvData.attempts > 0 ? `
      <div style="margin:0 1.25rem .75rem;padding:.58rem .85rem;
           background:rgba(184,255,87,.07);border:1px solid rgba(184,255,87,.15);
           border-radius:10px;font-size:.78rem;color:rgba(240,244,255,.5);
           display:flex;align-items:center;gap:.45rem;">
        <span>✅</span>
        <span>Best score: ${lvData.bestScore}/${QUESTIONS_PER_LEVEL} · ${lvData.attempts} attempt${lvData.attempts > 1 ? 's' : ''}</span>
      </div>` : ''}

      <!-- Quote -->
      <div style="margin:0 1.25rem .82rem;padding:.72rem .9rem;
           background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
           border-radius:12px;font-style:italic;
           font-size:.84rem;line-height:1.55;color:rgba(240,244,255,.48);">
        ${quote}
      </div>

      <!-- Learns (compact — 3 only) -->
      <div style="padding:0 1.25rem .82rem;">
        ${learns.slice(0, 3).map(l => `
          <div style="display:flex;align-items:center;gap:.5rem;
               font-size:.81rem;color:rgba(240,244,255,.48);
               padding:.28rem 0;border-bottom:1px solid rgba(255,255,255,.06);">
            <span style="color:${lvDef.color};flex-shrink:0;">✓</span>
            <span>${l}</span>
          </div>`).join('')}
      </div>

      <!-- Meta -->
      <div style="display:flex;gap:.42rem;padding:0 1.25rem .82rem;flex-wrap:wrap;">
        <div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);
             padding:.26rem .7rem;border-radius:99px;font-size:.7rem;font-weight:700;">
          📝 ${QUESTIONS_PER_LEVEL} questions
        </div>
        <div style="background:${lvDef.bg};border:1px solid ${lvDef.border};
             padding:.26rem .7rem;border-radius:99px;font-size:.7rem;font-weight:700;color:${lvDef.color};">
          ✓ ${lvDef.pass}/${QUESTIONS_PER_LEVEL}
        </div>
        <div style="background:${lvDef.bg};border:1px solid ${lvDef.border};
             padding:.26rem .7rem;border-radius:99px;font-size:.7rem;font-weight:700;color:${lvDef.color};">
          +${lvDef.xp} XP
        </div>
      </div>

      <!-- Buttons -->
      <div style="display:flex;flex-direction:column;gap:.48rem;padding:0 1.25rem 1.5rem;">
        <button onclick="document.getElementById('slideIntroOverlay').remove();startChapterLevel('${ch.id}', ${lvDef.n})" style="
          width:100%;padding:.88rem;border:none;border-radius:13px;
          background:linear-gradient(135deg,${lvDef.color},${lvDef.color}bb);
          color:#000;font-family:'DM Sans',sans-serif;font-weight:900;font-size:.95rem;cursor:pointer;">
          ${lvDef.cta}
        </button>
        <div style="display:flex;gap:.48rem;">
          <button onclick="document.getElementById('slideIntroOverlay').remove()" style="
            flex:1;padding:.7rem;background:rgba(255,255,255,.05);
            border:1px solid rgba(255,255,255,.1);color:rgba(240,244,255,.4);
            font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:600;
            border-radius:11px;cursor:pointer;">← Back</button>
          <button onclick="document.getElementById('slideIntroOverlay').remove();openChapterLevels('${ch.id}')" style="
            flex:1;padding:.7rem;background:rgba(255,255,255,.05);
            border:1px solid rgba(255,255,255,.1);color:rgba(240,244,255,.4);
            font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:600;
            border-radius:11px;cursor:pointer;">All Levels</button>
        </div>
      </div>
    </div>`;

  if (!document.getElementById('sheet-style')) {
    const s = document.createElement('style');
    s.id = 'sheet-style';
    s.textContent = `@keyframes sheetUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`;
    document.head.appendChild(s);
  }

  document.body.appendChild(overlay);
}

// Open the chapter level picker
function openChapterLevels(chapterId) {
  const ch = getChapterById(chapterId);
  if (!ch) return;

  const existing = document.getElementById('chapterLevelsOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'chapterLevelsOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:200;
    display:flex;align-items:flex-end;justify-content:center;
    padding:1rem;background:rgba(0,0,0,.7);
    backdrop-filter:blur(8px);`;
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const levels = CHAPTER_LEVELS.map((lv, i) => {
    const lvNum     = i + 1;
    const lvData    = getLevelData(chapterId, lvNum);
    const unlocked  = isLevelUnlocked(chapterId, lvNum);
    const isCurrent = !lvData.done && unlocked;

    return `
      <div onclick="${unlocked ? `document.getElementById('chapterLevelsOverlay').remove();openLevelIntro('${chapterId}', ${lvNum})` : ''}"
           style="display:flex;align-items:center;gap:.75rem;padding:.72rem .9rem;
                  border-radius:12px;cursor:${unlocked ? 'pointer' : 'not-allowed'};
                  border:1.5px solid ${lvData.done ? 'rgba(184,255,87,.25)' : isCurrent ? lv.color : 'rgba(255,255,255,.08)'};
                  background:${lvData.done ? 'rgba(184,255,87,.05)' : isCurrent ? lv.bg : 'rgba(255,255,255,.03)'};
                  opacity:${unlocked ? 1 : .35};margin-bottom:.42rem;transition:all .14s;">
        <div style="width:38px;height:38px;border-radius:50%;flex-shrink:0;
             background:${lv.bg};display:flex;align-items:center;justify-content:center;
             font-size:1.1rem;">${lv.icon}</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:.88rem;">Level ${lvNum} — ${lv.name}</div>
          <div style="font-size:.7rem;color:rgba(240,244,255,.4);">${lv.desc}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:.72rem;font-weight:800;color:${lv.color};">+${lv.xp} XP</div>
          ${lvData.done
            ? `<div style="color:#b8ff57;font-size:.72rem;margin-top:.1rem;">✅ ${lvData.bestScore}/${QUESTIONS_PER_LEVEL}</div>`
            : isCurrent
              ? `<div style="font-size:.7rem;color:${lv.color};font-weight:700;margin-top:.1rem;">▶ START</div>`
              : `<div style="font-size:.75rem;margin-top:.1rem;">${unlocked ? '' : '🔒'}</div>`}
        </div>
      </div>`;
  }).join('');

  overlay.innerHTML = `
    <div style="width:100%;max-width:420px;background:#0a1425;
         border:1px solid rgba(255,255,255,.13);border-radius:24px 24px 20px 20px;
         overflow:hidden;animation:sheetUp .38s cubic-bezier(.34,1.2,.64,1) both;
         max-height:84vh;overflow-y:auto;scrollbar-width:none;">
      <div style="width:40px;height:4px;border-radius:99px;background:rgba(255,255,255,.13);
           margin:1rem auto .85rem;"></div>
      <div style="padding:0 1.25rem .5rem;">
        <div style="font-size:2.2rem;text-align:center;margin-bottom:.3rem;">${ch.emoji}</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;
             text-align:center;background:linear-gradient(135deg,#b8ff57,#5edfff);
             -webkit-background-clip:text;-webkit-text-fill-color:transparent;
             background-clip:text;margin-bottom:1rem;">
          ${ch.title}
        </div>
        ${levels}
      </div>
      <div style="padding:.25rem 1.25rem 1.5rem;">
        <button onclick="document.getElementById('chapterLevelsOverlay').remove()" style="
          width:100%;padding:.72rem;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);color:rgba(240,244,255,.4);
          font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;
          border-radius:11px;cursor:pointer;">Close</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
}

// Default learn bullets for levels (used when chapter doesn't define them)
function getDefaultLearns(ch, levelNum, lvDef) {
  return [
    `Core concepts at ${lvDef.name} level`,
    `${ch.cat} fundamentals from a ${S.position} perspective`,
    `${lvDef.desc}`,
    `Building toward Level ${Math.min(levelNum + 1, 5)} — ${CHAPTER_LEVELS[Math.min(levelNum, 4)].name}`,
  ];
}

function getDefaultQuote(ch, levelNum, lvDef) {
  const quotes = [
    'Every great player started with the basics. Master these and move up.',
    'Technique sharpens with practice. These questions will challenge you.',
    'This is where good players separate from average ones.',
    'Pro level knowledge. The questions here are what coaches teach at academies.',
    'Only the best players in Footy Brain reach Level 5. A perfect score is required.',
  ];
  return quotes[levelNum - 1] || quotes[0];
}

// ══════════════════════════════════════════════════════════════
//  SOUND
// ══════════════════════════════════════════════════════════════

let _audioCtx = null;
function getAudio() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
}
function playTone(freq, dur, type = 'sine', vol = 0.15) {
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
function playCorrect()  { playTone(523,.12); setTimeout(()=>playTone(659,.15),100); }
function playWrong()    { playTone(220,.25,'sawtooth',.1); }
function playLevelUp()  { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,.2),i*120)); }
function playGoal()     { [784,880,1047].forEach((f,i)=>setTimeout(()=>playTone(f,.18),i*80)); }

// ══════════════════════════════════════════════════════════════
//  FLOATING XP + LEVEL UP MODAL
// ══════════════════════════════════════════════════════════════

function spawnFloatingXP(amount) {
  const div = document.createElement('div');
  div.textContent = `+${amount} XP`;
  div.style.cssText = `
    position:fixed;bottom:90px;right:20px;z-index:500;
    background:#b8ff57;color:#000;font-weight:900;
    font-family:'Bebas Neue',sans-serif;font-size:1.35rem;
    padding:.32rem .82rem;border-radius:99px;pointer-events:none;
    animation:floatUp 1.2s ease forwards;`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1300);
}

function showLevelUpModal(level) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:1000;
    display:flex;align-items:center;justify-content:center;padding:1.5rem;`;
  overlay.innerHTML = `
    <div class="anim-pop" style="background:#0a1020;border:1px solid rgba(184,255,87,.2);
         border-radius:24px;padding:2.5rem;text-align:center;max-width:340px;width:100%;">
      <div style="font-size:5rem;margin-bottom:.5rem;">🏆</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:3rem;color:#b8ff57;margin-bottom:.2rem;">
        LEVEL UP!</h2>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.75rem;color:#ffb627;">
        Level ${level}</div>
      <div style="color:rgba(240,244,255,.45);margin:.35rem 0 1.4rem;">${getLevelTitle(S.xp)}</div>
      <button onclick="this.closest('[style*=fixed]').remove()" style="
        background:#b8ff57;color:#000;font-weight:900;font-size:1rem;
        padding:.9rem 2rem;border:none;border-radius:12px;cursor:pointer;width:100%;
        font-family:'DM Sans',sans-serif;">Let's Go! 🔥</button>
    </div>`;
  document.body.appendChild(overlay);
  confetti({ particleCount: 130, spread: 75, origin: { y: 0.5 } });
}

// ══════════════════════════════════════════════════════════════
//  BADGES
// ══════════════════════════════════════════════════════════════

function checkBadges() {
  let newEarned = false;
  (typeof BADGES !== 'undefined' ? BADGES : []).forEach(b => {
    if (S.badges.includes(b.id)) return;
    const earned = typeof getEarnedBadges === 'function'
      ? getEarnedBadges(S).some(e => e.id === b.id)
      : false;
    if (earned) {
      S.badges.push(b.id);
      newEarned = true;
      setTimeout(() => showToast(`🏅 Badge: ${b.name}!`), 600);
    }
  });
  if (newEarned) saveState();
}

// ══════════════════════════════════════════════════════════════
//  ROUTING
// ══════════════════════════════════════════════════════════════

const SCREENS = [
  's-name','s-pos','s-path',
  's-quiz','s-games','s-daily',
  's-prizes','s-cards','s-profile','s-settings',
];

let _screen = '';

function showScreen(id) {
  // app-main.js overrides this with proper HTML-ID remapping
  // This version handles direct HTML IDs as fallback
  if (_screen === id) return;
  SCREENS.forEach(sid => {
    const el = elId(sid);
    if (el) { el.classList.add('hidden'); el.classList.remove('on'); }
  });
  const target = elId(id);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('on');
    target.classList.add('anim-slide');
    setTimeout(() => target.classList.remove('anim-slide'), 400);
  }
  _screen = id;
  const navScreens = ['s-path','s-prizes','s-cards','s-profile'];
  const nav = elId('main-nav');
  if (nav) nav.classList.toggle('hidden', !navScreens.includes(id));
}

function setActiveNav(id) {
  document.querySelectorAll('#main-nav .nb').forEach(b => b.classList.remove('on'));
  elId(id) && elId(id).classList.add('on');
}

function goHome() {
  showScreen('s-path');
  setActiveNav('nb-path');
  if(typeof renderPath==='function') renderPath();
  if(typeof renderDailyBanner==='function') renderDailyBanner();
}

function saveNameAndShowPosition() {
  const input = elId('player-name');
  const name  = (input ? input.value : '').trim();
  if (!name) { showToast('Enter your name ⚽'); return; }
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
  showToast(`Welcome, ${S.name}! Let's build your football brain 🧠`);
}

// ══════════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════════

let _tt = null;
function showToast(msg, dur = 2600) {
  const t = elId('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove('show'), dur);
}

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════

function elId(id) { return id ? document.getElementById(id) : null; }
function setEl(id, val) { const e = elId(id); if (e) e.textContent = val; }

// Injected CSS animations
(function injectAnims() {
  if (document.getElementById('pf-anims')) return;
  const s = document.createElement('style');
  s.id = 'pf-anims';
  s.textContent = `
    @keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}80%{opacity:1;transform:translateY(-60px) scale(1.1)}100%{opacity:0;transform:translateY(-80px) scale(.9)}}
    @keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes popIn{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
    @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
    .anim-slide{animation:slideIn .32s ease both}
    .anim-pop{animation:popIn .4s cubic-bezier(.34,1.56,.64,1) both}
    .anim-shake{animation:shake .4s ease}
    .glass{background:rgba(255,255,255,.04);backdrop-filter:saturate(180%) blur(18px);-webkit-backdrop-filter:saturate(180%) blur(18px);border:1px solid rgba(255,255,255,.07);border-radius:16px;position:relative;overflow:hidden}
    .glass2{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:16px;position:relative}
    .glass::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);pointer-events:none}
    .hidden{display:none!important}
  `;
  document.head.appendChild(s);
})();

// ══════════════════════════════════════════════════════════════
//  HOME SCREEN INIT
// ══════════════════════════════════════════════════════════════

function initHomeScreen() {
  setEl('hdr-name', S.name);

  const badge = elId('positionBadge');
  if (badge) {
    const colMap = {
      Striker:'badge-orange', Midfielder:'badge-blue', Winger:'badge-blue',
      'Full-Back':'badge-purple', Defender:'badge-purple',
      Goalkeeper:'badge-green', 'All-Rounder':'badge-green',
    };
    badge.className  = `badge ${colMap[S.position] || 'badge-green'}`;
    badge.textContent = S.position;
  }

  updateXPBar();
  renderPath && renderPath();
  renderDailyBanner && renderDailyBanner();
}

function updateXPBar() {
  const xp = S.xp;
  setEl('ring-lv', getLevelFromXP(xp));
  setEl('lv-title', getLevelTitle(xp));
  setEl('xp-disp', xp.toLocaleString());
  setEl('xp-next', getXPToNext(xp).toLocaleString());
  setEl('streak-disp', S.streak);
  const fill = elId('xp-fill');
  if (fill) fill.style.width = getLevelProgress(xp) + '%';
}

// ══════════════════════════════════════════════════════════════
//  PWA INSTALL
// ══════════════════════════════════════════════════════════════

let _install = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); _install = e;
  const btn = document.createElement('button');
  btn.textContent = '📲 Install App';
  btn.style.cssText = `position:fixed;top:1rem;right:1rem;z-index:200;
    background:#ffb627;color:#000;border:none;font-weight:700;
    font-size:.78rem;padding:.45rem .9rem;border-radius:99px;
    cursor:pointer;font-family:'DM Sans',sans-serif;`;
  btn.onclick = async () => { _install.prompt(); await _install.userChoice; btn.remove(); };
  document.body.appendChild(btn);
});

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════

// Init is handled by app-main.js which loads after this file
// This ensures the HTML bridge is ready before routing
function _legacyInit() {
  // Kept for reference only — app-main.js window.load handles startup
  loadState();
}
