---
id: js-type-conversion
category: JavaScript
subcategory: 基础语法
type: knowledge
title: 类型转换
---

JavaScript 的类型转换：
1. **隐式转换**：`==` 比较、`+` 运算、`if` 条件判断等
2. **显式转换**：`Number()`、`String()`、`Boolean()`、`parseInt()`、`parseFloat()`

转换规则：
- 对象转原始值：先调用 `valueOf()`，再调用 `toString()`
- `null` 和 `undefined`：`null == undefined` 为 `true`，但与其他值比较都为 `false`
- 字符串和数字：字符串转数字，数字转字符串
- 布尔值：`false`、`0`、`""`、`null`、`undefined`、`NaN` 转为 `false`
