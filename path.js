// ============================================================
//  Footy Brain — path.js
//  Duolingo-style path renderer
//  Reads from chapterProgress in app-v3.js
//  Calls openLevelIntro() / openChapterLevels() from app-v3.js
// ============================================================

'use strict';

// Chapter → zone assignment
// Edit this to control which zone each chapter appears in
const CHAPTER_ZONES = {
  // GRASSROOTS (unlockAt:1)
  f1:'grassroots', r1:'grassroots', f2:'grassroots', f5:'grassroots', r2:'grassroots',

  // SUNDAY LEAGUE (unlockAt:3)
  f3:'sunday', f4:'sunday', t1:'sunday', t2:'sunday', t3:'sunday',
  s1:'sunday', m1:'sunday', d1:'sunday', g1:'sunday',
  f8:'sunday', f12:'sunday',

  // ACADEMY (unlockAt:5)
  f6:'academy', f7:'academy', f9:'academy',
  s2:'academy', s3:'academy', w1:'academy', w2:'academy',
  fb1:'academy', fb2:'academy', mi2:'academy', mi3:'academy',
  gk2_dist:'academy', gk3_box:'academy', gk4_1v1:'academy', d2:'academy',

  // RESERVE TEAM (unlockAt:6)
  ta4:'reserve', ta5:'reserve', ta6:'reserve', ta7:'reserve',
  mg1:'reserve', mg2:'reserve', mg3:'reserve',
  r3:'reserve', r4:'reserve',
  biz1:'reserve', biz2:'reserve', biz3:'reserve',

  // SEMI-PRO (unlockAt:7)
  ta8:'semipro', ta9:'semipro', ta10:'semipro',
  f10:'semipro', f11:'semipro',
  fit1:'semipro', fit2:'semipro',
  biz4:'semipro',

  // PROFESSIONAL (unlockAt:8)
  an1:'pro', an2:'pro', man1:'pro', man2:'pro',
  p1:'pro', p2:'pro',
};

// Chapters within each zone — ordered for the path
const ZONE_CHAPTERS = {
  grassroots: ['f1','r1','f2','f5','r2'],
  sunday:     ['f3','f4','t1','t2','t3','s1','m1','d1','g1','f8','f12'],
  academy:    ['f6','f7','f9','s2','s3','w1','w2','fb1','fb2','mi2','mi3','gk2_dist','gk3_box','gk4_1v1','d2'],
  reserve:    ['ta4','ta5','ta6','ta7','mg1','mg2','mg3','r3','r4','biz1','biz2','biz3'],
  semipro:    ['ta8','ta9','ta10','f10','f11','fit1','fit2','biz4'],
  pro:        ['an1','an2','man1','man2','p1','p2'],
};

// ──────────────────────────────────────────────────────────────
//  MAIN RENDER
// ──────────────────────────────────────────────────────────────

function renderPath() {
  const container = elId('pathContainer');
  if (!container) return;

  const playerLevel  = getLevelFromXP(S.xp);
  const position     = S.position;
  const allChapters  = typeof ALL_CHAPTERS !== 'undefined' ? ALL_CHAPTERS : [];

  let html = '';

  // "You are here" indicator
  html += buildYouAreHere(playerLevel);

  // XP card
  html += buildXPCard(playerLevel);

  // Build each zone
  ZONE_DEFS.forEach(zone => {
    const unlocked = playerLevel >= zone.unlockAt;
    const chapterIds = ZONE_CHAPTERS[zone.id] || [];

    // Filter to chapters that exist AND are visible for this position
    const zoneChapters = chapterIds
      .map(id => allChapters.find(c => c.id === id))
      .filter(ch => {
        if (!ch) return false;
        if (!ch.positions) return true;
        return ch.positions.includes(position) || ch.positions.includes('All-Rounder');
      });

    if (zoneChapters.length === 0) return;

    html += buildZoneBanner(zone, unlocked);
    html += buildPathTrack(zoneChapters, unlocked, playerLevel);
  });

  container.innerHTML = html;
}

// ──────────────────────────────────────────────────────────────
//  YOU ARE HERE
// ──────────────────────────────────────────────────────────────

function buildYouAreHere(playerLevel) {
  const zone = ZONE_DEFS.filter(z => playerLevel >= z.unlockAt).pop();
  const zoneName = zone ? zone.name : 'Grassroots';
  return `
    <div style="display:flex;align-items:center;gap:.48rem;width:fit-content;
         margin:0 auto .85rem;
         background:linear-gradient(135deg,rgba(184,255,87,.09),rgba(94,223,255,.06));
         border:1px solid rgba(184,255,87,.17);border-radius:99px;
         padding:.3rem .85rem .3rem .48rem;font-size:.7rem;font-weight:700;">
      <div style="width:8px;height:8px;border-radius:50%;background:#b8ff57;
           box-shadow:0 0 6px #b8ff57;animation:pulse 1.5s ease-in-out infinite;"></div>
      Level ${playerLevel} · ${zoneName} · ${S.position}
    </div>`;
}

// ──────────────────────────────────────────────────────────────
//  XP CARD
// ──────────────────────────────────────────────────────────────

function buildXPCard(playerLevel) {
  const xp   = S.xp;
  const prog = getLevelProgress(xp);
  const next  = getXPToNext(xp);
  const title = getLevelTitle(xp);

  return `
    <div class="glass" style="margin:0 1.2rem .85rem;padding:1.05rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.62rem;">
        <div style="display:flex;align-items:center;gap:.62rem;">
          <!-- Ring SVG -->
          <div style="position:relative;width:48px;height:48px;flex-shrink:0;">
            <svg width="48" height="48" viewBox="0 0 48 48" style="transform:rotate(-90deg);">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="3.5"/>
              <circle cx="24" cy="24" r="20" fill="none" stroke="url(#xpGrad)" stroke-width="3.5"
                stroke-dasharray="125.7" stroke-dashoffset="${125.7 - (125.7 * prog / 100)}"
                stroke-linecap="round"/>
              <defs><linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#b8ff57"/>
                <stop offset="100%" stop-color="#5edfff"/>
              </linearGradient></defs>
            </svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;
                 justify-content:center;font-family:'Bebas Neue',sans-serif;
                 font-size:.9rem;color:#b8ff57;">${playerLevel}</div>
          </div>
          <div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:.98rem;line-height:1;">
              ${title}
            </div>
            <span style="display:inline-flex;align-items:center;gap:.26rem;margin-top:.2rem;
                 padding:.17rem .58rem;border-radius:99px;font-size:.62rem;font-weight:700;
                 background:rgba(94,223,255,.09);color:#5edfff;border:1px solid rgba(94,223,255,.2);">
              ${S.position}
            </span>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;color:#b8ff57;line-height:1;">
            ${xp.toLocaleString()}
          </div>
          <div style="font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
               color:rgba(240,244,255,.4);">XP</div>
        </div>
      </div>
      <div style="height:5px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden;">
        <div style="height:100%;width:${prog}%;border-radius:99px;
             background:linear-gradient(90deg,#b8ff57,#5edfff);position:relative;overflow:hidden;">
          <div style="position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);
               animation:shimmer 2.5s linear infinite;"></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:.28rem;
           font-size:.62rem;color:rgba(240,244,255,.3);">
        <span>Level ${playerLevel}</span>
        <span>${next.toLocaleString()} XP to Level ${playerLevel + 1}</span>
      </div>
    </div>`;
}

// ──────────────────────────────────────────────────────────────
//  ZONE BANNER
// ──────────────────────────────────────────────────────────────

function buildZoneBanner(zone, unlocked) {
  const muted = !unlocked;
  return `
    <div style="margin:${muted ? '.35rem' : '.5rem'} 1.2rem .5rem;border-radius:13px;
         padding:.78rem .95rem;display:flex;align-items:center;gap:.68rem;
         position:relative;overflow:hidden;
         background:${zone.bg};border:1px solid ${zone.border};
         ${muted ? 'opacity:.48;' : ''}">
      <span style="font-size:1.65rem;${muted ? 'filter:grayscale(.5);' : ''}">${zone.emoji}</span>
      <div style="flex:1;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.08rem;color:${zone.color};">
          ${zone.name}
        </div>
        <div style="font-size:.67rem;color:rgba(240,244,255,.45);">${zone.desc}</div>
      </div>
      ${!unlocked ? `
      <div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
           padding:.22rem .55rem;border-radius:99px;font-size:.62rem;font-weight:700;
           color:rgba(240,244,255,.4);white-space:nowrap;">
        🔒 Level ${zone.unlockAt}
      </div>` : ''}
      <div style="position:absolute;right:-12px;top:-12px;width:65px;height:65px;border-radius:50%;
           background:radial-gradient(circle,${zone.bg.replace('rgba(','').replace(/,.+\)/,',.2)')},transparent 70%);
           pointer-events:none;"></div>
    </div>`;
}

// ──────────────────────────────────────────────────────────────
//  PATH TRACK
// ──────────────────────────────────────────────────────────────

function buildPathTrack(chapters, zoneUnlocked, playerLevel) {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;">';

  chapters.forEach((ch, i) => {
    const isLast  = i === chapters.length - 1;
    const state   = zoneUnlocked ? chapterNodeState(ch.id) : 'locked';
    const done    = levelsCompleted(ch.id);
    const goLeft  = i % 2 === 0;  // alternate left/right

    // Connector line before each node (except first)
    if (i > 0) {
      const prevState = zoneUnlocked ? chapterNodeState(chapters[i-1].id) : 'locked';
      const lineColor = prevState === 'mastered' || prevState === 'active'
        ? 'linear-gradient(#b8ff57,#5edfff)' : 'rgba(255,255,255,.07)';
      html += `
        <div style="width:3px;height:42px;border-radius:99px;margin:0 auto;
             background:${lineColor};"></div>`;
    }

    // Node row — alternate sides
    html += `
      <div style="display:flex;width:100%;justify-content:center;">
        <div style="${goLeft ? 'margin-left:72px;' : 'margin-right:72px;'}
             display:flex;flex-direction:column;align-items:center;
             padding:12px 0;cursor:${state !== 'locked' ? 'pointer' : 'not-allowed'};
             -webkit-tap-highlight-color:transparent;"
             onclick="${state !== 'locked' ? `openChapterLevels('${ch.id}')` : `showToast('Reach Level ${ZONE_DEFS.find(z=>z.id===(CHAPTER_ZONES[ch.id]||'grassroots'))?.unlockAt||'?'} to unlock!')`}">

          ${buildNode(ch, state, done)}

          <div style="font-size:.7rem;font-weight:700;text-align:center;
               max-width:82px;line-height:1.2;margin-top:.43rem;
               color:${state === 'locked' ? 'rgba(240,244,255,.2)' : state === 'active' ? '#b8ff57' : 'rgba(240,244,255,.85)'};">
            ${ch.title.length > 18 ? ch.title.substring(0, 16) + '…' : ch.title}
          </div>

          ${buildDots(ch.id)}
        </div>
      </div>`;
  });

  html += '</div>';
  return html;
}

// ──────────────────────────────────────────────────────────────
//  CHAPTER NODE
// ──────────────────────────────────────────────────────────────

function buildNode(ch, state, done) {
  const styles = {
    idle:     `background:rgba(255,255,255,.045);border:2px solid rgba(255,255,255,.09);`,
    active:   `background:linear-gradient(135deg,#b8ff57,#5edfff);animation:nodepulse 2.5s ease-in-out infinite;`,
    done:     `background:linear-gradient(135deg,#b8ff57,#5edfff);box-shadow:0 0 0 3px rgba(184,255,87,.12),0 4px 16px rgba(184,255,87,.18);`,
    mastered: `background:linear-gradient(135deg,#fbbf24,#d97706);box-shadow:0 0 0 3px rgba(251,191,36,.15),0 4px 20px rgba(251,191,36,.22);`,
    locked:   `background:rgba(255,255,255,.02);border:2px solid rgba(255,255,255,.05);opacity:.32;`,
  };

  const crown = state === 'mastered'
    ? `<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);
            font-size:.88rem;animation:crownbob .9s ease-in-out infinite alternate;">👑</div>`
    : '';

  return `
    <div style="width:70px;height:70px;border-radius:50%;
         display:flex;align-items:center;justify-content:center;
         font-size:1.95rem;position:relative;flex-shrink:0;
         transition:transform .18s cubic-bezier(.34,1.56,.64,1);
         ${styles[state] || styles.idle}">
      ${crown}
      ${ch.emoji}
    </div>`;
}

// ──────────────────────────────────────────────────────────────
//  FIVE DOTS
// ──────────────────────────────────────────────────────────────

function buildDots(chapterId) {
  const dotColors = ['#4ade80','#5edfff','#ffb627','#f87171','#fbbf24'];

  const dots = [1,2,3,4,5].map(n => {
    const done = isLevelComplete(chapterId, n);
    const col  = dotColors[n - 1];
    return done
      ? `<div style="width:7px;height:7px;border-radius:50%;background:${col};box-shadow:0 0 4px ${col};"></div>`
      : `<div style="width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.1);"></div>`;
  }).join('');

  return `<div style="display:flex;gap:.25rem;margin-top:.28rem;">${dots}</div>`;
}

// ──────────────────────────────────────────────────────────────
//  DAILY BANNER (home screen)
// ──────────────────────────────────────────────────────────────

function renderDailyBanner() {
  const banner = elId('daily-banner');
  if (!banner) return;
  const done = S.lastDailyDate === new Date().toDateString();

  banner.innerHTML = done
    ? `<div style="display:flex;align-items:center;gap:.75rem;opacity:.55;">
         <span style="font-size:1.5rem;">📅</span>
         <div>
           <div style="font-weight:700;font-size:.875rem;">Daily Challenge Complete!</div>
           <div style="font-size:.75rem;color:rgba(240,244,255,.4);">Come back tomorrow</div>
         </div>
         <span style="margin-left:auto;font-size:1.2rem;">✅</span>
       </div>`
    : `<div style="display:flex;align-items:center;gap:.75rem;cursor:pointer;"
            onclick="showScreen('daily-screen')">
         <span style="font-size:1.5rem;animation:pulse 1.8s ease-in-out infinite;display:inline-block;">🔥</span>
         <div>
           <div style="font-weight:700;font-size:.875rem;">Daily Challenge Ready!</div>
           <div style="font-size:.75rem;color:rgba(240,244,255,.4);">5 questions · Bonus XP · Streak</div>
         </div>
         <span style="margin-left:auto;background:#b8ff57;color:#000;font-weight:700;
                      font-size:.75rem;padding:.3rem .75rem;border-radius:99px;">GO →</span>
       </div>`;
}

// ──────────────────────────────────────────────────────────────
//  CSS KEYFRAMES (injected once)
// ──────────────────────────────────────────────────────────────

(function injectPathAnims() {
  if (document.getElementById('path-anims')) return;
  const s = document.createElement('style');
  s.id = 'path-anims';
  s.textContent = `
    @keyframes nodepulse{
      0%,100%{box-shadow:0 0 0 4px rgba(184,255,87,.18),0 6px 24px rgba(184,255,87,.25);}
      50%{box-shadow:0 0 0 9px rgba(184,255,87,.07),0 8px 32px rgba(184,255,87,.35);}
    }
    @keyframes crownbob{
      from{transform:translateX(-50%) translateY(0)}
      to{transform:translateX(-50%) translateY(-3px)}
    }
    @keyframes pulse{
      0%,100%{opacity:1}50%{opacity:.5}
    }
    @keyframes shimmer{
      from{transform:translateX(-100%)}to{transform:translateX(300%)}
    }
  `;
  document.head.appendChild(s);
})();
