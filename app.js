/* ==========================================================================
   《舌战》桌游电子版 核心游戏引擎与 AI 逻辑 (App.js)
   (彻底订正：破口大骂 vs 反唇相讥 单元格为 -/-5, 停动)
   (破口大骂造成反唇相讥-5且停动；反唇相讥被破口大骂停动)
   ========================================================================== */

// SVG Art Icons for 6 Cards
const SVG_ICONS = {
  0: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h12a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-5 4v-4a3 3 0 0 1-2-3V8a3 3 0 0 1 2-3Z"/><path d="m8 13 7-7"/><path d="m11 6h4v4"/></svg>`,
  1: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h10a3 3 0 0 1 3 3v3"/><path d="m18 7 3 3-3 3"/><path d="M19 20H9a3 3 0 0 1-3-3v-3"/><path d="m6 17-3-3 3-3"/></svg>`,
  2: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4"/><path d="M7 8v8"/><path d="M10 6v12"/><path d="m13 8 7-4v16l-7-4Z"/><path d="M18 9.5h3"/><path d="M18 14.5h3"/></svg>`,
  3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-5 4v-4a3 3 0 0 1-2-3V8a3 3 0 0 1 3-3Z"/><path d="m7 9 10 4"/><path d="m17 9-10 4"/></svg>`,
  4: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a7 7 0 0 0-7 7c0 5 7 11 7 11s7-6 7-11a7 7 0 0 0-7-7Z"/><path d="M8.5 10.5c1.2 1 2.4 1.5 3.5 1.5s2.3-.5 3.5-1.5"/><path d="M9 8.5h.01M15 8.5h.01"/></svg>`,
  5: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H8l-4 3v-4a3 3 0 0 1-2-3V7a3 3 0 0 1 3-3Z"/><path d="M7 9h7M7 13h5"/><path d="m16 11 2 2 3-4"/></svg>`
};

const SEALS = { 0: '破', 1: '反', 2: '怒', 3: '静', 4: '水', 5: '虑' };

const CARD_DESCS = {
  0: '⚡ 同牌相撞时双方-10 HP；击穿《破口大骂》（对方-15 HP）；克制《心如止水》《深思熟虑》（对方-10 HP）；被《反唇相讥》反弹（己方-10 HP）。',
  1: '🌿 反弹《一语道破》（对方-10 HP）；被《破口大骂》压制（己方-5 HP且【停动】）；打断《深思熟虑》（阻断对方回收手牌）。',
  2: '🔥 同牌相撞时双方-5 HP且【停动】；压制《反唇相讥》（对方-5 HP且【停动】）；打《沉默是金》（己方0伤，对方-5 HP）；打《深思熟虑》（己方0伤，对方-5 HP且【停动】，但对方依然能回收）；被《一语道破》刺穿（己方-15 HP）；碰《心如止水》（对方+15 HP）。',
  3: '🌈 最稳试探牌。仅被《破口大骂》造成（己方-5 HP，无停动），面对其他所有牌均为 0 伤害。',
  4: '💧 吸收《破口大骂》（己方+15 HP）；碰《一语道破》（己方-10 HP）；碰其他所有牌均（己方+10 HP）。',
  5: '⛰️ 回收除自身外的所有弃牌。碰《破口大骂》（己方-5 HP且【停动】，但依然成功回收手牌）；遭遇《反唇相讥》回收被打断！'
};

const CARDS = [
  { id: 0, name: '一语道破', color: '#9e7539' },
  { id: 1, name: '反唇相讥', color: '#52705e' },
  { id: 2, name: '破口大骂', color: '#9b4942' },
  { id: 3, name: '沉默是金', color: '#746279' },
  { id: 4, name: '心如止水', color: '#536f7e' },
  { id: 5, name: '深思熟虑', color: '#8a6046' }
];

const CARD_NAMES = {
  zh: CARDS.map(card => card.name),
  en: [
    'Cut Through the Noise',
    'Throw It Back',
    'Shout Them Down',
    'Refuse to Engage',
    'Keep Your Cool',
    'Gather Your Thoughts'
  ]
};

const CARD_DESCS_EN = {
  0: '⚡ Get straight to the point. Both sides take 10 damage in a mirror match. Deal 15 to Shout Them Down and 10 to Keep Your Cool or Gather Your Thoughts—but Throw It Back turns 10 damage onto you.',
  1: '🌿 Turn their point against them. Reflect Cut Through the Noise for 10 damage and interrupt Gather Your Thoughts. If they Shout You Down, however, you take 5 damage and are Shut Down.',
  2: '🔥 Overwhelm their reply. Deal 5 damage and Shut Down Throw It Back or Gather Your Thoughts. Two shouting matches hurt and Shut Down both sides. Refuse to Engage takes 5 damage but cannot be Shut Down.',
  3: '🌈 Give them nothing to argue with. Every direct move fails except Shout Them Down: you take 5 damage, but you are not Shut Down.',
  4: '💧 Stay calm under pressure. Take 10 damage from Cut Through the Noise; recover 15 against Shout Them Down; recover 10 against every other move, up to your maximum HP.',
  5: '⛰️ Rebuild your argument. Return every spent card except Gather Your Thoughts itself. Throw It Back interrupts the recovery. Shout Them Down deals 5 and Shuts you Down, but your recovery still succeeds.'
};

const CARD_FACE_COPY = {
  zh: [
    { type: '直击', cue: '切穿噪音' },
    { type: '反击', cue: '原话奉还' },
    { type: '压制', cue: '不许还嘴' },
    { type: '缄默', cue: '拒绝接招' },
    { type: '定心', cue: '稳住阵脚' },
    { type: '蓄势', cue: '重整论点' }
  ],
  en: [
    { type: 'BREAK THROUGH', cue: 'Get to the point' },
    { type: 'COUNTER', cue: 'Turn it around' },
    { type: 'PRESSURE', cue: 'Drown out the reply' },
    { type: 'DISENGAGE', cue: 'Give them nothing' },
    { type: 'COMPOSURE', cue: 'Stay calm under fire' },
    { type: 'REGROUP', cue: 'Rebuild your argument' }
  ]
};

const CARD_ART_URLS = [
  'assets/cards/cut-through.webp',
  'assets/cards/throw-back.webp',
  'assets/cards/shout-down.webp',
  'assets/cards/refuse-engage.webp',
  'assets/cards/keep-cool.webp',
  'assets/cards/gather-thoughts.webp'
];

const CARD_EPIGRAPHS = {
  zh: [
    { quote: '辞达而已矣。', source: '《论语》' },
    { quote: '以子之矛，陷子之盾。', source: '《韩非子》' },
    { quote: '竖子不足与谋！', source: '《史记》' },
    { quote: '知者不言。', source: '《道德经》' },
    { quote: '猝然临之而不惊。', source: '苏轼' },
    { quote: '三思而后行。', source: '《论语》' }
  ],
  en: [
    { quote: 'Words need only hit their mark.', source: 'Confucius · adapted' },
    { quote: 'Turn his own spear against his shield.', source: 'Han Feizi · adapted' },
    { quote: 'The fool is beyond counsel!', source: 'Grand Historian · adapted' },
    { quote: 'Those who know do not speak.', source: 'Laozi' },
    { quote: 'Unshaken when the storm breaks.', source: 'Su Shi · adapted' },
    { quote: 'Think it through, then act.', source: 'Confucius · adapted' }
  ]
};

const UI_TEXT = {
  zh: {
    modeLabel: '对局模式',
    competitiveTitle: '⚡ 竞技刺客模式',
    competitiveSub: '30 HP | 每方 14 张牌 · 1 张心如止水',
    casualTitle: '♟️ 持久策略模式',
    casualSub: '40 HP | 每方 15 张牌 · 双心如止水',
    difficultyLabel: 'AI 对手难度',
    masterTitle: '🧠 大师 AI',
    masterSub: '概率推演 · 战术斩杀',
    mediumTitle: '⚖️ 中级 AI',
    mediumSub: '单回合期望 · 适度随机',
    easyTitle: '🎲 随机 AI',
    easySub: '轻松试玩',
    sessionHeading: '本次游玩',
    wins: '胜',
    losses: '负',
    draws: '平',
    winRate: '胜率',
    startGame: '开始对局',
    rulebook: '📖 规则手册',
    tracker: '📊 记牌器',
    rules: '📖 规则',
    mainMenu: '🔄 主菜单',
    aiOpponent: 'AI 对手',
    remaining: '🎴 剩余:',
    stunned: '😵 停动中',
    playerPlay: '👤 玩家出牌',
    aiPlay: '🤖 AI 出牌',
    battleLog: '📜 对局日志',
    youPlayer: '你 (Player)',
    playHint: '点击选牌，或向上拖到出牌区',
    cancel: '取消',
    confirmPlay: '确认出牌',
    discardPile: '弃牌堆',
    trackerTitle: '📊 双方手牌剩余记牌器',
    aiCardsRemaining: '🤖 AI 对手剩余手牌',
    yourCardsRemaining: '👤 你的剩余手牌',
    howToPlay: 'HOW TO PLAY',
    rulesTitle: '《舌战》完整规则手册',
    totalTurns: '总回合数:',
    remainingHp: '剩余血量:',
    backToMenu: '🔄 返回主菜单'
  },
  en: {
    modeLabel: 'GAME MODE',
    competitiveTitle: '⚡ Quick-Fire Debate',
    competitiveSub: '30 HP | 14 cards each · 1 Keep Your Cool',
    casualTitle: '♟️ Long-Form Debate',
    casualSub: '40 HP | 15 cards each · 2 Keep Your Cool',
    difficultyLabel: 'CHOOSE OPPONENT',
    masterTitle: '🧠 Master Orator',
    masterSub: 'Reads patterns · Punishes repetition · Sets up finish',
    mediumTitle: '⚖️ Seasoned Speaker',
    mediumSub: 'Weighs exchange · Mixes up replies',
    easyTitle: '🎲 Impulsive Speaker',
    easySub: 'Plays on impulse',
    sessionHeading: 'THIS SESSION',
    wins: 'Wins',
    losses: 'Losses',
    draws: 'Draws',
    winRate: 'Win Rate',
    startGame: 'Start Game',
    rulebook: '📖 Rules',
    tracker: '📊 Tracker',
    rules: '📖 Rules',
    mainMenu: '🔄 Menu',
    aiOpponent: 'AI Opponent',
    remaining: '🎴 In hand:',
    stunned: '😵 Shut Down',
    playerPlay: '👤 Player',
    aiPlay: '🤖 AI',
    battleLog: '📜 Battle Log',
    youPlayer: 'You',
    playHint: 'Click to select or drag card to arena',
    cancel: 'Cancel',
    confirmPlay: 'Play Card',
    discardPile: 'Discard',
    trackerTitle: '📊 Card Tracker',
    aiCardsRemaining: '🤖 AI Opponent Hand',
    yourCardsRemaining: '👤 Your Hand',
    howToPlay: 'HOW TO PLAY',
    rulesTitle: 'Shezhan: How to Play',
    totalTurns: 'Total Turns:',
    remainingHp: 'Remaining HP:',
    backToMenu: '🔄 Main Menu'
  }
};

const RULE_MATRIX_TEXT = {
  zh: [
    ['双方 -10', '你 -10', '对方 -15', '无效果', '对方 -10', '对方 -10；对方回收'],
    ['对方 -10', '无效果', '你 -5；你停动', '无效果', '对方 +10', '对方回收被打断'],
    ['你 -15', '对方 -5；对方停动', '双方 -5；双方停动', '对方 -5', '对方 +15', '对方 -5；停动并回收'],
    ['无效果', '无效果', '你 -5；不停动', '无效果', '对方 +10', '对方回收'],
    ['你 -10', '你 +10', '你 +15', '你 +10', '双方 +10', '你 +10；对方回收'],
    ['你 -10；你回收', '你的回收被打断', '你 -5；停动并回收', '你回收', '你回收；对方 +10', '双方回收']
  ],
  en: [
    ['Both -10', 'You -10', 'Opponent -15', 'No effect', 'Opponent -10', 'Opponent -10; they recover cards'],
    ['Opponent -10', 'No effect', 'You -5; Shut Down', 'No effect', 'Opponent +10', 'Their recovery is interrupted'],
    ['You -15', 'Opponent -5; Shut Down', 'Both -5; both Shut Down', 'Opponent -5', 'Opponent +15', 'Opponent -5; Shut Down and recovers'],
    ['No effect', 'No effect', 'You -5; not Shut Down', 'No effect', 'Opponent +10', 'Opponent recovers cards'],
    ['You -10', 'You +10', 'You +15', 'You +10', 'Both +10', 'You +10; opponent recovers'],
    ['You -10; recover', 'Your recovery is interrupted', 'You -5; Shut Down and recover', 'You recover cards', 'You recover; opponent +10', 'Both recover cards']
  ]
};

// 100% EXACT MATCHING MATRIX FOR PDF SCREENSHOT:
// Row 3 (破口大骂) Col 2 (反唇相讥): -/-5, 停动 (Red: -, Blue: -5, 停动)
// So P (Row) gets 0 HP & no stun. F (Col) gets -5 HP & STUN!
const MATRIX = [
  // 0: 一语道破 (Y) vs [Y, F, P, C, X, S]
  [
    {A: -10, B: -10, sA: false, sB: false, pA: false, pB: false},
    {A: -10, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B: -15, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B: -10, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B: -10, sA: false, sB: false, pA: false, pB: true }
  ],

  // 1: 反唇相讥 (F) vs [Y, F, P, C, X, S]
  [
    {A:   0, B: -10, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A:  -5, B:   0, sA: true,  sB: false, pA: false, pB: false}, // F (A) vs P (B) -> F takes -5 & STUN! P takes 0!
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B: +10, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false}
  ],

  // 2: 破口大骂 (P) vs [Y, F, P, C, X, S]
  [
    {A: -15, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B:  -5, sA: false, sB: true,  pA: false, pB: false}, // P (A) vs F (B) -> P takes 0! F takes -5 & STUN!
    {A:  -5, B:  -5, sA: true,  sB: true,  pA: false, pB: false},
    {A:   0, B:  -5, sA: false, sB: false, pA: false, pB: false}, // P vs C -> P: 0, C: -5 (NO STUN)
    {A:   0, B: +15, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B:  -5, sA: false, sB: true,  pA: false, pB: true }  // P vs S -> P: 0, S: -5 & STUN & PICKUP!
  ],

  // 3: 沉默是金 (C) vs [Y, F, P, C, X, S]
  [
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A:  -5, B:   0, sA: false, sB: false, pA: false, pB: false}, // C vs P -> C: -5 (NO STUN), P: 0
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B: +10, sA: false, sB: false, pA: false, pB: false},
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: true }
  ],

  // 4: 心如止水 (X) vs [Y, F, P, C, X, S]
  [
    {A: -10, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A: +10, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A: +15, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A: +10, B:   0, sA: false, sB: false, pA: false, pB: false},
    {A: +10, B: +10, sA: false, sB: false, pA: false, pB: false},
    {A: +10, B:   0, sA: false, sB: false, pA: false, pB: true }
  ],

  // 5: 深思熟虑 (S) vs [Y, F, P, C, X, S]
  [
    {A: -10, B:   0, sA: false, sB: false, pA: true,  pB: false},
    {A:   0, B:   0, sA: false, sB: false, pA: false, pB: false}, // S vs F -> NO PICKUP
    {A:  -5, B:   0, sA: true,  sB: false, pA: true,  pB: false}, // S vs P -> S: -5 & STUN & PICKUP, P: 0
    {A:   0, B:   0, sA: false, sB: false, pA: true,  pB: false},
    {A:   0, B: +10, sA: false, sB: false, pA: true,  pB: false},
    {A:   0, B:   0, sA: false, sB: false, pA: true,  pB: true }
  ]
];

function describeMatrixEffects(userCardId, aiCardId, cell) {
  const effects = [];

  if (cell.A < 0) effects.push(`你 ${cell.A} HP`);
  if (cell.A > 0) effects.push(`你 +${cell.A} HP`);
  if (cell.B < 0) effects.push(`AI ${cell.B} HP`);
  if (cell.B > 0) effects.push(`AI +${cell.B} HP`);
  if (cell.sA) effects.push('你被【停动】');
  if (cell.sB) effects.push('AI 被【停动】');
  if (cell.pA) effects.push('你回收除本牌外的弃牌');
  if (cell.pB) effects.push('AI 回收除本牌外的弃牌');

  if (userCardId === 5 && aiCardId === 1 && !cell.pA) {
    effects.push('你的捡牌被《反唇相讥》打断');
  }
  if (aiCardId === 5 && userCardId === 1 && !cell.pB) {
    effects.push('AI 的捡牌被《反唇相讥》打断');
  }

  return effects.length
    ? `${effects.join('；')}。`
    : '双方均无伤害、无停动、无捡牌效果。';
}

function describeMatrixEffectsEn(userCardId, aiCardId, cell) {
  const effects = [];

  if (cell.A < 0) effects.push(`you lose ${Math.abs(cell.A)} HP`);
  if (cell.A > 0) effects.push(`you recover ${cell.A} HP`);
  if (cell.B < 0) effects.push(`your opponent loses ${Math.abs(cell.B)} HP`);
  if (cell.B > 0) effects.push(`your opponent recovers ${cell.B} HP`);
  if (cell.sA) effects.push('you are Shut Down');
  if (cell.sB) effects.push('your opponent is Shut Down');
  if (cell.pA) effects.push('you recover every eligible spent card');
  if (cell.pB) effects.push('your opponent recovers every eligible spent card');

  if (userCardId === 5 && aiCardId === 1 && !cell.pA) {
    effects.push('your Gather Your Thoughts recovery is interrupted');
  }
  if (aiCardId === 5 && userCardId === 1 && !cell.pB) {
    effects.push('your opponent’s Gather Your Thoughts recovery is interrupted');
  }

  return effects.length
    ? `${effects.join('; ')}.`
    : 'Neither move gets through.';
}

function describeShowdownEn(userCardId, aiCardId, cell) {
  const key = `${userCardId}-${aiCardId}`;
  const lines = {
    '0-0': 'You both Cut Through the Noise at once. Both sides take 10 damage.',
    '0-1': 'You Cut Through the Noise—but they Throw It Back. Your own point hits you for 10 damage.',
    '1-0': 'They Cut Through the Noise, and you Throw It Back. Their own point hits them for 10 damage.',
    '0-2': 'They try to Shout You Down, but you Cut Through the Noise. They take 15 damage.',
    '2-0': 'You try to Shout Them Down, but they Cut Through the Noise. You take 15 damage.',
    '1-2': 'You try to Throw It Back, but they Shout You Down. You take 5 damage and are Shut Down.',
    '2-1': 'They try to Throw It Back, but you Shout Them Down. They take 5 damage and are Shut Down.',
    '2-2': 'The exchange turns into a shouting match. Both sides take 5 damage and are Shut Down.',
    '2-3': 'You Shout Them Down. They Refuse to Engage: they take 5 damage, but are not Shut Down.',
    '3-2': 'They Shout You Down. You Refuse to Engage: you take 5 damage, but are not Shut Down.',
    '2-4': 'You Shout Them Down, but they Keep Their Cool. They recover 15 HP.',
    '4-2': 'They Shout You Down, but you Keep Your Cool. You recover 15 HP.',
    '2-5': 'You Shout Them Down. They take 5 damage and are Shut Down—but still Gather Their Thoughts and recover their cards.',
    '5-2': 'They Shout You Down. You take 5 damage and are Shut Down—but still Gather Your Thoughts and recover your cards.',
    '1-5': 'You Throw It Back before they can Gather Their Thoughts. Their recovery is interrupted.',
    '5-1': 'You try to Gather Your Thoughts, but they Throw It Back. Your recovery is interrupted.',
    '4-4': 'You both Keep Your Cool. Both sides recover 10 HP.',
    '5-5': 'You both Gather Your Thoughts and recover every eligible spent card.'
  };

  return lines[key]
    || `You play ${CARD_NAMES.en[userCardId]}. They answer with ${CARD_NAMES.en[aiCardId]}. ${describeMatrixEffectsEn(userCardId, aiCardId, cell)}`;
}

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
    this.userPlayHistory = [];
    this.aiPlayHistory = [];
    this.aiPersonality = 'balanced';
    this.sessionStats = { wins: 0, losses: 0, draws: 0, games: 0 };
    this.resultRecorded = false;
    
    this.isProcessing = false;
    this.gameOver = false;
  }

  init(difficulty) {
    this.difficulty = difficulty || 'master';
    this.turn = 1;
    this.maxHp = 40;
    this.userHp = 40;
    this.aiHp = 40;
    
    this.userHand = [3, 3, 3, 3, 2, 1];
    this.aiHand = [3, 3, 3, 3, 2, 1];
    
    this.userDiscard = [0, 0, 0, 0, 0, 0];
    this.aiDiscard = [0, 0, 0, 0, 0, 0];
    this.userPlayHistory = [];
    this.aiPlayHistory = [];
    this.aiPersonality = ['balanced', 'aggressive', 'control', 'resource'][Math.floor(Math.random() * 4)];
    this.resultRecorded = false;
    
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

  getValidCards(hand) {
    return hand.map((count, card) => count > 0 ? card : -1).filter(card => card !== -1);
  }

  getPlayerProbabilities(state, adaptToCurrentMatch = false) {
    const handWeights = state.userHand.map(count => Math.max(0, count));
    const handTotal = handWeights.reduce((sum, value) => sum + value, 0);
    if (handTotal <= 0) return [];

    let probabilities = handWeights.map(weight => weight / handTotal);

    if (adaptToCurrentMatch && this.userPlayHistory.length > 0) {
      const recent = this.userPlayHistory.slice(-5);
      const patternWeights = handWeights.map(() => 0);

      recent.forEach((card, index) => {
        if (card >= 0 && handWeights[card] > 0) {
          patternWeights[card] += 1 + index * 0.45;
        }
      });

      const patternTotal = patternWeights.reduce((sum, value) => sum + value, 0);
      if (patternTotal > 0) {
        // 一次重复倾向就值得警觉；连续出现后迅速提高置信度，
        // 但最多保留 15% 的手牌基准概率，避免 AI 变成机械读牌。
        const patternConfidence = Math.min(0.88, 0.6 + (recent.length - 1) * 0.2);
        probabilities = probabilities.map((baseProbability, card) =>
          baseProbability * (1 - patternConfidence)
          + (patternWeights[card] / patternTotal) * patternConfidence
        );
      }

      if (state.userHp <= state.maxHp * 0.4 && handWeights[4] > 0) {
        probabilities[4] *= 1.3;
      }
    }

    const total = probabilities.reduce((sum, value) => sum + value, 0);
    return probabilities
      .map((probability, card) => ({ card, probability: probability / total }))
      .filter(item => item.probability > 0);
  }

  evaluatePair(state, userCard, aiCard) {
    const cell = MATRIX[userCard][aiCard];
    const nextUserHp = Math.min(state.maxHp, Math.max(0, state.userHp + cell.A));
    const nextAiHp = Math.min(state.maxHp, Math.max(0, state.aiHp + cell.B));
    const userDelta = nextUserHp - state.userHp;
    const aiDelta = nextAiHp - state.aiHp;
    let score = (-userDelta * 1.12) + (aiDelta * 1.0);

    if (nextUserHp <= 0) score += 100;
    if (nextAiHp <= 0) score -= 120;
    if (cell.sA) score += 7;
    if (cell.sB) score -= 8;

    const userRecoverable = state.userDiscard.slice(0, 5).reduce((a, b) => a + b, 0);
    const aiRecoverable = state.aiDiscard.slice(0, 5).reduce((a, b) => a + b, 0);
    if (cell.pA) score -= userRecoverable * 1.1;
    if (cell.pB) score += aiRecoverable * 1.1;
    if (userCard === 5 && aiCard === 1 && !cell.pA) score += userRecoverable * 0.8;
    if (aiCard === 5 && userCard === 1 && !cell.pB) score -= aiRecoverable * 0.8;

    return score;
  }

  simulatePair(state, userCard, aiCard) {
    const cell = MATRIX[userCard][aiCard];
    const next = {
      maxHp: state.maxHp,
      userHp: Math.min(state.maxHp, Math.max(0, state.userHp + cell.A)),
      aiHp: Math.min(state.maxHp, Math.max(0, state.aiHp + cell.B)),
      userStunned: cell.sA,
      aiStunned: cell.sB,
      userHand: [...state.userHand],
      aiHand: [...state.aiHand],
      userDiscard: [...state.userDiscard],
      aiDiscard: [...state.aiDiscard]
    };

    next.userHand[userCard]--;
    next.aiHand[aiCard]--;
    next.userDiscard[userCard]++;
    next.aiDiscard[aiCard]++;

    if (cell.pA) {
      for (let i = 0; i < 5; i++) {
        next.userHand[i] += next.userDiscard[i];
        next.userDiscard[i] = 0;
      }
    }
    if (cell.pB) {
      for (let i = 0; i < 5; i++) {
        next.aiHand[i] += next.aiDiscard[i];
        next.aiDiscard[i] = 0;
      }
    }

    if (this.getHandCount(next.userHand) === 0) {
      for (let i = 0; i < 6; i++) {
        next.userHand[i] += next.userDiscard[i];
        next.userDiscard[i] = 0;
      }
    }
    if (this.getHandCount(next.aiHand) === 0) {
      for (let i = 0; i < 6; i++) {
        next.aiHand[i] += next.aiDiscard[i];
        next.aiDiscard[i] = 0;
      }
    }

    return next;
  }

  evaluateAiSolo(state, aiCard) {
    if (aiCard === 0) {
      const damage = Math.min(10, state.userHp);
      return damage * 1.12 + (state.userHp <= 10 ? 100 : 0);
    }
    if (aiCard === 2) return 7;
    if (aiCard === 4) return Math.min(10, state.maxHp - state.aiHp);
    if (aiCard === 5) return state.aiDiscard.slice(0, 5).reduce((a, b) => a + b, 0) * 1.1;
    return 0;
  }

  evaluateUserSolo(state, userCard) {
    if (userCard === 0) {
      const damage = Math.min(10, state.aiHp);
      return -(damage * 1.12) - (state.aiHp <= 10 ? 120 : 0);
    }
    if (userCard === 2) return -8;
    if (userCard === 4) return -Math.min(10, state.maxHp - state.userHp);
    if (userCard === 5) return -state.userDiscard.slice(0, 5).reduce((a, b) => a + b, 0) * 1.1;
    return 0;
  }

  estimateNextTurn(state) {
    if (state.userHp <= 0 || state.aiHp <= 0) return 0;
    const aiCards = this.getValidCards(state.aiHand);
    const userCards = this.getValidCards(state.userHand);
    if (state.userStunned && state.aiStunned) return 0;
    if (state.userStunned) {
      return aiCards.length ? Math.max(...aiCards.map(card => this.evaluateAiSolo(state, card))) : 0;
    }
    if (state.aiStunned) {
      return userCards.length ? Math.min(...userCards.map(card => this.evaluateUserSolo(state, card))) : 0;
    }

    const playerProbabilities = this.getPlayerProbabilities(state, false);
    if (!aiCards.length || !playerProbabilities.length) return 0;
    return Math.max(...aiCards.map(aiCard =>
      playerProbabilities.reduce(
        (sum, item) => sum + item.probability * this.evaluatePair(state, item.card, aiCard),
        0
      )
    ));
  }

  getPersonalityBonus(card) {
    const profiles = {
      balanced:  [0, 0, 0, 0, 0, 0],
      aggressive:[0.8, 0, 0.5, -0.1, -0.3, -0.2],
      control:   [0, 0.4, 0.9, 0.3, -0.1, 0],
      resource:  [-0.1, 0, -0.2, 0.1, 0.5, 0.9]
    };
    return profiles[this.aiPersonality][card];
  }

  chooseFromScores(cards, scores, temperature) {
    const bestScore = Math.max(...scores);
    const cutoff = this.difficulty === 'master' ? 10 : 16;
    const weighted = scores.map((score, index) => {
      if (bestScore - score > cutoff) return 0;
      const explorationFloor = bestScore - score <= 4 ? 0.08 : 0;
      return Math.exp((score - bestScore) / temperature) + explorationFloor;
    });
    const total = weighted.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < cards.length; i++) {
      roll -= weighted[i];
      if (roll <= 0) return cards[i];
    }
    return cards[cards.length - 1];
  }

  getOpeningWeights(validCards) {
    const baseWeights = [3, 2.5, 2.5, 2, 0, 0];
    return validCards.map(card =>
      baseWeights[card] > 0
        ? Math.max(0.2, baseWeights[card] + this.getPersonalityBonus(card) * 0.35)
        : 0
    );
  }

  chooseFromWeights(cards, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return cards[Math.floor(Math.random() * cards.length)];
    let roll = Math.random() * total;
    for (let i = 0; i < cards.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return cards[i];
    }
    return cards[cards.length - 1];
  }

  getAiChoice() {
    const validCards = this.getValidCards(this.aiHand);
    if (validCards.length === 0) return -1;

    if (this.difficulty === 'easy') {
      return validCards[Math.floor(Math.random() * validCards.length)];
    }

    if (this.turn === 1 && !this.userStunned) {
      const openingCards = validCards.filter(card => card <= 3);
      if (openingCards.length > 0) {
        return this.chooseFromWeights(openingCards, this.getOpeningWeights(openingCards));
      }
    }

    const currentState = {
      maxHp: this.maxHp,
      userHp: this.userHp,
      aiHp: this.aiHp,
      userStunned: this.userStunned,
      aiStunned: this.aiStunned,
      userHand: [...this.userHand],
      aiHand: [...this.aiHand],
      userDiscard: [...this.userDiscard],
      aiDiscard: [...this.aiDiscard]
    };

    if (this.userStunned) {
      if (this.userHp <= 10 && this.aiHand[0] > 0) return 0;
      const soloScores = validCards.map(card => this.evaluateAiSolo(currentState, card));
      return this.chooseFromScores(validCards, soloScores, this.difficulty === 'master' ? 2.4 : 5.5);
    }

    const probabilities = this.getPlayerProbabilities(
      currentState,
      this.difficulty === 'master'
    );

    if (this.difficulty === 'master') {
      const guaranteedLethal = validCards.filter(aiCard =>
        probabilities.every(item => {
          const next = this.simulatePair(currentState, item.card, aiCard);
          return next.userHp <= 0 && next.aiHp > 0;
        })
      );
      if (guaranteedLethal.length > 0) {
        return guaranteedLethal[Math.floor(Math.random() * guaranteedLethal.length)];
      }
    }

    const useLookahead = this.difficulty === 'master';
    const lookaheadWeight = this.userPlayHistory.length > 0 ? 0.28 : 0.55;
    const scores = validCards.map(aiCard => {
      let score = probabilities.reduce((sum, item) => {
        const immediate = this.evaluatePair(currentState, item.card, aiCard);
        if (!useLookahead) return sum + item.probability * immediate;
        const next = this.simulatePair(currentState, item.card, aiCard);
        return sum + item.probability * (
          immediate + this.estimateNextTurn(next) * lookaheadWeight
        );
      }, 0);

      if (useLookahead) {
        score += this.getPersonalityBonus(aiCard);
        const recentAi = this.aiPlayHistory.slice(-2);
        if (recentAi[recentAi.length - 1] === aiCard) score -= 0.8;
        if (recentAi.length === 2 && recentAi.every(card => card === aiCard)) score -= 1.2;
      }
      return score;
    });

    return this.chooseFromScores(
      validCards,
      scores,
      this.difficulty === 'master'
        ? (this.userPlayHistory.length >= 2 ? 2.4 : (this.turn <= 3 ? 3.4 : 3.2))
        : 6.5
    );
  }

  recordTurn(userCard, aiCard) {
    if (userCard >= 0) this.userPlayHistory.push(userCard);
    if (aiCard >= 0) this.aiPlayHistory.push(aiCard);
  }

  consumeMutualStunTurn() {
    if (
      !this.userStunned
      || !this.aiStunned
      || this.userHp <= 0
      || this.aiHp <= 0
    ) return false;

    this.userStunned = false;
    this.aiStunned = false;
    this.turn++;
    return true;
  }

  recordGameResult(result) {
    if (this.resultRecorded || !['win', 'loss', 'draw'].includes(result)) return false;
    this.sessionStats.games++;
    if (result === 'win') this.sessionStats.wins++;
    if (result === 'loss') this.sessionStats.losses++;
    if (result === 'draw') this.sessionStats.draws++;
    this.resultRecorded = true;
    return true;
  }

  getSessionWinRate() {
    if (this.sessionStats.games === 0) return null;
    return Math.round((this.sessionStats.wins / this.sessionStats.games) * 100);
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
  const rulesBody = document.getElementById('rules-body');
  const gameoverModal = document.getElementById('gameover-modal');
  const sessionWins = document.getElementById('session-wins');
  const sessionLosses = document.getElementById('session-losses');
  const sessionDraws = document.getElementById('session-draws');
  const sessionGames = document.getElementById('session-games');
  const sessionWinRate = document.getElementById('session-win-rate');
  const gameoverSessionRecord = document.getElementById('gameover-session-record');

  const btnTracker = document.getElementById('btn-tracker');
  const btnRules = document.getElementById('btn-rules');
  const btnRestart = document.getElementById('btn-restart');
  const btnPlayAgain = document.getElementById('btn-play-again');

  const userHpBar = document.getElementById('user-hp-bar');
  const userHpText = document.getElementById('user-hp-text');
  const userHandCount = document.getElementById('user-hand-count');
  const userStunBadge = document.getElementById('user-stun-badge');
  const userDiscardPreview = document.getElementById('user-discard-preview');
  const recoverableCount = document.getElementById('recoverable-count');

  const aiHpBar = document.getElementById('ai-hp-bar');
  const aiHpText = document.getElementById('ai-hp-text');
  const aiHandCount = document.getElementById('ai-hand-count');
  const aiStunBadge = document.getElementById('ai-stun-badge');
  const aiDiffTag = document.getElementById('ai-diff-tag');
  const aiHandBacks = document.getElementById('ai-hand-backs');

  const turnCounter = document.getElementById('turn-counter');
  const stunNoticeBanner = document.getElementById('stun-notice-banner');
  const stunNoticeText = document.getElementById('stun-notice-text');
  const arenaZone = document.querySelector('.arena-zone');
  const playerCardSlot = document.getElementById('player-card-slot');
  const aiCardSlot = document.getElementById('ai-card-slot');
  const clashRay = document.getElementById('clash-ray');
  const outcomeBanner = document.getElementById('outcome-banner');
  const outcomeText = document.getElementById('outcome-text');
  const battleLog = document.getElementById('battle-log');
  const handCardsContainer = document.getElementById('hand-cards-container');
  const handActionBar = document.getElementById('hand-action-bar');
  const selectedCardName = document.getElementById('selected-card-name');
  const btnCancelCard = document.getElementById('btn-cancel-card');
  const btnConfirmCard = document.getElementById('btn-confirm-card');

  // Hover Tooltip Elements
  const hoverTooltip = document.getElementById('card-hover-tooltip');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipQuote = document.getElementById('tooltip-quote');
  const tooltipBody = document.getElementById('tooltip-body');

  let selectedMode = 'casual';
  let selectedDiff = 'master';
  let selectedCardId = null;
  let suppressCardClick = false;
  let currentLang = 'zh';

  const tr = key => UI_TEXT[currentLang][key] || key;
  const cardName = cardId => CARD_NAMES[currentLang][cardId];
  const isEnglish = () => currentLang === 'en';

  function renderRules() {
    const zh = currentLang === 'zh';
    const copy = zh ? {
      goalTitle: '胜利目标与开局配置',
      goalSub: '双方使用完全相同的牌组。先把对方生命降到 0；若双方同时归零则平局。',
      endurance: '持久策略（默认）',
      enduranceSpec: '每方 40 HP、15 张牌',
      duel: '竞技刺客',
      duelSpec: '每方 30 HP、14 张牌',
      deckTitle: '每方牌组',
      cardCol: '牌名',
      enduranceCol: '持久模式',
      duelCol: '竞技模式',
      flowTitle: '一回合怎样进行',
      flowSub: '没有先后手：双方先暗置，再同时翻开。',
      flow: [
        ['1', '选择', '双方各从手牌打出 1 张牌。牌在揭示前对对方隐藏。'],
        ['2', '对比', '在下方矩阵中，用“你的牌”找行、用“对手的牌”找列。'],
        ['3', '同时结算', '同时处理伤害、回血、停动和回收；生命值不会超过模式上限。'],
        ['4', '进入弃牌堆', '本回合打出的牌进入各自弃牌堆，然后开始下一回合。']
      ],
      matrixTitle: '完整对比矩阵',
      matrixSub: '从行方（你）的视角阅读。负数是扣血，正数是回血。',
      yourCard: '你的牌 ↓ / 对手的牌 →',
      matrixNote: '例：你出《反唇相讥》，对手出《破口大骂》，读取“反唇相讥”这一行与“破口大骂”这一列：你 -5 HP，并在下一回合停动。',
      stunTitle: '停动与空门回合',
      stunSub: '停动只影响下一回合，不会额外丢牌。',
      stunRules: [
        ['被停动', '下一回合不能出牌，手牌保持不变；该回合结束后停动解除。'],
        ['对手停动', '你仍打出 1 张牌，按下方“空门效果”单独结算。'],
        ['双方停动', '系统自动跳过这一回合并解除双方停动，不需要点击。'],
        ['破口大骂续停', '对空门打出破口大骂只让对手继续停动，不重复扣血，避免无限伤害循环。']
      ],
      soloTitle: '对手停动时：你的空门效果',
      solo: [
        ['attack', '一', '一语道破', '对手 -10 HP'],
        ['stun', '破', '破口大骂', '对手继续停动；不造成伤害'],
        ['heal', '心', '心如止水', '自己 +10 HP'],
        ['pickup', '思', '深思熟虑', '正常回收弃牌']
      ],
      soloNote: '反唇相讥、沉默是金在空门回合没有效果，但打出的牌仍会进入弃牌堆。',
      cardsTitle: '六张牌分别做什么',
      cardsSub: '这里说明每张牌的定位；所有精确对局仍以矩阵为准。',
      cardRoles: ['直接攻击 / 被反制', '反弹 / 打断回收', '压制 / 制造停动', '安全试探 / 不被停动', '回血 / 吸收攻击', '资源回收 / 延长牌组'],
      recycleTitle: '弃牌、回收与结束',
      recycleRules: [
        ['深思熟虑', '成功时回收自己弃牌堆中除《深思熟虑》以外的全部牌。本回合打出的这张《深思熟虑》留在弃牌堆。'],
        ['反唇相讥打断', '《深思熟虑》遇到《反唇相讥》时完全不能回收。'],
        ['手牌耗尽', '当一方手牌为 0 时，自动把自己的整个弃牌堆全部拿回手中，包括《深思熟虑》。'],
        ['胜负判定', '结算后仅对手为 0：你获胜；仅你为 0：你失败；双方同时为 0：平局。']
      ]
    } : {
      goalTitle: 'Set Up the Debate',
      goalSub: 'Both players use the same set of cards. Bring your opponent to 0 HP to win. If both players hit 0 HP in the same exchange, the debate ends in a draw.',
      endurance: 'Long-Form Debate (default)',
      enduranceSpec: '40 HP and 15 cards each',
      duel: 'Quick-Fire Debate',
      duelSpec: '30 HP and 14 cards each',
      deckTitle: 'Starting Cards for Each Player',
      cardCol: 'Move',
      enduranceCol: 'Long-Form',
      duelCol: 'Quick-Fire',
      flowTitle: 'How an Exchange Works',
      flowSub: 'Neither side goes first. Both moves are locked in, then revealed at the same time.',
      flow: [
        ['1', 'Choose a move', 'Each player secretly commits 1 card from hand.'],
        ['2', 'Reveal both cards', 'Find your move’s row and your opponent’s move’s column in the table below.'],
        ['3', 'Resolve everything', 'Apply damage, healing, Shut Down, and card recovery at the same time. HP cannot exceed the mode maximum.'],
        ['4', 'Discard both cards', 'Each played card enters its owner’s spent pile, then the next exchange begins.']
      ],
      matrixTitle: 'Full Matchup Table',
      matrixSub: 'Read every result from the row player’s point of view. Minus means HP lost; plus means HP recovered.',
      yourCard: 'Your move ↓ / Their move →',
      matrixNote: 'Example: you play Throw It Back and your opponent plays Shout Them Down. Read that row and column: you lose 5 HP and are Shut Down for the next exchange.',
      stunTitle: 'Being Shut Down',
      stunSub: 'Shut Down affects the next exchange only and never makes you discard an extra card.',
      stunRules: [
        ['When you are Shut Down', 'You cannot play a card in the next exchange. Your hand stays unchanged, and Shut Down clears when that exchange ends.'],
        ['When your opponent is Shut Down', 'You still play 1 card and resolve its unanswered effect below.'],
        ['When both sides are Shut Down', 'The game skips the exchange automatically and clears both effects.'],
        ['Keep shouting them down', 'Shout Them Down against an already Shut Down opponent extends the effect but deals no damage, preventing an endless damage loop.']
      ],
      soloTitle: 'When your opponent cannot answer',
      solo: [
        ['attack', 'C', 'Cut Through the Noise', 'Hit uncontested: opponent loses 10 HP'],
        ['stun', 'S', 'Shout Them Down', 'Keep them Shut Down; deal no damage'],
        ['heal', 'K', 'Keep Your Cool', 'Recover 10 HP'],
        ['pickup', 'G', 'Gather Your Thoughts', 'Recover spent cards normally']
      ],
      soloNote: 'Throw It Back and Refuse to Engage have nothing to answer when the opponent cannot speak. The played card still enters your spent pile.',
      cardsTitle: 'What Each Move Does',
      cardsSub: 'The names show the basic logic. Use the full matchup table above for every exact result.',
      cardRoles: ['Direct point / cuts through shouting', 'Counterattack / turns a point around', 'Pressure / shuts down a reply', 'Safe non-response / cannot be shut down', 'Healing / gets stronger against shouting', 'Card recovery / rebuilds your options'],
      recycleTitle: 'Spent Cards, Recovery, and Winning',
      recycleRules: [
        ['Gather Your Thoughts', 'When it succeeds, every spent card except Gather Your Thoughts returns to your hand. The copy you just played stays spent.'],
        ['Throw It Back interrupts it', 'If Gather Your Thoughts meets Throw It Back, your train of thought is broken and no cards return.'],
        ['When your hand is empty', 'Your entire spent pile returns automatically, including Gather Your Thoughts.'],
        ['Winning the debate', 'After an exchange: only your opponent at 0 HP means you win; only you at 0 means you lose; both at 0 means a draw.']
      ]
    };

    const modeRows = CARD_NAMES[currentLang].map((name, id) => `
      <tr>
        <th scope="row">${name}</th>
        <td>${id < 4 ? 3 : (id === 4 ? 2 : 1)}</td>
        <td>${id < 4 ? 3 : 1}</td>
      </tr>
    `).join('');

    const matrixHead = CARD_NAMES[currentLang]
      .map(name => `<th scope="col">${name}</th>`)
      .join('');
    const matrixRows = CARD_NAMES[currentLang].map((name, row) => `
      <tr>
        <th scope="row">${name}</th>
        ${RULE_MATRIX_TEXT[currentLang][row].map(cell => `<td>${cell}</td>`).join('')}
      </tr>
    `).join('');

    const flowCards = copy.flow.map(([number, title, body]) => `
      <article class="rule-basic">
        <span class="rule-basic-icon">${number}</span>
        <div><strong>${title}</strong><p>${body}</p></div>
      </article>
    `).join('');

    const soloCards = copy.solo.map(([kind, icon, title, body]) => `
      <article class="solo-rule ${kind}">
        <span>${icon}</span><div><strong>${title}</strong><p>${body}</p></div>
      </article>
    `).join('');

    const cardGuides = CARD_NAMES[currentLang].map((name, id) => `
      <article class="rule-guide guide-${['y', 'f', 'p', 'c', 'x', 's'][id]}">
        <header>
          <span>${zh ? SEALS[id] : ['C', 'T', 'S', 'R', 'K', 'G'][id]}</span>
          <div>
            <h4>${name}</h4>
            <small>${copy.cardRoles[id]} · ${id < 4 ? '3 / 3' : (id === 4 ? '2 / 1' : '1 / 1')}</small>
          </div>
        </header>
        <p class="rule-guide-summary">${zh ? CARD_DESCS[id] : CARD_DESCS_EN[id]}</p>
      </article>
    `).join('');

    const ruleList = copy.recycleRules.map(([title, body]) => `
      <article class="rule-basic rule-basic-wide">
        <div><strong>${title}</strong><p>${body}</p></div>
      </article>
    `).join('');

    rulesBody.innerHTML = `
      <section class="rules-section">
        <div class="rules-section-heading"><span class="rules-step">01</span><div>
          <h3>${copy.goalTitle}</h3><p>${copy.goalSub}</p>
        </div></div>
        <div class="rules-mode-grid">
          <article><strong>${copy.endurance}</strong><span>${copy.enduranceSpec}</span></article>
          <article><strong>${copy.duel}</strong><span>${copy.duelSpec}</span></article>
        </div>
        <h4 class="rules-subheading">${copy.deckTitle}</h4>
        <div class="rules-table-scroll"><table class="deck-table">
          <thead><tr><th>${copy.cardCol}</th><th>${copy.enduranceCol}</th><th>${copy.duelCol}</th></tr></thead>
          <tbody>${modeRows}</tbody>
          <tfoot><tr><th>${zh ? '合计' : 'Total'}</th><td>15</td><td>14</td></tr></tfoot>
        </table></div>
      </section>

      <section class="rules-section">
        <div class="rules-section-heading"><span class="rules-step">02</span><div>
          <h3>${copy.flowTitle}</h3><p>${copy.flowSub}</p>
        </div></div>
        <div class="rules-basics-grid rules-flow-grid">${flowCards}</div>
      </section>

      <section class="rules-section">
        <div class="rules-section-heading"><span class="rules-step">03</span><div>
          <h3>${copy.matrixTitle}</h3><p>${copy.matrixSub}</p>
        </div></div>
        <div class="rules-table-scroll matrix-scroll"><table class="matchup-table">
          <thead><tr><th>${copy.yourCard}</th>${matrixHead}</tr></thead>
          <tbody>${matrixRows}</tbody>
        </table></div>
        <p class="rules-note">${copy.matrixNote}</p>
      </section>

      <section class="rules-section">
        <div class="rules-section-heading"><span class="rules-step">04</span><div>
          <h3>${copy.stunTitle}</h3><p>${copy.stunSub}</p>
        </div></div>
        <div class="stun-rules-list">${copy.stunRules.map(([title, body]) =>
          `<article><strong>${title}</strong><p>${body}</p></article>`
        ).join('')}</div>
        <h4 class="rules-subheading">${copy.soloTitle}</h4>
        <div class="solo-rules-grid">${soloCards}</div>
        <p class="rules-note">${copy.soloNote}</p>
      </section>

      <section class="rules-section">
        <div class="rules-section-heading"><span class="rules-step">05</span><div>
          <h3>${copy.cardsTitle}</h3><p>${copy.cardsSub}</p>
        </div></div>
        <div class="rule-card-grid">${cardGuides}</div>
      </section>

      <section class="rules-section">
        <div class="rules-section-heading"><span class="rules-step">06</span><div>
          <h3>${copy.recycleTitle}</h3>
        </div></div>
        <div class="rules-basics-grid rules-end-grid">${ruleList}</div>
      </section>
    `;
  }

  function applyLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'zh';
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh-CN';
    document.title = currentLang === 'en' ? 'Shezhan - A War of Words' : '舌战';
    document.querySelectorAll('.cover-title, .logo h1').forEach(title => {
      title.textContent = currentLang === 'en' ? 'SHEZHAN' : '舌战';
    });

    document.querySelectorAll('[data-i18n]').forEach(element => {
      const value = UI_TEXT[currentLang][element.dataset.i18n];
      if (value) element.textContent = value;
    });
    document.querySelectorAll('.language-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.lang === currentLang);
    });
    document.querySelectorAll('.log-item[data-zh][data-en]').forEach(item => {
      const prefix = item.dataset.turn ? `[${currentLang === 'en' ? 'R' : 'T'}${item.dataset.turn}] ` : '';
      item.textContent = prefix + item.dataset[currentLang];
    });

    renderRules();
    updateSessionStats();
    if (!game.isProcessing) {
      updateUI();
      if (coverScreen.classList.contains('active')) clearPlayedCards();
    }
    if (outcomeText.dataset[currentLang]) outcomeText.textContent = outcomeText.dataset[currentLang];
    if (trackerModal.classList.contains('active')) renderTracker();
  }

  document.querySelectorAll('.language-btn').forEach(button => {
    button.addEventListener('click', () => applyLanguage(button.dataset.lang));
  });

  // Difficulty Setup in Cover Screen
  document.querySelectorAll('.diff-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-select-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDiff = btn.dataset.diff;
    });
  });

  btnEnterGame.addEventListener('click', () => {
    game.init(selectedDiff);
    clearCardSelection();
    coverScreen.classList.remove('active');
    resetArenaSlots();
    updateUI();
    addLog({
      zh: `对局开始！AI 难度：${selectedDiff.toUpperCase()}`,
      en: `The debate begins. Opponent: ${selectedDiff.toUpperCase()}`
    }, 'system');
  });

  btnCoverRules.addEventListener('click', () => {
    rulesModal.classList.add('active');
  });

  btnRestart.addEventListener('click', () => {
    clearCardSelection();
    coverScreen.classList.add('active');
  });

  btnPlayAgain.addEventListener('click', () => {
    clearCardSelection();
    gameoverModal.classList.remove('active');
    coverScreen.classList.add('active');
  });

  btnCancelCard.addEventListener('click', () => clearCardSelection());
  btnConfirmCard.addEventListener('click', () => {
    if (selectedCardId !== null) {
      const sourceCard = handCardsContainer.querySelector(
        `.dock-card-wrapper[data-card-id="${selectedCardId}"]`
      );
      commitCard(selectedCardId, sourceCard);
    }
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

  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.dock-card-wrapper')) {
      hideCardTooltip();
    }
  }, { passive: true });

  function clearPlayedCards() {
    playerCardSlot.innerHTML = `<div class="slot-placeholder">${isEnglish() ? 'Choose a card...' : '等待选牌...'}</div>`;
    playerCardSlot.classList.remove('drop-ready');
    aiCardSlot.innerHTML = `<div class="slot-placeholder">${isEnglish() ? 'Waiting for AI...' : '等待出牌...'}</div>`;
  }

  function resetArenaSlots() {
    clearPlayedCards();
    outcomeBanner.classList.add('hidden');
    stunNoticeBanner.classList.add('hidden');
    clashRay.classList.add('hidden');
  }

  // Render Card 3D Element (Complete with 3D Flip animation support)
  function createCard3DHtml(cardId, isFaceDown = true) {
    if (cardId === -1) {
      return `<div class="stun-slot-badge">😵 ${isEnglish() ? 'STUNNED' : '停动跳过'}<br><small style="font-size:0.75rem;">${isEnglish() ? '(SKIPPED)' : '(SKIPPED)'}</small></div>`;
    }
    const displayName = cardName(cardId);
    const faceCopy = CARD_FACE_COPY[currentLang][cardId];
    const epigraph = CARD_EPIGRAPHS[currentLang][cardId];
    return `
      <div class="card-container-3d ${isFaceDown ? '' : 'flipped'}" data-card="${cardId}">
        <div class="card-3d-inner">
          <!-- BACK FACE (Facing user when card is face down) -->
          <div class="card-face card-face-back">
            <div class="card-back-pattern">
              <span class="card-back-quote">“</span>
              <div class="card-back-seal">舌</div>
              <span class="card-back-text">${isEnglish() ? 'SHEZHAN' : '舌战'}</span>
              <span class="card-back-sub">${isEnglish() ? 'A WAR OF WORDS' : '以言为刃'}</span>
            </div>
          </div>
          <!-- FRONT FACE (Facing user when card is flipped 180deg) -->
          <div class="card-face card-face-front">
            <div class="card-paper-lines" aria-hidden="true"></div>
            <span class="card-quote-mark" aria-hidden="true">“</span>
            <div class="card-header-bar">
              <span class="card-tactic-label">${faceCopy.type}</span>
              <span class="card-seal-stamp">${isEnglish() ? ['C', 'T', 'S', 'R', 'K', 'G'][cardId] : SEALS[cardId]}</span>
            </div>
            <div class="card-illustration" style="--card-art:url('${CARD_ART_URLS[cardId]}')" aria-hidden="true">
              <div class="art-svg-medallion">
                ${SVG_ICONS[cardId]}
              </div>
            </div>
            <span class="card-state-fx stun-fx" aria-hidden="true"></span>
            <span class="card-state-fx recover-fx" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="card-state-fx mute-fx" aria-hidden="true"><i></i><i></i><i></i></span>
            <blockquote class="card-epigraph">
              <span>“${epigraph.quote}”</span>
              <cite>—— ${epigraph.source}</cite>
            </blockquote>
            <div class="card-title-block">
              <div class="card-title-vertical ${isEnglish() ? 'card-title-en' : ''}">${displayName}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function syncCardSelectionUI() {
    const hasSelection = selectedCardId !== null;
    const recoverableCards = game.userDiscard.slice(0, 5).reduce((sum, qty) => sum + qty, 0);
    handActionBar.classList.toggle('has-selection', hasSelection);
    selectedCardName.textContent = hasSelection
      ? (
        selectedCardId === 5
          ? (isEnglish()
            ? `Chosen: Gather Your Thoughts · recover ${recoverableCards}`
            : `已选：深思熟虑 · 可捡 ${recoverableCards}`)
          : (isEnglish()
            ? `Chosen: ${cardName(selectedCardId)}`
            : `已选：${cardName(selectedCardId)}`)
      )
      : (isEnglish() ? 'Choose, or cast upward' : '点选或上拖');
    btnCancelCard.disabled = !hasSelection;
    btnConfirmCard.disabled = !hasSelection;

    handCardsContainer.querySelectorAll('.dock-card-wrapper').forEach(wrapper => {
      wrapper.classList.toggle(
        'selected',
        hasSelection && Number(wrapper.dataset.cardId) === selectedCardId
      );
    });
  }

  function clearCardSelection() {
    selectedCardId = null;
    playerCardSlot.classList.remove('drop-ready');
    arenaZone.classList.remove('drag-ready');
    syncCardSelectionUI();
  }

  function selectCard(cardId) {
    if (
      game.isProcessing
      || game.gameOver
      || game.userStunned
      || game.userHand[cardId] <= 0
    ) return;

    selectedCardId = cardId;
    syncCardSelectionUI();
  }

  function previewCardRemoval(sourceCard, cardId) {
    const qty = game.userHand[cardId];
    const qtyTag = sourceCard.querySelector('.card-qty-tag');
    sourceCard.classList.add('card-being-played');
    if (qty > 1 && qtyTag) {
      qtyTag.textContent = qty - 1;
    } else {
      if (qtyTag) qtyTag.classList.add('hidden');
      sourceCard.classList.add('last-copy-playing');
    }
  }

  function restoreCardPreview(sourceCard, cardId) {
    const qtyTag = sourceCard.querySelector('.card-qty-tag');
    sourceCard.classList.remove('card-being-played', 'last-copy-playing');
    if (qtyTag) {
      qtyTag.textContent = game.userHand[cardId];
      qtyTag.classList.remove('hidden');
    }
  }

  function createFlyingCard(cardVisual) {
    const startRect = cardVisual.getBoundingClientRect();
    const flyingCard = cardVisual.cloneNode(true);
    flyingCard.classList.add('drag-flight-card');
    Object.assign(flyingCard.style, {
      left: `${startRect.left}px`,
      top: `${startRect.top}px`,
      width: `${startRect.width}px`,
      height: `${startRect.height}px`
    });
    document.body.appendChild(flyingCard);
    return flyingCard;
  }

  function animateCardIntoArena(sourceCard, cardId, existingFlyingCard = null) {
    const cardVisual = sourceCard?.querySelector('.card-container-3d');
    if (!cardVisual) {
      handleTurn(cardId);
      return;
    }

    const flyingCard = existingFlyingCard || createFlyingCard(cardVisual);
    const startRect = flyingCard.getBoundingClientRect();
    const targetRect = playerCardSlot.getBoundingClientRect();
    Object.assign(flyingCard.style, {
      left: `${startRect.left}px`,
      top: `${startRect.top}px`,
      width: `${startRect.width}px`,
      height: `${startRect.height}px`,
      transform: 'none'
    });
    if (!sourceCard.classList.contains('card-being-played')) {
      previewCardRemoval(sourceCard, cardId);
    }
    game.isProcessing = true;

    let finished = false;
    const finishFlight = () => {
      if (finished) return;
      finished = true;
      flyingCard.remove();
      game.isProcessing = false;
      handleTurn(cardId);
    };

    if (typeof flyingCard.animate === 'function') {
      const flight = flyingCard.animate([
        {
          left: `${startRect.left}px`,
          top: `${startRect.top}px`,
          width: `${startRect.width}px`,
          height: `${startRect.height}px`,
          opacity: 1
        },
        {
          left: `${targetRect.left}px`,
          top: `${targetRect.top}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          opacity: 0.98
        }
      ], {
        duration: 230,
        easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)',
        fill: 'forwards'
      });
      flight.addEventListener('finish', finishFlight, { once: true });
      flight.addEventListener('cancel', finishFlight, { once: true });
      setTimeout(finishFlight, 270);
    } else {
      setTimeout(finishFlight, 230);
    }
  }

  function commitCard(cardId, sourceCard = null) {
    if (
      game.isProcessing
      || game.gameOver
      || game.userStunned
      || game.userHand[cardId] <= 0
    ) return;

    selectedCardId = cardId;
    if (sourceCard) animateCardIntoArena(sourceCard, cardId);
    else handleTurn(cardId);
  }

  function enableCardDrag(cardWrapper, cardId) {
    let drag = null;
    cardWrapper.draggable = false;

    const moveDrag = (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (!drag.active && Math.hypot(dx, dy) > 8) {
        drag.active = true;
        hideCardTooltip();
        drag.flyingCard = createFlyingCard(
          cardWrapper.querySelector('.card-container-3d')
        );
        drag.flyingStart = drag.flyingCard.getBoundingClientRect();
        previewCardRemoval(cardWrapper, cardId);
      }
      if (!drag.active) return;

      event.preventDefault();
      Object.assign(drag.flyingCard.style, {
        left: `${drag.flyingStart.left + dx}px`,
        top: `${drag.flyingStart.top + dy}px`
      });
      const playThreshold = Math.min(64, cardWrapper.getBoundingClientRect().height * 0.7);
      drag.canPlay = dy < -playThreshold;
      playerCardSlot.classList.toggle('drop-ready', drag.canPlay);
      arenaZone.classList.toggle('drag-ready', drag.canPlay);
    };

    const finishDrag = (event, cancelled = false) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const shouldPlay = drag.active && drag.canPlay && !cancelled;
      if (drag.active) {
        suppressCardClick = true;
        setTimeout(() => { suppressCardClick = false; }, 0);
      }
      const wasActive = drag.active;
      const flyingCard = drag.flyingCard;
      drag = null;

      if (shouldPlay) {
        animateCardIntoArena(cardWrapper, cardId, flyingCard);
      } else {
        flyingCard?.remove();
        if (wasActive) restoreCardPreview(cardWrapper, cardId);
        if (wasActive && !cancelled) selectCard(cardId);
      }
      playerCardSlot.classList.remove('drop-ready');
      arenaZone.classList.remove('drag-ready');
      window.removeEventListener('pointermove', moveDrag);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', cancelDrag);
    };

    const cancelDrag = event => finishDrag(event, true);

    cardWrapper.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (game.isProcessing || game.gameOver || game.userStunned) return;
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
        canPlay: false
      };
      window.addEventListener('pointermove', moveDrag, { passive: false });
      window.addEventListener('pointerup', finishDrag);
      window.addEventListener('pointercancel', cancelDrag);
    });
  }

  // Render Hand Dock
  function renderHandDock() {
    handCardsContainer.innerHTML = '';
    
    if (game.checkAutoPickup()) {
      addLog({
        zh: '👤 你的手牌已用光，触发【全量自动回收】！全部弃牌回到手中。',
        en: '👤 You have exhausted every argument. Your entire spent pile returns to hand.'
      }, 'heal');
    }

    if (
      selectedCardId !== null
      && (game.userStunned || game.userHand[selectedCardId] <= 0)
    ) {
      selectedCardId = null;
    }

    CARDS.forEach((card) => {
      const qty = game.userHand[card.id];
      const unavailable = qty === 0 || game.userStunned || game.isProcessing;
      const cardWrapper = document.createElement('div');
      cardWrapper.dataset.cardId = card.id;
      cardWrapper.className =
        `dock-card-wrapper ${unavailable ? 'disabled' : ''} ${selectedCardId === card.id ? 'selected' : ''}`;
      
      cardWrapper.innerHTML = `
        ${createCard3DHtml(card.id, false)}
        ${qty > 0 ? `<span class="card-qty-tag">${qty}</span>` : ''}
      `;

      cardWrapper.addEventListener('mouseenter', (e) => showCardTooltip(card.id, e));
      cardWrapper.addEventListener('mousemove', (e) => positionCardTooltip(e));
      cardWrapper.addEventListener('mouseleave', () => hideCardTooltip());

      if (!unavailable) {
        cardWrapper.addEventListener('click', (event) => {
          if (suppressCardClick) return;
          selectCard(card.id);
          if (window.matchMedia('(hover: none)').matches) {
            showCardTooltip(card.id, event);
          } else {
            hideCardTooltip();
          }
        });
        cardWrapper.addEventListener('dblclick', () => {
          if (suppressCardClick) return;
          hideCardTooltip();
          commitCard(card.id, cardWrapper);
        });
        enableCardDrag(cardWrapper, card.id);
      }

      handCardsContainer.appendChild(cardWrapper);
    });

    if (game.userStunned) {
      const stunOverlay = document.createElement('div');
      stunOverlay.className = 'hand-stun-overlay';
      stunOverlay.innerHTML = `
        <span>${isEnglish() ? '😵 You are Shut Down; your hand stays unchanged' : '😵 本回合停动，手牌保持不变'}</span>
        <button id="btn-skip-turn" class="btn btn-primary" type="button" aria-disabled="false">${isEnglish() ? '▶ Skip This Exchange' : '▶ 继续 · 跳过本回合'}</button>
      `;
      handCardsContainer.appendChild(stunOverlay);
      stunOverlay.querySelector('#btn-skip-turn')?.addEventListener('click', () => handleTurn(-1));
    }

    syncCardSelectionUI();
  }

  function showCardTooltip(cardId, e) {
    const epigraph = CARD_EPIGRAPHS[currentLang][cardId];
    tooltipTitle.textContent = cardName(cardId);
    tooltipQuote.innerHTML = `<span>“${epigraph.quote}”</span><cite>${epigraph.source}</cite>`;
    tooltipBody.textContent = isEnglish() ? CARD_DESCS_EN[cardId] : CARD_DESCS[cardId];
    hoverTooltip.classList.remove('hidden');
    positionCardTooltip(e);
  }

  function positionCardTooltip(e) {
    let clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : window.innerWidth / 2);
    let clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : window.innerHeight / 2);

    let left = clientX + 15;
    let top = clientY - 80;
    if (left + 250 > window.innerWidth) left = Math.max(10, clientX - 250);
    if (top < 10) top = clientY + 15;
    hoverTooltip.style.left = left + 'px';
    hoverTooltip.style.top = top + 'px';
  }

  function hideCardTooltip() {
    hoverTooltip.classList.add('hidden');
  }

  function renderDiscardPreview() {
    const recoverableCards = game.userDiscard.slice(0, 5).reduce((sum, qty) => sum + qty, 0);
    const discardedCards = CARDS.filter(card => game.userDiscard[card.id] > 0);

    recoverableCount.textContent = isEnglish()
      ? `Gather Your Thoughts recovers ${recoverableCards}`
      : `深思可捡 ${recoverableCards} 张`;
    userDiscardPreview.innerHTML = discardedCards.length
      ? discardedCards.map(card => {
        const qty = game.userDiscard[card.id];
        const unrecoverable = card.id === 5;
        const displayName = cardName(card.id);
        const note = unrecoverable
          ? (isEnglish() ? ' (cannot recover itself)' : '（不能被深思熟虑自身回收）')
          : '';
        return `<span class="discard-chip ${unrecoverable ? 'unrecoverable' : ''}"
          title="${displayName} ×${qty}${note}">${isEnglish() ? ['C', 'T', 'S', 'R', 'K', 'G'][card.id] : displayName.substring(0, 1)}×${qty}</span>`;
      }).join('')
      : `<span class="discard-empty">${isEnglish() ? 'Empty' : '空'}</span>`;
  }

  function renderAiHandBacks() {
    aiHandBacks.innerHTML = '';
    let count = game.getHandCount(game.aiHand);
    for (let i = 0; i < Math.min(15, count); i++) {
      const miniBack = document.createElement('div');
      miniBack.className = 'card-back-mini';
      miniBack.textContent = isEnglish() ? 'S' : '舌';
      aiHandBacks.appendChild(miniBack);
    }
  }

  function handleTurn(userCardId) {
    if (game.isProcessing || game.gameOver) return;
    clearCardSelection();
    game.isProcessing = true;
    outcomeBanner.classList.add('hidden');

    if (game.checkAiAutoPickup()) {
      addLog({
        zh: '🤖 AI 对手手牌用光，触发【全量自动回收】！',
        en: '🤖 Your opponent has exhausted every argument and gathers the entire spent pile anew.'
      }, 'system');
    }

    let aiCardId = -1;
    if (!game.aiStunned) {
      aiCardId = game.getAiChoice();
    }

    clashRay.classList.add('hidden');
    
    // Step 1: Render cards face-down into arena slots with card back animation
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
    game.recordTurn(userCardId, aiCardId);

    renderAiHandBacks();

    // Step 2: After 400ms, trigger simultaneous 3D Flip animation (rotateY(180deg))
    setTimeout(() => {
      document.querySelectorAll('.arena-card-slot .card-container-3d').forEach(el => {
        el.classList.add('flipped');
      });

      // Step 3: After flip finishes (500ms), show energy ray beam and resolve outcome
      setTimeout(() => {
        clashRay.classList.remove('hidden');

        setTimeout(() => {
          clashRay.classList.add('hidden');
          const cardFeedback = resolveOutcome(userCardId, aiCardId);
          const feedbackDelay = triggerCardFeedback(cardFeedback);
          setTimeout(() => {
            document.querySelectorAll('.arena-card-slot .card-container-3d').forEach(el => {
              el.classList.add('played-card-exit');
            });

            setTimeout(() => {
              clearPlayedCards();
              game.turn++;
              game.isProcessing = false;
              updateUI();
              checkGameOver();
            }, 220);
          }, feedbackDelay);
        }, 500);
      }, 500);
    }, 400);
  }

  function triggerCardFeedback({
    userDamage = 0,
    aiDamage = 0,
    userHealing = 0,
    aiHealing = 0,
    userStunned = false,
    aiStunned = false,
    userRecovered = false,
    aiRecovered = false,
    userMuted = false,
    aiMuted = false,
    userSilenceGuard = false,
    aiSilenceGuard = false
  } = {}) {
    const targets = [
      {
        damage: userDamage,
        healing: userHealing,
        stunned: userStunned,
        recovered: userRecovered,
        muted: userMuted,
        silenceGuard: userSilenceGuard,
        card: playerCardSlot.querySelector('.card-container-3d'),
        sideClass: 'impact-user'
      },
      {
        damage: aiDamage,
        healing: aiHealing,
        stunned: aiStunned,
        recovered: aiRecovered,
        muted: aiMuted,
        silenceGuard: aiSilenceGuard,
        card: aiCardSlot.querySelector('.card-container-3d'),
        sideClass: 'impact-ai'
      }
    ];
    let feedbackDelay = 0;

    targets.forEach(({
      damage,
      healing,
      stunned,
      recovered,
      muted,
      silenceGuard,
      card,
      sideClass
    }) => {
      if (!card) return;
      if (damage > 0) {
        const tierClass = damage >= 15
          ? 'impact-heavy'
          : (damage >= 10 ? 'impact-medium' : 'impact-light');
        card.classList.add('impact-hit', sideClass, tierClass);
        const impactDuration = damage >= 15 ? 720 : (damage >= 10 ? 640 : 560);
        feedbackDelay = Math.max(feedbackDelay, impactDuration);
      } else if (healing > 0) {
        card.classList.add('impact-heal');
        feedbackDelay = Math.max(feedbackDelay, 700);
      }
      if (stunned) {
        card.classList.add('status-stun');
        feedbackDelay = Math.max(feedbackDelay, 820);
      }
      if (recovered) {
        card.classList.add('status-recover');
        feedbackDelay = Math.max(feedbackDelay, 820);
      }
      if (muted) {
        card.classList.add('effect-muted', sideClass);
        feedbackDelay = Math.max(feedbackDelay, 720);
      }
      if (silenceGuard) {
        card.classList.add('silence-guard');
        feedbackDelay = Math.max(feedbackDelay, 720);
      }
    });

    return feedbackDelay;
  }

  function resolveOutcome(uId, aId) {
    let outcomeStr = '';
    let outcomeEn = '';
    let userRecovered = false;
    let aiRecovered = false;
    const userHpBefore = game.userHp;
    const aiHpBefore = game.aiHp;
    
    if (uId !== -1 && aId !== -1) {
      let cell = MATRIX[uId][aId];
      game.userHp += cell.A;
      game.aiHp += cell.B;
      
      game.userStunned = cell.sA;
      game.aiStunned = cell.sB;

      if (cell.pA) {
        userRecovered = game.userDiscard.slice(0, 5).some(qty => qty > 0);
        for(let k=0; k<5; k++) { game.userHand[k] += game.userDiscard[k]; game.userDiscard[k] = 0; }
        if (aId === 2) {
          addLog({
            zh: '👤 你打出《深思熟虑》遭遇《破口大骂》：虽受到 -5 伤害并被【停动】，但成功回收了全部弃牌！',
            en: '👤 They Shout You Down: take 5 damage and become Shut Down—but you still Gather Your Thoughts and recover your cards.'
          }, 'heal');
        } else {
          addLog({
            zh: '👤 你使用了《深思熟虑》，成功回收了已打出的手牌！',
            en: '👤 You Gather Your Thoughts. Every eligible spent card returns to your hand.'
          }, 'heal');
        }
      } else if (uId === 5) {
        addLog({
          zh: '⚠️ 你的《深思熟虑》遭遇《反唇相讥》，回收被打断！',
          en: '⚠️ They Throw It Back and break your train of thought. Your recovery fails.'
        }, 'dmg');
      }

      if (cell.pB) {
        aiRecovered = game.aiDiscard.slice(0, 5).some(qty => qty > 0);
        for(let k=0; k<5; k++) { game.aiHand[k] += game.aiDiscard[k]; game.aiDiscard[k] = 0; }
        if (uId === 2) {
          addLog({
            zh: '🤖 AI打出《深思熟虑》遭遇《破口大骂》：虽受到 -5 伤害并被【停动】，但成功回收了全部弃牌！',
            en: '🤖 You Shout Them Down: they take 5 damage and become Shut Down—but they still Gather Their Thoughts and recover their cards.'
          }, 'system');
        } else {
          addLog({
            zh: '🤖 AI 使用了《深思熟虑》，成功回收了已打出的手牌！',
            en: '🤖 Your opponent Gathers Their Thoughts. Every eligible spent card returns to their hand.'
          }, 'system');
        }
      } else if (aId === 5) {
        addLog({
          zh: '⚠️ AI 的《深思熟虑》遭遇《反唇相讥》，回收被打断！',
          en: '⚠️ You Throw It Back and break their train of thought. Their recovery fails.'
        }, 'heal');
      }

      outcomeStr = `【对决】你出《${CARDS[uId].name}》，AI 出《${CARDS[aId].name}》。${describeMatrixEffects(uId, aId, cell)}`;
      outcomeEn = describeShowdownEn(uId, aId, cell);

    } else if (uId !== -1 && aId === -1) {
      // 停动时没有对手牌可供结算；破口大骂只续停动，不重复扣血。
      game.aiStunned = false;
      if (uId === 0) {
        game.aiHp -= 10;
        outcomeStr = `AI本轮因【停动】未出牌；你的《一语道破》直接攻击，AI -10 HP。`;
        outcomeEn = 'Your opponent is Shut Down. You Cut Through the Noise uncontested: they take 10 damage.';
      }
      else if (uId === 2) {
        game.aiStunned = true;
        outcomeStr = `AI本轮因【停动】未出牌；《破口大骂》续接【停动】，但不造成伤害。`;
        outcomeEn = 'Your opponent is already Shut Down. You keep Shouting Them Down: no damage, but they stay Shut Down.';
      }
      else if (uId === 4) {
        game.userHp += 10;
        outcomeStr = `AI本轮因【停动】未出牌；你的《心如止水》恢复 +10 HP。`;
        outcomeEn = 'Your opponent cannot answer. You Keep Your Cool and recover 10 HP.';
      }
      else if (uId === 5) { 
        userRecovered = game.userDiscard.slice(0, 5).some(qty => qty > 0);
        for(let k=0; k<5; k++) { game.userHand[k] += game.userDiscard[k]; game.userDiscard[k] = 0; }
        outcomeStr = `AI本轮因【停动】未出牌；你用《深思熟虑》回收了除本牌外的弃牌。`;
        outcomeEn = 'Your opponent cannot answer. You Gather Your Thoughts and recover every eligible spent card.';
      } else {
        outcomeStr = `AI本轮因【停动】未出牌；《${CARDS[uId].name}》没有对手牌可供结算。`;
        outcomeEn = `Your opponent is Shut Down. ${CARD_NAMES.en[uId]} has nothing to answer and does nothing.`;
      }

    } else if (uId === -1 && aId !== -1) {
      // 与上面的玩家分支保持完全对称。
      game.userStunned = false;
      if (aId === 0) {
        game.userHp -= 10;
        outcomeStr = `你本轮因【停动】未出牌；AI 的《一语道破》直接攻击，你 -10 HP。`;
        outcomeEn = 'You are Shut Down. They Cut Through the Noise uncontested: you take 10 damage.';
      }
      else if (aId === 2) {
        game.userStunned = true;
        outcomeStr = `你本轮因【停动】未出牌；AI 的《破口大骂》续接【停动】，但不造成伤害。`;
        outcomeEn = 'You are already Shut Down. They keep Shouting You Down: no damage, but you stay Shut Down.';
      }
      else if (aId === 4) {
        game.aiHp += 10;
        outcomeStr = `你本轮因【停动】未出牌；AI 的《心如止水》恢复 +10 HP。`;
        outcomeEn = 'You cannot answer. Your opponent Keeps Their Cool and recovers 10 HP.';
      }
      else if (aId === 5) {
        aiRecovered = game.aiDiscard.slice(0, 5).some(qty => qty > 0);
        for(let k=0; k<5; k++) { game.aiHand[k] += game.aiDiscard[k]; game.aiDiscard[k] = 0; }
        outcomeStr = `你本轮因【停动】未出牌；AI 用《深思熟虑》回收了除本牌外的弃牌。`;
        outcomeEn = 'You cannot answer. Your opponent Gathers Their Thoughts and recovers every eligible spent card.';
      } else {
        outcomeStr = `你本轮因【停动】未出牌；AI 的《${CARDS[aId].name}》没有对手牌可供结算。`;
        outcomeEn = `You are Shut Down. Their ${CARD_NAMES.en[aId]} has nothing to answer and does nothing.`;
      }

    } else {
      game.userStunned = false;
      game.aiStunned = false;
      outcomeStr = `双方均处于【停动】状态，本回合平稳过档！`;
      outcomeEn = 'Both sides are Shut Down. The exchange is skipped, and both effects clear.';
    }

    game.userHp = Math.min(game.maxHp, Math.max(0, game.userHp));
    game.aiHp = Math.min(game.maxHp, Math.max(0, game.aiHp));

    const healthFeedback = {
      userDamage: Math.max(0, userHpBefore - game.userHp),
      aiDamage: Math.max(0, aiHpBefore - game.aiHp),
      userHealing: Math.max(0, game.userHp - userHpBefore),
      aiHealing: Math.max(0, game.aiHp - aiHpBefore),
      userStunned: game.userStunned,
      aiStunned: game.aiStunned,
      userRecovered,
      aiRecovered,
      userMuted: aId === 3 && (uId === 0 || uId === 1),
      aiMuted: uId === 3 && (aId === 0 || aId === 1),
      userSilenceGuard: uId === 3 && (aId === 0 || aId === 1),
      aiSilenceGuard: aId === 3 && (uId === 0 || uId === 1)
    };
    renderHealthBars(healthFeedback);

    outcomeBanner.classList.remove('hidden');
    outcomeText.dataset.zh = outcomeStr;
    outcomeText.dataset.en = outcomeEn;
    outcomeText.textContent = currentLang === 'en' ? outcomeEn : outcomeStr;
    addLog({ zh: outcomeStr, en: outcomeEn }, (game.userHp > game.aiHp) ? 'heal' : 'dmg');

    return healthFeedback;
  }

  function renderHealthBars(feedback = null) {
    const healthRows = [
      {
        fill: userHpBar,
        text: userHpText,
        hp: game.userHp,
        damage: feedback?.userDamage || 0,
        healing: feedback?.userHealing || 0
      },
      {
        fill: aiHpBar,
        text: aiHpText,
        hp: game.aiHp,
        damage: feedback?.aiDamage || 0,
        healing: feedback?.aiHealing || 0
      }
    ];

    healthRows.forEach(({ fill, text, hp, damage, healing }) => {
      fill.style.width = `${(hp / game.maxHp * 100).toFixed(1)}%`;
      text.textContent = `${hp}/${game.maxHp}`;
      if (!feedback || (!damage && !healing)) return;

      const wrapper = fill.closest('.hp-wrapper');
      wrapper.classList.remove('hp-loss', 'hp-gain');
      void wrapper.offsetWidth;
      wrapper.classList.add(damage > 0 ? 'hp-loss' : 'hp-gain');
      setTimeout(() => wrapper.classList.remove('hp-loss', 'hp-gain'), 620);
    });
  }

  function updateUI() {
    if (game.userStunned && game.aiStunned && game.userHp > 0 && game.aiHp > 0) {
      const skippedTurn = game.turn;
      addLog({
        zh: `双方均处于【停动】状态，第 ${skippedTurn} 回合已自动跳过。`,
        en: `Both sides are Shut Down. Exchange ${skippedTurn} is skipped.`
      }, 'stun');
      game.consumeMutualStunTurn();
    }

    turnCounter.textContent = isEnglish() ? `ROUND ${game.turn}` : `第 ${game.turn} 回合`;
    
    renderHealthBars();

    userHandCount.textContent = game.getHandCount(game.userHand);
    aiHandCount.textContent = game.getHandCount(game.aiHand);

    if (game.userStunned) userStunBadge.classList.remove('hidden');
    else userStunBadge.classList.add('hidden');

    if (game.aiStunned) aiStunBadge.classList.remove('hidden');
    else aiStunBadge.classList.add('hidden');

    if (game.aiStunned && !game.userStunned) {
      stunNoticeBanner.classList.remove('hidden');
      stunNoticeText.textContent = isEnglish()
        ? '😵 Your opponent is Shut Down. You get a free move.'
        : '😵 提示：AI 处于【停动】状态！本回合无法出牌，你可以单方面自由出牌！';
    } else if (game.userStunned && !game.aiStunned) {
      stunNoticeBanner.classList.remove('hidden');
      stunNoticeText.textContent = isEnglish()
        ? '😵 You are Shut Down. Skip this exchange.'
        : '😵 提示：你处于【停动】状态！本回合无法出牌，请点击跳过回合。';
    } else if (game.userStunned && game.aiStunned) {
      stunNoticeBanner.classList.remove('hidden');
      stunNoticeText.textContent = isEnglish()
        ? '😵 Both sides are Shut Down. This exchange skips automatically.'
        : '😵 提示：双方均处于【停动】状态！';
    } else {
      stunNoticeBanner.classList.add('hidden');
    }

    aiDiffTag.textContent = (game.difficulty === 'master')
      ? (isEnglish() ? '🧠 Master Orator' : '🧠 大师 AI')
      : (game.difficulty === 'medium'
        ? (isEnglish() ? '⚖️ Seasoned Speaker' : '⚖️ 中级 AI')
        : (isEnglish() ? '🎲 Impulsive Speaker' : '🎲 随机 AI'));

    renderAiHandBacks();
    renderDiscardPreview();
    renderHandDock();
  }

  function addLog(text, type = 'system') {
    const localized = typeof text === 'string' ? { zh: text, en: text } : text;
    const pEl = document.createElement('p');
    pEl.className = `log-item ${type}`;
    pEl.dataset.zh = localized.zh;
    pEl.dataset.en = localized.en;
    pEl.dataset.turn = game.turn;
    pEl.textContent = `[${isEnglish() ? 'R' : 'T'}${game.turn}] ${localized[currentLang]}`;
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
        <span>${cardName(card.id)}</span>
        <strong>${game.aiHand[card.id]} ${isEnglish() ? '' : '张'}</strong>
      </div>`;

      userList.innerHTML += `<div class="tracker-item">
        <span>${cardName(card.id)}</span>
        <strong>${game.userHand[card.id]} ${isEnglish() ? '' : '张'}</strong>
      </div>`;
    });
  }

  function updateSessionStats() {
    const stats = game.sessionStats;
    sessionWins.textContent = stats.wins;
    sessionLosses.textContent = stats.losses;
    sessionDraws.textContent = stats.draws;
    sessionGames.textContent = isEnglish() ? `${stats.games} games` : `${stats.games} 局`;
    const winRate = game.getSessionWinRate();
    sessionWinRate.textContent = winRate === null ? '—' : `${winRate}%`;
    gameoverSessionRecord.textContent = isEnglish()
      ? `This session: ${stats.wins} W · ${stats.losses} L · ${stats.draws} D`
      : `本次游玩：${stats.wins} 胜 · ${stats.losses} 负 · ${stats.draws} 平`;
  }

  function checkGameOver() {
    if (game.userHp <= 0 || game.aiHp <= 0) {
      game.gameOver = true;
      const result = game.userHp > 0 && game.aiHp <= 0
        ? 'win'
        : (game.userHp <= 0 && game.aiHp > 0 ? 'loss' : 'draw');
      game.recordGameResult(result);
      updateSessionStats();
      setTimeout(() => {
        gameoverModal.classList.add('active');
        const title = document.getElementById('gameover-title');
        const desc = document.getElementById('gameover-desc');
        document.getElementById('stat-turns').textContent = game.turn;
        document.getElementById('stat-hp').textContent = game.userHp + ' HP';

        if (result === 'win') {
          title.textContent = isEnglish() ? '🏆 You win the argument!' : '🏆 辩论压制，战斗胜利！';
          title.style.color = '#15803d';
          desc.textContent = isEnglish()
            ? 'You read their replies, found the opening, and landed the final point.'
            : `你凭借高超的词锋与手牌推演，成功击败了 ${selectedDiff.toUpperCase()} AI！`;
        } else if (result === 'loss') {
          title.textContent = isEnglish() ? '💀 You have been outargued.' : '💀 辩词匮乏，遗憾战败！';
          title.style.color = '#b91c1c';
          desc.textContent = isEnglish()
            ? 'Your opponent read your moves and shut down your final reply.'
            : 'AI 在残局中看破了你的手牌，你未能存活下来。';
        } else {
          title.textContent = isEnglish() ? '🤝 Nobody gets the last word.' : '🤝 同归于尽，双方平局！';
          title.style.color = '#d97706';
          desc.textContent = isEnglish()
            ? 'Both sides hit 0 HP in the same final exchange. The debate ends in a draw.'
            : '双方辩手在最后一个回合同时耗尽了最后一口气。';
        }
      }, 500);
    }
  }

  applyLanguage('zh');
});
