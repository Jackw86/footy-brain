// ============================================================
//  Footy Brain — penalty3d.js
//  Full 3D Penalty Shootout using Three.js r128
//  Features: realistic 3D goal, animated keeper, physics ball,
//  swipe/drag aiming, power charge, crowd atmosphere, 5-kick game
// ============================================================

'use strict';

function buildPenalty3DGame(container) {

  // ─── Constants ───────────────────────────────────────────
  const KICKS      = 5;
  const SAVE_SKILL = 0.52;  // keeper save probability on good dives
  const BALL_SPEED = 22;    // metres per second at max power
  const GOAL_W     = 7.32;  // official width
  const GOAL_H     = 2.44;  // official height
  const SPOT_DIST  = 11;    // penalty spot to line

  // ─── State ───────────────────────────────────────────────
  let score = 0, kick = 0;
  let phase = 'aim'; // aim | charge | fly | result | done
  let power = 0;
  let targetX = 0, targetY = GOAL_H * 0.5; // where the player is aiming (-3.66 to 3.66, 0 to 2.44)
  let isDragging = false, dragStartX = 0, dragStartY = 0;
  let chargingInterval = null;
  let animId = null;
  let cleanedUp = false;
  let flashTimeout = null;

  // ─── DOM Setup ───────────────────────────────────────────
  container.innerHTML = `
    <div id="p3d-wrap" style="position:relative;width:100%;max-width:400px;margin:0 auto;user-select:none;">
      <!-- HUD top bar -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem .75rem;
                  background:rgba(0,0,0,.5);border-radius:14px 14px 0 0;backdrop-filter:blur(8px);">
        <div style="text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--lime);line-height:1;" id="p3d-score">0</div>
          <div style="font-size:.62rem;color:rgba(240,244,255,.4);text-transform:uppercase;letter-spacing:.08em;">Goals</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.1rem;color:rgba(240,244,255,.7);" id="p3d-kick">1 / ${KICKS}</div>
          <div style="font-size:.62rem;color:rgba(240,244,255,.4);text-transform:uppercase;letter-spacing:.08em;">Kicks</div>
        </div>
        <div style="text-align:center;min-width:60px;">
          <div style="font-size:.78rem;font-weight:700;color:var(--amber);" id="p3d-msg">Aim shot</div>
        </div>
      </div>

      <!-- Three.js canvas goes here -->
      <div id="p3d-canvas-wrap" style="width:100%;aspect-ratio:4/3;background:#1a2a18;overflow:hidden;touch-action:none;cursor:crosshair;"></div>

      <!-- Aim indicator overlay -->
      <canvas id="p3d-aim-canvas" style="position:absolute;top:44px;left:0;width:100%;pointer-events:none;"
              width="400" height="300"></canvas>

      <!-- Power bar + button -->
      <div style="padding:.6rem .75rem;background:rgba(0,0,0,.5);border-radius:0 0 14px 14px;backdrop-filter:blur(8px);">
        <div style="background:rgba(255,255,255,.08);border-radius:99px;height:10px;overflow:hidden;margin-bottom:.5rem;">
          <div id="p3d-power-bar" style="height:100%;width:0%;border-radius:99px;
               background:linear-gradient(90deg,var(--lime),var(--amber),var(--rose));transition:width .04s;"></div>
        </div>
        <div style="display:flex;gap:.5rem;align-items:center;">
          <div style="flex:1;font-size:.72rem;color:rgba(240,244,255,.4);">
            Drag to aim · Hold SHOOT to charge
          </div>
          <button id="p3d-btn"
            style="background:linear-gradient(135deg,var(--lime),#5edfff);color:#000;border:none;
                   font-family:'DM Sans',sans-serif;font-weight:900;font-size:.88rem;
                   padding:.65rem 1.25rem;border-radius:11px;cursor:pointer;
                   min-width:100px;-webkit-tap-highlight-color:transparent;">
            ⚡ SHOOT
          </button>
        </div>
      </div>
    </div>`;

  // ─── Three.js Scene ──────────────────────────────────────
  const wrap = document.getElementById('p3d-canvas-wrap');
  if (!wrap || typeof THREE === 'undefined') {
    container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--t2);">3D engine loading... try again in a moment.</div>';
    return;
  }

  const W = wrap.clientWidth  || 400;
  const H = wrap.clientHeight || 300;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x1a3a18);
  wrap.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  scene.fog    = new THREE.Fog(0x1a3a18, 30, 80);

  // Camera — behind the ball, low, looking toward goal
  const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 100);
  camera.position.set(0, 1.1, SPOT_DIST + 2.5);
  camera.lookAt(0, 1.0, 0);

  // ─── Lighting ────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff8e8, 1.0);
  sun.position.set(8, 18, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 80;
  sun.shadow.camera.left  = -20;
  sun.shadow.camera.right =  20;
  sun.shadow.camera.top   =  20;
  sun.shadow.camera.bottom= -20;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xc8e0ff, 0.3);
  fill.position.set(-8, 8, -5);
  scene.add(fill);

  // Stadium spotlights
  for (let i = 0; i < 4; i++) {
    const spot = new THREE.SpotLight(0xfff4cc, 0.6);
    const angle = (i / 4) * Math.PI * 2;
    spot.position.set(Math.cos(angle)*18, 14, Math.sin(angle)*10 - 5);
    spot.target.position.set(0, 0, 0);
    spot.angle = 0.5;
    spot.penumbra = 0.4;
    spot.castShadow = false;
    scene.add(spot);
    scene.add(spot.target);
  }

  // ─── Pitch ───────────────────────────────────────────────
  const pitchGeo  = new THREE.PlaneGeometry(40, 60);
  const pitchMat  = new THREE.MeshLambertMaterial({ color: 0x2d6a1f });
  const pitch     = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.receiveShadow = true;
  scene.add(pitch);

  // Stripe pattern via vertex colors (alternating dark/light bands)
  function addPitchStripes() {
    const stripeCount = 8;
    const stripeW = 40 / stripeCount;
    for (let i = 0; i < stripeCount; i += 2) {
      const sg = new THREE.PlaneGeometry(stripeW, 60);
      const sm = new THREE.MeshLambertMaterial({ color: 0x276018, transparent: true, opacity: 0.35 });
      const s  = new THREE.Mesh(sg, sm);
      s.rotation.x = -Math.PI / 2;
      s.position.set(-20 + stripeW * i + stripeW * 0.5, 0.001, 0);
      scene.add(s);
    }
  }
  addPitchStripes();

  // Penalty area white lines
  function addLine(x1,z1,x2,z2,y=0.005) {
    const pts = [new THREE.Vector3(x1,y,z1), new THREE.Vector3(x2,y,z2)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color:0xffffff, opacity:0.7, transparent:true });
    scene.add(new THREE.Line(geo, mat));
  }
  // Penalty area box: 16.5m each side, 40.32m wide
  const PA_X = 20.16, PA_Z_back = -0.5, PA_Z_front = 16.5;
  addLine(-PA_X, PA_Z_back,  PA_X, PA_Z_back);
  addLine(-PA_X, PA_Z_back, -PA_X, PA_Z_front);
  addLine( PA_X, PA_Z_back,  PA_X, PA_Z_front);
  addLine(-PA_X, PA_Z_front, PA_X, PA_Z_front);
  // 6-yard box
  addLine(-9.16, PA_Z_back,  9.16, PA_Z_back);
  addLine(-9.16, PA_Z_back, -9.16, 5.5);
  addLine( 9.16, PA_Z_back,  9.16, 5.5);
  addLine(-9.16, 5.5,        9.16, 5.5);
  // Goal line
  addLine(-20, PA_Z_back, 20, PA_Z_back);
  // Penalty spot
  const spotGeo = new THREE.CircleGeometry(0.1, 16);
  const spotMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const spotMesh = new THREE.Mesh(spotGeo, spotMat);
  spotMesh.rotation.x = -Math.PI/2;
  spotMesh.position.set(0, 0.006, SPOT_DIST);
  scene.add(spotMesh);
  // Centre circle arc (penalty arc)
  const arcPts = [];
  for (let a = -Math.PI*0.65; a <= Math.PI*0.65; a += 0.05) {
    arcPts.push(new THREE.Vector3(Math.sin(a)*9.15, 0.006, SPOT_DIST + Math.cos(a)*9.15));
  }
  const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
  const arcMat = new THREE.LineBasicMaterial({color:0xffffff,opacity:0.5,transparent:true});
  scene.add(new THREE.Line(arcGeo, arcMat));

  // ─── Goal ─────────────────────────────────────────────────
  const POST_R  = 0.06;
  const postMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 80 });

  function makePost(x, y, z, rx, ry, rz, h) {
    const geo = new THREE.CylinderGeometry(POST_R, POST_R, h, 12);
    const m   = new THREE.Mesh(geo, postMat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    scene.add(m);
    return m;
  }
  // Left post, right post, crossbar
  makePost(-GOAL_W/2, GOAL_H/2,  0, 0, 0, 0, GOAL_H);
  makePost( GOAL_W/2, GOAL_H/2,  0, 0, 0, 0, GOAL_H);
  makePost(0,         GOAL_H,    0, 0, 0, Math.PI/2, GOAL_W);

  // Goal net (semi-transparent mesh)
  function addNet() {
    // Back net
    const bGeo = new THREE.PlaneGeometry(GOAL_W, GOAL_H, 14, 8);
    const nMat = new THREE.MeshBasicMaterial({
      color:0xffffff, transparent:true, opacity:0.12,
      side:THREE.DoubleSide, wireframe:true
    });
    const back = new THREE.Mesh(bGeo, nMat);
    back.position.set(0, GOAL_H/2, -1.8);
    scene.add(back);
    // Top net
    const tGeo = new THREE.PlaneGeometry(GOAL_W, 1.8, 14, 4);
    const top  = new THREE.Mesh(tGeo, nMat.clone());
    top.rotation.x = Math.PI/2;
    top.position.set(0, GOAL_H, -0.9);
    scene.add(top);
    // Side nets
    for (const sx of [-1, 1]) {
      const sGeo = new THREE.PlaneGeometry(1.8, GOAL_H, 4, 8);
      const side = new THREE.Mesh(sGeo, nMat.clone());
      side.rotation.y = Math.PI/2;
      side.position.set(sx * GOAL_W/2, GOAL_H/2, -0.9);
      scene.add(side);
    }
    // Net thicker outline ropes
    const ropeGeo1 = new THREE.CylinderGeometry(0.015, 0.015, GOAL_H, 6);
    const ropeMat  = new THREE.MeshLambertMaterial({color:0xdddddd});
    [-GOAL_W/2, -GOAL_W/4, 0, GOAL_W/4, GOAL_W/2].forEach(nx => {
      const r = new THREE.Mesh(ropeGeo1, ropeMat);
      r.position.set(nx, GOAL_H/2, -1.8);
      scene.add(r);
    });
  }
  addNet();

  // Goal depth posts (back)
  makePost(-GOAL_W/2, GOAL_H/2, -1.8, 0, 0, 0, GOAL_H);
  makePost( GOAL_W/2, GOAL_H/2, -1.8, 0, 0, 0, GOAL_H);
  // Back crossbar
  makePost(0, GOAL_H, -1.8, 0, 0, Math.PI/2, GOAL_W);

  // Ground under goal (dirt/darker)
  const goalGrdGeo = new THREE.PlaneGeometry(GOAL_W + 0.5, 2);
  const goalGrdMat = new THREE.MeshLambertMaterial({color:0x1e5010});
  const goalGrd    = new THREE.Mesh(goalGrdGeo, goalGrdMat);
  goalGrd.rotation.x = -Math.PI/2;
  goalGrd.position.set(0, 0.002, -0.9);
  scene.add(goalGrd);

  // ─── Ball ─────────────────────────────────────────────────
  const ballGeo  = new THREE.SphereGeometry(0.11, 24, 24);
  // Panel texture procedurally via canvas
  const ballCanvas = document.createElement('canvas');
  ballCanvas.width = ballCanvas.height = 256;
  const bCtx = ballCanvas.getContext('2d');
  bCtx.fillStyle = '#ffffff';
  bCtx.fillRect(0,0,256,256);
  // Draw black pentagons (simplified)
  bCtx.fillStyle = '#111';
  const pts6 = [[128,30],[220,90],[220,166],[128,226],[36,166],[36,90]];
  bCtx.beginPath();
  pts6.forEach((p,i) => i===0 ? bCtx.moveTo(...p) : bCtx.lineTo(...p));
  bCtx.fill();
  const ballTex  = new THREE.CanvasTexture(ballCanvas);
  const ballMat  = new THREE.MeshPhongMaterial({ map: ballTex, shininess: 60 });
  const ball     = new THREE.Mesh(ballGeo, ballMat);
  ball.castShadow = true;
  ball.position.set(0, 0.11, SPOT_DIST);
  scene.add(ball);

  // Ball shadow (fake soft shadow disc)
  const shadowGeo = new THREE.CircleGeometry(0.18, 16);
  const shadowMat = new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.35});
  const ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
  ballShadow.rotation.x = -Math.PI/2;
  ballShadow.position.set(0, 0.002, SPOT_DIST);
  scene.add(ballShadow);

  // ─── Goalkeeper ───────────────────────────────────────────
  const keeperGroup = new THREE.Group();
  scene.add(keeperGroup);

  function makeKeeperMesh() {
    const g = new THREE.Group();
    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.52, 0.6, 0.24);
    const torsoMat = new THREE.MeshPhongMaterial({ color: 0xff6600 }); // orange kit
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    g.add(torso);
    // Head
    const headGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const headMat = new THREE.MeshPhongMaterial({ color: 0xfdbcb4 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.45;
    head.castShadow = true;
    g.add(head);
    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
    const legMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
    [-0.17, 0.17].forEach(lx => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.35, 0);
      leg.castShadow = true;
      g.add(leg);
    });
    // Arms
    const armGeo = new THREE.BoxGeometry(0.14, 0.48, 0.14);
    const armMat = new THREE.MeshPhongMaterial({ color: 0xff6600 });
    [-0.37, 0.37].forEach((ax, i) => {
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(ax, 1.0, 0);
      arm.rotation.z = i===0 ? 0.3 : -0.3;
      arm.castShadow = true;
      g.add(arm);
    });
    // Gloves
    const gloveGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const gloveMat = new THREE.MeshPhongMaterial({ color: 0xffee44 });
    [-0.52, 0.52].forEach(gx => {
      const glove = new THREE.Mesh(gloveGeo, gloveMat);
      glove.position.set(gx, 1.0, 0);
      glove.castShadow = true;
      g.add(glove);
    });
    return g;
  }

  const keeperMesh = makeKeeperMesh();
  keeperGroup.add(keeperMesh);
  keeperGroup.position.set(0, 0, 0.3);

  // Keeper sway state
  let keeperSway = 0, keeperSwayDir = 1;
  let keeperDiving = false, keeperDiveTarget = new THREE.Vector3();
  let keeperDiveDone = false;

  // ─── Background — stadium feel ─────────────────────────────
  // Sky gradient via background color + fog
  scene.background = new THREE.Color(0x4a7ab5); // daytime blue

  // Crowd stands (simple boxes with color noise)
  function addStands() {
    const standMat = new THREE.MeshLambertMaterial({ color: 0x2244aa, vertexColors: false });
    // Back stand
    const backGeo = new THREE.BoxGeometry(50, 8, 6);
    const back    = new THREE.Mesh(backGeo, new THREE.MeshLambertMaterial({color:0x1a3366}));
    back.position.set(0, 4, -28);
    scene.add(back);
    // Side stands
    for (const sx of [-1,1]) {
      const sGeo = new THREE.BoxGeometry(6, 6, 30);
      const side = new THREE.Mesh(sGeo, new THREE.MeshLambertMaterial({color:0x1a2255}));
      side.position.set(sx * 24, 3, -5);
      scene.add(side);
    }
    // Crowd sprites (simplified colourful dots)
    const colours = [0xff2222,0x2244ff,0xffffff,0xffee00,0x22bb44,0xff8800];
    for (let i=0; i<300; i++) {
      const cGeo = new THREE.BoxGeometry(0.6, 0.9, 0.1);
      const cMat = new THREE.MeshLambertMaterial({color:colours[Math.floor(Math.random()*colours.length)]});
      const c    = new THREE.Mesh(cGeo, cMat);
      const side = Math.random() > 0.5 ? 1 : -1;
      if (Math.random() > 0.5) {
        c.position.set((Math.random()-0.5)*40, 1+Math.random()*6, -26 - Math.random()*3);
      } else {
        c.position.set(side*(22+Math.random()*3), 1+Math.random()*5, (Math.random()-0.5)*26);
      }
      scene.add(c);
    }
  }
  addStands();

  // ─── Aim Crosshair (2D canvas overlay) ─────────────────────
  const aimCanvas = document.getElementById('p3d-aim-canvas');
  const aimCtx    = aimCanvas ? aimCanvas.getContext('2d') : null;
  let aimPixelX = 200, aimPixelY = 150; // screen-space aim position

  function worldToScreen(wx, wy, wz) {
    const v = new THREE.Vector3(wx, wy, wz);
    v.project(camera);
    return {
      x: (v.x + 1) / 2 * (aimCanvas?.width || 400),
      y: (1 - (v.y + 1) / 2) * (aimCanvas?.height || 300),
    };
  }

  function drawAimOverlay() {
    if (!aimCtx || !aimCanvas) return;
    aimCtx.clearRect(0, 0, aimCanvas.width, aimCanvas.height);
    if (phase !== 'aim') return;

    // Convert targetX/Y (goal-space) to screen coords
    const sp = worldToScreen(targetX, targetY, 0);
    const x = sp.x, y = sp.y;

    // Outer ring
    const alpha = 0.75 + 0.25 * Math.sin(Date.now() * 0.004);
    aimCtx.strokeStyle = `rgba(184,255,87,${alpha})`;
    aimCtx.lineWidth = 2.5;
    aimCtx.beginPath();
    aimCtx.arc(x, y, 18, 0, Math.PI*2);
    aimCtx.stroke();

    // Inner dot
    aimCtx.fillStyle = `rgba(184,255,87,${alpha})`;
    aimCtx.beginPath();
    aimCtx.arc(x, y, 3, 0, Math.PI*2);
    aimCtx.fill();

    // Cross hairs
    aimCtx.strokeStyle = `rgba(184,255,87,${alpha * 0.6})`;
    aimCtx.lineWidth = 1.5;
    aimCtx.beginPath();
    aimCtx.moveTo(x-26,y); aimCtx.lineTo(x-20,y);
    aimCtx.moveTo(x+20,y); aimCtx.lineTo(x+26,y);
    aimCtx.moveTo(x,y-26); aimCtx.lineTo(x,y-20);
    aimCtx.moveTo(x,y+20); aimCtx.lineTo(x,y+26);
    aimCtx.stroke();

    // Zone hint label
    const zone = getZoneLabel(targetX, targetY);
    aimCtx.font = 'bold 11px DM Sans, sans-serif';
    aimCtx.fillStyle = 'rgba(184,255,87,0.9)';
    aimCtx.textAlign = 'center';
    aimCtx.fillText(zone, x, y - 24);
  }

  function getZoneLabel(tx, ty) {
    const xLabel = tx < -1.5 ? 'LEFT' : tx > 1.5 ? 'RIGHT' : 'CENTRE';
    const yLabel = ty > 1.6 ? 'TOP' : ty < 0.7 ? 'LOW' : 'MID';
    return `${yLabel} ${xLabel}`;
  }

  // ─── Touch / Mouse drag aiming ────────────────────────────
  function screenToGoalAim(screenX, screenY) {
    const rect = wrap.getBoundingClientRect();
    // Normalise to canvas wrap
    const nx = (screenX - rect.left) / rect.width;   // 0-1
    const ny = (screenY - rect.top  - 44) / (rect.height - 88); // 0-1, offset HUD
    // Map to goal space with some damping
    const gx = (nx - 0.5) * GOAL_W * 1.3;
    const gy = (1 - ny) * GOAL_H * 1.2;
    return {
      x: Math.max(-GOAL_W/2 - 0.4, Math.min(GOAL_W/2 + 0.4, gx)),
      y: Math.max(0.05, Math.min(GOAL_H + 0.3, gy)),
    };
  }

  const canvasWrap = document.getElementById('p3d-canvas-wrap');

  function onPointerDown(e) {
    if (phase !== 'aim') return;
    isDragging = true;
    const px = e.touches ? e.touches[0].clientX : e.clientX;
    const py = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartX = px; dragStartY = py;
    const aim = screenToGoalAim(px, py);
    targetX = aim.x; targetY = aim.y;
  }
  function onPointerMove(e) {
    if (!isDragging || phase !== 'aim') return;
    const px = e.touches ? e.touches[0].clientX : e.clientX;
    const py = e.touches ? e.touches[0].clientY : e.clientY;
    const aim = screenToGoalAim(px, py);
    targetX = aim.x; targetY = aim.y;
  }
  function onPointerUp() { isDragging = false; }

  canvasWrap.addEventListener('mousedown',  onPointerDown);
  canvasWrap.addEventListener('mousemove',  onPointerMove);
  canvasWrap.addEventListener('mouseup',    onPointerUp);
  canvasWrap.addEventListener('touchstart', e => { e.preventDefault(); onPointerDown(e); }, {passive:false});
  canvasWrap.addEventListener('touchmove',  e => { e.preventDefault(); onPointerMove(e); }, {passive:false});
  canvasWrap.addEventListener('touchend',   onPointerUp);

  // ─── Shoot button ─────────────────────────────────────────
  const btn = document.getElementById('p3d-btn');
  let chargePower = 0;

  function startCharge() {
    if (phase !== 'aim') return;
    phase = 'charge';
    chargePower = 0;
    chargingInterval = setInterval(() => {
      chargePower = Math.min(chargePower + 2.5, 100);
      document.getElementById('p3d-power-bar').style.width = chargePower + '%';
    }, 40);
    setMsg('Charging... ⚡');
  }

  function releaseShoot() {
    if (phase !== 'charge') return;
    clearInterval(chargingInterval);
    power = chargePower;
    shoot();
  }

  btn.addEventListener('mousedown',  startCharge);
  btn.addEventListener('mouseup',    releaseShoot);
  btn.addEventListener('mouseleave', () => { if (phase === 'charge') releaseShoot(); });
  btn.addEventListener('touchstart', e => { e.preventDefault(); startCharge(); }, {passive:false});
  btn.addEventListener('touchend',   releaseShoot);

  // ─── Ball physics ─────────────────────────────────────────
  let ballVelocity = new THREE.Vector3();
  let ballSpinY    = 0;
  let ballFlying   = false;
  let ballLanded   = false;

  function shoot() {
    phase = 'fly';
    btn.disabled = true;
    btn.textContent = '...';

    // Direction from spot to target
    const fromZ    = SPOT_DIST;
    const toX      = targetX;
    const toY      = targetY;
    const toZ      = 0;
    const dx       = toX - ball.position.x;
    const dy       = toY - ball.position.y;
    const dz       = toZ - ball.position.z;
    const dist     = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const spd      = 8 + (power / 100) * BALL_SPEED;
    const t        = dist / spd; // time to reach goal

    ballVelocity.set(
      dx / t,
      dy / t + 0.8, // slight upward arc
      dz / t
    );
    ballSpinY = (Math.random() - 0.5) * 12; // topspin/sidespin

    // Add slight inaccuracy based on inverse of power
    const inaccuracy = (1 - power/100) * 0.6;
    ballVelocity.x += (Math.random()-0.5) * inaccuracy;
    ballVelocity.y += (Math.random()-0.5) * inaccuracy * 0.4;

    ballFlying = true;
    ballLanded = false;

    // Keeper dive decision (delayed slightly)
    setTimeout(doKeeperDive, 120);
    setMsg('🚀');
  }

  function doKeeperDive() {
    if (phase !== 'fly') return;
    keeperDiving = true;

    // Keeper guesses: 60% correct side, 40% wrong
    const correctSide = targetX < 0 ? -1 : targetX > 0 ? 1 : (Math.random()>0.5?1:-1);
    const correctGuess = Math.random() < 0.62;
    const diveSide     = correctGuess ? correctSide : -correctSide;

    // Dive target
    const diveX  = diveSide * (1.5 + Math.random() * 2.0);
    const diveY  = targetY > 1.5 ? 1.8 + Math.random() * 0.4 : 0.8 + Math.random() * 0.3;
    keeperDiveTarget.set(diveX, diveY, 0.3);
  }

  // ─── Physics update ───────────────────────────────────────
  const GRAVITY = -9.8;
  let lastTime = 0;

  function updateBall(dt) {
    if (!ballFlying) return;
    ballVelocity.y += GRAVITY * dt;
    ball.position.addScaledVector(ballVelocity, dt);
    ball.rotation.x -= ballVelocity.z * dt * 3;
    ball.rotation.y += ballSpinY * dt;
    ball.rotation.z -= ballVelocity.x * dt * 2;

    // Ball shadow follows
    ballShadow.position.x = ball.position.x;
    ballShadow.position.z = ball.position.z;
    const heightFade = Math.max(0, 1 - ball.position.y / 3);
    shadowMat.opacity = 0.35 * heightFade;
    ballShadow.scale.setScalar(Math.max(0.3, 1 - ball.position.y * 0.15));

    // Reached goal line?
    if (ball.position.z <= 0.1 && phase === 'fly') {
      ballFlying = false;
      checkGoal();
    }

    // Hit ground before goal
    if (ball.position.y <= 0.11 && ball.position.z > 0) {
      ball.position.y = 0.11;
      ballVelocity.y *= -0.35;
      ballVelocity.x *= 0.7;
      ballVelocity.z *= 0.7;
      if (Math.abs(ballVelocity.y) < 0.5) {
        ballFlying = false;
        if (phase === 'fly') {
          phase = 'result';
          showResult(false, false, false);
        }
      }
    }
  }

  function updateKeeper(dt) {
    if (keeperDiving && !keeperDiveDone) {
      const speed = 8;
      keeperGroup.position.lerp(keeperDiveTarget, Math.min(1, dt * speed * 3));
      // Tilt on dive
      const tx = keeperDiveTarget.x;
      keeperGroup.rotation.z = THREE.MathUtils.lerp(keeperGroup.rotation.z, tx > 0 ? -0.8 : 0.8, dt * 5);
      keeperGroup.rotation.x = THREE.MathUtils.lerp(keeperGroup.rotation.x, -0.5, dt * 3);
      if (keeperGroup.position.distanceTo(keeperDiveTarget) < 0.1) keeperDiveDone = true;
    } else if (!keeperDiving) {
      // Sway
      keeperSway += keeperSwayDir * dt * 1.8;
      if (keeperSway > 1.8 || keeperSway < -1.8) keeperSwayDir *= -1;
      keeperGroup.position.x = THREE.MathUtils.lerp(keeperGroup.position.x, keeperSway, dt * 3);
    }
  }

  function checkGoal() {
    const bx = ball.position.x;
    const by = ball.position.y;

    const inGoalH = bx > -GOAL_W/2 - 0.1 && bx < GOAL_W/2 + 0.1;
    const inGoalV = by < GOAL_H + 0.12 && by > 0.05;
    const inGoal  = inGoalH && inGoalV;

    // Post/bar check
    const hitPost = (Math.abs(bx - (-GOAL_W/2)) < 0.18 || Math.abs(bx - GOAL_W/2) < 0.18) && inGoalV;
    const hitBar  = Math.abs(by - GOAL_H) < 0.18 && inGoalH;

    // Save check — was keeper close enough?
    const keeperX = keeperGroup.position.x;
    const keeperY = keeperGroup.position.y;
    const distToKeeper = Math.sqrt((bx - keeperX)**2 + (by - 1.0 - keeperY)**2);
    const saved = inGoal && distToKeeper < 0.85 && Math.random() < SAVE_SKILL;

    phase = 'result';
    showResult(inGoal && !saved && !hitPost && !hitBar, saved, hitPost || hitBar);
  }

  function showResult(goal, saved, post) {
    if (goal) {
      score++;
      document.getElementById('p3d-score').textContent = score;
      setMsg('GOAL! 🔥⚽');
      if (typeof addXP === 'function') addXP(8);
      if (typeof confetti !== 'undefined') confetti({ particleCount: 60, spread: 55, origin: { y: 0.4 } });
    } else if (saved) {
      setMsg('SAVED! 🧤');
    } else if (post) {
      setMsg('Post! 😬');
    } else {
      setMsg('Off target 😬');
    }

    kick++;
    document.getElementById('p3d-kick').textContent = `${Math.min(kick+1,KICKS)} / ${KICKS}`;

    flashTimeout = setTimeout(() => {
      if (kick >= KICKS) {
        endGame();
      } else {
        resetKick();
      }
    }, 1400);
  }

  function resetKick() {
    phase = 'aim';
    power = 0;
    chargePower = 0;
    document.getElementById('p3d-power-bar').style.width = '0%';
    ballFlying   = false;
    keeperDiving = false;
    keeperDiveDone = false;

    ball.position.set(0, 0.11, SPOT_DIST);
    ball.rotation.set(0, 0, 0);
    ballVelocity.set(0, 0, 0);
    ballShadow.position.set(0, 0.002, SPOT_DIST);

    keeperGroup.position.set(0, 0, 0.3);
    keeperGroup.rotation.set(0, 0, 0);
    targetX = 0; targetY = GOAL_H * 0.5;

    btn.disabled    = false;
    btn.textContent = '⚡ SHOOT';
    setMsg('Aim your shot');
  }

  function endGame() {
    phase = 'done';
    cleanup();
    if (typeof gameOver === 'function') {
      gameOver(container, 'penalty', score, KICKS, score * 8);
    }
  }

  function setMsg(txt) {
    const el = document.getElementById('p3d-msg');
    if (el) el.textContent = txt;
  }

  // ─── Render loop ──────────────────────────────────────────
  function animate(ts) {
    if (cleanedUp) return;
    animId = requestAnimationFrame(animate);
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    updateBall(dt);
    updateKeeper(dt);
    drawAimOverlay();

    // Subtle camera push during flight
    if (phase === 'fly') {
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, SPOT_DIST + 1.5, dt * 2);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.85, dt * 2);
    } else if (phase === 'aim' || phase === 'charge') {
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, SPOT_DIST + 2.5, dt * 2);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.1, dt * 2);
    }
    camera.lookAt(0, 1.0, 0);

    renderer.render(scene, camera);
  }
  lastTime = performance.now();
  animId = requestAnimationFrame(animate);

  // ─── Resize ───────────────────────────────────────────────
  function onResize() {
    const nw = wrap.clientWidth || 400;
    const nh = Math.round(nw * 0.75);
    renderer.setSize(nw, nh);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    if (aimCanvas) { aimCanvas.width = nw; aimCanvas.height = nh; }
  }
  window.addEventListener('resize', onResize);

  // ─── Cleanup ──────────────────────────────────────────────
  function cleanup() {
    cleanedUp = true;
    cancelAnimationFrame(animId);
    clearInterval(chargingInterval);
    clearTimeout(flashTimeout);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  }

  if (typeof window._activeGameCleanup !== 'undefined') {
    window._activeGameCleanup = cleanup;
  }
}

// ─── Register in GAME_META + override buildPenaltyGame ──────
if (typeof window !== 'undefined') {
  window.buildPenalty3DGame = buildPenalty3DGame;
  // Override the showGame dispatcher to use 3D for penalty
  const _origShowGame = window.showGame;
  window.showGame = function(name) {
    if (name === 'penalty') {
      const container = document.getElementById('game-container');
      if (container) buildPenalty3DGame(container);
    } else if (typeof _origShowGame === 'function') {
      _origShowGame(name);
    }
  };
}
