import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 源文件路径
const sourceDir = path.join(__dirname, '..', 'public');
// 目标目录
const targetDir = path.join(__dirname, '..', 'dist');

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 需要复制的文件
const filesToCopy = [
  'manifest.json',
  'background.js',
  'content.js',
  'logo.png'
];

// 复制文件
filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`已复制: ${file}`);
  } else {
    console.error(`错误: 找不到文件 ${sourcePath}`);
  }
});

console.log('扩展文件复制完成！'); 