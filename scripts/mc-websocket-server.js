const WebSocket = require('ws');
const uuid = require('uuid');
const http = require('http');
const url = require('url');
const Monster = require('../models/Monster');
require('dotenv').config();
const mobNameMap = require('./mobid_japanese_map.json'); // 英語名→日本語名マップ

const WS_PORT = process.env.WS_PORT || 19131;
const HTTP_PORT = process.env.COMMAND_API_PORT || 19132; // コマンドAPI用

// --- Minecraft用WebSocketサーバー ---
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`Minecraft WebSocketサーバーがポート ${WS_PORT} で起動しました。`);

let mcClient = null; // 最新のMinecraftクライアント

wss.on('connection', (ws) => {
  console.log('Minecraftクライアントが接続しました。');
  mcClient = ws;

  // MobKilledなど全イベント購読
  const allEvents = ['MobKilled', 'PlayerMessage', 'SlashCommandExecuted'];
  allEvents.forEach((eventName) => {
    const subscribeMessage = {
      header: {
        version: 1,
        requestId: uuid.v4(),
        messageType: 'commandRequest',
        messagePurpose: 'subscribe'
      },
      body: { eventName }
    };
    ws.send(JSON.stringify(subscribeMessage));
    console.log(`イベント購読: ${eventName}`);
  });

  ws.on('message', async (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (err) {
      console.error('JSONパースエラー:', err.message);
      return;
    }
    // MobKilledイベント検知
    if (msg.header && msg.header.eventName === 'MobKilled') {
      const playerName = msg.body?.player?.name;
      const mobType = msg.body?.victim?.type;
      if (!playerName || !mobType) {
        console.log('討伐イベント: プレイヤー名またはモブタイプが取得できません');
        return;
      }
      // 英語名抽出
      const mobid = mobType.startsWith('minecraft:') ? mobType.split(':')[1] : mobType;
      const jpName = getJapaneseMobName(mobid);
      // DBからユーザー・モンスター情報取得
      try {
        const user = await Monster.getUserByMinecraftName(playerName);
        const monster = await Monster.getMonsterByName(mobid);
        if (user && monster) {
          const reward = monster.reward;
          await Monster.addBalance(user.id, reward);
          await Monster.logMonsterKill(user.id, monster.id);
          console.log(`討伐ログ: ${playerName} が ${jpName}（${mobid}） を倒し、${reward}円を獲得しました。`);
          ws.send(JSON.stringify({ status: 'ok', reward }));
        } else {
          console.log('討伐イベント: ユーザーまたはモンスターがDBに存在しません', playerName, mobid);
          ws.send(JSON.stringify({ status: 'error', error: 'User or monster not found' }));
        }
      } catch (e) {
        console.error('討伐イベントDBエラー:', e);
        ws.send(JSON.stringify({ status: 'error', error: e.message }));
      }
    } else {
      // 他イベントはログのみ
      console.log('受信イベント:', msg.header?.eventName || msg.body?.type || 'unknown', data.toString());
    }
  });

  ws.on('close', () => {
    console.log('Minecraftクライアントとの接続が切断されました。');
    if (mcClient === ws) mcClient = null;
  });
  ws.on('error', (err) => {
    console.error('WebSocketエラー:', err.message);
  });
});

// --- 外部からのコマンド送信API（HTTP） ---
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/send-command') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { commandLine } = JSON.parse(body);
        if (!commandLine) throw new Error('commandLineが必要です');
        if (!mcClient || mcClient.readyState !== WebSocket.OPEN) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Minecraftクライアントが未接続です' }));
          return;
        }
        const commandMessage = {
          header: {
            version: 1,
            requestId: uuid.v4(),
            messageType: 'commandRequest',
            messagePurpose: 'commandRequest'
          },
          body: {
            origin: { type: 'player' },
            version: 1,
            commandLine
          }
        };
        mcClient.send(JSON.stringify(commandMessage));
        console.log('コマンド送信:', commandLine);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});
server.listen(HTTP_PORT, () => {
  console.log(`コマンドAPIサーバーがポート${HTTP_PORT}で起動しました (/send-command)`);
});

function getJapaneseMobName(mobid) {
  // "minecraft:zombie" → "zombie"
  const id = mobid.startsWith('minecraft:') ? mobid.split(':')[1] : mobid;
  return mobNameMap[id] || id;
} 