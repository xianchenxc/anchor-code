---
id: js-object
category: JavaScript
subcategory: 基础语法
type: knowledge
title: 对象和属性描述符
---

对象属性描述符：
- **value**：属性的值
- **writable**：是否可写
- **enumerable**：是否可枚举（`for...in`、`Object.keys()`）
- **configurable**：是否可配置（删除、修改描述符）

方法：
- `Object.defineProperty()`：定义单个属性
- `Object.defineProperties()`：定义多个属性
- `Object.getOwnPropertyDescriptor()`：获取属性描述符
- `Object.freeze()`：冻结对象（不可修改、删除、添加）
- `Object.seal()`：密封对象（不可添加、删除，但可修改）
