---
category: Browser
type: knowledge
title: 浏览器请求网页的过程
cardMode: single
---

当我们在浏览器地址栏输入一个 URL 并回车后，浏览器会经历“网络请求 + 页面渲染”两个大阶段。常见流程如下。

## 1. URL 解析与预处理

浏览器先解析 URL，得到协议、域名、端口、路径、查询参数等信息。

- 如果输入的是关键字而不是 URL，浏览器会走搜索引擎查询。
- 浏览器会检查是否命中 HSTS、是否需要补全协议（如 `https://`）。
- 对同源策略、混合内容（HTTPS 页面加载 HTTP 资源）等规则做基础校验。

## 2. DNS 解析（域名 -> IP）

浏览器需要先拿到服务器 IP 地址。

常见查询顺序（可能因系统实现略有差异）：

1. 浏览器 DNS 缓存
2. 操作系统缓存
3. 本地 hosts 文件
4. 本地 DNS 服务器（递归查询）
5. 根 DNS -> 顶级域 DNS -> 权威 DNS

DNS 解析完成后，得到目标 IP，进入连接阶段。

## 3. 建立连接（TCP / TLS）

### TCP 三次握手（HTTP/1.1、HTTP/2 基于 TCP）

客户端与服务端建立可靠连接：

1. Client -> Server: SYN
2. Server -> Client: SYN + ACK
3. Client -> Server: ACK

### TLS 握手（HTTPS）

在 TCP 之上建立安全通道，主要完成：

- 协商加密套件
- 验证证书合法性（CA 链、域名匹配、有效期）
- 生成会话密钥（后续对称加密通信）

> HTTP/3 基于 QUIC（UDP），连接与加密握手机制与 TCP/TLS 不同，但目标仍是安全、低延迟传输。

## 4. 发送 HTTP 请求

浏览器构造并发送请求报文：

- 请求行：方法、路径、协议版本（如 `GET /index.html HTTP/1.1`）
- 请求头：`Host`、`Cookie`、`User-Agent`、`Accept`、`Authorization` 等
- 请求体：POST/PUT/PATCH 等方法常携带数据

同时浏览器会附带缓存协商字段（例如 `If-None-Match`、`If-Modified-Since`）以减少不必要传输。

## 5. 服务器处理并返回响应

服务端收到请求后，经过网关、应用服务、缓存层、数据库等处理，返回响应：

- 状态码：`200`、`301`、`304`、`404`、`500` 等
- 响应头：`Content-Type`、`Cache-Control`、`Set-Cookie`、`ETag` 等
- 响应体：HTML、JSON、图片、脚本、样式等资源内容

## 6. 浏览器解析与渲染页面

拿到 HTML 后，浏览器开始渲染流水线：

1. 解析 HTML，构建 DOM 树
2. 解析 CSS，构建 CSSOM 树
3. 合并为 Render Tree
4. Layout（回流）：计算几何信息（位置、尺寸）
5. Paint（重绘）：绘制像素
6. Compositing：图层合成并显示到屏幕

### 关键阻塞点

- **CSS 会阻塞渲染**：必须拿到样式才能正确构建渲染结果。
- **默认情况下 JS 可能阻塞 HTML 解析**：尤其是同步脚本。
- 脚本通过 `defer`、`async` 可降低阻塞影响（语义不同）。

## 7. 子资源加载与页面可交互

主文档渲染过程中会继续请求 CSS、JS、图片、字体等子资源。浏览器会进行连接复用、优先级调度、并发控制。

与时机相关的常见事件：

- `DOMContentLoaded`：DOM 构建完成（不等待图片等全部资源）
- `load`：页面及所有依赖资源加载完成

## 8. 缓存与复用机制（高频面试点）

### 强缓存

命中后不会发起网络请求，直接使用本地副本。常见头：

- `Cache-Control: max-age=...`
- `Expires`

### 协商缓存

会发请求到服务端验证资源是否变化：

- `ETag` / `If-None-Match`
- `Last-Modified` / `If-Modified-Since`

未变化时返回 `304 Not Modified`，仅响应头，不返回完整资源体。

## 9. 一条完整链路的性能优化思路

- 减少 DNS 与连接成本：DNS 预解析、连接复用、CDN 就近访问
- 减少传输体积：压缩（Gzip/Brotli）、资源最小化、图片优化
- 提升命中率：合理设置缓存策略（强缓存 + 协商缓存）
- 降低渲染阻塞：关键 CSS 前置、脚本 `defer/async`、按需加载
- 缩短关键路径：减少首屏关键资源数量与体积

## 高频追问

1. 输入 URL 到页面显示，中间哪些环节最耗时？
2. TCP 和 QUIC（HTTP/3）的关键差异是什么？
3. 强缓存和协商缓存如何配合设计？
4. 为什么说 CSS 会阻塞渲染、JS 会阻塞解析？
5. 如何结合业务场景优化首屏性能（LCP/FCP/TTI）？
