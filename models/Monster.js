const db = require('../config/database');

exports.getUserByMinecraftName = async (mcName) => {
  const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [mcName]);
  return rows[0];
};

exports.getMonsterByName = async (name) => {
  const [rows] = await db.execute('SELECT * FROM monsters WHERE name = ?', [name]);
  return rows[0];
};

exports.addBalance = async (userId, amount) => {
  await db.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);
};

exports.logMonsterKill = async (userId, monsterId) => {
  await db.execute('INSERT INTO monster_kills (user_id, monster_id) VALUES (?, ?)', [userId, monsterId]);
};

exports.getMonsterKillsByUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT mk.*, m.name AS monster_name, m.reward, m.image_path
     FROM monster_kills mk
     JOIN monsters m ON mk.monster_id = m.id
     WHERE mk.user_id = ?
     ORDER BY mk.killed_at DESC`, [userId]);
  return rows;
};

exports.getAllMonsterKills = async () => {
  const [rows] = await db.execute(
    `SELECT mk.*, u.username, m.name AS monster_name, m.reward, m.image_path
     FROM monster_kills mk
     JOIN users u ON mk.user_id = u.id
     JOIN monsters m ON mk.monster_id = m.id
     ORDER BY mk.killed_at DESC`);
  return rows;
};

exports.updateMonsterReward = async (monsterId, reward) => {
  await db.execute('UPDATE monsters SET reward = ? WHERE id = ?', [reward, monsterId]);
};

exports.updateMonsterStrength = async (monsterId, strength) => {
  await db.execute('UPDATE monsters SET strength = ? WHERE id = ?', [strength, monsterId]);
};

exports.getAllMonsters = async () => {
  const [rows] = await db.execute('SELECT * FROM monsters');
  return rows;
}; 