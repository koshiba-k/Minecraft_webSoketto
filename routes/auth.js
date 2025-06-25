const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

// ログインページ表示
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null, layout: false });
});

// ログイン処理
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.render('auth/login', { error: 'ユーザー名とパスワードを入力してください', layout: false });
    }

    const user = await User.findByUsername(username);
    let valid = false;
    if (user) {
      if (user.locked) {
        return res.render('auth/login', { error: 'アカウントがロックされています', layout: false });
      }
      try {
        valid = await bcrypt.compare(password, user.password);
      } catch (e) {
        valid = false;
      }
    }
    if (!user || !valid) {
      return res.render('auth/login', { error: 'ユーザー名またはパスワードが正しくありません', layout: false });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      balance: user.balance,
      isAdmin: user.isAdmin,
      role: user.isAdmin ? 'admin' : 'user'
    };

    if (user.isAdmin) {
      res.redirect('/admin');
    } else {
      res.redirect('/shop');
    }
  } catch (error) {
    console.error('ログインエラー:', error);
    res.render('auth/login', { error: 'ログイン中にエラーが発生しました', layout: false });
  }
});

// ログアウト
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

// 新規登録画面表示
router.get('/register', (req, res) => {
  res.render('auth/register', { error: null, layout: false });
});

// 新規登録処理
router.post('/register', async (req, res) => {
  const { username, password, passwordConfirm } = req.body;
  if (!username || !password || !passwordConfirm) {
    return res.render('auth/register', { error: '全ての項目を入力してください', layout: false });
  }
  if (password !== passwordConfirm) {
    return res.render('auth/register', { error: 'パスワードが一致しません', layout: false });
  }
  try {
    const existing = await User.findByUsername(username);
    if (existing) {
      return res.render('auth/register', { error: 'このユーザー名は既に使われています', layout: false });
    }
    // ユーザーが一人もいない場合
    const allUsers = await User.getAll();
    let isAdmin = false;
    if (allUsers.length === 0) {
      // .envのADMIN_PASSWORDと一致した場合のみ管理者
      if (password === process.env.ADMIN_PASSWORD) isAdmin = true;
    }
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(password, 10);
    await User.create(username, hash, isAdmin);
    // 登録したユーザー情報を取得
    const user = await User.findByUsername(username);
    req.session.user = {
      id: user.id,
      username: user.username,
      balance: user.balance,
      isAdmin: user.isAdmin,
      role: user.isAdmin ? 'admin' : 'user'
    };
    res.redirect('/shop');
  } catch (err) {
    console.error('新規登録エラー:', err);
    res.render('auth/register', { error: '登録中にエラーが発生しました', layout: false });
  }
});

module.exports = router; 