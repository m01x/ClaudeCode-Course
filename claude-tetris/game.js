'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#90caf9', // J - pale blue
  '#ffb74d', // L - orange
  '#9e9e9e', // N - tuerca (gris metálico)
];

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[8,8,8],[8,0,8],[8,8,8]],                  // N (tuerca)
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const RECORDS_KEY = 'tetris-records';
const MAX_RECORDS = 5;

// ---- DOM refs ----
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo');
const bestScoreEl = document.getElementById('best-score');
const overlay = document.getElementById('overlay');
const screenStart = document.getElementById('screen-start');
const screenGameover = document.getElementById('screen-gameover');
const screenPause = document.getElementById('screen-pause');
const gameoverStats = document.getElementById('gameover-stats');
const newRecordSection = document.getElementById('new-record-section');
const playerNameInput = document.getElementById('player-name');
const saveRecordBtn = document.getElementById('save-record-btn');
const restartBtn = document.getElementById('restart-btn');
const startBtn = document.getElementById('start-btn');
const resetBtnStart = document.getElementById('reset-btn-start');
const resetBtnGameover = document.getElementById('reset-btn-gameover');

// ---- Records ----
function loadRecords() {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY)) || []; }
  catch { return []; }
}

function saveRecordsToStorage(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function addRecord(name, playerScore, playerMaxCombo, playerLines) {
  const records = loadRecords();
  const entry = { name, score: playerScore, maxCombo: playerMaxCombo, lines: playerLines };
  records.push(entry);
  records.sort((a, b) => b.score - a.score);
  const trimmed = records.slice(0, MAX_RECORDS);
  saveRecordsToStorage(trimmed);
  return trimmed.indexOf(entry);
}

function isTopScore(playerScore) {
  const records = loadRecords();
  return records.length < MAX_RECORDS || playerScore > records[MAX_RECORDS - 1].score;
}

function resetAllRecords() {
  localStorage.removeItem(RECORDS_KEY);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function updateBestScore() {
  const records = loadRecords();
  bestScoreEl.textContent = records.length ? records[0].score.toLocaleString() : '-';
}

function renderRecords(containerId, highlightIdx = -1) {
  const records = loadRecords();
  const container = document.getElementById(containerId);
  if (!records.length) {
    container.innerHTML = '<p class="no-records">Sin récords aún</p>';
    updateBestScore();
    return;
  }
  const rows = records.map((r, i) => {
    const cls = i === highlightIdx ? ' class="record-highlight"' : '';
    return `<tr${cls}><td>${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${r.score.toLocaleString()}</td><td>${r.maxCombo}x</td><td>${r.lines}</td></tr>`;
  }).join('');
  container.innerHTML = `<table class="records-table">
    <thead><tr><th>#</th><th>Nombre</th><th>Puntos</th><th>Combo</th><th>Líneas</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
  updateBestScore();
}

// ---- Screen management ----
function showScreen(name) {
  screenStart.classList.add('hidden');
  screenGameover.classList.add('hidden');
  screenPause.classList.add('hidden');
  if (name) {
    document.getElementById(`screen-${name}`).classList.remove('hidden');
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
}

// ---- Game state ----
let board, current, next, score, lines, level, combo, maxCombo;
let paused, gameOver, gameStarted, lastTime, dropAccum, dropInterval, animId;
let pendingRecord = false;
let firstLoad = true;

// ---- Board ----
function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

// ---- Collision / rotation ----
function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

// ---- Merge & clear ----
function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  }
  return cleared;
}

// ---- Drop / lock ----
function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  const cleared = clearLines();
  if (cleared === 0) combo = 0;
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

// ---- HUD ----
function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
  comboEl.textContent = combo > 1 ? `${combo}x` : '-';
}

// ---- Draw ----
function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = COLORS[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.globalAlpha = 1;
}

function drawGrid() {
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--grid-line').trim();
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

// ---- Game over ----
function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);

  gameoverStats.textContent =
    `Puntuación: ${score.toLocaleString()} · Líneas: ${lines} · Nivel: ${level} · Combo máx: ${maxCombo}x`;

  if (score > 0 && isTopScore(score)) {
    pendingRecord = true;
    newRecordSection.classList.remove('hidden');
    playerNameInput.value = '';
    setTimeout(() => playerNameInput.focus(), 50);
  } else {
    pendingRecord = false;
    newRecordSection.classList.add('hidden');
  }

  renderRecords('records-gameover');
  showScreen('gameover');
}

// ---- Pause ----
function togglePause() {
  if (!gameStarted || gameOver) return;
  paused = !paused;
  if (!paused) {
    lastTime = performance.now();
    dropAccum = 0;
    showScreen(null);
    animId = requestAnimationFrame(loop);
  } else {
    cancelAnimationFrame(animId);
    showScreen('pause');
  }
}

// ---- Game loop ----
function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  if (gameOver) return;
  draw();
  animId = requestAnimationFrame(loop);
}

// ---- Init ----
function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  combo = 0;
  maxCombo = 0;
  paused = false;
  gameOver = false;
  pendingRecord = false;
  dropInterval = 1000;
  dropAccum = 0;
  next = randomPiece();
  spawn();
  updateHUD();
  cancelAnimationFrame(animId);

  if (firstLoad) {
    firstLoad = false;
    gameStarted = false;
    renderRecords('records-start');
    showScreen('start');
  } else {
    gameStarted = true;
    lastTime = performance.now();
    showScreen(null);
    animId = requestAnimationFrame(loop);
  }
}

// ---- Event handlers ----
document.addEventListener('keydown', e => {
  if (e.code === 'KeyP') { togglePause(); return; }
  if (!gameStarted || paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

startBtn.addEventListener('click', () => {
  gameStarted = true;
  lastTime = performance.now();
  dropAccum = 0;
  showScreen(null);
  animId = requestAnimationFrame(loop);
});

restartBtn.addEventListener('click', init);

saveRecordBtn.addEventListener('click', () => {
  if (!pendingRecord) return;
  const name = playerNameInput.value.trim() || 'Anónimo';
  pendingRecord = false;
  const idx = addRecord(name, score, maxCombo, lines);
  newRecordSection.classList.add('hidden');
  renderRecords('records-gameover', idx);
});

playerNameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveRecordBtn.click();
  e.stopPropagation();
});

resetBtnStart.addEventListener('click', () => {
  if (!confirm('¿Borrar todos los récords?')) return;
  resetAllRecords();
  renderRecords('records-start');
});

resetBtnGameover.addEventListener('click', () => {
  if (!confirm('¿Borrar todos los récords?')) return;
  resetAllRecords();
  pendingRecord = false;
  newRecordSection.classList.add('hidden');
  renderRecords('records-gameover');
});

// ---- Theme ----
const themeToggle = document.getElementById('theme-toggle');
const toggleIcon = themeToggle.querySelector('.toggle-icon');
const toggleLabel = themeToggle.querySelector('.toggle-label');

function applyTheme(isLight) {
  if (isLight) {
    document.body.classList.add('light-mode');
    toggleIcon.textContent = '☀';
    toggleLabel.textContent = 'DARK';
  } else {
    document.body.classList.remove('light-mode');
    toggleIcon.textContent = '☾';
    toggleLabel.textContent = 'LIGHT';
  }
}

const savedTheme = localStorage.getItem('tetris-theme');
applyTheme(savedTheme === 'light');

themeToggle.addEventListener('click', () => {
  const isLight = !document.body.classList.contains('light-mode');
  applyTheme(isLight);
  localStorage.setItem('tetris-theme', isLight ? 'light' : 'dark');
});

init();
