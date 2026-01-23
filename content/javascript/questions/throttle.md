---
id: js-q6
category: JavaScript
subcategory: 面试题
type: practice
questionType: coding
question: 实现节流函数
description: 实现一个节流函数 throttle，规定在一个单位时间内，只能触发一次函数。
template: |
  function throttle(func, delay) {
    // 你的代码
  }
---

```javascript
// 时间戳版本
function throttle(func, delay) {
  let lastTime = 0;
  
  return function(...args) {
    const context = this;
    const now = Date.now();
    
    if (now - lastTime >= delay) {
      func.apply(context, args);
      lastTime = now;
    }
  };
}

// 定时器版本
function throttle(func, delay) {
  let timer = null;
  
  return function(...args) {
    const context = this;
    
    if (!timer) {
      timer = setTimeout(() => {
        func.apply(context, args);
        timer = null;
      }, delay);
    }
  };
}
```
