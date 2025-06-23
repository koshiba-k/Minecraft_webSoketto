const WebSocket = require('ws');
const db = require('../config/database');
const Monster = require('../models/Monster');
require('dotenv').config();

const port = process.env.WS_PORT || 4000;
const wss = new WebSocket.Server({ port });

wss.on('connection', ws => {
  ws.on('message', async message => {
    try {
      // 例: { player: "user1", monster: "Zombie", strength: 2 }
      const data = JSON.parse(message);
      const user = await Monster.getUserByMinecraftName(data.player);
      const monster = await Monster.getMonsterByName(data.monster);
      if (user && monster) {
        const reward = monster.reward * data.strength;
        await Monster.addBalance(user.id, reward);
        await Monster.logMonsterKill(user.id, monster.id);
        ws.send(JSON.stringify({ status: 'ok', reward }));
      } else {
        ws.send(JSON.stringify({ status: 'error', error: 'User or monster not found' }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ status: 'error', error: e.message }));
    }
  });
});

console.log(`WebSocketサーバーがポート${port}で起動しました (ws://localhost:${port})`); 