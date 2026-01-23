---
id: js-this
category: JavaScript
subcategory: 高级特性
type: knowledge
title: this 绑定规则
---

`this` 的绑定取决于函数的调用方式：
1. **默认绑定**：独立函数调用，`this` 指向全局对象（严格模式下为 `undefined`）
2. **隐式绑定**：通过对象调用，`this` 指向调用对象
3. **显式绑定**：通过 `call`、`apply`、`bind` 指定 `this`
4. **new 绑定**：构造函数调用，`this` 指向新创建的对象
5. **箭头函数**：`this` 继承外层作用域的 `this`，无法被改变
