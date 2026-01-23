---
id: js-debounce-throttle
category: JavaScript
subcategory: 高级特性
type: knowledge
title: 防抖和节流
---

**防抖（Debounce）**：在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时。适用于搜索框输入、窗口 resize 等场景。

**节流（Throttle）**：规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效。适用于滚动事件、鼠标移动等场景。

两者的区别：防抖是延迟执行，节流是限制执行频率。
