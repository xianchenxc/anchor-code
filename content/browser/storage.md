---
category: Browser
type: knowledge
title: 浏览器存储
cardMode: single
---

浏览器存储用于在客户端持久化数据。常见方案包括 `Cookie`、`localStorage`、`sessionStorage`、`IndexedDB`。它们在容量、生命周期、是否自动携带到服务端、性能特性上差异很大。

## 1. 常见存储方案总览

| 方案 | 容量（大致） | 生命周期 | 是否随请求自动发送 | 典型用途 |
| - | - | - | - | - |
| Cookie | 4KB/条，数量有限 | 可设置过期时间 | ✅（同域请求） | 登录态、服务端会话标识 |
| localStorage | 约 5MB ~ 10MB | 长期，手动清除 | ❌ | 前端偏好配置、轻量缓存 |
| sessionStorage | 约 5MB | 会话级（标签页关闭即清） | ❌ | 临时表单状态、一次会话数据 |
| IndexedDB | 远大于前两者（浏览器配额） | 长期，手动清除 | ❌ | 大体量结构化数据、离线缓存 |

> 容量并非统一标准，不同浏览器实现会有差异。

## 2. Cookie

Cookie 是最传统的客户端存储，核心特点是：**浏览器会在符合规则时自动把 Cookie 放到请求头里**。

常见属性：

- `Expires` / `Max-Age`：过期时间
- `Domain` / `Path`：作用域
- `HttpOnly`：禁止 JS 读取（防止 XSS 窃取）
- `Secure`：仅 HTTPS 传输
- `SameSite`：跨站请求携带策略（`Strict` / `Lax` / `None`）

适合存放：会话标识（如 Session ID）。  
不适合存放：大体积业务数据、敏感明文信息。

## 3. localStorage

`localStorage` 是同步 Key-Value 存储，数据长期保留（除非手动删除或浏览器策略清理）。

特点：

- API 简单：`setItem/getItem/removeItem/clear`
- 仅支持字符串（对象需 `JSON.stringify/parse`）
- 同源隔离（协议 + 域名 + 端口）
- 同步 API，频繁大数据读写会阻塞主线程

适合存放：

- 主题配置（深色模式、语言）
- 小体积业务缓存（可容忍过期）

## 4. sessionStorage

`sessionStorage` 与 `localStorage` API 类似，但生命周期更短：**当前标签页会话级**。

特点：

- 关闭标签页后数据清空
- 不同标签页之间通常不共享
- 同样是同步字符串存储

适合存放：

- 多步骤表单临时状态
- 会话内临时上下文

## 5. IndexedDB

IndexedDB 是浏览器内建的 NoSQL 异步数据库，支持事务、索引、对象存储，容量远高于 Web Storage。

特点：

- 异步，不阻塞主线程
- 可存结构化数据（对象、二进制）
- 可做索引查询
- 适合离线优先（PWA）场景

适合存放：

- 大量业务数据
- 离线资源、草稿、同步队列

## 6. 如何选择存储方案（实战）

1. **服务端会话相关**：优先 Cookie（配合 `HttpOnly + Secure + SameSite`）
2. **小体积前端配置**：`localStorage`
3. **仅当前标签页临时数据**：`sessionStorage`
4. **大体量、结构化、离线数据**：IndexedDB

简单原则：  
**能不持久化就不持久化；能小就不大；能短期就不长期。**

## 7. 安全与风险点

### 1) XSS 风险

- `localStorage/sessionStorage` 可被注入脚本读取，一旦 XSS 成立，敏感信息容易泄露。
- 不要在 Web Storage 存储高敏 token、密钥、用户隐私明文。

### 2) CSRF 风险

- Cookie 会自动携带，需配合 `SameSite`、CSRF Token、防重放策略。

### 3) 数据一致性

- 本地缓存可能过期或脏读，需设计版本号、过期时间和回源机制。

## 8. 常见工程实践

- 为本地缓存增加 `version` 与 `expireAt` 字段。
- 统一封装存储层（读写、序列化、异常处理、降级）。
- 监听 `storage` 事件实现多标签页状态同步（如退出登录联动）。
- 大量离线数据优先 IndexedDB，不要把 `localStorage` 当数据库。

## 9. 常见面试追问

1. Cookie、localStorage、sessionStorage、IndexedDB 的核心区别是什么？
2. 为什么不建议把 JWT 长期放在 localStorage？
3. Cookie 的 `HttpOnly`、`Secure`、`SameSite` 各解决什么问题？
4. localStorage 是同步 API，会带来什么性能影响？
5. 业务缓存如何做过期与版本控制？
