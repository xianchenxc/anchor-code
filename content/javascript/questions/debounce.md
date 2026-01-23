---
id: js-q5
category: JavaScript
subcategory: 面试题
type: practice
questionType: coding
question: 实现防抖函数
description: 实现一个防抖函数 debounce，在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时。
template: |
  function debounce(func, delay) {
    // 你的代码
  }
---

```javascript
function debounce(func, delay) {
  let timer = null;
  
  return function(...args) {
    const context = this;
    
    // 清除之前的定时器
    if (timer) {
      clearTimeout(timer);
    }
    
    // 设置新的定时器
    timer = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}
```
