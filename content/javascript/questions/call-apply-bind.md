---
id: js-q7
category: JavaScript
subcategory: 面试题
type: practice
questionType: coding
question: 手写 call、apply、bind 方法
description: 实现 Function.prototype.call、apply 和 bind 方法。
template: |
  Function.prototype.myCall = function(context, ...args) {
    // 你的代码
  }
  
  Function.prototype.myApply = function(context, args) {
    // 你的代码
  }
  
  Function.prototype.myBind = function(context, ...args) {
    // 你的代码
  }
---

```javascript
// 实现 call
Function.prototype.myCall = function(context, ...args) {
  // 如果 context 为 null 或 undefined，则指向全局对象
  context = context || globalThis;
  
  // 将函数作为 context 的方法
  const fn = Symbol('fn');
  context[fn] = this;
  
  // 调用函数
  const result = context[fn](...args);
  
  // 删除临时属性
  delete context[fn];
  
  return result;
};

// 实现 apply
Function.prototype.myApply = function(context, args) {
  context = context || globalThis;
  const fn = Symbol('fn');
  context[fn] = this;
  
  const result = args ? context[fn](...args) : context[fn]();
  
  delete context[fn];
  
  return result;
};

// 实现 bind
Function.prototype.myBind = function(context, ...args) {
  const self = this;
  
  return function F(...newArgs) {
    // 如果作为构造函数调用，this 指向新创建的对象
    if (this instanceof F) {
      return new self(...args, ...newArgs);
    }
    // 否则绑定 context
    return self.apply(context, [...args, ...newArgs]);
  };
};
```
