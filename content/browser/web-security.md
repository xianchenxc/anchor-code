---
category: Browser
type: knowledge
title: Web 安全
---

## CSRF

CSRF（跨站请求伪造） 是指攻击者诱导已登录用户在第三方网站点击恶意链接，利用浏览器自动携带目标网站 Cookie 的特性，伪造用户身份发起非本意请求。

常见防御措施：

- SameSite Cookie 属性：设置 SameSite=Lax 或 Strict，阻止第三方请求携带 Cookie（最推荐，兼容性好）。

- CSRF Token（同步令牌）：服务端生成随机 token 嵌入页面，请求时校验，攻击者无法读取。

- 双重提交 Cookie：服务端将 CSRF Token 同时放在 Cookie 和请求参数中，比对两者是否一致。

- 验证 Referer / Origin：服务端校验请求来源是否为可信域名。

- 使用自定义请求头：如 X-Requested-With: XMLHttpRequest，配合 CORS 限制（但需注意预检请求）。

- 关键操作增加额外验证：如验证码、短信二次确认。

注意：将 JWT 存在 localStorage 并用 Authorization 头发送可以防御 CSRF，但会引入 XSS 风险，需配合内容安全策略（CSP）。

## XSS

XSS（跨站脚本攻击） 是指攻击者将恶意脚本注入到网页中，当用户浏览时执行，从而窃取数据、劫持会话、篡改页面等。

### 三种类型：

- 反射型：恶意脚本在 URL 参数中，服务端直接返回给浏览器执行。

- 存储型：恶意脚本存入数据库，任何访问页面的用户都会执行（危害最大）。

- DOM 型：通过修改页面 DOM 结构执行，不经过服务端。

### 防御措施（分层防御）：

- 输出编码（核心）：根据数据插入的位置（HTML 体、属性、JavaScript、CSS、URL）使用对应的编码函数，如 htmlEscape、jsEscape。

- 输入过滤：仅在必要时（如富文本）使用白名单 + 安全解析库（如 DOMPurify），不要自己写正则。

- CSP（内容安全策略）：通过 Content-Security-Policy 头限制脚本加载来源，禁止 unsafe-inline，可有效缓解 XSS。

- HttpOnly Cookie：标记敏感 Cookie 为 HttpOnly，防止 JS 读取，降低会话劫持风险。

- 使用安全的框架 API：React 默认转义，避免使用 dangerouslySetInnerHTML；Vue 避免 v-html。

- 其他：禁用 eval 和字符串动态代码执行；对 URL 参数进行验证和编码。