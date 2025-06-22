require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('MySQL接続をテストしています...');
  console.log('接続設定:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  User: ${process.env.DB_USER || 'root'}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? 'password' : '未設定'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'minecraft_shop'}`);
  console.log('');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password'
    });

    console.log('✅ MySQL接続に成功しました！');
    
    // データベース一覧を表示
    const [rows] = await connection.execute('SHOW DATABASES');
    console.log('利用可能なデータベース:');
    rows.forEach(row => {
      console.log(`  - ${row.Database}`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ MySQL接続に失敗しました:');
    console.error(`   エラー: ${error.message}`);
    console.error('');
    console.error('解決方法:');
    console.error('1. MySQLサーバーが起動しているか確認してください');
    console.error('2. .envファイルを作成してパスワードを設定してください');
    console.error('3. または、config/database.jsで直接パスワードを設定してください');
    console.error('');
    console.error('.envファイルの例:');
    console.error('DB_HOST=localhost');
    console.error('DB_USER=root');
    console.error('DB_PASSWORD=your_password_here');
    console.error('DB_NAME=minecraft_shop');
  }
}

testConnection(); 