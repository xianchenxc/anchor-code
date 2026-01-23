---
id: react-q6
category: React
subcategory: 面试题
type: practice
questionType: qa
question: HOC 和 Render Props 的区别？现在更推荐哪种方式？
---

**HOC（高阶组件）**：
- 接受组件作为参数，返回新组件
- 用于逻辑复用
- 可能产生组件嵌套过深的问题

```javascript
const withAuth = (Component) => {
  return (props) => {
    if (!isAuthenticated) return <Login />;
    return <Component {...props} />;
  };
};
```

**Render Props**：
- 通过 props 传递渲染函数
- 更灵活，但代码可能较复杂

```javascript
<DataProvider render={data => <Component data={data} />} />
```

**现在推荐**：
- **自定义 Hooks**：React 16.8+ 推荐方式
- 逻辑复用更简单
- 避免组件嵌套
- 更好的类型推断（TypeScript）

```javascript
const useAuth = () => {
  // 逻辑
  return { isAuthenticated, user };
};
```
