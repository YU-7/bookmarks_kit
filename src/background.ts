// 侧边栏状态管理
let isSidePanelOpen = false;

// 初始化侧边栏状态
async function initializeSidePanel() {
  try {
    // 默认启用侧边栏
    await chrome.sidePanel.setOptions({ enabled: true });
  } catch (error) {
    console.error('初始化侧边栏失败:', error);
  }
}

// 切换侧边栏状态
function toggleSidePanel(tabId?: number) {
  // 直接在用户手势上下文中执行，避免任何异步操作

  if (isSidePanelOpen) {
    // 关闭侧边栏：禁用侧边栏
    try {
      chrome.sidePanel.setOptions({ enabled: false });
      isSidePanelOpen = false;
    } catch (error) {
      console.error('关闭侧边栏失败:', error);
    }
  } else {
    // 打开侧边栏：启用并打开侧边栏
    try {
      chrome.sidePanel.setOptions({ enabled: true });
      if (tabId) {
        chrome.sidePanel.open({ tabId });
      }
      isSidePanelOpen = true;
    } catch (error) {
      console.error('打开侧边栏失败:', error);
      isSidePanelOpen = false;
    }
  }
}

// 打开搜索页面
async function openSearchPage() {
  try {
    await chrome.tabs.create({
      url: chrome.runtime.getURL('search.html'),
    });
  } catch (error) {
    console.error('打开搜索页面失败:', error);
  }
}

// 当用户点击扩展图标时，切换侧边栏状态
chrome.action.onClicked.addListener((tab: chrome.action.Tab) => {
  // 直接在用户手势上下文中调用，避免异步操作丢失上下文
  toggleSidePanel(tab.id);
});

// 创建右键菜单
async function createContextMenu() {
  try {
    // 先尝试删除已存在的菜单（如果存在）
    await chrome.contextMenus.remove('open-main-page').catch(() => {
      // 如果菜单不存在，忽略错误
    });
    // 创建新菜单
    chrome.contextMenus.create({
      id: 'open-main-page',
      title: '打开搜索页面',
      contexts: ['action'], // 只在扩展图标上显示
    });
  } catch (error) {
    console.error('创建右键菜单失败:', error);
  }
}

// 扩展安装或启动时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// Service worker 启动时也创建菜单和初始化侧边栏
createContextMenu();
initializeSidePanel();

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'open-main-page') {
    await openSearchPage();
  }
});
