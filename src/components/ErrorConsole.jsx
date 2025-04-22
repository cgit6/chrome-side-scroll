import React, { useState, useEffect, useRef } from 'react';
import '../styles/ErrorConsole.css';
import ErrorLogger from '../services/ErrorLogger';

/**
 * 格式化时间戳为可读格式
 * @param {number} timestamp - 毫秒时间戳
 * @returns {string} 格式化后的时间字符串
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '未知时间';
  
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * 获取错误类型的中文描述
 * @param {string} type - 错误类型
 * @returns {string} 错误类型的中文描述
 */
const getErrorTypeDescription = (type) => {
  const typeDescriptions = {
    'runtime': '运行时错误',
    'promise': 'Promise错误',
    'background': '后台脚本错误',
    'background-promise': '后台Promise错误',
    'console.error': '控制台错误',
    'console.warn': '控制台警告',
    'extension': '扩展错误',
    'custom': '自定义错误'
  };
  
  return typeDescriptions[type] || '未知类型';
};

/**
 * 错误控制台组件
 */
function ErrorConsole() {
  // 状态
  const [expanded, setExpanded] = useState(false);
  const [errors, setErrors] = useState([]);
  const contentRef = useRef(null);
  
  // 初始化和卸载
  useEffect(() => {
    // 加载错误日志
    const loadErrorLogs = async () => {
      try {
        const logs = await ErrorLogger.getErrorLogs();
        setErrors(logs || []);
      } catch (error) {
        console.error('加载错误日志失败:', error);
      }
    };
    
    // 监听新的错误日志
    const cleanupListener = ErrorLogger.setErrorNotificationListener((data) => {
      if (data.clear) {
        setErrors([]);
      } else {
        setErrors(prevErrors => [data, ...prevErrors]);
      }
    });
    
    // 加载初始错误日志
    loadErrorLogs();
    
    // 清理监听器
    return () => {
      cleanupListener();
    };
  }, []);
  
  // 当展开状态或错误列表变更时，滚动到最新错误
  useEffect(() => {
    if (expanded && contentRef.current && errors.length > 0) {
      contentRef.current.scrollTop = 0;
    }
  }, [expanded, errors]);
  
  // 清除所有错误
  const handleClearErrors = async () => {
    try {
      await ErrorLogger.clearErrorLogs();
      // 清除状态会通过监听器更新
    } catch (error) {
      console.error('清除错误日志失败:', error);
    }
  };
  
  // 切换展开状态
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <div className={`error-console ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="console-header" onClick={toggleExpanded}>
        <h3>
          错误控制台
          {errors.length > 0 && (
            <span className="error-badge">{errors.length}</span>
          )}
        </h3>
        <button 
          className="console-clear-btn" 
          onClick={(e) => {
            e.stopPropagation();
            handleClearErrors();
          }}
          disabled={errors.length === 0}
        >
          清除
        </button>
      </div>
      
      {expanded && (
        <div className="console-content" ref={contentRef}>
          {errors.length === 0 ? (
            <div className="no-errors">无错误记录</div>
          ) : (
            <ul className="error-list">
              {errors.map((error, index) => (
                <li 
                  key={`${error.timestamp}-${index}`} 
                  className="error-item"
                  data-type={error.type || 'runtime'}
                >
                  <div className="error-header">
                    <span className="error-time">{formatTimestamp(error.timestamp)}</span>
                    <span className="error-message">{error.message}</span>
                  </div>
                  
                  <div className="error-details">
                    <p>类型: {getErrorTypeDescription(error.type)}</p>
                    {error.source && <p>来源: {error.source}</p>}
                    {error.line && <p>位置: 第 {error.line} 行 {error.column ? `第 ${error.column} 列` : ''}</p>}
                    {error.tabUrl && <p>页面: {error.tabUrl}</p>}
                  </div>
                  
                  {error.stack && (
                    <pre className="error-stack">{error.stack}</pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ErrorConsole; 