---
id: js-event-delegation
category: JavaScript
subcategory: 基础语法
type: knowledge
title: 事件委托
---

事件委托（事件代理）是将事件监听器添加到父元素上，利用事件冒泡机制处理子元素的事件。

优点：
1. 减少内存占用（只需一个事件监听器）
2. 动态添加的子元素自动拥有事件处理
3. 代码更简洁

原理：事件冒泡，子元素的事件会向上传播到父元素。
