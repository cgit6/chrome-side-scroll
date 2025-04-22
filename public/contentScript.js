// 初始化全局错误处理
initErrorHandling();

// 监听页面刷新
window.addEventListener('beforeunload', () => {
  console.log('页面即将刷新，通知扩展');
  chrome.runtime.sendMessage({ action: 'pageRefresh' })
    .catch(error => {
      console.log('发送页面刷新消息失败，这通常是正常的');
    });
});

/**
 * 记录并发送错误到扩展后台
 * @param {Error|string} error - 错误对象或错误消息
 * @param {string} [source] - 错误来源
 */
function logError(error, source = 'contentScript') {
  try {
    const errorObj = {
      timestamp: new Date().toISOString(),
      source: source,
      message: typeof error === 'string' ? error : (error.message || '未知错误'),
      errorMessage: typeof error !== 'string' ? error.toString() : undefined,
      stack: typeof error !== 'string' && error.stack ? error.stack : undefined
    };

    console.error(`[错误] ${errorObj.message}`, error);
    
    // 发送错误信息到扩展后台
    chrome.runtime.sendMessage({
      action: 'logError',
      error: errorObj
    }).catch(err => {
      console.error('发送错误日志到扩展失败:', err);
    });
  } catch (e) {
    console.error('记录错误过程中发生异常:', e);
  }
}

/**
 * 初始化全局错误处理
 */
function initErrorHandling() {
  // 捕获未处理的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'unhandledPromise');
    // 不阻止默认处理
  });

  // 捕获全局JavaScript错误
  window.addEventListener('error', (event) => {
    // 忽略资源加载错误（如图片、脚本加载失败）
    if (event.target && (event.target.nodeName === 'IMG' || event.target.nodeName === 'SCRIPT')) {
      return;
    }
    
    logError(event.error || event.message, 'globalError');
    // 不阻止默认处理
    return false;
  }, true);

  // 重写console.error以捕获所有控制台错误
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // 调用原始方法
    originalConsoleError.apply(console, args);
    
    // 记录错误
    try {
      const errorMessage = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');
      
      logError(errorMessage, 'consoleError');
    } catch (e) {
      originalConsoleError('错误日志处理失败:', e);
    }
  };
}

// 测试函数 - 仅在开发环境使用
function testErrorLogging() {
  // 测试直接错误
  logError('测试错误消息');
  
  // 测试异常对象
  try {
    throw new Error('测试错误对象');
  } catch (e) {
    logError(e);
  }
  
  // 测试控制台错误
  console.error('测试控制台错误');
  
  // 测试未处理的Promise
  setTimeout(() => {
    Promise.reject(new Error('测试未处理的Promise'));
  }, 1000);
  
  // 测试JavaScript错误
  setTimeout(() => {
    try {
      nonExistentFunction();
    } catch (e) {
      logError(e, 'manualCatch');
    }
  }, 2000);
}

// 仅在开发环境下启用测试
if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
  console.log('开发环境中启用错误日志测试');
  setTimeout(() => {
    testErrorLogging();
  }, 3000);
}

// 定义全局错误处理程序
(function() {
  /**
   * 向后台脚本发送错误日志
   * @param {object} errorData - 错误数据对象
   */
  function sendErrorToBackground(errorData) {
    chrome.runtime.sendMessage({
      action: 'logError',
      error: errorData
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('[Chrome Side Scroll] 发送错误日志失败:', chrome.runtime.lastError);
      }
    });
  }

  /**
   * 处理错误事件
   * @param {string} message - 错误消息
   * @param {string} source - 错误源
   * @param {number} line - 行号
   * @param {number} column - 列号
   * @param {Error} error - 错误对象
   */
  function handleErrorEvent(message, source, line, column, error) {
    const errorData = {
      message: message || '未知错误',
      source: source || window.location.href,
      line: line,
      column: column,
      stack: error && error.stack ? error.stack : null,
      timestamp: Date.now(),
      type: 'runtime'
    };
    
    sendErrorToBackground(errorData);
    
    // 不阻止默认错误处理
    return false;
  }

  /**
   * 处理未捕获的Promise拒绝
   * @param {PromiseRejectionEvent} event - Promise拒绝事件
   */
  function handleUnhandledRejection(event) {
    const reason = event.reason;
    const errorData = {
      message: reason instanceof Error 
        ? reason.message 
        : (typeof reason === 'string' ? reason : '未处理的Promise拒绝'),
      source: window.location.href,
      stack: reason instanceof Error ? reason.stack : null,
      timestamp: Date.now(),
      type: 'promise'
    };
    
    sendErrorToBackground(errorData);
    
    // 不阻止默认错误处理
    return false;
  }

  /**
   * 监听控制台错误
   * 通过覆盖控制台方法捕获控制台错误和警告
   */
  function setupConsoleListener() {
    // 保存原始控制台方法
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // 覆盖console.error
    console.error = function(...args) {
      // 调用原始方法
      originalConsoleError.apply(console, args);
      
      // 生成错误消息
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      // 创建错误数据对象
      const errorData = {
        message: message,
        source: window.location.href,
        timestamp: Date.now(),
        type: 'console.error'
      };
      
      // 发送到后台
      sendErrorToBackground(errorData);
    };
    
    // 覆盖console.warn（可选）
    console.warn = function(...args) {
      // 调用原始方法
      originalConsoleWarn.apply(console, args);
      
      // 生成警告消息
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      // 创建警告数据对象
      const errorData = {
        message: message,
        source: window.location.href,
        timestamp: Date.now(),
        type: 'console.warn'
      };
      
      // 发送到后台
      sendErrorToBackground(errorData);
    };
  }

  // 设置全局错误捕获
  window.addEventListener('error', function(event) {
    handleErrorEvent(
      event.message,
      event.filename,
      event.lineno,
      event.colno,
      event.error
    );
  }, true);
  
  // 设置Promise错误捕获
  window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
  
  // 设置控制台监听（可选，取决于需求）
  // setupConsoleListener(); // 取消注释以启用控制台错误捕获
  
  // 通知后台脚本页面已加载
  chrome.runtime.sendMessage({
    action: 'pageLoaded',
    url: window.location.href
  }).catch(error => {
    // 忽略消息传递错误
    console.error('[Chrome Side Scroll] 通知页面加载失败:', error);
  });
  
  // 在页面卸载时通知后台脚本
  window.addEventListener('beforeunload', function() {
    chrome.runtime.sendMessage({
      action: 'pageUnloaded',
      url: window.location.href
    }).catch(error => {
      // 忽略消息传递错误
      console.error('[Chrome Side Scroll] 通知页面卸载失败:', error);
    });
  });
  
  console.log('[Chrome Side Scroll] 内容脚本已加载 - 错误监控已启动');
})(); 