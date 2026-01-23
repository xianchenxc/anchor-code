---
id: react-q8
category: React
subcategory: 面试题
type: practice
questionType: coding
question: 实现一个 useDebounce Hook
description: 实现一个 useDebounce Hook，用于防抖处理，常用于搜索框输入。
template: |
  function useDebounce(value, delay) {
    // 你的代码
  }
---

```javascript
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    // 设置定时器
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // 清理函数：清除定时器
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// 使用示例
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      // 执行搜索
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
  
  return (
    <input
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
    />
  );
}
```
