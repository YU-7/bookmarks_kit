<script lang="ts">
  import { DatabaseManager } from './lib/database';
  import AddBookmarkDialog from './lib/AddBookmarkDialog.svelte';

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
  let showAddDialog: boolean = $state(false);
  let selectedBookmark: Bookmark | null = $state(null);
  let dbManager = DatabaseManager.getInstance();

  // 初始化数据库
  $effect(() => {
    dbManager.initialize().catch((error) => {
      console.error('数据库初始化失败:', error);
    });
  });

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

  const handleAddBookmark = (bookmark: Bookmark) => {
    selectedBookmark = bookmark;
    showAddDialog = true;
  };

  const handleSaveBookmark = async (data: {
    title: string;
    url: string;
    internalUrl: string;
    iconUrl: string;
    tags: string[];
  }) => {
    try {
      await dbManager.initialize();
      const bookmarkId = `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Math.floor(Date.now() / 1000);

      // 保存书签
      await dbManager.execute(
        `INSERT INTO bookmarks (id, title, url, internal_url, icon_url, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          bookmarkId,
          data.title,
          data.url,
          data.internalUrl || null,
          data.iconUrl || null,
          now,
          now,
        ]
      );

      // 保存标签
      if (data.tags.length > 0) {
        const tagOperations = [];
        for (const tagName of data.tags) {
          const tagId = `tag_${tagName.toLowerCase().replace(/\s+/g, '_')}`;
          
          // 确保标签存在
          await dbManager.execute(
            `INSERT OR IGNORE INTO tags (id, name, created_at) VALUES (?, ?, ?)`,
            [tagId, tagName, now]
          );
          
          // 关联书签和标签
          await dbManager.execute(
            `INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)`,
            [bookmarkId, tagId]
          );
        }
      }

      console.log('书签已保存:', bookmarkId);
      alert('书签已保存！');
    } catch (error) {
      console.error('保存书签失败:', error);
      throw error;
    }
  };

  const handleCloseDialog = () => {
    showAddDialog = false;
    selectedBookmark = null;
  };
</script>

<main class="min-h-screen bg-surface-1">
  <div class="flex flex-col h-screen">
    <!-- 顶部导航栏，模仿 Slash / Shortcuts 风格 -->
    <header
      class="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-surface-3/40 bg-surface-1"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-full border border-surface-3/60 flex items-center justify-center text-lg font-semibold"
        >
          B
        </div>
        <div class="flex items-center gap-1 text-surface-900 dark:text-surface-50">
          <span class="font-semibold">Bookmarks</span>
          <span class="text-surface-500">/</span>
          <span>Shortcuts</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-sm text-surface-500 hidden sm:block">
          书签搜索
        </div>
        <div
          class="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-medium text-surface-600"
        >
          BK
        </div>
      </div>
    </header>

    <!-- 顶部标签过滤（当前只是展示样式，不做实际过滤） -->
    <section
      class="px-6 lg:px-10 pt-4 pb-3 border-b border-surface-3/40 bg-surface-1"
    >
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="px-4 py-1.5 rounded-full text-sm font-medium bg-primary-500 text-white shadow-sm"
        >
          所有
        </button>
        <button
          class="px-4 py-1.5 rounded-full text-sm text-surface-600 bg-surface-2 hover:bg-surface-3 transition"
        >
          我的
        </button>
        <button
          class="px-4 py-1.5 rounded-full text-sm text-surface-600 bg-surface-2 hover:bg-surface-3 transition"
        >
          #NAS
        </button>
        <button
          class="px-4 py-1.5 rounded-full text-sm text-surface-600 bg-surface-2 hover:bg-surface-3 transition"
        >
          #Work
        </button>
        <button
          class="px-4 py-1.5 rounded-full text-sm text-surface-600 bg-surface-2 hover:bg-surface-3 transition"
        >
          #Dev
        </button>
      </div>
    </section>

    <!-- 搜索框区域 -->
    <section class="px-6 lg:px-10 py-4 bg-surface-1 border-b border-surface-3/40">
      <div class="flex items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md">
          <div
            class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-surface-500 text-sm"
          >
            🔍
          </div>
          <input
            type="text"
            placeholder="搜索书签..."
            bind:value={searchQuery}
            oninput={handleInput}
            onkeypress={handleKeyPress}
            autofocus
            class="w-full h-10 pl-9 pr-3 rounded-full bg-surface-2 border border-surface-3/60 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {#if isSearching}
          <div class="text-xs text-surface-500 whitespace-nowrap">
            搜索中...
          </div>
        {/if}
      </div>
    </section>

    <!-- 结果区域：网格卡片布局 -->
    <section class="flex-1 overflow-auto px-6 lg:px-10 py-4 bg-surface-1">
      {#if searchResults.length > 0}
        <div class="text-xs text-surface-500 mb-3">
          找到 {searchResults.length} 个结果
        </div>

        <div
          class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr"
        >
          {#each searchResults as bookmark}
            <div
              class="card variant-filled-surface rounded-xl border border-surface-3/40 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              onclick={() => bookmark.url && openBookmark(bookmark.url)}
            >
              <div class="flex items-start gap-3 mb-3">
                {#if bookmark.url}
                  <div
                    class="w-10 h-10 flex-shrink-0 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden"
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
                  <div
                    class="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate"
                    title={bookmark.title}
                  >
                    {bookmark.title}
                  </div>
                  {#if bookmark.url}
                    <div
                      class="mt-1 text-xs text-surface-500 truncate"
                      title={bookmark.url}
                    >
                      {bookmark.url}
                    </div>
                  {/if}
                </div>
              </div>

              {#if bookmark.url}
                <div class="mt-auto pt-2 border-t border-surface-3/30">
                  <div class="flex items-center justify-between text-[11px] text-surface-500">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded-full bg-surface-2">
                        书签
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        onclick={(e) => {
                          e.stopPropagation();
                          handleAddBookmark(bookmark);
                        }}
                        class="px-2 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition"
                        title="添加到数据库"
                      >
                        ➕ 添加
                      </button>
                      <span>点击打开</span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else if searchQuery && !isSearching}
        <div class="h-full flex items-center justify-center text-surface-500">
          <p>未找到匹配的书签</p>
        </div>
      {:else}
        <div class="h-full flex items-center justify-center text-surface-400 text-sm">
          输入关键词开始搜索书签
        </div>
      {/if}
    </section>
  </div>

  {#if showAddDialog && selectedBookmark}
    <AddBookmarkDialog
      bookmark={selectedBookmark}
      onClose={handleCloseDialog}
      onSave={handleSaveBookmark}
    />
  {/if}
</main>
