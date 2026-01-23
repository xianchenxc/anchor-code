---
id: react-useref
category: React
subcategory: Hooks
type: knowledge
title: useRef Hook
---

`useRef` 返回一个可变的 ref 对象，其 `.current` 属性被初始化为传入的参数。

特点：
- 返回的 ref 对象在组件的整个生命周期内保持不变
- 修改 `.current` 不会触发重新渲染
- 可以访问 DOM 元素或保存任意可变值

使用场景：
1. **访问 DOM 元素**：
```javascript
const inputRef = useRef(null);
<input ref={inputRef} />
```

2. **保存可变值**（类似实例变量）：
```javascript
const timerRef = useRef(null);
```

3. **获取上一轮的 props 或 state**：
```javascript
const prevCountRef = useRef();
```
