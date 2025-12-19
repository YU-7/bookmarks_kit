<script lang="ts">
  interface Bookmark {
    id: string;
    title: string;
    url?: string;
    parentId?: string;
  }

  let searchQuery: string = $state("");
  let searchResults: Bookmark[] = $state([]);
  let isSearching: boolean = $state(false);
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  const openSearchPage = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("search.html"),
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }

    isSearching = true;
    try {
      const query = searchQuery.trim();
      const bookmarks = await chrome.bookmarks.search(query);
      // 只显示有 URL 的书签（排除文件夹）
      searchResults = bookmarks.filter((b) => b.url);
    } catch (error) {
      console.error("搜索书签时出错:", error);
      searchResults = [];
    } finally {
      isSearching = false;
    }
  };

  const handleInput = () => {
    // 清除之前的定时器
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // 如果输入框为空，立即清空结果
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }

    // 防抖：300ms 后执行搜索
    searchTimeout = setTimeout(() => {
      handleSearch();
    }, 300);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      // 清除防抖定时器，立即搜索
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      handleSearch();
    }
  };

  const openBookmark = (url: string) => {
    if (url) {
      chrome.tabs.create({ url });
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return "";
    }
  };

  const handleImageError = (e: Event) => {
    const target = e.target as HTMLImageElement;
    if (target) {
      target.style.display = "none";
    }
  };
</script>

<main class="popup-container">
  <header
    class="flex items-center gap-3 p-4 border-b border-surface-3 bg-surface-1"
  >
    <button
      onclick={openSearchPage}
      class="btn variant-ghost-surface p-2 w-8 h-8 flex items-center justify-center rounded"
      title="打开搜索页面"
    >
      🔍
    </button>
    <h1
      class="text-xl font-semibold flex-1 text-surface-900 dark:text-surface-50"
    >
      Bookmarks Kit
    </h1>
  </header>

  <div class="p-4 border-b border-surface-3 bg-surface-1">
    <div class="relative">
      <input
        type="text"
        placeholder="搜索书签..."
        bind:value={searchQuery}
        oninput={handleInput}
        onkeypress={handleKeyPress}
        class="input variant-filled-surface w-full"
      />
      {#if isSearching}
        <span
          class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-500"
        >
          搜索中...
        </span>
      {/if}
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    {#if searchResults.length > 0}
      <div class="text-sm text-surface-500 mb-3">
        找到 {searchResults.length} 个结果
      </div>
      <div class="space-y-3">
        {#each searchResults as bookmark}
          <div
            class="card variant-filled-surface cursor-pointer hover:shadow-lg transition-all"
            onclick={() => bookmark.url && openBookmark(bookmark.url)}
            onkeydown={(e) =>
              e.key === "Enter" && bookmark.url && openBookmark(bookmark.url)}
            role="button"
            tabindex="0"
          >
            <div class="flex items-start gap-3">
              {#if bookmark.url}
                <div
                  class="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-surface-2 rounded overflow-hidden"
                >
                  <img
                    src={getFaviconUrl(bookmark.url)}
                    alt=""
                    onerror={handleImageError}
                    class="w-full h-full object-cover"
                  />
                </div>
              {/if}
              <div class="flex-1 min-w-0 overflow-hidden">
                <h3
                  class="text-base font-medium text-surface-900 dark:text-surface-50 mb-1 truncate"
                  title={bookmark.title}
                >
                  {bookmark.title}
                </h3>
                {#if bookmark.url}
                  <p
                    class="text-sm text-surface-500 truncate break-all"
                    title={bookmark.url}
                  >
                    {bookmark.url}
                  </p>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if searchQuery && !isSearching}
      <div class="text-center py-8 text-surface-500">
        <p>未找到匹配的书签</p>
      </div>
    {:else}
      <div class="text-center py-8 text-surface-500">
        <p>输入关键词搜索书签</p>
      </div>
    {/if}
  </div>
</main>

<style>
  .popup-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  /* 确保卡片不会超出容器 */
  .popup-container .card {
    max-width: 100%;
    box-sizing: border-box;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  /* 确保所有子元素都不会超出 */
  .popup-container * {
    max-width: 100%;
    box-sizing: border-box;
  }
</style>
