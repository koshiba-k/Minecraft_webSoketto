const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');
const PurchaseHistory = require('../models/PurchaseHistory');
const { getImagePath, findImageFile } = require('../utils/imageMapping');
const Wishlist = require('../models/Wishlist');
const db = require('../config/database');

// 認証ミドルウェア
const requireAuth = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  // 最新のユーザー情報でセッションを更新
  const user = await User.findById(req.session.user.id);
  if (user) {
    req.session.user.balance = user.balance;
  }
  next();
};

// ジャンルリストを手動で定義
const manualGenres = [
  '10矢',
  '1アイテム',
  '2建築',
  '3食べ物植物',
  '4植物',
  '5所持品',
  '6武器装備',
  '7エンチャント本',
  '8ポーション',
  '9スポーンエッグ',
  'その他'
];

// 表示用ジャンル名リスト（数字を除去＋特定ジャンル名を変換）
const manualGenresDisplay = manualGenres.map(g => {
  let name = g.replace(/^\d+/, '');
  if (name === '食べ物植物') name = '食べ物・植物';
  if (name === '武器装備') name = '武器・装備';
  return name;
});

// ショップページ
router.get('/', requireAuth, async (req, res) => {
  try {
    const { genre, search, sort } = req.query;
    let items = [];
    
    if (search) {
      items = await Item.searchByName(search);
    } else if (genre) {
      items = await Item.getByGenre(genre);
    } else {
      items = await Item.getAll();
    }

    // 並び替え処理
    if (sort) {
      if (sort === 'price_asc') {
        items.sort((a, b) => a.price - b.price);
      } else if (sort === 'price_desc') {
        items.sort((a, b) => b.price - a.price);
      } else if (sort === 'newest') {
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (sort === 'oldest') {
        items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      } else if (sort === 'name_asc') {
        items.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
      } else if (sort === 'name_desc') {
        items.sort((a, b) => b.name.localeCompare(a.name, 'ja'));
      }
    }

    // ユーザーのウィッシュリストを取得
    const wishlist = await Wishlist.getByUser(req.session.user.id);
    const wishlistIds = new Set(wishlist.map(w => w.item_id));
    // アイテムに画像パスとinWishlistを追加
    items = items.map(item => ({
      ...item,
      imagePath: findImageFile(item.name, item.genre),
      inWishlist: wishlistIds.has(item.id)
    }));

    const genres = manualGenres;
    const genresDisplay = manualGenresDisplay;
    const genresEscaped = genres.map(g => encodeURIComponent(g));
    
    res.render('shop/index', {
      user: req.session.user,
      items,
      genres,
      genresDisplay,
      genresEscaped,
      selectedGenre: genre,
      searchTerm: search,
      sort
    });
  } catch (error) {
    console.error('ショップページエラー:', error);
    res.status(500).send('エラーが発生しました');
  }
});

// カートページ
router.get('/cart', requireAuth, async (req, res) => {
  try {
    const cartItems = req.session.cart || [];
    const user = await User.findById(req.session.user.id);
    
    let totalPrice = 0;
    const cartWithDetails = [];
    
    for (const cartItem of cartItems) {
      const item = await Item.findById(cartItem.itemId);
      if (item) {
        const itemTotal = item.price * cartItem.quantity;
        totalPrice += itemTotal;
        cartWithDetails.push({
          ...cartItem,
          item: {
            ...item,
            imagePath: findImageFile(item.name, item.genre)
          },
          itemTotal
        });
      }
    }

    res.render('shop/cart', {
      user: req.session.user,
      cartItems: cartWithDetails,
      totalPrice
    });
  } catch (error) {
    console.error('カートページエラー:', error);
    res.status(500).send('エラーが発生しました');
  }
});

// カートにアイテム追加
router.post('/add-to-cart', requireAuth, (req, res) => {
  const { itemId, quantity } = req.body;
  
  if (!req.session.cart) {
    req.session.cart = [];
  }

  const existingItem = req.session.cart.find(item => item.itemId == itemId);
  
  if (existingItem) {
    existingItem.quantity += parseInt(quantity);
  } else {
    req.session.cart.push({
      itemId: parseInt(itemId),
      quantity: parseInt(quantity)
    });
  }

  res.json({ success: true, cartCount: req.session.cart.length });
});

// カートからアイテム削除
router.post('/remove-from-cart', requireAuth, (req, res) => {
  const { itemId } = req.body;
  
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => item.itemId != itemId);
  }

  res.json({ success: true });
});

// 購入処理
router.post('/purchase', requireAuth, async (req, res) => {
  try {
    const cartItems = req.session.cart || [];
    const user = await User.findById(req.session.user.id);
    
    let totalPrice = 0;
    
    // 合計金額計算
    for (const cartItem of cartItems) {
      const item = await Item.findById(cartItem.itemId);
      if (item) {
        totalPrice += item.price * cartItem.quantity;
      }
    }

    // 所持金チェック
    if (user.balance < totalPrice) {
      return res.status(400).json({ error: '所持金が不足しています' });
    }

    // 購入履歴作成と所持金更新
    for (const cartItem of cartItems) {
      const item = await Item.findById(cartItem.itemId);
      if (item) {
        await PurchaseHistory.create(
          user.id,
          cartItem.itemId,
          cartItem.quantity,
          item.price * cartItem.quantity
        );
      }
    }

    // 所持金更新
    const newBalance = user.balance - totalPrice;
    await User.updateBalance(user.id, newBalance);
    
    // セッション更新
    req.session.user.balance = newBalance;
    req.session.cart = [];

    res.json({ success: true, newBalance });
  } catch (error) {
    console.error('購入エラー:', error);
    res.status(500).json({ error: '購入処理中にエラーが発生しました' });
  }
});

// 購入履歴
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { genre, from, to } = req.query;
    let history = await PurchaseHistory.getByUserId(req.session.user.id);
    // 検索フィルタ
    if (genre) {
      history = history.filter(h => h.genre === genre);
    }
    if (from) {
      const fromDate = new Date(from);
      history = history.filter(h => new Date(h.purchase_date) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      history = history.filter(h => new Date(h.purchase_date) <= toDate);
    }
    // 画像パスを付与
    history = history.map(purchase => ({
      ...purchase,
      imagePath: findImageFile(purchase.item_name, purchase.genre)
    }));
    // ジャンルリスト・表示用ジャンル名
    const genres = manualGenres;
    const genresDisplay = manualGenresDisplay;
    const genresEscaped = genres.map(g => encodeURIComponent(g));
    res.render('shop/history', {
      user: req.session.user,
      history,
      genres,
      genresDisplay,
      genresEscaped,
      selectedGenre: genre,
      from,
      to
    });
  } catch (error) {
    console.error('購入履歴エラー:', error);
    res.status(500).send('エラーが発生しました');
  }
});

// ウィッシュリスト追加
router.post('/wishlist/add', requireAuth, async (req, res) => {
  const { itemId } = req.body;
  try {
    await Wishlist.add(req.session.user.id, itemId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '追加に失敗しました' });
  }
});

// ウィッシュリスト削除
router.post('/wishlist/remove', requireAuth, async (req, res) => {
  const { itemId } = req.body;
  try {
    await Wishlist.remove(req.session.user.id, itemId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '削除に失敗しました' });
  }
});

// ウィッシュリスト取得
router.get('/wishlist', requireAuth, async (req, res) => {
  try {
    let wishlist = await Wishlist.getByUser(req.session.user.id);
    // 画像パスを付与
    wishlist = wishlist.map(item => ({
      ...item,
      imagePath: findImageFile(item.name, item.genre)
    }));
    res.render('shop/wishlist', { user: req.session.user, wishlist });
  } catch (error) {
    res.status(500).send('ウィッシュリストの取得に失敗しました');
  }
});

// カート内数量更新
router.post('/update-cart-quantity', requireAuth, (req, res) => {
  const { itemId, quantity } = req.body;
  if (!req.session.cart) {
    return res.json({ success: false, error: 'カートが空です' });
  }
  const item = req.session.cart.find(item => item.itemId == itemId);
  if (item) {
    item.quantity = parseInt(quantity);
    if (item.quantity < 1) item.quantity = 1;
    return res.json({ success: true });
  } else {
    return res.json({ success: false, error: 'アイテムが見つかりません' });
  }
});

// サジェストAPI（一般ユーザー用）
router.get('/api/item-names', async (req, res) => {
  const [rows] = await db.execute('SELECT name FROM items ORDER BY name');
  res.json(rows.map(r => r.name));
});

module.exports = router; 