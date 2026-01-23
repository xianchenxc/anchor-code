---
id: react-custom-hooks
category: React
subcategory: Hooks
type: knowledge
title: 自定义 Hooks
---

自定义 Hook 是一个以 "use" 开头的函数，可以在其中调用其他 Hook。

规则：
1. 必须以 "use" 开头
2. 可以在多个组件中复用逻辑
3. 每次调用都有独立的 state

常见自定义 Hook：
- `useCounter`：计数器逻辑
- `useFetch`：数据获取逻辑
- `useLocalStorage`：本地存储逻辑
- `useDebounce`：防抖逻辑
- `usePrevious`：获取上一轮的值

优势：逻辑复用、代码组织、测试友好。
