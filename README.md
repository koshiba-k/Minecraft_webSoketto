# Minecraft Bedrock × Webショップ連携 経済システム

## 概要
Minecraft Bedrock EditionとWebショップをリアルタイム連携し、ゲーム内通貨・アイテム経済を実現するNode.js+MySQLアプリです。
- モンスター討伐で報酬付与、Webショップでアイテム購入→ゲーム内配布
- 管理画面・ランキング・円グラフ・カート永続化・アニメーション等、実運用向けUI/UX

---

## 主な機能
- **WebSocket連携**：Minecraftサーバーとリアルタイム通信
- **モンスター討伐履歴・ランキング・円グラフ**：日本語名＋画像で可視化
- **管理者画面**：討伐履歴・ユーザー/モンスター検索・サジェスト・報酬編集
- **カート永続化**：localStorageとセッション同期、ログアウト後もカート保持
- **所持金アニメーション**：増加時にエフェクト表示
- **アイテム画像自動マッピング**：mapping.json, imageMapping.js, image_map.json
- **購入履歴・お気に入り・ユーザー管理**

---

## セットアップ手順

1. **依存パッケージのインストール**
   ```bash
   npm install
   ```
2. **.envファイル作成**（DB接続・セッション・WebSocket設定）
3. **MySQLサーバー起動**
4. **DB初期化**
   ```bash
   node scripts/init-database.js
   ```
5. **アプリ起動**
   ```bash
   npm start
   # または
   npm run dev
   ```

---

## ディレクトリ構成

```
├── app.js
├── package.json
├── package-lock.json
├── .env
├── README.md
├── minecraft_items.sql
├── config/
│   └── database.js
├── models/
│   ├── Item.js
│   ├── Monster.js
│   ├── PurchaseHistory.js
│   ├── User.js
│   └── Wishlist.js
├── routes/
│   ├── admin.js
│   ├── auth.js
│   ├── monster.js
│   └── shop.js
├── scripts/
│   ├── init-database.js
│   ├── mc-websocket-server.js
│   └── mobid_japanese_map.json
├── utils/
│   ├── imageMapping.js
│   └── mapping.json
├── public/
│   ├── css/
│   │   └── style.css
│   ├── images/
│   │   └── 1.png 〜 7.png
│   ├── js/
│   │   ├── cart-sync.js
│   │   ├── image-mapping.js
│   │   └── image_map.json
│   ├── mob_images/
│   │   └── *.webp, *.png
│   ├── minecraft_blocks/
│   │   ├── mapping.json
│   │   └── [カテゴリ別画像多数]
├── views/
│   ├── layout.ejs
│   ├── admin/
│   │   ├── balance.ejs
│   │   ├── dashboard.ejs
│   │   ├── items.ejs
│   │   ├── monster_kills.ejs
│   │   ├── monster_rewards.ejs
│   │   ├── stats.ejs
│   │   ├── user-history.ejs
│   │   └── users.ejs
│   ├── auth/
│   │   └── login.ejs
│   └── shop/
│       ├── cart.ejs
│       ├── history.ejs
│       ├── index.ejs
│       ├── monster_history.ejs
│       └── wishlist.ejs
```

---


---

## デフォルトアカウント
- 管理者: `admin` / `1234`
- 一般ユーザー: `user1` / `1234`

---

## ライセンス
MIT License 