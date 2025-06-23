# Minecraftアイテム購入Webアプリ

Node.js（Express）・MySQL・MVC構成で作られた、Minecraftのアイテム購入Webアプリです。

## 主な機能

- **ログイン**  
  ユーザー名＋4桁パスワードで認証。管理者・一般ユーザーで画面が分岐。
- **アイテムショップ**  
  ジャンル別にアイテムを画像付きカードで一覧表示。数量指定・検索も可能。
- **カート**  
  選択アイテム・数量・合計金額・所持金を表示。会計時に所持金が自動減算。
- **お気に入り（Wishlist）**  
  気になるアイテムをお気に入り登録・解除。お気に入り一覧画面あり。
- **購入履歴**  
  ユーザーごとに購入履歴を確認可能。
- **管理者機能**  
  アイテム価格の変更、全ユーザーの購入履歴閲覧。

## 技術スタック

- **バックエンド**: Node.js, Express.js
- **データベース**: MySQL
- **テンプレート**: EJS
- **構成**: MVCモデル

## セットアップ手順

1. **依存パッケージのインストール**
   ```bash
   npm install
   ```

2. **環境変数ファイルの作成**  
   プロジェクトルートに`.env`を作成し、下記を記入（`env.example`も参考に）:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=（MySQLパスワード）
   DB_NAME=minecraft_shop
   PORT=3000
   SESSION_SECRET=minecraft-shop-secret
   MC_WS_URL=ws://localhost:19132
   ```

3. **MySQLサーバー起動＆接続テスト**
   ```bash
   # サーバー起動（Windows例）
   net start mysql
   # 接続テスト
   node scripts/test-connection.js
   ```

4. **データベース初期化**
   ```bash
   node scripts/init-database.js
   ```

5. **画像ファイルのセットアップ**
   ```bash
   node scripts/setup-images.js
   ```

6. **アプリケーション起動**
   ```bash
   npm start
   ```
   開発モードの場合:
   ```bash
   npm run dev
   ```

## デフォルトアカウント

- 管理者: `admin` / `1234`
- 一般ユーザー: `user1` / `1234`

## ディレクトリ構成（抜粋）

```
├── app.js
├── package.json
├── .env / env.example
├── config/
│   └── database.js
├── models/
│   ├── User.js
│   ├── Item.js
│   ├── PurchaseHistory.js
│   └── Wishlist.js
├── routes/
│   ├── auth.js
│   ├── shop.js
│   └── admin.js
├── views/
│   ├── layout.ejs
│   ├── auth/
│   ├── shop/
│   │   ├── index.ejs
│   │   ├── cart.ejs
│   │   ├── history.ejs
│   │   └── wishlist.ejs
│   └── admin/
├── public/
│   ├── minecraft_blocks/
│   ├── images/
│   ├── css/
│   └── js/
├── scripts/
│   ├── init-database.js
│   ├── setup-images.js
│   ├── test-connection.js
│   └── generate-sql.js
```

## トラブルシューティング

- **MySQL接続エラー時**
  1. サーバーが起動しているか確認
  2. `.env`のパスワード等が正しいか確認
  3. 必要に応じてMySQLユーザーやパスワードを再設定

- **画像が表示されない場合**
  - `public/minecraft_blocks/`以下に画像があるか確認
  - 画像が無い場合はデフォルト画像が表示されます

- **所持金不足時**
  - 購入不可となります

## ライセンス

MIT License 