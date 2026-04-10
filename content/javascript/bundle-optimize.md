---
category: JavaScript
type: knowledge
title: 打包优化
---

## 一、为什么要做打包优化与产物分析？

现代前端项目（React、Vue、Angular 等）通常需要经过打包工具（Webpack、Vite、Rollup、esbuild 等）将源码转换成浏览器可高效执行的静态资源。随着项目迭代，产物可能变得臃肿，带来以下问题：

- 首屏加载慢：大体积的 JS/CSS 文件会阻塞页面渲染。

- 交互响应延迟：未使用的代码增加解析和执行时间。

- 带宽浪费：用户流量消耗增加，尤其移动端。

- 缓存效率低：频繁变动的主包导致缓存失效。

因此，我们需要通过产物分析定位瓶颈，再实施针对性优化。

## 二、产物分析：先诊断，后下药

1. 常用分析工具

| 工具 |	适用打包器|	特点|
| - | -| -|
| webpack-bundle-analyzer |	Webpack |	生成交互式 treemap，直观显示各模块体积|
| vite-plugin-inspect |	Vite	| 查看中间状态、模块关系、插件影响 |
| next-bundle-analyzer |	Next.js	基于 webpack-bundle-analyzer 封装 |

2. 分析维度

- 总体积：JS / CSS / 图片 / 字体各占多少。

- 依赖占比：node_modules 中的哪些库特别大（如 moment、lodash、antd）。

- 重复模块：同一库的多个版本被同时打包（如 @babel/runtime、core-js）。

- 非按需加载：引入整个 UI 库而非单个组件。

- 未使用代码：Tree Shaking 失效的部分。

- Chunk 构成：是否合理分割，是否存在过大或过多的小 chunk。

3. 实战命令示例（Webpack）

```bash
# 在 webpack.config.js 中引入插件
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
module.exports = {
  plugins: [new BundleAnalyzerPlugin()],
};
# 然后运行构建
npm run build -- --stats
```

打开生成的 report.html，你会看到类似下方的 treemap（每个块面积代表体积）：

```text
+------------------+------------------+
|  react-dom       |  antd            |
|  120KB           |  200KB           |
+------------------+                  |
|  lodash          |                  |
|  70KB            |                  |
+------------------+------------------+
|  moment + locale |  ...             |
|  250KB           |                  |
+------------------+------------------+
```

一眼就能看出 moment 带 locale 非常大，antd 未按需加载等问题。

## 三、打包优化策略（分层级讲解）

### 🎯 第一层：减少代码体积

1. Tree Shaking（摇树优化）
原理：基于 ES Module 静态结构，标记未被引用的代码并在生产构建中删除。

常见失效原因：

- 使用 babel-preset-env 将 import/export 转换成 CommonJS（需设置 modules: false）。

- 通过 require() 动态导入。

- 副作用的模块（package.json 中需声明 "sideEffects": false 或指定文件）。

检查方法：产物分析中看到某模块内部函数未使用但仍被打包。

2. 依赖体积优化

- 替换巨型库：
    - moment → dayjs (体积从 ~70KB gzipped 降到 ~7KB)
    - lodash → lodash-es + 按需引入 或 使用 es-toolkit
    - axios → 原生 fetch (若兼容性允许)

- 按需加载 UI 库：
    - antd / element-plus 配合 babel-plugin-import 或直接使用 ES Module 版本的组件路径。
    - Vite 中很多库原生支持按需，无需额外插件。

- 使用更轻的替代品：
    - date-fns 相比 moment 也是模块化按需。
    - query-string 替代 qs。

3. 图片 / 字体 / 媒体文件优化

- 压缩：image-webpack-loader、vite-plugin-imagemin。

- 转换为 WebP / AVIF：动态生成或使用 <picture> + 降级。

- 雪碧图（SVG sprites） 或 内联 SVG。

- 字体子集化：只包含实际使用的字符（glyphhanger、fontmin）。

4. 启用压缩算法

- Gzip：服务端配置 gzip_static，或 Webpack 插件 compression-webpack-plugin 预生成 .gz。

- Brotli：比 Gzip 压缩率更高，现代浏览器均支持。

5. 更激进的优化（需权衡）

- 移除 console / debugger：terser-webpack-plugin 配置 drop_console（注意保留错误日志）。

- 内联关键 CSS：将首屏 CSS 内联到 HTML，其余异步加载。

- @babel/runtime 辅助函数复用：避免每个文件重复 helper。

### 🎯 第二层：拆分代码与懒加载

1. 代码分割（Code Splitting）

- 入口分割：多入口提取公共模块。
- 动态导入（Dynamic Import）：

```js
// React Router v6
const AdminPanel = lazy(() => import('./routes/AdminPanel'));
打包后会产生独立的 chunk，仅在访问该路由时下载。
```

SplitChunksPlugin（Webpack） 最佳实践：

```js
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
      },
      commons: {
        minChunks: 2,
        name: 'commons',
      },
    },
  },
}
```

- 将 node_modules 中的库单独打包为 vendors，利用长期缓存。
- 将多入口共用的业务代码提取为 commons。
- 控制 chunk 大小：maxSize: 244KB 指导拆分过大的 chunk。

2. 预加载 / 预获取

    - `<link rel="preload" href="critical.js" as="script">`：当前页面必要资源高优加载。
    - `<link rel="prefetch" href="other.js">`：空闲时加载后续路由所需资源。
    - Webpack 魔法注释：/* webpackPrefetch: true */、/* webpackPreload: true */。

3. 外部化（Externals）

将 React、Vue、lodash 等通过 CDN 引入，避免打包进 bundle。

```js
externals: {
  react: 'React',
  'react-dom': 'ReactDOM',
}
```

- 优点：减少体积 + 利用 CDN 缓存。
- 缺点：增加 HTTP 请求数，且需保证 CDN 可靠性。

### 🎯 第三层：构建优化与持久化缓存

1. 使用现代打包工具

- Vite：基于 esbuild 预构建依赖 + Rollup 生产打包，开发与生产都更快。
- esbuild 或 swc 替代 babel-loader / ts-loader，大幅提升构建速度。

2. 缓存优化

- content hash：[name].[contenthash:8].js，文件内容不变则 hash 不变，复用浏览器缓存。
- runtime chunk 提取：将 Webpack 运行时代码单独打包，避免因业务变化导致 vendors hash 变更。


```js
optimization: {
  runtimeChunk: 'single',
}
```

3. 并行压缩与构建

terser-webpack-plugin 开启 parallel: true。

使用 webpack-parallel-uglify-plugin（已过时，现在用 terser）。

## 四、实战案例：一个 React + Antd 项目的优化过程

### 初始状况（产物分析）

未优化：主 vendor.js 约 1.2MB (gzip 后 320KB)。

其中 antd 全量引入占 500KB，moment + locale 占 250KB，lodash 占 70KB，react-dom 占 120KB，其他 260KB。

### 优化步骤

- 按需引入 antd

使用 babel-plugin-import，配置为按需加载组件与样式。

结果：antd 体积降至 ~180KB（只用了 Table、Form、Modal 等）。

替换 moment → dayjs

antd 内部也依赖 moment，需配置 antd 的 moment 为 dayjs（使用 antd-dayjs-webpack-plugin）。

结果：moment 完全移除，体积减少 250KB。

lodash 按需引入

将 import _ from 'lodash' 改为 import cloneDeep from 'lodash/cloneDeep'，或使用 lodash-es 配合 Tree Shaking。

结果：70KB → 15KB。

- 路由懒加载

React.lazy + Suspense 拆分 5 个主要页面为独立 chunk。

结果：首屏只需加载 Home 相关代码，vendor 主包从 1.2MB → 680KB。

- CDN 外部化 react & react-dom

通过 externals 排除 React 全家桶，改用 unpkg CDN。

结果：主包再减少 120KB（但增加两个额外请求，由于 CDN 缓存普遍存在，总体首屏时间下降）。

- 压缩图片

将项目中的 PNG 大图转为 WebP，并配置 image-webpack-loader。

结果：图片总资源从 2MB → 450KB。

- 启用 Brotli 压缩

服务端支持 Brotli，或构建时生成 .br 文件。

结果：gzip 后 320KB → Brotli 后 240KB。

### 最终成果

- 主 vendor.js 从 1.2MB → 280KB (Brotli 后)。
- 首屏加载时间（3G 网络模拟）从 2.1s → 0.9s。
- Lighthouse 性能评分 从 62 → 96。

## 五、持续监控与 CI 集成

优化不是一次性的，需要建立机制防止回归：

Bundle 大小 CI 检查：使用 bundlesize 或 @actions/artifact，限制每个 chunk 最大体积。

产出报告归档：每次构建生成 bundle-report.html 并作为 CI 产物，方便 diff 对比。

性能预算：在 package.json 中配置 "bundlesize"，超出阈值则 CI 失败。

## 六、总结与思考

- 打包优化的核心不是“极致压缩”，而是找到性价比最高的瓶颈点。

- 先分析，后优化：不分析就优化容易走弯路（比如花大力气缩小了一个 10KB 的模块，却忽略了 500KB 的库）。

- 关注现代语法与浏览器能力：如果目标浏览器支持 ES2015+，可以减少转译与 polyfill，使用 browserslist + core-js 按需引入。

- 权衡加载策略：拆得越细，请求数越多，HTTP/2 下可接受，但 HTTP/1.1 下需谨慎。

- 工具链演进：Webpack 依然强大，但 Vite / Turbopack / Rspack 等新工具在开发体验和生产性能上值得尝试。

最后，打包优化没有银弹，但掌握了「产物分析 + 分层策略 + 持续监控」这套方法论，你就能从容应对任何项目的性能挑战。希望这些内容对你有所帮助，也欢迎进一步探讨具体场景的优化方案。

