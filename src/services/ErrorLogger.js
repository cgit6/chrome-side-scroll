/**
 * 错误日志服务
 * 负责在扩展各组件间传递错误信息
 */

// 错误类型常量
export const ERROR_TYPES = {
  RUNTIME: 'runtime',
  PROMISE: 'promise',
  CONSOLE_ERROR: 'console.error',
  CONSOLE_WARN: 'console.warn',
  BACKGROUND: 'background',
  BACKGROUND_PROMISE: 'background-promise',
  EXTENSION: 'extension',
  CUSTOM: 'custom'
};

/**
 * 获取当前活动标签信息
 * @returns {Promise<Object|null>} 标签信息
 */
const getActiveTab = async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs.length > 0 ? tabs[0] : null;
  } catch (error) {
    console.error('获取活动标签失败:', error);
    return null;
  }
};

/**
 * 记录自定义错误
 * @param {string} message - 错误消息
 * @param {Object} options - 附加选项
 * @returns {Promise<boolean>} 是否成功记录
 */
export const logCustomError = async (message, options = {}) => {
  try {
    const tab = await getActiveTab();
    
    const error = {
      message: message,
      timestamp: Date.now(),
      type: ERROR_TYPES.CUSTOM,
      source: options.source || 'extension-ui',
      stack: options.stack || null,
      tabUrl: tab ? tab.url : null,
      tabTitle: tab ? tab.title : null,
      ...options
    };
    
    const response = await chrome.runtime.sendMessage({
      action: 'logError',
      error: error
    });
    
    return response && response.success;
  } catch (error) {
    console.error('记录自定义错误失败:', error);
    return false;
  }
};

/**
 * 获取当前所有错误日志
 * @returns {Promise<Array>} 错误日志数组
 */
export const getErrorLogs = async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getErrorLogs' });
    return response && response.success ? response.logs : [];
  } catch (error) {
    console.error('获取错误日志失败:', error);
    return [];
  }
};

/**
 * 清除所有错误日志
 * @returns {Promise<boolean>} 是否成功清除
 */
export const clearErrorLogs = async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'clearErrorLogs' });
    return response && response.success;
  } catch (error) {
    console.error('清除错误日志失败:', error);
    return false;
  }
};

/**
 * 设置错误通知监听器
 * @param {Function} callback - 收到错误时的回调函数
 * @returns {Function} 移除监听器的函数
 */
export const setErrorNotificationListener = (callback) => {
  const messageListener = (message) => {
    if (message.action === 'errorConsoleUpdate') {
      callback(message.data);
    }
  };
  
  chrome.runtime.onMessage.addListener(messageListener);
  
  // 返回清理函数
  return () => chrome.runtime.onMessage.removeListener(messageListener);
};

/**
 * 全局错误处理器初始化
 * 捕获页面中的未处理错误和Promise拒绝
 */
export const initGlobalErrorHandlers = () => {
  // 捕获未处理的错误
  window.addEventListener('error', async (event) => {
    await logCustomError(event.message || '未捕获的错误', {
      source: event.filename || window.location.href,
      line: event.lineno,
      column: event.colno,
      stack: event.error ? event.error.stack : null,
      type: ERROR_TYPES.RUNTIME
    });
  });
  
  // 捕获未处理的Promise拒绝
  window.addEventListener('unhandledrejection', async (event) => {
    const reason = event.reason;
    await logCustomError(
      reason instanceof Error 
        ? reason.message 
        : (typeof reason === 'string' ? reason : '未处理的Promise拒绝'),
      {
        stack: reason instanceof Error ? reason.stack : null,
        type: ERROR_TYPES.PROMISE
      }
    );
  });
};

export default {
  logCustomError,
  getErrorLogs,
  clearErrorLogs,
  setErrorNotificationListener,
  initGlobalErrorHandlers,
  ERROR_TYPES
}; 