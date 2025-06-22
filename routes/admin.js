const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');
const PurchaseHistory = require('../models/PurchaseHistory');
const { getImagePath, findImageFile } = require('../utils/imageMapping');
const bcrypt = require('bcrypt');

// 管理者認証ミドルウェア
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/auth/login');
  }
  next();
};

// 管理者ダッシュボード
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { genre, search } = req.query;
    let items = [];
    
    if (search) {
      items = await Item.searchByName(search);
    } else if (genre) {
      items = await Item.getByGenre(genre);
    } else {
      items = await Item.getAll();
    }

    // アイテムに画像パスを追加（改善された検索機能を使用）
    items = items.map(item => ({
      ...item,
      imagePath: findImageFile(item.name, item.genre)
    }));

    const genres = await Item.getGenres();
    const history = await PurchaseHistory.getAll();
    // 画像パスを付与
    const historyWithImage = history.map(h => ({
      ...h,
      imagePath: findImageFile(h.item_name, h.genre)
    }));
    const users = await User.getAll();
    
    res.render('admin/dashboard', {
      user: req.session.user,
      items,
      genres,
      selectedGenre: genre,
      searchTerm: search,
      history: historyWithImage,
      users
    });
  } catch (error) {
    console.error('管理者ダッシュボードエラー:', error);
    res.status(500).send('エラーが発生しました');
  }
});

// アイテム価格更新
router.post('/update-price', requireAdmin, async (req, res) => {
  try {
    const { itemId, newPrice } = req.body;
    
    if (!itemId || !newPrice) {
      return res.status(400).json({ error: 'アイテムIDと価格が必要です' });
    }

    await Item.updatePrice(itemId, parseInt(newPrice));
    res.json({ success: true });
  } catch (error) {
    console.error('価格更新エラー:', error);
    res.status(500).json({ error: '価格更新中にエラーが発生しました' });
  }
});

// アイテム価格管理ページ
router.get('/items', requireAdmin, async (req, res) => {
  try {
    const { genre, search } = req.query;
    let items = [];
    if (search) {
      const db = require('../config/database');
      const [rows] = await db.execute('SELECT * FROM items WHERE name LIKE ? ORDER BY name', [`%${search}%`]);
      items = rows;
    } else if (genre) {
      items = await Item.getByGenre(genre);
    } else {
      items = await Item.getAll();
    }
    items = items.map(item => ({
      ...item,
      imagePath: findImageFile(item.name, item.genre)
    }));
    const genres = await Item.getGenres();
    res.render('admin/items', {
      user: req.session.user,
      items,
      genres,
      selectedGenre: genre,
      searchTerm: search
    });
  } catch (error) {
    console.error('アイテム管理ページエラー:', error);
    res.status(500).send('エラーが発生しました');
  }
});

// 統計情報詳細
router.get('/stats', requireAdmin, async (req, res) => {
  const itemName = req.query.item || '';
  let chartData = null;
  let itemImagePath = null;
  if (itemName) {
    // 日別購入数・累計売上データを取得
    const db = require('../config/database');
    const [rows] = await db.execute(`
      SELECT DATE(ph.purchase_date) as date, COUNT(*) as count, SUM(ph.total_price) as sum
      FROM purchase_history ph
      JOIN items i ON ph.item_id = i.id
      WHERE i.name LIKE ?
      GROUP BY DATE(ph.purchase_date)
      ORDER BY date ASC
    `, [`%${itemName}%`]);
    const labels = rows.map(r => r.date);
    const purchaseCounts = rows.map(r => r.count);
    let total = 0;
    const salesSums = rows.map(r => (total += r.sum));
    chartData = { labels, purchaseCounts, salesSums };
    // アイテム画像パス
    const [itemRow] = await db.execute('SELECT name, genre FROM items WHERE name LIKE ? LIMIT 1', [`%${itemName}%`]);
    if (itemRow.length > 0) {
      const { name, genre } = itemRow[0];
      itemImagePath = findImageFile(name, genre);
    }
  }
  res.render('admin/stats', { user: req.session.user, itemName, chartData, itemImagePath });
});

// ユーザー情報詳細（検索対応）
router.get('/users', requireAdmin, async (req, res) => {
  const query = req.query.q || '';
  const db = require('../config/database');
  let users;
  if (query) {
    const [rows] = await db.execute('SELECT * FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY id', [`%${query}%`, `%${query}%`]);
    users = rows;
  } else {
    users = await User.getAll();
  }
  res.render('admin/users', { user: req.session.user, users, query });
});

// ユーザー所持金管理（検索対応）
router.get('/balance', requireAdmin, async (req, res) => {
  const query = req.query.q || '';
  const db = require('../config/database');
  let users;
  if (query) {
    const [rows] = await db.execute('SELECT * FROM users WHERE username LIKE ? ORDER BY id', [`%${query}%`]);
    users = rows;
  } else {
    users = await User.getAll();
  }
  res.render('admin/balance', { user: req.session.user, users, query });
});

// ユーザーごとの購入履歴
router.get('/user-history', requireAdmin, async (req, res) => {
  const { user, item, from, to } = req.query;
  const db = require('../config/database');
  let where = [];
  let params = [];
  if (user) {
    where.push('u.username LIKE ?');
    params.push(`%${user}%`);
  }
  if (item) {
    where.push('i.name LIKE ?');
    params.push(`%${item}%`);
  }
  if (from) {
    where.push('ph.purchase_date >= ?');
    params.push(from + ' 00:00:00');
  }
  if (to) {
    where.push('ph.purchase_date <= ?');
    params.push(to + ' 23:59:59');
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [history] = await db.execute(`
    SELECT ph.*, u.username, i.name as item_name, i.genre
    FROM purchase_history ph
    JOIN users u ON ph.user_id = u.id
    JOIN items i ON ph.item_id = i.id
    ${whereSql}
    ORDER BY ph.purchase_date DESC
  `, params);
  // 画像パスを付与
  const historyWithImage = history.map(h => ({
    ...h,
    imagePath: findImageFile(h.item_name, h.genre)
  }));
  res.render('admin/user-history', {
    user: req.session.user,
    history: historyWithImage,
    userQuery: user || '',
    itemQuery: item || '',
    from: from || '',
    to: to || ''
  });
});

// ユーザー名更新
router.post('/users/update-name', requireAdmin, async (req, res) => {
  await User.updateName(req.body.id, req.body.username);
  res.redirect('/admin/users');
});

// メール更新
router.post('/users/update-email', requireAdmin, async (req, res) => {
  await User.updateEmail(req.body.id, req.body.email);
  res.redirect('/admin/users');
});

// 権限更新
router.post('/users/update-role', requireAdmin, async (req, res) => {
  await User.updateRole(req.body.id, req.body.role);
  res.redirect('/admin/users');
});

// ロック
router.post('/users/lock', requireAdmin, async (req, res) => {
  await User.lock(req.body.id);
  res.redirect('/admin/users');
});

// アンロック
router.post('/users/unlock', requireAdmin, async (req, res) => {
  await User.unlock(req.body.id);
  res.redirect('/admin/users');
});

// 削除
router.post('/users/delete', requireAdmin, async (req, res) => {
  await User.delete(req.body.id);
  res.redirect('/admin/users');
});

// パスワード変更
router.post('/users/update-password', requireAdmin, async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  await User.updatePassword(req.body.id, hash);
  res.redirect('/admin/users');
});

// 所持金編集
router.post('/balance/update', requireAdmin, async (req, res) => {
  await User.updateBalance(req.body.id, req.body.balance);
  res.redirect('/admin/balance');
});

// アイテム名サジェストAPI
router.get('/api/item-names', requireAdmin, async (req, res) => {
  const db = require('../config/database');
  const [rows] = await db.execute('SELECT name FROM items ORDER BY name');
  res.json(rows.map(r => r.name));
});

// ショップ用アイテム名サジェストAPI（認証不要）
const db = require('../config/database');
router.get('/shop/api/item-names', async (req, res) => {
  const [rows] = await db.execute('SELECT name FROM items ORDER BY name');
  res.json(rows.map(r => r.name));
});

// ユーザー名サジェストAPI
router.get('/api/user-names', requireAdmin, async (req, res) => {
  const db = require('../config/database');
  const [rows] = await db.execute('SELECT username FROM users ORDER BY username');
  res.json(rows.map(r => r.username));
});

// ユーザー追加
router.post('/users/add', requireAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await User.create(username, hash, role === 'admin');
  res.redirect('/admin/users');
});

module.exports = router; 