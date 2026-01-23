---
id: web3-gas-optimization-frontend
category: Web3
subcategory: 面试题
type: practice
questionType: qa
question: 在前端层面，如何优化 DApp 的 gas 使用？有哪些优化策略？
---

**前端 Gas 优化策略：**

1. **交易批处理（Batching）**
   - 使用 multicall 合约合并多个调用
   - 减少交易次数，节省 gas
   - 例如：同时批准和交易，或同时执行多个操作

2. **Gas 价格优化**
   - 实时获取当前网络 gas price
   - 提供 gas price 选择（慢/标准/快）
   - 使用 EIP-1559 的 maxFeePerGas 和 maxPriorityFeePerGas
   - 根据网络拥堵情况动态调整

3. **交易时机优化**
   - 在 gas price 较低时提示用户
   - 避免在网络拥堵时执行非紧急交易
   - 提供"稍后执行"功能

4. **减少链上操作**
   - 将计算移到前端或后端
   - 使用签名消息（Sign Message）替代链上验证
   - 批量查询使用 multicall

5. **智能合约交互优化**
   - 选择 gas 效率更高的合约方法
   - 避免不必要的链上读取
   - 使用事件而非存储查询历史数据

6. **用户体验优化**
   - 显示预估 gas 费用
   - 提供 gas 费用对比（不同操作）
   - 允许用户设置 gas limit
   - 显示 gas 节省提示

**实现示例：**
```javascript
// 使用 multicall 批量查询
const calls = [
  contract.balanceOf(userAddress),
  contract.allowance(userAddress, spender),
  contract.totalSupply()
]
const results = await multicall(calls)

// 估算 gas 并提示用户
const gasEstimate = await contract.estimateGas.swap(...)
const gasPrice = await provider.getGasPrice()
const gasCost = gasEstimate.mul(gasPrice)
```
