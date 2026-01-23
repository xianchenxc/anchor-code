---
id: react-virtual-dom
category: React
subcategory: 基础概念
type: knowledge
title: 虚拟 DOM
---

虚拟 DOM（Virtual DOM）是 React 的核心概念：
- 虚拟 DOM 是真实 DOM 的 JavaScript 表示
- React 通过 diff 算法比较新旧虚拟 DOM，找出最小变更
- 批量更新真实 DOM，提高性能

优势：
1. 减少直接操作 DOM 的次数
2. 跨平台（React Native）
3. 声明式编程，提高开发效率

Diff 算法策略：
- 同层比较，不跨层移动
- 使用 key 优化列表渲染
- 组件类型不同则直接替换
