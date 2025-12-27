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
    interface Tab {
      id?: number
      url?: string
      title?: string
      active?: boolean
      pinned?: boolean
    }

    interface CreateProperties {
      url?: string
      active?: boolean
      pinned?: boolean
      index?: number
    }

    interface QueryInfo {
      active?: boolean
      currentWindow?: boolean
    }

    function create(createProperties: CreateProperties): Promise<void>
    function query(queryInfo: QueryInfo): Promise<Tab[]>
  }

  namespace sidePanel {
    interface OpenOptions {
      tabId?: number
    }

    interface SetOptions {
      enabled?: boolean
    }

    function open(options?: OpenOptions): Promise<void>
    function setOptions(options: SetOptions): Promise<void>
  }

  namespace runtime {
    function getURL(path: string): string
    const onInstalled: {
      addListener(callback: () => void): void
    }
  }

  namespace contextMenus {
    interface CreateProperties {
      id?: string
      title: string
      contexts?: string[]
    }

    interface OnClickData {
      menuItemId: string | number
    }

    function create(properties: CreateProperties): void
    function remove(menuItemId: string): Promise<void>
    const onClicked: {
      addListener(callback: (info: OnClickData, tab?: Tab) => void | Promise<void>): void
    }
  }

  namespace action {
    interface Tab {
      id?: number
      url?: string
      title?: string
    }

    interface OnClickEvent {
      addListener(callback: (tab: Tab) => void | Promise<void>): void
    }

    const onClicked: OnClickEvent
  }
}

declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[]): void
    exec(sql: string): { columns: string[]; values: any[][] }
    prepare(sql: string): Statement
    export(): Uint8Array
    close(): void
  }

  export interface Statement {
    bind(params: any[]): void
    step(): boolean
    getAsObject(): { [key: string]: any }
    free(): void
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database
  }

  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string
  }): Promise<SqlJsStatic>
}

