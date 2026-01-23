---
id: js-scope
category: JavaScript
subcategory: 基础语法
type: knowledge
title: 作用域和作用域链
---

作用域决定了变量和函数的可访问性：
1. **全局作用域**：在函数外部定义的变量
2. **函数作用域**：在函数内部定义的变量（`var`）
3. **块级作用域**：在 `{}` 内定义的变量（`let`、`const`）

作用域链：当访问变量时，JavaScript 会从当前作用域开始查找，如果找不到就向上查找，直到全局作用域。这形成了作用域链。
