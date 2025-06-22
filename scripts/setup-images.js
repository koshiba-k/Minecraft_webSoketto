const fs = require('fs');
const path = require('path');

// publicディレクトリとminecraft_blocksディレクトリを作成
const publicDir = path.join(__dirname, '../public');
const minecraftBlocksDir = path.join(publicDir, 'minecraft_blocks');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

if (!fs.existsSync(minecraftBlocksDir)) {
    fs.mkdirSync(minecraftBlocksDir);
}

// 元のminecraft_blocksディレクトリから画像をコピー
const sourceDir = path.join(__dirname, '../minecraft_blocks');

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    
    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        const stat = fs.statSync(srcPath);
        
        if (stat.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else if (item.endsWith('.png')) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    copyDirectory(sourceDir, minecraftBlocksDir);
    console.log('画像ファイルのコピーが完了しました');
} catch (error) {
    console.error('画像ファイルのコピー中にエラーが発生しました:', error);
} 