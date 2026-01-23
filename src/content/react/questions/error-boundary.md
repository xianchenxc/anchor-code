---
id: react-q11
category: React
subcategory: 面试题
type: practice
questionType: qa
question: 什么是错误边界（Error Boundary）？如何使用？
---

错误边界是 React 组件，可以捕获子组件树中的 JavaScript 错误，记录错误并展示降级 UI。

特点：
- 只能捕获子组件的错误，不能捕获自身的错误
- 不能捕获事件处理、异步代码、服务端渲染的错误

使用方式：
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    // 记录错误
    console.error(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>出错了</h1>;
    }
    return this.props.children;
  }
}
```

函数组件可以使用 `react-error-boundary` 库。
