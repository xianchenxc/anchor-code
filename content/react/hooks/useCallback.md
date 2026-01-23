---
id: react-usecallback
category: React
subcategory: Hooks
type: knowledge
title: useCallback Hook
---

`useCallback` 用于缓存函数引用，避免每次渲染时创建新函数。

```javascript
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

- 第一个参数：要缓存的函数
- 第二个参数：依赖数组
- 返回值：缓存的函数引用

使用场景：
- 将函数作为 props 传递给子组件（配合 `React.memo`）
- 作为其他 Hook 的依赖项

注意：`useCallback` 本身也有性能开销，只有真正需要时才使用。
