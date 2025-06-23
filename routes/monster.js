const express = require('express');
const router = express.Router();
const Monster = require('../models/Monster');

// 認証ミドルウェア
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// 管理者判定
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// ユーザー用: 自分の討伐履歴
router.get('/my-kills', requireAuth, async (req, res) => {
  const logs = await Monster.getMonsterKillsByUser(req.session.user.id);
  res.json(logs);
});

// 管理者用: 全ユーザー討伐履歴
router.get('/all-kills', requireAuth, isAdmin, async (req, res) => {
  const logs = await Monster.getAllMonsterKills();
  res.json(logs);
});

// 管理者用: モンスター報酬の更新
router.post('/reward', requireAuth, isAdmin, async (req, res) => {
  const { monsterId, reward } = req.body;
  await Monster.updateMonsterReward(monsterId, reward);
  res.json({ status: 'ok' });
});

// 管理者用: モンスター報酬・強さの更新
router.post('/update', requireAuth, isAdmin, async (req, res) => {
  const { monsterId, reward, strength } = req.body;
  if (typeof reward !== 'undefined') {
    await Monster.updateMonsterReward(monsterId, reward);
  }
  if (typeof strength !== 'undefined') {
    await Monster.updateMonsterStrength(monsterId, strength);
  }
  res.json({ status: 'ok' });
});

// 管理者・ユーザー共通: モンスター一覧取得
router.get('/list', requireAuth, async (req, res) => {
  const monsters = await Monster.getAllMonsters();
  res.json(monsters);
});

module.exports = router; 