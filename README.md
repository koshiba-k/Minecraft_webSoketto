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
2. **uuidパッケージのインストール**
   ```bash
   npm install uuid
   ```
3. **.envファイル作成**（DB接続・セッション・WebSocket設定、管理者パスワード設定）
   - 最初のアカウントで管理者にしたい場合は、.envに下記を追加してください：
     ```
     ADMIN_PASSWORD=admin_password
     ```
   - この値と一致するパスワードで最初のユーザーを登録すると、そのユーザーが管理者になります。
4. **MySQLサーバー起動**
5. **DB初期化**
   ```bash
   node scripts/init-database.js
   ```
6. **アプリ起動**
   ```bash
   npm start
   # または
   npm run dev
   ```

---

## 環境変数設定（.env）

### 必須変数
```env
# データベース設定
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=minecraft_shop

# セッション設定
SESSION_SECRET=your_session_secret_key

# WebSocket設定
WS_PORT=19131
COMMAND_API_PORT=19132

# 管理者パスワード設定
ADMIN_PASSWORD=admin_password
```

### オプション変数
```env
# アプリケーション設定
PORT=3000
NODE_ENV=development
```

---

## MySQL要件・権限

### 必要な権限
```sql
-- データベース作成権限
CREATE DATABASE minecraft_shop;

-- テーブル作成・操作権限
CREATE, SELECT, INSERT, UPDATE, DELETE ON minecraft_shop.* TO 'your_user'@'localhost';

-- または管理者権限（開発環境）
GRANT ALL PRIVILEGES ON minecraft_shop.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### 推奨設定
- MySQL 8.0以上
- UTF8MB4文字セット
- InnoDBエンジン

---

## 管理者初回ログイン方法

1. **新規登録画面で管理者アカウント作成**
   - `/auth/register` にアクセス
   - ユーザー名を入力
   - パスワードに `.env` の `ADMIN_PASSWORD` 値を入力
   - 登録完了後、自動的に管理者権限が付与されます

2. **管理者画面へのアクセス**
   - ログイン後、自動的に `/admin` にリダイレクト
   - または、ナビゲーションの「管理者」リンクをクリック

---

## Minecraft連携の例

### WebSocket接続設定
```javascript
// Minecraft Bedrockサーバー側
// behavior_packs/scripts/main.js
import { world } from "@minecraft/server";

// モンスター討伐イベント
world.events.entityDie.subscribe((event) => {
  const victim = event.deadEntity;
  const killer = event.hurtByEntity;
  
  if (killer && killer.typeId === "minecraft:player") {
    // WebSocketサーバーに討伐情報を送信
    // 実際の実装はMinecraftのWebSocket APIを使用
  }
});
```

### 外部コマンド送信例
```bash
# HTTP API経由でMinecraftサーバーにコマンド送信
curl -X POST http://localhost:19132/send-command \
  -H "Content-Type: application/json" \
  -d '{"commandLine": "give @p diamond 1"}'
```

---

## Mappingファイル構成説明

### アイテム画像自動マッピング
```
public/minecraft_blocks/
├── mapping.json          # アイテム名と画像ファイルの対応表
├── 1アイテム/            # カテゴリ別フォルダ
│   ├── diamond.png
│   └── emerald.png
├── 2建築/
│   ├── stone.png
│   └── wood.png
└── ...

utils/
├── imageMapping.js       # 画像パス解決ロジック
└── mapping.json          # メインのマッピング設定
```

### マッピングロジック
1. アイテム名とカテゴリから画像ファイルを自動検索
2. 見つからない場合はデフォルト画像を表示
3. カテゴリ別フォルダ構造で管理

---

## 利用イメージの例

### ゲーム内経済システム
```
プレイヤー → モンスター討伐 → 報酬獲得 → Webショップでアイテム購入 → ゲーム内配布
```

### 管理者機能
- **ユーザー管理**: アカウント作成・権限変更・ロック機能
- **アイテム管理**: 価格設定・在庫管理・カテゴリ分け
- **統計分析**: 討伐ランキング・売上分析・ユーザー行動分析
- **報酬設定**: モンスター別報酬金額の調整

### プレイヤー機能
- **ショップ**: カテゴリ別アイテム閲覧・検索・購入
- **カート**: 複数アイテム一括購入・永続化
- **履歴**: 購入履歴・討伐履歴の確認
- **ウィッシュリスト**: お気に入りアイテムの管理

---

## Minecraft連携WebSocketサーバー（mc-websocket-server.js）

### 役割
- Minecraft BedrockサーバーとWebSocketで接続し、ゲーム内イベント（モンスター討伐など）をリアルタイムで受信します。
- 討伐イベントを検知すると、該当ユーザーの所持金を加算し、討伐履歴をDBに記録します。
- 外部HTTP API（/send-command）経由でMinecraftサーバーにコマンドを送信できます。

### 起動方法
```bash
node scripts/mc-websocket-server.js
```
- デフォルトではWebSocketサーバーがポート19131、コマンドAPIがポート19132で起動します。
- ポート番号は.envで `WS_PORT` `COMMAND_API_PORT` を指定可能です。

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

## ライセンス
MIT License 
