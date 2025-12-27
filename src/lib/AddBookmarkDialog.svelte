<script lang="ts">
  interface Props {
    bookmark: {
      id?: string;
      title: string;
      url?: string;
    } | null;
    onClose: () => void;
    onSave: (data: {
      title: string;
      url: string;
      internalUrl: string;
      iconUrl: string;
      tags: string[];
    }) => Promise<void>;
  }

  let { bookmark = null, onClose, onSave }: Props = $props();

  let title: string = $state('');
  let url: string = $state('');
  let internalUrl: string = $state('');
  let iconUrl: string = $state('');
  let tagInput: string = $state('');
  let tags: string[] = $state([]);
  let isSaving: boolean = $state(false);

  // 当 bookmark prop 变化时，更新表单字段
  $effect(() => {
    if (bookmark) {
      title = bookmark.title || '';
      url = bookmark.url || '';
      if (bookmark.url && !iconUrl) {
        try {
          const urlObj = new URL(bookmark.url);
          iconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
        } catch {
          // 忽略无效 URL
        }
      }
    } else {
      // 如果 bookmark 为 null，清空表单
      title = '';
      url = '';
      internalUrl = '';
      iconUrl = '';
      tags = [];
    }
  });

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      tags = [...tags, tag];
      tagInput = '';
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    tags = tags.filter((tag) => tag !== tagToRemove);
  };

  const handleTagInputKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      alert('请填写标题和 URL');
      return;
    }

    isSaving = true;
    try {
      await onSave({
        title: title.trim(),
        url: url.trim(),
        internalUrl: internalUrl.trim(),
        iconUrl: iconUrl.trim(),
        tags: tags,
      });
      onClose();
    } catch (error) {
      console.error('保存书签失败:', error);
      alert('保存失败，请重试');
    } finally {
      isSaving = false;
    }
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
</script>

<div
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  onclick={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <div
    class="bg-surface-1 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-surface-3"
  >
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 id="dialog-title" class="text-lg font-semibold text-surface-900 dark:text-surface-50">
          添加书签
        </h2>
        <button
          onclick={onClose}
          class="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-2 text-surface-500 hover:text-surface-900 dark:hover:text-surface-50 transition"
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      <div class="space-y-4">
        <!-- 标题 -->
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            标题 <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            bind:value={title}
            placeholder="输入书签标题"
            class="input variant-filled-surface w-full"
          />
        </div>

        <!-- URL -->
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            URL 地址 <span class="text-red-500">*</span>
          </label>
          <input
            type="url"
            bind:value={url}
            placeholder="https://example.com"
            class="input variant-filled-surface w-full"
          />
        </div>

        <!-- 内网 URL -->
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            内网 URL 地址
          </label>
          <input
            type="url"
            bind:value={internalUrl}
            placeholder="http://internal.example.com"
            class="input variant-filled-surface w-full"
          />
        </div>

        <!-- 图标 URL -->
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            图标 URL
          </label>
          <input
            type="url"
            bind:value={iconUrl}
            placeholder="https://example.com/favicon.ico"
            class="input variant-filled-surface w-full"
          />
          {#if iconUrl}
            <div class="mt-2 flex items-center gap-2">
              <img src={iconUrl} alt="图标预览" class="w-6 h-6 rounded" onerror={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
              <span class="text-xs text-surface-500">图标预览</span>
            </div>
          {/if}
        </div>

        <!-- 标签 -->
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            标签
          </label>
          <div class="flex gap-2 mb-2">
            <input
              type="text"
              bind:value={tagInput}
              onkeypress={handleTagInputKeyPress}
              placeholder="输入标签后按 Enter"
              class="input variant-filled-surface flex-1"
            />
            <button
              onclick={handleAddTag}
              class="btn variant-filled-primary px-4"
              type="button"
            >
              添加
            </button>
          </div>
          {#if tags.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each tags as tag}
                <span
                  class="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onclick={() => handleRemoveTag(tag)}
                    class="hover:text-primary-900 dark:hover:text-primary-100"
                    type="button"
                    aria-label="删除标签 {tag}"
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3 mt-6">
        <button
          onclick={onClose}
          class="btn variant-ghost-surface flex-1"
          type="button"
          disabled={isSaving}
        >
          取消
        </button>
        <button
          onclick={handleSave}
          class="btn variant-filled-primary flex-1"
          type="button"
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  </div>
</div>

