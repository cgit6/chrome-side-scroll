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

// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('内容脚本捕获到错误:', event.error);
});

// 监听页面刷新或关闭事件
window.addEventListener('beforeunload', () => {
  console.log('页面即将刷新或关闭');
  // 通知扩展程序页面即将刷新或关闭
  try {
    chrome.runtime.sendMessage({ action: 'pageRefresh' })
      .catch(error => console.log('页面刷新通知发送失败，可能是正常的连接断开'));
  } catch (error) {
    console.log('发送刷新通知失败:', error);
  }
  
  // 尝试立即移除遮罩
  removeOverlay();
});

// 添加全局函数以便于调试
window.testCreateOverlay = createOverlay;
window.testRemoveOverlay = removeOverlay;

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