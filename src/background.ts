// 当用户点击扩展图标时，打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 如果有 tab.id，在特定标签页打开侧边栏
    if (tab.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
    } else {
      // 如果没有 tab.id（比如在扩展页面点击），获取当前活动标签页
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        await chrome.sidePanel.open({ tabId: activeTab.id });
      }
    }
  } catch (error) {
    console.error('打开侧边栏失败:', error);
  }
});
