---
category: Browser
type: knowledge
title: 事件循环（浏览器）
---

浏览器里 JavaScript 是单线程的：**同一时刻只能执行一段同步代码**。异步能力依赖宿主（浏览器）提供的 Web API 与**事件循环（Event Loop）**把回调排进队列、在适当时机交给 JS 引擎执行。

## 1. 核心组件（心智模型）

- **调用栈（Call Stack）**：当前正在执行的同步函数栈。
- **Web APIs**：`setTimeout`、`fetch`、`DOM` 事件等，由浏览器另起线程或底层处理，完成后把回调放进队列。
- **任务队列（Task Queue / Macrotask Queue）**：宏任务，如 `setTimeout` 回调、用户点击、`script` 整体执行等。
- **微任务队列（Microtask Queue）**：如 `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver` 回调。

> 规范用语里「任务」与「微任务」的划分以 HTML 标准为准；面试常说「宏任务 / 微任务」对应 task / microtask。

## 2. 一次「循环」在做什么（简化版）

1. 若调用栈为空，从**任务队列**取出一个**宏任务**执行（例如执行一段脚本、或一个 `setTimeout` 回调）。
2. 该宏任务执行完后，**清空当前轮次的所有微任务**：依次执行微任务队列直到为空；若微任务里又产生微任务，继续在同轮内执行完。
3. 必要时进行**渲染**（见下文「渲染与 rAF」）。
4. 回到步骤 1。

因此：**微任务优先级高于下一轮宏任务**；同一宏任务结束后会先把微任务跑光，再取下一个宏任务。

## 3. 常见 API 归类

### 宏任务（Task）

- `setTimeout` / `setInterval` 回调
- `I/O`、UI 事件（click、input 等）对应的任务
- `MessageChannel` / `postMessage`（常用来做「切到下一个宏任务」）

### 微任务（Microtask）

- `Promise` 的 `then` / `catch` / `finally`
- `async/await`（`await` 之后继续执行的代码相当于微任务链路）
- `queueMicrotask(fn)`
- `MutationObserver` 回调

## 4. 经典输出顺序题（理解用）

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
```

典型输出：`1` → `4` → `3` → `2`。  
原因：同步先跑完；当前宏任务（整段脚本）结束后先清空微任务（`3`），再执行下一个宏任务（`setTimeout` 的 `2`）。

## 5. 渲染与 `requestAnimationFrame`

浏览器在两次渲染之间会穿插 JS 与合成。常见理解：

- **`requestAnimationFrame`（rAF）**：在**下一次重绘之前**调用回调，适合动画与读布局前的测量（注意与具体浏览器调度细节的差异，面试以「下一帧前」为主）。
- **渲染**（样式计算、布局、绘制）通常不会每个微任务都跑；会在任务与微任务处理到一定阶段后由浏览器合并调度。

**不要**在 rAF 或滚动回调里做重计算导致丢帧；长任务会阻塞主线程，事件循环再完美也救不了。

## 6. `async/await` 与事件循环

`async` 函数本身是同步开始执行的，遇到 `await` 会「暂停」当前 async 函数，把**后续部分**作为微任务（或挂到 Promise 链上）在之后执行。因此：

- `await` 后面的代码，往往在**当前调用栈清空后的微任务阶段**执行（具体以引擎实现与规范为准，面试按「微任务延后」理解即可）。

## 7. 与 Node.js 事件循环的差异（一句话）

浏览器事件循环要兼顾 **UI 渲染**；Node 侧没有 DOM，阶段划分（如 `timers`、`poll`、`check`）不同。**不要**把 Node 的口诀原封不动套到浏览器上。

## 8. 工程上的启示

- **长任务拆分**：用 `setTimeout(0)`、`queueMicrotask`、`scheduler.postTask`（若可用）等把大计算切片，避免阻塞点击与滚动。
- **微任务不要写死循环**：微任务若无限自递归，会饿死宏任务与渲染，页面卡死。
- **优先保证用户体验**：先响应交互，再批量更新 DOM；复杂列表用虚拟滚动、Web Worker 卸载计算。

## 高频面试追问

1. 宏任务与微任务谁先执行？同一轮里执行顺序是怎样的？
2. 为什么 `setTimeout(fn, 0)` 不一定「立刻」执行？
3. `Promise.then` 和 `setTimeout` 谁先输出？变体：`await` 与 `Promise.then` 混写呢？
4. 事件循环和渲染的关系是什么？rAF 适合做什么？
5. 为什么说「JS 单线程」但还能异步请求、定时器？
