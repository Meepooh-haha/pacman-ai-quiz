// ================================================================
//  PACMAN AI QUIZ — game.js
// ================================================================

// ── Tile constants ──
const T = 20; // tile size in pixels
const COLS = 21, ROWS = 26;
const WALL=1, DOT=2, POWER=3, EMPTY=0, GHOST_ZONE=5;

// ── Maze layout (21 cols × 26 rows) ──
// 0=path, 1=wall, 2=dot, 3=power pellet, 5=ghost zone
const BASE_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,3,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,0,0,0,0,1,1,1,2,1,1,1,1],
  [0,0,0,0,2,1,0,0,0,0,0,0,0,0,0,1,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,0,1,1,1,0,1,2,1,1,1,1],
  [1,1,1,1,2,0,0,1,5,5,5,5,5,1,0,0,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,5,5,5,5,5,1,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,1,0,0,0,0,0,0,0,0,0,1,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,1,1,1,2,0,0,0,0,0,0,0,0,0,0,0,2,1,1,1,1],
  [1,1,1,1,2,1,1,1,0,0,1,0,0,1,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,2,0,2,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ── Canvas setup ──
const HUD_H = 60;
const canvas = document.getElementById('gameCanvas');
canvas.width  = COLS * T;
canvas.height = ROWS * T + HUD_H;
const ctx = canvas.getContext('2d');

// ── Game state ──
let map, totalDots, dotsEaten, score, lives, level, frame;
let lastTimestamp = 0;
let accumulator = 0;
let playerName = 'PLAYER';
let highScores = [];
let raf = null;
let gameRunning = false;

// ── Pacman ──
const pac = {
  col: 10, row: 20,
  px: 0, py: 0,
  dx: 0, dy: 0,
  nextDx: 0, nextDy: 0,
  mouthOpen: 0.25, mouthDir: 1,
  speed: 2.5,
  dead: false, deadTimer: 0,
};

// ── Ghosts ──
const GHOST_DEFS = [
  { name:'Blinky', color:'#FF0000', startCol:10, startRow:7,  exitDelay:0  },
  { name:'Pinky',  color:'#FFB8FF', startCol:10, startRow:11, exitDelay:2  },
  { name:'Inky',   color:'#00CFCF', startCol:9,  startRow:11, exitDelay:4  },
  { name:'Clyde',  color:'#FFB852', startCol:11, startRow:11, exitDelay:6  },
];
let ghosts = [];

// ── Quiz state ──
let questions = [];
let currentQuestionIndex = 0;
let quizActive = false;
let quizTimerInterval = null;
let quizTimeLeft = 15;
let quizAnswered = false;
let eatenGhostScore = 200;

// ── Power state ──
let powered = false;
let powerTimer = null;

// ── DOM refs ──
const startScreen    = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const lbScreen       = document.getElementById('leaderboard-screen');
const quizOverlay    = document.getElementById('quiz-overlay');
const quizQuestion   = document.getElementById('quiz-question');
const quizChoices    = document.getElementById('quiz-choices');
const quizTimerEl    = document.getElementById('quiz-timer');
const quizTimerBar   = document.getElementById('timer-bar');
const quizResult     = document.getElementById('quiz-result');
const nameInput      = document.getElementById('name-input');
const liveScoreEl    = document.getElementById('live-score');

// ================================================================
//  INIT
// ================================================================
async function loadQuestions() {
  try {
    const res = await fetch('questions.json');
    const data = await res.json();
    questions = data.questions;
  } catch(e) {
    console.warn('Could not load questions.json:', e);
    questions = [{ question: 'AI ย่อมาจากอะไร?', choices: ['Artificial Intelligence','Automatic Input','Advanced Internet','Analog Interface'], answer: 0 }];
  }
}

function initMap() {
  map = BASE_MAP.map(row => [...row]);
  totalDots = 0;
  dotsEaten = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (map[r][c] === DOT || map[r][c] === POWER) totalDots++;
}

function initPacman() {
  pac.col = 10; pac.row = 20;
  pac.px = pac.col * T + T/2;
  pac.py = pac.row * T + T/2 + HUD_H;
  pac.dx = 0; pac.dy = 0;
  pac.nextDx = -1; pac.nextDy = 0;
  pac.dead = false; pac.deadTimer = 0;
}

function initGhosts() {
  ghosts = GHOST_DEFS.map(def => ({
    ...def,
    col: def.startCol, row: def.startRow,
    px: def.startCol * T + T/2,
    py: def.startRow * T + T/2 + HUD_H,
    dx: 0, dy: -1,
    mode: def.exitDelay === 0 ? 'chase' : 'house',
    scared: false,
    eaten: false,
    exitTimer: def.exitDelay * 60, // frames
    speed: 2.0,
    atCenter: true,
  }));
}

function startGame() {
  score = 0; lives = 3; level = 1; frame = 0;
  lastTimestamp = 0;
  accumulator = 0;
  currentQuestionIndex = 0;
  initMap();
  initPacman();
  initGhosts();
  setPowered(false);
  gameRunning = true;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

// ================================================================
//  UTILITY
// ================================================================
function tileAt(col, row) {
  if (row < 0 || row >= ROWS) return WALL;
  const c = ((col % COLS) + COLS) % COLS; // wrap columns for tunnel
  return map[row][c];
}

function isWalkable(col, row) {
  const t = tileAt(col, row);
  return t !== WALL && t !== GHOST_ZONE;
}

function isWalkableForGhost(col, row) {
  const t = tileAt(col, row);
  return t !== WALL;
}

// Chase/scared ghosts cannot re-enter the ghost house
function isWalkableForActiveGhost(col, row) {
  const t = tileAt(col, row);
  return t !== WALL && t !== GHOST_ZONE;
}

function dist(ac, ar, bc, br) {
  return Math.hypot(ac - bc, ar - br);
}

function wrapCol(col) {
  return ((col % COLS) + COLS) % COLS;
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// ================================================================
//  MOVEMENT HELPERS
// ================================================================
function tileCenterPx(col, row) {
  return { x: col * T + T/2, y: row * T + T/2 + HUD_H };
}

function nearCenter(px, py, col, row, threshold) {
  const c = tileCenterPx(col, row);
  return Math.abs(px - c.x) <= threshold && Math.abs(py - c.y) <= threshold;
}

// ================================================================
//  PACMAN LOGIC
// ================================================================
function updatePacman() {
  if (pac.dead) {
    pac.deadTimer--;
    if (pac.deadTimer <= 0) {
      lives--;
      if (lives <= 0) { endGame(); return; }
      resetPositions();
    }
    return;
  }

  // Mouth animation
  pac.mouthOpen += 0.05 * pac.mouthDir;
  if (pac.mouthOpen > 0.25 || pac.mouthOpen < 0.02) pac.mouthDir *= -1;

  const speed = pac.speed;
  const col = Math.round((pac.px - T/2) / T);
  const row = Math.round((pac.py - HUD_H - T/2) / T);

  if (nearCenter(pac.px, pac.py, col, row, speed - 1)) {
    // Snap to center
    const center = tileCenterPx(col, row);
    pac.px = center.x;
    pac.py = center.y;

    // Try queued direction change
    if (pac.nextDx !== 0 || pac.nextDy !== 0) {
      const nc = col + pac.nextDx, nr = row + pac.nextDy;
      if (isWalkable(nc, nr)) {
        pac.dx = pac.nextDx; pac.dy = pac.nextDy;
        pac.nextDx = 0; pac.nextDy = 0;
      }
    }

    // Check if can continue in current direction
    const fc = col + pac.dx, fr = row + pac.dy;
    if (!isWalkable(fc, fr)) { pac.dx = 0; pac.dy = 0; }

    // Collect items
    collectItem(col, row);
  }

  pac.px += pac.dx * speed;
  pac.py += pac.dy * speed;

  // Tunnel wrap
  if (pac.dx < 0 && pac.px < -T/2) pac.px = COLS * T + T/2;
  if (pac.dx > 0 && pac.px > COLS * T + T/2) pac.px = -T/2;
}

function collectItem(col, row) {
  const wc = wrapCol(col);
  const tile = map[row]?.[wc];
  if (tile === DOT) {
    map[row][wc] = EMPTY;
    score += 10;
    dotsEaten++;
    checkLevelComplete();
  } else if (tile === POWER) {
    map[row][wc] = EMPTY;
    score += 50;
    dotsEaten++;
    checkLevelComplete();
    triggerQuiz();
  }
}

function checkLevelComplete() {
  if (dotsEaten >= totalDots) {
    level++;
    setTimeout(() => {
      initMap();
      initPacman();
      initGhosts();
    }, 1500);
  }
}

// ================================================================
//  GHOST LOGIC
// ================================================================
const DIRS = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];

function updateGhosts() {
  ghosts.forEach(g => {
    if (g.eaten) {
      updateEatenGhost(g);
    } else if (g.mode === 'house') {
      updateHouseGhost(g);
    } else {
      updateActiveGhost(g);
    }
  });
}

function updateHouseGhost(g) {
  // Bounce vertically inside ghost zone
  g.py += g.dy * 1.0;
  const row = Math.round((g.py - HUD_H - T/2) / T);
  if (row <= 10) g.dy = 1;
  if (row >= 11) g.dy = -1;

  g.exitTimer--;
  if (g.exitTimer <= 0) {
    g.mode = 'exiting';
    g.col = 10; g.row = 10;
    g.px = 10 * T + T/2;
    g.py = 10 * T + T/2 + HUD_H;
  }
}

function updateEatenGhost(g) {
  // Eyes float directly toward ghost house (classic Pac-Man behavior — passes through walls)
  const targetPx = 10 * T + T / 2;
  const targetPy = 10 * T + T / 2 + HUD_H;
  const spd = 3.0;
  const dx = targetPx - g.px;
  const dy = targetPy - g.py;
  const d = Math.hypot(dx, dy);
  if (d <= spd) {
    g.px = targetPx; g.py = targetPy;
    g.col = 10; g.row = 10;
    g.eaten = false; g.scared = false;
    g.mode = 'house';
    g.exitTimer = 2 * 60;
    g.dx = 0; g.dy = 1;
  } else {
    g.px += (dx / d) * spd;
    g.py += (dy / d) * spd;
    g.col = Math.round((g.px - T/2) / T);
    g.row = Math.round((g.py - HUD_H - T/2) / T);
  }
}

function updateActiveGhost(g) {
  const spd = g.scared ? 0.8 : (g.mode === 'exiting' ? 1.3 : 1.3);
  const col = Math.round((g.px - T/2) / T);
  const row = Math.round((g.py - HUD_H - T/2) / T);

  if (g.mode === 'exiting') {
    // Move to exit door then to above ghost house
    const exitCol = 10, exitRow = 9;
    if (nearCenter(g.px, g.py, col, row, spd * 0.9)) {
      const center = tileCenterPx(col, row);
      g.px = center.x; g.py = center.y;
      if (col === exitCol && row === exitRow) {
        g.mode = 'chase'; g.dx = -1; g.dy = 0;
        return;
      }
      // Navigate toward exit
      const tgt = row <= exitRow ? exitCol : 10;
      const tgtR = row <= exitRow ? exitRow : col === 10 ? exitRow : row - 1;
      let best = null, bestDist = Infinity;
      for (const d of DIRS) {
        const nc = col + d.dx, nr = row + d.dy;
        if (!isWalkableForGhost(nc, nr)) continue;
        const dd = dist(nc, nr, tgt, tgtR);
        if (dd < bestDist) { bestDist = dd; best = d; }
      }
      if (best) { g.dx = best.dx; g.dy = best.dy; }
    }
    g.px += g.dx * spd;
    g.py += g.dy * spd;
    return;
  }

  if (nearCenter(g.px, g.py, col, row, spd * 0.9)) {
    const center = tileCenterPx(col, row);
    g.px = center.x; g.py = center.y;
    g.col = col; g.row = row;

    const pacCol = Math.round((pac.px - T/2) / T);
    const pacRow = Math.round((pac.py - HUD_H - T/2) / T);

    let targetCol, targetRow;
    if (g.scared) {
      // Flee: pick direction that maximizes distance from LivShield
      let validDirs = DIRS.filter(d => {
        const nc = col + d.dx, nr = row + d.dy;
        return isWalkableForActiveGhost(nc, nr) && !(d.dx === -g.dx && d.dy === -g.dy && (g.dx||g.dy));
      });
      if (validDirs.length === 0) {
        validDirs = DIRS.filter(d => isWalkableForActiveGhost(col + d.dx, row + d.dy));
      }
      if (validDirs.length > 0) {
        let best = validDirs[0], bestDist = -1;
        for (const d of validDirs) {
          const dd = dist(col + d.dx, row + d.dy, pacCol, pacRow);
          if (dd > bestDist) { bestDist = dd; best = d; }
        }
        g.dx = best.dx; g.dy = best.dy;
      }
    } else {
      switch(g.name) {
        case 'Pinky':
          targetCol = pacCol + pac.dx * 4;
          targetRow = pacRow + pac.dy * 4;
          break;
        case 'Clyde':
          if (dist(col, row, pacCol, pacRow) > 8) {
            targetCol = pacCol; targetRow = pacRow;
          } else {
            targetCol = 1; targetRow = 24;
          }
          break;
        default:
          targetCol = pacCol; targetRow = pacRow;
      }
      const pickDir = (allowReverse) => {
        let best = null, bestDist = Infinity;
        for (const d of DIRS) {
          const nc = col + d.dx, nr = row + d.dy;
          if (!isWalkableForActiveGhost(nc, nr)) continue;
          if (!allowReverse && d.dx === -g.dx && d.dy === -g.dy && (g.dx || g.dy)) continue;
          const dd = dist(nc, nr, targetCol, targetRow);
          if (dd < bestDist) { bestDist = dd; best = d; }
        }
        return best;
      };
      const best = pickDir(false) || pickDir(true);
      if (best) { g.dx = best.dx; g.dy = best.dy; }
    }
  }

  g.px += g.dx * spd;
  g.py += g.dy * spd;
  g.col = Math.round((g.px - T/2) / T);
  g.row = Math.round((g.py - HUD_H - T/2) / T);

  // Tunnel wrap for ghosts
  if (g.px < -T/2) g.px = COLS * T + T/2;
  if (g.px > COLS * T + T/2) g.px = -T/2;
}

// ================================================================
//  COLLISION
// ================================================================
function checkCollisions() {
  if (pac.dead) return;
  const pacCol = Math.round((pac.px - T/2) / T);
  const pacRow = Math.round((pac.py - HUD_H - T/2) / T);
  for (const g of ghosts) {
    if (g.eaten) continue;
    const gCol = Math.round((g.px - T/2) / T);
    const gRow = Math.round((g.py - HUD_H - T/2) / T);
    if (pacCol !== gCol || pacRow !== gRow) continue;
    const dx = Math.abs(pac.px - g.px);
    const dy = Math.abs(pac.py - g.py);
    if (dx < T * 0.6 && dy < T * 0.6) {
      if (g.scared) {
        eatGhost(g);
      } else if (g.mode === 'chase' || g.mode === 'exiting') {
        killPacman();
      }
    }
  }
}

function eatGhost(g) {
  g.eaten = true;
  g.scared = false;
  score += eatenGhostScore;
  eatenGhostScore = Math.min(eatenGhostScore * 2, 1600);
  showFloatingScore(g.px, g.py, eatenGhostScore / 2);
}

function killPacman() {
  pac.dead = true;
  pac.deadTimer = 90;
  setPowered(false);
}

function resetPositions() {
  initPacman();
  initGhosts();
  setPowered(false);
}

// ================================================================
//  POWER MODE
// ================================================================
function setPowered(on, duration) {
  powered = on;
  clearTimeout(powerTimer);
  if (on) {
    eatenGhostScore = 200;
    ghosts.forEach(g => { if (!g.eaten && g.mode !== 'house' && g.mode !== 'exiting') g.scared = true; });
    powerTimer = setTimeout(() => {
      powered = false;
      ghosts.forEach(g => g.scared = false);
    }, duration * 1000);
  } else {
    ghosts.forEach(g => g.scared = false);
  }
}

// ================================================================
//  QUIZ SYSTEM
// ================================================================
function triggerQuiz() {
  if (questions.length === 0) return;
  gameRunning = false;

  const q = questions[currentQuestionIndex];
  currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
  showQuiz(q);
}

function showQuiz(q) {
  quizActive = true;
  quizAnswered = false;
  quizTimeLeft = 15;
  quizResult.textContent = '';
  quizResult.className = '';

  quizQuestion.textContent = q.question;
  quizChoices.innerHTML = '';
  quizTimerEl.textContent = '15';
  quizTimerEl.className = '';
  quizTimerBar.style.width = '100%';
  quizTimerBar.className = '';

  // Build choice buttons
  q.choices.forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = `${['A','B','C','D'][i]}. ${choice}`;
    btn.addEventListener('click', () => answerQuiz(i, q.answer, q.choices.length));
    quizChoices.appendChild(btn);
  });

  quizOverlay.classList.add('active');

  // Start countdown
  clearInterval(quizTimerInterval);
  quizTimerInterval = setInterval(() => {
    quizTimeLeft--;
    quizTimerEl.textContent = quizTimeLeft;
    const pct = (quizTimeLeft / 15) * 100;
    quizTimerBar.style.width = pct + '%';

    if (quizTimeLeft <= 5) {
      quizTimerEl.className = 'danger';
      quizTimerBar.className = 'danger';
    }
    if (quizTimeLeft <= 0) {
      clearInterval(quizTimerInterval);
      if (!quizAnswered) timeoutQuiz(q.answer);
    }
  }, 1000);
}

function answerQuiz(chosen, correct, total) {
  if (quizAnswered) return;
  quizAnswered = true;
  clearInterval(quizTimerInterval);

  const btns = quizChoices.querySelectorAll('.choice-btn');
  btns.forEach(b => b.disabled = true);
  btns[correct].classList.add('correct');

  if (chosen === correct) {
    btns[chosen].classList.add('correct');
    const speedBonus = Math.round((quizTimeLeft / 15) * 150);
    const bonus = 50 + speedBonus;
    score += bonus;
    const powerDuration = 3 + (quizTimeLeft / 15) * 10;
    quizResult.textContent = `✓ ถูกต้อง! +${bonus} คะแนน | พลัง ${powerDuration.toFixed(1)}s`;
    quizResult.className = 'result-correct';
    setTimeout(() => closeQuiz(true, powerDuration), 1500);
  } else {
    btns[chosen].classList.add('wrong');
    quizResult.textContent = '✗ ผิด — ไม่ได้รับพลัง';
    quizResult.className = 'result-wrong';
    setTimeout(() => closeQuiz(false, 0), 1500);
  }
}

function timeoutQuiz(correct) {
  quizAnswered = true;
  const btns = quizChoices.querySelectorAll('.choice-btn');
  btns.forEach(b => b.disabled = true);
  btns[correct].classList.add('correct');
  quizResult.textContent = '⏰ หมดเวลา — ไม่ได้รับพลัง';
  quizResult.className = 'result-wrong';
  setTimeout(() => closeQuiz(false, 0), 1500);
}

function closeQuiz(powered_on, duration) {
  quizOverlay.classList.remove('active');
  quizActive = false;
  if (powered_on) setPowered(true, duration);
  gameRunning = true;
  raf = requestAnimationFrame(loop);
}

// ================================================================
//  FLOATING SCORE (visual feedback)
// ================================================================
const floats = [];
function showFloatingScore(px, py, pts) {
  floats.push({ px, py, pts, life: 60 });
}

// ================================================================
//  LEADERBOARD
// ================================================================
async function saveScore(name, pts) {
  if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ name: name.toUpperCase().slice(0, 12), score: pts }),
    });
    if (!res.ok) console.warn('Save score error:', res.status, await res.text());
  } catch(e) { console.warn('Save score failed:', e); }
}

async function fetchLeaderboard() {
  if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/leaderboard?select=name,score&order=score.desc&limit=1000`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    // Keep only highest score per name
    const best = new Map();
    for (const row of data) {
      if (!best.has(row.name) || best.get(row.name) < row.score) {
        best.set(row.name, row.score);
      }
    }
    return Array.from(best, ([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch(e) { console.warn('Fetch leaderboard failed:', e); return []; }
}

// ================================================================
//  GAME OVER
// ================================================================
function endGame() {
  gameRunning = false;
  clearTimeout(powerTimer);
  clearInterval(quizTimerInterval);
  cancelAnimationFrame(raf);

  document.getElementById('final-score').textContent = score.toLocaleString();
  showScreen(gameoverScreen);

  saveScore(playerName, score);
}

// ================================================================
//  RENDERING
// ================================================================
const WALL_COLOR = '#1a3a6b';
const WALL_BORDER = '#3a7bd5';
const DOT_COLOR = '#FFD700';
const POWER_COLOR = '#FFD700';
const PAC_COLOR = '#2277FF';
const LIVSHIELD_GLOW = '#44AAFF';

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawHUD();
  drawMaze();
  drawPacman();
  drawGhosts();
  drawFloats();
}

function drawHUD() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, HUD_H);

  // Score
  ctx.fillStyle = '#FFD700';
  ctx.font = '10px "Courier New"';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 12, 22);
  ctx.font = 'bold 18px "Courier New"';
  ctx.fillText(score.toLocaleString(), 12, 44);
  liveScoreEl.textContent = score.toLocaleString();

  // Player name
  ctx.font = '10px "Courier New"';
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  ctx.fillText(playerName.toUpperCase(), canvas.width/2, 22);

  // Level
  ctx.fillStyle = '#00CFCF';
  ctx.font = '10px "Courier New"';
  ctx.textAlign = 'left';
  ctx.fillText(`LV.${level}`, canvas.width/2 - 24, 44);

  // Lives
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'right';
  ctx.font = '10px "Courier New"';
  ctx.fillText('LIVES', canvas.width - 12, 22);
  for (let i = 0; i < lives; i++) {
    drawPacmanIcon(canvas.width - 18 - i * 18, 40, 7);
  }

  // Power bar
  if (powered && powerTimer) {
    // Indicator
    ctx.fillStyle = '#00CFCF';
    ctx.font = '8px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('💊 POWERED', canvas.width/2, 44);
  }
}

function drawMaze() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = map[r][c];
      const x = c * T, y = r * T + HUD_H;

      if (tile === WALL) {
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(x, y, T, T);
        // Border effect
        ctx.strokeStyle = WALL_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
      } else if (tile === DOT) {
        ctx.fillStyle = DOT_COLOR;
        ctx.beginPath();
        ctx.arc(x + T/2, y + T/2, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === POWER) {
        const pulse = 0.5 + 0.5 * Math.sin(frame * 0.12);
        const cx = x + T/2, cy = y + T/2;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 5 * pulse;
        ctx.fillStyle = `rgba(255,255,255,${0.7 + 0.3 * pulse})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(200,220,255,${0.4 + 0.3 * pulse})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 3);
        ctx.lineTo(cx, cy + 3);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (tile === GHOST_ZONE) {
        ctx.fillStyle = '#050510';
        ctx.fillRect(x, y, T, T);
      }
    }
  }
}

function drawPacman() {
  if (pac.dead && pac.deadTimer < 60) {
    const progress = 1 - pac.deadTimer / 60;
    ctx.globalAlpha = 1 - progress * 0.85;
    drawLivShieldAt(pac.px, pac.py, pac.dx, pac.dy);
    ctx.globalAlpha = 1;
    return;
  }
  if (pac.dead) return;
  drawLivShieldAt(pac.px, pac.py, pac.dx, pac.dy);
}

function drawLivShieldAt(cx, cy, dx, dy) {
  const r = T/2 - 2;
  let rotation = 0;
  if (dx === 1) rotation = 0;
  else if (dx === -1) rotation = Math.PI;
  else if (dy === -1) rotation = -Math.PI / 2;
  else if (dy === 1) rotation = Math.PI / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  ctx.shadowColor = LIVSHIELD_GLOW;
  ctx.shadowBlur = 10;
  ctx.fillStyle = PAC_COLOR;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#FFFFFF';
  const arm = r * 0.52, thick = r * 0.22;
  ctx.fillRect(-thick, -arm, thick * 2, arm * 2);
  ctx.fillRect(-arm, -thick, arm * 2, thick * 2);

  ctx.fillStyle = LIVSHIELD_GLOW;
  ctx.beginPath();
  ctx.arc(r * 0.38, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPacmanIcon(x, y, r) {
  ctx.fillStyle = PAC_COLOR;
  ctx.shadowColor = LIVSHIELD_GLOW;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  const arm = r * 0.52, thick = r * 0.22;
  ctx.fillRect(x - thick, y - arm, thick * 2, arm * 2);
  ctx.fillRect(x - arm, y - thick, arm * 2, thick * 2);
}

const GERM_SPIKES = { Blinky: 7, Pinky: 5, Inky: 8, Clyde: 6 };

function drawGhosts() {
  ghosts.forEach(g => {
    if (g.eaten) { drawGermRemnant(g.px, g.py); return; }
    drawGerm(g);
  });
}

function drawGerm(g) {
  const cx = g.px, cy = g.py;
  const r = T/2 - 2;
  const color = g.scared ? '#2233CC' : g.color;
  const spikes = GERM_SPIKES[g.name] || 6;
  const wobble = Math.sin(frame * 0.1 + g.exitDelay * 0.3) * 0.9;

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2;
    const rad = i % 2 === 0 ? r + wobble : r * 0.58;
    const sx = cx + Math.cos(angle) * rad;
    const sy = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
  ctx.fill();

  if (g.scared) {
    ctx.fillStyle = 'rgba(180,180,255,0.85)';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 1, 2, 0, Math.PI * 2);
    ctx.arc(cx + 3, cy - 1, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 3.5, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 3.5, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    const ex = g.dx * 1.5, ey = g.dy * 1.5;
    ctx.beginPath();
    ctx.arc(cx - 3.5 + ex, cy - 2 + ey, 1.3, 0, Math.PI * 2);
    ctx.arc(cx + 3.5 + ex, cy - 2 + ey, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGermRemnant(px, py) {
  ctx.fillStyle = '#6688dd';
  ctx.shadowColor = '#6688dd';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(px, py, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#aabbff';
  ctx.beginPath();
  ctx.arc(px - 3, py, 1.5, 0, Math.PI * 2);
  ctx.arc(px + 3, py, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawFloats() {
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.life--;
    f.py -= 0.5;
    if (f.life <= 0) { floats.splice(i, 1); continue; }
    ctx.globalAlpha = f.life / 60;
    ctx.fillStyle = '#00FF88';
    ctx.font = 'bold 12px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('+' + f.pts, f.px, f.py);
    ctx.globalAlpha = 1;
  }
}

// ================================================================
//  GAME LOOP
// ================================================================
const FRAME_MS = 1000 / 60;

function loop(ts) {
  if (!gameRunning) return;
  if (lastTimestamp) accumulator += Math.min(ts - lastTimestamp, 200);
  lastTimestamp = ts;
  while (accumulator >= FRAME_MS) {
    frame++;
    updatePacman();
    updateGhosts();
    checkCollisions();
    accumulator -= FRAME_MS;
  }
  draw();
  raf = requestAnimationFrame(loop);
}

// ================================================================
//  INPUT
// ================================================================
const KEY_MAP = {
  ArrowUp:    {dx:0,  dy:-1},
  ArrowDown:  {dx:0,  dy:1},
  ArrowLeft:  {dx:-1, dy:0},
  ArrowRight: {dx:1,  dy:0},
  w: {dx:0,  dy:-1},
  s: {dx:0,  dy:1},
  a: {dx:-1, dy:0},
  d: {dx:1,  dy:0},
};

document.addEventListener('keydown', e => {
  const d = KEY_MAP[e.key];
  if (d) { e.preventDefault(); pac.nextDx = d.dx; pac.nextDy = d.dy; }
});

// Touch/swipe for mobile
let touchStart = null;
canvas.addEventListener('touchstart', e => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    pac.nextDx = dx > 0 ? 1 : -1; pac.nextDy = 0;
  } else {
    pac.nextDx = 0; pac.nextDy = dy > 0 ? 1 : -1;
  }
  touchStart = null;
}, { passive: true });

// ================================================================
//  SCREEN MANAGEMENT
// ================================================================
function showScreen(el) {
  [startScreen, gameoverScreen, lbScreen].forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
}

function hideAllScreens() {
  showScreen(null);
}

// ── Start button ──
document.getElementById('btn-start').addEventListener('click', () => {
  const name = nameInput.value.trim();
  playerName = name || 'PLAYER';
  hideAllScreens();
  startGame();
});

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-start').click();
});

// ── Game over screen ──
document.getElementById('btn-retry').addEventListener('click', () => {
  hideAllScreens();
  startGame();
});

document.getElementById('btn-leaderboard').addEventListener('click', async () => {
  showScreen(lbScreen);
  await renderLeaderboard();
});

// ── Leaderboard screen ──
document.getElementById('btn-lb-play').addEventListener('click', () => {
  showScreen(startScreen);
});

async function renderLeaderboard() {
  const tbody = document.getElementById('lb-body');
  tbody.innerHTML = '<tr><td colspan="3" class="lb-empty">กำลังโหลด...</td></tr>';
  const scores = await fetchLeaderboard();
  if (scores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="lb-empty">ยังไม่มีคะแนน — เป็นคนแรกสิ!</td></tr>';
    return;
  }
  tbody.innerHTML = scores.map((s, i) => `
    <tr>
      <td class="lb-rank">${i + 1}</td>
      <td>${s.name}</td>
      <td style="text-align:right">${s.score.toLocaleString()}</td>
    </tr>
  `).join('');
}

// ================================================================
//  SCALE TO FIT SCREEN
// ================================================================
function scaleCanvas() {
  const wrap = document.getElementById('canvas-wrap');
  const scale = Math.min(1, (window.innerWidth - 16) / canvas.width);
  wrap.style.transform = `scale(${scale})`;
  wrap.style.marginBottom = scale < 1 ? `${(canvas.height * scale - canvas.height)}px` : '0';
}
window.addEventListener('resize', scaleCanvas);

// ================================================================
//  D-PAD INPUT
// ================================================================
const DPAD = { 'dpad-up':[0,-1], 'dpad-down':[0,1], 'dpad-left':[-1,0], 'dpad-right':[1,0] };
Object.entries(DPAD).forEach(([id, [dx, dy]]) => {
  const btn = document.getElementById(id);
  const apply = e => { e.preventDefault(); pac.nextDx = dx; pac.nextDy = dy; };
  btn.addEventListener('touchstart', apply, { passive: false });
  btn.addEventListener('mousedown', apply);
});

// ================================================================
//  BOOTSTRAP
// ================================================================
(async () => {
  await loadQuestions();
  scaleCanvas();
  showScreen(startScreen);

  // Draw static maze on canvas while on start screen
  initMap();
  drawMaze();
})();
