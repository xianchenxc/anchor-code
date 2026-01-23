---
id: js-q3
category: JavaScript
subcategory: 面试题
type: practice
questionType: coding
question: 实现一个深拷贝函数
description: 实现一个函数 deepClone，能够深拷贝对象和数组，处理循环引用。
template: |
  function deepClone(obj) {
    // 你的代码
  }
---

```javascript
function deepClone(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (map.has(obj)) return map.get(obj);
  
  const clone = Array.isArray(obj) ? [] : {};
  map.set(obj, clone);
  
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], map);
    }
  }
  
  return clone;
}
```
