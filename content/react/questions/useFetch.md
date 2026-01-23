---
id: react-q7
category: React
subcategory: 面试题
type: practice
questionType: coding
question: 实现一个 useFetch Hook
description: 实现一个 useFetch Hook，用于数据获取，支持加载状态、错误处理和取消请求。
template: |
  function useFetch(url) {
    // 你的代码
  }
---

```javascript
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // 清理函数：取消请求
    return () => {
      cancelled = true;
    };
  }, [url]);
  
  return { data, loading, error };
}
```
