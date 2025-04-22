// 当扩展安装或更新时，注册侧边栏
chrome.runtime.onInstalled.addListener(() => {
  console.log('扩展已安装或更新');
  // 注册侧边栏
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// 当用户点击扩展图标时
chrome.action.onClicked.addListener((tab) => {
  console.log('用户点击了扩展图标');
  // 打开侧边栏
  chrome.sidePanel.open({ tabId: tab.id });
});

// 错误日志存储
let errorLogs = [];
const MAX_ERROR_LOGS = 100; // 最多保存的错误日志数量

// 添加新的错误日志
function addErrorLog(errorData) {
  // 添加到错误日志队列顶部
  errorLogs.unshift(errorData);
  
  // 限制错误日志数量
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs = errorLogs.slice(0, MAX_ERROR_LOGS);
  }
  
  // 广播新的错误日志
  chrome.runtime.sendMessage({
    action: 'newErrorLog',
    error: errorData
  }).catch(error => {
    // 忽略消息发送错误
    console.error('广播错误日志失败:', error);
  });
}

// 清空错误日志
function clearErrorLogs() {
  errorLogs = [];
  
  // 广播错误日志已清空
  chrome.runtime.sendMessage({
    action: 'errorLogsCleared'
  }).catch(error => {
    // 忽略消息发送错误
    console.error('广播错误日志清空失败:', error);
  });
}

// 注册全局错误处理器
window.addEventListener('error', function(event) {
  addErrorLog({
    message: event.message || '未知后台错误',
    source: event.filename || 'background.js',
    line: event.lineno,
    column: event.colno,
    stack: event.error ? event.error.stack : null,
    timestamp: Date.now(),
    type: 'background'
  });
});

// 注册未处理的Promise拒绝处理器
window.addEventListener('unhandledrejection', function(event) {
  const reason = event.reason;
  addErrorLog({
    message: reason instanceof Error 
      ? reason.message 
      : (typeof reason === 'string' ? reason : '未处理的Promise拒绝'),
    source: 'background.js',
    stack: reason instanceof Error ? reason.stack : null,
    timestamp: Date.now(),
    type: 'background-promise'
  });
});

// 监听来自内容脚本和弹出窗口的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 记录错误日志
  if (message.action === 'logError' && message.error) {
    // 如果消息来自内容脚本，添加标签信息
    if (sender.tab) {
      message.error.tabId = sender.tab.id;
      message.error.tabUrl = sender.tab.url;
    }
    
    addErrorLog(message.error);
    sendResponse({ status: 'success' });
  }
  // 获取所有错误日志
  else if (message.action === 'getErrorLogs') {
    sendResponse({ status: 'success', logs: errorLogs });
  }
  // 清空错误日志
  else if (message.action === 'clearErrorLogs') {
    clearErrorLogs();
    sendResponse({ status: 'success' });
  }
  // 页面加载和卸载通知（可选，用于调试或统计）
  else if (message.action === 'pageLoaded') {
    console.log('页面已加载:', message.url);
    sendResponse({ status: 'success' });
  }
  else if (message.action === 'pageUnloaded') {
    console.log('页面已卸载:', message.url);
    sendResponse({ status: 'success' });
  }
  
  // 返回true表示异步响应
  return true;
});

// 扩展安装或更新事件
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    console.log('扩展已安装');
  } else if (details.reason === 'update') {
    console.log('扩展已更新到版本:', chrome.runtime.getManifest().version);
  }
});

// 记录扩展启动
console.log('Chrome Side Scroll 后台脚本已启动');

// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(`标签页 ${tabId} 已关闭`);
  // 可以在这里添加标签页关闭相关逻辑
});

// 扩展自身的错误处理
function handleExtensionError(error, context = 'background') {
  console.error(`扩展错误(${context}):`, error);
  
  // 记录扩展自身的错误
  addErrorLog({
    message: error.message || String(error),
    source: 'extension:' + context,
    stack: error instanceof Error ? error.stack : null,
    timestamp: Date.now(),
    type: 'extension'
  });
}

// 设置全局错误捕获
try {
  self.onerror = function(message, source, line, column, error) {
    handleExtensionError(error || new Error(message), 'background:runtime');
    return false;
  };
  
  self.onunhandledrejection = function(event) {
    handleExtensionError(event.reason || new Error('未处理的Promise拒绝'), 'background:promise');
    return false;
  };
} catch (error) {
  console.error('设置全局错误处理失败:', error);
} 