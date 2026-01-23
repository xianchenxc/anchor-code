---
id: js-q13
category: JavaScript
subcategory: 面试题
type: practice
questionType: qa
question: 解释 JavaScript 中 this 的绑定规则
---

`this` 的绑定规则（优先级从低到高）：

1. **默认绑定**：独立函数调用，非严格模式下 `this` 指向全局对象，严格模式下为 `undefined`
2. **隐式绑定**：通过对象调用方法，`this` 指向调用该方法的对象
3. **显式绑定**：通过 `call`、`apply`、`bind` 指定 `this`
4. **new 绑定**：使用 `new` 调用构造函数，`this` 指向新创建的对象
5. **箭头函数**：`this` 继承外层作用域的 `this`，无法被改变，优先级最高

特殊情况：
- 回调函数中的 `this` 可能丢失，需要使用箭头函数或 `bind`
- 严格模式下，默认绑定的 `this` 为 `undefined`
