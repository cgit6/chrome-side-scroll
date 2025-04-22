/**
 * 日志工具模块 - 用于管理扩展插件的日志和错误信息
 */

// 日志级别枚举
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// 当前日志级别设置
let currentLogLevel = LogLevel.DEBUG;

// 存储最近的日志消息
const logHistory = [];
const MAX_LOG_HISTORY = 100;

/**
 * 记录调试信息
 * @param {string} message - 日志消息
 * @param {any} data - 附加数据（可选）
 */
export function debug(message, data) {
  if (currentLogLevel <= LogLevel.DEBUG) {
    log('DEBUG', message, data);
  }
}

/**
 * 记录普通信息
 * @param {string} message - 日志消息
 * @param {any} data - 附加数据（可选）
 */
export function info(message, data) {
  if (currentLogLevel <= LogLevel.INFO) {
    log('INFO', message, data);
  }
}

/**
 * 记录警告信息
 * @param {string} message - 日志消息
 * @param {any} data - 附加数据（可选）
 */
export function warn(message, data) {
  if (currentLogLevel <= LogLevel.WARN) {
    log('WARN', message, data);
  }
}

/**
 * 记录错误信息
 * @param {string} message - 错误消息
 * @param {Error|any} error - 错误对象或附加数据
 */
export function error(message, error) {
  if (currentLogLevel <= LogLevel.ERROR) {
    log('ERROR', message, error);
    
    // 如果提供了错误对象，并且它是 Error 实例
    if (error instanceof Error) {
      console.error(`${message}: ${error.message}`, '\nStack:', error.stack);
    } else if (error) {
      console.error(`${message}:`, error);
    } else {
      console.error(message);
    }
    
    // 向后台脚本发送错误消息
    sendErrorToBackground(message, error);
  }
}

/**
 * 内部日志记录函数
 * @private
 */
function log(level, message, data) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  // 打印到控制台
  if (level === 'ERROR') {
    console.error(formattedMessage, data || '');
  } else if (level === 'WARN') {
    console.warn(formattedMessage, data || '');
  } else {
    console.log(formattedMessage, data || '');
  }
  
  // 添加到历史记录
  addToHistory(level, timestamp, message, data);
}

/**
 * 添加日志到历史记录
 * @private
 */
function addToHistory(level, timestamp, message, data) {
  logHistory.push({
    level,
    timestamp,
    message,
    data: data ? JSON.stringify(data) : null
  });
  
  // 限制历史记录大小
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift();
  }
}

/**
 * 向后台脚本发送错误信息
 * @private
 */
function sendErrorToBackground(message, error) {
  try {
    // 准备错误数据
    const errorData = {
      message,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString()
    };
    
    // 发送到后台脚本
    chrome.runtime.sendMessage({
      action: 'logError',
      error: errorData
    }).catch(err => {
      console.error('无法发送错误到后台:', err);
    });
  } catch (err) {
    console.error('发送错误消息失败:', err);
  }
}

/**
 * 设置日志级别
 * @param {number} level - 日志级别
 */
export function setLogLevel(level) {
  if (Object.values(LogLevel).includes(level)) {
    currentLogLevel = level;
    debug(`日志级别已设置为: ${level}`);
  }
}

/**
 * 获取日志历史记录
 * @returns {Array} 日志历史数组
 */
export function getLogHistory() {
  return [...logHistory];
}

/**
 * 清除日志历史
 */
export function clearLogHistory() {
  logHistory.length = 0;
  debug('日志历史已清除');
}

// 导出日志级别枚举
export { LogLevel };

// 导出默认对象
export default {
  debug,
  info,
  warn,
  error,
  setLogLevel,
  getLogHistory,
  clearLogHistory,
  LogLevel
}; 