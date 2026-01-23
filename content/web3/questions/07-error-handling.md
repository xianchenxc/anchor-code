---
id: web3-error-handling
category: Web3
subcategory: 面试题
type: practice
questionType: qa
question: 在 DApp 前端中，如何处理常见的错误情况？如何给用户友好的错误提示？
---

**常见错误类型：**

1. **用户操作错误**
   - 用户拒绝交易（User Rejected）
   - 余额不足（Insufficient Balance）
   - 批准额度不足（Insufficient Allowance）

2. **网络错误**
   - RPC 连接失败
   - 网络超时
   - 网络切换失败

3. **交易错误**
   - Gas 不足（Out of Gas）
   - 交易回滚（Transaction Reverted）
   - 非预期的价格变化（Slippage）

4. **合约错误**
   - 函数调用失败
   - 权限不足
   - 参数错误

**错误处理策略：**

1. **错误分类和映射**
   ```javascript
   const errorMessages = {
     'user rejected': '用户取消了交易',
     'insufficient funds': '余额不足',
     'execution reverted': '交易执行失败',
     'network error': '网络连接失败'
   }
   ```

2. **用户友好的提示**
   - 将技术错误码转换为易懂的中文
   - 提供解决方案建议
   - 使用图标和颜色区分错误严重程度

3. **错误恢复**
   - 自动重试（网络错误）
   - 提供重试按钮
   - 保存失败交易供后续处理

4. **错误日志**
   - 记录详细错误信息用于调试
   - 不向用户显示技术细节
   - 使用错误追踪服务（如 Sentry）

5. **预防性检查**
   - 交易前检查余额和批准
   - 验证输入参数
   - 预估 gas 费用
   - 检查网络连接状态

**最佳实践：**
- 使用 try-catch 包裹所有异步操作
- 提供清晰的错误边界
- 记录错误但不暴露敏感信息
- 提供客服支持渠道
