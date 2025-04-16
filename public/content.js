// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrollToBottom') {
    // 滚动到页面底部
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
    
    // 返回成功消息
    sendResponse({ status: 'success' });
  }
  return true; // 保持消息通道开启
}); 