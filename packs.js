'use strict';

const GAME_TARGET = 3; // Score 3+ to win a prize

// ============================================================
//  Footy Brain — packs.js  v1
//  Prize system · Pack opening · Player characters · Power-ups
//  Titles · Knowledge cards · Weighted random rewards
// ============================================================

'use strict';

// ─────────────────────────────────────────────
//  RARITY SYSTEM
// ─────────────────────────────────────────────
const RARITY = {
  common:    { label:'Common',    weight:55, color:'var(--common)',    emoji:'⚪' },
  uncommon:  { label:'Uncommon',  weight:25, color:'var(--uncommon)', emoji:'🟢' },
  rare:      { label:'Rare',      weight:12, color:'var(--rare)',      emoji:'🔵' },
  epic:      { label:'Epic',      weight:7,  color:'var(--epic)',      emoji:'🟣' },
  legendary: { label:'Legendary', weight:1,  color:'var(--legendary)',emoji:'🟡' },
};

// Pro players get slightly better odds
const PRO_RARITY = {
  common:    { ...RARITY.common,    weight:40 },
  uncommon:  { ...RARITY.uncommon,  weight:28 },
  rare:      { ...RARITY.rare,      weight:18 },
  epic:      { ...RARITY.epic,      weight:11 },
  legendary: { ...RARITY.legendary, weight:3  },
};

function rollRarity(isPro = false) {
  const table  = isPro ? PRO_RARITY : RARITY;
  const total  = Object.values(table).reduce((a, b) => a + b.weight, 0);
  let roll     = Math.random() * total;
  for (const [key, val] of Object.entries(table)) {
    roll -= val.weight;
    if (roll <= 0) return key;
  }
  return 'common';
}

// ─────────────────────────────────────────────
//  ITEM CATALOGUE
// ─────────────────────────────────────────────

// ── PLAYER CHARACTERS ──────────────────────
const PLAYER_CHARACTERS = [
  // Common
  { id:'char_grassroots', type:'character', rarity:'common',
    emoji:'⚽', name:'The Grassroots Kid',
    desc:'Learning the basics. Potential written all over.',
    catchphrase:'Every legend started here!', nationality:'England' },
  { id:'char_sunday', type:'character', rarity:'common',
    emoji:'🥅', name:'Sunday League Steve',
    desc:'Heart of gold. Left foot of mystery.',
    catchphrase:'LADS. LADS. LADS.', nationality:'England' },
  { id:'char_keeper', type:'character', rarity:'common',
    emoji:'🧤', name:'Safe Hands',
    desc:'Between the sticks. Talks too much.',
    catchphrase:'KEEPER\'S BALL!', nationality:'Ireland' },

  // Uncommon
  { id:'char_el_rayo', type:'character', rarity:'uncommon',
    emoji:'⚡', name:'El Rayo',
    desc:'Spanish winger. Electric pace. Always cutting inside.',
    catchphrase:'¡Vamos!', nationality:'Spain' },
  { id:'char_la_ola', type:'character', rarity:'uncommon',
    emoji:'🌊', name:'La Ola',
    desc:'Argentine midfielder. Flowing play. Ocean-blue kit.',
    catchphrase:'El fútbol es arte.', nationality:'Argentina' },
  { id:'char_engine', type:'character', rarity:'uncommon',
    emoji:'⚙️', name:'The Engine',
    desc:'Irish box-to-box warrior. Never stops running. Ever.',
    catchphrase:'I\'m not even tired!', nationality:'Ireland' },
  { id:'char_wall', type:'character', rarity:'uncommon',
    emoji:'🧱', name:'The Wall',
    desc:'Italian centre-back. Impossible to get past.',
    catchphrase:'Non si passa.', nationality:'Italy' },

  // Rare
  { id:'char_professor', type:'character', rarity:'rare',
    emoji:'🧠', name:'The Professor',
    desc:'German midfielder. Scans every 2 seconds. Already knows.',
    catchphrase:'I processed this outcome 3 passes ago.',
    nationality:'Germany', proOnly:false },
  { id:'char_lion', type:'character', rarity:'rare',
    emoji:'🦁', name:'The Lion',
    desc:'English centre-back. Fearless. Roars on every tackle.',
    catchphrase:'THIS IS MY BOX!', nationality:'England' },
  { id:'char_tornado', type:'character', rarity:'rare',
    emoji:'🌪️', name:'Tornado',
    desc:'Brazilian forward. Unpredictable. Loves a nutmeg.',
    catchphrase:'O jogo bonito!', nationality:'Brazil' },
  { id:'char_eagle', type:'character', rarity:'rare',
    emoji:'🦅', name:'The Eagle',
    desc:'Dutch defender. Aerial dominance. Always calm.',
    catchphrase:'Totaalvoetbal.', nationality:'Netherlands' },

  // Epic
  { id:'char_bullseye', type:'character', rarity:'epic',
    emoji:'🎯', name:'Bullseye',
    desc:'French striker. Never misses. Clinical to the core.',
    catchphrase:'Place. Don\'t power.', nationality:'France' },
  { id:'char_maestro', type:'character', rarity:'epic',
    emoji:'🎼', name:'El Maestro',
    desc:'Spanish playmaker. Orchestrates everything. Pirlo vibes.',
    catchphrase:'The game is chess. I play chess.', nationality:'Spain' },
  { id:'char_phoenix', type:'character', rarity:'epic',
    emoji:'🔥', name:'The Phoenix',
    desc:'Comeback king. Always rises from the ashes.',
    catchphrase:'Down? Never for long.', nationality:'Portugal' },

  // Legendary
  { id:'char_goat', type:'character', rarity:'legendary',
    emoji:'🐐', name:'The GOAT',
    desc:'Unknown nationality. Unknown club. Just... unstoppable.',
    catchphrase:'You already know.', nationality:'Unknown',
    animated:true, proOnly:false },
  { id:'char_kaiser', type:'character', rarity:'legendary',
    emoji:'👑', name:'The Kaiser',
    desc:'The sweeper. The libero. The complete defender.',
    catchphrase:'The game bends to me.', nationality:'Germany',
    animated:true },
  { id:'char_wizard', type:'character', rarity:'legendary',
    emoji:'🧙', name:'The Wizard',
    desc:'No one knows how he does it. Not even him.',
    catchphrase:'Magic.', nationality:'Brazil',
    animated:true, proOnly:true },
];

// ── TITLES ─────────────────────────────────
const TITLES = [
  { id:'title_grassroots', type:'title', rarity:'common',
    emoji:'📋', name:'Grassroots Hero', display:'Grassroots Hero' },
  { id:'title_sunday',     type:'title', rarity:'common',
    emoji:'☀️', name:'Sunday League Star', display:'Sunday League Star' },
  { id:'title_keeper',     type:'title', rarity:'common',
    emoji:'🧤', name:'Shot Stopper', display:'The Shot Stopper' },
  { id:'title_reader',     type:'title', rarity:'uncommon',
    emoji:'📚', name:'Football Brainiac', display:'Football Brainiac' },
  { id:'title_playmaker',  type:'title', rarity:'rare',
    emoji:'🎯', name:'The Playmaker', display:'The Playmaker' },
  { id:'title_specialist', type:'title', rarity:'rare',
    emoji:'🎓', name:'Dead Ball Specialist', display:'Dead Ball Specialist' },
  { id:'title_cleansheet', type:'title', rarity:'rare',
    emoji:'🛡️', name:'Clean Sheet King', display:'Clean Sheet King' },
  { id:'title_gaffer',     type:'title', rarity:'epic',
    emoji:'📋', name:'The Gaffer', display:'The Gaffer' },
  { id:'title_general',    type:'title', rarity:'epic',
    emoji:'⚔️', name:'Pitch General', display:'Pitch General' },
  { id:'title_maestro',    type:'title', rarity:'epic',
    emoji:'🎼', name:'El Maestro', display:'El Maestro' },
  { id:'title_goat',       type:'title', rarity:'legendary',
    emoji:'🐐', name:'The GOAT', display:'The GOAT' },
  { id:'title_legend',     type:'title', rarity:'legendary',
    emoji:'🏆', name:'Living Legend', display:'Living Legend' },
  { id:'title_elite',      type:'title', rarity:'legendary',
    emoji:'💎', name:'Footy Brain Elite', display:'Footy Brain Elite', proOnly:true },
];

// ── POWER-UPS ───────────────────────────────
const POWER_UPS = [
  { id:'pu_xp_small',  type:'powerup', rarity:'common',
    emoji:'⚡', name:'XP Boost',        desc:'+100 XP instantly',
    effect:'xp', value:100 },
  { id:'pu_xp_med',    type:'powerup', rarity:'uncommon',
    emoji:'⚡', name:'XP Surge',        desc:'+300 XP instantly',
    effect:'xp', value:300 },
  { id:'pu_xp_large',  type:'powerup', rarity:'rare',
    emoji:'🚀', name:'XP Explosion',    desc:'+750 XP instantly',
    effect:'xp', value:750 },
  { id:'pu_2xp_4h',    type:'powerup', rarity:'uncommon',
    emoji:'⚡', name:'Double XP 4hrs',  desc:'2× XP for 4 hours',
    effect:'2xp', duration:4*3600000 },
  { id:'pu_2xp_24h',   type:'powerup', rarity:'rare',
    emoji:'🔥', name:'Double XP 24hrs', desc:'2× XP for 24 hours',
    effect:'2xp', duration:24*3600000 },
  { id:'pu_freeze',    type:'powerup', rarity:'uncommon',
    emoji:'🧊', name:'Streak Freeze',   desc:'Saves your streak once',
    effect:'freeze', value:1 },
  { id:'pu_heart',     type:'powerup', rarity:'uncommon',
    emoji:'❤️',  name:'Heart Restore',  desc:'Refills all 5 hearts',
    effect:'hearts', value:5 },
  { id:'pu_hint',      type:'powerup', rarity:'rare',
    emoji:'💡', name:'Hint Token',      desc:'Removes one wrong answer',
    effect:'hint', value:3 },
  { id:'pu_focus',     type:'powerup', rarity:'epic',
    emoji:'🎯', name:'Focus Mode',      desc:'No hearts lost for 1 chapter',
    effect:'focus', value:1 },
  { id:'pu_pro_24h',   type:'powerup', rarity:'epic',
    emoji:'⭐', name:'Pro — 24 Hours',  desc:'All Pro features for 24 hours',
    effect:'pro', duration:24*3600000 },
  { id:'pu_pro_7d',    type:'powerup', rarity:'legendary',
    emoji:'👑', name:'Pro — 7 Days',    desc:'All Pro features for 7 days',
    effect:'pro', duration:7*24*3600000 },
];

// ── KNOWLEDGE CARDS ─────────────────────────
const KNOWLEDGE_CARDS = [
  { id:'kc_cruyff_turn',  type:'knowledge', rarity:'uncommon',
    emoji:'🌀', name:'The Cruyff Turn',
    fact:'Johan Cruyff unveiled this move at the 1974 World Cup. Sweden\'s Jan Olsson was the first victim. It changed football forever.',
    topic:'Skill' },
  { id:'kc_total_football', type:'knowledge', rarity:'rare',
    emoji:'🔄', name:'Total Football',
    fact:'Ajax and the Netherlands in the early 1970s invented a system where every player could play every position. Rinus Michels and Johan Cruyff were the architects.',
    topic:'Tactics' },
  { id:'kc_offside_rule', type:'knowledge', rarity:'common',
    emoji:'🚩', name:'The Offside Rule',
    fact:'Introduced in 1863. Changed dramatically in 1925 — the number of defenders required between an attacker and the goal line was reduced from 3 to 2, causing goals to triple.',
    topic:'Rules' },
  { id:'kc_xg',          type:'knowledge', rarity:'rare',
    emoji:'📊', name:'Expected Goals (xG)',
    fact:'xG was developed in the early 2010s. Sam Green at Opta is often credited with popularising it. A penalty kick has an xG of 0.76 — not as high as you\'d think.',
    topic:'Analytics' },
  { id:'kc_gegenpressing', type:'knowledge', rarity:'epic',
    emoji:'⚡', name:'Gegenpressing',
    fact:'Jürgen Klopp: "The best playmaker in the world is gegenpressing. After winning the ball, you are already in the best position because the opponent is out of order." Within 6 seconds.',
    topic:'Tactics' },
  { id:'kc_wall_pass',   type:'knowledge', rarity:'common',
    emoji:'↔️', name:'The One-Two',
    fact:'The one-two (wall pass) is as old as the game itself. It uses a teammate as a wall to bypass a defender in a single exchange. Simple, devastating, unstoppable.',
    topic:'Technique' },
  { id:'kc_hungary_1953', type:'knowledge', rarity:'epic',
    emoji:'🏟️', name:'Hungary 6-3 England, 1953',
    fact:'The first time England lost at home to foreign opposition. Hungary\'s tactical superiority was so complete it ended the myth of English football dominance and changed global football thinking overnight.',
    topic:'History' },
  { id:'kc_ppda',        type:'knowledge', rarity:'rare',
    emoji:'📈', name:'PPDA',
    fact:'Passes Per Defensive Action measures pressing intensity. A team allowing 10 passes per defensive action is pressing less than one allowing 5. Liverpool under Klopp regularly posted PPDA below 7.',
    topic:'Analytics' },
  { id:'kc_half_space',  type:'knowledge', rarity:'uncommon',
    emoji:'🔷', name:'The Half-Space',
    fact:'The area between the winger and centre-forward. Described as the most dangerous zone in football. Özil, Iniesta and De Bruyne spent entire careers operating there.',
    topic:'Tactics' },
  { id:'kc_brazil_1970', type:'knowledge', rarity:'legendary',
    emoji:'🌟', name:'Brazil 1970',
    fact:'Many consider Brazil\'s 1970 World Cup squad the greatest team in history. Pelé, Jairzinho, Rivelino, Tostão. Jairzinho scored in every single game — the only player ever to do so.',
    topic:'History' },
];

// ── COMBINED ITEM POOL BY RARITY ────────────
const ITEM_POOLS = {
  common:    [...PLAYER_CHARACTERS.filter(i=>i.rarity==='common'),
               ...TITLES.filter(i=>i.rarity==='common'),
               ...POWER_UPS.filter(i=>i.rarity==='common'),
               ...KNOWLEDGE_CARDS.filter(i=>i.rarity==='common')],
  uncommon:  [...PLAYER_CHARACTERS.filter(i=>i.rarity==='uncommon'),
               ...TITLES.filter(i=>i.rarity==='uncommon'),
               ...POWER_UPS.filter(i=>i.rarity==='uncommon'),
               ...KNOWLEDGE_CARDS.filter(i=>i.rarity==='uncommon')],
  rare:      [...PLAYER_CHARACTERS.filter(i=>i.rarity==='rare'),
               ...TITLES.filter(i=>i.rarity==='rare'),
               ...POWER_UPS.filter(i=>i.rarity==='rare'),
               ...KNOWLEDGE_CARDS.filter(i=>i.rarity==='rare')],
  epic:      [...PLAYER_CHARACTERS.filter(i=>i.rarity==='epic'),
               ...TITLES.filter(i=>i.rarity==='epic'),
               ...POWER_UPS.filter(i=>i.rarity==='epic'),
               ...KNOWLEDGE_CARDS.filter(i=>i.rarity==='epic')],
  legendary: [...PLAYER_CHARACTERS.filter(i=>i.rarity==='legendary'),
               ...TITLES.filter(i=>i.rarity==='legendary'),
               ...POWER_UPS.filter(i=>i.rarity==='legendary'),
               ...KNOWLEDGE_CARDS.filter(i=>i.rarity==='legendary')],
};

// Remove Pro-only items from pool if not Pro
function getItemPool(rarity) {
  const pool = ITEM_POOLS[rarity] || ITEM_POOLS.common;
  return pool.filter(item => !item.proOnly || hasPro());
}

// Override getItemDef from app.js
function getItemDef(id) {
  const all = [
    ...PLAYER_CHARACTERS, ...TITLES,
    ...POWER_UPS, ...KNOWLEDGE_CARDS,
  ];
  return all.find(i => i.id === id) || { name: id, emoji: '📦' };
}

// ─────────────────────────────────────────────
//  PACK SYSTEM — main prize API
// ─────────────────────────────────────────────
const PACK_SYSTEM = true; // flag for app.js to detect

function rollPrize() {
  S.totalAttempts   = (S.totalAttempts   || 0) + 1;
  S.sinceLastRare   = (S.sinceLastRare   || 0) + 1;

  let rarity = rollRarity(hasPro());

  // Pity timer — guarantee rare+ after PITY_THRESHOLD attempts
  if (S.sinceLastRare >= PITY_THRESHOLD && rarity === 'common' || rarity === 'uncommon') {
    rarity = 'rare';
  }

  if (['rare','epic','legendary'].includes(rarity)) {
    S.sinceLastRare = 0;
  }

  const pool = getItemPool(rarity);
  if (!pool.length) return rollPrize(); // fallback
  const item = pool[Math.floor(Math.random() * pool.length)];

  saveState();
  return { ...item, rarity };
}

function awardPrize(prize) {
  if (!S.collection) S.collection = [];
  if (!S.powerUps)   S.powerUps   = {};

  const entry = {
    id:       prize.id,
    type:     prize.type,
    rarity:   prize.rarity,
    earnedAt: new Date().toISOString(),
  };

  // Apply power-up effects immediately
  if (prize.type === 'powerup') {
    switch (prize.effect) {
      case 'xp':
        addXP(prize.value);
        break;
      case 'freeze':
        S.freezesAvailable = (S.freezesAvailable || 0) + (prize.value || 1);
        showToast('🧊 Streak freeze added!');
        break;
      case 'hearts':
        restoreHearts(prize.value || 5);
        break;
      case 'pro':
        grantPro(prize.duration, 'reward');
        break;
      case '2xp':
      case 'hint':
      case 'focus':
        S.powerUps[prize.id] = (S.powerUps[prize.id] || 0) + 1;
        break;
    }
  }

  // Add to collection (avoid duplicates for unique items)
  const alreadyOwns = S.collection.some(c => c.id === prize.id);
  if (!alreadyOwns || prize.type === 'powerup') {
    S.collection.push(entry);
  }

  saveState();
  return entry;
}

// ─────────────────────────────────────────────
//  PACK OPENING MODAL
// ─────────────────────────────────────────────
let _currentPrize = null;
let _packOpened   = false;

function sfxPack() {
  // Sound stub — replace with real audio when audio system is added
  if (typeof playTone === 'function') playTone(440, 0.1);
}

function openPrizePack(gameKey, score) {
  if (score < GAME_TARGET) {
    showToast(`Score ${GAME_TARGET}+ to win a prize! You got ${score} 💪`);
    return;
  }

  _packOpened = false;
  const rarity  = rollRarity(hasPro());
  const isPrize = true;

  // Build the modal content — show closed pack first
  const rarityData = RARITY[rarity] || RARITY.common;
  const packClass  = `pack pack-${rarity} ${rarity !== 'common' ? `pack-glow-${rarity}` : ''}`;

  el('pack-modal-content').innerHTML = `
    <div style="margin-bottom:.5rem;">
      <span class="pill pill-${rarity}" style="font-size:.72rem;">
        ${rarityData.emoji} ${rarityData.label} Pack
      </span>
    </div>
    <div style="font-size:.8rem;color:var(--text2);margin-bottom:1.1rem;">
      You scored ${score}/${GAME_META[gameKey]?.max||5} — nice work!
    </div>

    <!-- Closed pack -->
    <div id="pack-closed-view" class="${packClass}"
         style="cursor:pointer;padding:2rem;border-radius:24px;"
         onclick="revealPrize()">
      <div style="font-size:4rem;margin-bottom:.6rem;
          animation:fbPackShake 1.5s ease-in-out infinite;">📦</div>
      <div class="display" style="font-size:1.6rem;color:${rarityData.color};">
        ${rarityData.label.toUpperCase()} PACK
      </div>
      <div style="font-size:.75rem;color:var(--text2);margin:.35rem 0 .75rem;">
        Tap to reveal your prize!
      </div>
      <div style="font-size:.62rem;color:var(--text3);line-height:1.6;">
        Odds shown · Common ${RARITY.common.weight}% ·
        Uncommon ${RARITY.uncommon.weight}% ·
        Rare ${RARITY.rare.weight}% ·
        Epic ${RARITY.epic.weight}% ·
        Legendary ${RARITY.legendary.weight}%
      </div>
    </div>

    <!-- Opened view (hidden) -->
    <div id="pack-opened-view" class="hidden" style="text-align:center;"></div>
  `;

  // Pre-roll the actual prize so it's ready
  _currentPrize = rollPrize();
  _currentPrize.rarity = rarity; // match displayed rarity

  showModal('pack-modal');
  sfxPack();
}

function revealPrize() {
  if (_packOpened) return;
  _packOpened = true;

  const closed = el('pack-closed-view');
  const opened = el('pack-opened-view');
  if (!closed || !opened || !_currentPrize) return;

  // Shake animation
  closed.style.animation = 'fbPackShake .5s ease';

  setTimeout(() => {
    closed.classList.add('hidden');
    opened.classList.remove('hidden');

    const prize     = _currentPrize;
    const rarData   = RARITY[prize.rarity] || RARITY.common;
    const packClass = `pack pack-${prize.rarity}`;
    const isLegend  = prize.rarity === 'legendary';
    const isEpic    = prize.rarity === 'epic';

    opened.innerHTML = `
      <div style="font-size:${isLegend?'3.5':'2.5'}rem;margin-bottom:.4rem;
          animation:fbPop .5s cubic-bezier(.34,1.56,.64,1) both;">
        ${isLegend ? '🌟✨🌟' : isEpic ? '🎉' : ''}
      </div>
      <div class="display" style="font-size:1.8rem;color:${rarData.color};
          margin-bottom:.2rem;">
        ${prize.rarity.toUpperCase()}!
      </div>
      <div style="font-size:.78rem;color:var(--text2);margin-bottom:1rem;">
        You won...
      </div>

      <div class="${packClass}" style="padding:1.35rem;border-radius:20px;
          margin-bottom:1rem;animation:fbPop .4s .1s cubic-bezier(.34,1.56,.64,1) both;">
        <div style="font-size:2.5rem;margin-bottom:.4rem;">${prize.emoji}</div>
        <div style="font-weight:800;font-size:.95rem;margin-bottom:.2rem;">${prize.name}</div>
        <div style="font-size:.75rem;color:var(--text2);margin-bottom:.4rem;">
          ${prize.desc || prize.fact || ''}
        </div>
        ${prize.catchphrase ? `<div style="font-size:.7rem;color:${rarData.color};
            font-style:italic;">"${prize.catchphrase}"</div>` : ''}
        ${prize.display ? `<div style="font-size:.75rem;color:${rarData.color};
            margin-top:.3rem;">Title: "${prize.display}"</div>` : ''}
        <span class="pill pill-${prize.rarity}" style="margin-top:.5rem;font-size:.65rem;">
          ${rarData.emoji} ${rarData.label}
        </span>
      </div>

      ${prize.rarity === 'epic' || prize.rarity === 'legendary' ? `
        <div style="font-size:.75rem;padding:.6rem;
            background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.2);
            border-radius:var(--r-sm);margin-bottom:.85rem;color:var(--text2);">
          💡 <strong style="color:var(--amber);">Pro players</strong> have 3× better
          odds of epic and legendary prizes!
        </div>` : ''}

      <button class="btn btn-accent" style="width:100%;margin-bottom:.45rem;"
        onclick="collectPrize()">Collect! ✨</button>
      <button class="btn btn-ghost" style="width:100%;font-size:.8rem;"
        onclick="closeModal('pack-modal')">Close</button>
    `;

    // Confetti for rare+
    if (['rare','epic','legendary'].includes(prize.rarity)) {
      const colors = {
        rare:      ['#38bdf8','#5edfff','#fff'],
        epic:      ['#c084fc','#9b7fff','#e9d5ff'],
        legendary: ['#fbbf24','#f59e0b','#fff','#fef3c7'],
      };
      confetti({
        particleCount: prize.rarity==='legendary' ? 200 : prize.rarity==='epic' ? 120 : 60,
        spread:        prize.rarity==='legendary' ? 100 : 70,
        origin:        { y:.55 },
        colors:        colors[prize.rarity] || ['#b8ff57','#fff'],
      });
      sfxGoal();
    }
  }, 600);
}

function collectPrize() {
  if (!_currentPrize) { closeModal('pack-modal'); return; }
  awardPrize(_currentPrize);
  closeModal('pack-modal');
  _currentPrize = null;
  showToast(`🎉 ${getItemDef(_currentPrize?.id || '')?.name || 'Prize'} added to collection!`);
  // Refresh game grid and prizes screen
  renderGameGrid?.();
}

// ─────────────────────────────────────────────
//  GAME WIN HANDLER
//  Called from games.js when a game ends
// ─────────────────────────────════════════════
function handleGameResult(gameKey, score) {
  // Update high score
  if (!S.gameHighScores) S.gameHighScores = {};
  const prev = S.gameHighScores[gameKey] || 0;
  if (score > prev) {
    S.gameHighScores[gameKey] = score;
    saveState();
  }

  // Award XP for any attempt
  const xpEarned = score * 4;
  addXP(xpEarned);

  // Open pack if they hit the target
  if (score >= GAME_TARGET) {
    setTimeout(() => openPrizePack(gameKey, score), 800);
  }
}

// ─────────────────────────────────────────────
//  ODDS DISPLAY HELPER (legal requirement)
// ─────────────────────────────────────────────
function getOddsDisplay(isPro = false) {
  const table = isPro ? PRO_RARITY : RARITY;
  const total = Object.values(table).reduce((a,b) => a+b.weight, 0);
  return Object.entries(table).map(([key, val]) => ({
    rarity:  key,
    label:   val.label,
    emoji:   val.emoji,
    percent: ((val.weight / total) * 100).toFixed(1),
  }));
}
