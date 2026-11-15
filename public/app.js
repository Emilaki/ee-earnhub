const state = {
  user: null, generatedSmsOtp: '', generatedEmailOtp: '',
  balance: 0, pendingBalance: 0, pendingSeconds: 0, tier: 'FREE',
  playsLeft: { ttt: 1, spell: 1, math: 1, mem: 1, word: 1 },
  brainTestPlayedToday: false, activeTimer: null
};

const TIERS = {
  FREE:    { label: 'FREE TIER', dailyLimit: 1, gameWin: 50,  gameTax: 9,  quizWin: 40, quizTax: 9,  expiry: 'Unlimited' },
  PREMIUM: { label: 'PREMIUM (10D)', dailyLimit: 3, gameWin: 80,  gameTax: 15, quizWin: 40, quizTax: 9,  expiry: '10 Days' },
  VIP:     { label: 'V.I.P MODE (10D)', dailyLimit: 5, gameWin: 120, gameTax: 20, quizWin: 90, quizTax: 20, expiry: '10 Days' }
};

const GAMES_LIST = [
  { key: 'ttt',   badge: 'WIN 3 OF 4 ROUNDS', title: '4-Round Tic-Tac-Toe', desc: 'Beat Grandmaster AI in 3 of 4 consecutive rounds.', fn: 'startTTT()' },
  { key: 'spell', badge: 'SCORE 9+ OF 10',    title: '10-Word Spelling Quiz', desc: 'Pick the exact spelling out of 3 tricky options.', fn: 'startSpellingQuiz()' },
  { key: 'math',  badge: '35 SECONDS • 0 ERR',title: 'Speed Math Blitz', desc: 'Solve 10 multi-step equations before time expires.', fn: 'startMathBlitz()' },
  { key: 'mem',   badge: '1.2s FLASH • 5x5',  title: 'Pattern Memory Matrix', desc: 'Recall up to 9 flashing tiles across 3 stages.', fn: 'startMemoryGame()' },
  { key: 'word',  badge: '40 SECONDS',        title: 'Cryptic Word Scramble', desc: 'Unscramble 6 complex 8-to-10 letter words.', fn: 'startWordScramble()' }
];

const registeredAccounts = JSON.parse(localStorage.getItem('ee_earnhub_registry') || '[]');

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.style.borderLeftColor = isError ? 'var(--crimson)' : 'var(--emerald)';
  t.innerHTML = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3600);
}

function sendDualOTP() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const phone = document.getElementById('regPhone').value.trim();
  if (!name || !email.includes('@') || phone.length < 9) return showToast('Enter valid Name, Email & Phone.', true);

  const dup = registeredAccounts.find(a => a.email === email || a.phone === phone);
  if (dup && dup.name.toLowerCase() !== name.toLowerCase()) return showToast('Email or Phone already bound to another account.', true);

  state.generatedSmsOtp = Math.floor(100000 + Math.random() * 900000).toString();
  state.generatedEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
  document.getElementById('hintSms').textContent = state.generatedSmsOtp;
  document.getElementById('hintEmail').textContent = state.generatedEmailOtp;
  document.getElementById('stepCredentials').style.display = 'none';
  document.getElementById('stepOTP').style.display = 'block';
}

function verifyDualOTP() {
  if (document.getElementById('inputSmsOtp').value.trim() !== state.generatedSmsOtp ||
      document.getElementById('inputEmailOtp').value.trim() !== state.generatedEmailOtp) {
    return showToast('Invalid SMS or Email OTP.', true);
  }
  state.user = {
    name: document.getElementById('regName').value.trim(),
    email: document.getElementById('regEmail').value.trim().toLowerCase(),
    phone: document.getElementById('regPhone').value.trim()
  };
  if (!registeredAccounts.some(a => a.email === state.user.email)) {
    registeredAccounts.push(state.user);
    localStorage.setItem('ee_earnhub_registry', JSON.stringify(registeredAccounts));
  }
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
  document.getElementById('welcomeUser').textContent = `${state.user.name} • ${state.user.phone} • ${state.user.email}`;
  refreshDashboard();
}

function refreshDashboard() {
  const cfg = TIERS[state.tier];
  document.getElementById('userTierBadge').textContent = cfg.label;
  document.getElementById('balAvailable').textContent = state.balance;
  document.getElementById('balPending').textContent = state.pendingBalance;
  document.getElementById('displayTax').textContent = cfg.gameTax;
  document.getElementById('dailyLimitText').textContent = `${cfg.dailyLimit} Play${cfg.dailyLimit > 1 ? 's' : ''}/Day`;
  document.getElementById('gameWinText').textContent = cfg.gameWin;
  document.getElementById('quizWinText').textContent = cfg.quizWin;
  document.getElementById('tierExpiryText').textContent = cfg.expiry;

  document.getElementById('arenaContainer').innerHTML = GAMES_LIST.map(g => {
    const left = state.playsLeft[g.key];
    return `
      <div class="glass-card game-card">
        <div>
          <span class="hard-badge">EXTREME • ${g.badge}</span>
          <h3>${g.title}</h3>
          <p class="muted-small" style="margin:8px 0 14px;">${g.desc}</p>
        </div>
        <div>
          <div class="plays-left">Plays Left Today: <b>${left}</b></div>
          <button class="btn btn-gold" style="width:100%;" ${left <= 0 ? 'disabled' : ''} onclick="${g.fn}">Play Now</button>
        </div>
      </div>`;
  }).join('');
}

function openModal(title, html) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('appModal').classList.add('active');
}

function closeModal() {
  if (state.activeTimer) clearInterval(state.activeTimer);
  document.getElementById('appModal').classList.remove('active');
}

function openTierModal() {
  openModal('👑 Upgrade Membership', `
    <div class="glass-card" style="margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div><h4>Premium (10 Days)</h4><p class="muted-small">3 plays/day • KSh 80/win (Tax KSh 15)</p></div>
        <button class="btn btn-gold" onclick="activateTier('PREMIUM')">KSh 450</button>
      </div>
    </div>
    <div class="glass-card gold-border">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div><h4 class="gold-text">💎 V.I.P Mode (10 Days)</h4><p class="muted-small">5 plays/day • KSh 120/game & KSh 90/quiz (Tax KSh 20)</p></div>
        <button class="btn btn-emerald" onclick="activateTier('VIP')">KSh 1,000</button>
      </div>
    </div>`);
}

function activateTier(t) {
  state.tier = t;
  const lim = TIERS[t].dailyLimit;
  state.playsLeft = { ttt: lim, spell: lim, math: lim, mem: lim, word: lim };
  closeModal(); refreshDashboard();
  showToast(`Activated ${TIERS[t].label}!`);
}

function openWithdrawModal() {
  const tax = TIERS[state.tier].gameTax;
  openModal('💸 M-Pesa Withdrawal', `
    <div class="input-group"><label>Amount (Min KSh 50)</label>
      <input type="number" id="wAmt" class="input-field" min="50" value="50" oninput="document.getElementById('wNet').textContent=Math.max(0,this.value-${tax})" />
    </div>
    <div class="withdraw-summary">Tax: <b style="color:var(--crimson);">-KSh ${tax}</b> • You Receive: <b class="emerald-text">KSh <span id="wNet">${50 - tax}</span></b></div>
    <button class="btn btn-emerald" style="width:100%;" onclick="processWithdrawal()">Confirm (12-Hr Processing)</button>`);
}

function processWithdrawal() {
  const amt = parseInt(document.getElementById('wAmt').value || 0, 10);
  const tax = TIERS[state.tier].gameTax;
  if (amt < 50) return showToast('Minimum withdrawal is KSh 50.', true);
  if (amt > state.balance) return showToast('Insufficient balance.', true);
  state.balance -= amt;
  state.pendingBalance += (amt - tax);
  state.pendingSeconds = 12 * 3600;
  closeModal(); refreshDashboard();
  if (window.payoutInt) clearInterval(window.payoutInt);
  window.payoutInt = setInterval(() => {
    if (--state.pendingSeconds <= 0) { clearInterval(window.payoutInt); state.pendingBalance = 0; refreshDashboard(); return; }
    const h = String(Math.floor(state.pendingSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((state.pendingSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(state.pendingSeconds % 60).padStart(2, '0');
    document.getElementById('pendingTimerText').innerHTML = `Arriving in <b class="gold-text">${h}:${m}:${s}</b>`;
  }, 1000);
  showToast(`KSh ${amt - tax} queued! Arrives in 12 hours.`);
}

function awardGameWin(isQuiz = false, taxFree = 0) {
  const win = taxFree > 0 ? taxFree : (isQuiz ? TIERS[state.tier].quizWin : TIERS[state.tier].gameWin);
  state.balance += win;
  refreshDashboard();
  showToast(`🎉 VICTORY! +KSh ${win} added to your wallet!`);
}
