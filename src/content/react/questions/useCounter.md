---
id: react-q2
category: React
subcategory: 面试题
type: practice
questionType: coding
question: 实现一个自定义 Hook useCounter
description: 实现一个 useCounter Hook，提供 count 值、increment、decrement 和 reset 方法。
template: |
  function useCounter(initialValue = 0) {
    // 你的代码
  }
---

```javascript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}
```
