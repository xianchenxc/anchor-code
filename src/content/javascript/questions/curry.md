---
id: js-q11
category: JavaScript
subcategory: 面试题
type: practice
questionType: coding
question: 函数柯里化
description: 实现一个函数柯里化工具函数，将多参数函数转换为单参数函数序列。
template: |
  function curry(fn) {
    // 你的代码
  }
---

```javascript
function curry(fn) {
  return function curried(...args) {
    // 如果参数数量足够，直接执行函数
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    // 否则返回一个新函数，继续接收参数
    return function(...nextArgs) {
      return curried.apply(this, [...args, ...nextArgs]);
    };
  };
}

// 使用示例
function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3)); // 6
console.log(curriedAdd(1, 2)(3)); // 6
console.log(curriedAdd(1)(2, 3)); // 6
```
