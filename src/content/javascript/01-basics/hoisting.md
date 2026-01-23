---
id: js-hoisting
category: JavaScript
subcategory: 基础语法
type: knowledge
title: 变量提升和函数提升
---

**变量提升**：`var` 声明的变量会被提升到作用域顶部，但赋值不会提升（值为 `undefined`）。`let` 和 `const` 存在暂时性死区（TDZ），在声明前访问会报错。

**函数提升**：函数声明会被完全提升，可以在声明前调用。函数表达式不会被提升。

提升的本质是 JavaScript 引擎在代码执行前会先进行编译，将声明提升到作用域顶部。
