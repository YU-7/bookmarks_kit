# SQLite 数据库使用指南

本项目使用 SQLite（通过 sql.js）作为数据存储方案，替代了之前的 Chrome Storage API。

## 架构说明

- **sql.js**: SQLite 的 JavaScript 实现，使用 WebAssembly
- **IndexedDB**: 作为持久化存储层，存储 SQLite 数据库的二进制数据
- **DatabaseManager**: 数据库管理类，提供统一的数据库操作接口

## 快速开始

### 1. 初始化数据库

```typescript
import { DatabaseManager } from './lib/database';

const dbManager = DatabaseManager.getInstance();
await dbManager.initialize();
```

### 2. 执行查询

```typescript
// 查询数据
const results = dbManager.query(
  'SELECT * FROM bookmarks WHERE title LIKE ?',
  ['%example%']
);
```

### 3. 执行更新

```typescript
// 插入数据
await dbManager.execute(
  'INSERT INTO bookmarks (id, title, url) VALUES (?, ?, ?)',
  ['bookmark_1', '示例', 'https://example.com']
);

// 更新数据
await dbManager.execute(
  'UPDATE bookmarks SET title = ? WHERE id = ?',
  ['新标题', 'bookmark_1']
);

// 删除数据
await dbManager.execute('DELETE FROM bookmarks WHERE id = ?', ['bookmark_1']);
```

### 4. 批量操作

```typescript
await dbManager.executeBatch([
  {
    sql: 'INSERT INTO tags (id, name) VALUES (?, ?)',
    params: ['tag_1', '工作']
  },
  {
    sql: 'INSERT INTO tags (id, name) VALUES (?, ?)',
    params: ['tag_2', '学习']
  }
]);
```

## 数据库表结构

### bookmarks 表

存储书签信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键，唯一标识符 |
| chrome_id | TEXT | Chrome 书签 ID |
| title | TEXT | 书签标题 |
| url | TEXT | 书签 URL |
| parent_id | TEXT | 父文件夹 ID |
| date_added | INTEGER | 添加时间戳 |
| date_modified | INTEGER | 修改时间戳 |
| created_at | INTEGER | 创建时间戳 |
| updated_at | INTEGER | 更新时间戳 |

### tags 表

存储标签信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| name | TEXT | 标签名称（唯一） |
| color | TEXT | 标签颜色 |
| created_at | INTEGER | 创建时间戳 |

### bookmark_tags 表

书签和标签的关联表。

| 字段 | 类型 | 说明 |
|------|------|------|
| bookmark_id | TEXT | 书签 ID（外键） |
| tag_id | TEXT | 标签 ID（外键） |

## 完整示例

参考 `src/lib/database-example.ts` 文件查看完整的使用示例。

## 注意事项

1. **初始化**: 在使用数据库之前，必须先调用 `initialize()` 方法
2. **单例模式**: `DatabaseManager` 使用单例模式，确保在整个应用中只有一个数据库实例
3. **持久化**: 所有数据库操作都会自动保存到 IndexedDB
4. **异步操作**: 数据库操作都是异步的，需要使用 `await` 或 `.then()`
5. **WASM 加载**: sql.js 的 WASM 文件会从 CDN 加载（https://sql.js.org），确保网络连接正常

## 迁移说明

如果之前使用了 Chrome Storage API，需要：

1. 导出旧数据
2. 转换数据格式
3. 使用 `dbManager.execute()` 批量导入数据

示例迁移代码：

```typescript
// 从 Chrome Storage 导出数据
const data = await chrome.storage.local.get(null);

// 转换为 SQL 插入语句并导入
const dbManager = DatabaseManager.getInstance();
await dbManager.initialize();

for (const [key, value] of Object.entries(data)) {
  // 根据数据结构执行相应的 INSERT 操作
  await dbManager.execute(
    'INSERT INTO bookmarks (id, title, url) VALUES (?, ?, ?)',
    [key, value.title, value.url]
  );
}
```
