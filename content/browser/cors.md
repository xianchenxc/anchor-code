---
category: Browser
type: knowledge
title: CORS (跨域资源共享)
---

CORS（Cross-Origin Resource Sharing，跨域资源共享）是浏览器的安全机制扩展，用来在“同源策略”限制下，允许服务器声明哪些跨域请求可以被浏览器放行。

## 1. 先理解同源策略（SOP）

浏览器默认只允许页面访问同源资源。  
同源 = 协议、域名、端口三者完全一致。

下面这些都算跨域：

- `https://a.com` -> `https://api.a.com`（域名不同）
- `https://a.com` -> `http://a.com`（协议不同）
- `https://a.com:443` -> `https://a.com:8443`（端口不同）

同源策略主要限制的是“读取响应内容”，并不是简单地禁止发请求。

## 2. CORS 的本质

CORS 的核心是：**浏览器先发请求，拿到响应后，再根据响应头决定是否把响应交给前端 JS**。

也就是说：

- 服务端不返回允许跨域的 CORS 响应头 -> 浏览器拦截，前端拿不到响应
- 服务端返回符合规则的 CORS 响应头 -> 浏览器放行，前端可读取数据

## 3. 简单请求 vs 预检请求

### 简单请求（Simple Request）

满足以下条件时，浏览器直接发正式请求：

- 方法是 `GET`、`HEAD`、`POST`
- `Content-Type` 仅限：
  - `text/plain`
  - `multipart/form-data`
  - `application/x-www-form-urlencoded`
- 请求头是浏览器允许的安全头范围（无自定义复杂头）

### 预检请求（Preflight）

不满足简单请求条件时，浏览器会先自动发送 `OPTIONS` 请求，询问服务端“是否允许接下来的跨域正式请求”。

预检常见场景：

- 使用 `PUT`、`DELETE`、`PATCH` 等方法
- `Content-Type: application/json`
- 带自定义请求头（如 `Authorization`、`X-Token`）

## 4. 常见 CORS 响应头

### `Access-Control-Allow-Origin`

声明允许的来源（Origin）：

- `*`：允许任意来源（有凭证时不能用）
- `https://app.example.com`：仅允许特定来源

### `Access-Control-Allow-Methods`

预检响应中声明允许的方法，例如：

`GET, POST, PUT, DELETE, OPTIONS`

### `Access-Control-Allow-Headers`

预检响应中声明允许携带的请求头，例如：

`Content-Type, Authorization, X-Requested-With`

### `Access-Control-Allow-Credentials`

是否允许携带凭证（Cookie、HTTP 认证信息）：

- `true`：允许携带凭证
- 配合凭证时，`Access-Control-Allow-Origin` 不能是 `*`

### `Access-Control-Max-Age`

预检结果缓存时间（秒），减少重复 OPTIONS 请求。

## 5. 请求头中的 Origin 与预检头

浏览器跨域请求会自动带上：

- `Origin: https://app.example.com`

预检请求还会带：

- `Access-Control-Request-Method`
- `Access-Control-Request-Headers`

服务端据此判断并返回对应 `Access-Control-Allow-*`。

## 6. 带 Cookie 的跨域注意点

前端必须显式开启凭证发送，例如 `fetch`：

```js
fetch("https://api.example.com/user", {
  method: "GET",
  credentials: "include",
});
```

服务端必须同时满足：

- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Origin` 为明确域名（不能 `*`）
- Cookie 本身需要正确的 `SameSite` / `Secure` 配置（尤其 HTTPS 场景）

## 7. 常见误区

1. **“后端接口能 curl 通就不是 CORS 问题”**  
   错。CORS 是浏览器安全策略，`curl` 不受浏览器同源策略限制。

2. **“前端设置请求头就能解决跨域”**  
   错。CORS 放行权在服务端响应头，不在前端。

3. **“CORS 是服务端安全防护机制”**  
   不准确。CORS 更像是浏览器侧访问控制规则，主要保护用户上下文下的资源读取。

4. **“配置了 `*` 最省事”**  
   生产环境有风险，尤其涉及用户数据时应做精确 Origin 白名单。

## 8. 排查 CORS 问题的实战步骤

1. 在浏览器 DevTools 的 Network 中看失败请求是否为 CORS blocked
2. 先看是否触发了 `OPTIONS` 预检，以及预检状态码
3. 检查响应头是否包含正确的 `Access-Control-Allow-*`
4. 若带 Cookie，确认前后端凭证配置是否成对出现
5. 检查网关/反向代理（Nginx、CDN）是否吞掉了 CORS 头

## 9. 与跨域相关但不同的概念

- **CORS**：浏览器对跨域读取的控制机制
- **代理转发（devServer proxy / BFF）**：通过同源中转绕开浏览器跨域限制
- **JSONP**：历史方案，仅支持 GET，现代场景基本不用
- **CSRF**：跨站请求伪造攻击问题，和 CORS 不是同一个层面

## 10. 解决跨域的方法

跨域本质是浏览器同源策略带来的“前端读取限制”，常见解决思路如下。

### 1) 正规方案：服务端正确配置 CORS（推荐）

适用：前后端分离、跨域 API 调用。

要点：

- 根据环境维护 Origin 白名单（不要生产全开 `*`）。
- 明确允许的方法、请求头、是否允许凭证。
- 需要 Cookie 时：`Access-Control-Allow-Credentials: true` + 明确 Origin（不能 `*`）。

这是现代 Web 场景最标准、最可控的方案。

### 2) 同源代理转发（BFF / Nginx / DevServer Proxy）

适用：不方便改第三方接口、前端工程本地开发、统一网关治理。

思路：让浏览器始终请求同源地址，由同源服务端再转发到目标 API。

常见做法：

- Vite / Webpack devServer `proxy`（开发环境）
- Nginx 反向代理（生产环境）
- BFF（Backend For Frontend）聚合层

优点是前端无需处理跨域细节，缺点是增加一层服务维护成本。

### 3) JSONP（历史方案，不推荐新项目）

适用：只读、GET、且对方仅支持 JSONP 的历史接口。

原理：利用 `<script>` 标签不受同源策略限制，通过回调函数拿数据。  
限制：仅支持 GET、无状态码语义、安全与维护性较差，现代项目基本不用。

### 4) postMessage（跨窗口通信，不是 API 跨域）

适用：不同源页面/iframe 之间通信。

注意：`postMessage` 解决的是“页面间消息通信”，不是直接解决浏览器对 XHR/fetch 的跨域限制。

### 5) WebSocket（按协议握手，不走传统 CORS）

适用：实时通信场景（IM、推送、协作）。

说明：WebSocket 不按传统 CORS 校验，但服务端仍应校验 `Origin`、鉴权令牌与连接来源，避免被滥用。

## 高频面试追问

1. 为什么“简单请求”不需要预检？
2. `Access-Control-Allow-Origin: *` 为什么不能配合 Cookie？
3. 预检请求失败通常从哪几个响应头定位问题？
4. CORS 与 CSRF 的关系和区别是什么？
