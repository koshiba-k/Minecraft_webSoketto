const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password'
  });

  try {
    // データベース作成
    await connection.execute('CREATE DATABASE IF NOT EXISTS minecraft_shop');
    await connection.execute('USE minecraft_shop');

    // ユーザーテーブル作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        balance INT DEFAULT 10000,
        isAdmin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // アイテムテーブル作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        genre VARCHAR(50) NOT NULL,
        price INT DEFAULT 100,
        image_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 購入履歴テーブル作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS purchase_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        item_id INT,
        quantity INT,
        total_price INT,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
      )
    `);

    // モンスターテーブル作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS monsters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(64) NOT NULL,
        strength INT NOT NULL,
        reward INT NOT NULL DEFAULT 0
      )
    `);

    // モンスター討伐ログテーブル作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS monster_kills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        monster_id INT NOT NULL,
        killed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (monster_id) REFERENCES monsters(id)
      )
    `);

    // デフォルト管理者ユーザー作成
    await connection.execute(`
      INSERT IGNORE INTO users (username, password, isAdmin) 
      VALUES ('admin', '1234', TRUE)
    `);

    // デフォルトユーザー作成
    await connection.execute(`
      INSERT IGNORE INTO users (username, password, balance) 
      VALUES ('user1', '1234', 10000)
    `);

    // アイテムデータの読み込みと挿入
    const mappingPath = path.join(__dirname, '../minecraft_blocks/mapping.json');
    if (fs.existsSync(mappingPath)) {
      const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      
      // アイテムをジャンルごとに分類
      const genreMapping = {
        '建築': ['板材', '塀', 'フェンス', 'フェンスゲート', '階段', 'ドア', 'トラップドア', '格子', 'ガラス', '板'],
        'アイテム': ['剣', '斧', 'ツルハシ', 'シャベル', 'クワ', '弓', '矢', '盾', 'ヘルメット', 'チェストプレート', 'レギンス', 'ブーツ'],
        '性質': ['火', '水', '土', '石', '砂', '粘土', '氷', '雪', '溶岩', '炎'],
        '所持品': ['本', '地図', 'コンパス', '時計', 'バケツ', '鍋', 'かまど', '作業台', '金床', 'エンチャント台']
      };

      for (const [itemName, command] of Object.entries(mappingData)) {
        // ジャンルを決定
        let genre = 'その他';
        for (const [genreName, keywords] of Object.entries(genreMapping)) {
          if (keywords.some(keyword => itemName.includes(keyword))) {
            genre = genreName;
            break;
          }
        }

        // 価格をランダムに設定（100-1000円）
        const price = Math.floor(Math.random() * 900) + 100;

        await connection.execute(`
          INSERT IGNORE INTO items (name, genre, price, image_path) 
          VALUES (?, ?, ?, ?)
        `, [itemName, genre, price, `${genre}/${itemName}.png`]);
      }
    }

    console.log('データベースの初期化が完了しました');
  } catch (error) {
    console.error('データベース初期化エラー:', error);
  } finally {
    await connection.end();
  }
}

initDatabase(); 