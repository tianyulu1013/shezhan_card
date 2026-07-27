/* ==========================================================================
   《舌战》桌游电子版 核心游戏引擎与 AI 逻辑 (App.js)
   100% 严格对照《规则.pdf》下三角矩阵图片逐格订正
   (打出破口大骂碰沉默是金：破口大骂 0 伤，沉默是金 -5 HP)
   ========================================================================== */

// SVG Art Icons for 6 Cards
const SVG_ICONS = {
  0: `<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  1: `<svg viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>`,
  2: `<svg viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`,
  3: `<svg viewBox="0 0 24 24" fill="none" stroke="#7e22ce" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  4: `<svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>`,
  5: `<svg viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"></path></svg>`
};

const SEALS = { 0: '破', 1: '反', 2: '怒', 3: '静', 4: '水', 5: '虑' };

const CARD_DESCS = {
  0: '⚡ 击穿《破口大骂》（对方-15 HP）；克制《心如止水》《深思熟虑》（对方-10 HP）。被《反唇相讥》反弹（己方-10 HP）。',
  1: '🌿 反弹《一语道破》（对方-10 HP）；对《破口大骂》造成己方0伤对方-5且停动；打断《深思熟虑》（阻断对方回收手牌）。',
  2: '🔥 被《一语道破》刺穿（己方-15 HP）；被《反唇相讥》反弹（己方-5 HP且【停动】）；打《沉默是金》（己方0伤，对方-5 HP）；打《深思熟虑》（己方0伤，对方-5 HP且【停动】，但对方依然能回收）；碰《心如止水》（对方+15 HP）。',
  3: '🌈 最稳试探牌。仅被《破口大骂》造成（己方-5 HP，无停动），面对其他所有牌均为 0 伤害。',
  4: '💧 吸收《破口大骂》（己方+15 HP）；碰《一语道破》（己方-10 HP）；碰其他所有牌均（己方+10 HP）。',
  5: '⛰️ 回收除自身外的所有弃牌。碰《破口大骂》（己方-5 HP且【停动】，但依然成功回收手牌）；遭遇《反唇相讥》回收被打断！'
};

const CARDS = [
  { id: 0, name: '一语道破', color: '#d97706' },
  { id: 1, name: '反唇相讥', color: '#15803d' },
  { id: 2, name: '破口大骂', color: '#b91c1c' },
  { id: 3, name: '沉默是金', color: '#7e22ce' },
  { id: 4, name: '心如止水', color: '#1d4ed8' },
  { id: 5, name: '深思熟虑', color: '#c2410c' }
];

// 100% PERFECT MATRIX DIRECTLY FROM PDF screenshot:
// Rows = Player A, Cols = Player B
// Values: A = Player A HP change, B = Player B HP change, sA/sB = Stun, pA/pB = Card Pickup
const MATRIX = [
  // 0: 一语道破 (Y) vs [Y, F, P, C, X, S]
  [
    {A: -10, B: -10, sA: false, sB: false, pA: false, pB: false}, // Y vs Y (-10/-10)
    {A: -10, B:   0, sA: false, sB: false, pA: false, pB: false}, // Y vs F (-10/-)
    {A:   0, B: -15, sA: false, sB: false, pA: false, pB: false}, // Y vs P (-/-15)
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false}, // Y vs C (-/-)
    {A:   0, B: -10, sA: false, sB: false, pA: false, pB: false}, // Y vs X (-/-10)
    {A:   0, B: -10, sA: false, sB: false, pA: false, pB: true }  // Y vs S (-/-10,捡牌)
  ],

  // 1: 反唇相讥 (F) vs [Y, F, P, C, X, S]
  [
    {A:   0, B: -10, sA: false, sB: false, pA: false, pB: false}, // F vs Y (-/-10)
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false}, // F vs F (-/-)
    {A:   0, B:  -5, sA: false, sB: true,  pA: false, pB: false}, // F vs P (-/-5,停动 -> F gets 0, P gets -5 & Stun!)
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false}, // F vs C (-/-)
    {A:   0, B: +10, sA: false, sB: false, pA: false, pB: false}, // F vs X (-/+10)
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false}  // F vs S (-/- -> S NO PICKUP)
  ],

  // 2: 破口大骂 (P) vs [Y, F, P, C, X, S]
  [
    {A: -15, B:   0, sA: false, sB: false, pA: false, pB: false}, // P vs Y (-15/-)
    {A:  -5, B:   0, sA: true,  sB: false, pA: false, pB: false}, // P vs F (-5,停动/- -> P gets -5 & Stun, F gets 0!)
    {A:  -5, B:  -5, sA: true,  sB: true,  pA: false, pB: false}, // P vs P (-5,停动/-5,停动)
    {A:   0, B:  -5, sA: false, sB: false, pA: false, pB: false}, // P vs C (0/-5 -> P gets 0, C gets -5!)
    {A:   0, B: +15, sA: false, sB: false, pA: false, pB: false}, // P vs X (-/+15)
    {A:   0, B:  -5, sA: false, sB: true,  pA: false, pB: true }  // P vs S (-/-5,停动,捡牌 -> P gets 0, S gets -5, Stun, Pickup!)
  ],

  // 3: 沉默是金 (C) vs [Y, F, P, C, X, S]
  [
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false}, // C vs Y (-/-)
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false}, // C vs F (-/-)
    {A:  -5, B:   0, sA: false, sB: false, pA: false, pB: false}, // C vs P (-5/- -> C gets -5, P gets 0!)
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false}, // C vs C (-/-)
    {A:   0, B: +10, sA: false, sB: false, pA: false, pB: false}, // C vs X (-/+10)
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: true }  // C vs S (-/捡牌)
  ],

  // 4: 心如止水 (X) vs [Y, F, P, C, X, S]
  [
    {A: -10, B:   0, sA: false, sB: false, pA: false, pB: false}, // X vs Y (-10/-)
    {A: +10, B:   0, sA: false, sB: false, pA: false, pB: false}, // X vs F (+10/-)
    {A: +15, B:   0, sA: false, sB: false, pA: false, pB: false}, // X vs P (+15/-)
    {A: +10, B:   0, sA: false, sB: false, pA: false, pB: false}, // X vs C (+10/-)
    {A: +10, B: +10, sA: false, sB: false, pA: false, pB: false}, // X vs X (+10/+10)
    {A: +10, B:   0, sA: false, sB: false, pA: false, pB: true }  // X vs S (+10/捡牌)
  ],

  // 5: 深思熟虑 (S) vs [Y, F, P, C, X, S]
  [
    {A: -10, B:   0, sA: false, sB: false, pA: true,  pB: false}, // S vs Y (-10,捡牌/-)
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false}, // S vs F (-/- -> NO PICKUP)
    {A:  -5, B:   0, sA: true,  sB: false, pA: true,  pB: false}, // S vs P (-5,停动,捡牌/- -> S gets -5, Stun, Pickup; P gets 0)
    {A:   0, B:   0, sA: false, sB: false, pA: true,  pB: false}, // S vs C (捡牌/-)
    {A:   0, B: +10, sA: false, sB: false, pA: true,  pB: false}, // S vs X (捡牌/+10)
    {A:   0, B:   0, sA: false, sB: false, pA: true,  pB: true }  // S vs S (捡牌/捡牌)
  ]
];

// Game Engine Class
class ShezhanGame {
  constructor() {
    this.mode = 'competitive';
    this.difficulty = 'master';
    this.turn = 1;
    this.maxHp = 30;
    
    this.userHp = 30;
    this.aiHp = 30;
    
    this.userStunned = false;
    this.aiStunned = false;
    
    this.userHand = [3, 3, 3, 3, 1, 1];
    this.aiHand = [3, 3, 3, 3, 1, 1];
    
    this.userDiscard = [0, 0, 0, 0, 0, 0];
    this.aiDiscard = [0, 0, 0, 0, 0, 0];
    
    this.isProcessing = false;
    this.gameOver = false;
  }

  init(mode, difficulty) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.turn = 1;
    this.maxHp = (mode === 'competitive') ? 30 : 40;
    this.userHp = this.maxHp;
    this.aiHp = this.maxHp;
    
    let xCount = (mode === 'competitive') ? 1 : 2;
    this.userHand = [3, 3, 3, 3, xCount, 1];
    this.aiHand = [3, 3, 3, 3, xCount, 1];
    
    this.userDiscard = [0, 0, 0, 0, 0, 0];
    this.aiDiscard = [0, 0, 0, 0, 0, 0];
    
    this.userStunned = false;
    this.aiStunned = false;
    this.isProcessing = false;
    this.gameOver = false;
  }

  getHandCount(hand) {
    return hand.reduce((a, b) => a + b, 0);
  }

  checkAutoPickup() {
    if (this.getHandCount(this.userHand) === 0) {
      for (let i = 0; i < 6; i++) {
        this.userHand[i] += this.userDiscard[i];
        this.userDiscard[i] = 0;
      }
      return true;
    }
    return false;
  }

  checkAiAutoPickup() {
    if (this.getHandCount(this.aiHand) === 0) {
      for (let i = 0; i < 6; i++) {
        this.aiHand[i] += this.aiDiscard[i];
        this.aiDiscard[i] = 0;
      }
      return true;
    }
    return false;
  }

  getAiChoice() {
    let validCards = [];
    for (let i = 0; i < 6; i++) {
      if (this.aiHand[i] > 0) validCards.push(i);
    }
    if (validCards.length === 0) return -1;
    
    if (this.difficulty === 'easy') {
      return validCards[Math.floor(Math.random() * validCards.length)];
    }

    if (this.turn <= 2) {
      let openChoices = [];
      if (this.aiHand[0] > 0) openChoices.push(0);
      if (this.aiHand[1] > 0) openChoices.push(1);
      if (this.aiHand[3] > 0) openChoices.push(3);
      if (this.aiHand[2] > 0) openChoices.push(2);
      
      if (openChoices.length > 0 && Math.random() < 0.85) {
        return openChoices[Math.floor(Math.random() * openChoices.length)];
      }
    }

    let userHasY = (this.userHand[0] > 0);
    let userHasP = (this.userHand[2] > 0);
    let userHasX = (this.userHand[4] > 0);
    let userCardTotal = this.getHandCount(this.userHand);
    
    let weights = validCards.map(c => {
      let w = 1.0;
      if (c === 4) { if (!userHasY) w += 8.0; else if (userHasP) w += 3.0; else w += 1.2; }
      if (c === 0) { if (userHasX) w += 3.0; if (userHasP) w += 2.5; }
      if (c === 1) { if (userHasY) w += 3.5; else w = 0.5; }
      if (c === 2) { if (!userHasY) w += 5.0; else w = 0.5; }
      if (c === 3) { if (userHasY || userHasP) w += 2.5; else w = 1.2; }
      if (c === 5) {
        let aiCardTotal = this.getHandCount(this.aiHand);
        if (this.userStunned) w += 10.0;
        else if (aiCardTotal <= 3) w += 6.0;
        else w = 0.1;
      }
      return w;
    });

    if (this.difficulty === 'master' && userCardTotal <= 2 && userCardTotal > 0) {
      let knownPlayerCards = [];
      for(let i=0; i<6; i++) {
        if (this.userHand[i] > 0) knownPlayerCards.push(i);
      }
      validCards.forEach((c, idx) => {
        let avgEv = 0;
        knownPlayerCards.forEach(pc => {
          avgEv += MATRIX[pc][c].B - MATRIX[pc][c].A;
        });
        if (avgEv > 0) weights[idx] += 10.0;
      });
    }

    let totalW = weights.reduce((a, b) => a + b, 0);
    let rnd = Math.random() * totalW;
    let cum = 0;
    for (let i = 0; i < validCards.length; i++) {
      cum += weights[i];
      if (rnd <= cum) return validCards[i];
    }
    return validCards[validCards.length - 1];
  }
}

// UI Controller
document.addEventListener('DOMContentLoaded', () => {
  const game = new ShezhanGame();

  // Cover Screen & Setup Elements
  const coverScreen = document.getElementById('cover-screen');
  const btnEnterGame = document.getElementById('btn-enter-game');
  const btnCoverRules = document.getElementById('btn-cover-rules');

  const trackerModal = document.getElementById('tracker-modal');
  const rulesModal = document.getElementById('rules-modal');
  const gameoverModal = document.getElementById('gameover-modal');

  const btnTracker = document.getElementById('btn-tracker');
  const btnRules = document.getElementById('btn-rules');
  const btnRestart = document.getElementById('btn-restart');
  const btnPlayAgain = document.getElementById('btn-play-again');

  const userHpBar = document.getElementById('user-hp-bar');
  const userHpText = document.getElementById('user-hp-text');
  const userHandCount = document.getElementById('user-hand-count');
  const userStunBadge = document.getElementById('user-stun-badge');

  const aiHpBar = document.getElementById('ai-hp-bar');
  const aiHpText = document.getElementById('ai-hp-text');
  const aiHandCount = document.getElementById('ai-hand-count');
  const aiStunBadge = document.getElementById('ai-stun-badge');
  const aiDiffTag = document.getElementById('ai-diff-tag');
  const aiHandBacks = document.getElementById('ai-hand-backs');

  const turnCounter = document.getElementById('turn-counter');
  const stunNoticeBanner = document.getElementById('stun-notice-banner');
  const stunNoticeText = document.getElementById('stun-notice-text');
  const playerCardSlot = document.getElementById('player-card-slot');
  const aiCardSlot = document.getElementById('ai-card-slot');
  const clashRay = document.getElementById('clash-ray');
  const outcomeBanner = document.getElementById('outcome-banner');
  const outcomeText = document.getElementById('outcome-text');
  const battleLog = document.getElementById('battle-log');
  const handCardsContainer = document.getElementById('hand-cards-container');

  // Hover Tooltip Elements
  const hoverTooltip = document.getElementById('card-hover-tooltip');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipBody = document.getElementById('tooltip-body');

  let selectedMode = 'competitive';
  let selectedDiff = 'master';

  // Mode & Difficulty Setup in Cover Screen
  document.querySelectorAll('.mode-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-select-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.dataset.mode;
    });
  });

  document.querySelectorAll('.diff-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-select-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDiff = btn.dataset.diff;
    });
  });

  btnEnterGame.addEventListener('click', () => {
    game.init(selectedMode, selectedDiff);
    coverScreen.classList.remove('active');
    resetArenaSlots();
    updateUI();
    addLog(`对局开始！模式：${selectedMode === 'competitive' ? '⚡竞技刺客 (30HP)' : '🛡️新手缓冲 (40HP)'} | AI难度：${selectedDiff.toUpperCase()}`, 'system');
  });

  btnCoverRules.addEventListener('click', () => {
    rulesModal.classList.add('active');
  });

  btnRestart.addEventListener('click', () => {
    coverScreen.classList.add('active');
  });

  btnPlayAgain.addEventListener('click', () => {
    gameoverModal.classList.remove('active');
    coverScreen.classList.add('active');
  });

  btnTracker.addEventListener('click', () => {
    renderTracker();
    trackerModal.classList.add('active');
  });

  btnRules.addEventListener('click', () => {
    rulesModal.classList.add('active');
  });

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close).classList.remove('active');
    });
  });

  function resetArenaSlots() {
    playerCardSlot.innerHTML = `<div class="slot-placeholder">等待选牌...</div>`;
    aiCardSlot.innerHTML = `<div class="slot-placeholder">等待出牌...</div>`;
    outcomeBanner.classList.add('hidden');
    stunNoticeBanner.classList.add('hidden');
    clashRay.classList.add('hidden');
  }

  // Render Card 3D Element with Royal Card Back
  function createCard3DHtml(cardId, isFaceDown = true) {
    if (cardId === -1) {
      return `<div class="stun-slot-badge">😵 停动跳过<br><small style="font-size:0.75rem;">(SKIPPED)</small></div>`;
    }
    const card = CARDS[cardId];
    return `
      <div class="card-container-3d ${isFaceDown ? '' : 'flipped'}" data-card="${cardId}">
        <div class="card-3d-inner">
          <!-- ROYAL CRIMSON GOLD CARD BACK -->
          <div class="card-face card-face-back">
            <div class="card-back-pattern">
              <div class="card-back-seal">舌</div>
              <span class="card-back-text">舌战</span>
            </div>
          </div>
          <!-- FACE UP FRONT (VECTOR ART) -->
          <div class="card-face card-face-front">
            <div class="card-header-bar">
              <span class="card-type-icon">${card.name.substring(0, 1)}</span>
              <span class="card-seal-stamp">${SEALS[cardId]}</span>
            </div>
            <div class="card-main-art">
              <div class="art-svg-medallion">
                ${SVG_ICONS[cardId]}
              </div>
            </div>
            <div class="card-title-vertical">${card.name}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Render Hand Dock
  function renderHandDock() {
    handCardsContainer.innerHTML = '';
    
    if (game.checkAutoPickup()) {
      addLog('👤 你的手牌已用光，触发【全量自动回收】！全部手牌已重置回到手中。', 'heal');
    }

    if (game.userStunned) {
      handCardsContainer.innerHTML = `<div class="placeholder-text" style="color: #b91c1c; font-size: 1rem; font-weight:bold;">😵 你处于【停动】状态，本回合无法出牌！点击“跳过回合”继续。</div>
      <button id="btn-skip-turn" class="btn btn-primary" style="margin-top:8px;">跳过本回合</button>`;
      document.getElementById('btn-skip-turn')?.addEventListener('click', () => handleTurn(-1));
      return;
    }

    CARDS.forEach((card) => {
      const qty = game.userHand[card.id];
      const cardWrapper = document.createElement('div');
      cardWrapper.className = `dock-card-wrapper ${qty === 0 ? 'disabled' : ''}`;
      
      cardWrapper.innerHTML = `
        ${createCard3DHtml(card.id, false)}
        ${qty > 0 ? `<span class="card-qty-tag">${qty}</span>` : ''}
      `;

      cardWrapper.addEventListener('mouseenter', (e) => showCardTooltip(card.id, e));
      cardWrapper.addEventListener('mousemove', (e) => positionCardTooltip(e));
      cardWrapper.addEventListener('mouseleave', () => hideCardTooltip());

      if (qty > 0 && !game.isProcessing) {
        cardWrapper.addEventListener('click', () => {
          hideCardTooltip();
          handleTurn(card.id);
        });
      }

      handCardsContainer.appendChild(cardWrapper);
    });
  }

  function showCardTooltip(cardId, e) {
    tooltipTitle.textContent = CARDS[cardId].name;
    tooltipBody.textContent = CARD_DESCS[cardId];
    hoverTooltip.classList.remove('hidden');
    positionCardTooltip(e);
  }

  function positionCardTooltip(e) {
    let left = e.clientX + 15;
    let top = e.clientY - 80;
    if (left + 290 > window.innerWidth) left = e.clientX - 290;
    if (top < 10) top = e.clientY + 15;
    hoverTooltip.style.left = left + 'px';
    hoverTooltip.style.top = top + 'px';
  }

  function hideCardTooltip() {
    hoverTooltip.classList.add('hidden');
  }

  function renderAiHandBacks() {
    aiHandBacks.innerHTML = '';
    let count = game.getHandCount(game.aiHand);
    for (let i = 0; i < Math.min(15, count); i++) {
      const miniBack = document.createElement('div');
      miniBack.className = 'card-back-mini';
      miniBack.textContent = '舌';
      aiHandBacks.appendChild(miniBack);
    }
  }

  function handleTurn(userCardId) {
    if (game.isProcessing || game.gameOver) return;
    game.isProcessing = true;

    if (game.checkAiAutoPickup()) {
      addLog('🤖 AI 对手手牌用光，触发【全量自动回收】！', 'system');
    }

    let aiCardId = -1;
    if (!game.aiStunned) {
      aiCardId = game.getAiChoice();
    }

    clashRay.classList.add('hidden');
    playerCardSlot.innerHTML = createCard3DHtml(userCardId, true);
    aiCardSlot.innerHTML = createCard3DHtml(aiCardId, true);

    if (userCardId !== -1) {
      game.userHand[userCardId]--;
      game.userDiscard[userCardId]++;
    }
    if (aiCardId !== -1) {
      game.aiHand[aiCardId]--;
      game.aiDiscard[aiCardId]++;
    }

    renderAiHandBacks();

    setTimeout(() => {
      document.querySelectorAll('.arena-card-slot .card-container-3d').forEach(el => {
        el.classList.add('flipped');
      });

      setTimeout(() => {
        clashRay.classList.remove('hidden');

        setTimeout(() => {
          clashRay.classList.add('hidden');
          resolveOutcome(userCardId, aiCardId);
          game.turn++;
          game.isProcessing = false;
          updateUI();
          checkGameOver();
        }, 600);
      }, 500);
    }, 500);
  }

  function resolveOutcome(uId, aId) {
    let outcomeStr = '';
    
    if (uId !== -1 && aId !== -1) {
      let cell = MATRIX[uId][aId];
      game.userHp += cell.A;
      game.aiHp += cell.B;
      
      game.userStunned = cell.sA;
      game.aiStunned = cell.sB;

      if (cell.pA) {
        for(let k=0; k<5; k++) { game.userHand[k] += game.userDiscard[k]; game.userDiscard[k] = 0; }
        if (aId === 2) {
          addLog('👤 你打出《深思熟虑》遭遇《破口大骂》：虽受到 -5 伤害并被【停动】，但成功回收了全部弃牌！', 'heal');
        } else {
          addLog('👤 你使用了《深思熟虑》，成功回收了已打出的手牌！', 'heal');
        }
      } else if (uId === 5) {
        addLog('⚠️ 你的《深思熟虑》遭遇《反唇相讥》，回收被打断！', 'dmg');
      }

      if (cell.pB) {
        for(let k=0; k<5; k++) { game.aiHand[k] += game.aiDiscard[k]; game.aiDiscard[k] = 0; }
        if (uId === 2) {
          addLog('🤖 AI打出《深思熟虑》遭遇《破口大骂》：虽受到 -5 伤害并被【停动】，但成功回收了全部弃牌！', 'system');
        } else {
          addLog('🤖 AI 使用了《深思熟虑》，成功回收了已打出的手牌！', 'system');
        }
      } else if (aId === 5) {
        addLog('⚠️ AI 的《深思熟虑》遭遇《反唇相讥》，回收被打断！', 'heal');
      }

      outcomeStr = `【对决】你出《${CARDS[uId].name}》，AI出《${CARDS[aId].name}》。`;
      if (cell.A < 0) outcomeStr += ` 你(己方)血量 ${cell.A}；`;
      if (cell.A > 0) outcomeStr += ` 你(己方)血量 +${cell.A}；`;
      if (cell.B < 0) outcomeStr += ` AI(对方)血量 ${cell.B}；`;
      if (cell.B > 0) outcomeStr += ` AI(对方)血量 +${cell.B}；`;

    } else if (uId !== -1 && aId === -1) {
      game.aiStunned = false;
      if (uId === 0) { game.aiHp -= 10; outcomeStr = `AI处于停动！你的《一语道破》对AI(对方)造成 -10 伤害！`; }
      else if (uId === 2) { game.aiHp -= 5; game.aiStunned = true; outcomeStr = `AI处于停动！你的《破口大骂》对AI(对方)造成 -5 伤害并再次【停动】AI！`; }
      else if (uId === 4) { game.userHp += 10; outcomeStr = `AI处于停动！你的《心如止水》为你(己方)恢复 +10 HP！`; }
      else if (uId === 5) { 
        for(let k=0; k<5; k++) { game.userHand[k] += game.userDiscard[k]; game.userDiscard[k] = 0; }
        outcomeStr = `AI处于停动！你趁机打出《深思熟虑》安全回收全部弃牌！`; 
      } else { outcomeStr = `AI处于停动，你打出了《${CARDS[uId].name}》。`; }

    } else if (uId === -1 && aId !== -1) {
      game.userStunned = false;
      if (aId === 0) { game.userHp -= 10; outcomeStr = `你处于停动！AI的《一语道破》对你(己方)造成 -10 伤害！`; }
      else if (aId === 2) { game.userHp -= 5; game.userStunned = true; outcomeStr = `你处于停动！AI的《破口大骂》对你(己方)造成 -5 伤害并再次【停动】你！`; }
      else if (aId === 4) { game.aiHp += 10; outcomeStr = `你处于停动！AI的《心如止水》为其(对方)恢复 +10 HP！`; }
      else if (aId === 5) {
        for(let k=0; k<5; k++) { game.aiHand[k] += game.aiDiscard[k]; game.aiDiscard[k] = 0; }
        outcomeStr = `你处于停动！AI趁机打出《深思熟虑》安全回收全部弃牌！`;
      } else { outcomeStr = `你处于停动，AI打出了《${CARDS[aId].name}》。`; }

    } else {
      game.userStunned = false;
      game.aiStunned = false;
      outcomeStr = `双方均处于【停动】状态，本回合平稳过档！`;
    }

    game.userHp = Math.min(game.maxHp, Math.max(0, game.userHp));
    game.aiHp = Math.min(game.maxHp, Math.max(0, game.aiHp));

    outcomeBanner.classList.remove('hidden');
    outcomeText.textContent = outcomeStr;
    addLog(outcomeStr, (game.userHp > game.aiHp) ? 'heal' : 'dmg');
  }

  function updateUI() {
    turnCounter.textContent = `第 ${game.turn} 回合`;
    
    let uPct = (game.userHp / game.maxHp * 100).toFixed(1);
    let aPct = (game.aiHp / game.maxHp * 100).toFixed(1);

    userHpBar.style.width = uPct + '%';
    userHpText.textContent = `${game.userHp} / ${game.maxHp} HP`;

    aiHpBar.style.width = aPct + '%';
    aiHpText.textContent = `${game.aiHp} / ${game.maxHp} HP`;

    userHandCount.textContent = game.getHandCount(game.userHand);
    aiHandCount.textContent = game.getHandCount(game.aiHand);

    if (game.userStunned) userStunBadge.classList.remove('hidden');
    else userStunBadge.classList.add('hidden');

    if (game.aiStunned) aiStunBadge.classList.remove('hidden');
    else aiStunBadge.classList.add('hidden');

    if (game.aiStunned && !game.userStunned) {
      stunNoticeBanner.classList.remove('hidden');
      stunNoticeText.textContent = `😵 提示：AI 处于【停动】状态！本回合无法出牌，你可以单方面自由出牌！`;
    } else if (game.userStunned && !game.aiStunned) {
      stunNoticeBanner.classList.remove('hidden');
      stunNoticeText.textContent = `😵 提示：你处于【停动】状态！本回合无法出牌，请点击跳过回合。`;
    } else if (game.userStunned && game.aiStunned) {
      stunNoticeBanner.classList.remove('hidden');
      stunNoticeText.textContent = `😵 提示：双方均处于【停动】状态！`;
    } else {
      stunNoticeBanner.classList.add('hidden');
    }

    aiDiffTag.textContent = (game.difficulty === 'master') ? '🧠 大师 AI' : (game.difficulty === 'medium' ? '⚖️ 中级 AI' : '🎲 随机 AI');

    renderAiHandBacks();
    renderHandDock();
  }

  function addLog(text, type = 'system') {
    const pEl = document.createElement('p');
    pEl.className = `log-item ${type}`;
    pEl.textContent = `[T${game.turn}] ${text}`;
    battleLog.appendChild(pEl);
    battleLog.scrollTop = battleLog.scrollHeight;
  }

  function renderTracker() {
    const aiList = document.getElementById('ai-tracker-list');
    const userList = document.getElementById('user-tracker-list');

    aiList.innerHTML = '';
    userList.innerHTML = '';

    CARDS.forEach(card => {
      aiList.innerHTML += `<div class="tracker-item">
        <span>${card.name}</span>
        <strong>${game.aiHand[card.id]} 张</strong>
      </div>`;

      userList.innerHTML += `<div class="tracker-item">
        <span>${card.name}</span>
        <strong>${game.userHand[card.id]} 张</strong>
      </div>`;
    });
  }

  function checkGameOver() {
    if (game.userHp <= 0 || game.aiHp <= 0) {
      game.gameOver = true;
      setTimeout(() => {
        gameoverModal.classList.add('active');
        const title = document.getElementById('gameover-title');
        const desc = document.getElementById('gameover-desc');
        document.getElementById('stat-turns').textContent = game.turn;
        document.getElementById('stat-hp').textContent = game.userHp + ' HP';

        if (game.userHp > 0 && game.aiHp <= 0) {
          title.textContent = '🏆 辩论压制，战斗胜利！';
          title.style.color = '#15803d';
          desc.textContent = `你凭借高超的词锋与手牌推演，成功击败了 ${selectedDiff.toUpperCase()} AI！`;
        } else if (game.userHp <= 0 && game.aiHp > 0) {
          title.textContent = '💀 辩词匮乏，遗憾战败！';
          title.style.color = '#b91c1c';
          desc.textContent = `AI 在残局中看破了你的手牌，你未能存活下来。`;
        } else {
          title.textContent = '🤝 同归于尽，双方平局！';
          title.style.color = '#d97706';
          desc.textContent = `双方辩手在最后一个回合同时耗尽了最后一口气。`;
        }
      }, 500);
    }
  }

  updateUI();
});
