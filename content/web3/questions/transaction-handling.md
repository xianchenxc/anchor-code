---
id: web3-transaction-handling
category: Web3
subcategory: 面试题
type: practice
questionType: qa
question: 在 DApp 前端中，如何处理交易状态（pending、success、failed）？如何优化用户体验？
---

**交易状态处理：**

1. **Pending（待确认）**
   - 显示交易哈希，提供区块浏览器链接
   - 显示加载动画和预计等待时间
   - 可以取消交易（如果支持）

2. **Success（成功）**
   - 显示成功提示和交易确认数
   - 更新 UI 状态（余额、持仓等）
   - 提供交易详情链接

3. **Failed（失败）**
   - 显示错误原因（gas 不足、用户拒绝、交易回滚等）
   - 提供重试或修改参数的选项
   - 记录错误日志用于调试

**优化用户体验：**
- 使用 toast 通知实时反馈
- 预估 gas 费用并提示用户
- 支持交易加速（提高 gas price）
- 提供交易历史记录
- 处理网络拥堵时的超时情况
- 使用乐观更新（Optimistic Update）提升响应速度
