import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

/**
 * SQLite 数据库管理类
 * 使用 IndexedDB 作为持久化存储
 */
export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private db: Database | null = null;
  private sqlJs: SqlJsStatic | null = null;
  private dbName: string = 'bookmarks_kit.db';
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * 获取数据库管理器单例
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 初始化数据库
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // 如果已经在初始化中，返回同一个 promise
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      // 初始化 sql.js
      // 在 Chrome 扩展中，从本地加载 wasm 文件
      const SQL = await initSqlJs({
        locateFile: (file: string) => {
          // 使用 chrome.runtime.getURL 获取扩展内的资源 URL
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            return chrome.runtime.getURL(`assets/sqljs/${file}`);
          }
          // 非扩展环境（开发时），使用相对路径
          return `assets/sqljs/${file}`;
        },
      });
      this.sqlJs = SQL;

      // 从 IndexedDB 加载数据库，如果不存在则创建新数据库
      const savedDb = await this.loadFromIndexedDB();
      if (savedDb) {
        this.db = new SQL.Database(savedDb);
        // 检查并迁移数据库结构（如果需要）
        this.migrateDatabase();
        await this.saveToIndexedDB();
      } else {
        this.db = new SQL.Database();
        this.createTables();
        await this.saveToIndexedDB();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('初始化数据库失败:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * 数据库迁移：添加新字段（如果需要）
   */
  private migrateDatabase(): void {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    try {
      // 检查表是否存在
      const tables = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmarks'");
      if (tables.length === 0) {
        // 表不存在，创建新表
        this.createTables();
        return;
      }

      // 检查是否需要添加新字段
      try {
        const tableInfo = this.db.exec("PRAGMA table_info(bookmarks)");
        if (tableInfo.length > 0 && tableInfo[0].values) {
          const columns = tableInfo[0].values.map((row: any[]) => row[1]) as string[];
          
          // 添加 internal_url 字段（如果不存在）
          if (!columns.includes('internal_url')) {
            this.db.run('ALTER TABLE bookmarks ADD COLUMN internal_url TEXT');
          }
          
          // 添加 icon_url 字段（如果不存在）
          if (!columns.includes('icon_url')) {
            this.db.run('ALTER TABLE bookmarks ADD COLUMN icon_url TEXT');
          }
        }
      } catch (pragmaError) {
        // 如果 PRAGMA 失败，尝试直接添加字段（会失败如果字段已存在，但不影响）
        try {
          this.db.run('ALTER TABLE bookmarks ADD COLUMN internal_url TEXT');
        } catch {
          // 字段可能已存在，忽略错误
        }
        try {
          this.db.run('ALTER TABLE bookmarks ADD COLUMN icon_url TEXT');
        } catch {
          // 字段可能已存在，忽略错误
        }
      }
    } catch (error) {
      console.error('数据库迁移失败:', error);
    }
  }

  /**
   * 创建数据表
   */
  private createTables(): void {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    // 创建书签表（可以根据需要扩展）
    this.db.run(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        chrome_id TEXT UNIQUE,
        title TEXT NOT NULL,
        url TEXT,
        internal_url TEXT,
        icon_url TEXT,
        parent_id TEXT,
        date_added INTEGER,
        date_modified INTEGER,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);

    // 创建标签表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);

    // 创建书签标签关联表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS bookmark_tags (
        bookmark_id TEXT,
        tag_id TEXT,
        PRIMARY KEY (bookmark_id, tag_id),
        FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id),
        FOREIGN KEY (tag_id) REFERENCES tags(id)
      )
    `);

    // 创建索引
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_bookmarks_chrome_id ON bookmarks(chrome_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_bookmarks_parent_id ON bookmarks(parent_id)`);
    
    // 如果表已存在但没有新字段，需要添加（SQLite 使用 ALTER TABLE ADD COLUMN IF NOT EXISTS 需要手动检查）
    // 注意：SQLite 不支持 IF NOT EXISTS for ALTER TABLE，所以这里不处理
    // 如果需要迁移，可以使用单独的迁移脚本
  }

  /**
   * 从 IndexedDB 加载数据库
   */
  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['database'], 'readonly');
        const store = transaction.objectStore('database');
        const getRequest = store.get('db');

        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.data || null);
        };
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('database')) {
          db.createObjectStore('database');
        }
      };
    });
  }

  /**
   * 保存数据库到 IndexedDB
   */
  private async saveToIndexedDB(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const data = this.db.export();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['database'], 'readwrite');
        const store = transaction.objectStore('database');
        const putRequest = store.put({ data }, 'db');

        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('database')) {
          db.createObjectStore('database');
        }
      };
    });
  }

  /**
   * 获取数据库实例（用于执行 SQL）
   */
  public getDatabase(): Database {
    if (!this.db) {
      throw new Error('数据库未初始化，请先调用 initialize()');
    }
    return this.db;
  }

  /**
   * 执行 SQL 查询并返回结果
   */
  public query(sql: string, params: any[] = []): any[] {
    if (!this.db) {
      throw new Error('数据库未初始化，请先调用 initialize()');
    }

    const stmt = this.db.prepare(sql);
    
    if (params.length > 0) {
      stmt.bind(params);
    }

    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row);
    }
    stmt.free();
    
    return results;
  }

  /**
   * 执行 SQL 更新（INSERT, UPDATE, DELETE）
   */
  public async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化，请先调用 initialize()');
    }

    if (params.length > 0) {
      this.db.run(sql, params);
    } else {
      this.db.run(sql);
    }

    await this.saveToIndexedDB();
  }

  /**
   * 执行批量 SQL 更新（在事务中）
   */
  public async executeBatch(operations: Array<{ sql: string; params?: any[] }>): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化，请先调用 initialize()');
    }

    // sql.js 自动在 run 操作中管理事务
    for (const op of operations) {
      if (op.params && op.params.length > 0) {
        this.db.run(op.sql, op.params);
      } else {
        this.db.run(op.sql);
      }
    }

    await this.saveToIndexedDB();
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  /**
   * 备份数据库
   */
  public export(): Uint8Array {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    return this.db.export();
  }

  /**
   * 导入数据库
   */
  public async import(data: Uint8Array): Promise<void> {
    if (!this.sqlJs) {
      await this.initialize();
    }

    if (this.db) {
      this.db.close();
    }

    this.db = new (this.sqlJs!).Database(data);
    await this.saveToIndexedDB();
  }
}
