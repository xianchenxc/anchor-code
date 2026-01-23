---
id: js-q2
category: JavaScript
subcategory: 面试题
type: practice
questionType: qa
question: 什么是原型链？如何实现继承？
---

原型链是 JavaScript 实现继承的机制。每个对象都有一个指向其原型对象的内部链接。当访问对象属性时，如果对象本身没有，会沿着原型链向上查找。可以通过 Object.create()、构造函数、class 语法实现继承。
