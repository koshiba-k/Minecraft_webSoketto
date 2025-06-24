// public/js/cart-sync.js

// --- カート同期ユーティリティ ---
const CART_KEY = 'minecraft_shop_cart';

// localStorageからカート取得
function getLocalCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

// localStorageにカート保存
function setLocalCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// サーバーセッションにカートを送信
function syncCartToServer(cart) {
  fetch('/shop/sync-cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart })
  });
}

// サーバーからカート取得（未使用）
function fetchCartFromServer() {
  return fetch('/shop/api/cart').then(res => res.json());
}

// ログイン・カートページ表示時にlocalStorage→サーバーへ復元
function restoreCartToServerIfNeeded() {
  const cart = getLocalCart();
  if (cart && cart.length > 0) {
    syncCartToServer(cart);
  }
}

// カート追加・削除時はlocalStorageも更新
function addToCartLocal(itemId, quantity) {
  let cart = getLocalCart();
  const idx = cart.findIndex(i => i.itemId == itemId);
  if (idx >= 0) {
    cart[idx].quantity += quantity;
  } else {
    cart.push({ itemId: parseInt(itemId), quantity: parseInt(quantity) });
  }
  setLocalCart(cart);
  syncCartToServer(cart);
}
function removeFromCartLocal(itemId) {
  let cart = getLocalCart();
  cart = cart.filter(i => i.itemId != itemId);
  setLocalCart(cart);
  syncCartToServer(cart);
}

// --- ページで呼び出し例 ---
// restoreCartToServerIfNeeded(); // ログイン・カートページ表示時
// addToCartLocal(itemId, quantity); // カート追加時
// removeFromCartLocal(itemId); // カート削除時 