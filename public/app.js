const state = {
  user: null, generatedSmsOtp: '', generatedEmailOtp: '', resetOtp: '', resetTargetPhone: '',
  balance: 0, pendingBalance: 0, pendingSeconds: 0, tier: 'FREE', tierExpiresAt: null,
  playsLeft: { ttt: 1, spell: 1, math: 1, mem: 1, pattern: 1 },
  brainTestPlayedToday: false, activeTimer: null
};

const TIERS = {
  FREE:    { label: 'REGULAR (FREE)', dailyLimit: 1, gameWin: 50,  gameTax: 9,  quizWin: 40, quizTax: 9,  days: 0 },
  PREMIUM: { label: 'PREMIUM (10D)',  dailyLimit: 3, gameWin: 80,  gameTax: 15, quizWin: 40, quizTax: 9,  days: 10 },
  VIP:     { label: 'V.I.P MODE (10D)',dailyLimit: 5, gameWin: 120, gameTax: 20, quizWin: 90, quizTax: 20, days: 10 }
};

const GAMES_LIST = [
  { key: 'ttt',     badge: 'WIN 3 OF 4 ROUNDS',  title: '4-Round Tic-Tac-Toe',  desc: 'Beat Grandmaster AI in at least 3 of 4 consecutive rounds.', fn: 'startTTT()' },
  { key: 'spell',   badge: '10s/WORD • SCORE 7+',title: '10-Word Spelling Quiz',desc: '10 seconds per word. Score 7 or more out of 10 to win.', fn: 'startSpellingQuiz()' },
  { key: 'math',    badge: '20 SECONDS • 0 ERR', title: 'Speed Math Blitz',     desc: 'Solve 10 multi-step arithmetic problems in 20 seconds.', fn: 'startMathBlitz()' },
  { key: 'mem',     badge: '1.2s FLASH • 5x5',   title: 'Pattern Memory Matrix',desc: 'Recall up to 9 flashing tiles across 3 escalating stages.', fn: 'startMemoryGame()' },
  { key: 'pattern', badge: '30 SECONDS • LOGIC', title: 'Pattern Intelligence', desc: 'Crack 5 extreme number & logic sequences before time expires.', fn: 'startPatternIntelligence()' }
];

function getAccounts() { return JSON.parse(localStorage.getItem('ee_earnhub_users') || '[]'); }
function saveAccounts(list) { localStorage.setItem('ee_earnhub_users', JSON.stringify(list)); }

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.style.borderLeftColor = isError ? 'var(--crimson)' : 'var(--emerald)';
  t.innerHTML = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3600);
}

function startBrainCountdownClock() {
  if (window.brainClockInt) clearInterval(window.brainClockInt);
  const updateClock = () => {
    const now = new Date();
    const eatNow = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
    const next3AM = new Date(eatNow);
    next3AM.setHours(3, 0, 0, 0);
    if (eatNow >= next3AM) next3AM.setDate(next3AM.getDate() + 1);
    const diff = Math.floor((next3AM - eatNow) / 1000);
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    const el = document.getElementById('brainCountdownText');
    if (el) el.textContent = `${h}h : ${m}m : ${s}s`;
  };
  updateClock();
  window.brainClockInt = setInterval(updateClock, 1000);
}
function switchAuthTab(mode) {
  document.getElementById('authTabs').style.display = 'flex';
  document.getElementById('viewSignIn').style.display = mode === 'signin' ? 'block' : 'none';
  document.getElementById('viewSignUp').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('viewSignupOTP').style.display = 'none';
  document.getElementById('viewForgot').style.display = 'none';
  document.getElementById('tabSignIn').className = mode === 'signin' ? 'btn btn-gold' : 'btn btn-outline';
  document.getElementById('tabSignUp').className = mode === 'signup' ? 'btn btn-gold' : 'btn btn-outline';
}

function showForgotView() {
  document.getElementById('authTabs').style.display = 'none';
  document.getElementById('viewSignIn').style.display = 'none';
  document.getElementById('viewSignUp').style.display = 'none';
  document.getElementById('viewForgot').style.display = 'block';
  document.getElementById('forgotStep1').style.display = 'block';
  document.getElementById('forgotStep2').style.display = 'none';
}

function sendDualOTP() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const phone = document.getElementById('regPhone').value.trim();
  const pass = document.getElementById('regPassword').value;
  if (!name || !email.includes('@') || phone.length < 9 || pass.length < 6) return showToast('Fill all fields (Password min 6 chars).', true);
  if (getAccounts().some(a => a.email === email || a.phone === phone)) return showToast('Account already exists. Please Sign In.', true);

  state.generatedSmsOtp = Math.floor(100000 + Math.random() * 900000).toString();
  state.generatedEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
  document.getElementById('hintSms').textContent = state.generatedSmsOtp;
  document.getElementById('hintEmail').textContent = state.generatedEmailOtp;
  document.getElementById('authTabs').style.display = 'none';
  document.getElementById('viewSignUp').style.display = 'none';
  document.getElementById('viewSignupOTP').style.display = 'block';
}

function verifyDualOTP() {
  if (document.getElementById('inputSmsOtp').value.trim() !== state.generatedSmsOtp ||
      document.getElementById('inputEmailOtp').value.trim() !== state.generatedEmailOtp) return showToast('Invalid OTP codes.', true);
  const newUser = {
    name: document.getElementById('regName').value.trim(),
    email: document.getElementById('regEmail').value.trim().toLowerCase(),
    phone: document.getElementById('regPhone').value.trim(),
    password: document.getElementById('regPassword').value
  };
  const accounts = getAccounts(); accounts.push(newUser); saveAccounts(accounts);
  enterDashboard(newUser);
}

function handleSignIn() {
  const id = document.getElementById('loginIdentifier').value.trim().toLowerCase();
  const pass = document.getElementById('loginPassword').value;
  const user = getAccounts().find(a => (a.email === id || a.phone === id) && a.password === pass);
  if (!user) return showToast('Invalid Email/Phone or Password.', true);
  enterDashboard(user);
}

function sendResetSMS() {
  const phone = document.getElementById('resetPhone').value.trim();
  if (!getAccounts().find(a => a.phone === phone)) return showToast('No account found with that mobile number.', true);
  state.resetTargetPhone = phone;
  state.resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
  document.getElementById('hintResetSms').textContent = state.resetOtp;
  document.getElementById('forgotStep1').style.display = 'none';
  document.getElementById('forgotStep2').style.display = 'block';
}

function confirmPasswordReset() {
  const code = document.getElementById('inputResetOtp').value.trim();
  const newPass = document.getElementById('newResetPassword').value;
  if (code !== state.resetOtp) return showToast('Invalid SMS reset code.', true);
  if (newPass.length < 6) return showToast('Password must be at least 6 characters.', true);
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.phone === state.resetTargetPhone);
  if (idx !== -1) { accounts[idx].password = newPass; saveAccounts(accounts); }
  showToast('Password updated! Please Sign In.');
  switchAuthTab('signin');
}
function enterDashboard(user) {
  state.user = user;
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
  document.getElementById('welcomeUser').textContent = `${user.name} • ${user.phone} • ${user.email}`;
  startBrainCountdownClock();
  refreshDashboard();
}

function logoutUser() {
  state.user = null;
  document.getElementById('dashboardSection').style.display = 'none';
  document.getElementById('authSection').style.display = 'block';
  switchAuthTab('signin');
}

function refreshDashboard() {
  if (state.tier !== 'FREE' && state.tierExpiresAt && Date.now() > state.tierExpiresAt) {
    state.tier = 'FREE'; state.tierExpiresAt = null;
    state.playsLeft = { ttt: 1, spell: 1, math: 1, mem: 1, pattern: 1 };
  }
  const cfg = TIERS[state.tier];
  document.getElementById('userTierBadge').textContent = cfg.label;
  document.getElementById('balAvailable').textContent = state.balance;
  document.getElementById('balPending').textContent = state.pendingBalance;
  document.getElementById('displayTax').textContent = cfg.gameTax;
  document.getElementById('dailyLimitText').textContent = `${cfg.dailyLimit} Game${cfg.dailyLimit > 1 ? 's' : ''} per Day`;
  document.getElementById('gameWinText').textContent = cfg.gameWin;
  document.getElementById('quizWinText').textContent = cfg.quizWin;
  document.getElementById('tierExpiryText').textContent = cfg.days > 0 ? `${cfg.days} Days` : 'Unlimited';

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
          <div class="plays-left">Games Left Today: <b>${left} / ${cfg.dailyLimit}</b></div>
          <button class="btn btn-gold" style="width:100%;" ${left <= 0 ? 'disabled' : ''} onclick="${g.fn}">Play Game</button>
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

function openExclusiveOfferModal() {
  openModal('👑 Exclusive Offers & Game Modes', `
    <div class="glass-card" style="margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div><h4>Regular Games (Free)</h4><p class="muted-small">1 game per day • Win KSh 50 (Tax KSh 9)</p></div>
        <button class="btn btn-outline" ${state.tier === 'FREE' ? 'disabled' : ''} onclick="activateTier('FREE')">
          ${state.tier === 'FREE' ? 'Active' : 'Switch Free'}
        </button>
      </div>
    </div>
    <div class="glass-card" style="margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div><h4>Premium Offer (10 Days)</h4><p class="muted-small">3 games per day • Win KSh 80 (Tax KSh 15)</p></div>
        <button class="btn btn-gold" onclick="activateTier('PREMIUM')">KSh 450</button>
      </div>
    </div>
    <div class="glass-card gold-border">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div><h4 class="gold-text">💎 V.I.P Exclusive (10 Days)</h4><p class="muted-small">5 games per day • Win KSh 120/game & KSh 90/quiz (Tax KSh 20)</p></div>
        <button class="btn btn-emerald" onclick="activateTier('VIP')">KSh 1,000</button>
      </div>
    </div>`);
}

function activateTier(t) {
  state.tier = t;
  const lim = TIERS[t].dailyLimit;
  state.tierExpiresAt = TIERS[t].days > 0 ? Date.now() + (TIERS[t].days * 86400000) : null;
  state.playsLeft = { ttt: lim, spell: lim, math: lim, mem: lim, pattern: lim };
  closeModal(); refreshDashboard();
  showToast(`Activated ${TIERS[t].label}!`);
}

function openContactModal() {
  openModal('💬 Contact Us / Ask a Problem', `
    <p class="muted-small" style="margin-bottom:12px;">Having an issue with withdrawals, games, or your account? Send a message directly to EE EarnHub Support.</p>
    <div class="input-group"><label>Issue Category</label>
      <select id="supportTopic" class="input-field">
        <option>Withdrawal / M-Pesa Payout</option>
        <option>Exclusive Offer / V.I.P Upgrade</option>
        <option>Game or Quiz Technical Problem</option>
        <option>General Question</option>
      </select>
    </div>
    <div class="input-group"><label>Describe Your Question or Problem</label>
      <textarea id="supportMsg" class="input-field" rows="4" placeholder="Type your message here..."></textarea>
    </div>
    <button class="btn btn-emerald" style="width:100%;" onclick="submitSupportTicket()">Send to Support Team</button>`);
}

function submitSupportTicket() {
  const msg = document.getElementById('supportMsg').value.trim();
  if (msg.length < 5) return showToast('Please describe your question or problem first.', true);
  closeModal();
  showToast('✅ Ticket received! EE EarnHub Support will reply to your email & SMS shortly.');
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
