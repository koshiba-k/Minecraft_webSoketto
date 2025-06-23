const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

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

module.exports = router; 