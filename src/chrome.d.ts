/// <reference types="chrome" />

declare namespace chrome {
  namespace bookmarks {
    interface BookmarkTreeNode {
      id: string
      parentId?: string
      index?: number
      url?: string
      title: string
      dateAdded?: number
      dateGroupModified?: number
      children?: BookmarkTreeNode[]
    }

    function search(query: string | { query?: string; url?: string; title?: string }): Promise<BookmarkTreeNode[]>
    function getTree(): Promise<BookmarkTreeNode[]>
    function get(idOrIdList: string | string[]): Promise<BookmarkTreeNode[]>
  }

  namespace tabs {
    interface CreateProperties {
      url?: string
      active?: boolean
      pinned?: boolean
      index?: number
    }

    function create(createProperties: CreateProperties): Promise<void>
  }

  namespace runtime {
    function getURL(path: string): string
  }
}

