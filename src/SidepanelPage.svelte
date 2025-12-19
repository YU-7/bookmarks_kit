<script lang="ts">
  interface Bookmark {
    id: string;
    title: string;
    url?: string;
    parentId?: string;
  }

  let searchQuery: string = $state('');
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
      const query = searchQuery.trim();
      const bookmarks = await chrome.bookmarks.search(query);
      searchResults = bookmarks.filter((b) => b.url);
    } catch (error) {
      console.error('搜索书签时出错:', error);
      searchResults = [];
    } finally {
      isSearching = false;
    }
  };

  const handleInput = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }

    searchTimeout = setTimeout(() => {
      handleSearch();
    }, 300);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
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
      return '';
    }
  };

  const handleImageError = (e: Event) => {
    const target = e.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  };
</script>

<main class="sidepanel-container bg-surface-1">
  <header
    class="flex items-center gap-3 px-4 py-3 border-b border-surface-3 bg-surface-1"
  >
    <h1
      class="text-base font-semibold flex-1 text-surface-900 dark:text-surface-50"
    >
      Bookmarks Kit
    </h1>
  </header>

  <div class="px-4 py-3 border-b border-surface-3 bg-surface-1">
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
          class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-500"
        >
          搜索中...
        </span>
      {/if}
    </div>
  </div>

  <div class="flex-1 overflow-y-auto px-4 py-3">
    {#if searchResults.length > 0}
      <div class="text-xs text-surface-500 mb-2">
        找到 {searchResults.length} 个结果
      </div>
      <div class="space-y-2">
        {#each searchResults as bookmark}
          <div
            class="card variant-filled-surface cursor-pointer hover:shadow-md transition-all"
            onclick={() => bookmark.url && openBookmark(bookmark.url)}
            onkeydown={(e) =>
              e.key === 'Enter' && bookmark.url && openBookmark(bookmark.url)}
            role="button"
            tabindex="0"
          >
            <div class="flex items-start gap-3">
              {#if bookmark.url}
                <div
                  class="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-surface-2 rounded overflow-hidden"
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
                  class="text-sm font-medium text-surface-900 dark:text-surface-50 mb-0.5 truncate"
                  title={bookmark.title}
                >
                  {bookmark.title}
                </h3>
                {#if bookmark.url}
                  <p
                    class="text-xs text-surface-500 truncate break-all"
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
      <div class="text-center py-6 text-surface-500 text-sm">
        <p>未找到匹配的书签</p>
      </div>
    {:else}
      <div class="text-center py-6 text-surface-500 text-sm">
        <p>输入关键词搜索书签</p>
      </div>
    {/if}
  </div>
</main>

<style>
  .sidepanel-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .sidepanel-container .card {
    max-width: 100%;
    box-sizing: border-box;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .sidepanel-container * {
    max-width: 100%;
    box-sizing: border-box;
  }
</style>


