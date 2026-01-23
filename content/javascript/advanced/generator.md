---
id: js-generator
category: JavaScript
subcategory: 高级特性
type: knowledge
title: 生成器函数
---

生成器函数使用 `function*` 声明，通过 `yield` 暂停执行并返回值。调用生成器函数返回一个迭代器对象，可以通过 `next()` 方法逐步执行。

特点：
- 可以暂停和恢复执行
- 通过 `yield` 传递值
- 支持异步编程（配合 Promise 实现 async/await）
- 可以用于实现迭代器协议
