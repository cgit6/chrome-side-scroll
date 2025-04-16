# 页面滚动助手 Chrome 扩展

这是一个简单的 Chrome 扩展，提供一个侧边栏面板，点击按钮可以快速滚动到页面底部。

## 功能

- 提供侧边栏界面
- 一键滚动到页面底部
- 显示操作状态

## 技术栈

- React
- Vite
- JavaScript
- Chrome 扩展 API

## 开发步骤

1. 安装依赖：

```bash
npm install
```

2. 开发模式：

```bash
npm run dev
```

3. 构建扩展：

```bash
npm run build
```

## 安装扩展

1. 运行 `npm run build` 生成 `dist` 目录
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启 "开发者模式"
4. 点击 "加载已解压的扩展程序"
5. 选择项目中的 `dist` 目录

## 使用方法

1. 安装扩展后，点击 Chrome 工具栏中的扩展图标
2. 在右侧会打开侧边栏
3. 点击 "滚动到页面底部" 按钮即可快速滚动到当前页面底部
