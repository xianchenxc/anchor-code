---
id: web3-liquidity-pools
category: Web3
subcategory: 面试题
type: practice
questionType: qa
question: 在 DeFi DApp 前端中，如何显示和管理流动性池（Liquidity Pool）信息？
---

**流动性池信息展示：**

1. **池子基础信息**
   - 交易对（Token Pair）
   - 总流动性（TVL - Total Value Locked）
   - 池子份额（LP Token 数量）
   - 当前价格和价格变化

2. **用户持仓信息**
   - 用户提供的流动性数量
   - 用户份额占比
   - 当前价值（USD）
   - 未领取的费用收益

3. **实时数据更新**
   - 监听池子状态变化事件
   - 定期刷新余额和价格
   - 使用 WebSocket 实现实时更新

**前端实现要点：**

1. **添加流动性（Add Liquidity）**
   - 计算添加比例（50/50 或其他比例）
   - 显示预估 LP Token 数量
   - 处理首次创建池子的情况
   - 显示价格范围（如果使用集中流动性）

2. **移除流动性（Remove Liquidity）**
   - 显示可移除的 LP Token 数量
   - 计算将获得的代币数量
   - 显示价格影响
   - 支持部分移除

3. **费用显示**
   - 显示累计费用
   - 显示费用占比
   - 提供费用提取功能

4. **价格图表**
   - 显示池子价格历史
   - 显示流动性分布
   - 显示交易量统计

5. **风险提示**
   - 无常损失（Impermanent Loss）说明
   - 流动性风险提示
   - 价格波动影响

**UI/UX 优化：**
- 清晰的数值显示（大数字格式化）
- 使用图表可视化数据
- 提供详细的数据面板
- 移动端适配
