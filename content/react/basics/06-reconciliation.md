---
id: react-reconciliation
category: React
subcategory: 基础概念
type: knowledge
title: 协调（Reconciliation）
---

协调是 React 更新 UI 的过程：

1. **Diff 算法**：比较新旧虚拟 DOM 树，找出差异
2. **更新策略**：
   - 不同类型的元素：直接替换整个子树
   - 相同类型的元素：更新改变的属性
   - 列表元素：使用 key 优化比较

3. **Fiber 架构**（React 16+）：
   - 可中断的渲染过程
   - 优先级调度
   - 增量渲染

优化建议：
- 使用 key 帮助 React 识别元素
- 避免在 render 中创建新对象/函数
- 使用 `React.memo`、`useMemo`、`useCallback` 优化
