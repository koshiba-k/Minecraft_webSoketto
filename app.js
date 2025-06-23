require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'minecraft-shop-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// EJSテンプレートエンジンの設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ルートの設定
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const monsterRoutes = require('./routes/monster');

app.use('/auth', authRoutes);
app.use('/shop', shopRoutes);
app.use('/admin', adminRoutes);
app.use('/monster', monsterRoutes);

// メインページ
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/shop');
  } else {
    res.redirect('/auth/login');
  }
});

// --- WebSocketサーバー統合 ---
const WebSocket = require('ws');
const Monster = require('./models/Monster');
const wsPort = process.env.WS_PORT || 4000;
const wss = new WebSocket.Server({ port: wsPort });

console.log(`WebSocketサーバーがポート${wsPort}で起動しました (ws://localhost:${wsPort})`);
console.log(`/wsserver ws://localhost:${wsPort}`);
console.log(`/connect 192.168.0.214:${wsPort}`);
wss.on('connection', ws => {
  console.log('WebSocket: クライアントが接続しました');
  ws.on('message', async message => {
    try {
      const data = JSON.parse(message);
      // MobKilledイベントを検知
      if (data.header && data.header.eventName === 'MobKilled') {
        const playerName = data.body?.player?.name;
        const mobType = data.body?.victim?.type; // 例: "minecraft:zombie"
        if (!playerName || !mobType) {
          console.log('討伐イベント: プレイヤー名またはモブタイプが取得できません');
          return;
        }
        // モブ名をDBのnameに合わせて変換
        const mobNameMap = {
          "minecraft:zombie": "ゾンビ",
          "minecraft:skeleton": "スケルトン",
          "minecraft:creeper": "クリーパー"
          // 必要に応じて追加
        };
        const mobName = mobNameMap[mobType] || mobType;
        // DBからユーザー・モンスター情報を取得
        const user = await Monster.getUserByMinecraftName(playerName);
        const monster = await Monster.getMonsterByName(mobName);
        if (user && monster) {
          const reward = monster.reward;
          await Monster.addBalance(user.id, reward);
          await Monster.logMonsterKill(user.id, monster.id);
          console.log(`討伐ログ: ${playerName} が ${mobName} を倒し、${reward}円を獲得しました。`);
          ws.send(JSON.stringify({ status: 'ok', reward }));
        } else {
          console.log('討伐イベント: ユーザーまたはモンスターがDBに存在しません', playerName, mobName);
          ws.send(JSON.stringify({ status: 'error', error: 'User or monster not found' }));
        }
      }
      // --- 既存の旧仕様（player/monster/strength）も残す ---
      else if (data.player && data.monster && data.strength) {
        const user = await Monster.getUserByMinecraftName(data.player);
        const monster = await Monster.getMonsterByName(data.monster);
        if (user && monster) {
          const reward = monster.reward * data.strength;
          await Monster.addBalance(user.id, reward);
          await Monster.logMonsterKill(user.id, monster.id);
          console.log(`討伐ログ: ${data.player} が ${data.monster}（強さ: ${data.strength}）を倒し、${reward}円を獲得しました。`);
          ws.send(JSON.stringify({ status: 'ok', reward }));
        } else {
          ws.send(JSON.stringify({ status: 'error', error: 'User or monster not found' }));
        }
      }
    } catch (e) {
      ws.send(JSON.stringify({ status: 'error', error: e.message }));
    }
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
  console.log(`http://localhost:${PORT}`);
}); 