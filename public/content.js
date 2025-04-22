// 创建遮罩层
function createOverlay() {
  console.log('开始创建遮罩层');
  
  // 检查是否已存在遮罩
  let overlay = document.getElementById('kq-scroll-overlay');
  if (overlay) {
    console.log('遮罩已存在，直接返回');
    return overlay;
  }
  
  console.log('创建新遮罩层');
  // 创建遮罩元素
  overlay = document.createElement('div');
  overlay.id = 'kq-scroll-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '9999';
  overlay.style.transition = 'opacity 0.3s ease';
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none'; // 允许点击穿透，防止与页面交互冲突
  
  // 添加到页面
  try {
    document.body.appendChild(overlay);
    console.log('遮罩已添加到页面');
    
    // 渐入效果
    setTimeout(() => {
      overlay.style.opacity = '1';
      console.log('遮罩渐入效果已应用');
    }, 10);
    
    return overlay;
  } catch (error) {
    console.error('添加遮罩到页面失败:', error);
    return null;
  }
}

// 移除遮罩层
function removeOverlay() {
  console.log('开始移除遮罩层');
  const overlay = document.getElementById('kq-scroll-overlay');
  
  if (!overlay) {
    console.log('找不到遮罩，无需移除');
    return;
  }
  
  console.log('找到遮罩，开始移除');
  // 渐出效果
  overlay.style.opacity = '0';
  
  // 等待动画完成后移除元素
  setTimeout(() => {
    if (overlay && overlay.parentNode) {
      console.log('移除遮罩元素');
      overlay.parentNode.removeChild(overlay);
    }
  }, 300);
}

// 立即初始化内容脚本
console.log('内容脚本已加载在: ' + window.location.href);

// 全局错误处理器
window.addEventListener('error', function(event) {
  // 创建错误对象
  const errorData = {
    message: event.message || '未知错误',
    source: event.filename || window.location.href,
    line: event.lineno,
    column: event.colno,
    stack: event.error ? event.error.stack : null,
    timestamp: Date.now(),
    type: 'runtime' // 运行时错误
  };
  
  // 发送错误到后台脚本
  sendErrorToBackground(errorData);
  
  // 不阻止默认错误处理
  return false;
}, true);

// 处理未捕获的Promise异常
window.addEventListener('unhandledrejection', function(event) {
  // 创建Promise错误对象
  const errorData = {
    message: event.reason ? (event.reason.message || '未处理的Promise拒绝') : '未处理的Promise拒绝',
    source: window.location.href,
    stack: event.reason && event.reason.stack ? event.reason.stack : null,
    timestamp: Date.now(),
    type: 'promise' // Promise错误
  };
  
  // 发送错误到后台脚本
  sendErrorToBackground(errorData);
  
  // 不阻止默认错误处理
  return false;
});

// 监听自定义捕获的错误
window.addEventListener('custom-error', function(event) {
  if (event.detail && event.detail.error) {
    // 发送自定义错误到后台脚本
    sendErrorToBackground({
      ...event.detail.error,
      timestamp: Date.now(),
      type: 'custom' // 自定义错误
    });
  }
});

/**
 * 发送错误到后台脚本
 * @param {Object} errorData - 错误数据对象
 */
function sendErrorToBackground(errorData) {
  try {
    chrome.runtime.sendMessage({
      action: 'logError',
      error: errorData
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.error('发送错误到后台失败:', chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error('发送错误消息失败:', error);
  }
}

/**
 * 手动捕获并上报错误
 * @param {Error|string} error - 错误对象或错误消息
 * @param {string} [source] - 错误来源
 * @param {Object} [extraInfo] - 额外信息
 */
window.reportError = function(error, source, extraInfo = {}) {
  try {
    const errorData = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      source: source || window.location.href,
      timestamp: Date.now(),
      type: 'reported', // 手动报告的错误
      ...extraInfo
    };
    
    sendErrorToBackground(errorData);
  } catch (e) {
    console.error('报告错误失败:', e);
  }
};

// 通知后台脚本页面已加载
chrome.runtime.sendMessage({
  action: 'pageLoaded',
  url: window.location.href
});

// 监视页面卸载
window.addEventListener('beforeunload', function() {
  chrome.runtime.sendMessage({
    action: 'pageUnloaded',
    url: window.location.href
  });
});

// 添加辅助函数到window对象，允许网页中的脚本直接报告错误
window.chromeExtErrorReporter = {
  reportError: window.reportError,
  
  /**
   * 启用特定代码块的错误监控
   * @param {Function} fn - 要执行的函数
   * @param {string} [context] - 上下文描述
   * @returns {*} 函数执行结果
   */
  tryRun: function(fn, context = '') {
    try {
      return fn();
    } catch (error) {
      this.reportError(error, context);
      throw error; // 重新抛出错误以保持原有行为
    }
  }
};

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('内容脚本收到消息:', request);
  
  try {
    if (request.action === 'scrollToBottom') {
      console.log('执行滚动到底部');
      // 滚动到页面底部
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
      
      console.log('滚动命令已执行，当前页面高度:', document.body.scrollHeight);
      
      // 延迟返回成功消息，等待滚动完成
      setTimeout(() => {
        console.log('滚动完成，返回成功状态');
        sendResponse({ status: 'success' });
      }, 1000);
      
      return true; // 保持消息通道开启
    } else if (request.action === 'createOverlay') {
      console.log('接收到创建遮罩请求');
      const overlay = createOverlay();
      const success = !!overlay;
      console.log('遮罩创建完成', success ? '成功' : '失败');
      sendResponse({ status: success ? 'success' : 'error', overlayCreated: success });
      return true;
    } else if (request.action === 'removeOverlay') {
      console.log('接收到移除遮罩请求');
      removeOverlay();
      console.log('遮罩移除指令已执行');
      sendResponse({ status: 'success' });
      return true;
    }
    
    // 未知操作
    console.log('未知操作:', request.action);
    sendResponse({ status: 'unknown_action' });
    return true; // 保持消息通道开启
  } catch (error) {
    console.error('处理消息时出错:', error);
    sendResponse({ status: 'error', message: error.message });
    return true;
  }
}); 