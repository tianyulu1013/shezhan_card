const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const appPath = path.join(__dirname, '..', 'app.js');
const source = `${fs.readFileSync(appPath, 'utf8')}
globalThis.__rulesForTest = { MATRIX, describeMatrixEffects, describeShowdownEn, ShezhanGame };`;
const sandbox = {
  document: { addEventListener() {} },
  console,
  setTimeout,
  clearTimeout
};

vm.runInNewContext(source, sandbox, { filename: appPath });
const { MATRIX, describeMatrixEffects, describeShowdownEn, ShezhanGame } = sandbox.__rulesForTest;
const signature = ({ A, B, sA, sB, pA, pB }) =>
  [A, B, Number(sA), Number(sB), Number(pA), Number(pB)];

// 核心 PDF：每项依次为己方 HP、对方 HP、己方停动、对方停动、
// 己方捡牌、对方捡牌。
const expected = [
  [[-10,-10,0,0,0,0],[-10,0,0,0,0,0],[0,-15,0,0,0,0],[0,0,0,0,0,0],[0,-10,0,0,0,0],[0,-10,0,0,0,1]],
  [[0,-10,0,0,0,0],[0,0,0,0,0,0],[-5,0,1,0,0,0],[0,0,0,0,0,0],[0,10,0,0,0,0],[0,0,0,0,0,0]],
  [[-15,0,0,0,0,0],[0,-5,0,1,0,0],[-5,-5,1,1,0,0],[0,-5,0,0,0,0],[0,15,0,0,0,0],[0,-5,0,1,0,1]],
  [[0,0,0,0,0,0],[0,0,0,0,0,0],[-5,0,0,0,0,0],[0,0,0,0,0,0],[0,10,0,0,0,0],[0,0,0,0,0,1]],
  [[-10,0,0,0,0,0],[10,0,0,0,0,0],[15,0,0,0,0,0],[10,0,0,0,0,0],[10,10,0,0,0,0],[10,0,0,0,0,1]],
  [[-10,0,0,0,1,0],[0,0,0,0,0,0],[-5,0,1,0,1,0],[0,0,0,0,1,0],[0,10,0,0,1,0],[0,0,0,0,1,1]]
];

assert.equal(
  JSON.stringify(MATRIX.map(row => row.map(signature))),
  JSON.stringify(expected)
);
const playerSolo = source.slice(
  source.indexOf('} else if (uId !== -1 && aId === -1)'),
  source.indexOf('} else if (uId === -1 && aId !== -1)')
);
const aiSolo = source.slice(
  source.indexOf('} else if (uId === -1 && aId !== -1)'),
  source.indexOf('} else {', source.indexOf('} else if (uId === -1 && aId !== -1)'))
);
assert.match(playerSolo, /game\.aiStunned = true;[\s\S]*《破口大骂》续接【停动】，但不造成伤害/);
assert.match(playerSolo, /uId === 0[\s\S]*game\.aiHp -= 10/);
assert.match(aiSolo, /game\.userStunned = true;[\s\S]*AI 的《破口大骂》续接【停动】，但不造成伤害/);
assert.match(aiSolo, /aId === 0[\s\S]*game\.userHp -= 10/);

const playerSoloP = playerSolo.slice(
  playerSolo.indexOf('else if (uId === 2)'),
  playerSolo.indexOf('else if (uId === 4)')
);
const aiSoloP = aiSolo.slice(
  aiSolo.indexOf('else if (aId === 2)'),
  aiSolo.indexOf('else if (aId === 4)')
);
assert.doesNotMatch(playerSoloP, /game\.aiHp\s*[+-]=/);
assert.doesNotMatch(aiSoloP, /game\.userHp\s*[+-]=/);
assert.match(playerSolo, /uId === 4[\s\S]*game\.userHp \+= 10/);
assert.match(aiSolo, /aId === 4[\s\S]*game\.aiHp \+= 10/);
assert.match(playerSolo, /uId === 5[\s\S]*game\.userHand\[k\] \+= game\.userDiscard\[k\]/);
assert.match(aiSolo, /aId === 5[\s\S]*game\.aiHand\[k\] \+= game\.aiDiscard\[k\]/);

assert.equal(
  describeMatrixEffects(3, 3, MATRIX[3][3]),
  '双方均无伤害、无停动、无捡牌效果。'
);
assert.equal(
  describeMatrixEffects(1, 3, MATRIX[1][3]),
  '双方均无伤害、无停动、无捡牌效果。'
);
assert.match(
  describeMatrixEffects(5, 1, MATRIX[5][1]),
  /你的捡牌被《反唇相讥》打断/
);
assert.match(
  describeShowdownEn(0, 2, MATRIX[0][2]),
  /Cut Through the Noise[\s\S]*15 damage/,
  '英文日志应解释一语道破为何克制破口大骂'
);
assert.match(
  describeShowdownEn(4, 2, MATRIX[4][2]),
  /Keep Your Cool[\s\S]*recover 15 HP/,
  '英文日志应解释心如止水为何吸收破口大骂'
);
assert.match(
  describeShowdownEn(3, 2, MATRIX[3][2]),
  /Refuse to Engage[\s\S]*5 damage[\s\S]*not Shut Down/,
  '英文日志应体现沉默是金只受到小伤且不停动'
);

const tacticalGame = new ShezhanGame();
tacticalGame.init('competitive', 'master');
tacticalGame.userStunned = true;
tacticalGame.userHp = 10;
tacticalGame.aiHand = [1, 0, 0, 0, 0, 1];
assert.equal(tacticalGame.getAiChoice(), 0, '大师 AI 应优先完成空门斩杀');

const fullHpState = {
  maxHp: 30,
  userHp: 30,
  aiHp: 30,
  userStunned: false,
  aiStunned: false,
  userHand: [0, 0, 1, 0, 0, 0],
  aiHand: [0, 0, 0, 0, 1, 0],
  userDiscard: [0, 0, 0, 0, 0, 0],
  aiDiscard: [0, 0, 0, 0, 0, 0]
};
assert.equal(
  tacticalGame.evaluatePair(fullHpState, 2, 4),
  0,
  '满血时不应把溢出的 +15 HP 当成收益'
);

const probabilityState = {
  ...fullHpState,
  userHand: [3, 1, 0, 0, 0, 0]
};
assert.deepEqual(
  tacticalGame.getPlayerProbabilities(probabilityState, false).map(
    item => [item.card, item.probability]
  ),
  [[0, 0.75], [1, 0.25]]
);

const repeatReadState = {
  ...fullHpState,
  userHand: [2, 3, 3, 3, 1, 1]
};
tacticalGame.userPlayHistory = [0];
const afterOneDirectAttack = tacticalGame
  .getPlayerProbabilities(repeatReadState, true)
  .find(item => item.card === 0).probability;
assert.ok(
  afterOneDirectAttack > 0.66,
  '大师 AI 看到首轮一语道破后，应显著防范玩家再次使用'
);

tacticalGame.userPlayHistory = [0, 0];
repeatReadState.userHand[0] = 1;
const afterTwoDirectAttacks = tacticalGame
  .getPlayerProbabilities(repeatReadState, true)
  .find(item => item.card === 0).probability;
assert.ok(
  afterTwoDirectAttacks > 0.81,
  '大师 AI 看到连续两次一语道破后，应强烈识别重复套路'
);

function sampleDirectAttackCounter(history, sampleSize = 500) {
  const counterGame = new ShezhanGame();
  counterGame.init('competitive', 'master');
  counterGame.turn = history.length + 1;
  counterGame.userPlayHistory = [...history];
  counterGame.userHand = [3 - history.length, 3, 3, 3, 1, 1];
  counterGame.userDiscard = [history.length, 0, 0, 0, 0, 0];
  counterGame.aiPersonality = 'balanced';

  let counters = 0;
  for (let i = 0; i < sampleSize; i++) {
    if (counterGame.getAiChoice() === 1) counters++;
  }
  return counters / sampleSize;
}

assert.ok(
  sampleDirectAttackCounter([0]) > 0.5,
  '大师 AI 在首轮一语道破后应以反唇相讥为主要应对'
);
assert.ok(
  sampleDirectAttackCounter([0, 0]) > 0.75,
  '大师 AI 应高概率惩罚连续两轮一语道破'
);

const variedChoices = new Set();
for (let i = 0; i < 100; i++) {
  variedChoices.add(tacticalGame.chooseFromScores([0, 1, 2], [5, 5, 5], 2.8));
}
assert.ok(variedChoices.size > 1, '同分合理牌之间应保留随机性');

tacticalGame.aiPersonality = 'balanced';
assert.deepEqual(
  tacticalGame.getOpeningWeights([0, 1, 2, 3]),
  [3, 2.5, 2.5, 2],
  '均衡大师开局应使用 30/25/25/20 的混合策略'
);
const openingChoices = new Set();
for (let i = 0; i < 100; i++) {
  openingChoices.add(
    tacticalGame.chooseFromWeights([0, 1, 2, 3], tacticalGame.getOpeningWeights([0, 1, 2, 3]))
  );
}
assert.ok(openingChoices.size > 1, '大师开局不应固定使用一语道破');
assert.doesNotMatch(source, /\bfetch\s*\(|\blocalStorage\b/, 'AI 必须保持纯静态网页实现');

const statsGame = new ShezhanGame();
assert.equal(
  JSON.stringify(statsGame.sessionStats),
  JSON.stringify({ wins: 0, losses: 0, draws: 0, games: 0 }),
  '会话统计初始值应全部为 0'
);
assert.equal(statsGame.getSessionWinRate(), null, '尚未完成对局时不应计算胜率');
assert.equal(statsGame.recordGameResult('win'), true, '首次记录胜利应成功');
assert.equal(statsGame.recordGameResult('loss'), false, '同一局不能重复记录结果');
assert.equal(
  JSON.stringify(statsGame.sessionStats),
  JSON.stringify({ wins: 1, losses: 0, draws: 0, games: 1 }),
  '胜利应同时增加胜场与总局数'
);
assert.equal(statsGame.getSessionWinRate(), 100, '一胜零负时胜率应为 100%');

statsGame.init('competitive', 'master');
assert.equal(
  JSON.stringify(statsGame.sessionStats),
  JSON.stringify({ wins: 1, losses: 0, draws: 0, games: 1 }),
  '重新开局不应清除当前页面的会话统计'
);
assert.equal(statsGame.recordGameResult('loss'), true, '新一局应允许记录结果');
assert.equal(statsGame.getSessionWinRate(), 50, '一胜一负时胜率应为 50%');

statsGame.init('casual', 'easy');
assert.equal(statsGame.recordGameResult('draw'), true, '应能记录平局');
assert.equal(
  JSON.stringify(statsGame.sessionStats),
  JSON.stringify({ wins: 1, losses: 1, draws: 1, games: 3 }),
  '平局应增加平局数与总局数'
);
assert.equal(statsGame.getSessionWinRate(), 33, '胜率应按总局数四舍五入');

const mutualStunGame = new ShezhanGame();
mutualStunGame.init('casual', 'master');
mutualStunGame.turn = 6;
mutualStunGame.userStunned = true;
mutualStunGame.aiStunned = true;
assert.equal(mutualStunGame.consumeMutualStunTurn(), true, '双方停动回合应自动消耗');
assert.equal(mutualStunGame.turn, 7, '自动跳过双方停动时应推进一回合');
assert.equal(mutualStunGame.userStunned, false, '自动跳过后应解除玩家停动');
assert.equal(mutualStunGame.aiStunned, false, '自动跳过后应解除 AI 停动');

mutualStunGame.userStunned = true;
mutualStunGame.aiStunned = true;
mutualStunGame.userHp = 0;
assert.equal(
  mutualStunGame.consumeMutualStunTurn(),
  false,
  '双方停动但已有角色归零时，应直接结算而不是继续跳回合'
);
assert.equal(mutualStunGame.turn, 7, '游戏结束时不应额外推进回合');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
const handRenderSource = source.slice(
  source.indexOf('function renderHandDock()'),
  source.indexOf('function showCardTooltip')
);

assert.match(html, /id="btn-confirm-card"/, '手牌区应提供明确的确认出牌按钮');
assert.match(html, /id="btn-cancel-card"/, '玩家应能取消当前选牌');
assert.match(
  html,
  /class="mode-select-btn active" data-mode="casual"/,
  '持久策略模式应作为默认推荐模式'
);
assert.match(html, /id="user-discard-preview"/, '界面应常驻显示玩家弃牌堆');
assert.match(
  handRenderSource,
  /addEventListener\('click'[\s\S]*selectCard\(card\.id\)/,
  '单击手牌应只进入选中状态'
);
assert.match(
  handRenderSource,
  /addEventListener\('dblclick'[\s\S]*commitCard\(card\.id,\s*cardWrapper\)/,
  '双击手牌应直接出牌'
);
assert.match(
  handRenderSource,
  /CARDS\.forEach[\s\S]*if \(game\.userStunned\)[\s\S]*hand-stun-overlay/,
  '停动时应保留六张手牌并覆盖跳过提示'
);
assert.match(
  handRenderSource,
  /id="btn-skip-turn"[\s\S]*aria-disabled="false"/,
  '停动跳过按钮应明确标记为可用状态'
);
assert.match(
  styles,
  /@media \(max-width: 768px\)[\s\S]*\.hand-cards-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(6/,
  '手机端六种手牌应使用单屏六列布局'
);
assert.match(source, /drag\.canPlay = dy < -playThreshold/, '向上拖过阈值后应允许松手出牌');
assert.match(source, /function animateCardIntoArena\(/, '出牌应从原手牌位置飞入中央');
assert.match(
  source,
  /function previewCardRemoval\([\s\S]*qtyTag\.textContent = qty - 1/,
  '拖出叠放手牌时应立即显示剩余副本数量'
);
assert.match(source, /function renderDiscardPreview\(\)/, '应渲染弃牌及可回收数量');
assert.match(source, /function clearPlayedCards\(\)/, '每回合结算后应收走中央旧牌');
assert.match(html, /class="language-btn active"[^>]*data-lang="zh"/, '语言切换应默认中文');
assert.match(html, /class="language-btn"[^>]*data-lang="en"/, '界面应提供英文切换按钮');
assert.match(html, /id="rules-body"/, '规则手册应使用可切换语言的动态内容区');
assert.match(source, /const CARD_NAMES = \{[\s\S]*Cut Through the Noise[\s\S]*Gather Your Thoughts/, '六张牌应有完整英文名称');
assert.match(source, /const RULE_MATRIX_TEXT = \{[\s\S]*双方 -10[\s\S]*Both -10/, '完整对比矩阵应同时提供中英文');
assert.match(source, /function applyLanguage\(lang\)/, '语言切换应同步更新游戏界面');
assert.match(source, /applyLanguage\('zh'\)/, '页面加载时应默认使用中文');
assert.match(source, /const CARD_EPIGRAPHS = \{[\s\S]*辞达而已矣[\s\S]*Words need only hit their mark/, '牌面题跋应提供自然的中英文版本');
assert.match(source, /class="card-illustration"[\s\S]*class="card-epigraph"/, '正面牌应包含半幅插画与题跋');
assert.match(styles, /\.arena-zone \.card-epigraph\s*\{\s*display:\s*block/, '题跋应只在场中央大牌上展开');
assert.match(source, /function triggerCardFeedback\(/, '应集中处理牌面结算反馈');
assert.match(source, /impact-light/, '应提供轻度受击反馈');
assert.match(source, /impact-medium/, '应提供中度受击反馈');
assert.match(source, /impact-heavy/, '应提供重度受击反馈');
assert.match(source, /impact-heal[\s\S]*status-stun[\s\S]*status-recover[\s\S]*effect-muted/, '回血、停动、回收和沉默抵消应有独立牌面反馈');
assert.match(source, /function renderHealthBars\([\s\S]*hp-loss[\s\S]*hp-gain/, '血条应区分受伤和回血反馈');
assert.match(styles, /@keyframes cardImpact[\s\S]*@keyframes cardHealing[\s\S]*@keyframes stunStamp[\s\S]*@keyframes recoverSlip/, '结算动画关键帧应完整存在');
assert.match(html, /id="tooltip-quote"/, '牌面说明框应展示名言与出处');
assert.match(source, /const impactDuration = damage >= 15 \? 720/, '重度受击动画应保留足够辨识时间');
assert.match(styles, /\.arena-zone \.card-epigraph span\s*\{[\s\S]*font-size:\s*0\.62rem/, '中央牌题跋应清晰可读');
[
  'cut-through.webp',
  'throw-back.webp',
  'shout-down.webp',
  'refuse-engage.webp',
  'keep-cool.webp',
  'gather-thoughts.webp'
].forEach(file => {
  assert.equal(
    fs.existsSync(path.join(__dirname, '..', 'assets', 'cards', file)),
    true,
    `缺少牌面插画：${file}`
  );
});

console.log('核心规则、空门结算与静态概率 AI 校验通过。');
