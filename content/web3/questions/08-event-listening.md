---
id: web3-event-listening
category: Web3
subcategory: 面试题
type: practice
questionType: qa
question: 在 DApp 前端中，如何监听区块链事件？有哪些实现方式？
---

**事件监听方式：**

1. **合约事件监听**
   ```javascript
   // 监听特定事件
   contract.on('Transfer', (from, to, amount, event) => {
     console.log('Transfer:', { from, to, amount })
   })
   
   // 监听多个事件
   contract.on('*', (event) => {
     console.log('Event:', event.eventName)
   })
   ```

2. **历史事件查询**
   - 使用 `getPastEvents` 查询历史事件
   - 用于初始化 UI 状态
   - 支持过滤和分页

3. **区块监听**
   - 监听新区块产生
   - 在新区块中查询相关状态
   - 用于实时更新余额、价格等

4. **交易状态监听**
   - 监听交易确认
   - 监听交易失败
   - 更新 UI 状态

**实现要点：**

1. **事件去重**
   - 使用事件哈希或区块号+日志索引去重
   - 避免重复处理同一事件

2. **错误处理**
   - Provider 断开重连
   - 网络错误重试
   - 事件监听失败处理

3. **性能优化**
   - 使用 WebSocket Provider 替代 HTTP
   - 批量查询多个事件
   - 使用索引服务（如 The Graph）减少链上查询

4. **用户体验**
   - 实时更新 UI（余额、交易状态）
   - 显示事件通知
   - 提供事件历史记录

**常见场景：**
- DEX：监听 Swap 事件更新交易历史
- DeFi：监听存款/取款事件更新余额
- NFT：监听 Mint/Transfer 事件更新持有列表
