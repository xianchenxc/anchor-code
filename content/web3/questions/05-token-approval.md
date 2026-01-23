---
id: web3-token-approval
category: Web3
subcategory: 面试题
type: practice
questionType: qa
question: 在 DEX 中，为什么需要 token approval？如何优化 approval 的用户体验？
---

**为什么需要 Approval：**
ERC-20 代币需要用户授权（approve）智能合约才能代表用户转移代币。这是 ERC-20 标准的安全机制，防止未授权的代币转移。

**用户体验优化：**

1. **一次性批准（Infinite Approval）**
   - 批准最大数量（`2^256 - 1`）而不是每次交易都批准
   - 减少用户交互次数
   - 注意：需要向用户说明风险

2. **按需批准（Incremental Approval）**
   - 只批准当前交易需要的数量
   - 更安全，但需要频繁批准
   - 适合大额交易或安全敏感场景

3. **批准状态检测**
   - 交易前检查是否已有足够批准额度
   - 避免不必要的批准交易
   - 显示当前批准额度和剩余可用额度

4. **批量操作**
   - 对于需要多种代币的场景，提供批量批准
   - 使用 multicall 合约减少交易次数

5. **UI 优化**
   - 清晰说明为什么需要批准
   - 显示批准费用（gas）
   - 提供"批准并交易"的合并操作
   - 记住用户的批准偏好设置
