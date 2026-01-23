---
id: js-module
category: JavaScript
subcategory: 高级特性
type: knowledge
title: 模块化
---

JavaScript 模块化方案：
1. **CommonJS**：Node.js 使用，`require()` 和 `module.exports`，同步加载
2. **ES6 Modules**：`import` 和 `export`，静态分析，支持 tree-shaking
3. **AMD**：异步模块定义，适用于浏览器，如 RequireJS
4. **UMD**：通用模块定义，兼容多种模块系统

ES6 Modules 的优势：编译时确定依赖关系，支持静态分析，更好的 tree-shaking，循环依赖检测。
