---
id: js-weakmap-weakset
category: JavaScript
subcategory: 高级特性
type: knowledge
title: WeakMap 和 WeakSet
---

`WeakMap` 和 `WeakSet` 是弱引用集合：
- **WeakMap**：键必须是对象，键是弱引用，不会阻止垃圾回收
- **WeakSet**：值必须是对象，值是弱引用，不会阻止垃圾回收

特点：
- 不可迭代（没有 `keys()`、`values()`、`entries()` 方法）
- 没有 `size` 属性
- 键/值被垃圾回收后，对应的条目会自动删除

应用场景：存储对象的私有数据、缓存计算结果、DOM 节点关联数据。
