const fs = require('fs');
const path = require('path');

// mapping.jsonを読み込み
const mappingPath = path.join(__dirname, '../public/minecraft_blocks/mapping.json');
const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// アイテムをジャンルごとに分類
const genreMapping = {
  '建築': ['板材', '塀', 'フェンス', 'フェンスゲート', '階段', 'ドア', 'トラップドア', '格子', 'ガラス', '板'],
  'アイテム': ['剣', '斧', 'ツルハシ', 'シャベル', 'クワ', '弓', '矢', '盾', 'ヘルメット', 'チェストプレート', 'レギンス', 'ブーツ'],
  '性質': ['火', '水', '土', '石', '砂', '粘土', '氷', '雪', '溶岩', '炎'],
  '所持品': ['本', '地図', 'コンパス', '時計', 'バケツ', '鍋', 'かまど', '作業台', '金床', 'エンチャント台']
};

// SQLファイルを生成
let sqlContent = '-- Minecraftアイテムデータ\n';
sqlContent += '-- このファイルは scripts/generate-sql.js で自動生成されました\n\n';
sqlContent += 'USE minecraft_shop;\n\n';

// 既存のアイテムを削除（オプション）
sqlContent += '-- 既存のアイテムを削除\n';
sqlContent += 'DELETE FROM items;\n\n';

// アイテムデータを生成
sqlContent += '-- アイテムデータの挿入\n';
sqlContent += 'INSERT INTO items (name, genre, price, image_path) VALUES\n';

const items = [];
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
  
  // SQLエスケープ処理
  const escapedName = itemName.replace(/'/g, "''");
  const escapedGenre = genre.replace(/'/g, "''");
  const escapedImagePath = `${genre}/${itemName}.png`.replace(/'/g, "''");
  
  items.push(`('${escapedName}', '${escapedGenre}', ${price}, '${escapedImagePath}')`);
}

sqlContent += items.join(',\n') + ';\n\n';

// 統計情報を追加
sqlContent += '-- 統計情報\n';
sqlContent += 'SELECT genre, COUNT(*) as count FROM items GROUP BY genre ORDER BY count DESC;\n\n';
sqlContent += '-- 全アイテム数\n';
sqlContent += 'SELECT COUNT(*) as total_items FROM items;\n';

// SQLファイルを保存
const outputPath = path.join(__dirname, '../minecraft_items.sql');
fs.writeFileSync(outputPath, sqlContent, 'utf8');

console.log(`✅ SQLファイルが生成されました: ${outputPath}`);
console.log(`📊 アイテム数: ${items.length}`);
console.log(`📁 ファイルサイズ: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

// ジャンル別統計を表示
const genreStats = {};
for (const [itemName, command] of Object.entries(mappingData)) {
  let genre = 'その他';
  for (const [genreName, keywords] of Object.entries(genreMapping)) {
    if (keywords.some(keyword => itemName.includes(keyword))) {
      genre = genreName;
      break;
    }
  }
  genreStats[genre] = (genreStats[genre] || 0) + 1;
}

console.log('\n📈 ジャンル別統計:');
Object.entries(genreStats)
  .sort(([,a], [,b]) => b - a)
  .forEach(([genre, count]) => {
    console.log(`  ${genre}: ${count}個`);
  }); 