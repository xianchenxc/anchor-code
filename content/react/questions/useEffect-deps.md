---
id: react-q3
category: React
subcategory: 面试题
type: practice
questionType: qa
question: useEffect 的依赖数组有什么作用？如何正确使用？
---

依赖数组的作用：
- 控制 `useEffect` 的执行时机
- 空数组 `[]`：只在组件挂载和卸载时执行
- 有依赖：依赖变化时执行
- 无依赖数组：每次渲染都执行

正确使用：
1. **包含所有外部依赖**：函数、变量、props、state
2. **使用 ESLint 规则**：`eslint-plugin-react-hooks` 自动检查
3. **函数依赖**：使用 `useCallback` 缓存函数
4. **对象/数组依赖**：使用 `useMemo` 或提取原始值

常见错误：
- 遗漏依赖导致闭包问题
- 依赖过多导致频繁执行
- 依赖函数但未使用 `useCallback`
