# Minecraftアイテム購入Webアプリ

Node.js（Express）とMySQL、MVCモデルで構築されたMinecraftアイテム購入Webアプリケーションです。

## 機能

- **ログイン機能**: ユーザー名と4桁のパスワードでログイン
- **管理者機能**: 管理者ユーザー（isAdmin=true）はアイテムの価格を変更可能
- **アイテム購入**: ジャンルごとに分類されたアイテムをカード形式で表示
- **カート機能**: 選択した商品・数量・価格合計・ユーザーの所持金を表示
- **検索機能**: アイテム名による検索
- **購入履歴**: ユーザーの購入履歴を表示
- **所持金管理**: 購入時に所持金が自動的に減算

## 技術スタック

- **バックエンド**: Node.js, Express.js
- **データベース**: MySQL
- **テンプレートエンジン**: EJS
- **アーキテクチャ**: MVCモデル

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. MySQLの設定

#### 2.1 MySQLサーバーの起動
MySQLサーバーが起動していることを確認してください。

#### 2.2 環境変数の設定
プロジェクトルートに`.env`ファイルを作成し、以下の内容を設定してください：

```env
# MySQLデータベース設定
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=minecraft_shop

# アプリケーション設定
PORT=3000
SESSION_SECRET=minecraft-shop-secret
```

**注意**: `your_password_here`を実際のMySQLのrootパスワードに変更してください。

#### 2.3 接続テスト
```bash
node scripts/test-connection.js
```

このコマンドでMySQL接続が正常に動作することを確認してください。

### 3. データベースの初期化

```bash
node scripts/init-database.js
```

### 4. 画像ファイルのセットアップ

```bash
node scripts/setup-images.js
```

### 5. アプリケーションの起動

```bash
npm start
```

開発モードで起動する場合：
```bash
npm run dev
```

## トラブルシューティング

### MySQL接続エラーが発生する場合

1. **MySQLサーバーが起動しているか確認**
   ```bash
   # Windowsの場合
   net start mysql
   
   # macOS/Linuxの場合
   sudo service mysql start
   # または
   sudo systemctl start mysql
   ```

2. **パスワードが正しく設定されているか確認**
   - `.env`ファイルで`DB_PASSWORD`を正しく設定
   - または`config/database.js`で直接パスワードを設定

3. **MySQLのrootユーザーのパスワードをリセット**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
   FLUSH PRIVILEGES;
   ```

4. **新しいユーザーを作成**
   ```sql
   CREATE USER 'minecraft_user'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON *.* TO 'minecraft_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

## デフォルトアカウント

- **管理者**: admin / 1234
- **一般ユーザー**: user1 / 1234

## ディレクトリ構造

```
├── app.js                 # メインアプリケーションファイル
├── package.json           # 依存関係定義
├── .env                   # 環境変数（要作成）
├── env.example            # 環境変数サンプル
├── config/
│   └── database.js        # データベース設定
├── models/                # MVCモデル
│   ├── User.js
│   ├── Item.js
│   └── PurchaseHistory.js
├── routes/                # ルーティング
│   ├── auth.js
│   ├── shop.js
│   └── admin.js
├── views/                 # EJSテンプレート
│   ├── layout.ejs
│   ├── auth/
│   ├── shop/
│   └── admin/
├── public/                # 静的ファイル
│   └── minecraft_blocks/  # 画像ファイル
├── scripts/               # セットアップスクリプト
│   ├── init-database.js
│   ├── setup-images.js
│   └── test-connection.js
└── minecraft_blocks/      # 元の画像ファイル
```

## 機能詳細

### ログイン機能
- ユーザー名と4桁のパスワードでログイン
- 管理者と一般ユーザーで異なる画面に遷移

### ショップ機能
- アイテムをジャンルごとに表示（「アイテム」「建築」「性質」「所持品」）
- 画像付きカード形式で表示
- 数量入力（+ / -）機能
- 検索機能

### カート機能
- 選択した商品の一覧表示
- 数量・価格合計・ユーザーの所持金表示
- 会計機能（所持金が減る）

### 管理者機能
- アイテム価格の変更
- 全ユーザーの購入履歴確認

## 注意事項

- 画像ファイルは`public/minecraft_blocks/<ジャンル>/<ファイル名>.png`から読み込みます
- 画像が見つからない場合はデフォルト画像が表示されます
- 所持金が不足している場合は購入できません

## ライセンス

MIT License 