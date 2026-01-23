---
id: react-q9
category: React
subcategory: 面试题
type: practice
questionType: coding
question: 实现一个 usePrevious Hook
description: 实现一个 usePrevious Hook，用于获取上一轮的 props 或 state 值。
template: |
  function usePrevious(value) {
    // 你的代码
  }
---

```javascript
function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

// 使用示例
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);
  
  return (
    <div>
      <p>当前: {count}</p>
      <p>之前: {prevCount}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}
```
