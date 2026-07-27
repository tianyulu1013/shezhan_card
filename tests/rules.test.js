const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const appPath = path.join(__dirname, '..', 'app.js');
const source = `${fs.readFileSync(appPath, 'utf8')}
globalThis.__rulesForTest = { MATRIX, describeMatrixEffects };`;
const sandbox = {
  document: { addEventListener() {} },
  console,
  setTimeout,
  clearTimeout
};

vm.runInNewContext(source, sandbox, { filename: appPath });
const { MATRIX, describeMatrixEffects } = sandbox.__rulesForTest;
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

console.log('核心规则矩阵、空门结算、续停动与零效果反馈校验通过。');
