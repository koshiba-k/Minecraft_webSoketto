const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',       // SQLのホスト名を設定
    user: process.env.DB_USER || 'root',            // SQLのユーザー名を設定
    password: process.env.DB_PASSWORD || 'password' // SQLのパスワードを設定
  });

  try {
    // minecraft_items.sqlの内容を実行
    const sqlFilePath = path.join(__dirname, '../minecraft_items.sql');
    if (fs.existsSync(sqlFilePath)) {
      const sql = fs.readFileSync(sqlFilePath, 'utf8');
      // セミコロンで分割し、空でない文だけ実行
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (err) {
          console.error('SQL実行エラー:', err.sqlMessage || err.message, '\nSQL:', statement);
        }
      }
      console.log('minecraft_items.sqlの内容を実行しました');
    } else {
      console.warn('minecraft_items.sqlが見つかりませんでした');
    }

    console.log('データベースの初期化が完了しました');
  } catch (error) {
    console.error('データベース初期化エラー:', error);
  } finally {
    await connection.end();
  }
}

initDatabase(); 