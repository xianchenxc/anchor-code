---
id: js-q8
category: JavaScript
subcategory: 面试题
type: practice
questionType: coding
question: 手写 new 操作符
description: 实现一个 new 操作符的功能。
template: |
  function myNew(constructor, ...args) {
    // 你的代码
  }
---

```javascript
function myNew(constructor, ...args) {
  // 1. 创建一个新对象，原型指向构造函数的 prototype
  const obj = Object.create(constructor.prototype);
  
  // 2. 执行构造函数，将 this 绑定到新对象
  const result = constructor.apply(obj, args);
  
  // 3. 如果构造函数返回对象，则返回该对象；否则返回新对象
  return result instanceof Object ? result : obj;
}
```
