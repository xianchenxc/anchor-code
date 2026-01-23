---
id: react-q10
category: React
subcategory: 面试题
type: practice
questionType: qa
question: 如何优化 Context 的性能问题？
---

Context 性能优化方法：

1. **拆分 Context**：
   - 将频繁变化的数据和稳定数据分开
   - 避免所有数据放在一个 Context 中

2. **使用 useMemo 优化 value**：
```javascript
const value = useMemo(() => ({
  user,
  theme
}), [user, theme]);
```

3. **使用多个 Provider**：
   - 不同层级使用不同的 Context
   - 减少不必要的重新渲染

4. **使用选择器模式**：
   - 自定义 Hook 只订阅需要的部分
   - 使用 `use-context-selector` 库

5. **考虑状态管理库**：
   - 对于复杂状态，使用 Redux、Zustand 等
   - 它们有更好的性能优化机制
