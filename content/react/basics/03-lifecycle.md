---
id: react-lifecycle
category: React
subcategory: 基础概念
type: knowledge
title: 组件生命周期
---

类组件生命周期（三个阶段）：

**挂载阶段**：
- `constructor`：初始化状态和绑定方法
- `getDerivedStateFromProps`：根据 props 更新 state
- `render`：渲染组件
- `componentDidMount`：组件挂载后，适合发起请求

**更新阶段**：
- `getDerivedStateFromProps`：props 或 state 变化时
- `shouldComponentUpdate`：决定是否重新渲染
- `render`：重新渲染
- `getSnapshotBeforeUpdate`：获取更新前的快照
- `componentDidUpdate`：更新完成后

**卸载阶段**：
- `componentWillUnmount`：清理工作，取消订阅、定时器等

函数组件使用 `useEffect` Hook 模拟生命周期。
