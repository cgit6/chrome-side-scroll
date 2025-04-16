// 当扩展安装或更新时，注册侧边栏
chrome.runtime.onInstalled.addListener(() => {
  console.log('扩展已安装或更新');
  // 注册侧边栏
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// 当用户点击扩展图标时
chrome.action.onClicked.addListener((tab) => {
  console.log('用户点击了扩展图标');
  // 打开侧边栏
  chrome.sidePanel.open({ tabId: tab.id });
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('后台脚本收到消息:', request);
  
  // 处理页面刷新消息
  if (request.action === 'pageRefresh') {
    console.log('收到页面刷新消息，转发给扩展弹出窗口');
    // 将消息转发给扩展弹出窗口和其他监听者
    chrome.runtime.sendMessage({ action: 'pageRefresh' })
      .catch(error => {
        // 如果弹出窗口未打开，这个错误是正常的，可以忽略
        console.log('通知扩展弹出窗口失败，可能弹出窗口未打开');
      });
    
    sendResponse({ status: 'success' });
    return true;
  }
  return false;
}); 