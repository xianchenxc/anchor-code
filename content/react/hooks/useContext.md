---
id: react-usecontext
category: React
subcategory: Hooks
type: knowledge
title: useContext Hook
---

`useContext` 用于在函数组件中订阅 React Context。

```javascript
const value = useContext(MyContext);
```

使用步骤：
1. 使用 `React.createContext` 创建 Context
2. 使用 `Provider` 提供值
3. 在子组件中使用 `useContext` 获取值

优势：
- 避免 prop drilling（逐层传递 props）
- 跨组件共享数据

注意：
- 每次 Provider 的 value 变化，所有使用该 Context 的组件都会重新渲染
- 可以通过拆分 Context 或使用 `useMemo` 优化
