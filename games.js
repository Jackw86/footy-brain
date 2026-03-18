// ============================================================
//  Footy Brain — games.js  v4
//  5 premium mini-games, rebuilt from scratch.
//  Penalty game is in penalty3d.js (Three.js 3D).
//  All games: polished visuals, real game feel, football depth.
// ============================================================
'use strict';

// ─────────────────────────────────────────────────────────────
//  SHARED UTILS
// ─────────────────────────────────────────────────────────────

const GAME_META = {
  penalty:  { name:'Penalty Shootout',   emoji:'⚽', max:5  },
  offside:  { name:'Offside Trap',       emoji:'🚩', max:8  },
  freekick: { name:'Free Kick Master',   emoji:'🌀', max:5  },
  rondo:    { name:'Rondo IQ',           emoji:'🎯', max:8  },
  scanning: { name:'Scanning Vision',    emoji:'👁️', max:6  },
  header:   { name:'Aerial Duel',        emoji:'💥', max:5  },
};

let _activeGameCleanup = null;

function showGame(name) {
  if (_activeGameCleanup) { try { _activeGameCleanup(); } catch(e){} _activeGameCleanup = null; }
  const titleEl = el('gameTitle');
  const meta    = GAME_META[name] || {};
  if (titleEl) titleEl.textContent = (meta.emoji||'') + ' ' + (meta.name||name);
  const container = el('game-container');
  if (!container) return;
  container.innerHTML = '';
  showScreen('s-games');
  const builders = {
    penalty:  () => { if (typeof buildPenalty3DGame==='function') buildPenalty3DGame(container); else buildPenaltyFallback(container); },
    offside:  () => buildOffsideGame(container),
    freekick: () => buildFreeKickGame(container),
    rondo:    () => buildRondoGame(container),
    scanning: () => buildScanningGame(container),
    header:   () => buildHeaderGame(container),
  };
  if (builders[name]) builders[name]();
}

function gameOver(container, gameName, score, maxScore, xpEarned) {
  if (typeof handleGameResult==='function') handleGameResult(gameName, score);
  else {
    if (typeof addXP==='function') addXP(xpEarned||0);
    if (typeof S!=='undefined') {
      if (!S.gameHighScores) S.gameHighScores={};
      if (score > (S.gameHighScores[gameName]||0)) { S.gameHighScores[gameName]=score; if(typeof saveState==='function')saveState(); }
    }
  }
  const GAME_TARGET=3;
  const pct=maxScore?Math.round(score/maxScore*100):0;
  const grade=pct===100?'PERFECT':pct>=80?'GREAT':pct>=50?'SOLID':'KEEP GOING';
  const stars=pct===100?'⭐⭐⭐':pct>=80?'⭐⭐':pct>=50?'⭐':'';
  const col=pct>=80?'#b8ff57':pct>=50?'#ffb627':'#ff5e8a';
  container.innerHTML=`
    <div style="text-align:center;padding:2rem 1rem 1.5rem;">
      <div style="font-size:3.2rem;margin-bottom:.35rem;">${stars||'💪'}</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:3.2rem;color:${col};line-height:1;margin-bottom:.2rem;">${grade}</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:rgba(240,244,255,.4);margin-bottom:1rem;">${score} / ${maxScore}</div>
      ${score>=GAME_TARGET?`<div style="background:rgba(184,255,87,.08);border:1px solid rgba(184,255,87,.2);border-radius:12px;padding:.6rem .9rem;margin-bottom:1rem;font-size:.82rem;">🎁 You qualify for a prize pack!</div>`:`<div style="font-size:.75rem;color:rgba(240,244,255,.3);margin-bottom:1rem;">Score ${GAME_TARGET}+ to win a prize pack next time</div>`}
      <div style="display:flex;flex-direction:column;gap:.5rem;">
        <button onclick="showGame('${gameName}')" style="width:100%;padding:.88rem;border:none;border-radius:13px;background:linear-gradient(135deg,#b8ff57,#5edfff);color:#000;font-family:'DM Sans',sans-serif;font-weight:900;font-size:.95rem;cursor:pointer;">Play Again 🔁</button>
        <button onclick="goHome()" style="width:100%;padding:.78rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(240,244,255,.4);font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;border-radius:11px;cursor:pointer;">← Back to Path</button>
      </div>
    </div>`;
}

function buildPenaltyFallback(container){
  container.innerHTML='<div style="padding:2rem;text-align:center;color:rgba(240,244,255,.5);">Loading 3D game...</div>';
  setTimeout(()=>{ if(typeof buildPenalty3DGame==='function') buildPenalty3DGame(container); },500);
}

// ── SHARED DRAWING ──────────────────────────────────────────
function _canvas(id,w,h,extra){
  const c=document.createElement('canvas');
  c.id=id; c.width=w; c.height=h;
  c.style.cssText=`border-radius:12px 12px 0 0;max-width:100%;display:block;margin:0 auto;touch-action:none;`+(extra||'');
  return c;
}
function _drawGrass(ctx,w,h){
  const g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#1a5c18'); g.addColorStop(1,'#0d3310');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  for(let i=0;i<Math.ceil(w/48);i++){
    ctx.fillStyle=i%2===0?'rgba(255,255,255,.025)':'rgba(0,0,0,.04)';
    ctx.fillRect(i*48,0,48,h);
  }
}
function _drawBall(ctx,x,y,r){
  r=r||11;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,.65)'; ctx.shadowBlur=10; ctx.shadowOffsetY=4;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  const bg=ctx.createRadialGradient(x-r*.28,y-r*.3,r*.08,x,y,r);
  bg.addColorStop(0,'#fff'); bg.addColorStop(.7,'#e8e8e8'); bg.addColorStop(1,'#ccc');
  ctx.fillStyle=bg; ctx.fill(); ctx.restore();
  ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=.8; ctx.stroke();
  ctx.fillStyle='rgba(0,0,0,.7)';
  [[0,-r*.58],[r*.48,r*.3],[-r*.48,r*.3]].forEach(([dx,dy])=>{
    ctx.beginPath(); ctx.arc(x+dx,y+dy,r*.21,0,Math.PI*2); ctx.fill();
  });
}
function _drawPlayer(ctx,x,y,col,label,r){
  r=r||16;
  ctx.save(); ctx.shadowColor=col+'99'; ctx.shadowBlur=8;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  const g=ctx.createRadialGradient(x-r*.3,y-r*.3,r*.1,x,y,r);
  g.addColorStop(0,col+'ee'); g.addColorStop(1,col+'88');
  ctx.fillStyle=g; ctx.fill(); ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font=`bold ${r*.6}px DM Sans,sans-serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x,y);
}
function _hud(ll,lid,rl,rid,mid){
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:.55rem .85rem;background:rgba(5,8,15,.7);border-radius:12px 12px 0 0;border-bottom:1px solid rgba(255,255,255,.07);">
    <div style="text-align:center;min-width:52px;">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.9rem;color:#b8ff57;line-height:1;" id="${lid}">0</div>
      <div style="font-size:.58rem;color:rgba(240,244,255,.3);text-transform:uppercase;letter-spacing:.1em;">${ll}</div>
    </div>
    ${mid?`<div id="${mid}" style="font-size:.85rem;font-weight:700;color:rgba(240,244,255,.65);text-align:center;flex:1;padding:0 .5rem;"></div>`:'<div style="flex:1;"></div>'}
    <div style="text-align:center;min-width:52px;">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.9rem;color:rgba(240,244,255,.35);line-height:1;" id="${rid}">0</div>
      <div style="font-size:.58rem;color:rgba(240,244,255,.3);text-transform:uppercase;letter-spacing:.1em;">${rl}</div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  GAME 2 — OFFSIDE TRAP  (8 scenarios, laser line, animated)
// ═══════════════════════════════════════════════════════════
function buildOffsideGame(container){
  const ROUNDS=8;
  let score=0,round=0,answered=false,animId,t=0,currentSc;

  const scenarios=[
    {offside:false,title:'Level with the last defender',
     desc:'Being LEVEL with the last outfield defender is ONSIDE. You must be strictly in front of them to be offside.',
     setup:(W,H)=>({att:{x:W*.64,y:H*.4},defs:[{x:W*.64,y:H*.56},{x:W*.28,y:H*.62}],gk:{x:W*.09,y:H*.5},ball:{x:W*.35,y:H*.48}})},
    {offside:true,title:'One boot-length ahead',
     desc:'Even a single boot ahead of the last outfield defender when the pass is played = offside. No tolerance.',
     setup:(W,H)=>({att:{x:W*.7,y:H*.4},defs:[{x:W*.65,y:H*.56},{x:W*.28,y:H*.62}],gk:{x:W*.09,y:H*.5},ball:{x:W*.33,y:H*.48}})},
    {offside:false,title:'Own half — always onside',
     desc:'You cannot be offside in your own half of the pitch, regardless of where defenders are positioned.',
     setup:(W,H)=>({att:{x:W*.37,y:H*.4},defs:[{x:W*.72,y:H*.5},{x:W*.82,y:H*.62}],gk:{x:W*.92,y:H*.5},ball:{x:W*.24,y:H*.45}})},
    {offside:true,title:'Behind the goalkeeper',
     desc:'The goalkeeper IS a defender. If all outfield players are ahead of you, being behind the GK = offside.',
     setup:(W,H)=>({att:{x:W*.06,y:H*.4},defs:[{x:W*.28,y:H*.56},{x:W*.38,y:H*.62}],gk:{x:W*.14,y:H*.5},ball:{x:W*.56,y:H*.48}})},
    {offside:false,title:'Goal kick restart',
     desc:'You cannot be offside from a goal kick, corner kick, or throw-in. Restarts nullify the offside rule.',
     setup:(W,H)=>({att:{x:W*.75,y:H*.38},defs:[{x:W*.52,y:H*.55},{x:W*.38,y:H*.65}],gk:{x:W*.91,y:H*.5},ball:{x:W*.08,y:H*.88},isRestart:true})},
    {offside:true,title:'Part of body that can score',
     desc:'The arm does NOT count for offside — only body parts you can legally score with. But a shoulder ahead IS offside.',
     setup:(W,H)=>({att:{x:W*.68,y:H*.4},defs:[{x:W*.65,y:H*.56},{x:W*.45,y:H*.62}],gk:{x:W*.88,y:H*.5},ball:{x:W*.38,y:H*.48}})},
    {offside:false,title:'Two defenders both ahead',
     desc:'Two players (including the goalkeeper) are ahead of the attacker — comfortably onside.',
     setup:(W,H)=>({att:{x:W*.56,y:H*.4},defs:[{x:W*.68,y:H*.55},{x:W*.78,y:H*.62}],gk:{x:W*.9,y:H*.5},ball:{x:W*.35,y:H*.5}})},
    {offside:true,title:'In offside position + interfering',
     desc:'You can be in an offside position without being offside — UNTIL you become active by receiving the ball or interfering with play.',
     setup:(W,H)=>({att:{x:W*.74,y:H*.4},defs:[{x:W*.66,y:H*.55},{x:W*.5,y:H*.62}],gk:{x:W*.89,y:H*.5},ball:{x:W*.4,y:H*.5}})},
  ];

  const W=380,H=240;
  const cvs=_canvas('os-canvas',W,H);
  const ctx=cvs.getContext('2d');

  container.innerHTML=`<div style="max-width:420px;margin:0 auto;font-family:'DM Sans',sans-serif;">
    ${_hud('Correct','os-score','Round','os-round','os-msg')}
    <div id="os-wrap"></div>
    <div style="display:flex;gap:.5rem;padding:.6rem .65rem;background:rgba(0,0,0,.35);">
      <button id="os-on" onclick="osJudge(false)" style="flex:1;padding:.82rem;border:1.5px solid rgba(184,255,87,.3);border-radius:10px;background:rgba(184,255,87,.08);color:#b8ff57;font-family:'DM Sans',sans-serif;font-weight:900;font-size:.9rem;cursor:pointer;transition:all .15s;">✅ ONSIDE</button>
      <button id="os-off" onclick="osJudge(true)"  style="flex:1;padding:.82rem;border:1.5px solid rgba(255,94,138,.25);border-radius:10px;background:rgba(255,94,138,.08);color:#ff5e8a;font-family:'DM Sans',sans-serif;font-weight:900;font-size:.9rem;cursor:pointer;transition:all .15s;">🚩 OFFSIDE</button>
    </div>
    <div id="os-fb" style="padding:0 .65rem .65rem;background:rgba(0,0,0,.2);border-radius:0 0 12px 12px;"></div>
  </div>`;
  document.getElementById('os-wrap').appendChild(cvs);
  el('os-round').textContent='1/'+ROUNDS;

  function loadRound(){
    answered=false; t=0;
    currentSc=scenarios[round%scenarios.length];
    el('os-msg').textContent='Onside or offside?';
    el('os-on').disabled=false; el('os-off').disabled=false;
    el('os-on').style.opacity='1'; el('os-off').style.opacity='1';
    el('os-on').style.transform='scale(1)'; el('os-off').style.transform='scale(1)';
    el('os-fb').innerHTML='';
    el('os-round').textContent=(round+1)+'/'+ROUNDS;
  }

  function drawScene(){
    if(!currentSc)return;
    t+=0.022;
    const sc=currentSc, pos=sc.setup(W,H);
    _drawGrass(ctx,W,H);

    // Pitch lines
    ctx.strokeStyle='rgba(255,255,255,.16)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
    ctx.strokeRect(W*.82,H*.2,W*.18,H*.6);
    ctx.strokeRect(W*.88,H*.32,W*.12,H*.36);

    // Last defender line
    const defXs=pos.defs.map(d=>d.x);
    const lastDefX=Math.min(...defXs);
    const grad=ctx.createLinearGradient(lastDefX,0,lastDefX,H);
    grad.addColorStop(0,'rgba(255,94,138,0)');
    grad.addColorStop(.3,'rgba(255,94,138,.55)');
    grad.addColorStop(.7,'rgba(255,94,138,.55)');
    grad.addColorStop(1,'rgba(255,94,138,0)');
    ctx.save(); ctx.strokeStyle=grad; ctx.lineWidth=2; ctx.setLineDash([7,5]);
    ctx.beginPath(); ctx.moveTo(lastDefX,0); ctx.lineTo(lastDefX,H); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
    ctx.fillStyle='rgba(255,94,138,.6)'; ctx.font='bold 8px DM Sans,sans-serif';
    ctx.textAlign='left'; ctx.fillText('LAST DEF',lastDefX+4,11);

    // Attacker alignment line
    const attDrift=Math.sin(t*1.8)*3;
    ctx.save(); ctx.strokeStyle='rgba(94,223,255,.4)'; ctx.lineWidth=1.2; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(pos.att.x,0); ctx.lineTo(pos.att.x,H); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();

    // GK
    _drawPlayer(ctx,pos.gk.x,pos.gk.y+Math.sin(t*.7)*2,'#d97706','GK',15);
    // Defenders
    pos.defs.forEach((d,i)=>_drawPlayer(ctx,d.x,d.y+Math.sin(t*.9+i)*2.5,'#ef4444','D'+(i+4),16));
    // Attacker
    _drawPlayer(ctx,pos.att.x,pos.att.y+attDrift,'#3b82f6','ATK',18);
    // Ball
    _drawBall(ctx,pos.ball.x,pos.ball.y,10);
    if(sc.isRestart){
      ctx.fillStyle='rgba(255,182,39,.75)'; ctx.font='bold 9px DM Sans'; ctx.textAlign='center';
      ctx.fillText('RESTART',pos.ball.x,pos.ball.y-18);
    }
    // Pass arrow
    const dx=pos.att.x-pos.ball.x, dy=pos.att.y-pos.ball.y, dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>20){
      const nx=dx/dist,ny=dy/dist;
      const ex=pos.att.x-nx*24,ey=pos.att.y+attDrift-ny*24;
      ctx.save(); ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(pos.ball.x,pos.ball.y); ctx.lineTo(ex,ey); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
      ctx.fillStyle='rgba(255,255,255,.4)';
      ctx.beginPath(); ctx.moveTo(ex+nx*8,ey+ny*8); ctx.lineTo(ex-ny*4,ey+nx*4); ctx.lineTo(ex+ny*4,ey-nx*4); ctx.fill();
    }
  }

  window.osJudge=function(calledOffside){
    if(answered)return; answered=true;
    const correct=calledOffside===currentSc.offside;
    if(correct){score++; el('os-score').textContent=score;}
    el('os-on').disabled=true; el('os-off').disabled=true;
    el('os-on').style.opacity='.45'; el('os-off').style.opacity='.45';
    const correctBtn=currentSc.offside?el('os-off'):el('os-on');
    if(correctBtn){correctBtn.style.opacity='1'; correctBtn.style.transform='scale(1.05)';}
    el('os-fb').innerHTML=`<div style="background:${correct?'rgba(184,255,87,.07)':'rgba(255,94,138,.07)'};border:1px solid ${correct?'rgba(184,255,87,.2)':'rgba(255,94,138,.2)'};border-radius:10px;padding:.72rem .9rem;margin-top:.4rem;">
      <div style="font-weight:800;color:${correct?'#b8ff57':'#ff5e8a'};margin-bottom:.25rem;">${correct?'✅ Correct!':'❌ Wrong!'}</div>
      <div style="font-size:.82rem;font-weight:700;color:rgba(240,244,255,.75);margin-bottom:.2rem;">${currentSc.title}</div>
      <div style="font-size:.78rem;color:rgba(240,244,255,.5);line-height:1.55;">${currentSc.desc}</div>
    </div>
    <button onclick="osNext()" style="width:100%;padding:.7rem;margin-top:.45rem;border:none;border-radius:10px;background:rgba(255,255,255,.07);color:rgba(240,244,255,.6);font-family:'DM Sans',sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;">${round+1>=ROUNDS?'See Results →':'Next →'}</button>`;
    if(typeof playCorrect==='function') correct?playCorrect():playWrong();
  };
  window.osNext=function(){
    round++; el('os-fb').innerHTML='';
    if(round>=ROUNDS){cancelAnimationFrame(animId); gameOver(container,'offside',score,ROUNDS,score*12);}
    else loadRound();
  };
  loadRound();
  function loop(){drawScene(); animId=requestAnimationFrame(loop);}
  _activeGameCleanup=()=>cancelAnimationFrame(animId);
  loop();
}


// ═══════════════════════════════════════════════════════════
//  GAME 3 — FREE KICK MASTER  (wall, wind, curl, trajectory)
// ═══════════════════════════════════════════════════════════
function buildFreeKickGame(container){
  const KICKS=5;
  let score=0,kick=0,phase='aim',animId,chargeInterval;
  let power=0,curveBias=0,aimX,isDragging=false;
  let bx,by,bvx,bvy,bcurve,trajectoryPts=[];
  let wind=0;

  const W=380,H=300;
  const GX=112,GY=38,GW=156,GH=68;
  const BSX=W/2,BSY=H-42;
  const WALL_Y=H-132;
  const WALL_W=62;

  function newKick(){
    wind=parseFloat((Math.random()*4-2).toFixed(1));
    power=0; curveBias=0; aimX=W/2; trajectoryPts=[];
    phase='aim'; bx=BSX; by=BSY;
    el('fk-wind').textContent=wind===0?'No wind':(wind>0?'→ ':' ←')+Math.abs(wind).toFixed(1)+'m/s';
    el('fk-power-bar').style.width='0%';
    el('fk-msg').textContent='Drag to aim · Hold to charge';
    el('fk-btn').disabled=false; el('fk-btn').textContent='⚡ SHOOT';
    el('fk-cl').style.background='rgba(255,255,255,.07)';
    el('fk-cr').style.background='rgba(255,255,255,.07)';
    el('fk-kick').textContent=(kick+1)+'/'+KICKS;
    el('fk-fb').innerHTML='';
  }

  const cvs=_canvas('fk-canvas',W,H,'cursor:crosshair;');
  const ctx=cvs.getContext('2d');

  container.innerHTML=`<div style="max-width:420px;margin:0 auto;font-family:'DM Sans',sans-serif;">
    ${_hud('Goals','fk-score','Kick','fk-kick','fk-msg')}
    <div id="fk-wrap"></div>
    <div style="padding:.58rem .7rem;background:rgba(0,0,0,.38);">
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.48rem;">
        <span style="font-size:.68rem;color:rgba(240,244,255,.35);">💨</span>
        <span id="fk-wind" style="font-size:.75rem;font-weight:700;color:#5edfff;flex:1;"></span>
        <button id="fk-cl" onclick="fkSetCurve(-1)" style="padding:.28rem .65rem;border:1px solid rgba(255,255,255,.14);border-radius:7px;background:rgba(255,255,255,.07);color:rgba(240,244,255,.7);font-size:.78rem;font-weight:700;cursor:pointer;">↩ Curl L</button>
        <button id="fk-cr" onclick="fkSetCurve(1)"  style="padding:.28rem .65rem;border:1px solid rgba(255,255,255,.14);border-radius:7px;background:rgba(255,255,255,.07);color:rgba(240,244,255,.7);font-size:.78rem;font-weight:700;cursor:pointer;">Curl R ↪</button>
      </div>
      <div style="background:rgba(255,255,255,.07);border-radius:99px;height:8px;overflow:hidden;margin-bottom:.5rem;">
        <div id="fk-power-bar" style="height:100%;width:0%;border-radius:99px;background:linear-gradient(90deg,#b8ff57,#ffb627,#ff5e8a);transition:width .04s;"></div>
      </div>
      <button id="fk-btn" onmousedown="fkCharge()" ontouchstart="event.preventDefault();fkCharge()" onmouseup="fkRelease()" ontouchend="fkRelease()" onmouseleave="fkRelease()"
        style="width:100%;padding:.82rem;border:none;border-radius:12px;background:linear-gradient(135deg,#b8ff57,#5edfff);color:#000;font-family:'DM Sans',sans-serif;font-weight:900;font-size:.95rem;cursor:pointer;">⚡ SHOOT</button>
    </div>
    <div id="fk-fb" style="padding:0 .65rem .65rem;background:rgba(0,0,0,.18);border-radius:0 0 12px 12px;"></div>
  </div>`;
  document.getElementById('fk-wrap').appendChild(cvs);

  function getCanvasX(e){const r=cvs.getBoundingClientRect();return((e.touches?e.touches[0].clientX:e.clientX)-r.left)*(W/r.width);}
  cvs.addEventListener('mousedown',e=>{if(phase==='aim'){isDragging=true;aimX=getCanvasX(e);}});
  cvs.addEventListener('mousemove',e=>{if(isDragging&&phase==='aim')aimX=Math.max(GX-25,Math.min(GX+GW+25,getCanvasX(e)));});
  cvs.addEventListener('mouseup',()=>isDragging=false);
  cvs.addEventListener('touchstart',e=>{e.preventDefault();if(phase==='aim'){isDragging=true;aimX=getCanvasX(e);}},{passive:false});
  cvs.addEventListener('touchmove',e=>{e.preventDefault();if(isDragging&&phase==='aim')aimX=Math.max(GX-25,Math.min(GX+GW+25,getCanvasX(e)));},{passive:false});
  cvs.addEventListener('touchend',()=>isDragging=false);

  window.fkSetCurve=function(d){
    curveBias=curveBias===d?0:d;
    el('fk-cl').style.background=curveBias===-1?'rgba(94,223,255,.22)':'rgba(255,255,255,.07)';
    el('fk-cr').style.background=curveBias===1?'rgba(94,223,255,.22)':'rgba(255,255,255,.07)';
  };
  window.fkCharge=function(){if(phase!=='aim')return;phase='charge';power=0;chargeInterval=setInterval(()=>{power=Math.min(power+2.1,100);el('fk-power-bar').style.width=power+'%';},40);};
  window.fkRelease=function(){if(phase!=='charge')return;clearInterval(chargeInterval);launchFK();};

  function launchFK(){
    phase='fly'; el('fk-btn').disabled=true; el('fk-btn').textContent='...';
    const spd=5+(power/100)*13;
    const dx=aimX-BSX, dy=GY+GH/2-BSY, dist=Math.sqrt(dx*dx+dy*dy)||1;
    bx=BSX; by=BSY;
    bvx=(dx/dist)*spd+wind*.14;
    bvy=(dy/dist)*spd;
    bcurve=curveBias*.16*(power/100);
    trajectoryPts=[];
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    _drawGrass(ctx,W,H);

    // Goal
    ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.strokeRect(GX,GY,GW,GH);
    ctx.strokeStyle='rgba(255,255,255,.1)'; ctx.lineWidth=1;
    for(let x=GX+18;x<GX+GW;x+=18){ctx.beginPath();ctx.moveTo(x,GY);ctx.lineTo(x,GY+GH);ctx.stroke();}
    for(let y=GY+16;y<GY+GH;y+=16){ctx.beginPath();ctx.moveTo(GX,y);ctx.lineTo(GX+GW,y);ctx.stroke();}

    // Wall (5 men)
    const wx0=W/2-WALL_W/2;
    for(let i=0;i<5;i++){
      const wx=wx0+i*13;
      const wallCols=['#dc2626','#dc2626','#ea580c','#dc2626','#dc2626'];
      ctx.save();
      if((curveBias===-1&&i===0)||(curveBias===1&&i===4)) ctx.globalAlpha=.32;
      ctx.fillStyle=wallCols[i];
      ctx.beginPath(); ctx.arc(wx+7,WALL_Y-17,9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fca5a5'; ctx.beginPath(); ctx.arc(wx+7,WALL_Y-31,7,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle='rgba(255,255,255,.25)'; ctx.font='8px DM Sans'; ctx.textAlign='center';
    ctx.fillText('WALL',W/2,WALL_Y+14);

    // Keeper (sways)
    const kx=W/2+Math.sin(Date.now()/900)*24;
    ctx.fillStyle='#f97316'; ctx.fillRect(kx-10,GY+3,20,GH-6);
    ctx.fillStyle='#fed7aa'; ctx.beginPath(); ctx.arc(kx,GY+GH*.26,9,0,Math.PI*2); ctx.fill();

    // Aim line + target
    if(phase==='aim'||phase==='charge'){
      const tg=GY+GH/2;
      ctx.save(); ctx.strokeStyle='rgba(184,255,87,.35)'; ctx.lineWidth=1.5; ctx.setLineDash([6,5]);
      ctx.beginPath(); ctx.moveTo(BSX,BSY); ctx.lineTo(aimX,tg); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
      ctx.beginPath(); ctx.arc(aimX,tg,8,0,Math.PI*2);
      ctx.strokeStyle='rgba(184,255,87,.7)'; ctx.lineWidth=2; ctx.stroke();
      // Wind indicator arrow
      if(wind!==0){
        const arrowLen=Math.abs(wind)*12;
        const arrowDir=wind>0?1:-1;
        const ay=GY+GH+18;
        ctx.strokeStyle='rgba(94,223,255,.6)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(W/2,ay); ctx.lineTo(W/2+arrowLen*arrowDir,ay); ctx.stroke();
        ctx.fillStyle='rgba(94,223,255,.6)';
        ctx.beginPath(); ctx.moveTo(W/2+arrowLen*arrowDir,ay); ctx.lineTo(W/2+(arrowLen-8)*arrowDir,ay-5); ctx.lineTo(W/2+(arrowLen-8)*arrowDir,ay+5); ctx.fill();
      }
    }

    // Trajectory replay
    if(trajectoryPts.length>2){
      ctx.save(); ctx.strokeStyle='rgba(94,223,255,.2)'; ctx.lineWidth=1.5; ctx.setLineDash([3,4]);
      ctx.beginPath(); trajectoryPts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }

    // Ball in flight
    if(phase==='fly'){
      bvx+=bcurve; bvy+=0.18; bx+=bvx; by+=bvy;
      trajectoryPts.push({x:bx,y:by});
      // Check result
      const wallX0=W/2-WALL_W/2;
      const wallBlocked=bx>wallX0&&bx<wallX0+WALL_W&&by>=WALL_Y-28&&by<=WALL_Y+6;
      const inGoal=bx>GX&&bx<GX+GW&&by>GY&&by<GY+GH;
      const hitPost=(Math.abs(bx-GX)<7||Math.abs(bx-(GX+GW))<7)&&by>GY&&by<GY+GH;
      const hitBar=Math.abs(by-GY)<7&&bx>GX&&bx<GX+GW;
      if(by<=GY+GH+5&&by>=GY-8||wallBlocked||bx<-15||bx>W+15||by>H+10){
        phase='result';
        kick++; el('fk-kick').textContent=Math.min(kick+1,KICKS)+'/'+KICKS;
        if(wallBlocked){
          el('fk-msg').textContent='🧱 Blocked by wall'; showFKFeedback(false,'Wall block 🧱','Power through the wall or curl around it using the Curl buttons. Note the gap on each side.',false);
        }else if(hitPost||hitBar){
          el('fk-msg').textContent='🔔 Frame!'; showFKFeedback(false,'Off the frame!','Agonisingly close. A fraction to the left/right/lower would have been a goal.',true);
        }else if(inGoal){
          score++; el('fk-score').textContent=score;
          el('fk-msg').textContent='GOAL! 🔥';
          if(typeof playGoal==='function')playGoal();
          if(typeof confetti!=='undefined')confetti({particleCount:55,spread:55,origin:{y:.45}});
          showFKFeedback(true,'GOAL! ⚽','Perfect technique — power, placement and curl all worked together.');
        }else{
          el('fk-msg').textContent='Off target'; showFKFeedback(false,'Off target','Adjust your aim. Drag the crosshair to aim, and account for wind direction.',false);
        }
      }
    }
    _drawBall(ctx,bx,by,11);
  }

  function showFKFeedback(ok,title,desc,partial){
    const col=ok?'#b8ff57':partial?'#ffb627':'#ff5e8a';
    el('fk-fb').innerHTML=`<div style="background:${col}0d;border:1px solid ${col}2a;border-radius:10px;padding:.65rem .85rem;margin-top:.42rem;">
      <div style="font-weight:800;color:${col};margin-bottom:.2rem;">${title}</div>
      <div style="font-size:.78rem;color:rgba(240,244,255,.5);line-height:1.5;">${desc}</div>
    </div>
    <button onclick="fkNext()" style="width:100%;padding:.7rem;margin-top:.42rem;border:none;border-radius:10px;background:rgba(255,255,255,.07);color:rgba(240,244,255,.6);font-family:'DM Sans',sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;">${kick>=KICKS?'Results →':'Next kick →'}</button>`;
  }
  window.fkNext=function(){
    el('fk-fb').innerHTML='';
    if(kick>=KICKS){cancelAnimationFrame(animId);gameOver(container,'freekick',score,KICKS,score*15);}
    else newKick();
  };

  newKick();
  function loop(){draw();animId=requestAnimationFrame(loop);}
  _activeGameCleanup=()=>{cancelAnimationFrame(animId);clearInterval(chargeInterval);};
  loop();
}


// ═══════════════════════════════════════════════════════════
//  GAME 4 — RONDO IQ  (animated drill, tactical questions)
// ═══════════════════════════════════════════════════════════
function buildRondoGame(container){
  const ROUNDS=8;
  let score=0,round=0,answered=false,animId,t=0;

  const scenarios=[
    {q:'You\'re pressed from behind with the ball. What\'s the correct first action?',
     opts:['Turn and face up immediately','Pass to the nearest safe option to maintain possession','Dribble past the presser','Wait for them to commit'],
     a:1,diff:'🟢',
     exp:'Under immediate pressure, the simplest action is the correct action. Maintain possession by playing to the open man. Attempting to turn against a presser behind you is high risk with low reward.'},
    {q:'Both forward passing lanes are blocked. An option is free behind you. What should the carrier do?',
     opts:['Force a pass through the block — reward ambition','Play back and recirculate the attack','Hold the ball under pressure','Shoot from distance'],
     a:1,diff:'🟢',
     exp:'Circulating possession to reset the attack is always correct when no forward option is safe. Ball retention and patience create better forward opportunities — a forced pass through a block most likely loses possession.'},
    {q:'You have time. A teammate is making a late run in behind the last defender. What\'s the best action?',
     opts:['Hold the ball and wait','Pass to a nearby safe option','Release the through-ball into the run','Dribble forward to create space'],
     a:2,diff:'🔵',
     exp:'When you have time AND a teammate is making a timed run in behind — play it NOW. The window for that pass closes in under 2 seconds. A through-ball into a perfect run is the highest value action in football.'},
    {q:'You receive with a defender behind you and two options ahead. One is central and dangerous, one is safe and wide. Choose:',
     opts:['The safe wide option — reduce risk','The nearest option — quickest','The option in the most dangerous position — the central one','Play it back immediately'],
     a:2,diff:'🔵',
     exp:'Always play to the option that creates the most danger when you have time and protection. The nearest or safest pass is not always the best pass. Threat creation drives the attack forward.'},
    {q:'Two defenders cover the two most advanced attackers. Two midfielders are free behind them. What do you do?',
     opts:['Try to play through to the covered attackers','Switch immediately to the free midfielders','Hold the ball under pressure','Dribble into space'],
     a:1,diff:'🟠',
     exp:'When defenders commit to two players, the other players become free automatically. Mathematics: two defenders cannot cover four. Identify and play to the free men immediately — they are the opportunity the press has created for you.'},
    {q:'In a 4v2 rondo, both defenders press the same player. Where should the ball go?',
     opts:['Directly to a player away from both defenders','Across the rondo to maintain rhythm','Keep it among the pressed players','Slow the tempo to invite more pressure'],
     a:0,diff:'🟠',
     exp:'The moment both defenders commit to one player, any other player is free. The ball goes immediately to the player away from both defenders — this is the automatic read in every rondo and it transfers to match situations.'},
    {q:'You\'re in a 2v1 against you — two defenders are closing. What is the ONLY correct decision?',
     opts:['Try to beat both — technical skill can overcome numbers','Play back immediately — a 2v1 against you is unwinnable alone','Hold and hope for support','Shoot immediately regardless'],
     a:1,diff:'🔴',
     exp:'A 2v1 against the ball carrier is mathematically unwinnable as an individual. The correct decision is instant: play back, maintain possession, reset. Never attempt to beat two defenders alone — it is not a failure to pass back; it is the intelligent decision.'},
    {q:'The carrier has 3 options. Option A: free but behind. Option B: covered centrally. Option C: free and in behind. Which do you choose?',
     opts:['Option A — always take the free player regardless','Option B — central is always best','Option C — free AND in behind is the highest value choice','Take the time to assess all options first'],
     a:2,diff:'🔴',
     exp:'Option C combines two advantages: the player is both free AND in a dangerous attacking position behind the last line. A free player in a dangerous position is always the highest value pass — this is the combination that creates goals.'},
  ];

  const W=380,H=295;
  const cvs=_canvas('rondo-canvas',W,H);
  const ctx=cvs.getContext('2d');

  container.innerHTML=`<div style="max-width:420px;margin:0 auto;font-family:'DM Sans',sans-serif;">
    ${_hud('Correct','rondo-score','Round','rondo-round','rondo-msg')}
    <div id="rondo-wrap"></div>
    <div style="padding:.52rem .65rem;background:rgba(0,0,0,.32);">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;" id="rondo-opts"></div>
    </div>
    <div id="rondo-fb" style="padding:0 .65rem .65rem;background:rgba(0,0,0,.18);border-radius:0 0 12px 12px;"></div>
  </div>`;
  document.getElementById('rondo-wrap').appendChild(cvs);
  el('rondo-round').textContent='1/'+ROUNDS;

  // Position setups for each scenario
  const setups=[
    (W,H)=>({c:{x:W*.5,y:H*.62},pressers:[{x:W*.5,y:H*.76}],opts:[{x:W*.28,y:H*.45},{x:W*.72,y:H*.45}]}),
    (W,H)=>({c:{x:W*.5,y:H*.57},pressers:[{x:W*.37,y:H*.45},{x:W*.63,y:H*.45}],opts:[{x:W*.5,y:H*.78},{x:W*.19,y:H*.62}]}),
    (W,H)=>({c:{x:W*.42,y:H*.6},pressers:[{x:W*.56,y:H*.65}],opts:[{x:W*.22,y:H*.42,run:true},{x:W*.62,y:H*.8}]}),
    (W,H)=>({c:{x:W*.5,y:H*.65},pressers:[{x:W*.5,y:H*.78}],opts:[{x:W*.35,y:H*.5},{x:W*.65,y:H*.35,danger:true}]}),
    (W,H)=>({c:{x:W*.5,y:H*.5},pressers:[{x:W*.37,y:H*.5},{x:W*.63,y:H*.5}],opts:[{x:W*.5,y:H*.22,covered:true},{x:W*.5,y:H*.75,covered:true},{x:W*.2,y:H*.5,free:true},{x:W*.8,y:H*.5,free:true}]}),
    (W,H)=>({c:{x:W*.5,y:H*.5},pressers:[{x:W*.4,y:H*.4},{x:W*.5,y:H*.65}],opts:[{x:W*.25,y:H*.32},{x:W*.75,y:H*.32},{x:W*.25,y:H*.68},{x:W*.75,y:H*.68}]}),
    (W,H)=>({c:{x:W*.5,y:H*.58},pressers:[{x:W*.4,y:H*.46},{x:W*.6,y:H*.46}],opts:[{x:W*.5,y:H*.8},{x:W*.2,y:H*.6}]}),
    (W,H)=>({c:{x:W*.5,y:H*.58},pressers:[{x:W*.4,y:H*.5}],opts:[{x:W*.5,y:H*.82},{x:W*.3,y:H*.4},{x:W*.7,y:H*.3,run:true,danger:true}]}),
  ];

  function loadRound(){
    answered=false; t=0;
    const sc=scenarios[round%scenarios.length];
    el('rondo-score').textContent=score;
    el('rondo-round').textContent=(round+1)+'/'+ROUNDS;
    el('rondo-msg').textContent=sc.diff+' Think fast';
    el('rondo-fb').innerHTML='';
    const opts=el('rondo-opts');
    opts.innerHTML='';
    sc.opts.forEach((opt,i)=>{
      const b=document.createElement('button');
      b.id='rq'+i; b.textContent=opt; b.onclick=()=>rondoAnswer(i,sc);
      b.style.cssText='padding:.58rem .5rem;border:1.5px solid rgba(255,255,255,.1);border-radius:9px;background:rgba(255,255,255,.05);color:rgba(240,244,255,.85);font-family:\'DM Sans\',sans-serif;font-size:.77rem;font-weight:600;cursor:pointer;text-align:left;line-height:1.35;transition:all .15s;';
      opts.appendChild(b);
    });
  }

  function drawRondo(){
    t+=0.018;
    const sc=scenarios[round%scenarios.length];
    const pos=setups[round%setups.length](W,H);
    _drawGrass(ctx,W,H);
    // Circle
    ctx.save(); ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=2; ctx.setLineDash([7,5]);
    ctx.beginPath(); ctx.arc(W/2,H/2,H*.4,0,Math.PI*2); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();

    // Options
    (pos.opts||[]).forEach((o,i)=>{
      const py=o.y;
      if(o.free){
        ctx.save(); const alpha=.3+.3*Math.sin(t*4);
        ctx.strokeStyle=`rgba(184,255,87,${alpha})`; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(o.x,py,24,0,Math.PI*2); ctx.stroke(); ctx.restore();
      }
      if(o.run){
        ctx.save(); ctx.strokeStyle='rgba(255,182,39,.7)'; ctx.lineWidth=2; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(o.x,py); ctx.lineTo(o.x,py-34); ctx.stroke();
        ctx.fillStyle='rgba(255,182,39,.8)';
        ctx.beginPath(); ctx.moveTo(o.x,py-34); ctx.lineTo(o.x-5,py-26); ctx.lineTo(o.x+5,py-26); ctx.fill();
        ctx.setLineDash([]); ctx.restore();
      }
      const col=o.danger?'#f59e0b':o.free?'#22c55e':o.covered?'#6b7280':'#22c55e';
      _drawPlayer(ctx,o.x,py,col,(i+1).toString(),15);
    });

    // Pressers
    (pos.pressers||[]).forEach(p=>{
      const alpha=.5+.3*Math.sin(t*3);
      ctx.save(); ctx.strokeStyle=`rgba(239,68,68,${alpha})`; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(p.x,p.y,22,0,Math.PI*2); ctx.stroke(); ctx.restore();
      _drawPlayer(ctx,p.x,p.y,'#ef4444','D',15);
      // Pressure arrow
      const dx=pos.c.x-p.x,dy=pos.c.y-p.y,dl=Math.sqrt(dx*dx+dy*dy);
      if(dl>30){const nx=dx/dl,ny=dy/dl;
        ctx.save(); ctx.strokeStyle='rgba(239,68,68,.3)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(p.x+nx*17,p.y+ny*17); ctx.lineTo(p.x+nx*(dl-22),p.y+ny*(dl-22)); ctx.stroke(); ctx.restore();
      }
    });

    // Carrier
    const cy=pos.c.y+Math.sin(t*2)*2;
    ctx.save(); ctx.shadowColor='rgba(59,130,246,.7)'; ctx.shadowBlur=14;
    ctx.beginPath(); ctx.arc(pos.c.x,cy,18,0,Math.PI*2);
    ctx.fillStyle='#3b82f6'; ctx.fill(); ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='bold 10px DM Sans'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('YOU',pos.c.x,cy);
    _drawBall(ctx,pos.c.x+16,cy+9,8);

    // Question text at bottom
    const sc2=scenarios[round%scenarios.length];
    ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,H-48,W,48);
    ctx.fillStyle='rgba(240,244,255,.75)'; ctx.font='bold 10.5px DM Sans,sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const words=sc2.q.split(' '); let line='',lines=[];
    words.forEach(w=>{const test=line+w+' ';if(ctx.measureText(test).width>W-16){lines.push(line);line=w+' ';}else line=test;}); lines.push(line);
    lines.slice(0,2).forEach((l,i)=>ctx.fillText(l.trim(),W/2,H-35+i*14));
  }

  window.rondoAnswer=function(i,sc){
    if(answered)return; answered=true;
    const ok=i===sc.a;
    if(ok){score++; if(typeof playCorrect==='function')playCorrect();}else{if(typeof playWrong==='function')playWrong();}
    document.querySelectorAll('#rondo-opts button').forEach(b=>b.disabled=true);
    el('rq'+i).style.borderColor=ok?'#b8ff57':'#ff5e8a';
    el('rq'+i).style.background=ok?'rgba(184,255,87,.1)':'rgba(255,94,138,.08)';
    el('rq'+sc.a).style.borderColor='#b8ff57';
    el('rq'+sc.a).style.background='rgba(184,255,87,.08)';
    el('rondo-fb').innerHTML=`<div style="background:${ok?'rgba(184,255,87,.07)':'rgba(255,94,138,.07)'};border:1px solid ${ok?'rgba(184,255,87,.2)':'rgba(255,94,138,.2)'};border-radius:10px;padding:.7rem .85rem;margin-top:.42rem;">
      <div style="font-weight:800;color:${ok?'#b8ff57':'#ff5e8a'};margin-bottom:.22rem;">${ok?'✅ Perfect read!':'❌ Not quite'}</div>
      <div style="font-size:.78rem;color:rgba(240,244,255,.5);line-height:1.55;">${sc.exp}</div>
    </div>
    <button onclick="rondoNext()" style="width:100%;padding:.7rem;margin-top:.42rem;border:none;border-radius:10px;background:rgba(255,255,255,.07);color:rgba(240,244,255,.6);font-family:'DM Sans',sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;">${round+1>=ROUNDS?'Results →':'Next →'}</button>`;
  };
  window.rondoNext=function(){
    el('rondo-fb').innerHTML=''; round++;
    if(round>=ROUNDS){cancelAnimationFrame(animId);gameOver(container,'rondo',score,ROUNDS,score*12);}
    else loadRound();
  };
  loadRound();
  function loop(){drawRondo();animId=requestAnimationFrame(loop);}
  _activeGameCleanup=()=>cancelAnimationFrame(animId);
  loop();
}


// ═══════════════════════════════════════════════════════════
//  GAME 5 — SCANNING VISION  (formation flash, 6 rounds)
// ═══════════════════════════════════════════════════════════
function buildScanningGame(container){
  const ROUNDS=6;
  let score=0,round=0,answered=false,animId,flashTimer,showing=true;

  const scenarios=[
    {flash:1800,
     players:[{x:.5,y:.35,t:'b',n:'GK'},{x:.25,y:.55,t:'b',n:'LB'},{x:.42,y:.58,t:'b',n:'CB'},{x:.58,y:.58,t:'b',n:'CB'},{x:.75,y:.55,t:'b',n:'RB'},
              {x:.35,y:.42,t:'b',n:'CM'},{x:.5,y:.37,t:'b',n:'CM'},{x:.65,y:.42,t:'b',n:'CM'},
              {x:.28,y:.24,t:'r',n:'W'},{x:.5,y:.2,t:'r',n:'ST'},{x:.72,y:.24,t:'r',n:'W'},{x:.32,y:.4,t:'r',n:'CM',free:true}],
     q:'Which red player is completely free (shown with a glow)?',
     opts:['The striker','The wide right forward','The central midfielder','None are free'],
     a:2,exp:'The red central midfielder drifted into the space between the lines completely unmarked. This is the pass that beats the press — the player between the midfield and defensive lines with no one tracking them.'},
    {flash:1600,
     players:[{x:.5,y:.36,t:'b',n:'GK'},{x:.22,y:.6,t:'b',n:'LB'},{x:.4,y:.63,t:'b',n:'CB'},{x:.6,y:.63,t:'b',n:'CB'},{x:.78,y:.6,t:'b',n:'RB'},
              {x:.35,y:.47,t:'b',n:'CM'},{x:.5,y:.43,t:'b',n:'CM'},{x:.65,y:.47,t:'b',n:'CM'},
              {x:.35,y:.26,t:'r',n:'W'},{x:.5,y:.22,t:'r',n:'ST'},{x:.65,y:.26,t:'r',n:'W'},
              {x:.2,y:.5,t:'b',n:'LB',pressing:true}],
     q:'A blue LB is pressing. What space opens up when they leave their position?',
     opts:['Space behind the pressing LB where they came from','Space in front of the pressing LB','No space opens','Central midfield space'],
     a:0,exp:'Every pressing player vacates the space they were in. When the LB presses, the space behind them on the left flank opens immediately. The correct exploitation is to play into that vacated zone.'},
    {flash:1400,
     players:[{x:.5,y:.38,t:'b',n:'GK'},{x:.2,y:.58,t:'b',n:'LB'},{x:.38,y:.62,t:'b',n:'CB'},{x:.62,y:.62,t:'b',n:'CB'},{x:.8,y:.58,t:'b',n:'RB'},
              {x:.3,y:.48,t:'b',n:'DM'},{x:.7,y:.48,t:'b',n:'DM'},{x:.5,y:.43,t:'b',n:'AM'},
              {x:.28,y:.28,t:'r',n:'W'},{x:.5,y:.22,t:'r',n:'ST'},{x:.72,y:.28,t:'r',n:'W'},
              {x:.5,y:.37,t:'r',n:'F9',run:true}],
     q:'The red F9 has dropped deep with a run arrow. What tactical concept is this showing?',
     opts:['The false 9 dropping to create midfield overload and drag the CBs out of position','A defensive mistake by the attacker','A press trigger for the team','A corner kick run'],
     a:0,exp:'The false 9 dropping creates two simultaneous problems for the defence: the CBs must choose whether to follow (leaving space behind) or hold (letting the F9 receive freely in midfield). There is no comfortable defensive answer.'},
    {flash:1300,
     players:[{x:.5,y:.36,t:'b',n:'GK'},{x:.18,y:.62,t:'b',n:'LB'},{x:.35,y:.66,t:'b',n:'CB'},{x:.65,y:.66,t:'b',n:'CB'},{x:.82,y:.62,t:'b',n:'RB'},
              {x:.28,y:.52,t:'b',n:'DM'},{x:.72,y:.52,t:'b',n:'DM'},{x:.5,y:.46,t:'b',n:'CM'},
              {x:.26,y:.3,t:'r',n:'W'},{x:.5,y:.24,t:'r',n:'ST'},{x:.74,y:.3,t:'r',n:'W'},
              {x:.5,y:.58,t:'r',n:'CM',free:true},{x:.35,y:.4,t:'r',n:'CM'}],
     q:'Blue plays a 4-2-3-1. Where is the main structural weakness you saw?',
     opts:['Wide areas outside the full-backs','The space between the double pivot and defensive four','No structural weakness','Behind the goalkeeper'],
     a:1,exp:'The space between a double pivot and the defensive line is the classic weakness of a 4-2-3-1. The two holding midfielders and four defenders leave a corridor between them — and the red CM who occupies that space receives free in the most dangerous zone.'},
    {flash:1200,
     players:[{x:.5,y:.36,t:'b',n:'GK'},{x:.18,y:.6,t:'b',n:'LB'},{x:.36,y:.65,t:'b',n:'CB'},{x:.64,y:.65,t:'b',n:'CB'},{x:.82,y:.6,t:'b',n:'RB'},
              {x:.3,y:.52,t:'b',n:'CM'},{x:.5,y:.47,t:'b',n:'CM'},{x:.7,y:.52,t:'b',n:'CM'},
              {x:.26,y:.32,t:'r',n:'W'},{x:.5,y:.26,t:'r',n:'ST'},{x:.74,y:.32,t:'r',n:'W'},
              {x:.5,y:.4,t:'b',n:'press',pressing:true},{x:.5,y:.57,t:'r',n:'F9',free:true},{x:.35,y:.44,t:'r',n:'CM'},{x:.65,y:.44,t:'r',n:'CM'}],
     q:'HARD (1.2 second flash): How many red players are between the blue midfield and defence?',
     opts:['1 player','2 players','3 players','4 players'],
     a:2,exp:'Three red players (the false 9 and two central midfielders) were positioned between the blue midfield and defensive lines. This is a deliberate overload of the most dangerous zone — the "between the lines" space.'},
    {flash:1000,
     players:[{x:.5,y:.35,t:'b',n:'GK'},{x:.16,y:.62,t:'b',n:'LB'},{x:.36,y:.68,t:'b',n:'CB'},{x:.64,y:.68,t:'b',n:'CB'},{x:.84,y:.62,t:'b',n:'RB'},
              {x:.28,y:.55,t:'b',n:'DM'},{x:.72,y:.55,t:'b',n:'DM'},
              {x:.22,y:.35,t:'r',n:'W'},{x:.5,y:.28,t:'r',n:'ST'},{x:.78,y:.35,t:'r',n:'W'},
              {x:.5,y:.46,t:'r',n:'10',free:true},{x:.35,y:.47,t:'r',n:'CM'},{x:.65,y:.47,t:'r',n:'CM'},
              {x:.5,y:.62,t:'r',n:'CM',run:true}],
     q:'EXPERT (1 second): What is the most dangerous red player\'s position relative to the blue structure?',
     opts:['Wide right forward in behind','The #10 between the double pivot and defensive line','The CM making a run from deep','The striker dropping off the line'],
     a:1,exp:'The red #10 in the space between the blue double pivot and defensive four is the most dangerous player in this snapshot. They can receive, turn, and threaten the defensive line with no immediate challenger.'},
  ];

  const W=380,H=280;
  const cvs=_canvas('sc-canvas',W,H);
  const ctx=cvs.getContext('2d');

  container.innerHTML=`<div style="max-width:420px;margin:0 auto;font-family:'DM Sans',sans-serif;">
    ${_hud('Correct','sc-score','Round','sc-round','sc-msg')}
    <div id="sc-wrap" style="position:relative;"></div>
    <div id="sc-timer" style="height:4px;background:rgba(255,255,255,.08);overflow:hidden;">
      <div id="sc-tfill" style="height:100%;width:100%;background:#b8ff57;transition:width linear;"></div>
    </div>
    <div style="padding:.52rem .65rem;background:rgba(0,0,0,.32);">
      <div style="display:flex;flex-direction:column;gap:.38rem;" id="sc-opts"></div>
    </div>
    <div id="sc-fb" style="padding:0 .65rem .65rem;background:rgba(0,0,0,.18);border-radius:0 0 12px 12px;"></div>
  </div>`;
  document.getElementById('sc-wrap').appendChild(cvs);

  function loadRound(){
    answered=false; showing=true;
    const sc=scenarios[round%scenarios.length];
    el('sc-score').textContent=score;
    el('sc-round').textContent=(round+1)+'/'+ROUNDS;
    el('sc-msg').textContent='👁️ Scan — '+(sc.flash/1000).toFixed(1)+'s';
    el('sc-fb').innerHTML='';
    const opts=el('sc-opts');
    opts.innerHTML='';
    sc.opts.forEach((opt,i)=>{
      const b=document.createElement('button');
      b.id='sco'+i; b.textContent=opt; b.disabled=true; b.onclick=()=>scanAnswer(i,sc);
      b.style.cssText='padding:.65rem .75rem;border:1.5px solid rgba(255,255,255,.1);border-radius:9px;background:rgba(255,255,255,.05);color:rgba(240,244,255,.85);font-family:\'DM Sans\',sans-serif;font-size:.79rem;font-weight:600;cursor:pointer;text-align:left;line-height:1.3;transition:all .15s;';
      opts.appendChild(b);
    });
    const fill=el('sc-tfill');
    fill.style.transition='none'; fill.style.width='100%';
    setTimeout(()=>{fill.style.transition=`width ${sc.flash}ms linear`;fill.style.width='0%';},30);
    flashTimer=setTimeout(()=>{
      showing=false;
      el('sc-msg').textContent='What did you see?';
      document.querySelectorAll('#sc-opts button').forEach(b=>b.disabled=false);
    },sc.flash);
  }

  function drawScene(){
    ctx.clearRect(0,0,W,H);
    const sc=scenarios[round%scenarios.length];
    if(!sc)return;
    if(showing){
      drawFormation(ctx,W,H,sc.players);
    } else {
      ctx.fillStyle='#080e08'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1;
      for(let x=0;x<W;x+=38){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=38){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      ctx.fillStyle='rgba(240,244,255,.22)'; ctx.font='bold 14px DM Sans,sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('What did you see?',W/2,H*.38);
      ctx.fillStyle='rgba(240,244,255,.1)'; ctx.font='11px DM Sans';
      const q=sc.q; ctx.fillText(q.length>62?q.substring(0,60)+'…':q,W/2,H*.5);
    }
  }

  function drawFormation(ctx,W,H,players){
    _drawGrass(ctx,W,H);
    ctx.strokeStyle='rgba(255,255,255,.14)'; ctx.lineWidth=1.5;
    ctx.strokeRect(W*.1,H*.08,W*.8,H*.84);
    ctx.beginPath(); ctx.moveTo(W*.1,H/2); ctx.lineTo(W*.9,H/2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W/2,H/2,H*.14,0,Math.PI*2); ctx.stroke();
    ctx.strokeRect(W*.35,H*.08,W*.3,H*.16);
    ctx.strokeRect(W*.35,H*.76,W*.3,H*.16);
    players.forEach(p=>{
      const px=W*p.x,py=H*p.y,r=16;
      if(p.free){
        ctx.save(); ctx.shadowColor='rgba(184,255,87,.9)'; ctx.shadowBlur=18;
        ctx.strokeStyle='rgba(184,255,87,.85)'; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(px,py,r+7,0,Math.PI*2); ctx.stroke(); ctx.restore();
      }
      if(p.pressing){
        const alpha=.4+.4*Math.sin(Date.now()/220);
        ctx.save(); ctx.strokeStyle=`rgba(239,68,68,${alpha})`; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(px,py,r+9,0,Math.PI*2); ctx.stroke(); ctx.restore();
      }
      if(p.run){
        ctx.save(); ctx.strokeStyle='rgba(255,182,39,.7)'; ctx.lineWidth=2; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,py-32); ctx.stroke();
        ctx.fillStyle='rgba(255,182,39,.8)';
        ctx.beginPath(); ctx.moveTo(px,py-32); ctx.lineTo(px-5,py-24); ctx.lineTo(px+5,py-24); ctx.fill();
        ctx.setLineDash([]); ctx.restore();
      }
      const col=p.t==='b'?'#3b82f6':'#ef4444';
      _drawPlayer(ctx,px,py,col,p.n,r);
    });
  }

  function scanAnswer(i,sc){
    if(answered)return; answered=true; clearTimeout(flashTimer);
    showing=true;
    const ok=i===sc.a;
    if(ok){score++; if(typeof playCorrect==='function')playCorrect();}else{if(typeof playWrong==='function')playWrong();}
    document.querySelectorAll('#sc-opts button').forEach(b=>b.disabled=true);
    el('sco'+i).style.borderColor=ok?'#b8ff57':'#ff5e8a';
    el('sco'+i).style.background=ok?'rgba(184,255,87,.1)':'rgba(255,94,138,.08)';
    el('sco'+sc.a).style.borderColor='#b8ff57';
    el('sco'+sc.a).style.background='rgba(184,255,87,.08)';
    el('sc-fb').innerHTML=`<div style="background:${ok?'rgba(184,255,87,.07)':'rgba(255,94,138,.07)'};border:1px solid ${ok?'rgba(184,255,87,.2)':'rgba(255,94,138,.2)'};border-radius:10px;padding:.7rem .85rem;margin-top:.42rem;">
      <div style="font-weight:800;color:${ok?'#b8ff57':'#ff5e8a'};margin-bottom:.22rem;">${ok?'👁️ Sharp eyes!':'❌ Missed it'}</div>
      <div style="font-size:.78rem;color:rgba(240,244,255,.5);line-height:1.55;">${sc.exp}</div>
    </div>
    <button onclick="scNext()" style="width:100%;padding:.7rem;margin-top:.42rem;border:none;border-radius:10px;background:rgba(255,255,255,.07);color:rgba(240,244,255,.6);font-family:'DM Sans',sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;">${round+1>=ROUNDS?'Results →':'Next →'}</button>`;
  }
  window.scNext=function(){
    el('sc-fb').innerHTML=''; round++;
    if(round>=ROUNDS){cancelAnimationFrame(animId);gameOver(container,'scanning',score,ROUNDS,score*14);}
    else loadRound();
  };
  loadRound();
  function loop(){drawScene();animId=requestAnimationFrame(loop);}
  _activeGameCleanup=()=>{cancelAnimationFrame(animId);clearTimeout(flashTimer);};
  loop();
}


// ═══════════════════════════════════════════════════════════
//  GAME 6 — AERIAL DUEL  (jump timing, cross arc, 5 rounds)
// ═══════════════════════════════════════════════════════════
function buildHeaderGame(container){
  const ROUNDS=5;
  let score=0,round=0,animId;
  let bx,by,bvx,bvy,phase='wait';
  let playerY=0,playerJumping=false,jumpVy=0;
  let jumpPressed=false,resultShown=false;
  let roundTimeout;

  const W=380,H=295;
  const PX=W*.46, GROUND=H-58, HEAD_OFFSET=52;

  const cvs=_canvas('hd-canvas',W,H);
  const ctx=cvs.getContext('2d');

  container.innerHTML=`<div style="max-width:420px;margin:0 auto;font-family:'DM Sans',sans-serif;">
    ${_hud('Headers','hd-score','Round','hd-round','hd-msg')}
    <div id="hd-wrap"></div>
    <div style="padding:.6rem .65rem;background:rgba(0,0,0,.38);border-radius:0 0 12px 12px;">
      <div style="font-size:.7rem;color:rgba(240,244,255,.3);text-align:center;margin-bottom:.42rem;">Jump when the ring glows green · Spacebar or tap button</div>
      <button id="hd-btn" onclick="hdJump()"
        style="width:100%;padding:.9rem;border:none;border-radius:12px;background:linear-gradient(135deg,#b8ff57,#5edfff);color:#000;font-family:'DM Sans',sans-serif;font-weight:900;font-size:1rem;cursor:pointer;-webkit-tap-highlight-color:transparent;">
        ⬆️ JUMP & HEAD
      </button>
    </div>
    <div id="hd-fb" style="padding:0 .65rem .65rem;"></div>
  </div>`;
  document.getElementById('hd-wrap').appendChild(cvs);

  const keydown=e=>{ if(e.code==='Space'){e.preventDefault();hdJump();} };
  document.addEventListener('keydown',keydown);

  window.hdJump=function(){
    if(phase!=='cross'||jumpPressed)return;
    jumpPressed=true; playerJumping=true; jumpVy=-12;
  };

  function startRound(){
    phase='wait'; jumpPressed=false; resultShown=false; playerJumping=false;
    playerY=GROUND; jumpVy=0;
    el('hd-btn').disabled=false;
    el('hd-round').textContent=(round+1)+'/'+ROUNDS;
    el('hd-msg').textContent='Cross coming...';
    el('hd-fb').innerHTML='';
    roundTimeout=setTimeout(()=>{
      launchCross();
      el('hd-msg').textContent='⬆️ JUMP!';
    },700+Math.random()*700);
  }

  function launchCross(){
    const right=Math.random()>.5;
    bx=right?W+14:-14; by=H*.1+Math.random()*H*.18;
    bvx=right?-(3.8+Math.random()*2.8):(3.8+Math.random()*2.8);
    bvy=2.2+Math.random()*1.8;
    phase='cross';
  }

  function resolveRound(ok,title,desc){
    if(resultShown)return; resultShown=true;
    phase='result';
    if(ok){score++; el('hd-score').textContent=score; if(typeof playCorrect==='function')playCorrect();
      if(typeof confetti!=='undefined')confetti({particleCount:40,spread:40,origin:{y:.5}});}
    else{if(typeof playWrong==='function')playWrong();}
    el('hd-msg').textContent=ok?'💥 '+title:'❌ '+title;
    el('hd-btn').disabled=true;
    el('hd-fb').innerHTML=`<div style="background:${ok?'rgba(184,255,87,.06)':'rgba(255,94,138,.06)'};border:1px solid ${ok?'rgba(184,255,87,.18)':'rgba(255,94,138,.18)'};border-radius:10px;padding:.62rem .8rem;margin-top:.4rem;">
      <div style="font-weight:800;color:${ok?'#b8ff57':'#ff5e8a'};margin-bottom:.18rem;">${title}</div>
      <div style="font-size:.77rem;color:rgba(240,244,255,.5);line-height:1.5;">${desc}</div>
    </div>`;
    round++;
    roundTimeout=setTimeout(()=>{
      el('hd-fb').innerHTML='';
      if(round>=ROUNDS){cancelAnimationFrame(animId);document.removeEventListener('keydown',keydown);gameOver(container,'header',score,ROUNDS,score*14);}
      else startRound();
    },1300);
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    _drawGrass(ctx,W,H);

    // Crossbar / goal top
    ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(W*.25,0); ctx.lineTo(W*.75,0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*.25,0); ctx.lineTo(W*.25,H*.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*.75,0); ctx.lineTo(W*.75,H*.2); ctx.stroke();
    // Net
    ctx.strokeStyle='rgba(255,255,255,.09)'; ctx.lineWidth=1;
    for(let x=W*.25;x<W*.75;x+=16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H*.2);ctx.stroke();}
    for(let y=0;y<H*.2;y+=16){ctx.beginPath();ctx.moveTo(W*.25,y);ctx.lineTo(W*.75,y);ctx.stroke();}

    // Ground
    ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(0,GROUND+14); ctx.lineTo(W,GROUND+14); ctx.stroke();

    // Crowd silhouettes
    ctx.fillStyle='rgba(0,0,0,.25)';
    for(let i=0;i<16;i++){ctx.beginPath();ctx.arc(12+i*23,GROUND+24,10,0,Math.PI*2);ctx.fill();}

    // Defender (red, slightly offset, minor jump after player)
    const defX=PX+34;
    const defExtra=playerJumping&&playerY<GROUND-22?-Math.min(35,GROUND-playerY-22)*.55:0;
    ctx.fillStyle='#dc2626'; ctx.fillRect(defX-11,GROUND-40+defExtra,22,44);
    ctx.fillStyle='#fca5a5'; ctx.beginPath(); ctx.arc(defX,GROUND-54+defExtra,11,0,Math.PI*2); ctx.fill();

    // Player physics update
    if(playerJumping){jumpVy+=.62;playerY+=jumpVy;if(playerY>=GROUND){playerY=GROUND;playerJumping=false;jumpVy=0;}}

    ctx.fillStyle='#2563eb'; ctx.fillRect(PX-13,playerY-42,26,44);
    ctx.fillStyle='#bfdbfe'; ctx.beginPath(); ctx.arc(PX,playerY-55,13,0,Math.PI*2); ctx.fill();

    // Timing ring
    if(phase==='cross'){
      const headY=playerY-HEAD_OFFSET;
      const dist=Math.hypot(bx-PX,by-headY);
      const max=96;
      if(dist<max){
        const p=1-dist/max;
        const ringCol=p>.65?`rgba(184,255,87,${p*.95})`:`rgba(255,182,39,${p*.7})`;
        ctx.save(); ctx.strokeStyle=ringCol; ctx.lineWidth=3+p*4;
        ctx.shadowColor=ringCol; ctx.shadowBlur=14*p;
        ctx.beginPath(); ctx.arc(PX,headY,38+p*9,0,Math.PI*2); ctx.stroke(); ctx.restore();
        if(p>.62){
          ctx.fillStyle=`rgba(184,255,87,${p})`;
          ctx.font=`bold ${10+p*5}px DM Sans`; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('NOW!',PX,headY-58);
        }
      }
    }

    // Ball
    if(phase==='cross'||phase==='result'){
      if(phase==='cross'){
        bvx*=.999; bvy+=.14; bx+=bvx; by+=bvy;
        // Cross trajectory hint
        if(by<H*.55){
          ctx.save(); ctx.strokeStyle='rgba(255,255,255,.07)'; ctx.lineWidth=1.2; ctx.setLineDash([3,5]);
          ctx.beginPath(); ctx.moveTo(bx,by);
          let tx=bx,ty=by,tvx=bvx,tvy=bvy;
          for(let s=0;s<28;s++){tvx*=.999;tvy+=.14;tx+=tvx;ty+=tvy;s===0?ctx.moveTo(tx,ty):ctx.lineTo(tx,ty);}
          ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        }
        // Check jump result
        if(jumpPressed&&!resultShown){
          const headY=playerY-HEAD_OFFSET;
          const dist=Math.hypot(bx-PX,by-headY);
          if(dist<48){resolveRound(true,'Perfect header!','Excellent timing — you attacked the ball at the highest point. That\'s exactly what coaches teach.');}
          else if(bx<PX-15||bx>PX+80){phase='none';}
        }
        // Ball gone past without jump
        if(!jumpPressed&&!resultShown&&(bx<-20||bx>W+20)){
          resolveRound(false,'Ball went across','You didn\'t jump! Watch the cross trajectory and jump just before it arrives at head height.');
        }
        // Ball on ground
        if(!resultShown&&by>GROUND+20){
          if(!jumpPressed) resolveRound(false,'Too late','The ball came down before you jumped. Anticipate the cross — jump just before the ball arrives.');
          else resolveRound(false,'Mistimed','You jumped but the timing was off. The ring shows when the ball is in the sweet spot.');
        }
      }
      _drawBall(ctx,bx,by,12);
    }

    // Round pips
    for(let i=0;i<ROUNDS;i++){
      ctx.fillStyle=i<score?'#b8ff57':i<round?'#ff5e8a':'rgba(255,255,255,.14)';
      ctx.beginPath(); ctx.arc(W*.38+i*(W*.24/(ROUNDS-1)),H-24,5,0,Math.PI*2); ctx.fill();
    }
  }

  startRound();
  function loop(){draw();animId=requestAnimationFrame(loop);}
  _activeGameCleanup=()=>{cancelAnimationFrame(animId);clearTimeout(roundTimeout);document.removeEventListener('keydown',keydown);};
  loop();
}
