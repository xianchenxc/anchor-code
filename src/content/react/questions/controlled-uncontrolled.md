---
id: react-q5
category: React
subcategory: 面试题
type: practice
questionType: qa
question: 受控组件和非受控组件的区别
---

**受控组件**：
- 表单数据由 React 组件状态管理
- 使用 `value` 和 `onChange` 控制
- 数据流是单向的
- 推荐使用

```javascript
<input value={name} onChange={e => setName(e.target.value)} />
```

**非受控组件**：
- 表单数据由 DOM 节点管理
- 使用 `ref` 获取值
- 数据流是双向的
- 适合简单场景

```javascript
const inputRef = useRef();
<input ref={inputRef} defaultValue="初始值" />
```

选择建议：
- 大多数情况使用受控组件
- 表单验证、实时反馈使用受控组件
- 简单表单、性能敏感场景可考虑非受控组件
