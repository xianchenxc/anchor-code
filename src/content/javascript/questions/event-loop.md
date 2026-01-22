---
id: js-q1
category: JavaScript
subcategory: 面试题
type: practice
questionType: qa
question: 解释 JavaScript 中的事件循环（Event Loop）机制
---

事件循环是 JavaScript 处理异步操作的机制。它包含调用栈、消息队列和微任务队列。同步代码在调用栈执行，异步回调进入消息队列，Promise.then 等进入微任务队列。微任务队列优先级高于消息队列。
