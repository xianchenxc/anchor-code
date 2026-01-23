---
id: react-q4
category: React
subcategory: 面试题
type: practice
questionType: qa
question: React 中 setState 是同步还是异步的？如何获取更新后的值？
---

`setState` 的行为：
- **React 18 之前**：在事件处理函数中是异步的（批处理），在 `setTimeout`、`Promise` 中是同步的
- **React 18+**：所有 `setState` 都是异步的（自动批处理）

批处理（Batching）：
- 多个 `setState` 调用会被合并，只触发一次重新渲染
- 提高性能，避免不必要的渲染

获取更新后的值：
1. **使用回调函数**：
```javascript
setCount(count => count + 1);
```

2. **使用 useEffect**：
```javascript
useEffect(() => {
  // 获取最新的 count
}, [count]);
```

3. **使用 useRef**：
```javascript
const countRef = useRef(count);
countRef.current = count;
```
