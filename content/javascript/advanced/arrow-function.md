---
id: js-arrow-function
category: JavaScript
subcategory: 高级特性
type: knowledge
title: 箭头函数的特点
---

箭头函数的特点：
1. **没有自己的 `this`**：继承外层作用域的 `this`
2. **没有 `arguments` 对象**：需要使用剩余参数 `...args`
3. **不能作为构造函数**：不能使用 `new` 调用
4. **没有 `prototype` 属性**
5. **不能使用 `yield`**：不能作为生成器函数
6. **语法简洁**：适合回调函数和函数式编程
