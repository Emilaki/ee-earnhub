/* 1. FIXED 4-ROUND EXTREME TIC-TAC-TOE */
let tttState = { round: 1, userWins: 0, aiWins: 0, board: Array(9).fill(null) };

function startTTT() {
  if (state.playsLeft.ttt <= 0) return;
  state.playsLeft.ttt--;
  refreshDashboard();
  tttState = { round: 1, userWins: 0, aiWins: 0, board: Array(9).fill(null) };
  openModal('⚔️ 4-Round Extreme Tic-Tac-Toe', '');
  renderTTT();
}

function renderTTT() {
  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex; justify-content:space-between; font-size:0.88rem; margin-bottom:10px;">
      <span>Round: <b>${tttState.round} / 4</b></span>
      <span class="emerald-text">You: <b>${tttState.userWins}</b></span>
      <span style="color:var(--crimson);">AI: <b>${tttState.aiWins}</b></span>
    </div>
    <p class="muted-small" style="text-align:center;">Win at least <b>3 out of 4 rounds</b> to claim payout.</p>
    <div class="ttt-grid">
      ${tttState.board.map((c, i) => `<div class="ttt-cell ${c === 'O' ? 'ai' : ''}" onclick="playTTTMove(${i})">${c || ''}</div>`).join('')}
    </div>`;
}

function playTTTMove(idx) {
  if (tttState.board[idx] || checkWinner(tttState.board)) return;
  tttState.board[idx] = 'X';
  if (evaluateRoundEnd()) return;
  const aiMove = Math.random() < 0.88 ? getBestMove(tttState.board) : getRandomMove(tttState.board);
  if (aiMove !== -1) tttState.board[aiMove] = 'O';
  evaluateRoundEnd();
}

function evaluateRoundEnd() {
  renderTTT();
  const winner = checkWinner(tttState.board);
  const full = tttState.board.every(c => c !== null);
  if (!winner && !full) return false;

  if (winner === 'X') tttState.userWins++;
  else tttState.aiWins++;

  setTimeout(() => {
    if (tttState.round >= 4) {
      closeModal();
      if (tttState.userWins >= 3) awardGameWin(false);
      else showToast(`Gauntlet Failed (${tttState.userWins}/4 wins). Need 3 wins.`, true);
    } else {
      tttState.round++;
      tttState.board = Array(9).fill(null);
      renderTTT();
    }
  }, 600);
  return true;
}

function checkWinner(b) {
  const lines = [, [3, 4, 5], [6, 7, 8],
, [1, 4, 7], [2, 5, 8],
, [2, 4, 6]
  ];
  for (const [a, c, d] of lines) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

function getRandomMove(b) {
  const avail = b.map((v, i) => v === null ? i : null).filter(v => v !== null);
  return avail.length ? avail[Math.floor(Math.random() * avail.length)] : -1;
}

function getBestMove(board) {
  let bestScore = -Infinity, move = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'O';
      let score = minimax(board, 0, false);
      board[i] = null;
      if (score > bestScore) { bestScore = score; move = i; }
    }
  }
  return move;
}

function minimax(b, depth, isMax) {
  const w = checkWinner(b);
  if (w === 'O') return 10 - depth;
  if (w === 'X') return depth - 10;
  if (b.every(c => c !== null)) return 0;
  let best = isMax ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = isMax ? 'O' : 'X';
      const val = minimax(b, depth + 1, !isMax);
      b[i] = null;
      best = isMax ? Math.max(best, val) : Math.min(best, val);
    }
  }
  return best;
}
/* 2. 10-WORD SPELLING QUIZ (10s TIMER PER QUESTION • SCORE 7+/10) */
const SPELLING_BANK = [
  { opts: ['Accommodate', 'Acommodate', 'Accomodate'], ans: 0 },
  { opts: ['Mischevious', 'Mischievous', 'Mischievious'], ans: 1 },
  { opts: ['Conscientious', 'Concientious', 'Consciencious'], ans: 0 },
  { opts: ['Pharoah', 'Pharaoh', 'Faraoh'], ans: 1 },
  { opts: ['Superfluous', 'Superflous', 'Superfluos'], ans: 0 },
  { opts: ['Idiosyncracy', 'Idiosyncrasy', 'Idosyncrasy'], ans: 1 },
  { opts: ['Sacrilegious', 'Sacreligious', 'Sacriligious'], ans: 0 },
  { opts: ['Manoeuvre', 'Manuever', 'Maneouvre'], ans: 0 },
  { opts: ['Chrysanthmum', 'Chrysanthemum', 'Crysanthemum'], ans: 1 },
  { opts: ['Otorhinolaryngology', 'Otorhinolaringology', 'Otorinolaryngology'], ans: 0 }
];

function startSpellingQuiz() {
  if (state.playsLeft.spell <= 0) return;
  state.playsLeft.spell--;
  refreshDashboard();
  let qIdx = 0, score = 0, qTimer = 10;
  openModal('📖 Extreme Spelling Quiz (Score 7+/10)', '');

  const renderQ = () => {
    if (state.activeTimer) clearInterval(state.activeTimer);
    if (qIdx >= SPELLING_BANK.length) {
      closeModal();
      return score >= 7 ? awardGameWin(true) : showToast(`Scored ${score}/10. Need 7+ to win.`, true);
    }
    qTimer = 10;
    const item = SPELLING_BANK[qIdx];
    const draw = () => {
      document.getElementById('modalBody').innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span>Word <b>${qIdx + 1}/10</b></span>
          <span>Score: <b class="emerald-text">${score}</b></span>
          <span style="color:var(--crimson); font-weight:800;">⏱ ${qTimer}s</span>
        </div>
        ${item.opts.map((w, idx) => `<button class="quiz-opt" onclick="ansSpell(${idx})">${w}</button>`).join('')}`;
    };
    draw();
    state.activeTimer = setInterval(() => {
      if (--qTimer <= 0) { qIdx++; renderQ(); } else draw();
    }, 1000);
  };

  window.ansSpell = (i) => { if (i === SPELLING_BANK[qIdx].ans) score++; qIdx++; renderQ(); };
  renderQ();
}
/* 3. SPEED MATH BLITZ (20 SECONDS) */
function startMathBlitz() {
  if (state.playsLeft.math <= 0) return;
  state.playsLeft.math--;
  refreshDashboard();
  let solved = 0, timeLeft = 20, currentAns = 0;
  openModal('⚡ Extreme Speed Math Blitz (20s)', '');

  const nextEq = () => {
    const a = Math.floor(Math.random() * 15) + 11, b = Math.floor(Math.random() * 8) + 5, c = Math.floor(Math.random() * 35) + 10;
    currentAns = (a * b) - c;
    document.getElementById('modalBody').innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
        <span>Solved: <b>${solved}/10</b></span><span id="mathClock" style="color:var(--crimson); font-weight:800;">⏱ ${timeLeft}s</span>
      </div>
      <div style="font-size:1.7rem; font-weight:800; text-align:center; padding:20px; background:#090e1f; border-radius:12px; color:var(--gold); margin-bottom:14px;">(${a} × ${b}) − ${c} = ?</div>
      <input type="number" id="mathInput" class="input-field" placeholder="Exact answer..." />
      <button class="btn btn-gold" style="width:100%; margin-top:12px;" onclick="submitMath()">Submit</button>`;
    const inp = document.getElementById('mathInput');
    inp.focus();
    inp.onkeydown = (e) => { if (e.key === 'Enter') submitMath(); };
  };

  window.submitMath = () => {
    const val = parseInt(document.getElementById('mathInput').value, 10);
    if (val !== currentAns) { closeModal(); return showToast('Wrong answer! Zero errors allowed.', true); }
    if (++solved >= 10) { closeModal(); return awardGameWin(false); }
    nextEq();
  };

  nextEq();
  state.activeTimer = setInterval(() => {
    timeLeft--;
    const mc = document.getElementById('mathClock');
    if (mc) mc.textContent = `⏱ ${timeLeft}s`;
    if (timeLeft <= 0) { closeModal(); showToast('20 seconds expired!', true); }
  }, 1000);
}

/* 4. 5x5 PATTERN MEMORY MATRIX */
function startMemoryGame() {
  if (state.playsLeft.mem <= 0) return;
  state.playsLeft.mem--;
  refreshDashboard();
  let level = 1, targetNodes = [], userPicks = [], locked = true;
  openModal('🧩 5x5 Pattern Memory', '');

  const startLevel = () => {
    locked = true; userPicks = []; targetNodes = [];
    while (targetNodes.length < 6 + level) {
      const r = Math.floor(Math.random() * 25);
      if (!targetNodes.includes(r)) targetNodes.push(r);
    }
    renderGrid(true);
    setTimeout(() => { locked = false; renderGrid(false); }, 1200);
  };

  const renderGrid = (showLit) => {
    document.getElementById('modalBody').innerHTML = `
      <div style="text-align:center; margin-bottom:8px;">Stage <b>${level}/3</b> • ${showLit ? 'MEMORIZE!' : 'Tap flashed tiles!'}</div>
      <div class="mem-grid">
        ${Array.from({ length: 25 }, (_, i) => `<div class="mem-tile ${showLit && targetNodes.includes(i) ? 'lit' : ''} ${!showLit && userPicks.includes(i) ? 'picked' : ''}" onclick="pickTile(${i})"></div>`).join('')}
      </div>`;
  };

  window.pickTile = (i) => {
    if (locked || userPicks.includes(i)) return;
    if (!targetNodes.includes(i)) { closeModal(); return showToast('Wrong tile! Memory failed.', true); }
    userPicks.push(i);
    renderGrid(false);
    if (userPicks.length === targetNodes.length) {
      if (level >= 3) { closeModal(); awardGameWin(false); }
      else { level++; setTimeout(startLevel, 400); }
    }
  };
  startLevel();
}
/* 5. PATTERN INTELLIGENCE (REPLACED WORD SCRAMBLE) */
const PATTERN_BANK = [
  { seq: "3, 8, 18, 38, 78, ?", opts: ["148", "158", "168"], ans: 1 },
  { seq: "2, 6, 15, 31, 56, ?", opts: ["81", "92", "97"], ans: 1 },
  { seq: "144, 121, 100, 81, 64, ?", opts: ["49", "36", "54"], ans: 0 },
  { seq: "5, 11, 23, 47, 95, ?", opts: ["181", "191", "195"], ans: 1 },
  { seq: "1, 4, 13, 40, 121, ?", opts: ["364", "243", "361"], ans: 0 }
];

function startPatternIntelligence() {
  if (state.playsLeft.pattern <= 0) return;
  state.playsLeft.pattern--;
  refreshDashboard();
  let idx = 0, timeLeft = 30;
  openModal('🧬 Pattern Intelligence (30s)', '');

  const renderPat = () => {
    const item = PATTERN_BANK[idx];
    document.getElementById('modalBody').innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
        <span>Sequence <b>${idx + 1}/5</b></span><span id="patClock" style="color:var(--crimson); font-weight:800;">⏱ ${timeLeft}s</span>
      </div>
      <div style="font-size:1.45rem; font-weight:800; text-align:center; padding:18px; background:#090e1f; border-radius:12px; color:var(--gold); margin-bottom:14px;">${item.seq}</div>
      ${item.opts.map((o, i) => `<button class="quiz-opt" onclick="ansPattern(${i})">${o}</button>`).join('')}`;
  };

  window.ansPattern = (i) => {
    if (i !== PATTERN_BANK[idx].ans) { closeModal(); return showToast('Wrong logic pattern! Failed.', true); }
    if (++idx >= PATTERN_BANK.length) { closeModal(); return awardGameWin(false); }
    renderPat();
  };

  renderPat();
  state.activeTimer = setInterval(() => {
    timeLeft--;
    const pc = document.getElementById('patClock');
    if (pc) pc.textContent = `⏱ ${timeLeft}s`;
    if (timeLeft <= 0) { closeModal(); showToast('30 seconds expired!', true); }
  }, 1000);
}

/* 6. 3:00 AM BRAIN TEST (15 Qs • 7s EACH • 12+ PASS • 0% TAX) */
const BRAIN_QUESTIONS = [
  { q: "What is 17 × 14 − 38?", opts: ["190", "200", "210"], ans: 1 },
  { q: "Atomic symbol 'W' stands for:", opts: ["Tungsten", "Wolframite", "Bismuth"], ans: 0 },
  { q: "5 machines take 5 mins for 5 widgets. Time for 100 machines to make 100 widgets?", opts: ["100 mins", "5 mins", "1 min"], ans: 1 },
  { q: "Next prime number after 89:", opts: ["91", "93", "97"], ans: 2 },
  { q: "Capital city of Kazakhstan:", opts: ["Almaty", "Astana", "Tashkent"], ans: 1 },
  { q: "Solve: 3³ + 4² − 19", opts: ["24", "26", "22"], ans: 0 },
  { q: "Bones in an adult human body:", opts: ["206", "208", "212"], ans: 0 },
  { q: "Which planet rotates clockwise?", opts: ["Mars", "Venus", "Mercury"], ans: 1 },
  { q: "What is 15% of 480?", opts: ["68", "72", "76"], ans: 1 },
  { q: "Decimal 13 in binary:", opts: ["1101", "1011", "1110"], ans: 0 },
  { q: "Longest river in Africa:", opts: ["Congo", "Niger", "Nile"], ans: 2 },
  { q: "Square root of 729:", opts: ["23", "27", "29"], ans: 1 },
  { q: "Gas making up ~78% of Earth's atmosphere:", opts: ["Oxygen", "Nitrogen", "Argon"], ans: 1 },
  { q: "Year Kenya became a Republic:", opts: ["1963", "1964", "1965"], ans: 1 },
  { q: "Solve: (144 ÷ 12) × 9", opts: ["96", "108", "112"], ans: 1 }
];

function startBrainTest() {
  if (state.brainTestPlayedToday) return showToast('Already attempted today’s 3:00 AM Test!', true);
  state.brainTestPlayedToday = true;
  let qIdx = 0, score = 0, qTimer = 7;
  openModal('🧠 3:00 AM Brain Test (7s/Question • 0% Tax)', '');

  const loadBrainQ = () => {
    if (state.activeTimer) clearInterval(state.activeTimer);
    if (qIdx >= BRAIN_QUESTIONS.length) {
      closeModal();
      return score >= 12 ? awardGameWin(false, 40) : showToast(`Scored ${score}/15. Need 12+ to pass.`, true);
    }
    qTimer = 7;
    const item = BRAIN_QUESTIONS[qIdx];
    const renderFrame = () => {
      document.getElementById('modalBody').innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span>Q <b>${qIdx + 1}/15</b></span><span>Score: <b class="emerald-text">${score}</b></span><span style="color:var(--crimson); font-weight:800;">⏱ ${qTimer}s</span>
        </div>
        <h4 style="margin-bottom:14px;">${item.q}</h4>
        ${item.opts.map((o, i) => `<button class="quiz-opt" onclick="ansBrain(${i})">${o}</button>`).join('')}`;
    };
    renderFrame();
    state.activeTimer = setInterval(() => {
      if (--qTimer <= 0) { qIdx++; loadBrainQ(); } else renderFrame();
    }, 1000);
  };

  window.ansBrain = (i) => { if (i === BRAIN_QUESTIONS[qIdx].ans) score++; qIdx++; loadBrainQ(); };
  loadBrainQ();
}
