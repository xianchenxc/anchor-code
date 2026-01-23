---
id: react-usememo
category: React
subcategory: Hooks
type: knowledge
title: useMemo Hook
---

`useMemo` 用于缓存计算结果，避免每次渲染时重新计算。

```javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

- 第一个参数：计算函数
- 第二个参数：依赖数组
- 返回值：缓存的值

使用场景：
- 昂贵的计算
- 避免子组件不必要的重新渲染（配合 `React.memo`）
- 缓存对象/数组引用

注意：不要过度使用，只有真正需要优化时才使用。
