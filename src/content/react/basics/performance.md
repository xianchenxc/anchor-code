---
id: react-performance
category: React
subcategory: 基础概念
type: knowledge
title: 性能优化
---

React 性能优化方法：

1. **避免不必要的渲染**：
   - `React.memo`：缓存组件
   - `useMemo`：缓存计算结果
   - `useCallback`：缓存函数引用

2. **代码分割**：
   - `React.lazy`：懒加载组件
   - `Suspense`：处理加载状态

3. **虚拟化长列表**：
   - `react-window`、`react-virtualized`

4. **优化渲染**：
   - 避免在 render 中创建新对象/函数
   - 使用 key 优化列表渲染
   - 避免在 JSX 中使用内联函数

5. **状态管理**：
   - 合理拆分组件状态
   - 使用 Context 避免 prop drilling
