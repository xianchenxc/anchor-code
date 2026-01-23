---
id: js-q9
category: JavaScript
subcategory: 面试题
type: practice
questionType: coding
question: 手写 instanceof
description: 实现 instanceof 操作符的功能。
template: |
  function myInstanceof(left, right) {
    // 你的代码
  }
---

```javascript
function myInstanceof(left, right) {
  // 获取对象的原型
  let proto = Object.getPrototypeOf(left);
  // 获取构造函数的 prototype
  const prototype = right.prototype;
  
  // 沿着原型链向上查找
  while (proto !== null) {
    if (proto === prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }
  
  return false;
}
```
