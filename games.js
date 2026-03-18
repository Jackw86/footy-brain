// ============================================================
//  Footy Brain — games.js  v3
//  All 6 mini-games. Requires app.js, data.js, packs.js.
//  Calls handleGameResult(gameKey, score) on completion.
// ============================================================

'use strict';

// ─────────────────────────────────────────────
//  SHARED CANVAS UTILITIES
// ─────────────────────────────────────────────
function getCSS(prop) {
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
}

function drawPitch(ctx, w, h, darkStripes = true) {
  // Base grass
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1a5c30');
  g.addColorStop(1, '#143f22');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Stripe shading
  if (darkStripes) {
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    for (let y = 0; y < h; y += 40) {
      ctx.fillRect(0, y, w, 20);
    }
  }
}

function drawBall(ctx, x, y, r = 11, shadow = true) {
  if (shadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur  = 8;
    ctx.shadowOffsetY = 3;
  }
  // White body
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  if (shadow) ctx.restore();
  // Black outline
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  // Patches
  ctx.fillStyle = '#222';
  [[0, -r * 0.6], [r * 0.5, r * 0.35], [-r * 0.5, r * 0.35]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawGoal(ctx, gx, gy, gw, gh) {
  // Posts
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 3;
  ctx.strokeRect(gx, gy, gw, gh);
  // Net lines vertical
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth   = 1;
  for (let x = gx + 20; x < gx + gw; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy + gh); ctx.stroke();
  }
  // Net lines horizontal
  for (let y = gy + 18; y < gy + gh; y += 18) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke();
  }
}

function drawKeeper(ctx, x, y, color = '#f97316') {
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x - 17, y - 28, 34, 46);
  // Head
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(x, y - 36, 14, 0, Math.PI * 2);
  ctx.fill();
  // Cap brim
  ctx.fillStyle = color;
  ctx.fillRect(x - 16, y - 48, 32, 7);
  // Gloves
  ctx.fillStyle = '#f97316';
  ctx.fillRect(x - 30, y - 18, 13, 11);
  ctx.fillRect(x + 17, y - 18, 13, 11);
}

// ─────────────────────────────────────────────
//  GAME ROUTER
// ─────────────────────────────────────────────
let _activeGameCleanup = null;

function showGame(name) {
  // Cancel any running game loop
  if (_activeGameCleanup) { _activeGameCleanup(); _activeGameCleanup = null; }

  // Freemium gate
  if (typeof canAccessGame === 'function' && !canAccessGame(name)) {
    showPremiumModal();
    return;
  }

  el('gameTitle').textContent = (GAME_META[name] || {}).emoji + ' '
    + (GAME_META[name] || {}).name || name;

  const container = el('game-container');
  container.innerHTML = '';
  showScreen('game-screen');

  const builders = {
    penalty:  buildPenaltyGame,
    offside:  buildOffsideGame,
    freekick: buildFreeKickGame,
    rondo:    buildRondoGame,
    scanning: buildScanningGame,
    header:   buildHeaderGame,
  };
  const fn = builders[name];
  if (fn) fn(container, name);
}

function el(id) { return document.getElementById(id); }

// ─────────────────────────────────────────────
//  GAME END HELPER
// ─────────────────────────────────────────────
function gameOver(container, gameName, score, maxScore, xpEarned) {
  // Delegate to pack system — awards XP and opens prize pack if score >= target
  if (typeof handleGameResult === 'function') {
    handleGameResult(gameName, score);
  } else {
    if (!S.gameHighScores) S.gameHighScores = {};
    const prev = S.gameHighScores[gameName] || 0;
    if (score > prev) S.gameHighScores[gameName] = score;
    saveState();
    addXP(xpEarned);
  }

  const pct   = Math.round(score / maxScore * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 50 ? '👍' : '💪';

  container.innerHTML = `
    <div style="text-align:center;padding:2rem 1rem;">
      <div style="font-size:4.5rem;margin-bottom:.6rem;">${emoji}</div>
      <h2 class="display" style="font-size:2.8rem;
          color:${pct>=60?'var(--accent)':'var(--amber)'};line-height:1;">
        ${score} / ${maxScore}
      </h2>
      <div style="color:var(--text2);font-size:.82rem;margin:.5rem 0 1rem;">
        ${score >= GAME_TARGET
          ? `🎁 Score ${score >= GAME_TARGET ? 'qualifies' : 'doesn\'t qualify'} for a prize pack!`
          : `Score ${GAME_TARGET}+ to win a prize pack next time!`}
      </div>
      <div style="display:flex;flex-direction:column;gap:.55rem;">
        <button class="btn btn-accent" style="width:100%;"
          onclick="showGame('${gameName}')">Play Again 🔁</button>
        <button class="btn btn-ghost" style="width:100%;"
          onclick="backToHome()">Back to Academy 🏠</button>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
//  1. PENALTY SHOOTOUT
// ═══════════════════════════════════════════════════════════
function buildPenaltyGame(container) {
  const KICKS = 5;
  let score = 0, kick = 0, phase = 'aim'; // aim | fly | result
  let power = 0, powerDir = 1, powerAnimId;
  let aimX, aimY;
  let ballX, ballY, ballVx, ballVy;
  let keeperX, keeperDir = 1;
  let animId;

  container.innerHTML = `
    <div style="text-align:center;">
      <div style="display:flex;justify-content:center;gap:2rem;margin-bottom:.6rem;">
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--green);"
            id="pg-score">0</div><div style="font-size:.72rem;color:var(--text2);">Goals</div></div>
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--text2);"
            id="pg-kick">1/${KICKS}</div><div style="font-size:.72rem;color:var(--text2);">Kick</div></div>
      </div>
      <canvas id="pg-canvas" width="340" height="290"
        style="border-radius:14px;touch-action:none;cursor:crosshair;max-width:100%;"></canvas>
      <div style="margin-top:.75rem;">
        <div style="font-size:.82rem;color:var(--text2);margin-bottom:.4rem;" id="pg-msg">
          Drag on canvas to aim — release to shoot!
        </div>
        <div style="background:#1e2d4a;border-radius:99px;height:14px;width:240px;
            margin:0 auto .75rem;overflow:hidden;">
          <div id="pg-power" style="height:100%;width:0%;border-radius:99px;
              background:linear-gradient(90deg,var(--green),var(--orange),var(--red));
              transition:width .04s;"></div>
        </div>
        <button id="pg-btn" class="btn btn-green" style="width:100%;font-size:1rem;">
          Hold to Charge ⚡
        </button>
      </div>
    </div>`;

  const canvas = el('pg-canvas');
  const ctx    = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const GX = 70, GY = 35, GW = 200, GH = 95;

  function resetRound() {
    phase   = 'aim';
    power   = 0;
    ballX   = W / 2; ballY = H - 38;
    aimX    = W / 2; aimY  = GY + GH / 2;
    keeperX = W / 2;
    el('pg-power').style.width = '0%';
    el('pg-msg').textContent   = 'Drag on canvas to aim — release to shoot!';
    el('pg-btn').disabled      = false;
    el('pg-btn').textContent   = 'Hold to Charge ⚡';
  }
  resetRound();

  // Aim dragging
  function getXY(e) {
    const r = canvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return [cx * (W / r.width), cy * (H / r.height)];
  }
  canvas.addEventListener('mousemove',  e => { if (phase==='aim'){ [aimX,aimY]=getXY(e); } });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); if (phase==='aim'){ [aimX,aimY]=getXY(e); } }, { passive:false });

  // Power button
  let holding = false;
  const btn = el('pg-btn');
  function startHold()  { if (phase!=='aim') return; holding=true; power=0; }
  function releaseHold(){ if (!holding) return; holding=false; shoot(); }
  btn.addEventListener('mousedown',  startHold);
  btn.addEventListener('touchstart', e=>{ e.preventDefault(); startHold(); }, { passive:false });
  btn.addEventListener('mouseup',    releaseHold);
  btn.addEventListener('touchend',   releaseHold);

  function shoot() {
    if (phase !== 'aim') return;
    phase = 'fly';
    const dx = aimX - W/2, dy = aimY - (H - 38);
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    const spd  = 6 + power * 0.08;
    ballVx = (dx / dist) * spd;
    ballVy = (dy / dist) * spd;
    btn.disabled     = true;
    btn.textContent  = '...';
    keeperX = W / 2 + (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 50);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawPitch(ctx, W, H);

    // Penalty arc
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(W/2, H-38, 60, Math.PI, 2*Math.PI);
    ctx.stroke();

    // Penalty spot
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(W/2, H-38, 3.5, 0, Math.PI*2); ctx.fill();

    drawGoal(ctx, GX, GY, GW, GH);

    // Aim line & crosshair (only in aim phase)
    if (phase === 'aim') {
      ctx.save();
      ctx.strokeStyle = 'rgba(34,197,94,.55)';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([6,5]);
      ctx.beginPath();
      ctx.moveTo(W/2, H-38);
      ctx.lineTo(aimX, aimY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // Crosshair ring
      ctx.strokeStyle = 'rgba(34,197,94,.85)';
      ctx.lineWidth   = 2;
      ctx.beginPath(); ctx.arc(aimX, aimY, 14, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(aimX-18,aimY); ctx.lineTo(aimX+18,aimY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(aimX,aimY-18); ctx.lineTo(aimX,aimY+18); ctx.stroke();
    }

    // Keeper sway
    if (phase === 'aim') {
      keeperX += keeperDir * 2.2;
      if (keeperX > GX+GW-25 || keeperX < GX+25) keeperDir *= -1;
    }
    drawKeeper(ctx, keeperX, GY + GH - 5);

    // Ball
    drawBall(ctx, ballX, ballY);

    // Power bar fill while holding
    if (holding && phase === 'aim') {
      power = Math.min(power + 1.5, 100);
      el('pg-power').style.width = power + '%';
    }

    // Ball in flight
    if (phase === 'fly') {
      ballX += ballVx;
      ballY += ballVy;
      // Check arrival
      if (ballY <= GY + GH) {
        phase = 'result';
        const inGoal   = ballX > GX && ballX < GX+GW && ballY > GY;
        const saved    = inGoal && Math.abs(ballX - keeperX) < 38 && Math.random() < 0.42;
        const hitPost  = (Math.abs(ballX - GX) < 5 || Math.abs(ballX - (GX+GW)) < 5) && ballY > GY;
        let msg;
        if (hitPost)        { msg = 'Off the post! 🏃'; }
        else if (saved)     { msg = 'SAVED! 🧤'; }
        else if (inGoal)    { score++; el('pg-score').textContent=score; msg = 'GOAL! ⚽🔥'; addXP(5); }
        else                { msg = 'Off target 😬'; }
        el('pg-msg').textContent = msg;
        kick++;
        el('pg-kick').textContent = `${Math.min(kick+1,KICKS)}/${KICKS}`;

        setTimeout(() => {
          if (kick >= KICKS) {
            _activeGameCleanup = null;
            cancelAnimationFrame(animId);
            const xp = score * 4;
            addXP(xp);
            gameOver(container, 'penalty', score, KICKS, xp);
          } else {
            resetRound();
          }
        }, 1100);
      }
    }
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }
  _activeGameCleanup = () => cancelAnimationFrame(animId);
  loop();
}

// ═══════════════════════════════════════════════════════════
//  2. OFFSIDE JUDGE
// ═══════════════════════════════════════════════════════════
function buildOffsideGame(container) {
  const SCENARIOS = [
    { offside:false, exp:'Level with the last defender is ONSIDE — not in front of them.',
      setup:(ctx,W,H)=>{ drawScenario(ctx,W,H,[[220,120,'b'],[220,130,'r'],[150,100,'b']],'b','Level with defender'); }},
    { offside:true,  exp:'Even one step ahead of the last defender is OFFSIDE.',
      setup:(ctx,W,H)=>{ drawScenario(ctx,W,H,[[225,120,'b'],[210,120,'r'],[150,100,'b']],'b','One step ahead'); }},
    { offside:false, exp:'You cannot be offside in your own half of the pitch.',
      setup:(ctx,W,H)=>{ drawScenario(ctx,W,H,[[100,140,'b'],[250,120,'r'],[280,140,'r']],'b','Own half'); }},
    { offside:true,  exp:'Any body part you can score with counts — a shoulder ahead is offside.',
      setup:(ctx,W,H)=>{ drawScenario(ctx,W,H,[[226,118,'b'],[215,120,'r'],[160,100,'b']],'b','Shoulder ahead'); }},
    { offside:false, exp:'No offside from a throw-in, corner or goal kick.',
      setup:(ctx,W,H)=>{ drawScenario(ctx,W,H,[[240,100,'b'],[210,120,'r'],[160,130,'b']],'b','From throw-in'); }},
    { offside:false, exp:'Being in an offside position isn\'t an offence — you must be active in play.',
      setup:(ctx,W,H)=>{ drawScenario(ctx,W,H,[[245,100,'b'],[205,120,'r'],[170,130,'b']],'b','Not active'); }},
    { offside:true,  exp:'Clearly ahead of the last defender — OFFSIDE.',
      setup:(ctx,W,H)=>{ drawScenario(ctx,W,H,[[250,110,'b'],[200,120,'r'],[160,130,'b']],'b','Clearly ahead'); }},
    { offside:false, exp:'Arms are excluded — only body parts you can score with count.',
      setup:(ctx,W,H)=>{ drawScenario(ctx,W,H,[[222,118,'b'],[213,120,'r'],[160,130,'b']],'b','Arm only'); }},
    { offside:true,  exp:'Two defenders but the striker is ahead of both — OFFSIDE.',
      setup:(ctx,W,H)=>{ drawScenario(ctx,W,H,[[255,105,'b'],[215,120,'r'],[235,125,'r']],'b','Ahead of both'); }},
    { offside:false, exp:'Goalkeeper counts as one of the last two defenders.',
      setup:(ctx,W,H)=>{ drawScenario(ctx,W,H,[[225,120,'b'],[220,118,'r'],[310,155,'r']],'b','GK counts'); }},
  ];

  const shuffled = [...SCENARIOS].sort(() => Math.random() - .5);
  let idx = 0, score = 0, answered = false;

  function render() {
    if (idx >= shuffled.length) {
      const xp = score * 4;
      addXP(xp);
      gameOver(container, 'offside', score, shuffled.length, xp);
      return;
    }
    answered = false;
    const sc = shuffled[idx];
    container.innerHTML = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;">
          <div style="font-size:.78rem;color:var(--text2);">Q${idx+1}/${shuffled.length}</div>
          <div style="font-weight:700;color:var(--green);">Score: ${score}</div>
        </div>
        <canvas id="os-canvas" width="340" height="220"
          style="border-radius:14px;width:100%;max-width:340px;display:block;margin:0 auto .75rem;">
        </canvas>
        <p style="font-weight:700;text-align:center;margin-bottom:.75rem;font-size:.95rem;">
          Is the attacker (blue) ONSIDE or OFFSIDE?
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:.75rem;">
          <button class="btn btn-green" id="os-on"  onclick="osJudge(false)" style="padding:.9rem;">
            ✅ ONSIDE
          </button>
          <button class="btn btn-red"   id="os-off" onclick="osJudge(true)"  style="padding:.9rem;">
            🚩 OFFSIDE
          </button>
        </div>
        <div id="os-feedback"></div>
      </div>`;

    const canvas = el('os-canvas');
    const ctx    = canvas.getContext('2d');
    sc.setup(ctx, canvas.width, canvas.height);

    window.osJudge = (val) => {
      if (answered) return;
      answered = true;
      el('os-on').disabled  = true;
      el('os-off').disabled = true;
      const correct = val === sc.offside;
      if (correct) score++;
      el('os-feedback').innerHTML = `
        <div class="card2" style="border-left:3px solid ${correct?'var(--green)':'var(--red)'};">
          <div style="font-weight:700;color:${correct?'var(--green)':'var(--red)'};margin-bottom:.25rem;">
            ${correct ? '✅ Correct!' : '❌ Wrong!'}
          </div>
          <div style="font-size:.85rem;color:var(--text2);">${sc.exp}</div>
        </div>
        <button class="btn btn-gray" style="width:100%;margin-top:.6rem;"
          onclick="osNext()">Next →</button>`;
    };
    window.osNext = () => { idx++; render(); };
  }

  function drawScenario(ctx, W, H, players, attackerTeam, label) {
    drawPitch(ctx, W, H, false);
    ctx.fillStyle = '#1a5c30'; ctx.fillRect(0, 0, W, H);
    // Pitch lines
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, W-20, H-20);
    ctx.beginPath(); ctx.moveTo(W/2, 10); ctx.lineTo(W/2, H-10); ctx.stroke();

    // Find last defender x (rightmost red = last defender)
    const reds   = players.filter(p => p[2]==='r').sort((a,b)=>b[0]-a[0]);
    const lastDef = reds[0];

    if (lastDef) {
      // Offside line
      ctx.strokeStyle = 'rgba(248,113,113,.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(lastDef[0], 5); ctx.lineTo(lastDef[0], H-5); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(248,113,113,.85)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Last defender', lastDef[0], H-8);
    }

    // Draw players
    players.forEach(([px, py, team]) => {
      const isAttacker = team === attackerTeam;
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, Math.PI*2);
      ctx.fillStyle = team === 'b' ? '#3b82f6' : '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${isAttacker?11:10}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(team === 'b' ? 'A' : 'D', px, py);
    });

    // Ball (near attacker)
    const attacker = players.find(p => p[2] === attackerTeam);
    if (attacker) drawBall(ctx, attacker[0]-35, attacker[1], 8, false);

    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(`Situation: ${label}`, 14, 14);
    ctx.textBaseline = 'alphabetic';
  }

  render();
}

// ═══════════════════════════════════════════════════════════
//  3. FREE-KICK MASTER
// ═══════════════════════════════════════════════════════════
function buildFreeKickGame(container) {
  const ROUNDS = 5;
  let score = 0, round = 1, phase = 'aim';
  let aimX, aimY, curvX;
  let ballX, ballY, t = 0;
  let keeperX, keeperDir = 1;
  let animId;
  let isDragging = false;

  const W = 340, H = 300;
  const GX = 60, GY = 30, GW = 220, GH = 100;
  const BALL_START_X = W/2, BALL_START_Y = H-35;

  container.innerHTML = `
    <div style="text-align:center;">
      <div style="display:flex;justify-content:center;gap:2rem;margin-bottom:.5rem;">
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--green);"
            id="fk-score">0</div><div style="font-size:.72rem;color:var(--text2);">Goals</div></div>
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--text2);"
            id="fk-round">1/${ROUNDS}</div><div style="font-size:.72rem;color:var(--text2);">Round</div></div>
      </div>
      <canvas id="fk-canvas" width="${W}" height="${H}"
        style="border-radius:14px;touch-action:none;cursor:crosshair;max-width:100%;"></canvas>
      <p style="font-size:.82rem;color:var(--text2);margin:.6rem 0 .4rem;" id="fk-msg">
        Tap to set target · Drag left/right to add curve
      </p>
      <button id="fk-btn" class="btn btn-green" style="width:100%;">Shoot ⚡</button>
    </div>`;

  const canvas = el('fk-canvas');
  const ctx    = canvas.getContext('2d');

  function resetRound() {
    phase  = 'aim';
    ballX  = BALL_START_X; ballY = BALL_START_Y; t = 0;
    aimX   = W/2; aimY = GY + GH/2; curvX = 0;
    keeperX = W/2;
    el('fk-btn').disabled = false;
    el('fk-btn').textContent = 'Shoot ⚡';
    el('fk-msg').textContent = 'Tap to set target · Drag left/right to add curve';
    el('fk-round').textContent = `${round}/${ROUNDS}`;
  }
  resetRound();

  function getXY(e) {
    const r = canvas.getBoundingClientRect();
    return [
      ((e.touches?e.touches[0].clientX:e.clientX)-r.left)*(W/r.width),
      ((e.touches?e.touches[0].clientY:e.clientY)-r.top)*(H/r.height),
    ];
  }

  let dragStartX = null;
  canvas.addEventListener('mousedown',  e => { isDragging=true; [aimX,aimY]=getXY(e); dragStartX=aimX; });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); isDragging=true; [aimX,aimY]=getXY(e); dragStartX=aimX; }, {passive:false});
  canvas.addEventListener('mousemove',  e => { if (!isDragging||phase!=='aim') return; const [x,y]=getXY(e); aimX=x; aimY=y; curvX=(x-dragStartX)*0.6; });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); if (!isDragging||phase!=='aim') return; const [x,y]=getXY(e); aimX=x; aimY=y; curvX=(x-dragStartX)*0.6; }, {passive:false});
  canvas.addEventListener('mouseup',    () => isDragging=false);
  canvas.addEventListener('touchend',   () => isDragging=false);

  el('fk-btn').addEventListener('click', () => {
    if (phase !== 'aim') return;
    phase = 'fly'; t = 0;
    el('fk-btn').disabled = true;
    keeperX = W/2 + (Math.random()>.5?1:-1)*(20+Math.random()*60);
  });

  // Wall positions (randomly placed each round)
  let wall = [];
  function buildWall() {
    wall = [];
    const n = 2 + Math.floor(round/2);
    const cx = W/2;
    for (let i=0;i<n;i++) wall.push(cx - (n-1)*16 + i*32);
  }
  buildWall();

  function drawWall(ctx) {
    wall.forEach(wx => {
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(wx-13, H-90, 26, 50);
      ctx.fillStyle = '#fda4af';
      ctx.beginPath(); ctx.arc(wx, H-98, 12, 0, Math.PI*2); ctx.fill();
    });
  }

  // Bezier curve helpers
  function bezier(p0,p1,p2,p3,t){
    const mt=1-t;
    return mt*mt*mt*p0 + 3*mt*mt*t*p1 + 3*mt*t*t*p2 + t*t*t*p3;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawPitch(ctx, W, H);

    // Goal
    drawGoal(ctx, GX, GY, GW, GH);

    // Wall
    drawWall(ctx);

    // Keeper
    if (phase === 'aim') {
      keeperX += keeperDir * 2;
      if (keeperX > GX+GW-20 || keeperX < GX+20) keeperDir *= -1;
    }
    drawKeeper(ctx, keeperX, GY+GH-5);

    // Aim preview (bezier path)
    if (phase === 'aim') {
      const cx1 = BALL_START_X + curvX * 0.5;
      const cx2 = aimX + curvX * 0.5;
      ctx.save();
      ctx.strokeStyle = 'rgba(34,197,94,.4)';
      ctx.lineWidth = 1.5; ctx.setLineDash([5,5]);
      ctx.beginPath();
      ctx.moveTo(BALL_START_X, BALL_START_Y);
      ctx.bezierCurveTo(cx1, BALL_START_Y-(BALL_START_Y-aimY)*0.4,
                        cx2, aimY+(BALL_START_Y-aimY)*0.4, aimX, aimY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // Target ring
      ctx.strokeStyle = 'rgba(34,197,94,.9)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(aimX,aimY,13,0,Math.PI*2); ctx.stroke();
    }

    // Ball in flight
    if (phase === 'fly') {
      t += 0.035;
      if (t > 1) t = 1;
      const cx1 = BALL_START_X + curvX * 0.5;
      const cx2 = aimX + curvX * 0.5;
      ballX = bezier(BALL_START_X, cx1, cx2, aimX, t);
      ballY = bezier(BALL_START_Y, BALL_START_Y-(BALL_START_Y-aimY)*0.5,
                     aimY+(BALL_START_Y-aimY)*0.3, aimY, t);

      if (t >= 1) {
        phase = 'result';
        const inGoal    = ballX>GX && ballX<GX+GW && ballY>GY && ballY<GY+GH;
        const wallHit   = wall.some(wx => Math.abs(ballX-wx)<18 && ballY>H-100);
        const keepSave  = inGoal && Math.abs(ballX-keeperX)<35 && Math.random()<0.38;
        let msg;
        if (wallHit)       msg = 'Blocked by the wall! 🧱';
        else if (keepSave) msg = 'Great save! 🧤';
        else if (inGoal)   { score++; el('fk-score').textContent=score; msg='GOAL! ⚡🔥'; addXP(6); }
        else               msg = 'Off target! Try again...';
        el('fk-msg').textContent = msg;

        setTimeout(() => {
          if (round >= ROUNDS) {
            _activeGameCleanup = null;
            cancelAnimationFrame(animId);
            const xp = score * 5;
            addXP(xp);
            gameOver(container,'freekick',score,ROUNDS,xp);
          } else {
            round++;
            buildWall();
            resetRound();
          }
        }, 1100);
      }
    }

    // Ball
    drawBall(ctx, ballX, ballY);
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }
  _activeGameCleanup = () => cancelAnimationFrame(animId);
  loop();
}

// ═══════════════════════════════════════════════════════════
//  4. KEEP-AWAY RONDO  (possession IQ quiz)
// ═══════════════════════════════════════════════════════════
function buildRondoGame(container) {
  const QUESTIONS = [
    { q:'You have the ball. Two teammates are free. One is closer, one has more space. Who do you pick?',
      opts:['The closer teammate','The one with more space and time','Either — doesn\'t matter','Hold it and wait'],
      a:1, exp:'More space = more time = more options for the receiver. Always pass to quality, not just proximity.' },
    { q:'You\'re pressed from behind with a teammate making a run wide left. What do you do?',
      opts:['Turn into the pressure','Shield and wait','Play wide to the running teammate','Kick it away'],
      a:2, exp:'Use the run — pass to where your teammate is heading. Their movement has created space you must exploit.' },
    { q:'3v1 rondo. You have the ball. Both free teammates are at equal distance. One faces away from the presser, one faces toward. Who do you pass to?',
      opts:['The one facing the presser','The one facing away — they have a better angle out','Doesn\'t matter','Dribble instead'],
      a:1, exp:'The player with their back to pressure has a better escape angle — they can take a touch away and still be safe.' },
    { q:'In rondo, where should the "spare" player position themselves?',
      opts:['Right beside the ball carrier','Between two opponents — making themselves an option for either teammate','As far away as possible','Behind the presser'],
      a:1, exp:'The spare player creates double options — standing between opponents means they can receive from either direction and the presser can\'t cover both.' },
    { q:'A pressing player is coming at you quickly. What should your first touch do?',
      opts:['Take the ball toward the presser','Keep the ball in the same spot','Take the ball away from pressure, creating space and an angle','Always go backwards'],
      a:2, exp:'A smart first touch away from pressure buys you time and opens passing lanes. It\'s a weapon, not just control.' },
    { q:'You receive under pressure with no clear pass. What is your best option?',
      opts:['Force a risky forward pass','Shield the ball, buy time, wait for a teammate to give you an angle','Kick it long','Dribble through the press'],
      a:1, exp:'Shielding and waiting for a passing angle is brave, intelligent football. Forcing a pass under pressure leads to turnovers.' },
  ];

  let idx = 0, score = 0, answered = false;

  function render() {
    if (idx >= QUESTIONS.length) {
      const xp = score * 5;
      addXP(xp);
      gameOver(container,'rondo',score,QUESTIONS.length,xp);
      return;
    }
    answered = false;
    const q = QUESTIONS[idx];

    container.innerHTML = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;">
          <div style="font-size:.78rem;color:var(--text2);">Q${idx+1}/${QUESTIONS.length}</div>
          <div style="font-weight:700;color:var(--green);">Score: ${score}</div>
        </div>
        <div class="card" style="margin-bottom:1rem;text-align:center;padding:1.25rem;">
          <div style="font-size:2.5rem;margin-bottom:.5rem;">🔄</div>
          <p style="font-weight:700;font-size:.95rem;line-height:1.5;">${q.q}</p>
        </div>
        <div id="rondo-opts" style="display:flex;flex-direction:column;gap:.5rem;"></div>
        <div id="rondo-fb" style="margin-top:.75rem;"></div>
      </div>`;

    const optsEl = el('rondo-opts');
    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.id = `ro-${i}`;
      btn.innerHTML = `<span style="font-weight:900;color:var(--green);margin-right:.35rem;">
        ${String.fromCharCode(65+i)}.</span>${opt}`;
      btn.onclick = () => rondoAnswer(i, q);
      optsEl.appendChild(btn);
    });
  }

  window.rondoAnswer = (idx_, q) => {
    if (answered) return;
    answered = true;
    document.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true);
    const correct = idx_ === q.a;
    if (correct) score++;
    el(`ro-${idx_}`) && el(`ro-${idx_}`).classList.add(correct ? 'correct' : 'wrong');
    el(`ro-${q.a}`)  && el(`ro-${q.a}`).classList.add('correct');
    el('rondo-fb').innerHTML = `
      <div class="card2" style="border-left:3px solid ${correct?'var(--green)':'var(--red)'};">
        <div style="font-weight:700;color:${correct?'var(--green)':'var(--red)'};margin-bottom:.25rem;">
          ${correct?'✅ Correct!':'❌ Wrong!'}
        </div>
        <div style="font-size:.85rem;color:var(--text2);">${q.exp}</div>
      </div>
      <button class="btn btn-gray" style="width:100%;margin-top:.6rem;"
        onclick="rondoNext()">Next →</button>`;
    correct ? playCorrect() : playWrong();
  };
  window.rondoNext = () => { idx++; render(); };
  render();
}

// ═══════════════════════════════════════════════════════════
//  5. SCANNING DRILL
// ═══════════════════════════════════════════════════════════
function buildScanningGame(container) {
  const ROUNDS = 8;
  // Each scenario: players array, question, answer, options
  const POOL = [
    { players:[{x:80,y:100,t:'b'},{x:85,y:108,t:'r'},{x:200,y:90,t:'b'},
               {x:270,y:130,t:'r'},{x:260,y:125,t:'b'}],
      q:'How many BLUE players are unmarked (not near a red)?',
      opts:['1','2','3','0'], a:1,
      exp:'Players at x=200 and x=260 are free from nearby reds.' },
    { players:[{x:60,y:100,t:'b'},{x:65,y:108,t:'r'},{x:220,y:130,t:'b'},
               {x:270,y:80,t:'b'},{x:275,y:88,t:'r'}],
      q:'Which zone has a FREE blue player? (Left / Centre / Right)',
      opts:['Left','Centre','Right','None'], a:1,
      exp:'The blue player at x≈220 (centre area) has no nearby red.' },
    { players:[{x:140,y:80,t:'b'},{x:145,y:88,t:'r'},{x:80,y:170,t:'b'},
               {x:250,y:160,t:'b'},{x:255,y:168,t:'r'}],
      q:'One blue player is completely free. Where are they roughly?',
      opts:['Top centre','Bottom left','Bottom right','Top left'], a:1,
      exp:'The blue at x≈80,y≈170 (bottom left) has no red nearby.' },
    { players:[{x:100,y:90,t:'b'},{x:180,y:90,t:'b'},{x:250,y:90,t:'b'},
               {x:180,y:180,t:'r'},{x:185,y:175,t:'r'}],
      q:'How many blue players are in the top half of the field?',
      opts:['1','2','3','0'], a:2,
      exp:'All three blue players (y≈90) are in the top half.' },
    { players:[{x:70,y:150,t:'r'},{x:75,y:155,t:'b'},{x:200,y:80,t:'b'},
               {x:260,y:150,t:'r'},{x:140,y:150,t:'b'}],
      q:'Which blue player is most under pressure from a red?',
      opts:['Top (x≈200)','Left (x≈75)','Middle (x≈140)','Right'], a:1,
      exp:'The blue at x≈75 is right next to a red — most under pressure.' },
    { players:[{x:80,y:80,t:'b'},{x:200,y:80,t:'b'},{x:200,y:170,t:'r'},
               {x:270,y:80,t:'r'},{x:140,y:130,t:'b'}],
      q:'How many blue players are in the RIGHT half of the field?',
      opts:['0','1','2','3'], a:1,
      exp:'Only the blue at x≈270 area — actually that\'s red. Only x≈200 blue is right of centre (x=170).' },
    { players:[{x:80,y:100,t:'b'},{x:240,y:100,t:'b'},{x:80,y:100,t:'r'},
               {x:160,y:80,t:'b'},{x:165,y:85,t:'r'}],
      q:'How many blue players are completely free of pressure?',
      opts:['0','1','2','3'], a:1,
      exp:'x≈240 blue has no nearby red — the others are under pressure.' },
    { players:[{x:100,y:60,t:'b'},{x:200,y:60,t:'r'},{x:300,y:60,t:'b'},
               {x:100,y:180,t:'r'},{x:200,y:180,t:'b'}],
      q:'Where is there a free blue player in the BOTTOM row?',
      opts:['Left','Centre','Right','None'], a:1,
      exp:'The blue at x≈200,y≈180 (bottom centre) has no red nearby.' },
  ];

  const shuffled = [...POOL].sort(()=>Math.random()-.5).slice(0, ROUNDS);
  let idx = 0, score = 0, flashTimer = null, answered = false;
  const FLASH_MS = 1600; // how long the canvas shows

  function render() {
    if (idx >= shuffled.length) {
      const xp = score * 5;
      addXP(xp);
      gameOver(container,'scanning',score,ROUNDS,xp);
      return;
    }
    answered = false;
    const sc = shuffled[idx];

    container.innerHTML = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;">
          <div style="font-size:.78rem;color:var(--text2);">Round ${idx+1}/${ROUNDS}</div>
          <div style="font-weight:700;color:var(--green);">Score: ${score}</div>
        </div>
        <p style="font-size:.8rem;color:var(--orange);text-align:center;margin-bottom:.4rem;">
          👁️ Scan quickly — the pitch will flash for ${FLASH_MS/1000}s!
        </p>
        <canvas id="sc-canvas" width="340" height="220"
          style="border-radius:14px;width:100%;max-width:340px;display:block;margin:0 auto .75rem;
                 border:2px solid var(--green);">
        </canvas>
        <p style="font-weight:700;font-size:.92rem;margin-bottom:.75rem;">${sc.q}</p>
        <div id="sc-opts" style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;"></div>
        <div id="sc-fb" style="margin-top:.75rem;"></div>
      </div>`;

    const canvas = el('sc-canvas');
    const ctx    = canvas.getContext('2d');
    drawScanCanvas(ctx, canvas.width, canvas.height, sc.players);

    // Flash: show then hide canvas after FLASH_MS
    flashTimer = setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('What did you see?', canvas.width/2, canvas.height/2);
    }, FLASH_MS);

    const optsEl = el('sc-opts');
    sc.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.id = `sc-${i}`;
      btn.textContent = opt;
      btn.onclick = () => scanAnswer(i, sc);
      optsEl.appendChild(btn);
    });
  }

  window.scanAnswer = (i, sc) => {
    if (answered) return;
    answered = true;
    clearTimeout(flashTimer);
    // Redraw canvas with answer reveal
    const canvas = el('sc-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawScanCanvas(ctx, canvas.width, canvas.height, sc.players);
    }
    document.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true);
    const correct = i === sc.a;
    if (correct) score++;
    el(`sc-${i}`)    && el(`sc-${i}`).classList.add(correct?'correct':'wrong');
    el(`sc-${sc.a}`) && el(`sc-${sc.a}`).classList.add('correct');
    el('sc-fb').innerHTML = `
      <div class="card2" style="border-left:3px solid ${correct?'var(--green)':'var(--red)'};">
        <div style="font-weight:700;color:${correct?'var(--green)':'var(--red)'};margin-bottom:.25rem;">
          ${correct?'✅ Spotted it!':'❌ Missed it!'}
        </div>
        <div style="font-size:.82rem;color:var(--text2);">${sc.exp}</div>
      </div>
      <button class="btn btn-gray" style="width:100%;margin-top:.6rem;"
        onclick="scanNext()">Next →</button>`;
    correct ? playCorrect() : playWrong();
  };
  window.scanNext = () => { idx++; render(); };

  function drawScanCanvas(ctx, W, H, players) {
    ctx.fillStyle = '#1a5c30'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, W-16, H-16);
    ctx.beginPath(); ctx.moveTo(W/2,8); ctx.lineTo(W/2,H-8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8,H/2); ctx.lineTo(W-8,H/2); ctx.stroke();

    players.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 16, 0, Math.PI*2);
      ctx.fillStyle = p.t==='b'?'#3b82f6':'#ef4444';
      ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='bold 11px sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(p.t==='b'?'B':'R', p.x, p.y);
    });
  }

  render();
}

// ═══════════════════════════════════════════════════════════
//  6. HEADER CHALLENGE
// ═══════════════════════════════════════════════════════════
function buildHeaderGame(container) {
  const ROUNDS = 5;
  let score = 0, round = 0, animId;
  let ballX, ballY, ballVx, ballVy, phase = 'wait';
  let defY = 0, defDir = 1; // defender bob

  const W = 340, H = 320;
  const PLAYER_X = W/2;
  const HEAD_Y   = H - 80;

  container.innerHTML = `
    <div style="text-align:center;">
      <div style="display:flex;justify-content:center;gap:2rem;margin-bottom:.5rem;">
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--green);"
            id="hd-score">0</div><div style="font-size:.72rem;color:var(--text2);">Headers</div></div>
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--text2);"
            id="hd-round">1/${ROUNDS}</div><div style="font-size:.72rem;color:var(--text2);">Round</div></div>
      </div>
      <canvas id="hd-canvas" width="${W}" height="${H}"
        style="border-radius:14px;max-width:100%;"></canvas>
      <p id="hd-msg" style="font-size:.82rem;color:var(--text2);margin:.6rem 0 .5rem;">
        Tap the button when the ball is at head height!
      </p>
      <button id="hd-btn" class="btn btn-green" style="width:100%;font-size:1rem;">
        Jump & Head! 🏹
      </button>
    </div>`;

  const canvas = el('hd-canvas');
  const ctx    = canvas.getContext('2d');

  function launchBall() {
    // Ball comes from varying angles
    const side   = Math.random() > .5 ? 1 : -1;
    ballX  = side > 0 ? -15 : W + 15;
    ballY  = H * 0.15 + Math.random() * H * 0.25;
    ballVx = side > 0 ? (3.5 + Math.random()*2) : -(3.5 + Math.random()*2);
    ballVy = 1.5 + Math.random() * 1.5;
    phase  = 'cross';
  }

  function startRound() {
    phase = 'wait';
    el('hd-round').textContent = `${round+1}/${ROUNDS}`;
    el('hd-btn').disabled  = false;
    el('hd-msg').textContent = 'Get ready...';
    setTimeout(() => { launchBall(); el('hd-msg').textContent = 'Tap when ball reaches your head!'; }, 700);
  }

  startRound();

  el('hd-btn').addEventListener('click', () => {
    if (phase !== 'cross') return;
    const dist   = Math.hypot(ballX - PLAYER_X, ballY - HEAD_Y);
    const window = 38;
    if (dist < window) {
      score++;
      el('hd-score').textContent = score;
      el('hd-msg').textContent   = '💥 Perfect Header!';
      addXP(6);
      phase = 'scored';
      confetti({ particleCount: 35, spread: 45, origin: { y: .65 } });
    } else {
      el('hd-msg').textContent = ballY < HEAD_Y ? '⬆️ Too early!' : '⬇️ Too late!';
      phase = 'missed';
    }
    el('hd-btn').disabled = true;
    round++;
    setTimeout(() => {
      if (round >= ROUNDS) {
        _activeGameCleanup = null;
        cancelAnimationFrame(animId);
        const xp = score * 5;
        addXP(xp);
        gameOver(container, 'header', score, ROUNDS, xp);
      } else {
        startRound();
      }
    }, 900);
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawPitch(ctx, W, H);

    // Stadium crowd silhouette
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.arc(12 + i*24, H-20, 13, 0, Math.PI*2);
      ctx.fill();
    }

    // Crossbar / goal top
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(W, 40); ctx.stroke();

    // Defender (jumps alongside player — timed offset)
    defY += defDir * 1.2;
    if (defY > 8 || defY < -8) defDir *= -1;
    const defX = PLAYER_X + 32;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(defX-12, HEAD_Y-38+defY, 24, 42);
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath(); ctx.arc(defX, HEAD_Y-48+defY, 12, 0, Math.PI*2); ctx.fill();

    // Player
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(PLAYER_X-14, HEAD_Y-35, 28, 45);
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(PLAYER_X, HEAD_Y-44, 14, 0, Math.PI*2); ctx.fill();

    // Timing zone ring (shows when ball is near)
    if (phase === 'cross') {
      const dist = Math.hypot(ballX-PLAYER_X, ballY-HEAD_Y);
      if (dist < 55) {
        const alpha = Math.max(0, 1 - dist/55);
        ctx.strokeStyle = `rgba(34,197,94,${alpha*.8})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.arc(PLAYER_X, HEAD_Y, 36, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Ball
    if (phase === 'cross') {
      ballX += ballVx;
      ballY += ballVy;
      ballVy += 0.08; // gravity
      drawBall(ctx, ballX, ballY, 12);
      if (ballX < -30 || ballX > W+30 || ballY > H+30) {
        if (phase === 'cross') {
          el('hd-msg').textContent = 'Missed the delivery!';
          phase = 'missed';
          el('hd-btn').disabled = true;
          round++;
          setTimeout(() => {
            if (round >= ROUNDS) {
              _activeGameCleanup = null;
              cancelAnimationFrame(animId);
              const xp = score * 5;
              addXP(xp);
              gameOver(container,'header',score,ROUNDS,xp);
            } else { startRound(); }
          }, 800);
        }
      }
    }
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }
  _activeGameCleanup = () => cancelAnimationFrame(animId);
  loop();
}
