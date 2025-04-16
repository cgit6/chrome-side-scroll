import { useState } from 'react';

function ScrollButton() {
  const [scrollStatus, setScrollStatus] = useState('准备就绪'); // 動作的狀態

  // 处理滚动到底部
  const handleScrollToBottom = async () => {
    setScrollStatus('正在滚动...');

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 向内容脚本发送消息
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrollToBottom' });
      
      if (response && response.status === 'success') {
        setScrollStatus('滚动成功！');
        
        // 3秒后重置状态
        setTimeout(() => {
          setScrollStatus('准备就绪');
        }, 3000);
      }
    } catch (error) {
      setScrollStatus('出错了：' + error.message);
      
      // 注入内容脚本并重试
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // 重新发送消息
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrollToBottom' });
        
        if (response && response.status === 'success') {
          setScrollStatus('滚动成功！');
          
          // 3秒后重置状态
          setTimeout(() => {
            setScrollStatus('准备就绪');
          }, 3000);
        }
      } catch (retryError) {
        setScrollStatus('无法执行滚动操作');
      }
    }
  };

  return (
    <div className="scroll-component">
      <button 
        className="scroll-button"
        onClick={handleScrollToBottom}
      >
        自動滾動
      </button>
      
      <div className="status-indicator">
        状态: {scrollStatus}
      </div>
    </div>
  );
}

export default ScrollButton; 