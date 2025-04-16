import { useState, useEffect, useRef } from 'react';

function ScrollButton() {
  const [scrollCount, setScrollCount] = useState('10'); // 使用字符串类型以支持空值
  const [isScrolling, setIsScrolling] = useState(false); // 是否正在滾動
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0); // 當前滾動的索引
  const [errorMsg, setErrorMsg] = useState(''); // 错误提示信息
  const isScrollingRef = useRef(false); // 使用 ref 来跟踪滚动状态，避免闭包问题
  const overlayCreatedRef = useRef(false); // 跟踪遮罩层是否已创建

  // 添加消息监听器，处理页面刷新事件
  useEffect(() => {
    // 监听来自内容脚本的消息
    const handleMessage = (request, sender, sendResponse) => {
      console.log('组件收到消息:', request);
      if (request.action === 'pageRefresh' && isScrollingRef.current) {
        // 页面刷新时停止滚动
        stopScrolling();
        if (sendResponse) {
          sendResponse({ status: 'success' });
        }
      }
      return true; // 保持消息通道开启
    };

    // 注册消息监听器
    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
      console.log('已添加消息监听器');
    } else {
      console.error('无法添加消息监听器，chrome.runtime.onMessage 不可用');
    }

    // 组件卸载时移除监听器
    return () => {
      if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
        console.log('已移除消息监听器');
      }
    };
  }, []); // 移除依赖项，避免重复添加监听器

  // 同步更新 isScrolling 状态和 ref
  useEffect(() => {
    console.log('滚动状态变化:', isScrolling);
    isScrollingRef.current = isScrolling;
    
    // 当滚动状态变为 false 且遮罩已创建时，移除遮罩
    if (!isScrolling && overlayCreatedRef.current) {
      console.log('触发遮罩移除');
      (async () => {
        await removePageOverlay();
        overlayCreatedRef.current = false;
      })();
    }
  }, [isScrolling]);

  // 停止滚动的函数
  const stopScrolling = async () => {
    console.log('执行停止滚动');
    if (!isScrollingRef.current) return;
    
    try {
      // 在 stopScrolling 中不立即移除遮罩，而是通过状态变化触发移除
      // 移除遮罩的逻辑已移至 useEffect
    } catch (error) {
      console.error('停止滚动过程中出错', error);
    } finally {
      // 更新状态
      setIsScrolling(false);
      setCurrentScrollIndex(0);
    }
  };

  // 处理滚动次数输入
  const handleInputChange = (e) => {
    const value = e.target.value;
    // 允许输入框为空或正整数
    if (value === '' || (parseInt(value) > 0 && /^\d+$/.test(value))) {
      setScrollCount(value);
      setErrorMsg(''); // 清除错误信息
    }
  };

  // 创建遮罩
  const createPageOverlay = async () => {
    console.log('尝试创建遮罩');
    try {
      // 确保当前有活动标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        console.error('无法获取当前活动标签页');
        return false;
      }
      
      const tab = tabs[0];
      console.log('获取到活动标签页:', tab.id);
      
      // 先注入内容脚本确保它已加载
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log('内容脚本注入成功');
      } catch (injectError) {
        console.log('内容脚本注入失败或已存在:', injectError);
        // 继续执行，因为脚本可能已经存在
      }
      
      // 向内容脚本发送消息
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'createOverlay' });
      console.log('创建遮罩响应:', response);
      
      if (response && response.status === 'success') {
        overlayCreatedRef.current = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('創建遮罩過程中發生錯誤', error);
      return false;
    }
  };

  // 移除遮罩
  const removePageOverlay = async () => {
    console.log('尝试移除遮罩');
    try {
      if (!overlayCreatedRef.current) {
        console.log('遮罩未创建，无需移除');
        return;
      }
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        console.error('无法获取当前活动标签页');
        overlayCreatedRef.current = false; // 重置状态
        return;
      }
      
      await chrome.tabs.sendMessage(tabs[0].id, { action: 'removeOverlay' });
      console.log('移除遮罩指令已发送');
      overlayCreatedRef.current = false;
    } catch (error) {
      console.error('移除遮罩過程中發生錯誤', error);
      overlayCreatedRef.current = false; // 重置状态，避免卡死
    }
  };

  // 执行单次滚动
  const scrollOnce = async () => {
    console.log('尝试执行单次滚动');
    if (!isScrollingRef.current) {
      console.log('滚动已停止，不执行滚动');
      return { status: 'stopped' };
    }

    try {
      // 获取当前活动标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        console.error('无法获取当前活动标签页');
        return { status: 'error' };
      }
      
      // 向内容脚本发送消息
      console.log('发送滚动消息到标签页:', tabs[0].id);
      return await chrome.tabs.sendMessage(tabs[0].id, { action: 'scrollToBottom' });
    } catch (error) {
      console.log('滚动失败，尝试注入内容脚本', error);
      // 注入内容脚本并重试
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
          console.error('无法获取当前活动标签页');
          return { status: 'error' };
        }
        
        console.log('注入内容脚本到标签页:', tabs[0].id);
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        });
        
        console.log('内容脚本注入成功，重新发送消息');
        // 重新发送消息
        return await chrome.tabs.sendMessage(tabs[0].id, { action: 'scrollToBottom' });
      } catch (retryError) {
        console.error('無法執行滾動操作', retryError);
        return { status: 'error' };
      }
    }
  };

  // 执行指定次数的滚动
  const handleScrollToBottom = async () => {
    console.log('点击自动滚动按钮');
    
    if (isScrollingRef.current) {
      console.log('已经在滚动中，忽略点击');
      return; // 避免重複觸發
    }

    // 检查输入框是否为空
    if (scrollCount === '') {
      setErrorMsg('請輸入滾動次數');
      return;
    }
    
    // 将字符串转换为数字
    const count = parseInt(scrollCount);
    console.log(`准备滚动 ${count} 次`);
    
    // 先设置状态
    setIsScrolling(true);
    setCurrentScrollIndex(0);
    setErrorMsg(''); // 清除错误信息
    
    // 确保 ref 也被更新
    isScrollingRef.current = true;
    
    // 首先创建全局遮罩，并保持直到所有滚动完成
    console.log('开始创建遮罩');
    const overlayCreated = await createPageOverlay();
    console.log('遮罩创建结果:', overlayCreated);
    
    if (!overlayCreated) {
      console.error('无法创建遮罩，中止滚动');
      setIsScrolling(false);
      isScrollingRef.current = false;
      setErrorMsg('連接頁面失敗，請重試');
      return;
    }
    
    let successCount = 0;
    try {
      console.log('开始滚动循环');
      for (let i = 0; i < count; i++) {
        // 检查是否已停止滚动
        if (!isScrollingRef.current) {
          console.log('滚动已停止，跳出循环');
          break;
        }
        
        setCurrentScrollIndex(i + 1);
        console.log(`更新滚动索引为 ${i + 1}`);
        
        // 等待前一次滾動動畫完成（約1.5秒）
        if (i > 0) {
          console.log('等待前一次滚动完成');
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // 再次检查是否已停止滚动
        if (!isScrollingRef.current) {
          console.log('滚动已停止，跳出循环');
          break;
        }
        
        console.log(`开始第 ${i + 1} 次滚动`);
        const response = await scrollOnce();
        console.log(`滚动响应:`, response);
        
        if (response && response.status === 'success') {
          console.log('滚动成功');
          successCount++;
        } else if (response && response.status === 'stopped') {
          console.log('收到停止信号，中断滚动');
          break;
        } else {
          console.log('滚动失败，中断循环');
          break; // 如果滾動失敗，停止循環
        }
      }
    } catch (error) {
      console.error('滾動過程發生錯誤', error);
      setErrorMsg('滾動過程出錯，請重試');
    } finally {
      console.log('滚动循环结束，清理状态');
      // 所有滚动完成后不直接移除遮罩，而是通过状态变化触发移除
      setIsScrolling(false);
      isScrollingRef.current = false;
      setCurrentScrollIndex(0);
      // 遮罩会在 useEffect 中处理移除
    }
  };

  // 生成滚动状态文本
  const getButtonText = () => {
    if (!isScrolling) return '自動滾動';
    if (scrollCount === '1') return '滾動中...';
    return `滾動中 (${currentScrollIndex}/${scrollCount})`;
  };

  return (
    <div className="scroll-component">
      <div className="scroll-input-group">
        <label htmlFor="scrollCount">滾動次數：</label>
        <input 
          id="scrollCount"
          type="text" 
          placeholder="請輸入次數"
          value={scrollCount}
          onChange={handleInputChange}
          className="scroll-count-input"
          disabled={isScrolling}
        />
      </div>
      
      {errorMsg && <div className="error-message">{errorMsg}</div>}
      
      <button 
        className={`scroll-button ${isScrolling ? 'scrolling' : ''}`}
        onClick={handleScrollToBottom}
        disabled={isScrolling}
      >
        {getButtonText()}
        {isScrolling && <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>}
      </button>
    </div>
  );
}

export default ScrollButton; 