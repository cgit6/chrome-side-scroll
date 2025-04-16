// 当扩展安装或更新时，注册侧边栏
chrome.runtime.onInstalled.addListener(() => {
  // 注册侧边栏
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// 当用户点击扩展图标时
chrome.action.onClicked.addListener((tab) => {
  // 打开侧边栏
  chrome.sidePanel.open({ tabId: tab.id });
}); 