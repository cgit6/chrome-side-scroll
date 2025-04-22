import React, { useState } from 'react';
import ErrorLogger from '../services/ErrorLogger';
import '../styles/DebugTester.css';

/**
 * 调试测试组件
 * 用于测试错误控制台功能
 */
function DebugTester() {
  const [result, setResult] = useState('准备就绪');
  
  /**
   * 触发运行时错误
   */
  const triggerRuntimeError = () => {
    try {
      // 故意引发错误
      const obj = null;
      obj.nonExistentMethod();
    } catch (error) {
      setResult(`已触发运行时错误: ${error.message}`);
    }
  };
  
  /**
   * 触发Promise错误
   */
  const triggerPromiseError = () => {
    // 创建一个会被拒绝的Promise
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('测试Promise拒绝'));
      }, 100);
    });
    
    setResult('已触发Promise拒绝错误 (查看控制台)');
  };
  
  /**
   * 触发控制台错误
   */
  const triggerConsoleError = () => {
    console.error('这是一个测试控制台错误');
    setResult('已触发控制台错误');
  };
  
  /**
   * 触发控制台警告
   */
  const triggerConsoleWarn = () => {
    console.warn('这是一个测试控制台警告');
    setResult('已触发控制台警告');
  };
  
  /**
   * 触发自定义错误
   */
  const triggerCustomError = async () => {
    try {
      await ErrorLogger.logCustomError('这是一个手动记录的自定义错误', {
        source: 'DebugTester组件',
        stack: new Error().stack
      });
      setResult('已触发自定义错误');
    } catch (error) {
      setResult(`触发自定义错误失败: ${error.message}`);
    }
  };
  
  /**
   * 触发复杂对象错误
   */
  const triggerComplexObjectError = () => {
    const complexObject = {
      user: {
        name: 'Test User',
        id: 12345,
        permissions: ['read', 'write']
      },
      action: 'update',
      timestamp: new Date()
    };
    
    console.error('复杂对象错误', complexObject);
    setResult('已触发复杂对象错误');
  };
  
  /**
   * 清除结果
   */
  const clearResult = () => {
    setResult('准备就绪');
  };
  
  return (
    <div className="debug-tester">
      <h2>错误控制台测试工具</h2>
      
      <div className="debug-controls">
        <button onClick={triggerRuntimeError}>触发运行时错误</button>
        <button onClick={triggerPromiseError}>触发Promise错误</button>
        <button onClick={triggerConsoleError}>触发控制台错误</button>
        <button onClick={triggerConsoleWarn}>触发控制台警告</button>
        <button onClick={triggerCustomError}>触发自定义错误</button>
        <button onClick={triggerComplexObjectError}>触发复杂对象错误</button>
        <button onClick={clearResult} className="clear-button">清除结果</button>
      </div>
      
      <div className="debug-result">
        <h3>执行结果:</h3>
        <p>{result}</p>
        <div className="note">
          <p>
            注意: 某些错误会在后台自动捕获。请打开错误控制台查看所有记录的错误。
          </p>
        </div>
      </div>
    </div>
  );
}

export default DebugTester; 