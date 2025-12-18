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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }

    isSearching = true;
    try {
      // 使用 Chrome 书签 API 搜索书签
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

<main class="min-h-screen">
  <div class="max-w-6xl mx-auto p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-50">
        书签搜索
      </h1>
    </header>

    <div class="flex gap-4 mb-8">
      <input
        type="text"
        placeholder="输入关键词搜索书签（支持实时搜索）..."
        bind:value={searchQuery}
        oninput={handleInput}
        onkeypress={handleKeyPress}
        autofocus
        class="input variant-filled-surface flex-1"
      />
      <button
        onclick={handleSearch}
        disabled={isSearching}
        class="btn variant-filled-primary"
      >
        {isSearching ? "搜索中..." : "搜索"}
      </button>
    </div>

    <div>
      {#if searchResults.length > 0}
        <div class="text-sm text-surface-500 mb-4">
          找到 {searchResults.length} 个结果
        </div>
        <div class="space-y-3">
          {#each searchResults as bookmark}
            <div class="card variant-filled-surface">
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-start gap-3 flex-1 min-w-0">
                  {#if bookmark.url}
                    <div
                      class="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-2 rounded overflow-hidden"
                    >
                      <img
                        src={getFaviconUrl(bookmark.url)}
                        alt=""
                        onerror={handleImageError}
                        class="w-full h-full object-cover"
                      />
                    </div>
                  {/if}
                  <div class="flex-1 min-w-0">
                    <h3
                      class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1"
                    >
                      {bookmark.title}
                    </h3>
                    {#if bookmark.url}
                      <p class="text-sm text-surface-500 break-all">
                        {bookmark.url}
                      </p>
                    {/if}
                  </div>
                </div>
                {#if bookmark.url}
                  <button
                    onclick={() => openBookmark(bookmark.url!)}
                    class="btn variant-filled-primary"
                  >
                    打开
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else if searchQuery && !isSearching}
        <div class="text-center py-12 text-surface-500">
          <p>未找到匹配的书签</p>
        </div>
      {/if}
    </div>
  </div>
</main>
